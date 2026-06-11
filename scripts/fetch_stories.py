#!/usr/bin/env python3
"""
NurEine — Story Fetcher

Fetches RSS feeds, analyzes articles with DeepSeek Chat,
generates images with FLUX.1 [pro] via fal.ai,
uploads to Supabase Storage, and inserts stories into Supabase.

Usage:
    SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... DEEPSEEK_API_KEY=... FAL_KEY=... python scripts/fetch_stories.py

Environment variables:
    SUPABASE_URL          — Supabase project URL (e.g. https://abc.supabase.co)
    SUPABASE_SERVICE_KEY  — Supabase service_role key (full access)
    DEEPSEEK_API_KEY      — DeepSeek API key
    FAL_KEY               — fal.ai API key (for FLUX.1 image generation)
"""

from __future__ import annotations

import json
import logging
import math
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from io import BytesIO
from typing import Any

import re

import feedparser
import requests
import trafilatura
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("fetch_stories")

# ---------------------------------------------------------------------------
# Load .env (optional — CI/production should set real env vars)
# ---------------------------------------------------------------------------
load_dotenv()

# Try to import image quality review (graceful fallback if not available)
try:
    from image_quality import review_and_retry as image_quality_review
    from image_quality import review_prompt_and_retry as prompt_quality_check
    from image_quality import _regenerate_prompt_via_deepseek
    HAS_QUALITY_REVIEW = True
except ImportError:
    HAS_QUALITY_REVIEW = False
    def image_quality_review(*args, **kwargs):
        return args[0], 10.0, 0, "Review not available"
    def prompt_quality_check(image_prompt, title, category, max_retries=2):
        return image_prompt, True, ""
    def _regenerate_prompt_via_deepseek(bad_prompt, reject_reason, fix_instruction):
        return None

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
FAL_KEY = os.environ.get("FAL_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"

# fal.ai FLUX.1 [pro]
FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"  # 1024x768
FAL_NUM_IMAGES = 1
FAL_POLL_INTERVAL = 3  # seconds between status polls (pro is slower)
FAL_POLL_TIMEOUT = 180  # max seconds to wait for generation

# ElevenLabs TTS (Vorlesen-Feature)
# Free-Tier: ~10k chars/month. Danach: gpt-4o-mini-tts.
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "LruHrtVF6PSyGItz4mXh")  # George — ruhig, männlich, deutsch
ELEVENLABS_MODEL = "eleven_multilingual_v2"
ELEVENLABS_TTS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

# Supabase Storage buckets
STORAGE_BUCKET = "story_images"
AUDIO_STORAGE_BUCKET = "story_audio"

# Audio feature: nur Top-2 Stories pro Run vertonen
MAX_AUDIO_STORIES = 2

# Source configuration: per-source limits & priority
# Format: source_name -> {max_per_run, priority}
# Higher priority = processed first. Lower max_per_run = fewer API calls wasted on low-conversion sources.
# Priority 1: High conversion rate (Good News Network, Positive.News)
# Priority 2: Good content but lower conversion (Mongabay, Golem Science)
# Priority 3: Low conversion — hard limit to avoid API waste (Berliner Zeitung, Utopia.de)
# Priority 4: Broken/test feeds — minimal sampling
#
# The sum of max_per_run should ideally fit within 100-120 total, but the global
# MAX_ARTICLES_PER_RUN acts as a safety net.
SOURCE_CONFIG: dict[str, dict[str, int]] = {
    # Priority 1 — High-conversion Good-News feeds (~88-90% accepted)
    "Good News Network":    {"max_per_run": 25, "priority": 1},
    "Positive.News":        {"max_per_run": 10, "priority": 1},
    # Priority 2 — Good content, moderate conversion
    "Mongabay":             {"max_per_run": 15, "priority": 2},
    "Golem Science":        {"max_per_run": 15, "priority": 2},
    # Priority 3 — Low conversion: strict limit to avoid wasted API calls
    "Berliner Zeitung":     {"max_per_run": 15, "priority": 3},
    "Utopia.de":            {"max_per_run": 5,  "priority": 3},
    # Priority 4 — Broken or empty feeds, sampled rarely
    "Nature News":          {"max_per_run": 3,  "priority": 4},
    "WHO News":             {"max_per_run": 3,  "priority": 4},
    # ── 2026-06-07: neue Quellen. Positive-News-Feeds höher, Science moderat.
    # Limits bewusst eng, damit 21 Quellen zusammen nicht die Laufzeit sprengen.
    "Reasons to be Cheerful": {"max_per_run": 10, "priority": 1},
    "The Optimist Daily":     {"max_per_run": 8,  "priority": 1},
    "Anthropocene Magazine":  {"max_per_run": 6,  "priority": 2},
    "Yale Environment 360":   {"max_per_run": 6,  "priority": 2},
    "Grist":                  {"max_per_run": 6,  "priority": 2},
    "Spektrum Wissenschaft":  {"max_per_run": 6,  "priority": 2},
    "Perspective Daily":      {"max_per_run": 5,  "priority": 2},
    "Our World in Data":      {"max_per_run": 4,  "priority": 2},
    "ScienceDaily":           {"max_per_run": 5,  "priority": 3},
    "Phys.org":               {"max_per_run": 5,  "priority": 3},
    "MIT Technology Review":  {"max_per_run": 5,  "priority": 3},
    "Futura Sciences":        {"max_per_run": 5,  "priority": 3},
    "Tagesschau Wissen":      {"max_per_run": 5,  "priority": 3},
}
# max_per_run 6→10: gründlicher beobachten (auch kleinere/tiefere Meldungen je Quelle
# werden bewertet, nicht nur die Top-Schlagzeilen). Reporter-Ansatz: jede Meldung neutral
# scoren statt nur den Lärm oben abzugreifen.
DEFAULT_SOURCE_CONFIG = {"max_per_run": 10, "priority": 3}

# ---------------------------------------------------------------------------
# Category safety — the DB CHECK constraint only permits these seven values.
# DeepSeek occasionally emits a near-miss ("umwelt", "gesellschaft", "technik",
# English labels, etc.). An out-of-set value made Postgres reject the whole
# INSERT with a 400 — historically wiping ~entire fetch runs (88 found / 0
# inserted). We normalise to the closest allowed category instead of failing.
# ---------------------------------------------------------------------------
ALLOWED_CATEGORIES = {
    "klima", "gesundheit", "wissenschaft", "gemeinschaft", "tiere", "kultur", "innovation",
}

# Map common DeepSeek near-misses onto an allowed category.
CATEGORY_ALIASES: dict[str, str] = {
    "umwelt": "klima",
    "natur": "klima",
    "energie": "klima",
    "nachhaltigkeit": "klima",
    "environment": "klima",
    "climate": "klima",
    "gesellschaft": "gemeinschaft",
    "soziales": "gemeinschaft",
    "sozial": "gemeinschaft",
    "bildung": "gemeinschaft",
    "community": "gemeinschaft",
    "politik": "gemeinschaft",
    "menschen": "gemeinschaft",
    "technik": "innovation",
    "technologie": "innovation",
    "technology": "innovation",
    "tech": "innovation",
    "wirtschaft": "innovation",
    "medizin": "gesundheit",
    "health": "gesundheit",
    "science": "wissenschaft",
    "forschung": "wissenschaft",
    "tier": "tiere",
    "animals": "tiere",
    "natur-tiere": "tiere",
    "kunst": "kultur",
    "culture": "kultur",
}

CATEGORY_FALLBACK = "gemeinschaft"


def _safe_int(value: Any, *, lo: int | None = None, hi: int | None = None) -> int | None:
    """Coerce a value to int, optionally clamped to [lo, hi].

    DeepSeek occasionally returns numbers that overflow Postgres column types —
    e.g. impact_reach='2200000000' (2.2 B) exceeds int4 (2147483647) and 400'd
    the whole insert. We coerce defensively (impact_reach is now BIGINT, but a
    stray 1e18 would still break it; impact_durability/evidence stay 0..100).
    Returns None if the value is missing or unparseable.
    """
    if value is None:
        return None
    try:
        n = int(float(value))  # tolerate "85", 85.0, "1.2e9"
    except (ValueError, TypeError):
        return None
    if lo is not None:
        n = max(lo, n)
    if hi is not None:
        n = min(hi, n)
    return n


# Postgres bigint max — hard ceiling for impact_reach regardless of model output.
_BIGINT_MAX = 9_223_372_036_854_775_807


def _safe_kid_age(value: Any) -> int | None:
    """Family feature: accept a plausible min-age (4..18) or None. Anything else → None."""
    n = _safe_int(value)
    if n is None or n < 4 or n > 18:
        return None
    return n


def _safe_text(value: Any, max_len: int) -> str | None:
    """Trimmed string up to max_len, or None for empty/non-string/'null'."""
    if not isinstance(value, str):
        return None
    s = value.strip()
    if not s or s.lower() == "null":
        return None
    return s[:max_len]


_ALLOWED_EMOTIONS = {"relief", "wonder", "hope", "pride", "warmth"}


def _safe_emotion(value: Any) -> str | None:
    """Editorial pipeline: accept one of the five resonance emotions, else None."""
    if not isinstance(value, str):
        return None
    e = value.strip().lower()
    return e if e in _ALLOWED_EMOTIONS else None


def _safe_bool(value: Any) -> bool:
    """Coerce a model truthy into a strict bool (DB columns are NOT NULL DEFAULT false)."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "ja"}
    return bool(value)


def _safe_slides(value: Any) -> dict[str, str] | None:
    """Carousel texts {hook, aufloesung, stille} — only if all three present + non-empty."""
    if not isinstance(value, dict):
        return None
    hook = _safe_text(value.get("hook"), 90)
    aufloesung = _safe_text(value.get("aufloesung"), 320)
    stille = _safe_text(value.get("stille"), 120)
    if not (hook and aufloesung and stille):
        return None
    return {"hook": hook, "aufloesung": aufloesung, "stille": stille}


def normalize_category(raw: Any) -> str:
    """Coerce any DeepSeek category into an allowed DB value.

    1. exact allowed -> keep
    2. known alias    -> mapped allowed value
    3. otherwise      -> CATEGORY_FALLBACK ('gemeinschaft')

    Guarantees the value satisfies nureine_stories_category_check, so a stray
    category can never again 400 the insert.
    """
    cat = (str(raw) if raw is not None else "").strip().lower()
    if cat in ALLOWED_CATEGORIES:
        return cat
    if cat in CATEGORY_ALIASES:
        mapped = CATEGORY_ALIASES[cat]
        log.info("  Category '%s' -> '%s' (alias)", cat, mapped)
        return mapped
    log.warning("  Unknown category '%s' -> '%s' (fallback)", cat or "(empty)", CATEGORY_FALLBACK)
    return CATEGORY_FALLBACK

# Safety limit to avoid runaway loops (sum of max_per_run = 91, well within this)
MAX_ARTICLES_PER_RUN = 120
# Pause between API calls (seconds) to stay within rate limits
API_DELAY_SECONDS = 1.5
# Extra delay after image generation
IMAGE_API_DELAY_SECONDS = 1.0

# ---------------------------------------------------------------------------
# Local pre-filter: Skip articles that will clearly fail DeepSeek analysis.
# This saves API calls (~$0.001 each) and speeds up the pipeline.
# ---------------------------------------------------------------------------

# German stop-words for low-signal headlines
# ── Pre-Filter: NUR krasse, eindeutige Negatives. Bewusst schlank.
# Frühere Version war zu aggressiv (tot\b matcht "total", \bdies?\b matcht "die",
# desc wurde mitgeprüft) → 50+ legitime Stories pro Run starben vor der KI.
# Jetzt: nur Wörter die FAST IMMER auf eine schlechte Nachricht zeigen, nur im
# TITEL geprüft (nicht Description), saubere Wortgrenzen. Alles andere → DeepSeek
# entscheidet (kostet ~0,001€/Call, aber wir wollen Content-Strom statt Hunger).
_GERMAN_NEGATIVE_PATTERNS = [
    r"\bgetötet\b", r"\bgestorben\b", r"\btödlich(e[rn]?)?\b", r"\bermordet\b",
    r"\bkatastrophe\b", r"\banschlag\b", r"\battentat\b", r"\bamoklauf\b",
    r"\bmassaker\b", r"\bterror", r"\bgefallene[rn]?\b",
]

# Headline patterns that indicate "local fluff" / sports / history
_GERMAN_FLUFF_PATTERNS = [
    r"\bvor \d+ jahren\b", r"\bjahrestag\b",
    r"\bspieltag\b", r"\bbundesliga\b",
]

# English negative patterns for international sources (TITLE only, strict).
_ENGLISH_NEGATIVE_PATTERNS = [
    r"\bkilled\b", r"\bmurder", r"\bmassacre\b", r"\bterror(ism|ist)?\b",
    r"\bgenocide\b", r"\bbombing\b", r"\bshooting\b", r"\bfatalit",
]

# English fluff/sports/history patterns
_ENGLISH_FLUFF_PATTERNS = [
    r"\byears? ago\b", r"\banniversary\b",
    r"\b(premier league|nfl|nba)\b",
]

# Ratgeber/Lifestyle/How-To — NurEine ist eine News-Plattform, kein Service-Blog.
# Eng gefasst auf eindeutige Ratgeber-Titel (Listen, How-To, Hausmittel).
_GERMAN_RATGEBER_PATTERNS = [
    r"^\d+\s+(tipps|tricks|gründe|dinge|wege|ideen|rezepte|übungen)\b",  # "7 Tipps …"
    r"\b\d+\s+(heimische|pflanzen|sträucher|kräuter|lebensmittel)\b.*\bfür\b",  # "10 Sträucher für …"
    r"\bso\s+(gelingt|klappt|geht|machst du|pflegst du|sparst du)\b",  # "So gelingt …"
    r"\b(ratgeber|anleitung|checkliste|hausmittel gegen|das hilft (wirklich )?gegen)\b",
    r"\b(tipps|tricks)\s+(für|gegen|zum)\b",  # "Tipps für besseren Schlaf"
]

# Heuristic: titles that strongly suggest a Good News article
# These bypass the negative/fluff check
_STRONG_POSITIVE_SIGNALS = [
    r"\bbreakthrough\b", r"\bfirst\b.*\bever\b", r"\bdiscover",
    r"\bprotect", r"\brestore", r"\brenewable", r"\binnovation",
    r"\bwins?\b", r"\bwins?\b", r"\baward", r"\brevolution",
    r"\bdurchbruch\b", r"\bentdeckt\b", r"\binnovation\b",
    r"\bgewinnt\b", r"\bausgezeichnet\b", r"\bpreis\b",
    r"\bschutz\b", r"\bwiederherstellung\b", r"\bfortschritt\b",
]


def _prefilter_entry(entry: feedparser.FeedParserDict, source_name: str) -> tuple[bool, str]:
    """Quick local pre-filter to skip articles before making an API call.

    Returns (should_skip, reason).
    This is intentionally conservative — it only rejects articles with
    STRONG negative signals. Everything borderline passes through to DeepSeek.
    """
    title = (entry.get("title", "") or "").lower()

    # NUR der Titel wird geprüft (Description triggerte zu viele false-positives).
    # 0. RATGEBER/LIFESTYLE raus (wir sind News, kein Service-Blog). Läuft VOR den
    #    Positiv-Signalen, weil "10 Sträucher … für den Garten" sonst durchrutscht.
    #    Sehr eng gefasst auf eindeutige How-To/Listen-Titel, damit echte News
    #    ("10 Jahre Fortschritt bei …") nicht fälschlich fliegen.
    for pattern in _GERMAN_RATGEBER_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return True, f"ratgeber:{pattern}"

    # 1. Starke Positiv-Signale → immer durchlassen.
    for pattern in _STRONG_POSITIVE_SIGNALS:
        if re.search(pattern, title, re.IGNORECASE):
            return False, ""

    # 2. Kaputte Feed-Einträge (Nature/WHO liefern manchmal leere Titel).
    if not title or len(title) < 5:
        return True, "broken_entry"

    # 3-6. Krasse Negatives/Fluff NUR im Titel. Alles Grenzwertige → DeepSeek.
    for pattern in _GERMAN_NEGATIVE_PATTERNS + _ENGLISH_NEGATIVE_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return True, f"local_negative:{pattern}"
    for pattern in _GERMAN_FLUFF_PATTERNS + _ENGLISH_FLUFF_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return True, f"local_fluff:{pattern}"

    return False, ""

MISSING_ENVVARS: list[str] = []
if not SUPABASE_URL:
    MISSING_ENVVARS.append("SUPABASE_URL")
if not SUPABASE_SERVICE_KEY:
    MISSING_ENVVARS.append("SUPABASE_SERVICE_KEY")
if not DEEPSEEK_API_KEY:
    MISSING_ENVVARS.append("DEEPSEEK_API_KEY")
# FAL_KEY is optional — if missing, image generation is skipped
IMAGE_GENERATION_ENABLED = bool(FAL_KEY)

if MISSING_ENVVARS:
    log.error(
        "Missing required environment variable(s): %s",
        ", ".join(MISSING_ENVVARS),
    )
    sys.exit(1)

if not IMAGE_GENERATION_ENABLED:
    log.warning("FAL_KEY not set — image generation will be skipped.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def supabase_headers() -> dict[str, str]:
    """Return headers for Supabase REST API calls (service-role auth)."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,  # type: ignore[arg-type]
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def supabase_storage_headers(content_type: str = "image/png") -> dict[str, str]:
    """Return headers for Supabase Storage uploads."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,  # type: ignore[arg-type]
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }


def supabase_get(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    """GET rows from a Supabase table via the PostgREST REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=supabase_headers(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_post(table: str, data: dict[str, Any]) -> dict[str, Any]:
    """POST (insert) a row into a Supabase table.

    On failure, surface the PostgREST response body in the raised exception.
    The default requests `raise_for_status()` only reports the status code and
    URL — which is why every insert failure historically logged the same opaque
    "400 Client Error ... for url" with no clue. PostgREST puts the real reason
    (constraint name, offending column) in the body; we must not lose it.
    """
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=supabase_headers(), json=data, timeout=30)
    if not resp.ok:
        detail = resp.text[:500] if resp.text else "(empty body)"
        raise requests.HTTPError(
            f"{resp.status_code} on {table}: {detail}", response=resp
        )
    # For empty 201 responses return an empty dict
    if not resp.text:
        return {}
    return resp.json()


def supabase_upload_image(image_bytes: bytes, filename: str) -> str | None:
    """Upload an image to Supabase Storage and return the public URL.

    Returns None if upload fails.
    """
    # Upload to: storage/v1/object/{bucket}/{filename}
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    try:
        resp = requests.post(
            upload_url,
            headers=supabase_storage_headers("image/png"),
            data=image_bytes,
            timeout=60,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("Failed to upload image to Supabase Storage: %s", exc)
        return None

    # Construct the public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
    log.info("  Image uploaded: %s", public_url)
    return public_url


def generate_audio_elevenlabs(text: str) -> bytes | None:
    """Generate MP3 audio via ElevenLabs TTS API. Returns raw MP3 bytes or None."""
    if not ELEVENLABS_API_KEY:
        log.warning("  ELEVENLABS_API_KEY not set — skipping TTS generation.")
        return None

    # ElevenLabs free tier: max 5000 chars per request. Truncate to ~2000 chars
    # (~2 Min. Lesezeit) — das reicht für unsere kompakten Stories.
    MAX_CHARS = 2000
    text_trimmed = text[:MAX_CHARS]
    if len(text) > MAX_CHARS:
        # Am letzten Satzende abschneiden
        last_period = text_trimmed.rfind(".")
        last_excl = text_trimmed.rfind("!")
        last_ques = text_trimmed.rfind("?")
        cut = max(last_period, last_excl, last_ques)
        if cut > MAX_CHARS // 2:
            text_trimmed = text[: cut + 1]

    payload = {
        "text": text_trimmed,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.1,
            "speaker_boost": True,
        },
    }

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    try:
        resp = requests.post(
            ELEVENLABS_TTS_URL,
            headers=headers,
            json=payload,
            timeout=90,
        )
        if resp.status_code == 429:
            log.warning("  ElevenLabs rate limit — skipping audio for this run.")
            return None
        resp.raise_for_status()
        return resp.content
    except requests.RequestException as exc:
        log.error("  ElevenLabs TTS failed: %s", exc)
        return None


def upload_audio_to_storage(audio_bytes: bytes, filename: str) -> str | None:
    """Upload MP3 audio to Supabase Storage (story_audio bucket). Returns public URL or None."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{AUDIO_STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,  # type: ignore[arg-type]
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
    }
    try:
        resp = requests.post(upload_url, headers=headers, data=audio_bytes, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("  Failed to upload audio to Supabase Storage: %s", exc)
        return None

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{AUDIO_STORAGE_BUCKET}/{filename}"
    log.info("  Audio uploaded: %s", public_url)
    return public_url


def source_exists(source_url: str) -> bool:
    """Return True if a story with this source_url already exists in Supabase."""
    params = {"source_url": f"eq.{source_url}", "select": "id", "limit": "1"}
    rows = supabase_get("nureine_stories", params=params)
    return len(rows) > 0


def call_deepseek(prompt: str) -> str | None:
    """Send a prompt to DeepSeek Chat and return the response text.

    Uses the OpenAI-compatible chat completions API.
    The prompt is treated as a combined system + user message.
    """
    # Split the prompt into system context and user query
    # The prompt template starts with "Du bist Redakteur..." (system role)
    # followed by the article analysis task (user role)
    lines = prompt.split("\n")
    # Find the separator between system instructions and article data
    sep_idx = next((i for i, line in enumerate(lines) if line.startswith("Artikel-Titel:")), len(lines))
    system_content = "\n".join(lines[:sep_idx]).strip()
    user_content = "\n".join(lines[sep_idx:]).strip()

    payload: dict[str, Any] = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content or prompt},
        ],
        "temperature": 0.2,
        "top_p": 0.95,
        "max_tokens": 4096,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            log.warning("DeepSeek returned no choices: %s", data)
            return None
        text = choices[0].get("message", {}).get("content", "")
        return text
    except requests.RequestException as exc:
        log.error("DeepSeek API request failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# DeepSeek prompt — analysis + image prompt
# ---------------------------------------------------------------------------
ANALYSIS_PROMPT_TEMPLATE = """\
Du bist Chef vom Dienst bei NurEine, einer Premium-Plattform für bedeutsame Good News.
Deine Zielgruppe: Entscheider in HR, Schulen und Kliniken (B2B) – kluge, aber vielbeschäftigte Menschen.
Sie sind keine Fachexperten für Klimawissenschaft, Energietechnik oder Chemie.
Dein Job: Geschichten so aufbereiten, dass JEDER sie beim ersten Lesen versteht.
Regel Nr. 1: Kein Fachbegriff ohne Erklärung. Kein Konzept ohne Kontext.
Ein Leser, der googeln muss, ist ein verlorener Leser.

=== DAS WERTFUNDAMENT: Woran NurEine „Fortschritt" misst (politisch nicht vereinnahmbar) ===

NurEine ist NICHT „neutral" im Sinne von beliebig — wir haben EINE klare Position:
„Fortschritt heißt, dass Menschen gesünder, sicherer, freier und verbundener leben."
Das ist keine links/rechts-Frage — es ist das Ziel, auf das sich alle einigen können
(basierend auf Human-Flourishing-Forschung: OECD Better Life Index, Gross National Happiness).

Eine Story ist für uns „gut", wenn sie Fortschritt in EINEM dieser SIEBEN universellen
Bereiche zeigt — bewerte JEDE Story durch diese Linse:
  1. GESUNDHEIT — weniger Krankheit, längeres gutes Leben.
  2. BILDUNG — mehr Menschen mit Zugang zu Wissen & Fähigkeiten.
  3. ÖKOLOGIE — intakte natürliche Lebensgrundlagen (Luft, Wasser, Boden, Arten).
  4. SICHERHEIT — weniger Gewalt, Hunger, Armut, Gefahr.
  5. GEMEINSCHAFT — stärkerer Zusammenhalt, Vertrauen, weniger Einsamkeit.
  6. INNOVATION — Lösungen, die das Leben leichter/besser machen.
  7. SELBSTBESTIMMUNG — mehr Menschen können ihr Leben selbst gestalten (Freiheit, Teilhabe, Rechte).

WAS DU EXPLIZIT NICHT TUST (Überparteilichkeit konkret):
  - KEIN Urteil über die MITTEL: ob ein Fortschritt staatlich oder privat entstand, ist NICHT deine Frage.
  - KEIN Partei-Framing: schreibe NIE „Regierung X hat…", sondern „In Y ist Folgendes passiert…".
    Nenne Parteien/Politiker nur, wenn unvermeidlich, und ohne Wertung in ihre Richtung.
  - KEIN Aktivismus: du BERICHTEST über Fortschritt, du FORDERST ihn nicht. Keine Appelle, keine Imperative.
  - KEINE falsche Ausgewogenheit: wenn die Faktenlage klar ist (z.B. Wissenschaftskonsens), ist
    künstliches „andererseits" keine Tugend — aber bleib sachlich, nie polemisch.
  - Eine Story, die primär eine politische Seite gut/schlecht aussehen lässt statt einen echten
    Lebens-Fortschritt zu zeigen, gehört NICHT zu uns (is_nureine=false, "not_positive").

=== DEINE DREI TODSÜNDEN (absolutes Ausschlusskriterium) ===

1. HISTORIEN-FALLE: Jahrestage, "Vor X Jahren", historische Rückblicke, Gedenktage.
   → BEISPIEL: "Vor 200 Jahren wurde der Sklavenhandel abgeschafft" → ABLEHNEN.
   → BEISPIEL: "Kriegsende in Europa: Massenkapitulation 1945" → ABLEHNEN.
   → Grund: News-Portal, kein Kalenderblatt. Nur tagesaktuelle Ereignisse.
   → gut_filter_reason: "history_trap"

2. LOCAL FLUFF / DODO-SYNDROM: Lokale Einzelereignisse ohne strukturellen Impact.
   → BEISPIEL: "Hässlicher Briefkasten in Sackgasse entfernt" → ABLEHNEN.
   → BEISPIEL: "Haarloser Welpe aus Küchenschrank gerettet" → ABLEHNEN.
   → BEISPIEL: "Hockeyfans singen Hymne nach Mikrofonausfall" → ABLEHNEN.
   → BEISPIEL: "Junge spricht mit gehörlosem Mädchen" → ABLEHNEN.
   → Grund: Viraler Clickbait ohne Substanz. Ändert nichts am Zustand der Welt.
   → gut_filter_reason: "local_fluff"

3. SPORT- UND NISCHEN-SPAM: Sportereignisse, Einzelleistungen einzelner Athleten.
   → BEISPIEL: "Tolga Cigerci schießt Cottbus Richtung Aufstieg" → ABLEHNEN.
   → BEISPIEL: "Marie-Louise Eta gewinnt" → ABLEHNEN.
   → Ausnahme: Strukturelle Änderungen IM Sport (z.B. "FIFA reformiert Sicherheitsregeln für alle Stadien").
   → gut_filter_reason: "sports_niche"

=== MARKEN-KOMPASS: Wir sind eine NEWS-Plattform, kein Wissens-Blog ===

NurEine bringt GUTE NACHRICHTEN — Dinge, die sich in der Welt zum Besseren VERÄNDERT haben.
Wir sind NICHT „Galileo" oder ein Kuriositäten-Kanal. Frag dich bei jeder Story ehrlich:

❌ KEIN Ratgeber / Lifestyle / How-To: "10 Sträucher für den Garten", "So gießt du Blumen richtig",
   "5 Tipps für besseren Schlaf" → das ist KEINE Nachricht, das ist ein Ratgeber. → not_positive.
❌ KEINE reine Wissens-Kuriosität OHNE Neuigkeit/Wirkung: "Warum der Himmel blau ist",
   "Forscher erklären, wie Ameisen kommunizieren" → interessant, aber keine gute NACHRICHT. Im Zweifel
   nur aufnehmen wenn es ein echter, frischer Durchbruch ist — dann aber niedriger Wirkungsindex (siehe unten).
❌ KEIN Doom im Verkleidungs-Mantel: "Lage ist katastrophal, ABER ein Hoffnungsschimmer…" — wenn die Story
   überwiegend von einem Problem/Bedrohung handelt und das Positive nur Beiwerk ist → not_positive.
   Wir wollen den FORTSCHRITT in den Mittelpunkt, nicht die Krise mit Pflaster.
✅ JA: etwas ist BESSER geworden, wurde GELÖST, jemand hat einen Sieg ERRUNGEN, eine Maßnahme WIRKT.

Wenn die Story durchgeht, aber eigentlich nur „nett/interessant" ist (Kuriosität, Symbolik, sehr lokal),
dann: is_nureine=true ABER impact_score niedrig (25-44). Der Wirkungsindex ist unser Qualitäts-Sortierer.

=== WAS WIR SUCHEN (Gold-Standard) ===

Eine NurEine-Geschichte hat MINDESTENS eines dieser Merkmale:
- Strukturelle Veränderung (neues Gesetz, Systemwechsel, Reform)
- Wissenschaftlicher Durchbruch (Peer-Reviewed, nicht "Forscher vermuten")
- Technologische Innovation mit Massen-Impact (nicht: neues Gadget)
- Kampf David gegen Goliath gewonnen (Bürger vs. Konzern, NGO vs. Monopol)
- Greifbarer Nutzen für >100.000 Menschen nachweisbar

Gold-Beispiele (zum Kalibrieren deines inneren Kompass):
- ✅ "Kenia: Saatgut-Teilen wieder legal – Sieg gegen Agrarkonzerne" (Strukturänderung)
- ✅ "KI erkennt Bauchspeicheldrüsenkrebs 3 Jahre früher" (Wissenschaftlicher Durchbruch)
- ✅ "Moringa-Samen filtern 98% Mikroplastik aus Leitungswasser" (Innovation mit Impact)
- ✅ "Entsalzungsanlage versorgt San Diego und hilft Nachbarstaaten" (Technologie mit Reichweite)
- ✅ "Indien entkriminalisiert 717 Straftaten" (Massen-Impact)

=== ANALYSEAUFGABE ===

Analysiere diesen Artikel und antworte NUR mit einem JSON-Objekt (kein Text davor/danach):

Artikel-Titel: {title}
Artikel-Text: {description}
Quelle: {source}

JSON-Felder:

is_nureine: true/false — Kommt diese Story INS ARCHIV? Sei GROSSZÜGIG: true für JEDE
glaubwürdige, belegte, GENUINELY POSITIVE Nachricht mit Substanz — auch wenn sie nur
mittelgroß ist (regionaler Fortschritt, ein gelöstes Problem, eine gute Entwicklung).
Der Wirkungsindex sortiert später, was aktiv gepostet/versendet wird — DU musst hier
nur entscheiden, ob es überhaupt eine echte gute Nachricht ist.
Lehne NUR ab (false), wenn EINE der drei Todsünden zutrifft (Historie/local-fluff/Sport)
ODER die Nachricht nicht wirklich positiv ist (neutral, reine Ankündigung ohne Ergebnis,
schlechte Nachricht, oder bloßes "Forscher untersuchen…" ohne konkreten Fortschritt).
Im Zweifel: AUFNEHMEN. Lieber eine mittlere gute Nachricht im Archiv als ein leeres Archiv.

gut_filter_reason: null (wenn is_nureine=true) ODER einer von ["history_trap", "local_fluff", "sports_niche"] (wenn is_nureine=false). Bei anderem Ablehnungsgrund (z.B. einfach keine positive Nachricht): "not_positive".

NUR wenn is_nureine=true, fülle zusätzlich:

title: Ein einfacher Satz, den jeder versteht (max 65 Zeichen — KURZ + auf den Punkt, passt sonst nicht
  sauber auf die Karten). Keine journalistische Schlagzeile — sag einfach, was passiert ist und warum es gut ist.
  Lieber knapp und klar als vollständig: "Solarstrom überholt Kohle in den USA" reicht, kein "erstmals seit…".
  MUSS EIGENSTÄNDIG VERSTÄNDLICH sein: Eine Leserin, die den Artikel NICHT kennt, muss allein vom Titel begreifen, worum es geht und warum es gut ist.
  ⚠️ KEINE unerklärten fremdsprachigen Eigennamen, Abkürzungen, Spitznamen oder Insider-Begriffe. Beispiel SCHLECHT: "Freiwillige dokumentieren jede Art in den Smokies" (was sind "die Smokies"? niemand weiß das). Beispiel GUT: "Im US-Nationalpark Great Smoky Mountains sind erstmals alle Tierarten erfasst". Ersetze oder erkläre jeden Begriff, den ein deutscher Durchschnittsleser nicht sofort einordnen kann (Ort → mit Land/Region; Abkürzung → ausschreiben; Eigenname → kurz erklären). Lieber 5 Zeichen mehr und klar als kryptisch.

subtitle: Ein Satz, der das Ereignis mit seinem Warum verbindet (max 130 Zeichen). Nenne die wichtigste Zahl und erkläre kurz den dahinterstehenden Mechanismus.

summary: EXAKT 4 deutsche Sätze für Story-Cards und Teaser. STRUKTUR:
  Satz 1: Der KONTEXT-Satz. Erkläre den grundlegenden Mechanismus oder das Konzept so, dass eine Leserin OHNE Fachwissen versteht, worum es geht. Warum sind Staudämme ein Problem? Was machen PFAS mit Vögeln? Warum ist Natrium besser als Lithium? Niemals voraussetzen, dass die Leserin Fachbegriffe oder Zusammenhänge schon kennt.
  Satz 2: Was ist passiert? Die konkreten Fakten und Zahlen.
  Satz 3: Warum ist das strukturell wichtig? Die langfristige Bedeutung.
  Satz 4: Ausblick oder Einordnung – was bedeutet das für die Zukunft?

body: Ein ausführlicher journalistischer Artikel in deutscher Sprache. Schreibe 12-18 Sätze mit Substanz als einen einzigen, fließenden redaktionellen Text ohne Zwischenüberschriften. Nutze ausschließlich weiche Übergänge zwischen den Absätzen — natürliche Linebreaks (Leerzeilen) trennen die gedanklichen Abschnitte. Der Text soll von der Faktenlage organisch zur Einordnung übergehen, ohne dass Überschriften den Lesefluss unterbrechen. Innerhalb der Absätze kannst du **fett** und *kursiv* für Betonung verwenden. Verwende konkrete Zahlen, Namen, Orte und Zitate aus dem Originaltext. Schreibe im Stil von ZEIT ONLINE oder brand eins — sachlich, präzise, aber zugänglich. Nicht werblich, nicht reißerisch. Erkläre jeden Fachbegriff beim ersten Auftauchen in einem Nebensatz (Beispiel: "Natrium, ein häufiges Element, das in Kochsalz vorkommt"). Deine Leser sind klug, aber keine Fachexperten — sie wollen verstehen, nicht googeln.

category: eine von [klima, gesundheit, wissenschaft, gemeinschaft, tiere, kultur, innovation]

sensitive: true/false — Ist das Thema potenziell HEIKEL / nicht ohne Weiteres jugendfrei?
  true NUR bei: explizit sexuellem Inhalt, drastischer Gewalt/Tod im Vordergrund, Drogen/Sucht als
  Hauptthema, oder anderem Inhalt, den man Kindern nicht ungefiltert zeigen würde.
  ⚠️ Ein wissenschaftlicher Bezug zu Fortpflanzung/Evolution allein ist NICHT heikel (false).
  Beispiel true: Artikel über Pornografie-Industrie, explizite Gewaltdarstellung.
  Beispiel false: "Sexuelle Fortpflanzung beschleunigte die Evolution" (Biologie, sachlich).
  Im Zweifel false. Das Flag verhüllt die Story im Frontend nur dezent, blockt sie nicht.

region: Ländername auf Deutsch

region_code: ISO 3166-1 alpha-2

lat: Breitengrad (float)

lng: Längengrad (float)

image_prompt: Ein englischer Prompt für FLUX.1 Bild-KI. Stil: "Warm editorial paper collage illustration". Das Bild sieht aus wie eine handgefertigte Papiercollage aus mehreren überlappenden Papier-Ebenen, mit sichtbaren Kanten, feiner Papierfaser-Textur und subtilem Schattenwurf zwischen den Ebenen. Der Stil ist flach-illustrativ (KEIN 3D-Render, KEIN Fotorealismus, KEIN Glanz, KEIN Plastik). Ein zentrales, abstrahiertes Motiv symbolisiert das Thema als einfache, ikonische Form. Farbpalette: Heller warmer Off-White-Kartonhintergrund in #f5f1ea (wie ungebleichte Pappe), Akzente in EINER warmen Kontrastfarbe, die zum Thema passt — wähle aus: Terracotta-Orange, Salbei-Grün, Rosen-Rot oder Himmel-Blau. Das Motiv ist aus farbigem Papier gestaltet, die Tiefe entsteht allein durch Papier-Überlappung und -Schatten.
  ⚠️ MOTIV-WAHL — DER HÄUFIGSTE FEHLER: Das Symbol muss den KERN der guten Nachricht zeigen, NICHT ein
  wörtliches/oberflächliches Objekt aus dem Titel. Denke einen Schritt weiter:
    - SCHLECHT (wörtlich/irreführend): "Bor-Nanobälle" → ein Fußball (nur weil 'fußballförmig'). NIEMALS.
      Stattdessen: ein leuchtendes Molekül-Gittermuster aus Papier. Das Thema ist Materialforschung, kein Sport.
    - SCHLECHT: "KI hilft Mathematikern" → Roboterhände. Stattdessen: ein elegantes geometrisches Beweis-Muster.
    - GUT: "Solarstrom überholt Kohle" → Sonne über stilisierter Landschaft, ein Kohlestück verblassend.
    - GUT: "Nashörner kehren zurück" → ein Nashorn-Umriss aus Papier in sanfter Savannen-Landschaft.
  Wähle ein Motiv, das (a) eindeutig zum eigentlichen Thema passt, (b) positiv/hoffnungsvoll wirkt,
  (c) ohne Bildunterschrift verständlich ist. KEINE Menschen-Gesichter, KEINE Markenlogos, KEIN Text im Bild.
  Format: "Warm paper collage editorial illustration of [PASSENDES KERN-SYMBOL], made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in [GEWÄHLTE FARBE]. Visible paper grain texture, soft cast shadows between paper layers. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism, no glossy materials." Beispiel: "Warm paper collage editorial illustration of mangrove branches growing from layered leaves, made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in sage green. Visible paper grain texture, soft cast shadows between paper layers. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism, no glossy materials."

impact_reach: Geschätzte Anzahl direkt positiv betroffener Menschen (integer)

impact_durability: 0-100 (Wie lange hält der Effekt an? Strukturveränderung=100, Einzelereignis=20)

impact_evidence: 0-100 (Peer-reviewed=100, etablierte Redaktion=75, lokal=50)

impact_score: Integer 0-100. Der NurEine-WIRKUNGSINDEX misst EINE Sache:
  „Wie sehr verbessert diese Nachricht konkret das Leben von Menschen (oder den Zustand der Welt) ZUM BESSEREN?"
  Es ist KEINE Formel aus Reichweite × Beleg × Dauer. Eine Studie kann perfekt belegt und uralt-stabil sein
  und TROTZDEM wenig Wirkung haben (sie verbessert nichts, sie erklärt nur etwas).

  Vergib den Score nach diesem Maßstab — sei STRENG, 100 ist die absolute Ausnahme:
  • 85-100: Verändert STRUKTURELL das Leben vieler — neues Gesetz/Reform mit echtem Nutzen, Durchbruch der
    Krankheit heilt/Armut senkt/Umwelt rettet, Technologie die nachweisbar >100.000 Menschen direkt hilft.
    Beispiele: „Malaria-Impfstoff für Kinder zugelassen" (95), „Solarstrom überholt Kohle" (88, echte Energiewende).
  • 65-84: Klarer, konkreter Fortschritt mit greifbarem Nutzen — ein gelöstes Problem, eine gute neue Regel,
    eine wirksame Maßnahme, eine Art gerettet. Beispiele: „Nashörner kehren zurück und vermehren sich" (75).
  • 45-64: Solide gute Entwicklung, regionaler/mittlerer Fortschritt, vielversprechender erster Schritt.
  • 25-44: Nett, aber geringe reale Wirkung — wissenschaftliche ERKENNTNIS/Kuriosität OHNE direkten Nutzen
    (interessant, aber verbessert nichts), Symbolisches, sehr Lokales, vager früher Forschungsstand.
    ⚠️ HIERHIN gehören reine „Aha"-Studien: „Hauskatzen wurden früher domestiziert als gedacht",
    „Sex beschleunigte die Evolution", „Ältester Baum entdeckt" — faszinierend fürs Archiv, aber KEINE
    Wirkung auf das Leben von heute. NIEMALS 90+ nur weil peer-reviewed und das Thema groß ist.
  • 1-24: Minimaler Impact, Grenzfall der gerade noch reinkommt.

  Merksatz: Frag „Wird das Leben von irgendwem morgen messbar besser?" Wenn nein → max 44, egal wie gut belegt.
  impact_reach/durability/evidence fülle separat ehrlich aus — aber der impact_score folgt dem Wirkungs-Maßstab
  oben, NICHT einer Multiplikation der drei.

impact_reach_score: 0-100 — die REICHWEITE als Balkenwert (für die sichtbare Aufschlüsselung).
  Wie viele Menschen betrifft die gute Nachricht direkt? 100=Milliarden/global, 80=Millionen, 60=Hunderttausende,
  40=Zehntausende, 20=lokal/wenige. WICHTIG: muss zum impact_score passen — eine Story mit niedrigem Gesamtscore
  hat selten einen hohen Reichweite-Balken (Konsistenz vor Schönfärberei).

impact_durability und impact_evidence (0-100) sind ebenfalls die Balkenwerte für Dauerhaftigkeit
  ("Bleibt die Wirkung länger als eine Woche/ein Jahr?") und Belegbarkeit ("Wie hart sind die Daten?").
  Alle drei Balken zusammen müssen den Gesamtscore PLAUSIBEL ergeben — kein Balken darf dem Gesamtbild
  widersprechen (eine 25er-Kuriosität hat nicht drei 90er-Balken).

impact_explainer: EIN deutscher Satz, der die RELEVANZ übersetzt (nicht die Methodik erklärt). Sagt einer
  Leserin in Alltagssprache, warum sie das angeht. Max 140 Zeichen. KEINE Floskel, kein "Experten sagen".
  GUT: „Diese Spritze könnte HIV-Neuinfektionen weltweit halbieren — zwei Mal im Jahr, mehr nicht."
  SCHLECHT: „Die Studie wurde peer-reviewed und hat hohe Evidenz."

share_hook: EIN fertiger Chat-Satz zum WEITERGEBEN (WhatsApp-ready), den man einem Freund schickt. Neugierig,
  menschlich, überraschend — KEINE Schlagzeile, KEINE Werbung, kein Hashtag, kein Link. Max 160 Zeichen.
  So formuliert, dass der Empfänger sofort mehr wissen will. GUT: „Stell dir vor: Eine Spritze, zweimal im Jahr,
  und HIV hat kaum noch eine Chance. Genau das wurde gerade zugelassen."

kid_min_age: Wenn die Geschichte sich gut mit Kindern besprechen lässt: Mindestalter zum Erklären (integer, z.B. 6, 8, 10, 12). Wenn ungeeignet für Kinder (zu abstrakt, zu düster, kein kindgerechter Aufhänger): null.
kid_explainer: Nur wenn kid_min_age gesetzt: EIN kurzer, kindgerechter Satz, der den schwierigsten Begriff der Geschichte erklärt (kein Belehrungston). Sonst null. Beispiel: "Extreme Armut bedeutet: von weniger als 2 Euro pro Tag leben müssen."
conversation_starter: Nur wenn kid_min_age gesetzt: EINE offene Frage fürs Familiengespräch (keine richtige Antwort, kein Lehrton). Sonst null. Beispiel: "Was würdest du tun, wenn du das Problem lösen müsstest?"

=== REDAKTIONS-PIPELINE: Emotion + Kanal-Eignung + Social-Texte ===

Wir posten nicht jede Story auf Social Media. Nur was wirklich bewegt. Lieber leer als falsch.
Stell dir bei jeder Story die ehrliche Frage: "Würde ich das meiner besten Freundin per WhatsApp
schicken — nicht als Link, sondern weil ICH selbst erstaunt/berührt bin?"

emotion: Die EINE primäre Emotion, die die Story auslöst. Genau einer von:
  - "relief"  — Erleichterung: die Welt ist nicht so kaputt wie befürchtet (Armut sinkt, Flüsse werden frei)
  - "wonder"  — Staunen: das ist unglaublich, ein Bild das man sich vorstellen kann (Hirsche queren neue Wildbrücke am 1. Tag)
  - "hope"    — Hoffnung: etwas bewegt sich, ein erster Schritt (neues Gesetz schützt erstmals X)
  - "pride"   — Stolz: Menschen lösen ihr Problem selbst (Gemeinde baut eigene Schule)
  - "warmth"  — Wärme: menschliche Verbindung, Solidarität im großen Maßstab
  Wähle die DOMINANTE Emotion, nicht mehrere. Im Zweifel die, die ein Mensch beim Lesen ZUERST spürt.

ig_ok: true/false — Taugt die Story für Instagram? NUR true wenn ALLE vier zutreffen:
  (1) Es gibt ein visuelles Moment (ein konkretes Bild, das man sich vorstellen kann).
  (2) Der Kern ist in EINEM Satz erklärbar.
  (3) Die Emotion ist "relief", "wonder" oder "pride" (nicht "hope"/"warmth" allein).
  (4) impact_score >= 70.
  Policy-Themen, abstrakte Statistiken, "zu weit weg"-Themen → ig_ok=false. Sei streng.

wa_ok: true/false — Würde man das einer Freundin schicken? NUR true wenn ALLE drei zutreffen:
  (1) Fühlt sich an wie etwas, das man spontan teilt.
  (2) Keine Erklärung nötig, um es zu verstehen.
  (3) Emotional sofort zugänglich.

ig_hook: Nur wenn ig_ok=true. Der INSTAGRAM-HOOK für Folie 1 — die ersten 1,5 Zeilen, die zum WISCHEN zwingen.
  ⚠️ NIEMALS die Schlagzeile/der Titel. Eine Schlagzeile ("EU beschließt Tierschutzgesetz") gibt KEINEN Grund
  zu wischen — die ganze Info steht schon da. Stattdessen: SPANNUNG aufbauen, eine offene Schleife, ein Problem
  oder ein überraschender Einstieg, dessen Auflösung erst auf Folie 2 kommt. Idealerweise endet der Hook mit
  einem Doppelpunkt, einer offenen Frage oder einem Cliffhanger. Max 110 Zeichen.
  SCHLECHT (Schlagzeile): "EU beschließt erstes Tierschutzgesetz für Hunde und Katzen"
  GUT (offene Schleife): "Millionen Hunde wurden bisher legal so gezüchtet, dass sie kaum atmen können. Das endet jetzt."
  GUT (Spannung): "Drei Hirsche standen am ersten Tag vor der neuen Brücke. Was dann passierte, ändert alles."
  GUT (Frage): "Was wäre, wenn die schlimmste Blindheits-Ursache eines Landes einfach verschwindet?"
  Der Leser muss das GEFÜHL haben: "ich MUSS wissen wie's weitergeht". Sonst null.

wa_opener: Nur wenn wa_ok=true. Ein PERSÖNLICHER WhatsApp-Einstieg in DEINER Stimme — wie ein Mensch,
  den etwas berührt hat, NICHT wie eine Institution. Max 80 Zeichen. Soll zur Emotion passen.
  So klingt die echte Stimme (Aarons Ton — locker, ehrlich, manchmal trocken):
    - "krass, warum bekommt man das sonst nirgends mit:"
    - "yeah. Fortschritt."
    - "les go –"
    - "kurz innegehalten, als ich das las:"
    - "bin ich der Einzige, den sowas mehr packt als die üblichen News?"
  KEIN Marketing-Ton, KEINE Ausrufezeichen-Ketten, kein "Schau dir das an!". Lieber knapp + echt.
  Beispiel (relief): "Das hat mich heute ruhiger gemacht:"
  Beispiel (wonder): "krass, warum hört man das sonst nirgends:"
  Beispiel (pride): "Manchmal lösen Menschen Probleme einfach. Leise."
  Sonst null.

slides: Nur wenn ig_ok=true. Ein Objekt mit DREI kurzen Carousel-Texten, die AUFEINANDER AUFBAUEN
  (nicht wiederholen):
  {{
    "hook": "Folie 1 — der Hook (= ig_hook oder enger Variant). Ein Gedanke, max 70 Zeichen.",
    "aufloesung": "Folie 2 — die Auflösung. Was ist passiert + warum es zählt. 2-3 kurze Sätze, max 280 Zeichen. Erklär einfach, aber verkauf niemanden für dumm.",
    "stille": "Folie 3 — ein letzter, ruhiger Satz zum Nachhall. Max 90 Zeichen. Kein CTA."
  }}
  Sonst null.

ig_caption: Nur wenn ig_ok=true. Der INSTAGRAM-CAPTION-TEXT unter dem Post.
  ⚠️ Die Caption darf die Story NICHT zusammenfassen und NICHT die Folien wiederholen. Wenn die Caption
  schon die ganze Antwort liefert, gibt es keinen Grund mehr, die Folien zu wischen.
  Die Caption ARBEITET FÜR DEN SWIPE: sie macht neugierig, baut Spannung/Emotion auf und leitet zum Wischen
  ("👇" o.ä.), liefert aber die Auflösung NICHT. Erst ein emotionaler/überraschender Einstieg, der die
  Tragweite andeutet, dann eine Brücke zum Wischen. 2-3 kurze Zeilen, warm + menschlich, kein Marketing-Sprech.
  Format am Ende: eine neue Zeile, dann "Quelle: <Quellenname>" (falls bekannt).
  SCHLECHT (fasst zusammen): "Endlich: EU verbietet Qualzucht bei Hunden und Katzen. Ein großer Schritt gegen Tierleid."
  GUT (macht neugierig): "Millionen Hunde leiden still — weil wir niedliche Gesichter mehr lieben als gesunde Tiere.\\nDas ändert sich jetzt. 👇"
  Sonst null.

Antworte ausschließlich mit validem JSON. Kein Text davor oder danach."""


# ---------------------------------------------------------------------------
# Full-text extraction helpers
# ---------------------------------------------------------------------------

# Browser-like User-Agent to avoid bot detection
_WEB_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}

# Feed sources that include full article text in <content:encoded>
# trafilatura would scrape the same content anyway, but using the RSS field
# is faster and avoids an extra HTTP request.
FEEDS_WITH_FULL_CONTENT = {
    "Mongabay",
    "Nature News",
    "WHO News",
    "Golem Science",
}


def _html_to_plain(text: str) -> str:
    """Strip HTML tags and decode entities for a clean plain-text string."""
    text = (
        text.replace("<p>", "\n")
        .replace("</p>", "\n")
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )
    return re.sub(r"<[^>]+>", "", text)


def _rss_content_field(entry: feedparser.FeedParserDict) -> str | None:
    """Extract full article text from an RSS <content:encoded> field if present."""
    content_list = entry.get("content")
    if not content_list:
        return None
    raw = content_list[0].get("value", "")
    if not raw or len(raw) < 100:
        return None
    return _html_to_plain(raw)


def _extract_trafilatura(url: str, timeout: int = 15) -> str | None:
    """Download a web page and extract its main article text via trafilatura.

    Returns the plain-text article content, or None if extraction fails.
    """
    try:
        resp = requests.get(url, headers=_WEB_HEADERS, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.info("  trafilatura: HTTP fetch failed for %s: %s", url[:60], exc)
        return None

    text = trafilatura.extract(
        resp.text,
        include_comments=False,
        include_tables=False,
        url=url,
    )
    if not text or len(text) < 100:
        log.info("  trafilatura: extraction returned insufficient text (%d chars)", len(text or ""))
        return None

    return text


def extract_article_text(
    entry: feedparser.FeedParserDict,
    source_name: str,
    source_url: str | None,
) -> str:
    """Build the best possible article text from available sources.

    Priority:
      1. RSS <content:encoded> — fast, no extra HTTP request
      2. trafilatura web-scrape of source_url — 6-10x more text than RSS description
      3. RSS <description> — the existing fallback

    Returns cleaned plain text (max 8000 chars for token budget).
    """
    # 1. Try RSS content:encoded (full article in feed)
    if source_name in FEEDS_WITH_FULL_CONTENT:
        full = _rss_content_field(entry)
        if full and len(full) > 500:
            log.info("  Using RSS content:encoded (%d chars)", len(full))
            return full[:8000] if len(full) > 8000 else full

    # 2. Try trafilatura web-scrape
    if source_url:
        full = _extract_trafilatura(source_url)
        if full and len(full) > 500:
            log.info("  Using trafilatura web-scrape (%d chars)", len(full))
            return full[:8000] if len(full) > 8000 else full

    # 3. Fallback: RSS description (existing behavior)
    desc = entry.get("description", entry.get("summary", "(keine Beschreibung)"))
    desc = _html_to_plain(desc)
    if len(desc) > 5000:
        desc = desc[:5000] + "…"
    log.info("  Using RSS description fallback (%d chars)", len(desc))
    return desc


def build_prompt(entry: feedparser.FeedParserDict, source_name: str) -> str:
    """Build the analysis prompt for a given feed entry."""
    title = entry.get("title", "(kein Titel)")
    source_url = entry.get("link", "")
    description = extract_article_text(entry, source_name, source_url)
    return ANALYSIS_PROMPT_TEMPLATE.format(
        title=title,
        description=description,
        source=source_name,
    )


def _compute_impact_score(
    score_from_ai: int | float | None,
    reach: int | float | None,
    durability: int | float | None,
    evidence: int | float | None,
) -> int | None:
    """Compute impact_score with server-side fallback if AI didn't return it."""
    if score_from_ai is not None:
        try:
            s = int(score_from_ai)
            return max(1, min(100, s))
        except (ValueError, TypeError):
            pass

    # Fallback: compute from sub-scores
    if reach is None or durability is None or evidence is None:
        return None

    try:
        reach_norm = min(100.0, math.log10(max(1, int(reach) + 1)) * 20)
        raw = reach_norm * 0.4 + int(durability) * 0.35 + int(evidence) * 0.25
        return max(1, min(100, round(raw)))
    except (ValueError, TypeError):
        return None


def parse_ai_response(text: str | None) -> dict[str, Any] | None:
    """Parse the AI response text into a dict."""
    if not text:
        return None

    # Strip markdown code fences if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (possibly with "json" language tag)
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            cleaned = cleaned[first_newline + 1 :]
        # Remove closing fence
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
        elif "```" in cleaned:
            cleaned = cleaned[: cleaned.rindex("```")].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        log.warning("Failed to parse AI JSON response: %s", exc)
        log.debug("Raw response: %s", text)
        return None


# ---------------------------------------------------------------------------
# Image pipeline: generate + upload
# ---------------------------------------------------------------------------
def generate_image_fal(image_prompt: str) -> bytes | None:
    """Generate an image using FLUX.1 [pro] via fal.ai.

    Returns raw image bytes, or None on failure.
    """
    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "prompt": image_prompt,
        "image_size": FAL_IMAGE_SIZE,
        "num_images": FAL_NUM_IMAGES,
        "enable_safety_checker": False,  # OFF: false positives block medical/health prompts (WHO etc.) → black images
    }

    try:
        # Submit generation job
        resp = requests.post(FAL_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        submission = resp.json()

        # fal.ai returns the result directly for schnell (no polling needed),
        # but handle queue mode just in case
        status_url = submission.get("status_url")
        if status_url:
            # Queue mode — poll until complete
            log.info("  Waiting for image generation...")
            elapsed = 0
            while elapsed < FAL_POLL_TIMEOUT:
                time.sleep(FAL_POLL_INTERVAL)
                elapsed += FAL_POLL_INTERVAL
                status_resp = requests.get(status_url, headers=headers, timeout=30)
                status_resp.raise_for_status()
                status_data = status_resp.json()
                state = status_data.get("status", "")
                if state == "COMPLETED":
                    submission = status_data
                    break
                if state in ("FAILED", "CANCELLED"):
                    log.error("  Image generation failed: %s", status_data)
                    return None
            else:
                log.error("  Image generation timed out after %ds", FAL_POLL_TIMEOUT)
                return None

        # Extract image URL
        images = submission.get("images", [])
        if not images:
            log.warning("  fal.ai returned no images: %s", submission)
            return None

        image_url = images[0].get("url")
        if not image_url:
            log.warning("  fal.ai response missing image URL")
            return None

        # Download the generated image
        log.info("  Downloading generated image...")
        img_resp = requests.get(image_url, timeout=60)
        img_resp.raise_for_status()
        return img_resp.content

    except requests.RequestException as exc:
        log.error("  FLUX.1 image generation failed: %s", exc)
        return None


def generate_and_upload_image(image_prompt: str, story_title: str, category: str = "gemeinschaft") -> str | None:
    """Generate an image via FLUX.1 [pro] on fal.ai, composite onto NurEine canvas, upload to Supabase.

    The pipeline:
      1. Stage 1: Prompt quality review (DeepSeek, fast text check)
      2. FLUX.1 [pro] generates a 4:3 paper collage illustration (with retry)
      3. Stage 2: Visual quality review with LLaVA-NeXT (retry up to 3x)
      4. Fresh-prompt regenerate (up to 2x) if quality still too low
      5. Composite onto exact brand canvas colour #F5F1EA for consistent look
      6. Upload to Supabase Storage as PNG

    Returns the public URL of the uploaded image, or None on failure.
    """
    if not image_prompt or not image_prompt.strip():
        log.warning("  Empty image prompt — skipping image generation.")
        return None

    # ---- Stage 1: Prompt quality review (DeepSeek, fast text check) ----
    if HAS_QUALITY_REVIEW:
        image_prompt, was_clean, retry_reason = prompt_quality_check(
            image_prompt, story_title, category, max_retries=2
        )
        if not was_clean:
            log.info("  Prompt fixed: %.100s...", image_prompt)

    # ---- Stage 2: Generate + quality review (with fresh-prompt regenerate) ----
    FRESH_PROMPT_MAX = 2  # Max fresh-prompt regenerations
    best_image_bytes: bytes | None = None
    best_qscore: float = 0.0

    for fresh_attempt in range(FRESH_PROMPT_MAX + 1):  # 0 = first run, 1..N = fresh prompts
        if fresh_attempt > 0:
            # ---- Fresh-prompt regenerate via DeepSeek ----
            log.info("  Fresh-prompt regenerate %d/%d for '%.60s'", fresh_attempt, FRESH_PROMPT_MAX, story_title)
            reason = f"Niedrige Bildqualität (Score {best_qscore:.1f}/10) für Story '{story_title}'"
            fix_instruction = (
                "Create a COMPLETELY DIFFERENT abstract symbol for this topic. "
                "Use a new metaphor. Avoid any shapes or concepts from the previous failed attempt. "
                "The image MUST be flat, elegant paper collage. Maximum editorial quality."
            )
            new_prompt = _regenerate_prompt_via_deepseek(image_prompt, reason, fix_instruction)
            if not new_prompt:
                log.warning("  Fresh prompt generation failed — falling back to original prompt")
                new_prompt = image_prompt
            image_prompt = new_prompt
            log.info("  New prompt: %.120s...", image_prompt)

        log.info("  Generating image: %.100s...", image_prompt)

        # Generate with retry on transient FAL failures
        image_bytes = generate_image_fal(image_prompt)
        if not image_bytes:
            log.warning("  First generation attempt failed, retrying once...")
            time.sleep(3)
            image_bytes = generate_image_fal(image_prompt)
            if not image_bytes:
                log.warning("  Image generation failed completely for '%.60s'", story_title)
                if fresh_attempt < FRESH_PROMPT_MAX:
                    continue  # Try again with fresh prompt
                return None

        # Quality review with LLaVA-NeXT (retry up to 3x, returns None on hard fail)
        if HAS_QUALITY_REVIEW:
            image_bytes, qscore, qretries, qfeedback = image_quality_review(
                image_bytes, story_title, category, image_prompt, generate_image_fal, max_retries=3
            )
            log.info("  Quality: %.1f/10 (%d retries) — %s", qscore, qretries, qfeedback)
        else:
            qscore, qfeedback = 10.0, "n/a"

        if image_bytes is not None:
            # Track best result
            if qscore > best_qscore:
                best_qscore = qscore
                best_image_bytes = image_bytes

            # Accept if quality is good enough
            if qscore >= 5.0:
                break

            log.warning("  Quality %.1f still below threshold — will try fresh prompt", qscore)
        else:
            log.warning("  Quality review hard-failed (score %.1f) — will try fresh prompt", qscore)

    else:
        # For-loop exhausted — use best result if we have one
        if best_image_bytes is None:
            log.error("  All fresh-prompt regenerate attempts failed for '%.60s'", story_title)
            return None
        log.info("  Fresh-prompt regenerate loop exhausted — using best image (score=%.1f)", best_qscore)
        image_bytes = best_image_bytes
        qscore = best_qscore

    # ---- Stage 3: Composite onto exact brand canvas colour ----
    image_bytes = composite_on_canvas(image_bytes)

    # ---- Stage 4: Upload to Supabase Storage ----
    short_id = uuid.uuid4().hex[:12]
    safe_title = (
        story_title.lower()
        .replace(" ", "-")
        .replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    )
    # Limit filename length and remove unsafe chars
    safe_title = "".join(c for c in safe_title if c.isalnum() or c == "-")[:40]
    filename = f"story-images/{safe_title}-{short_id}.png"

    public_url = supabase_upload_image(image_bytes, filename)
    return public_url


def composite_on_canvas(image_bytes: bytes) -> bytes:
    """Soft-composite the generated image onto the exact brand canvas #F5F1EA.

    Replaces near-white backgrounds with the brand canvas colour using
    a soft edge blend to avoid harsh transitions. For paper collage
    images this is a light touch — edges keep their organic feel.
    """
    try:
        from PIL import Image as PILImage
    except ImportError:
        return image_bytes

    try:
        img = PILImage.open(BytesIO(image_bytes)).convert("RGBA")
        w, h = img.size
        pixels = img.load()

        CANVAS = (245, 241, 234)  # #F5F1EA
        THRESHOLD = 225            # pixels with all channels >= this get replaced

        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a > 0 and r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
                    # Soft blend: how "white" the pixel is
                    whiteness = min(r, g, b) / 255.0
                    blend = whiteness ** 1.5  # bias toward replacing white
                    nr = int(CANVAS[0] * blend + r * (1 - blend))
                    ng = int(CANVAS[1] * blend + g * (1 - blend))
                    nb = int(CANVAS[2] * blend + b * (1 - blend))
                    pixels[x, y] = (nr, ng, nb, a)

        buf = BytesIO()
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    except Exception:
        return image_bytes


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def load_active_sources() -> list[dict[str, Any]]:
    """Load all active RSS sources from Supabase."""
    params = {"active": "eq.true", "select": "*"}
    try:
        sources = supabase_get("nureine_rss_sources", params=params)
        log.info("Loaded %d active RSS source(s)", len(sources))
        return sources
    except requests.RequestException as exc:
        log.error("Failed to load RSS sources from Supabase: %s", exc)
        return []


def log_cron_run(
    status: str,
    stories_added: int,
    articles_processed: int,
    errors: int,
    error_message: str | None = None,
) -> None:
    """Log a cron run to the cron_runs table."""
    record: dict[str, Any] = {
        "type": "fetch_stories",
        "stories_found": articles_processed,
        "stories_inserted": stories_added,
        "ran_at": datetime.now(timezone.utc).isoformat(),
        "error": error_message,
    }
    try:
        supabase_post("nureine_cron_runs", record)
        log.info("Cron run logged (status=%s, added=%d)", status, stories_added)
    except requests.RequestException as exc:
        log.error("Failed to log cron run: %s", exc)


def log_fetch_decision(
    source_name: str,
    beat: str | None,
    title: str,
    decision: str,
    reason: str | None = None,
    impact_score: int | None = None,
) -> None:
    """Protokolliert eine Redaktions-Entscheidung (Reporter-Transparenz, /admin/redaktion).

    decision: 'accepted' | 'rejected_prefilter' | 'rejected_ai'. Best-effort —
    ein Logging-Fehler darf den Fetch-Lauf NIE abbrechen.
    """
    try:
        supabase_post("nureine_fetch_log", {
            "source_name": source_name[:120] if source_name else None,
            "beat": beat,
            "title": (title or "")[:300],
            "decision": decision,
            "reason": (reason or "")[:120] or None,
            "impact_score": impact_score,
        })
    except Exception as exc:  # noqa: BLE001 — Logging darf nie den Lauf killen
        log.debug("fetch-log write failed: %s", exc)


def run() -> None:
    """Main execution: fetch feeds, analyze, generate images, insert.

    Optimized pipeline:
      1. Load sources sorted by priority (high-conversion first)
      2. Per-source limits instead of global MAX_ARTICLES_PER_RUN
      3. Local pre-filter to skip obviously non-qualifying articles before API call
    """
    start_time = time.time()
    articles_processed = 0
    articles_prefiltered = 0
    stories_added = 0
    errors = 0
    first_error: str | None = None

    # Track filter reasons for cron_runs auditing
    filter_reasons: dict[str, int] = {}

    # In-memory deduplication: track titles we've already inserted this run
    seen_titles_normalized: list[str] = []

    # 1. Load sources
    sources = load_active_sources()

    # Sort by priority (1 = highest, 4 = lowest)
    def _source_priority(src: dict[str, Any]) -> int:
        config = SOURCE_CONFIG.get(src.get("name", ""), DEFAULT_SOURCE_CONFIG)
        return config["priority"]

    sources.sort(key=_source_priority)

    if not sources:
        log.warning("No active RSS sources found — nothing to do.")
        log_cron_run("completed", 0, 0, 0)
        return

    # Log source order for debugging
    log.info(
        "Sources (sorted by priority): %s",
        ", ".join(
            f"{s['name']}(P{SOURCE_CONFIG.get(s.get('name',''), {'priority':9}).get('priority',9)})"
            for s in sources
        ),
    )

    # 2. Iterate sources and their entries
    for source in sources:
        if articles_processed >= MAX_ARTICLES_PER_RUN:
            log.info("Reached global max articles per run (%d), stopping.", MAX_ARTICLES_PER_RUN)
            break

        source_name = source.get("name", "Unbekannte Quelle")
        feed_url = source.get("url")
        # Reporter-Beat-Zuordnung (REPORTER_BOTS.md): Story erbt Beat + Quellentyp
        # ihrer Quelle für die Transparenz-Anzeige. NULL für Legacy-Quellen.
        source_beat = source.get("beat")
        source_kind = source.get("source_type")
        if not feed_url:
            log.warning("Source '%s' has no URL — skipping.", source_name)
            continue

        # Per-source limit
        source_cfg = SOURCE_CONFIG.get(source_name, DEFAULT_SOURCE_CONFIG)
        source_limit = source_cfg["max_per_run"]
        source_articles = 0

        log.info("Fetching feed: %s (%s) [limit=%d]", source_name, feed_url, source_limit)

        try:
            feed = feedparser.parse(feed_url)
        except Exception as exc:
            log.error("Failed to parse feed '%s': %s", feed_url, exc)
            errors += 1
            if first_error is None:
                first_error = str(exc)
            continue

        entries = feed.get("entries", [])
        if not entries:
            # Log empty feeds (Nature, WHO are expected to be broken)
            bozo = feed.get("bozo", 0)
            bozo_exc = feed.get("bozo_exception", "")
            log.info(
                "  No entries (bozo=%s, exc=%s) — feed may be broken.",
                bozo,
                str(bozo_exc)[:80] if bozo_exc else "none",
            )
            continue

        log.info("  Found %d entries.", len(entries))

        for entry in entries:
            if articles_processed >= MAX_ARTICLES_PER_RUN:
                break
            if source_articles >= source_limit:
                log.info(
                    "  Source '%s' reached per-run limit (%d entries processed).",
                    source_name,
                    source_limit,
                )
                break

            source_url = entry.get("link", "")
            if not source_url:
                log.debug("  Skipping entry with no link.")
                continue

            # ---- STAGE 1: Pre-filter (local, no API call) ----
            skip, prefilter_reason = _prefilter_entry(entry, source_name)
            if skip:
                filter_reasons[prefilter_reason] = filter_reasons.get(prefilter_reason, 0) + 1
                articles_prefiltered += 1
                log.debug("  Pre-filtered: %s (reason=%s)", entry.get("title", "")[:60], prefilter_reason)
                # Inhaltliche Ablehnungen protokollieren (broken_entry ist Rauschen → skip).
                if not prefilter_reason.startswith("broken"):
                    log_fetch_decision(source_name, source_beat, entry.get("title", ""),
                                       "rejected_prefilter", prefilter_reason)
                continue

            # ---- STAGE 2: Dedup check (Supabase query) ----
            try:
                if source_exists(source_url):
                    filter_reasons["db_duplicate"] = filter_reasons.get("db_duplicate", 0) + 1
                    log.debug("  Skipping (already in DB): %s", source_url)
                    continue
            except requests.RequestException as exc:
                log.warning("  Dup-check failed for %s: %s — will attempt insert.", source_url, exc)
                errors += 1
                if first_error is None:
                    first_error = str(exc)

            # ---- STAGE 3: AI Analysis (DeepSeek API call) ----
            prompt = build_prompt(entry, source_name)
            log.info("  Analyzing: %s", entry.get("title", "(kein Titel)"))
            raw = call_deepseek(prompt)
            articles_processed += 1
            source_articles += 1

            result = parse_ai_response(raw)

            if result is None:
                log.warning("  DeepSeek returned no valid result for: %s", source_url)
                errors += 1
                if first_error is None:
                    first_error = "DeepSeek returned unparseable response"
                time.sleep(API_DELAY_SECONDS)
                continue

            # ---- STAGE 4: AI Gatekeeping ----
            is_nureine = result.get("is_nureine", False)
            gut_filter_reason = result.get("gut_filter_reason")

            if not is_nureine:
                reason = gut_filter_reason or "unknown"
                filter_reasons[reason] = filter_reasons.get(reason, 0) + 1
                log.info("  Rejected (is_nureine=false, reason=%s): %s", reason, entry.get("title", "(kein Titel)"))
                log_fetch_decision(source_name, source_beat, entry.get("title", ""), "rejected_ai", reason)
                time.sleep(API_DELAY_SECONDS)
                continue

            story_title = result.get("title", "")

            # ---- STAGE 5: Near-duplicate check (in-memory) ----
            import re as _re  # noqa: PLC0415
            normalized = _re.sub(r"[^a-z0-9äöüß\s]", "", story_title.lower())
            normalized = _re.sub(r"\s+", " ", normalized).strip()

            new_words = set(normalized.split())
            is_duplicate = False
            for seen_title in seen_titles_normalized:
                seen_words = set(seen_title.split())
                if new_words and seen_words:
                    overlap = len(new_words & seen_words) / min(len(new_words), len(seen_words))
                    if overlap > 0.7:
                        log.info(
                            "  Skipping near-duplicate (%.0f%% word overlap with '%s'): %s",
                            overlap * 100,
                            seen_title,
                            story_title,
                        )
                        is_duplicate = True
                        filter_reasons["near_duplicate"] = filter_reasons.get("near_duplicate", 0) + 1
                        break

            if is_duplicate:
                time.sleep(API_DELAY_SECONDS)
                continue

            seen_titles_normalized.append(normalized)

            # ---- STAGE 6: Image generation ----
            image_url: str | None = None
            if IMAGE_GENERATION_ENABLED:
                image_prompt = result.get("image_prompt", "")
                if image_prompt:
                    try:
                        image_url = generate_and_upload_image(image_prompt, story_title, result.get("category", "gemeinschaft"))
                    except Exception as exc:
                        log.error("  Image pipeline failed for '%s': %s", story_title, exc)
                        errors += 1
                        if first_error is None:
                            first_error = str(exc)
                    time.sleep(IMAGE_API_DELAY_SECONDS)
                else:
                    log.info("  No image_prompt in AI response — skipping image generation.")
            else:
                log.info("  Image generation disabled (no FAL_KEY) — skipping.")

            # ---- STAGE 7: Insert into Supabase ----
            summary = result.get("summary", "")
            body = result.get("body", summary) or summary or story_title
            actual_reading_time = max(1, round(len(body.split()) / 200))
            # summary is NOT NULL in the DB — never insert an empty/None summary.
            safe_summary = summary or (body[:200] if body else story_title)
            story_record: dict[str, Any] = {
                "title": story_title,
                "subtitle": result.get("subtitle", ""),
                "body_markdown": body,
                "summary": safe_summary,
                # normalize_category guarantees a value the CHECK constraint accepts
                "category": normalize_category(result.get("category")),
                "region": result.get("region", ""),
                "region_code": result.get("region_code", ""),
                "lat": result.get("lat"),
                "lng": result.get("lng"),
                "image_url": image_url,
                "source_url": source_url,
                "source_name": source_name,
                # impact_reach is BIGINT; clamp to its ceiling so no model
                # estimate can ever overflow it again. durability/evidence are 0..100.
                "impact_reach": _safe_int(result.get("impact_reach"), lo=0, hi=_BIGINT_MAX),
                "impact_durability": _safe_int(result.get("impact_durability"), lo=0, hi=100),
                "impact_evidence": _safe_int(result.get("impact_evidence"), lo=0, hi=100),
                "impact_score": _compute_impact_score(
                    result.get("impact_score"),
                    result.get("impact_reach"),
                    result.get("impact_durability"),
                    result.get("impact_evidence"),
                ),
                "reading_time_min": actual_reading_time,
                "published_at": entry.get("published", entry.get("updated", datetime.now(timezone.utc).isoformat())),
                # Family feature: only set when DeepSeek judged the story kid-suitable.
                "kid_min_age": _safe_kid_age(result.get("kid_min_age")),
                "kid_explainer": _safe_text(result.get("kid_explainer"), 300),
                "conversation_starter": _safe_text(result.get("conversation_starter"), 300),
            }

            # ---- Editorial pipeline: emotion + channel fit + social texts ----
            # ig_ok requires impact_score >= 70 — enforce server-side too, so a
            # generous model can't push a weak story onto Instagram.
            _impact = story_record.get("impact_score") or 0
            _ig_ok = _safe_bool(result.get("ig_ok")) and _impact >= 70
            story_record["emotion"] = _safe_emotion(result.get("emotion"))
            story_record["ig_ok"] = _ig_ok
            story_record["wa_ok"] = _safe_bool(result.get("wa_ok"))
            story_record["ig_hook"] = _safe_text(result.get("ig_hook"), 120) if _ig_ok else None
            story_record["wa_opener"] = (
                _safe_text(result.get("wa_opener"), 120) if story_record["wa_ok"] else None
            )
            story_record["slides"] = _safe_slides(result.get("slides")) if _ig_ok else None
            story_record["ig_caption"] = _safe_text(result.get("ig_caption"), 600) if _ig_ok else None
            # Jugendschutz-Flag (default false). Verhüllt heikle Stories im Frontend dezent.
            story_record["sensitive"] = _safe_bool(result.get("sensitive"))
            # Wirkungsindex-Aufschlüsselung (3. Balken-Achse + Relevanz-Satz + Teilen-Satz).
            story_record["impact_reach_score"] = _safe_int(result.get("impact_reach_score"), lo=0, hi=100)
            story_record["impact_explainer"] = _safe_text(result.get("impact_explainer"), 200)
            story_record["share_hook"] = _safe_text(result.get("share_hook"), 220)
            # Reporter-Beat-Herkunft (Transparenz: welcher Beat / Quellentyp).
            if source_beat:
                story_record["beat"] = source_beat
            if source_kind:
                story_record["source_type"] = source_kind

            # Parse published date
            raw_published = story_record["published_at"]
            if isinstance(raw_published, str) and not raw_published.endswith("Z"):
                try:
                    from email.utils import parsedate_to_datetime  # noqa: PLC0415
                    parsed = parsedate_to_datetime(raw_published)
                    story_record["published_at"] = parsed.isoformat()
                except (ValueError, TypeError, AttributeError):
                    pass

            try:
                supabase_post("nureine_stories", story_record)
                stories_added += 1
                log_fetch_decision(source_name, source_beat, story_record.get("title", ""),
                                   "accepted", None, story_record.get("impact_score"))
                log.info(
                    "  INSERTED: %s [%s — %s] image=%s",
                    story_record.get("title", ""),
                    story_record.get("category", ""),
                    story_record.get("region", ""),
                    "yes" if image_url else "no",
                )
            except requests.RequestException as exc:
                log.error("  Failed to insert story '%s': %s", story_record.get("title", ""), exc)
                errors += 1
                if first_error is None:
                    first_error = str(exc)

            time.sleep(API_DELAY_SECONDS)

    # ---- STAGE 8: Audio-TTS for top-2 stories (ElevenLabs) ----
    if stories_added > 0 and ELEVENLABS_API_KEY:
        log.info("--- Audio-TTS: Vertonung der Top-%d Stories ---", MAX_AUDIO_STORIES)
        try:
            top_stories = supabase_get(
                "nureine_stories",
                params={
                    "select": "id,title,body_markdown,summary,impact_score",
                    "audio_url": "is.null",
                    "order": "impact_score.desc",
                    "limit": str(MAX_AUDIO_STORIES),
                },
            )
            audio_count = 0
            for ts in top_stories:
                ts_id = ts.get("id")
                ts_title = ts.get("title", "")
                # Vertonungstext: body_markdown bevorzugt, sonst summary
                text_to_read = ts.get("body_markdown") or ts.get("summary") or ""
                if not text_to_read or len(text_to_read) < 100:
                    log.info("  Überspringe '%s' — zu wenig Text (%d Zeichen)", ts_title, len(text_to_read))
                    continue

                log.info("  Generiere Audio für '%s' (impact=%s, %d Zeichen)...",
                         ts_title, ts.get("impact_score"), len(text_to_read))
                mp3_bytes = generate_audio_elevenlabs(text_to_read)
                public_url = None

                if mp3_bytes:
                    # Dateiname: story_id.mp3
                    audio_filename = f"{ts_id}.mp3"
                    public_url = upload_audio_to_storage(mp3_bytes, audio_filename)

                # Fallback: OpenAI TTS via Supabase Edge Function
                if not public_url:
                    log.info("  ElevenLabs nicht verfügbar — Fallback auf OpenAI gpt-4o-mini-tts...")
                    public_url = generate_audio_via_edge_function(text_to_read, ts_id)

                if not public_url:
                    continue

                # audio_url in DB setzen via PATCH
                patch_url = f"{SUPABASE_URL}/rest/v1/nureine_stories?id=eq.{ts_id}"
                try:
                    resp = requests.patch(
                        patch_url,
                        headers=supabase_headers(),
                        json={"audio_url": public_url},
                        timeout=15,
                    )
                    resp.raise_for_status()
                    audio_count += 1
                    log.info("  Audio gespeichert: %s", public_url)
                except requests.RequestException as exc:
                    log.error("  Failed to update audio_url for '%s': %s", ts_title, exc)

            log.info("Audio-TTS complete — %d/%d stories vertont.", audio_count, len(top_stories))
        except Exception as exc:
            log.error("Audio-TTS stage failed: %s", exc)

    # Log summary
    if filter_reasons:
        log.info("Filter reason summary: %s", dict(filter_reasons))

    elapsed = time.time() - start_time
    log.info(
        "Run complete — prefiltered=%d processed=%d added=%d errors=%d (%.1fs)",
        articles_prefiltered,
        articles_processed,
        stories_added,
        errors,
        elapsed,
    )
    log_cron_run(
        status="completed" if errors == 0 else "completed_with_errors",
        stories_added=stories_added,
        articles_processed=articles_processed,
        errors=errors,
        error_message=first_error,
    )


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    log.info("=" * 60)
    log.info("NurEine — Story Fetcher")
    log.info("=" * 60)
    try:
        run()
    except Exception as exc:
        log.exception("Unhandled exception in main: %s", exc)
        log_cron_run(
            status="failed",
            stories_added=0,
            articles_processed=0,
            errors=1,
            error_message=str(exc),
        )
        sys.exit(1)
