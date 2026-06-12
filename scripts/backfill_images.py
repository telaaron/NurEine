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


def supabase_upload_image(image_bytes: bytes, filename: str) -> str | None:
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


def build_image_prompt(story: dict[str, Any]) -> str:
    """Build a FLUX.1 image prompt from story metadata."""
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
    # 1. Fetch all stories without image_url
    log.info("Fetching stories without image_url...")
    params: dict[str, str] = {
        "image_url": "is.null",
        "select": "id,title,category,region,body_markdown",
    }
    stories = supabase_get("nureine_stories", params=params)
    total = len(stories)
    log.info("Found %d stories without images.", total)

    if total == 0:
        log.info("Nothing to do.")
        return

    success = 0
    failed = 0

    for i, story in enumerate(stories):
        story_id = story.get("id")
        title = story.get("title", "(kein Titel)")
        log.info("[%d/%d] %s", i + 1, total, title)

        # 2. Build image prompt
        prompt = build_image_prompt(story)
        log.info("  Prompt: %.120s...", prompt)

        # 3. Generate image
        image_bytes = generate_image_fal(prompt)
        if not image_bytes:
            log.warning("  Failed to generate image for: %s", title)
            failed += 1
            continue

        # 3b. Composite onto brand canvas colour for consistency
        try:
            from PIL import Image as PILImage
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
            buf = BytesIO()
            img.save(buf, format="PNG", optimize=True)
            image_bytes = buf.getvalue()
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
        filename = f"story-images/{safe_title}-{short_id}.png"

        public_url = supabase_upload_image(image_bytes, filename)
        if not public_url:
            failed += 1
            continue

        # 5. Update the story record
        try:
            supabase_patch("nureine_stories", {"image_url": public_url}, story_id)
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
