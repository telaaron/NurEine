#!/usr/bin/env python3
"""
ONE-OFF: Generate story OG with the NEW "Editorial Spread" design
using the ACTUAL story image from the database.

Target: "27 Mondbären aus illegaler Gallefarm in Laos gerettet"

Run: python scripts/_test_new_og_real_story.py
Output: media/test-story-og-real.png
"""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR))

from dotenv import load_dotenv
load_dotenv()

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

from generate_og_images import _discover_fonts, FONT_TITLE, FONT_BODY, CATEGORY_TONE, TONE_COLORS, CATEGORY_LABELS
from PIL import Image, ImageDraw, ImageFont

# ------------------------------------------------------------------
# 1) Find the story in Supabase
# ------------------------------------------------------------------
headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

# Search by title fragment
resp = requests.get(
    f"{SUPABASE_URL}/rest/v1/nureine_stories",
    headers=headers,
    params={
        "select": "id,title,subtitle,category,image_url,og_image_url",
        "title": "ilike.*Mondb%C3%A4ren*",
        "order": "created_at.desc",
        "limit": 1,
    },
    timeout=30,
)
resp.raise_for_status()
stories = resp.json()

if not stories:
    # Try broader search
    resp2 = requests.get(
        f"{SUPABASE_URL}/rest/v1/nureine_stories",
        headers=headers,
        params={
            "select": "id,title,subtitle,category,image_url,og_image_url",
            "order": "created_at.desc",
            "limit": 20,
        },
        timeout=30,
    )
    resp2.raise_for_status()
    all_stories = resp2.json()
    # Find one with "Mondbären" or just take the newest
    target = None
    for s in all_stories:
        if "Mondb" in s.get("title", "") or "Bär" in s.get("title", "") or "Galle" in s.get("title", ""):
            target = s
            break
    if not target and all_stories:
        target = all_stories[0]
    stories = [target] if target else []

if not stories:
    print("No matching story found.")
    sys.exit(1)

story = stories[0]
title = story.get("title", "Kein Titel")
dek = story.get("subtitle", "") or ""
category = story.get("category", "gemeinschaft")
image_url = story.get("image_url")

print(f"Story: {title}")
print(f"Category: {category}")
print(f"Image URL: {image_url}")
print(f"OG URL: {story.get('og_image_url', 'none')}")

# ------------------------------------------------------------------
# 2) Download the story illustration
# ------------------------------------------------------------------
image_bytes = None
if image_url:
    try:
        img_resp = requests.get(image_url, timeout=30)
        img_resp.raise_for_status()
        image_bytes = img_resp.content
        print(f"Downloaded illustration: {len(image_bytes)//1024}KB")
    except Exception as e:
        print(f"Failed to download: {e}")
else:
    print("No image_url — will use placeholder")

# ------------------------------------------------------------------
# 3) Compose the new OG design
# ------------------------------------------------------------------
W, H = 1200, 630
BG     = (245, 241, 234)
INK    = (26, 24, 21)
WARM   = (107, 99, 89)
FAINT  = (154, 144, 135)
AMBER  = (200, 115, 64)
WHITE  = (245, 241, 234)

MARGIN = 48
BAR_HEIGHT = 44
BAR_Y = H - BAR_HEIGHT
IMG_W = 560
IMG_H = 440
IMG_X = MARGIN
IMG_Y = MARGIN
TEXT_X = IMG_X + IMG_W + 40
TEXT_MAX_W = W - TEXT_X - MARGIN

# Tone / accent
tone = CATEGORY_TONE.get(category, "amber")
accent = TONE_COLORS.get(tone, AMBER)
category_label = CATEGORY_LABELS.get(category, category.title())

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# --- Illustration (left) ---
story_img = None
has_alpha = False
if image_bytes:
    try:
        story_img = Image.open(io.BytesIO(image_bytes))
        has_alpha = story_img.mode == "RGBA"

        # Crop to 560:440 aspect ratio then resize
        src_w, src_h = story_img.size
        target_ratio = IMG_W / IMG_H
        src_ratio = src_w / src_h

        if src_ratio > target_ratio:
            new_w = int(src_h * target_ratio)
            offset = (src_w - new_w) // 2
            story_img = story_img.crop((offset, 0, offset + new_w, src_h))
        else:
            new_h = int(src_w / target_ratio)
            offset = (src_h - new_h) // 2
            story_img = story_img.crop((0, offset, src_w, offset + new_h))

        story_img = story_img.resize((IMG_W, IMG_H), Image.Resampling.LANCZOS)

        if has_alpha:
            canvas_rgba = Image.new("RGBA", (IMG_W, IMG_H), BG + (255,))
            canvas_rgba.paste(story_img, (0, 0), story_img)
            img.paste(canvas_rgba.convert("RGB"), (IMG_X, IMG_Y))
        else:
            img.paste(story_img.convert("RGB"), (IMG_X, IMG_Y))
    except Exception as e:
        print(f"Illustration processing failed: {e}")
        image_bytes = None

if not image_bytes or not story_img:
    # Placeholder
    placeholder = Image.new("RGB", (IMG_W, IMG_H), accent + (20,))
    img.paste(placeholder, (IMG_X, IMG_Y))

# Frame (3px amber)
draw.rectangle(
    [IMG_X - 3, IMG_Y - 3, IMG_X + IMG_W + 3, IMG_Y + IMG_H + 3],
    outline=AMBER + (70,),
    width=3,
)

# --- Headline (right) ---
HEADLINE_SIZE = 40
LINE_SPACING = 10

try:
    h_font = ImageFont.truetype(FONT_TITLE, HEADLINE_SIZE) if FONT_TITLE else ImageFont.load_default()
except Exception:
    h_font = ImageFont.load_default()

def wrap_text(text, font, max_w):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test_val = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test_val, font=font)
        if bbox[2] - bbox[0] > max_w and current:
            lines.append(current)
            current = word
        else:
            current = test_val
    if current:
        lines.append(current)
    return lines

wrapped = wrap_text(title, h_font, TEXT_MAX_W)
text_y = IMG_Y + 8
for line in wrapped:
    bbox = draw.textbbox((0, 0), line, font=h_font)
    text_h = bbox[3] - bbox[1]
    draw.text((TEXT_X, text_y), line, fill=INK, font=h_font)
    text_y += text_h + LINE_SPACING

# Category below headline
cat_y = text_y + 20
cat_dot_r = 6
cat_dot_x = TEXT_X + cat_dot_r
cat_dot_y = cat_y + 8
draw.ellipse(
    [cat_dot_x - cat_dot_r, cat_dot_y - cat_dot_r, cat_dot_x + cat_dot_r, cat_dot_y + cat_dot_r],
    fill=accent + (220,)
)

try:
    cat_font = ImageFont.truetype(FONT_BODY, 22) if FONT_BODY else ImageFont.load_default()
except Exception:
    cat_font = ImageFont.load_default()

draw.text((cat_dot_x + cat_dot_r + 10, cat_y), category_label, fill=WARM, font=cat_font)

# --- Bottom brand bar ---
bar_line_y = BAR_Y
for x in range(MARGIN, W - MARGIN):
    progress = abs(x - W // 2) / (W // 2 - MARGIN)
    alpha_line = max(0, int(50 * (1 - progress)))
    if alpha_line > 0:
        draw.point((x, bar_line_y), fill=accent + (alpha_line,))

# Subtle bar background
for y in range(bar_line_y + 2, H):
    t = (y - bar_line_y - 2) / (H - bar_line_y - 2)
    alpha = int(12 * t)
    draw.rectangle([(0, y), (W, y + 1)], fill=(26, 24, 21, alpha))

# Category dot + label in bar
bar_dot_r = 4
bar_dot_cx = MARGIN
bar_dot_cy = bar_line_y + (H - bar_line_y) // 2 + 2
draw.ellipse(
    [bar_dot_cx - bar_dot_r, bar_dot_cy - bar_dot_r, bar_dot_cx + bar_dot_r, bar_dot_cy + bar_dot_r],
    fill=accent
)

try:
    bar_font = ImageFont.truetype(FONT_TITLE, 17) if FONT_TITLE else ImageFont.load_default()
except Exception:
    bar_font = ImageFont.load_default()

cat_bar_text = category_label.upper()
cat_bbox = draw.textbbox((0, 0), cat_bar_text, font=bar_font)
bar_text_h = cat_bbox[3] - cat_bbox[1]
cat_bar_y = bar_line_y + (H - bar_line_y - bar_text_h) // 2 + 2
draw.text((bar_dot_cx + bar_dot_r + 10, cat_bar_y), cat_bar_text, fill=WARM, font=bar_font)

try:
    brand_font = ImageFont.truetype(FONT_BODY, 15) if FONT_BODY else ImageFont.load_default()
except Exception:
    brand_font = ImageFont.load_default()

brand_bbox = draw.textbbox((0, 0), "NurEine", font=brand_font)
brand_w = brand_bbox[2] - brand_bbox[0]
brand_h = brand_bbox[3] - brand_bbox[1]
brand_x = W - MARGIN - brand_w
brand_y = bar_line_y + (H - bar_line_y - brand_h) // 2 + 2
draw.text((brand_x, brand_y), "NurEine", fill=FAINT, font=brand_font)

# --- Subtitle below image (optional, if space allows) ---
if dek:
    try:
        dek_font = ImageFont.truetype(FONT_BODY, 18) if FONT_BODY else ImageFont.load_default()
    except Exception:
        dek_font = ImageFont.load_default()
    # Place subtitle below the image frame, left-aligned
    dek_y = IMG_Y + IMG_H + 20
    dek_wrapped = wrap_text(dek, dek_font, W - 2 * MARGIN)
    for dline in dek_wrapped[:1]:  # Only first line to keep it compact
        dbbox = draw.textbbox((0, 0), dline, font=dek_font)
        if draw.textbbox((0, 0), dline, font=dek_font)[2] - draw.textbbox((0, 0), dline, font=dek_font)[0] < W - 2 * MARGIN:
            draw.text((MARGIN, dek_y), dline, fill=FAINT, font=dek_font)

# ------------------------------------------------------------------
# Save
# ------------------------------------------------------------------
out_dir = os.path.join(_SCRIPT_DIR, "..", "media")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "test-story-og-real.png")
img.save(out_path, format="PNG", optimize=True, compress_level=9)
print(f"\nSaved: {out_path}")
print(f"Headline: {len(wrapped)} lines at {HEADLINE_SIZE}px")
print(f"Illustration: {IMG_W}x{IMG_H}")
