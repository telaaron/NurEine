#!/usr/bin/env python3
"""
NurEine — Story Fetcher

Fetches RSS feeds, analyzes articles with DeepSeek Chat,
generates images with FLUX.1 [schnell] via fal.ai,
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

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
FAL_KEY = os.environ.get("FAL_KEY")

DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"

# fal.ai FLUX.1 [schnell]
FAL_ENDPOINT = "https://fal.run/fal-ai/flux/schnell"
FAL_IMAGE_SIZE = "square"  # 1024x1024
FAL_NUM_IMAGES = 1
FAL_POLL_INTERVAL = 2  # seconds between status polls
FAL_POLL_TIMEOUT = 120  # max seconds to wait for generation

# Supabase Storage bucket for story images
STORAGE_BUCKET = "story_images"

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
}
DEFAULT_SOURCE_CONFIG = {"max_per_run": 10, "priority": 3}

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
_GERMAN_NEGATIVE_PATTERNS = [
    r"tote?\b", r"tot\b", r"gestorben", r"tödlich", r"stirbt\b",
    r"katastrophe", r"unglück", r"anschlag", r"attentat",
    r"krieg", r"gefallen", r"opfer", r"tragödie", r"verletzt",
]

# Headline patterns that indicate "local fluff" / sports / history
_GERMAN_FLUFF_PATTERNS = [
    r"vor \d+ jahren", r"jubiläum", r"jahrestag",
    r"tor .+ sieg", r"\d+:\d+.*sieg", r"spieltag",
    r"rettet .+welpen", r"rettet .+hund", r"rettet .+katze",
]

# English negative patterns for international sources
_ENGLISH_NEGATIVE_PATTERNS = [
    r"\bkilled?\b", r"\bdead\b", r"\bdeath\b", r"\bdies?\b",
    r"\battack\b", r"\bwar\b", r"\bbomb(ing)?\b", r"\bdisaster\b",
    r"\btragedy\b", r"\bcasualt", r"\binjur", r"\bfatal",
]

# English fluff/sports/history patterns
_ENGLISH_FLUFF_PATTERNS = [
    r"\byears? ago\b", r"\banniversary\b", r"\bretrospective\b",
    r"\bwin(s)? .*\d+-\d+\b", r"\bgoal(s)? .*\b(match|game)\b",
    r"\brescues? .*(dog|cat|puppy|kitten)\b",
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
    desc = (entry.get("description", entry.get("summary", "")) or "").lower()

    combined = f"{title} {desc[:500]}"

    # 1. Check for strong positive signals first — these always pass
    for pattern in _STRONG_POSITIVE_SIGNALS:
        if re.search(pattern, combined, re.IGNORECASE):
            return False, ""

    # 2. Check for obviously broken feeds (Nature, WHO return malformed XML)
    if not title or len(title) < 5:
        return True, "broken_entry"

    # 3. German negative patterns
    for pattern in _GERMAN_NEGATIVE_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            return True, f"local_negative:{pattern}"

    # 4. German fluff/history/sports patterns
    for pattern in _GERMAN_FLUFF_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            return True, f"local_fluff:{pattern}"

    # 5. English negative patterns
    for pattern in _ENGLISH_NEGATIVE_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            return True, f"local_negative:{pattern}"

    # 6. English fluff/history/sports patterns
    for pattern in _ENGLISH_FLUFF_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
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
    """POST (insert) a row into a Supabase table."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=supabase_headers(), json=data, timeout=30)
    resp.raise_for_status()
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
Deine Zielgruppe: HR-Abteilungen, Schulleiter, Klinik-Manager (B2B).
Dein Job ist härter als "nur positives filtern": Du suchst Geschichten, die einem Entscheider das Gefühl geben "Wow, die Welt kommt voran."

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

is_nureine: true/false — Erfüllt diese Story unsere Qualitätsstandards? Prüfe ALLE drei Todsünden + Gold-Standard-Kriterien.

gut_filter_reason: null (wenn is_nureine=true) ODER einer von ["history_trap", "local_fluff", "sports_niche"] (wenn is_nureine=false). Bei anderem Ablehnungsgrund (z.B. einfach keine positive Nachricht): "not_positive".

NUR wenn is_nureine=true, fülle zusätzlich:

title: Deutscher Titel (max 80 Zeichen, prägnant, keine Clickbait-Formulierungen)

subtitle: Eine Zeile Kontext (max 120 Zeichen, sachlich)

summary: 2-3 deutsche Sätze, was passiert ist und warum es strukturell wichtig ist. Das ist die Kurzfassung für Story-Cards und Teaser.

body: Ein ausführlicher journalistischer Artikel in deutscher Sprache. Schreibe 12-18 Sätze mit Substanz: strukturiere den Text in die Abschnitte "Hintergrund", "Was ist passiert", "Warum das wichtig ist" und "Ausblick". Verwende konkrete Zahlen, Namen, Orte und Zitate aus dem Originaltext. Schreibe im Stil von ZEIT ONLINE oder brand eins — sachlich, präzise, aber zugänglich. Nicht werblich, nicht reißerisch. Zielgruppe: Entscheider in HR, Bildung und Gesundheitswesen, die in 3-5 Minuten echten Mehrwert erhalten.

category: eine von [klima, gesundheit, wissenschaft, gemeinschaft, tiere, kultur, innovation]

region: Ländername auf Deutsch

region_code: ISO 3166-1 alpha-2

lat: Breitengrad (float)

lng: Längengrad (float)

image_prompt: Ein englischer Prompt für FLUX.1 Bild-KI. Stil: Minimalist 3D spot illustration, isolated on pure white background (#ffffff), soft studio lighting, soft diffused shadows beneath the subject. High-end editorial, calming, 8K. The image will be used as a hero illustration on a news website AND composited into editorial Open Graph share images (1200x630) — so the main subject should be visually striking and EXACTLY centered in the middle of the frame, with generous equal empty space on all sides (top, bottom, left, right) to prevent cropping. The subject should occupy approximately 50-60% of the frame height. No text, no environment, no background elements. Format: "Minimalist 3D spot illustration of [OBJECT] made of [MATERIAL]. [CONCEPT] concept. Isolated completely on pure white background #ffffff. Soft studio lighting, soft diffused shadows. High-end editorial, calming, 8K resolution. No text, no environment, no background elements. Subject centered in the middle of the frame with generous equal empty space above and below." Beispiel: "Minimalist 3D spot illustration of mangrove saplings made of glossy ceramic. Environmental restoration concept. Isolated completely on pure white background #ffffff. Soft studio lighting, soft diffused shadows. High-end editorial, calming, 8K resolution. No text, no environment, no background elements. Subject centered in the middle of the frame with generous equal empty space above and below."

impact_reach: geschätzte Anzahl direkt positiv betroffener Menschen (integer)

impact_durability: 0-100 (Wie lange hält der Effekt an? Strukturveränderung=100, Einzelereignis=20)

impact_evidence: 0-100 (Peer-reviewed=100, etablierte Redaktion=75, lokal=50)

reading_time_min: geschätzte Lesezeit in Minuten

Berechne impact_score = round(impact_reach_normalized * 0.4 + impact_durability * 0.35 + impact_evidence * 0.25)
wobei impact_reach_normalized = min(100, log10(impact_reach + 1) * 20)

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
    """Generate an image using FLUX.1 [schnell] via fal.ai.

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
        "enable_safety_checker": True,
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


def generate_and_upload_image(image_prompt: str, story_title: str) -> str | None:
    """Generate an image via FLUX.1 on fal.ai and upload to Supabase Storage.

    Returns the public URL of the uploaded image, or None on failure.
    """
    if not image_prompt or not image_prompt.strip():
        log.warning("  Empty image prompt — skipping image generation.")
        return None

    log.info("  Generating image: %.100s...", image_prompt)

    image_bytes = generate_image_fal(image_prompt)
    if not image_bytes:
        log.warning("  Image generation failed for: %.60s", story_title)
        return None

    # Build a clean filename: story-images/story-{slug}-{uuid12}.png
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
                        image_url = generate_and_upload_image(image_prompt, story_title)
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
            body = result.get("body", summary)
            actual_reading_time = max(1, round(len(body) / (200 * 5)))
            story_record: dict[str, Any] = {
                "title": story_title,
                "subtitle": result.get("subtitle", ""),
                "body_markdown": body,
                "summary": summary,
                "category": result.get("category", "gemeinschaft"),
                "region": result.get("region", ""),
                "region_code": result.get("region_code", ""),
                "lat": result.get("lat"),
                "lng": result.get("lng"),
                "image_url": image_url,
                "source_url": source_url,
                "source_name": source_name,
                "impact_reach": result.get("impact_reach"),
                "impact_durability": result.get("impact_durability"),
                "impact_evidence": result.get("impact_evidence"),
                "impact_score": result.get("impact_score"),
                "reading_time_min": result.get("reading_time_min") or actual_reading_time,
                "published_at": entry.get("published", entry.get("updated", datetime.now(timezone.utc).isoformat())),
            }

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
