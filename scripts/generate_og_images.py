#!/usr/bin/env python3
"""
NurEine — OG Image Generator

Generates editorial-style Open Graph images (1200×630 PNG) for stories.
Layout: Full-bleed story illustration (left 55%) with bold typography overlay
on a warm editorial background. Inspired by The New Yorker / The Atlantic
share cards: strong image, large readable headline, minimal branding.

For each story without an og_image_url:
  1. Downloads the story's FLUX.1 illustration
  2. Composites it with editorial typography
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
# Typography helpers
# ---------------------------------------------------------------------------
def _wrap_title(text: str, font, draw, max_width: int) -> list[str]:
    """Wrap text into lines that fit within max_width pixels."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width and current:
            lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)
    return lines


def _draw_text_with_shadow(
    draw,
    xy: tuple[int, int],
    text: str,
    font,
    fill: tuple[int, int, int],
    shadow_color: tuple[int, int, int] = (0, 0, 0),
    shadow_alpha: int = 30,
):
    """Draw text with a subtle single-pixel offset shadow for readability on images."""
    draw.text((xy[0] + 1, xy[1] + 1), text, fill=shadow_color + (shadow_alpha,), font=font)
    draw.text(xy, text, fill=fill, font=font)


# ---------------------------------------------------------------------------
# OG Image composer — editorial layout
# ---------------------------------------------------------------------------
def compose_og_image(
    story_title: str,
    story_dek: str,
    category: str,
    image_bytes: bytes | None,
) -> bytes:
    """
    Composite a 1200x630 editorial OG image.

    Layout:
    ┌──────────────────────────────────────┐
    │ ┌────────────────────┐              │
    │ │                    │  WISSENSCHAFT│  ← category badge
    │ │                    │              │
    │ │   STORY IMAGE      │  Große Head- │  ← bold 56px title
    │ │   660 x 630        │  line über   │
    │ │   (full height)    │  zwei Zeilen │
    │ │                    │              │
    │ │                    │  Subtitle /  │  ← 22px dek
    │ │                    │  Kontext     │
    │ │                    │              │
    │ └────────────────────┘  NurEine ▸   │  ← subtle branding footer
    └──────────────────────────────────────┘
    """
    from PIL import Image, ImageDraw, ImageFont  # noqa: PLC0415

    # Canvas — warm off-white
    BG = (245, 241, 234)  # #f5f1ea
    INK = (26, 24, 21)    # #1a1815
    SOFT = (58, 52, 44)   # #3a342c
    MUTED = (107, 99, 89) # #6b6359

    img = Image.new("RGB", (OG_WIDTH, OG_HEIGHT), BG)
    draw = ImageDraw.Draw(img, "RGBA")

    # Tone / accent color
    tone = CATEGORY_TONE.get(category, "amber")
    accent = TONE_COLORS.get(tone, (200, 115, 64))

    category_label = CATEGORY_LABELS.get(category, category.title())

    # ---- Layout constants ----
    IMAGE_W = 660          # left image panel width
    IMAGE_H = 630          # full height
    TEXT_X = IMAGE_W + 56  # text starts here (716)
    TEXT_W = OG_WIDTH - TEXT_X - 60  # ~424px for text
    MARGIN_TOP = 84

    # ---- 1) Story image panel (left, full-bleed height) ----
    if image_bytes:
        try:
            story_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            # Crop to 660:630 aspect ratio, then resize
            src_w, src_h = story_img.size
            target_ratio = IMAGE_W / IMAGE_H
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

            story_img = story_img.resize((IMAGE_W, IMAGE_H), Image.LANCZOS)

            # Apply a subtle dark gradient overlay on the right edge of the image
            # to improve text readability (image transitions to text column)
            overlay = Image.new("RGBA", (IMAGE_W, IMAGE_H), (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            for x in range(IMAGE_W - 120, IMAGE_W):
                alpha = int(80 * (x - (IMAGE_W - 120)) / 120)  # 0 to 80
                overlay_draw.rectangle([(x, 0), (x + 1, IMAGE_H)], fill=(0, 0, 0, alpha))

            img.paste(story_img, (0, 0))
            img.paste(overlay, (0, 0), overlay)

        except Exception as exc:
            log.warning("  Could not process story image: %s", exc)
            image_bytes = None

    if not image_bytes:
        # Placeholder: accent-tinted panel with subtle pattern
        placeholder = Image.new("RGB", (IMAGE_W, IMAGE_H), accent + (40,))
        img.paste(placeholder, (0, 0))

        # Draw category word as large watermark
        try:
            wm_font = ImageFont.truetype(FONT_TITLE, 72) if FONT_TITLE else ImageFont.load_default()
        except Exception:
            wm_font = ImageFont.load_default()
        wm_bbox = draw.textbbox((0, 0), category_label.upper(), font=wm_font)
        wm_w = wm_bbox[2] - wm_bbox[0]
        draw.text(
            ((IMAGE_W - wm_w) // 2, (IMAGE_H - 72) // 2),
            category_label.upper(),
            fill=accent + (80,),
            font=wm_font,
        )

    # ---- Divider line between image and text ----
    # A subtle vertical accent line
    for y in range(MARGIN_TOP, OG_HEIGHT - MARGIN_TOP):
        intensity = 40 + int(20 * (1.0 - abs(y - OG_HEIGHT / 2) / (OG_HEIGHT / 2)))
        draw.point((IMAGE_W, y), fill=accent + (min(intensity, 70),))

    # ---- 2) Text column ----
    title_font_size = 56
    dek_font_size = 22
    badge_font_size = 13
    caption_font_size = 14

    try:
        title_font = ImageFont.truetype(FONT_TITLE, title_font_size) if FONT_TITLE else ImageFont.load_default()
        dek_font = ImageFont.truetype(FONT_BODY, dek_font_size) if FONT_BODY else ImageFont.load_default()
        badge_font = ImageFont.truetype(FONT_BODY_BOLD, badge_font_size) if FONT_BODY_BOLD else ImageFont.load_default()
        caption_font = ImageFont.truetype(FONT_CAPTION, caption_font_size) if FONT_CAPTION else ImageFont.load_default()
    except Exception:
        title_font = ImageFont.load_default()
        dek_font = title_font
        badge_font = title_font
        caption_font = title_font

    y = MARGIN_TOP

    # ---- 2a) Category badge ----
    badge_text = category_label.upper()
    badge_pad_x = 16
    badge_pad_y = 7
    badge_bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
    badge_text_w = badge_bbox[2] - badge_bbox[0]
    badge_text_h = badge_bbox[3] - badge_bbox[1]
    badge_w = badge_text_w + badge_pad_x * 2
    badge_h = badge_text_h + badge_pad_y * 2

    # Pill badge background
    draw.rounded_rectangle(
        [(TEXT_X, y), (TEXT_X + badge_w, y + badge_h)],
        radius=badge_h // 2,
        fill=accent + (30,),
        outline=accent + (70,),
        width=1,
    )
    draw.text(
        (TEXT_X + badge_pad_x, y + badge_pad_y - 1),
        badge_text,
        fill=accent,
        font=badge_font,
    )
    y += badge_h + 36

    # ---- 2b) Headline — large, bold, tightly tracked ----
    # Reserve 180px below title for dek + footer spacing
    # Footer sits at OG_HEIGHT-52, so dek can extend down to OG_HEIGHT-82
    max_title_y = OG_HEIGHT - 52 - 160

    # Try to fit title: start at 56px, reduce if needed
    current_title_size = title_font_size
    title_lines: list[str] = []
    title_font_current = title_font

    while current_title_size >= 32:
        try:
            title_font_current = (
                ImageFont.truetype(FONT_TITLE, current_title_size)
                if FONT_TITLE
                else ImageFont.load_default()
            )
        except Exception:
            title_font_current = ImageFont.load_default()

        title_lines = _wrap_title(story_title, title_font_current, draw, TEXT_W)
        title_h = len(title_lines) * int(current_title_size * 1.3)
        if y + title_h <= max_title_y:
            break
        current_title_size -= 4

    for i, line in enumerate(title_lines[:5]):  # max 5 lines
        draw.text(
            (TEXT_X, y + i * int(current_title_size * 1.3)),
            line,
            fill=INK,
            font=title_font_current,
        )

    y += len(title_lines) * int(current_title_size * 1.3) + 28

    # ---- 2c) Dek / subtitle — lighter, smaller ----
    if story_dek:
        # Use pixel-based wrapping (like title) instead of character count
        # since German compound words are much longer than English
        dek_lines = _wrap_title(story_dek, dek_font, draw, TEXT_W)
        dek_line_h = int(dek_font_size * 1.6)
        for i, line in enumerate(dek_lines[:5]):
            draw.text(
                (TEXT_X, y + i * dek_line_h),
                line,
                fill=SOFT,
                font=dek_font,
            )

    # ---- 3) Footer branding — pinned to bottom ----
    brand_y = OG_HEIGHT - 52

    # Subtle horizontal accent line
    for x in range(TEXT_X, OG_WIDTH - 60):
        alpha = max(0, 40 - int(abs(x - (TEXT_X + TEXT_W // 2)) / (TEXT_W // 2) * 40))
        if alpha > 0:
            draw.point((x, brand_y - 12), fill=accent + (alpha,))

    draw.text((TEXT_X, brand_y), "NurEine", fill=MUTED, font=caption_font)

    domain = "nureine.de"
    dom_bbox = draw.textbbox((0, 0), domain, font=caption_font)
    dom_w = dom_bbox[2] - dom_bbox[0]
    draw.text(
        (OG_WIDTH - 60 - dom_w, brand_y),
        domain,
        fill=MUTED,
        font=caption_font,
    )

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
