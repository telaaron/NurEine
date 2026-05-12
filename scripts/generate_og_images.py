#!/usr/bin/env python3
"""
NurEine — OG Image Generator

Generates editorial-style Open Graph images (1200×630 PNG) for stories.
Combines the FLUX.1 story illustration with bold serif typography
in a layout inspired by The New York Times / The Guardian editorial pages.

For each story without an og_image_url:
  1. Downloads the story's FLUX.1 illustration
  2. Composites it with typography (title, category, dek, branding)
  3. Uploads to Supabase Storage bucket 'og_images'
  4. Updates the story record with the og_image_url

Usage:
    SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... python scripts/generate_og_images.py [--all] [--slug SLUG]

Environment variables:
    SUPABASE_URL          — Supabase project URL
    SUPABASE_SERVICE_KEY  — Supabase service_role key
"""
from __future__ import annotations

import io
import json
import logging
import os
import re
import sys
import textwrap
import uuid
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
log = logging.getLogger("generate_og_images")

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

STORAGE_BUCKET = "og_images"
OG_WIDTH = 1200
OG_HEIGHT = 630

MISSING: list[str] = []
if not SUPABASE_URL:
    MISSING.append("SUPABASE_URL")
if not SUPABASE_SERVICE_KEY:
    MISSING.append("SUPABASE_SERVICE_KEY")
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


def supabase_upload_image(image_bytes: bytes, filepath: str) -> str | None:
    """Upload PNG to Supabase Storage and return public URL."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filepath}"
    try:
        resp = requests.post(
            upload_url,
            headers=supabase_storage_headers("image/png"),
            data=image_bytes,
            timeout=60,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("  Failed to upload OG image to storage: %s", exc)
        return None

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filepath}"
    return public_url


# ---------------------------------------------------------------------------
# Font loading (bundled or system fallback)
# ---------------------------------------------------------------------------
FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
FONT_BOLD = None
FONT_REGULAR = None
FONT_SERIF = None


def _ensure_fonts():
    """Lazy-import Pillow and load fonts. Returns (ImageFont, Image, ImageDraw, bold_font, regular_font, serif_font)."""
    global FONT_BOLD, FONT_REGULAR, FONT_SERIF

    from PIL import Image, ImageDraw, ImageFont  # noqa: PLC0415

    if FONT_BOLD is None:
        # Try to load Inter (or fall back to system default)
        font_paths = [
            os.path.join(FONT_DIR, "Inter-Bold.ttf"),
            os.path.join(FONT_DIR, "Inter-SemiBold.ttf"),
            "/usr/share/fonts/truetype/inter/Inter-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
        for fp in font_paths:
            if os.path.exists(fp):
                FONT_BOLD = fp
                break

        regular_paths = [
            os.path.join(FONT_DIR, "Inter-Regular.ttf"),
            "/usr/share/fonts/truetype/inter/Inter-Regular.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        for fp in regular_paths:
            if os.path.exists(fp):
                FONT_REGULAR = fp
                break
        if FONT_REGULAR is None:
            FONT_REGULAR = FONT_BOLD  # fallback

        serif_paths = [
            os.path.join(FONT_DIR, "Lora-Bold.ttf"),
            os.path.join(FONT_DIR, "Fraunces-Bold.ttf"),
            os.path.join(FONT_DIR, "Merriweather-Bold.ttf"),
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        ]
        for fp in serif_paths:
            if os.path.exists(fp):
                FONT_SERIF = fp
                break
        if FONT_SERIF is None:
            FONT_SERIF = FONT_BOLD  # fallback

    return Image, ImageDraw, ImageFont, FONT_BOLD, FONT_REGULAR, FONT_SERIF


# ---------------------------------------------------------------------------
# Category -> tone color mapping
# ---------------------------------------------------------------------------
TONE_COLORS: dict[str, str] = {
    "amber": "#c87340",
    "sage": "#5a7a52",
    "rose": "#b87a7a",
    "sky": "#6c8aa8",
}

CATEGORY_TONE: dict[str, str] = {
    "klima": "sage",
    "gesundheit": "rose",
    "wissenschaft": "sky",
    "gemeinschaft": "amber",
    "tiere": "sage",
    "kultur": "amber",
    "innovation": "sky",
}

CATEGORY_LABELS: dict[str, str] = {
    "klima": "Klima",
    "gesundheit": "Gesundheit",
    "wissenschaft": "Wissenschaft",
    "gemeinschaft": "Gemeinschaft",
    "tiere": "Tiere",
    "kultur": "Kultur",
    "innovation": "Innovation",
}


# ---------------------------------------------------------------------------
# Typography helpers
# ---------------------------------------------------------------------------
def wrap_serif(text: str, max_chars: int) -> list[str]:
    """Wrap text into lines of at most max_chars each, breaking at word boundaries."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 > max_chars and current:
            lines.append(current.strip())
            current = word + " "
        else:
            current += word + " "
    if current.strip():
        lines.append(current.strip())
    return lines


# ---------------------------------------------------------------------------
# OG Image composer
# ---------------------------------------------------------------------------
def compose_og_image(
    story_title: str,
    story_dek: str,
    category: str,
    image_bytes: bytes | None,
) -> bytes:
    """
    Composite a 1200×630 editorial OG image.

    Layout (inspired by NYT editorial share cards):
    ┌────────────────────────────────────────────────┐
    │  ┌──────────────────┐                          │
    │  │                  │  KATEGORIE               │
    │  │   STORY IMAGE    │                          │
    │  │   (540×540)      │  Titel der großen       │
    │  │                  │  Geschichte              │
    │  │                  │                          │
    │  │                  │  Untertitel / Dek        │
    │  │                  │                          │
    │  └──────────────────┘                          │
    │                              NurEine  nureine.de│
    └────────────────────────────────────────────────┘
    """
    Image, ImageDraw, ImageFont, bold_path, regular_path, serif_path = _ensure_fonts()

    # Canvas
    bg_color = (245, 241, 234)  # #f5f1ea — warm off-white
    img = Image.new("RGB", (OG_WIDTH, OG_HEIGHT), bg_color)
    draw = ImageDraw.Draw(img)

    # Tone / accent color
    tone = CATEGORY_TONE.get(category, "amber")
    accent_hex = TONE_COLORS.get(tone, "#c87340")
    accent_rgb = tuple(int(accent_hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))

    category_label = CATEGORY_LABELS.get(category, category.title())

    # ---- 1) Story image (left side, 540×540 square with slight rounding) ----
    image_square_size = 540
    image_x = 60
    image_y = (OG_HEIGHT - image_square_size) // 2  # vertically centered

    if image_bytes:
        try:
            story_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            story_img = story_img.resize(
                (image_square_size, image_square_size), Image.LANCZOS
            )

            # Create a rounded-rect mask (radius=16px)
            mask = Image.new("L", (image_square_size, image_square_size), 0)
            mask_draw = ImageDraw.Draw(mask)
            radius = 16
            mask_draw.rounded_rectangle(
                [(0, 0), (image_square_size - 1, image_square_size - 1)],
                radius=radius,
                fill=255,
            )

            # Paste story image onto canvas with rounded corners
            img.paste(story_img, (image_x, image_y), mask)

            # Subtle border around the image
            draw.rounded_rectangle(
                [
                    (image_x - 1, image_y - 1),
                    (image_x + image_square_size, image_y + image_square_size),
                ],
                radius=radius + 1,
                outline=accent_rgb + (60,),  # RGBA with low alpha
                width=1,
            )
        except Exception as exc:
            log.warning("  Could not process story image, using placeholder: %s", exc)
            image_bytes = None

    if not image_bytes:
        # Placeholder: accent-colored rounded rectangle with category label
        draw.rounded_rectangle(
            [
                (image_x, image_y),
                (image_x + image_square_size, image_y + image_square_size),
            ],
            radius=16,
            fill=accent_rgb + (30,),  # very subtle fill
        )
        try:
            placeholder_font = ImageFont.truetype(serif_path, 48)
        except Exception:
            placeholder_font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), category_label, font=placeholder_font)
        tw = bbox[2] - bbox[0]
        draw.text(
            (
                image_x + (image_square_size - tw) // 2,
                image_y + image_square_size // 2 - 24,
            ),
            category_label,
            fill=accent_rgb + (80,),
            font=placeholder_font,
        )

    # ---- 2) Text column (right side) ----
    text_x = image_x + image_square_size + 60  # 660
    text_max_width = OG_WIDTH - text_x - 60  # 480px for text

    # ---- 2a) Category badge ----
    badge_height = 32
    badge_y = 90
    try:
        badge_font = ImageFont.truetype(bold_path, 13)
    except Exception:
        badge_font = ImageFont.load_default()

    badge_text = category_label.upper()
    badge_bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
    badge_tw = badge_bbox[2] - badge_bbox[0]
    badge_pad_x = 18
    badge_width = badge_tw + badge_pad_x * 2

    # Badge background
    draw.rounded_rectangle(
        [(text_x, badge_y), (text_x + badge_width, badge_y + badge_height)],
        radius=16,
        fill=accent_rgb + (25,),
    )
    draw.rounded_rectangle(
        [(text_x, badge_y), (text_x + badge_width, badge_y + badge_height)],
        radius=16,
        outline=accent_rgb + (60,),
        width=1,
    )
    draw.text(
        (text_x + badge_pad_x, badge_y + 7),
        badge_text,
        fill=accent_rgb,
        font=badge_font,
    )

    # ---- 2b) Title — bold serif, large ----
    title_y = badge_y + badge_height + 36  # 158
    try:
        title_font = ImageFont.truetype(serif_path, 44)
    except Exception:
        title_font = ImageFont.truetype(bold_path, 40)

    # Wrap title — roughly 22 chars per line at this size
    title_lines = wrap_serif(story_title, 22)
    title_line_height = 56
    for i, line in enumerate(title_lines[:4]):  # max 4 lines
        draw.text(
            (text_x, title_y + i * title_line_height),
            line,
            fill=(26, 24, 21),  # #1a1815
            font=title_font,
        )

    # ---- 2c) Dek / subtitle — italic serif ----
    dek_y = title_y + min(len(title_lines), 4) * title_line_height + 24
    if story_dek:
        try:
            dek_font = ImageFont.truetype(regular_path, 20)
        except Exception:
            dek_font = ImageFont.load_default()

        dek_wrapped = textwrap.wrap(story_dek, width=48)
        for i, line in enumerate(dek_wrapped[:3]):
            draw.text(
                (text_x, dek_y + i * 30),
                line,
                fill=(58, 52, 44),  # #3a342c
                font=dek_font,
            )

    # ---- 3) Bottom line + branding ----
    # Thin accent line
    line_y = OG_HEIGHT - 72
    for x in range(60, OG_WIDTH - 60):
        alpha = max(0, 60 - int(abs(x - OG_WIDTH // 2) / (OG_WIDTH // 2) * 60))
        if alpha > 0:
            draw.point(
                (x, line_y),
                fill=accent_rgb + (alpha,),
            )

    # NurEine label (left)
    try:
        brand_font = ImageFont.truetype(serif_path, 16)
    except Exception:
        brand_font = ImageFont.load_default()
    draw.text((60, OG_HEIGHT - 36), "NurEine", fill=(107, 99, 89), font=brand_font)

    # nureine.de (right)
    try:
        domain_font = ImageFont.truetype(regular_path, 14)
    except Exception:
        domain_font = ImageFont.load_default()
    domain_text = "nureine.de"
    d_bbox = draw.textbbox((0, 0), domain_text, font=domain_font)
    d_width = d_bbox[2] - d_bbox[0]
    draw.text(
        (OG_WIDTH - 60 - d_width, OG_HEIGHT - 36),
        domain_text,
        fill=(154, 144, 135),  # #9a9087
        font=domain_font,
    )

    # Output as PNG
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Download story image from URL
# ---------------------------------------------------------------------------
def download_story_image(image_url: str) -> bytes | None:
    """Download image bytes from a Supabase Storage URL."""
    try:
        resp = requests.get(image_url, timeout=30)
        resp.raise_for_status()
        return resp.content
    except requests.RequestException as exc:
        log.warning("  Failed to download image from %s: %s", image_url[:80], exc)
        return None


# ---------------------------------------------------------------------------
# Sluggify for filenames
# ---------------------------------------------------------------------------
def safe_filename(text: str) -> str:
    """Convert story title to a safe filename fragment."""
    s = text.lower()
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s[:40]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run(slugs: list[str] | None = None, all_stories: bool = False) -> None:
    """Generate OG images for stories.

    Args:
        slugs: Optional list of story slugs to process.
        all_stories: If True, generate for ALL stories (even those with existing og_image_url).
    """
    log.info("=" * 60)
    log.info("NurEine — OG Image Generator")
    log.info("=" * 60)

    # 1. Fetch stories needing OG images
    if slugs:
        # Fetch specific stories by slug-like matching (title prefix match)
        log.info("Fetching %d specific stories...", len(slugs))
        all_stories_data = supabase_get(
            "nureine_stories",
            params={"select": "id,title,subtitle,category,image_url,og_image_url", "order": "created_at.desc"},
        )
        stories = [s for s in all_stories_data if any(s["title"].lower().replace(" ", "-")[:20] == slug.lower()[:20] for slug in slugs)]
        if not stories:
            log.error("No matching stories found for slugs: %s", slugs)
            return
    elif all_stories:
        # Re-generate for all stories (useful for backfill)
        log.info("Fetching ALL stories (re-generate all OG images)...")
        stories = supabase_get(
            "nureine_stories",
            params={"select": "id,title,subtitle,category,image_url,og_image_url"},
        )
    else:
        # Default: only stories without og_image_url
        log.info("Fetching stories without OG image...")
        params: dict[str, str] = {
            "og_image_url": "is.null",
            "select": "id,title,subtitle,category,image_url,og_image_url",
        }
        stories = supabase_get("nureine_stories", params=params)

    total = len(stories)
    if total == 0:
        log.info("No stories to process.")
        return

    log.info("Found %d story/stories to process.", total)

    success = 0
    skipped = 0
    failed = 0

    for i, story in enumerate(stories):
        story_id = story.get("id")
        title = story.get("title", "(kein Titel)")
        dek = story.get("subtitle", "") or ""
        category = story.get("category", "gemeinschaft")
        image_url = story.get("image_url")

        log.info("[%d/%d] %s", i + 1, total, title)

        # 2. Download the story image
        image_bytes = None
        if image_url:
            image_bytes = download_story_image(image_url)

        if image_bytes is None:
            log.info("  No story image available — generating OG with placeholder.")

        # 3. Compose the OG image
        try:
            og_bytes = compose_og_image(title, dek, category, image_bytes)
        except Exception as exc:
            log.error("  Failed to compose OG image: %s", exc)
            failed += 1
            continue

        # 4. Upload to Supabase Storage (og_images bucket)
        sf_name = safe_filename(title)
        short_id = uuid.uuid4().hex[:8]
        filepath = f"og/og-{sf_name}-{short_id}.png"

        og_url = supabase_upload_image(og_bytes, filepath)
        if not og_url:
            log.warning("  Failed to upload OG image — skipping DB update.")
            failed += 1
            continue

        # 5. Update the story record with og_image_url
        try:
            supabase_patch("nureine_stories", {"og_image_url": og_url}, story_id)
            log.info("  OG image saved: %s", og_url)
            success += 1
        except requests.RequestException as exc:
            log.error("  Failed to update story og_image_url: %s", exc)
            failed += 1

    log.info("Done. Success=%d, Failed=%d, Total=%d", success, failed, total)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate OG images for NurEine stories.")
    parser.add_argument("--all", action="store_true", help="Re-generate ALL story OG images")
    parser.add_argument("--slug", nargs="+", help="Generate OG for specific story slugs")
    args = parser.parse_args()

    try:
        run(slugs=args.slug, all_stories=args.all)
    except Exception as exc:
        log.exception("Unhandled exception: %s", exc)
        sys.exit(1)
