#!/usr/bin/env python3
"""
NurEine — OG Image Generator

Generates editorial Open Graph images (1200x630 PNG, 1.91:1) for stories.
Perfect for WhatsApp, iMessage, Twitter, Facebook, LinkedIn link previews.

Layout: Full-bleed story illustration with a gradient overlay carrying the
story headline plus a 60px bottom brand bar with category and "NurEine" mark.

Design: The FLUX.1 illustration (transparent PNG, object on #f5f1ea canvas)
fills the entire frame. A dark gradient overlay rises from the bottom ~140px,
with the story headline in white serif centered above the solid brand bar.
Clean, premium, 2026 editorial — one elegant line of text, no clutter.

For each story without an og_image_url:
  1. Downloads the story's FLUX.1 illustration
  2. Composites it onto the warm canvas background
  3. Adds gradient overlay + headline text + bottom brand bar
  4. Uploads to Supabase Storage bucket 'og_images'
  5. Updates the story record with the og_image_url

Usage:
    SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... python scripts/generate_og_images.py [--all] [--slug SLUG]

Environment variables:
    SUPABASE_URL          — Supabase project URL
    SUPABASE_SERVICE_KEY  — Supabase service_role key
"""
from __future__ import annotations

import io
import logging
import os
import re
import sys
import uuid
from pathlib import Path
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
OG_HEIGHT = 630  # 1.91:1 — optimal for WhatsApp, Twitter, Facebook, LinkedIn

MISSING: list[str] = []
if not SUPABASE_URL:
    MISSING.append("SUPABASE_URL")
if not SUPABASE_SERVICE_KEY:
    MISSING.append("SUPABASE_SERVICE_KEY")
if MISSING:
    log.error("Missing required environment variable(s): %s", ", ".join(MISSING))
    sys.exit(1)

# ---------------------------------------------------------------------------
# Font discovery — works on macOS (SF Pro) and Linux CI (DejaVu/Liberation)
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent

FONT_TITLE = None       # bold/display font for headline
FONT_TITLE_LIGHT = None # light variant for contrast
FONT_BODY = None        # regular weight for dek
FONT_BODY_BOLD = None   # bold for category badge
FONT_CAPTION = None     # small text (branding)


def _find_font(patterns: list[str]) -> str | None:
    """Find the first existing font file matching any of the given glob patterns."""
    for pat in patterns:
        matches = list(Path("/").glob(pat.lstrip("/")))
        if not matches:
            # Also check relative to script dir
            rel = _SCRIPT_DIR / pat
            if rel.exists():
                return str(rel)
            continue
        # Prefer .otf over .ttf, Display over Text
        otfs = [m for m in matches if m.suffix == ".otf"]
        ttfs = [m for m in matches if m.suffix == ".ttf"]
        displays = [m for m in (otfs or ttfs) if "Display" in m.name]
        texts = [m for m in (otfs or ttfs) if "Text" in m.name]
        if displays:
            return str(displays[0])
        if texts:
            return str(texts[0])
        return str((otfs or ttfs)[0])
    return None


def _discover_fonts():
    """Locate the best available fonts for title, body, and caption."""
    global FONT_TITLE, FONT_TITLE_LIGHT, FONT_BODY, FONT_BODY_BOLD, FONT_CAPTION

    # macOS: SF Pro Display (clean, modern, excellent for editorial)
    sf_title = _find_font([
        "Library/Fonts/SF-Pro-Display-Bold.otf",
        "System/Library/Fonts/SF-Pro-Display-Bold.otf",
    ])
    sf_light = _find_font([
        "Library/Fonts/SF-Pro-Display-Light.otf",
        "System/Library/Fonts/SF-Pro-Display-Light.otf",
    ])
    sf_body = _find_font([
        "Library/Fonts/SF-Pro-Text-Regular.otf",
        "System/Library/Fonts/SF-Pro-Text-Regular.otf",
    ]) or _find_font([
        "Library/Fonts/SF-Pro-Display-Regular.otf",
    ])
    sf_body_bold = _find_font([
        "Library/Fonts/SF-Pro-Text-Semibold.otf",
        "System/Library/Fonts/SF-Pro-Text-Semibold.otf",
    ]) or _find_font([
        "Library/Fonts/SF-Pro-Display-Semibold.otf",
    ])

    # Linux CI: DejaVu / Liberation (apt: fonts-dejavu fonts-liberation2)
    linux_title = _find_font([
        "usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ])
    linux_body = _find_font([
        "usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ])
    linux_body_bold = _find_font([
        "usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ])

    FONT_TITLE = sf_title or linux_title
    FONT_TITLE_LIGHT = sf_light or FONT_TITLE
    FONT_BODY = sf_body or linux_body or FONT_TITLE
    FONT_BODY_BOLD = sf_body_bold or linux_body_bold or FONT_TITLE
    FONT_CAPTION = FONT_BODY

    if FONT_TITLE:
        log.info("Title font: %s", FONT_TITLE)
    else:
        log.warning("No suitable display font found — Pillow default will be used")
    if FONT_BODY:
        log.info("Body font:  %s", FONT_BODY)


_discover_fonts()


# ---------------------------------------------------------------------------
# Category -> tone color mapping
# ---------------------------------------------------------------------------
TONE_COLORS: dict[str, tuple[int, int, int]] = {
    "amber": (200, 115, 64),   # #c87340
    "sage": (90, 122, 82),     # #5a7a52
    "rose": (184, 122, 122),   # #b87a7a
    "sky": (108, 138, 168),    # #6c8aa8
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
# OG Image composer — full-bleed illustration + bottom brand bar
# ---------------------------------------------------------------------------
def _wrap_title(draw: "ImageDraw.ImageDraw", text: str, font: "ImageFont.FreeTypeFont", max_width: int) -> str:
    """Wrap title text to fit within max_width pixels, returning the best single-line or two-line variant."""
    # Try single line first
    bbox = draw.textbbox((0, 0), text, font=font)
    if bbox[2] - bbox[0] <= max_width:
        return text

    # Try two-line break at natural word boundaries
    words = text.split()
    best = text
    best_over = 99999
    for i in range(1, len(words)):
        line1 = " ".join(words[:i])
        line2 = " ".join(words[i:])
        w1 = draw.textbbox((0, 0), line1, font=font)[2]
        w2 = draw.textbbox((0, 0), line2, font=font)[2]
        over = max(0, w1 - max_width) + max(0, w2 - max_width)
        if over < best_over:
            best_over = over
            best = f"{line1}\n{line2}"
    return best


def compose_og_image(
    story_title: str,
    story_dek: str,
    category: str,
    image_bytes: bytes | None,
) -> bytes:
    """
    Composite a 1200x630 (1.91:1) editorial OG image.

    Layout: Full-bleed story illustration + gradient overlay with
    centered headline + 60px bottom brand bar.

    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │              STORY ILLUSTRATION                          │
    │              (full bleed)                                │
    │                                                          │
    │                  ░░░░░░░░░░░░░░                          │
    │                  ░  Headline  ░    ← gradient with text  │
    │                  ░░░░░░░░░░░░░░                          │
    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
    │  ▓ ● KATEGORIE                        NurEine ▓   ← 60px│
    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
    └──────────────────────────────────────────────────────────┘
    """
    from PIL import Image, ImageDraw, ImageFont  # noqa: PLC0415

    # Canvas — warm off-white (visible through transparent illustration)
    BG = (245, 241, 234)  # #f5f1ea
    INK = (26, 24, 21)    # #1a1815
    MUTED = (107, 99, 89) # #6b6359
    FAINT = (154, 144, 135)  # #9a9087
    WHITE = (245, 241, 234)

    img = Image.new("RGB", (OG_WIDTH, OG_HEIGHT), BG)
    draw = ImageDraw.Draw(img, "RGBA")

    # Tone / accent color
    tone = CATEGORY_TONE.get(category, "amber")
    accent = TONE_COLORS.get(tone, (200, 115, 64))

    category_label = CATEGORY_LABELS.get(category, category.title())

    # ---- Layout constants ----
    BAR_HEIGHT = 60
    BAR_Y = OG_HEIGHT - BAR_HEIGHT
    BAR_PADDING_X = 48
    GRADIENT_HEIGHT = 140  # total overlay from bottom
    HEADLINE_Y = BAR_Y - 56  # center of headline text zone

    # ---- 1) Full-bleed story illustration ----
    if image_bytes:
        try:
            story_img = Image.open(io.BytesIO(image_bytes))

            # Handle alpha channel (rembg output)
            has_alpha = story_img.mode == "RGBA"

            # Crop to 1200:630 (1.91:1) aspect ratio, then resize
            src_w, src_h = story_img.size
            target_ratio = OG_WIDTH / OG_HEIGHT
            src_ratio = src_w / src_h

            if src_ratio > target_ratio:
                # Source is wider — crop sides
                new_w = int(src_h * target_ratio)
                offset = (src_w - new_w) // 2
                story_img = story_img.crop((offset, 0, offset + new_w, src_h))
            else:
                # Source is taller — crop top/bottom
                new_h = int(src_w / target_ratio)
                offset = (src_h - new_h) // 2
                story_img = story_img.crop((0, offset, src_w, offset + new_h))

            story_img = story_img.resize((OG_WIDTH, OG_HEIGHT), Image.LANCZOS)

            if has_alpha:
                # Composite transparent story image onto canvas background
                canvas_rgba = Image.new("RGBA", (OG_WIDTH, OG_HEIGHT), BG + (255,))
                canvas_rgba.paste(story_img, (0, 0), story_img)
                img.paste(canvas_rgba.convert("RGB"), (0, 0))
            else:
                # No alpha — paste RGB image directly
                story_img = story_img.convert("RGB")
                img.paste(story_img, (0, 0))

        except Exception as exc:
            log.warning("  Could not process story image: %s", exc)
            image_bytes = None

    if not image_bytes:
        # Placeholder: accent-tinted canvas with subtle category word
        tinted = Image.new("RGB", (OG_WIDTH, OG_HEIGHT), accent + (15,))
        img.paste(tinted, (0, 0))

    # ---- 2) Gradient overlay — dark from bottom, fading upward ----
    gradient_start_y = OG_HEIGHT - GRADIENT_HEIGHT
    overlay = Image.new("RGBA", (OG_WIDTH, GRADIENT_HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    for y in range(GRADIENT_HEIGHT):
        t = y / GRADIENT_HEIGHT
        # Ease-in-out curve: gentle start, stronger toward bottom
        alpha = int(160 * (t ** 3))
        overlay_draw.rectangle(
            [(0, y), (OG_WIDTH, y + 1)],
            fill=(26, 24, 21, alpha),
        )

    img.paste(overlay, (0, gradient_start_y), overlay)

    # ---- 3) Headline text — centered in the gradient zone ----
    headline_font_size = 28
    headline_max_width = OG_WIDTH - 2 * BAR_PADDING_X

    try:
        headline_font = ImageFont.truetype(FONT_TITLE, headline_font_size) if FONT_TITLE else ImageFont.load_default()
    except Exception:
        headline_font = ImageFont.load_default()

    # Clean and wrap the title
    clean_title = story_title.strip()
    wrapped = _wrap_title(draw, clean_title, headline_font, headline_max_width)

    lines = wrapped.split("\n")
    line_height = headline_font_size + 6
    total_text_height = len(lines) * line_height

    # Center the text block vertically at HEADLINE_Y
    text_start_y = HEADLINE_Y - total_text_height // 2

    for li, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=headline_font)
        text_w = bbox[2] - bbox[0]
        text_x = (OG_WIDTH - text_w) // 2
        text_y = text_start_y + li * line_height
        draw.text((text_x, text_y), line, fill=WHITE, font=headline_font)

    # ---- 4) Bottom brand bar — solid gradient ----
    bar_overlay = Image.new("RGBA", (OG_WIDTH, BAR_HEIGHT), (0, 0, 0, 0))
    bar_draw = ImageDraw.Draw(bar_overlay)

    for y in range(BAR_HEIGHT):
        t = y / BAR_HEIGHT
        alpha = int(180 * (t ** 2))  # quadratic ease → heavier at bottom
        bar_draw.rectangle(
            [(0, y), (OG_WIDTH, y + 1)],
            fill=(26, 24, 21, alpha),
        )

    img.paste(bar_overlay, (0, BAR_Y), bar_overlay)

    # ---- 5) Bottom bar typography ----
    bar_font_size = 20
    bar_small_size = 16

    try:
        bar_font = ImageFont.truetype(FONT_TITLE, bar_font_size) if FONT_TITLE else ImageFont.load_default()
        bar_small = ImageFont.truetype(FONT_BODY, bar_small_size) if FONT_BODY else ImageFont.load_default()
    except Exception:
        bar_font = ImageFont.load_default()
        bar_small = bar_font

    # Category label (left side)
    cat_text = category_label.upper()
    dot_r = 4
    dot_x = BAR_PADDING_X
    dot_y = BAR_Y + BAR_HEIGHT // 2
    draw.ellipse(
        [(dot_x - dot_r, dot_y - dot_r), (dot_x + dot_r, dot_y + dot_r)],
        fill=accent,
    )

    cat_x = dot_x + dot_r + 12
    cat_bbox = draw.textbbox((0, 0), cat_text, font=bar_font)
    cat_text_y = BAR_Y + (BAR_HEIGHT - (cat_bbox[3] - cat_bbox[1])) // 2 - 2
    draw.text((cat_x, cat_text_y), cat_text, fill=WHITE, font=bar_font)

    # Brand name (right side) — NurEine
    brand_text = "NurEine"
    brand_bbox = draw.textbbox((0, 0), brand_text, font=bar_small)
    brand_w = brand_bbox[2] - brand_bbox[0]
    brand_x = OG_WIDTH - BAR_PADDING_X - brand_w
    brand_text_y = BAR_Y + (BAR_HEIGHT - (brand_bbox[3] - brand_bbox[1])) // 2 - 2
    draw.text((brand_x, brand_text_y), brand_text, fill=FAINT, font=bar_small)

    # ---- 6) Subtle accent line at top of bar ----
    for x in range(BAR_PADDING_X, OG_WIDTH - BAR_PADDING_X):
        alpha_line = max(0, 80 - int(abs(x - OG_WIDTH // 2) / (OG_WIDTH // 2) * 80))
        if alpha_line > 0:
            draw.point((x, BAR_Y), fill=accent + (alpha_line,))

    # Output
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


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
        log.error("  Failed to upload OG image: %s", exc)
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filepath}"


def download_story_image(image_url: str) -> bytes | None:
    try:
        resp = requests.get(image_url, timeout=30)
        resp.raise_for_status()
        return resp.content
    except requests.RequestException as exc:
        log.warning("  Failed to download image from %s: %s", image_url[:80], exc)
        return None


def safe_filename(text: str) -> str:
    s = text.lower()
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:40]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run(slugs: list[str] | None = None, all_stories: bool = False) -> None:
    log.info("=" * 60)
    log.info("NurEine — OG Image Generator")
    log.info("=" * 60)

    if slugs:
        log.info("Fetching %d specific stories...", len(slugs))
        all_data = supabase_get(
            "nureine_stories",
            params={"select": "id,title,subtitle,category,image_url,og_image_url", "order": "created_at.desc"},
        )
        stories = [s for s in all_data if any(s["title"].lower().replace(" ", "-")[:20] == sl.lower()[:20] for sl in slugs)]
    elif all_stories:
        log.info("Fetching ALL stories...")
        stories = supabase_get(
            "nureine_stories",
            params={"select": "id,title,subtitle,category,image_url,og_image_url"},
        )
    else:
        log.info("Fetching stories without OG image...")
        stories = supabase_get(
            "nureine_stories",
            params={"og_image_url": "is.null", "select": "id,title,subtitle,category,image_url,og_image_url"},
        )

    total = len(stories)
    if total == 0:
        log.info("No stories to process.")
        return

    log.info("Found %d story/stories.", total)
    success = 0
    failed = 0

    for i, story in enumerate(stories):
        sid = story.get("id")
        title = story.get("title", "(kein Titel)")
        dek = story.get("subtitle", "") or ""
        category = story.get("category", "gemeinschaft")
        image_url = story.get("image_url")

        log.info("[%d/%d] %s", i + 1, total, title)

        img_bytes = download_story_image(image_url) if image_url else None
        if img_bytes is None:
            log.info("  No story image — using placeholder.")

        try:
            og_bytes = compose_og_image(title, dek, category, img_bytes)
        except Exception as exc:
            log.error("  Compose failed: %s", exc)
            failed += 1
            continue

        sf = safe_filename(title)
        filepath = f"og/og-{sf}-{uuid.uuid4().hex[:8]}.png"
        og_url = supabase_upload_image(og_bytes, filepath)
        if not og_url:
            failed += 1
            continue

        try:
            supabase_patch("nureine_stories", {"og_image_url": og_url}, sid)
            log.info("  Saved: %s", og_url)
            success += 1
        except requests.RequestException as exc:
            log.error("  DB update failed: %s", exc)
            failed += 1

    log.info("Done. Success=%d Failed=%d Total=%d", success, failed, total)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Generate OG images for NurEine stories.")
    p.add_argument("--all", action="store_true", help="Re-generate ALL story OG images")
    p.add_argument("--slug", nargs="+", help="Generate OG for specific story slugs")
    args = p.parse_args()
    try:
        run(slugs=args.slug, all_stories=args.all)
    except Exception as exc:
        log.exception("Unhandled exception: %s", exc)
        sys.exit(1)
