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

import feedparser
import requests
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

# Safety limit to avoid runaway loops
MAX_ARTICLES_PER_RUN = 100
# Pause between API calls (seconds) to stay within rate limits
API_DELAY_SECONDS = 1.5
# Extra delay after image generation
IMAGE_API_DELAY_SECONDS = 1.0

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
        "max_tokens": 1024,
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

summary: 2-3 deutsche Sätze, was passiert ist und warum es strukturell wichtig ist

category: eine von [klima, gesundheit, wissenschaft, gemeinschaft, tiere, kultur, innovation]

region: Ländername auf Deutsch

region_code: ISO 3166-1 alpha-2

lat: Breitengrad (float)

lng: Längengrad (float)

image_prompt: Ein englischer Prompt für FLUX.1 Bild-KI. Stil: Minimalist 3D spot illustration, isolated on solid warm beige background (#FAF8F5), soft studio lighting, soft diffused shadows. High-end editorial, calming, 8K. The image will be used as a hero illustration on a news website AND composited into editorial Open Graph share images (1200x630) — so the main subject should be visually striking and centered, with generous empty space around it for text overlays. No text, no environment, no background elements. Format: "Minimalist 3D spot illustration of [OBJECT] made of [MATERIAL]. [CONCEPT] concept. Isolated completely on solid warm beige background #FAF8F5. Soft studio lighting, soft diffused shadows. High-end editorial, calming, 8K resolution. No text, no environment, no background elements." Beispiel: "Minimalist 3D spot illustration of mangrove saplings made of glossy ceramic. Environmental restoration concept. Isolated completely on solid warm beige background #FAF8F5. Soft studio lighting, soft diffused shadows. High-end editorial, calming, 8K resolution. No text, no environment, no background elements."

impact_reach: geschätzte Anzahl direkt positiv betroffener Menschen (integer)

impact_durability: 0-100 (Wie lange hält der Effekt an? Strukturveränderung=100, Einzelereignis=20)

impact_evidence: 0-100 (Peer-reviewed=100, etablierte Redaktion=75, lokal=50)

reading_time_min: geschätzte Lesezeit in Minuten

Berechne impact_score = round(impact_reach_normalized * 0.4 + impact_durability * 0.35 + impact_evidence * 0.25)
wobei impact_reach_normalized = min(100, log10(impact_reach + 1) * 20)

Antworte ausschließlich mit validem JSON. Kein Text davor oder danach."""


def build_prompt(entry: feedparser.FeedParserDict, source_name: str) -> str:
    """Build the analysis prompt for a given feed entry."""
    title = entry.get("title", "(kein Titel)")
    description = entry.get("description", entry.get("summary", "(keine Beschreibung)"))
    # Strip HTML tags for cleaner input
    description = (
        description.replace("<p>", "\n")
        .replace("</p>", "\n")
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )
    import re  # noqa: PLC0415 — import here to keep top-level clean

    description = re.sub(r"<[^>]+>", "", description)
    # Truncate very long descriptions to avoid token limits
    if len(description) > 5000:
        description = description[:5000] + "…"
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
        "started_at": None,  # will be set by DB default or we set it explicitly
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "stories_added": stories_added,
        "articles_processed": articles_processed,
        "errors": errors,
        "error_message": error_message,
    }
    try:
        supabase_post("nureine_cron_runs", record)
        log.info("Cron run logged (status=%s, added=%d)", status, stories_added)
    except requests.RequestException as exc:
        log.error("Failed to log cron run: %s", exc)


def run() -> None:
    """Main execution: fetch feeds, analyze, generate images, insert."""
    start_time = time.time()
    articles_processed = 0
    stories_added = 0
    errors = 0
    first_error: str | None = None

    # Track filter reasons for cron_runs auditing
    filter_reasons: dict[str, int] = {}

    # In-memory deduplication: track titles we've already inserted this run
    # to catch near-duplicates (same story from different feeds, or same story on consecutive days)
    seen_titles_normalized: list[str] = []

    # 1. Load sources
    sources = load_active_sources()
    if not sources:
        log.warning("No active RSS sources found — nothing to do.")
        log_cron_run("completed", 0, 0, 0)
        return

    # 2. Iterate sources and their entries
    for source in sources:
        if articles_processed >= MAX_ARTICLES_PER_RUN:
            log.info("Reached max articles per run (%d), stopping.", MAX_ARTICLES_PER_RUN)
            break

        source_name = source.get("name", "Unbekannte Quelle")
        feed_url = source.get("url")
        if not feed_url:
            log.warning("Source '%s' has no URL — skipping.", source_name)
            continue

        log.info("Fetching feed: %s (%s)", source_name, feed_url)

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
            log.info("  No entries found in feed '%s'.", feed_url)
            continue

        log.info("  Found %d entry/entries.", len(entries))

        for entry in entries:
            if articles_processed >= MAX_ARTICLES_PER_RUN:
                break

            source_url = entry.get("link", "")
            if not source_url:
                log.debug("  Skipping entry with no link.")
                continue

            # 3. Deduplicate against Supabase stories table (URL-based)
            try:
                if source_exists(source_url):
                    log.info("  Skipping (already exists): %s", source_url)
                    continue
            except requests.RequestException as exc:
                log.warning("  Dup-check failed for %s: %s — will attempt insert.", source_url, exc)
                errors += 1
                if first_error is None:
                    first_error = str(exc)
                # Continue anyway — the insert will fail if it's a true duplicate

            # 4. Call DeepSeek for analysis + image prompt
            prompt = build_prompt(entry, source_name)
            log.info("  Analyzing: %s", entry.get("title", "(kein Titel)"))
            raw = call_deepseek(prompt)
            articles_processed += 1

            result = parse_ai_response(raw)

            if result is None:
                log.warning("  DeepSeek returned no valid result for: %s", source_url)
                errors += 1
                if first_error is None:
                    first_error = "DeepSeek returned unparseable response"
                time.sleep(API_DELAY_SECONDS)
                continue

            # 5. Gatekeeping: is_nureine replaces old is_positive
            is_nureine = result.get("is_nureine", False)
            gut_filter_reason = result.get("gut_filter_reason")

            if not is_nureine:
                reason = gut_filter_reason or "unknown"
                filter_reasons[reason] = filter_reasons.get(reason, 0) + 1
                log.info("  Rejected (is_nureine=false, reason=%s): %s", reason, entry.get("title", "(kein Titel)"))
                time.sleep(API_DELAY_SECONDS)
                continue

            story_title = result.get("title", "")

            # 6. In-memory near-duplicate check (same-run deduplication)
            # Normalize title for comparison: lowercase, strip punctuation, collapse whitespace
            import re as _re  # noqa: PLC0415
            normalized = _re.sub(r"[^a-z0-9äöüß\s]", "", story_title.lower())
            normalized = _re.sub(r"\s+", " ", normalized).strip()

            # Check against previously inserted titles in this run
            # Simple heuristic: if >70% of words overlap with a previously seen title, skip
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

            # Track for future dedup in this run
            seen_titles_normalized.append(normalized)

            # 7. Generate and upload image (non-blocking: store story even if image fails)
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
                        # Continue — we still want to insert the story without an image
                    time.sleep(IMAGE_API_DELAY_SECONDS)
                else:
                    log.info("  No image_prompt in AI response — skipping image generation.")
            else:
                log.info("  Image generation disabled (no FAL_KEY) — skipping.")

            # 8. Insert into Supabase
            summary = result.get("summary", "")
            story_record: dict[str, Any] = {
                "title": story_title,
                "subtitle": result.get("subtitle", ""),
                "body_markdown": summary,  # RSS fetch only gets description, use AI summary as body
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
                "reading_time_min": result.get("reading_time_min"),
                "published_at": entry.get("published", entry.get("updated", datetime.now(timezone.utc).isoformat())),
            }

            # Attempt to parse published date if it's a string like "Mon, 01 Jan 2025 12:00:00 +0000"
            raw_published = story_record["published_at"]
            if isinstance(raw_published, str) and not raw_published.endswith("Z"):
                try:
                    from email.utils import parsedate_to_datetime  # noqa: PLC0415

                    parsed = parsedate_to_datetime(raw_published)
                    story_record["published_at"] = parsed.isoformat()
                except (ValueError, TypeError, AttributeError):
                    pass  # keep original string

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

            # Polite delay between AI calls
            time.sleep(API_DELAY_SECONDS)

    # Log filter reason summary for auditing
    if filter_reasons:
        log.info("Filter reason summary: %s", dict(filter_reasons))

    # 6. Log completion
    elapsed = time.time() - start_time
    log.info(
        "Run complete — processed=%d added=%d errors=%d (%.1fs)",
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
