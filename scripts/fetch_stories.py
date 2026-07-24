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
import hashlib
import json
import os
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
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
# Claude ist ab 2026-07-09 das primäre Analyse-Modell (Aaron: DeepSeek liefert
# unklare/abgeschnittene Texte). Ist ANTHROPIC_API_KEY gesetzt, läuft der
# Story-Analyse-Call über Claude; sonst Fallback auf DeepSeek (kein Bruch).
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
FAL_KEY = os.environ.get("FAL_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

# IndexNow ping after a run (fast Bing/Yandex discovery for a young domain).
# Both optional — if either is missing the ping is skipped silently.
CRON_SECRET = os.environ.get("CRON_SECRET")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "https://nureine.de")

DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"

# Claude (Anthropic) — primäres Analyse-Modell. Sonnet trifft Qualität/Kosten:
# klare, vollständige deutsche Texte ohne den Kuriositäts-Bias von DeepSeek.
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages"

# fal.ai FLUX.1 [pro]
FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"  # 1024x768
FAL_NUM_IMAGES = 1
FAL_POLL_INTERVAL = 3  # seconds between status polls (pro is slower)
FAL_POLL_TIMEOUT = 180  # max seconds to wait for generation

# ─── DREI-STUFEN-QUALITÄTSMODELL (Aaron 2026-07-10) ─────────────────────────────
#   ① impact < STORY_MIN_IMPACT      → kommt GAR NICHT rein (schon hier verworfen)
#   ② STORY_MIN_IMPACT .. unter Perle → rein in DB/Archiv/Feed, aber OHNE KI-Bild
#   ③ Perle (Chefredakteur, nachts)  → Premium-Seedream-Bild via Bild-Regie-Routine
# Rationale: fal.ai-Kosten sehr konsequent sparen, Feed nur mit relevanten Stories.
# Verteilung (14d): <55 = ~9/Tag schwache Stories (avg_resonance 10-15) → raus.

# ① Aufnahme-Untergrenze: darunter ist die Story für uns nicht relevant genug.
STORY_MIN_IMPACT = 55

# ③ Bebilderung: Der FETCH generiert bewusst KEINE Bilder mehr (auch nicht für
# ig_ok). Die einzige Bildquelle sind die TAGES-PERLEN des Chefredakteurs, die
# nachts von der Bild-Regie-Routine (Seedream) bebildert werden — "immer die
# relativ besten des Tages", passt sich an schwache/starke Tage an. Der Gate hier
# ist nur noch ein Not-Schalter: praktisch unerreichbar (101), damit im normalen
# Lauf nichts serverseitig teuer generiert wird. Auf 70 setzen NUR, wenn man den
# alten Fetch-Bild-Weg reaktivieren will (dann wieder ~$0.04/Bild).
IMAGE_GATE_MIN_IMPACT = 101  # effektiv AUS — Bebilderung macht die Perlen-Routine
IMAGE_GATE_INCLUDE_IG_OK = False  # ig_ok triggert KEIN Fetch-Bild mehr

# Qualitäts-Schwellen für die (jetzt wenigen) generierten Bilder. Weil der Gate nur
# noch Hero-Kandidaten durchlässt, können wir bei diesen HÖHERE Qualität verlangen:
# "wenige, aber gute" statt "viele mittelmäßige".
IMAGE_QUALITY_ACCEPT = 6.5   # gut genug → Retries stoppen (früher 5.0 = mittelmäßig)
IMAGE_QUALITY_FLOOR = 5.0    # nach allen Retries drunter → lieber KEIN Bild (Emoji-Fallback)

# ElevenLabs TTS (Vorlesen-Feature)
# Free-Tier: ~10k chars/month. Danach: gpt-4o-mini-tts.
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")  # George — ruhig, männlich, deutsch
# v3 unterstützt Audio-Tags ([warmly], [thoughtful pause] …) — gleicher Stand wie der
# Admin-Endpoint generate-audio. Fallback auf multilingual_v2 nur falls v3 mal wegfällt.
ELEVENLABS_MODEL = "eleven_v3"
ELEVENLABS_TTS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

# Supabase Storage buckets
STORAGE_BUCKET = "story_images"
AUDIO_STORAGE_BUCKET = "story_audio"

# Audio feature: nur Top-Story pro Run vertonen
# Vorlesen ist standardmäßig AUS (Token-Schutz). Scharf entweder per env AUDIO_AUTOGEN=true
# ODER per DB-Setting audio_autopilot='true' (Toggle im /admin/audio-Cockpit — kein
# Workflow-Edit nötig). Dann 1 Story/Run, nur Zusammenfassung (~400 Zeichen).
AUDIO_AUTOGEN = os.environ.get("AUDIO_AUTOGEN", "").lower() == "true"
MAX_AUDIO_STORIES = 1

# Emotion (relief/wonder/hope/pride/warmth) → Eröffnungs-Audio-Tag (nur eleven_v3).
# Gleiches Mapping wie src/routes/api/admin/stories/[id]/generate-audio/+server.ts.
AUDIO_EMOTION_TAGS: dict[str, str] = {
    "relief": "[gently]",
    "wonder": "[with quiet wonder]",
    "hope": "[warmly]",
    "pride": "[warmly]",
    "warmth": "[warmly]",
}

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
    # (WHO News → jetzt priority 2 als Reporter-Primärquelle, siehe unten)
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
    # ── 2026-06-11: Reporter-Beat-Quellen. Primärquellen (offizielle Statistik /
    # Peer-Review) priority 2, damit sie nicht hinter Low-Conversion verhungern.
    "WHO News":               {"max_per_run": 4,  "priority": 2},
    "UN News":                {"max_per_run": 5,  "priority": 2},
    "Johns Hopkins Hub":      {"max_per_run": 5,  "priority": 2},
    # improvement #12 (Verbesserer-Agent): ScienceDaily Tech war P2/5, lieferte aber
    # über 89 Stories fast nur Wissenschafts-Kuriosität (Ø impact 46.8, nur 1 echte
    # Impact-Perle ≥75, 38 unbewertet) — kein Nutzen für echte Menschen. Auf P3
    # heruntergestuft (wird nach den relevanten Quellen verarbeitet) + Durchsatz 5→3,
    # ohne die Quelle abzuschalten (die seltene echte Perle kommt weiter durch).
    "ScienceDaily Tech":      {"max_per_run": 3,  "priority": 3},
    "The Conversation":       {"max_per_run": 6,  "priority": 2},
    "Medical Xpress":         {"max_per_run": 6,  "priority": 3},
    "STAT News":              {"max_per_run": 5,  "priority": 3},
    "CleanTechnica":          {"max_per_run": 6,  "priority": 3},
    "pv magazine":            {"max_per_run": 5,  "priority": 3},
    "Yale Climate Connections": {"max_per_run": 5, "priority": 3},
    "TechXplore":             {"max_per_run": 5,  "priority": 3},
}
# max_per_run 6→8: gründlicher beobachten (auch kleinere/tiefere Meldungen je Quelle),
# aber moderat — bei 13+ Quellen würde 10 das 30-Min-GitHub-Timeout reißen (Runs wurden
# gecancelt). 8 ist der Kompromiss zwischen Tiefe und Laufzeit.
DEFAULT_SOURCE_CONFIG = {"max_per_run": 8, "priority": 3}

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


# Die sechs IG-Hook-Typen (empirisch aus dem Audit der letzten 200 Stories abgeleitet).
# Ein gültiger Typ ist zugleich der server-seitige Beleg, dass ig_ok berechtigt ist.
_ALLOWED_IG_HOOK_TYPES = {"zahl", "sieg", "kontrast", "wow", "mensch", "charme"}


def _safe_ig_hook_type(value: Any) -> str | None:
    """Accept one of the six IG hook types, else None (which gates ig_ok off)."""
    if not isinstance(value, str):
        return None
    t = value.strip().lower()
    return t if t in _ALLOWED_IG_HOOK_TYPES else None


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

# Harte Laufzeit-Bremse gegen das 30-Min-GitHub-Timeout. Bei 30+ Quellen kann die
# Summe der Per-Source-Limits darüber liegen — dann greift dieser Deckel zuerst und
# der Lauf bleibt unter dem Timeout (Runs wurden sonst gecancelt).
MAX_ARTICLES_PER_RUN = 110
# Pause between API calls (seconds) to stay within rate limits.
# Im --export/--import-Routinemodus gibt es keinen externen LLM-Call → die Pause
# ist reine Wartezeit und kann per env auf 0 gesetzt werden (FETCH_API_DELAY).
API_DELAY_SECONDS = float(os.environ.get("FETCH_API_DELAY", "1.5"))
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
# Analyse-Modell: im Routine-Modus (--export/--import) macht die Claude-Routine die
# Analyse → kein Key nötig. Sonst mindestens EINES von Claude/DeepSeek.
_ROUTINE_MODE = "--export" in sys.argv or "--import" in sys.argv
if not _ROUTINE_MODE and not ANTHROPIC_API_KEY and not DEEPSEEK_API_KEY:
    MISSING_ENVVARS.append("ANTHROPIC_API_KEY oder DEEPSEEK_API_KEY (oder --export/--import nutzen)")
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


def _sql_quote(value: Any) -> str:
    """Render a Python value as a Postgres SQL literal for the spool INSERT."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (dict, list)):
        return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(value).replace("'", "''") + "'"


def spool_story_sql(record: dict[str, Any], spool_path: str) -> None:
    """Append an INSERT for one story to the SQL spool (Supabase-402-Fallback).

    Reuses the EXACT record the normal insert path built (all gates/coercions
    already applied), so the parked SQL is faithful. ON CONFLICT auf source_url
    macht den Nachtrag idempotent, falls die Story bis dahin schon existiert.
    """
    cols = list(record.keys())
    vals = ", ".join(_sql_quote(record[c]) for c in cols)
    col_list = ", ".join(cols)
    # Kein UNIQUE-Constraint auf source_url in der DB → statt ON CONFLICT ein
    # WHERE-NOT-EXISTS-Guard: idempotent, überspringt bereits vorhandene Quellen.
    src = _sql_quote(record.get("source_url"))
    stmt = (
        f"INSERT INTO nureine_stories ({col_list})\n"
        f"SELECT {vals}\n"
        f"WHERE NOT EXISTS (SELECT 1 FROM nureine_stories WHERE source_url = {src});\n\n"
    )
    with open(spool_path, "a", encoding="utf-8") as fh:
        fh.write(stmt)


    """
    params = {"active": "eq.true", "select": "*"}
    try:
        sources = supabase_get("nureine_rss_sources", params=params)
        log.info("Loaded %d active RSS source(s)", len(sources))
        return sources
    except requests.RequestException as exc:
        log.error("Failed to load RSS sources from Supabase: %s", exc)
        fallback = os.environ.get("FETCH_SOURCES_FILE")
        if fallback and os.path.exists(fallback):
            try:
                with open(fallback, encoding="utf-8") as fh:
                    data = json.load(fh)
                sources = [s for s in data if s.get("active", True)] if isinstance(data, list) else []
                log.warning("Fallback: %d Quelle(n) aus lokaler Datei %s geladen (Supabase gesperrt).",
                            len(sources), fallback)
                return sources
            except Exception as fexc:  # noqa: BLE001
                log.error("Fallback-Quellendatei %s unlesbar: %s", fallback, fexc)
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
        # Verbesserung #30: Wenn schon das Fehler-Logging nicht durchkommt, ist die
        # DB selbst der Ausfall (z.B. 402/Quota). Dann bleibt NICHTS zurueck, worüber
        # ein Kollege den Stillstand sehen koennte — darum hier maximal laut werden.
        log.error("Failed to log cron run: %s", exc)
        log.error(
            "ACHTUNG: Lauf (status=%s) konnte NICHT in nureine_cron_runs protokolliert "
            "werden — Supabase antwortet nicht. Der Stillstand ist in der DB unsichtbar; "
            "auf LUECKEN in cron_runs pruefen, nicht auf Fehlerzeilen.",
            status,
        )


def ping_indexnow(recent: int) -> None:
    """Tell the site to submit the N newest stories to IndexNow.

    Delegates URL construction to the SvelteKit endpoint (/api/cron/indexnow),
    which already knows the correct slug format — no slug logic duplicated here.
    Best-effort: any failure is logged, never fatal.
    """
    if not CRON_SECRET:
        log.info("IndexNow ping skipped — CRON_SECRET not set.")
        return
    try:
        resp = requests.post(
            f"{PUBLIC_BASE_URL}/api/cron/indexnow",
            headers={"Authorization": f"Bearer {CRON_SECRET}"},
            json={"recent": recent},
            timeout=20,
        )
        if resp.ok:
            log.info("IndexNow ping ok (recent=%d): %s", recent, resp.text[:200])
        else:
            log.warning("IndexNow ping returned %d: %s", resp.status_code, resp.text[:200])
    except requests.RequestException as exc:
        log.warning("IndexNow ping failed: %s", exc)


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

    # Dedup über Titel-Wortüberlappung. WICHTIG: mit bestehenden DB-Titeln der letzten
    # 7 Tage VORLADEN — sonst greift der Near-Duplicate-Check nur INNERHALB eines Laufs
    # und dieselbe Meldung aus zwei Quellen (z.B. Grist 07:35 + Mongabay 19:04) landet
    # doppelt. Cross-Run-Schutz.
    seen_titles_normalized: list[str] = []
    try:
        _recent_iso = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        _recent = supabase_get(
            "nureine_stories",
            params={"select": "title", "created_at": f"gte.{_recent_iso}", "limit": "500"},
        )
        for _row in _recent:
            _t = re.sub(r"[^a-z0-9äöüß\s]", "", (_row.get("title") or "").lower())
            _t = re.sub(r"\s+", " ", _t).strip()
            if _t:
                seen_titles_normalized.append(_t)
        log.info("Dedup vorgeladen mit %d DB-Titeln (letzte 7 Tage)", len(seen_titles_normalized))
    except Exception as exc:  # noqa: BLE001 — Vorladen optional, Lauf läuft auch ohne
        log.warning("Konnte bestehende Titel nicht vorladen (Dedup nur innerhalb Lauf): %s", exc)

    # 1. Load sources
    sources = load_active_sources()

    # Sort by priority (1 = highest, 4 = lowest)
    def _source_priority(src: dict[str, Any]) -> int:
        config = SOURCE_CONFIG.get(src.get("name", ""), DEFAULT_SOURCE_CONFIG)
        return config["priority"]

    sources.sort(key=_source_priority)

    if not sources:
        # Hierher kommt man jetzt nur noch, wenn Supabase ANTWORTET und wirklich
        # 0 aktive Quellen liefert (echter Konfig-Zustand) — Ladefehler fliegen
        # oben als SourceLoadError. Trotzdem kein Normalfall: ohne Quellen gibt es
        # nie wieder Nachschub, das ist ein Alarm, kein ruhiges "completed".
        log.error("Keine aktive RSS-Quelle in nureine_rss_sources — Pipeline haette keinen Nachschub.")
        log_cron_run("failed", 0, 0, 1, error_message="Keine aktiven RSS-Quellen konfiguriert")
        sys.exit(1)

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

        # Scraper-Quellen (kein RSS): Story-Liste per HTML-Scrape statt feedparser.
        if source_kind == "scraper":
            try:
                entries = scrape_source_entries(source_name, limit=source_limit)
            except Exception as exc:
                log.error("Scrape für '%s' fehlgeschlagen: %s", source_name, exc)
                errors += 1
                if first_error is None:
                    first_error = str(exc)
                continue
            if not entries:
                log.info("  Keine Story-Links gescrapt — Quelle evtl. blockiert/umgebaut.")
                continue
        else:
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

            # ---- STAGE 3: AI Analysis ----
            prompt = build_prompt(entry, source_name)
            log.info("  Analyzing: %s", entry.get("title", "(kein Titel)"))
            raw = call_deepseek(prompt)
            articles_processed += 1
            source_articles += 1

            # Export-Modus: Prompt wurde gesammelt (raw=None) → Story überspringen,
            # KEIN Fehler, KEIN Retry (sonst doppelter Hash). Die Claude-Routine
            # analysiert die exportierten Prompts und der --import-Lauf inserted.
            if _EXPORT_PATH:
                continue

            result = parse_ai_response(raw)

            # Import-Modus: keine Antwort für diesen Artikel (Routine hat ihn nicht
            # analysiert oder verworfen) → still überspringen, kein Fehler/Retry.
            if _IMPORT_PATH and raw is None:
                continue

            if result is None and raw is not None and not _IMPORT_PATH:
                # Ein Retry mit explizitem JSON-Reminder rettet die meisten Faelle.
                log.info("  Parse failed, retrying once with JSON reminder")
                raw = call_deepseek(prompt + "\n\nWICHTIG: Antworte AUSSCHLIESSLICH mit dem validen JSON-Objekt. Kein Text davor oder danach.")
                result = parse_ai_response(raw)

            if result is None:
                log.warning("  DeepSeek returned no valid result for: %s", source_url)
                errors += 1
                if first_error is None:
                    snippet = (raw or "")[:200].replace("\n", " ")
                    first_error = f"DeepSeek unparseable response: {snippet or '(empty)'}"
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

            # ---- STAGE 4b: WIRKUNGS-UNTERGRENZE (Stufe ①, Aaron 2026-07-10) ----
            # Auch positive/valide Stories fliegen raus, wenn ihr Wirkungsindex zu
            # niedrig ist ("interessiert keinen"). Denselben Score wie beim Insert
            # berechnen, damit die Grenze exakt der gespeicherte Wert ist.
            _gate_impact = _compute_impact_score(
                result.get("impact_score"),
                result.get("impact_reach"),
                result.get("impact_durability"),
                result.get("impact_evidence"),
            ) or 0
            if _gate_impact < STORY_MIN_IMPACT:
                filter_reasons["impact_too_low"] = filter_reasons.get("impact_too_low", 0) + 1
                log.info(
                    "  Rejected (impact %s < %s): %s",
                    _gate_impact, STORY_MIN_IMPACT, entry.get("title", "(kein Titel)"),
                )
                log_fetch_decision(
                    source_name, source_beat, entry.get("title", ""),
                    "rejected_impact", f"impact={_gate_impact}<{STORY_MIN_IMPACT}",
                    impact_score=_gate_impact,
                )
                time.sleep(API_DELAY_SECONDS)
                continue

            story_title = result.get("title", "")

            # ---- STAGE 5: Near-duplicate check (in-memory) ----
            # DeepSeek formuliert Titel frei — dieselbe Nachricht aus zwei Quellen
            # heißt z.B. "Solarstrom überholt Kohle" vs "Solarstrom erstmals stärker
            # als Kohle". Darum: Stopp-/Füllwörter raus und nur SIGNIFIKANTE
            # Kernwörter (>3 Zeichen) vergleichen — sonst verwässern "in/den/als/…"
            # die Überlappung unter die Schwelle. Schwelle 0.6 (statt 0.7), weil
            # der Kernwort-Vergleich präziser ist.
            import re as _re  # noqa: PLC0415
            _STOP = {
                "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "und",
                "oder", "in", "im", "an", "am", "auf", "aus", "mit", "für", "von", "vom",
                "zu", "zum", "zur", "bei", "als", "wie", "ist", "sind", "wird", "werden",
                "nach", "über", "unter", "vor", "erstmals", "neuer", "neue", "neues",
                "welt", "welten", "erste", "ersten", "erster",
            }
            def _core(t: str) -> set[str]:
                t = _re.sub(r"[^a-z0-9äöüß\s]", "", t.lower())
                return {w for w in t.split() if len(w) > 3 and w not in _STOP}
            normalized = _re.sub(r"\s+", " ", _re.sub(r"[^a-z0-9äöüß\s]", "", story_title.lower())).strip()

            new_core = _core(story_title)
            is_duplicate = False
            for seen_title in seen_titles_normalized:
                seen_core = _core(seen_title)
                if new_core and seen_core:
                    shared = new_core & seen_core
                    overlap = len(shared) / min(len(new_core), len(seen_core))
                    # ≥60% Kernwort-Überlappung, ≥2 gemeinsame Kernwörter UND mind.
                    # ein gemeinsames LANGES Wort (>6 Zeichen) — das trägt das
                    # eigentliche Thema. Verhindert Falsch-Positive, bei denen sich
                    # zwei Titel nur generische Wörter teilen ("weltweite",
                    # "tiefststand"), aber verschiedene Themen meinen
                    # (Kinder- vs. Säuglingssterblichkeit).
                    _has_long = any(len(w) > 6 for w in shared)
                    if overlap >= 0.6 and len(shared) >= 2 and _has_long:
                        log.info(
                            "  Skipping near-duplicate (%.0f%% Kernwort-Überlappung mit '%s'): %s",
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

            # ---- STAGE 6: Image generation (nur für Hero-/Post-Kandidaten) ----
            image_url: str | None = None
            # BILD-GATE (Stufe ③): Der Fetch bebildert normalerweise NICHT mehr —
            # die Tages-Perlen des Chefredakteurs werden nachts von der Bild-Regie
            # (Seedream) bebildert. IMAGE_GATE_MIN_IMPACT=101 → praktisch nie wahr;
            # ig_ok triggert kein Bild mehr (IMAGE_GATE_INCLUDE_IG_OK=False).
            _img_impact = result.get("impact_score", 0) or 0
            _img_ig_ok = bool(result.get("ig_ok"))
            image_worthy = _img_impact >= IMAGE_GATE_MIN_IMPACT or (
                IMAGE_GATE_INCLUDE_IG_OK and _img_ig_ok
            )
            # Spool-Modus (Supabase gesperrt): Storage-Upload unmöglich → KEIN Bild.
            # Die Bild-Regie bebildert die Perlen später ohnehin separat.
            if os.environ.get("FETCH_SQL_SPOOL"):
                image_worthy = False

            if IMAGE_GENERATION_ENABLED and image_worthy:
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
            elif IMAGE_GENERATION_ENABLED and not image_worthy:
                log.info(
                    "  Bild-Gate: übersprungen (impact=%s, ig_ok=%s) — Emoji-Fallback. Spart Kosten.",
                    _img_impact, _img_ig_ok,
                )
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
            # IG-Eignung = STOPP-KRAFT (ein starker Hook-Typ), NICHT Wirkungsindex.
            # Audit der letzten 200 Stories (2026-06-21): altes impact>=70-Gate + hope-Ausschluss
            # warfen ~30 gute IG-Stories weg (Recall kaputt, 7% statt ~22%).
            # Neue Gates (server-seitig gespiegelt, damit ein großzügiges Modell nicht durchrutscht):
            #   (A) gültiger Hook-Typ vorhanden (Beleg, dass ein konkreter Hook trägt),
            #   (B) Wirkungs-Schwelle impact>=65 — AUSSER Hook ist "mensch"/"charme" (Herz/Charme
            #       braucht keine Weltwirkung; das rettet Krähe, Flamingo-Küken etc.),
            #   (C) DACH-Relevanz nicht zu fern (weicher Faktor; harter Floor nur bei sehr fern <25).
            _ig_hook_type = _safe_ig_hook_type(result.get("ig_hook_type"))
            _impact = story_record.get("impact_score") or 0
            _dach = _safe_int(result.get("dach_relevanz"), lo=0, hi=100)
            _impact_ok = _impact >= 65 or _ig_hook_type in ("mensch", "charme")
            _dach_ok = (_dach or 0) >= 25  # nur die ganz fernen "geht mich nichts an"-Themen raus
            _ig_ok = (
                _safe_bool(result.get("ig_ok"))
                and _ig_hook_type is not None
                and _impact_ok
                and _dach_ok
            )
            story_record["emotion"] = _safe_emotion(result.get("emotion"))
            story_record["dach_relevanz"] = _dach
            story_record["ig_ok"] = _ig_ok
            story_record["ig_hook_type"] = _ig_hook_type if _ig_ok else None
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

            _sql_spool = os.environ.get("FETCH_SQL_SPOOL")
            if _sql_spool:
                # Supabase-402-Fallback: Story nicht per REST inserten, sondern als
                # INSERT-SQL parken. Der Nachtrag lädt sie später ein.
                try:
                    spool_story_sql(story_record, _sql_spool)
                    stories_added += 1
                    log.info(
                        "  SPOOLED: %s [%s — %s] impact=%s",
                        story_record.get("title", ""),
                        story_record.get("category", ""),
                        story_record.get("region", ""),
                        story_record.get("impact_score"),
                    )
                except Exception as exc:  # noqa: BLE001
                    log.error("  Failed to spool story '%s': %s", story_record.get("title", ""), exc)
                    errors += 1
                    if first_error is None:
                        first_error = str(exc)
                time.sleep(API_DELAY_SECONDS)
                continue
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

    # ---- STAGE 8: Audio-TTS (ElevenLabs) — nur wenn scharf (env oder Admin-Toggle) ----
    if stories_added > 0 and ELEVENLABS_API_KEY and audio_autogen_enabled():
        log.info("--- Audio-TTS: Vertonung der Top-%d Stories (nur Zusammenfassung) ---", MAX_AUDIO_STORIES)
        try:
            top_stories = supabase_get(
                "nureine_stories",
                params={
                    "select": "id,title,body_markdown,summary,impact_score,emotion",
                    "audio_url": "is.null",
                    "order": "impact_score.desc",
                    "limit": str(MAX_AUDIO_STORIES),
                },
            )
            audio_count = 0
            for ts in top_stories:
                ts_id = ts.get("id")
                ts_title = ts.get("title", "")
                # Token-Spar-Modus: nur die Zusammenfassung vorlesen (~400 Zeichen),
                # NICHT den ganzen Artikel — schont das ElevenLabs-Kontingent.
                text_to_read = ts.get("summary") or ts.get("body_markdown") or ""
                if not text_to_read or len(text_to_read) < 60:
                    log.info("  Überspringe '%s' — zu wenig Text (%d Zeichen)", ts_title, len(text_to_read))
                    continue

                log.info("  Generiere Audio für '%s' (impact=%s, %d Zeichen)...",
                         ts_title, ts.get("impact_score"), len(text_to_read))
                mp3_bytes = generate_audio_elevenlabs(text_to_read, ts.get("emotion"))
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

    # Announce new stories to IndexNow (+ hub pages) so Bing/Yandex crawl them
    # within minutes. Only when something actually got inserted this run.
    if stories_added > 0:
        ping_indexnow(recent=min(stories_added + 5, 50))


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
def _arg_value(flag: str) -> str | None:
    """Wert eines --flag <wert> aus argv holen."""
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return None


if __name__ == "__main__":
    log.info("=" * 60)
    log.info("NurEine — Story Fetcher")
    log.info("=" * 60)
    # Routine-Modus: --export sammelt Analyse-Prompts, --import setzt Antworten ein.
    _EXPORT_PATH = _arg_value("--export") or _EXPORT_PATH
    _IMPORT_PATH = _arg_value("--import") or _IMPORT_PATH
    if _EXPORT_PATH:
        # frische Export-Datei je Lauf
        try:
            open(_EXPORT_PATH, "w").close()
        except Exception:  # noqa: BLE001
            pass
        log.info("EXPORT-Modus → Analyse-Prompts nach %s (keine KI, kein Insert)", _EXPORT_PATH)
    if _IMPORT_PATH:
        log.info("IMPORT-Modus → Analyse-Antworten aus %s", _IMPORT_PATH)
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
