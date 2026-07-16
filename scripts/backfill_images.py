#!/usr/bin/env python3
"""
NurEine — Image Backfill

Finds all nureine_stories without image_url,
generates images via FLUX.1 [schnell] on fal.ai,
uploads to Supabase Storage, and updates the record.

Usage:
    SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... FAL_KEY=... python scripts/backfill_images.py

Environment variables:
    SUPABASE_URL          — Supabase project URL
    SUPABASE_SERVICE_KEY  — Supabase service_role key
    FAL_KEY               — fal.ai API key
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import uuid
from io import BytesIO
from typing import Any

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
log = logging.getLogger("backfill_images")

# ---------------------------------------------------------------------------
# Load .env
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
FAL_KEY = os.environ.get("FAL_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"  # 1024x768
FAL_NUM_IMAGES = 1
FAL_POLL_INTERVAL = 2
FAL_POLL_TIMEOUT = 120

STORAGE_BUCKET = "story_images"

MISSING: list[str] = []
if not SUPABASE_URL:
    MISSING.append("SUPABASE_URL")
if not SUPABASE_SERVICE_KEY:
    MISSING.append("SUPABASE_SERVICE_KEY")
if not FAL_KEY:
    MISSING.append("FAL_KEY")
if MISSING:
    log.error("Missing required environment variable(s): %s", ", ".join(MISSING))
    sys.exit(1)

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------
def supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def supabase_storage_headers(content_type: str = "image/png") -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }


def supabase_get(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=supabase_headers(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_patch(table: str, data: dict[str, Any], row_id: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    resp = requests.patch(url, headers=supabase_headers(), json=data, timeout=30)
    resp.raise_for_status()


def supabase_upload_image(image_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str | None:
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    try:
        resp = requests.post(
            upload_url,
            headers=supabase_storage_headers(content_type),
            data=image_bytes,
            timeout=60,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("Failed to upload image to Supabase Storage: %s", exc)
        return None

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
    log.info("  Image uploaded: %s", public_url)
    return public_url


# ---------------------------------------------------------------------------
# fal.ai image generation
# ---------------------------------------------------------------------------
def generate_image_fal(prompt: str) -> bytes | None:
    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "prompt": prompt,
        "image_size": FAL_IMAGE_SIZE,
        "num_images": FAL_NUM_IMAGES,
        "enable_safety_checker": True,
    }

    try:
        resp = requests.post(FAL_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        submission = resp.json()

        status_url = submission.get("status_url")
        if status_url:
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

        images = submission.get("images", [])
        if not images:
            log.warning("  fal.ai returned no images: %s", submission)
            return None

        image_url = images[0].get("url")
        if not image_url:
            log.warning("  fal.ai response missing image URL")
            return None

        log.info("  Downloading generated image...")
        img_resp = requests.get(image_url, timeout=60)
        img_resp.raise_for_status()
        return img_resp.content

    except requests.RequestException as exc:
        log.error("  FLUX.1 image generation failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Image prompt builder
# ---------------------------------------------------------------------------
IMAGE_STYLE = (
    "Warm paper collage editorial illustration. "
    "Handcrafted paper cutout technique with overlapping matte paper layers. "
    "Visible paper grain texture, soft cast shadows between each layer. "
    "Flat semi-abstract illustrative style — NO 3D rendering, NO photorealism, NO glossy materials. "
    "Warm off-white paper background #f5f1ea. "
    "Single central iconographic symbol as the subject. "
    "No text, no environment, no background elements beyond the paper canvas."
)

CATEGORY_ACCENT_COLOURS: dict[str, str] = {
    "klima": "sage green",
    "gesundheit": "rose red",
    "wissenschaft": "sky blue",
    "gemeinschaft": "terracotta orange",
    "tiere": "sage green",
    "kultur": "terracotta orange",
    "innovation": "sky blue",
}


# Motiv-Wahl-Regel — identisch zur Pipeline (fetch_stories.py ANALYSIS_PROMPT, image_prompt).
# URSACHE des Wiederholungs-Bugs vom 2026-06-12: vorher kam das Motiv aus 7 festen
# Kategorie-Templates → 11× Hände, 9× Herz, 7× Glühbirne. Jetzt wählt DeepSeek das
# Kern-Symbol PRO STORY; die Templates unten sind nur noch Not-Fallback ohne DeepSeek.
DEEPSEEK_MOTIF_PROMPT = """Du bist Art Director einer Good-News-Plattform und baust einen FLUX.1-Bild-Prompt.

⚠️ MOTIV-WAHL — DER HÄUFIGSTE FEHLER: Das Symbol muss den KERN der guten Nachricht zeigen, NICHT ein
wörtliches/oberflächliches Objekt aus dem Titel und NICHT ein generisches Kategorie-Symbol. Denke einen Schritt weiter:
  - SCHLECHT (wörtlich): "Bor-Nanobälle" → ein Fußball. NIEMALS. Stattdessen: leuchtendes Molekül-Gittermuster aus Papier.
  - SCHLECHT (generisch): Glühbirne für jede Innovations-Story, Herz für jede Gesundheits-Story, Hände für jede
    Gesellschafts-Story. NIEMALS — das Motiv muss DIESE eine Story erzählen.
  - GUT: "Solarstrom überholt Kohle" → Sonne über stilisierter Landschaft, ein Kohlestück verblassend.
  - GUT: "Nashörner kehren zurück" → ein Nashorn-Umriss aus Papier in sanfter Savannen-Landschaft.
Wähle ein Motiv, das (a) eindeutig zum eigentlichen Thema passt, (b) positiv/hoffnungsvoll wirkt,
(c) ohne Bildunterschrift verständlich ist. KEINE Menschen-Gesichter, KEINE Markenlogos, KEIN Text im Bild.

Antworte mit GENAU EINER Zeile, exakt in diesem Format (Farbe wähle aus: terracotta orange, sage green, rose red, sky blue):
Warm paper collage editorial illustration of [PASSENDES KERN-SYMBOL], made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in [FARBE]. Visible paper grain texture, soft cast shadows between paper layers. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism, no glossy materials.

Keine Anführungszeichen, kein Markdown, keine Erklärung.

Artikel-Titel: {title}
Kategorie: {category}
Zusammenfassung: {summary}"""


def build_image_prompt_deepseek(story: dict[str, Any]) -> str | None:
    """Story-individuelles Motiv via DeepSeek (gleiche Regel wie die Pipeline)."""
    if not DEEPSEEK_API_KEY:
        return None
    prompt = DEEPSEEK_MOTIF_PROMPT.format(
        title=story.get("title", ""),
        category=story.get("category", ""),
        summary=(story.get("summary") or story.get("body_markdown") or "")[:600],
    )
    try:
        resp = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 300,
            },
            timeout=60,
        )
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"].strip()
    except (requests.RequestException, KeyError, IndexError) as exc:
        log.warning("  DeepSeek-Motiv fehlgeschlagen: %s", exc)
        return None
    for line in raw.splitlines():
        line = line.strip().strip('"').strip("`").strip()
        if line.lower().startswith("warm paper collage") and len(line) > 80:
            return line
    log.warning("  DeepSeek-Antwort ohne gültigen Prompt: %.120s", raw)
    return None


def build_image_prompt(story: dict[str, Any]) -> str:
    """Build a FLUX.1 image prompt from story metadata (Fallback ohne DeepSeek)."""
    title = story.get("title", "")
    category = story.get("category", "")
    region = story.get("region", "")

    # Map categories to simple iconographic symbols for paper collage
    category_symbols: dict[str, str] = {
        "klima": "a layered paper leaf growing from folded earth layers",
        "gesundheit": "a paper-cut heart shape with healing light rays",
        "wissenschaft": "a paper DNA helix with microscopic paper cells",
        "gemeinschaft": "two overlapping paper hands meeting in a circle",
        "tiere": "a paper-cut animal silhouette with layered habitat shapes",
        "kultur": "an open paper book with folded musical notes floating up",
        "innovation": "a paper lightbulb with layered gear wheel cutouts",
    }

    accent = CATEGORY_ACCENT_COLOURS.get(category, "terracotta orange")
    symbol = category_symbols.get(category, "a paper-cut symbol of positive change")

    keyword = title.split(" – ")[0].split(": ")[0].split(" in ")[0].strip()
    if len(keyword) > 100:
        keyword = title[:100]

    prompt = (
        f"Warm paper collage editorial illustration of {symbol} made of layered matte paper cutouts "
        f"on warm off-white #f5f1ea canvas. Accented in {accent}. "
        f'Inspired by: "{keyword}". '
        f"{IMAGE_STYLE}"
    )
    return prompt


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run() -> None:
    # Modus --ids <datei>: regeneriert Bilder für diese Story-IDs (eine ID pro Zeile),
    # auch wenn image_url schon gesetzt ist (z. B. nach dem Template-Motiv-Bug).
    ids_file = None
    if "--ids" in sys.argv[1:]:
        ids_file = sys.argv[sys.argv.index("--ids") + 1]

    select = "id,title,category,region,summary,body_markdown,image_url"
    if ids_file:
        with open(ids_file) as f:
            ids = [line.strip() for line in f if line.strip()]
        log.info("Regeneriere Bilder für %d Story-IDs aus %s ...", len(ids), ids_file)
        stories = []
        for chunk_start in range(0, len(ids), 50):
            chunk = ids[chunk_start : chunk_start + 50]
            stories += supabase_get(
                "nureine_stories",
                params={"select": select, "id": f"in.({','.join(chunk)})"},
            )
    else:
        log.info("Fetching stories without image_url...")
        stories = supabase_get(
            "nureine_stories", params={"image_url": "is.null", "select": select}
        )
    total = len(stories)
    log.info("Found %d stories to process.", total)

    if total == 0:
        log.info("Nothing to do.")
        return

    success = 0
    failed = 0

    for i, story in enumerate(stories):
        story_id = story.get("id")
        title = story.get("title", "(kein Titel)")
        log.info("[%d/%d] %s", i + 1, total, title)

        # 2. Build image prompt — Story-Motiv via DeepSeek, Template nur als Not-Fallback.
        prompt = build_image_prompt_deepseek(story)
        if not prompt:
            log.warning("  Fallback auf Kategorie-Template (DeepSeek nicht verfügbar).")
            prompt = build_image_prompt(story)
        log.info("  Prompt: %.120s...", prompt)

        # 3. Generate image
        image_bytes = generate_image_fal(prompt)
        if not image_bytes:
            log.warning("  Failed to generate image for: %s", title)
            failed += 1
            continue

        # 3b. Composite onto brand canvas colour for consistency, then
        # downscale + encode as JPEG for upload (image_utils.encode_story_image)
        try:
            from PIL import Image as PILImage
            from image_utils import encode_story_image
            img = PILImage.open(BytesIO(image_bytes)).convert("RGBA")
            w, h = img.size
            pixels = img.load()
            CANVAS = (245, 241, 234)  # #F5F1EA
            THRESHOLD = 225
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pixels[x, y]
                    if a > 0 and r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
                        whiteness = min(r, g, b) / 255.0
                        blend = whiteness ** 1.5
                        nr = int(CANVAS[0] * blend + r * (1 - blend))
                        ng = int(CANVAS[1] * blend + g * (1 - blend))
                        nb = int(CANVAS[2] * blend + b * (1 - blend))
                        pixels[x, y] = (nr, ng, nb, a)
            image_bytes = encode_story_image(img)
            log.info("  Canvas composite applied")
        except (ImportError, SystemExit):
            log.info("  PIL not available — keeping original image.")
        except Exception as exc:
            log.warning("  Canvas composite failed: %s — using original.", exc)

        # 4. Upload to Supabase Storage
        short_id = uuid.uuid4().hex[:12]
        safe_title = (
            title.lower()
            .replace(" ", "-")
            .replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
        )
        # Nur ASCII: Unicode wie '₂' (CO₂) ist isalnum()==True, aber Supabase Storage
        # lehnt solche Object-Keys mit 400 ab.
        safe_title = "".join(c for c in safe_title if c.isascii() and (c.isalnum() or c == "-"))[:40]
        filename = f"story-images/{safe_title}-{short_id}.jpg"

        public_url = supabase_upload_image(image_bytes, filename, content_type="image/jpeg")
        if not public_url:
            failed += 1
            continue

        # 5. Update the story record (+ altes Bild aufräumen, falls Regeneration)
        old_url = story.get("image_url")
        try:
            supabase_patch("nureine_stories", {"image_url": public_url}, story_id)
            if old_url and f"/{STORAGE_BUCKET}/" in old_url:
                old_key = old_url.split(f"/{STORAGE_BUCKET}/", 1)[1]
                requests.delete(
                    f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{old_key}",
                    headers=supabase_headers(),
                    timeout=30,
                )
            log.info("  Updated story %s", story_id)
            success += 1
        except requests.RequestException as exc:
            log.error("  Failed to update story: %s", exc)
            failed += 1

        # Small delay between images
        time.sleep(1)

    log.info("Done. Success=%d, Failed=%d, Total=%d", success, failed, total)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    log.info("=" * 60)
    log.info("NurEine — Image Backfill (FLUX.1 via fal.ai)")
    log.info("=" * 60)
    try:
        run()
    except Exception as exc:
        log.exception("Unhandled exception: %s", exc)
        sys.exit(1)
