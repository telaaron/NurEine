#!/usr/bin/env python3
"""
ONE-OFF: Generate a sample story OG with the new "Editorial Spread" layout.
Just to preview it before we commit to the full redesign.

Run: python scripts/_test_new_og_design.py
Output: media/test-story-og-new.png
"""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR))

# Use the same font discovery as the main script
from generate_og_images import _discover_fonts, FONT_TITLE, FONT_BODY

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

# Colors
BG     = (245, 241, 234)   # #f5f1ea  canvas
INK    = (26, 24, 21)      # #1a1815  headline
WARM   = (107, 99, 89)     # #6b6359  subtitle
FAINT  = (154, 144, 135)   # #9a9087  url / brand
AMBER  = (200, 115, 64)    # #c87340  accent
WHITE  = (245, 241, 234)

# Layout
MARGIN = 48
BAR_HEIGHT = 44
BAR_Y = H - BAR_HEIGHT
IMG_W = 560
IMG_H = 440
IMG_X = MARGIN
IMG_Y = MARGIN
TEXT_X = IMG_X + IMG_W + 40
TEXT_MAX_W = W - TEXT_X - MARGIN

# Test story data (realistic example)
title = "Chemiker entwickeln neuartiges Material das CO2 aus der Luft filtert"
category = "wissenschaft"
category_label = "Wissenschaft"

# ------------------------------------------------------------------
# Canvas
# ------------------------------------------------------------------
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# ------------------------------------------------------------------
# 1) Story illustration — framed on the left
# ------------------------------------------------------------------
# For this test, generate a placeholder illustration (gradient + shapes)
# that simulates what FLUX.1 might produce
placeholder = Image.new("RGB", (IMG_W, IMG_H), (230, 225, 215))
placeholder_draw = ImageDraw.Draw(placeholder, "RGBA")

# Create a simple abstract placeholder that looks semi-realistic
# Soft gradient background
for y in range(IMG_H):
    t = y / IMG_H
    r = int(220 + 15 * t)
    g = int(215 + 10 * t)
    b = int(205 + 5 * t)
    placeholder_draw.rectangle([(0, y), (IMG_W, y + 1)], fill=(r, g, b))

# Add some abstract shapes to simulate an illustration
# Large circle (like a molecule / CO2 structure)
for i in range(5, 0, -1):
    radius = 60 + i * 25
    alpha = 60 - i * 8
    cx = 200
    cy = 180
    placeholder_draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=(200, 115, 64, alpha)
    )
placeholder_draw.ellipse(
    [140, 120, 260, 240],
    fill=(200, 115, 64, 200)
)

# Second molecule
placeholder_draw.ellipse(
    [300, 180, 420, 300],
    fill=(90, 122, 82, 160)
)

# Third structure
for i in range(4, 0, -1):
    r2 = 40 + i * 20
    a = 50 - i * 8
    placeholder_draw.ellipse(
        [260 - r2, 300 - r2, 260 + r2, 300 + r2],
        fill=(108, 138, 168, a)
    )

# Small particles / dots
for _ in range(30):
    import random
    random.seed(_)
    px = random.randint(20, IMG_W - 20)
    py = random.randint(20, IMG_H - 20)
    pr = random.randint(2, 6)
    pa = random.randint(30, 80)
    placeholder_draw.ellipse(
        [px - pr, py - pr, px + pr, py + pr],
        fill=(180, 160, 140, pa)
    )

# Paste illustration onto canvas
img.paste(placeholder, (IMG_X, IMG_Y))

# Frame border (subtle amber, 3px)
frame_color = AMBER + (60,)
draw.rectangle(
    [IMG_X - 3, IMG_Y - 3, IMG_X + IMG_W + 3, IMG_Y + IMG_H + 3],
    outline=frame_color,
    width=3,
)

# ------------------------------------------------------------------
# 2) Headline — right side, bold, on solid beige
# ------------------------------------------------------------------
HEADLINE_SIZE = 40
LINE_SPACING = 10

try:
    h_font = ImageFont.truetype(FONT_TITLE, HEADLINE_SIZE) if FONT_TITLE else ImageFont.load_default()
except Exception:
    h_font = ImageFont.load_default()

# Manual word wrap
def wrap_text(text, font, max_w):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_w and current:
            lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)
    return lines

wrapped = wrap_text(title, h_font, TEXT_MAX_W)

# Draw headline lines
text_y = IMG_Y + 8
for line in wrapped:
    bbox = draw.textbbox((0, 0), line, font=h_font)
    text_h = bbox[3] - bbox[1]
    draw.text((TEXT_X, text_y), line, fill=INK, font=h_font)
    text_y += text_h + LINE_SPACING

# Category dot + label below headline
cat_y = text_y + 20
cat_dot_r = 6
cat_dot_x = TEXT_X + cat_dot_r
cat_dot_y = cat_y + 8
draw.ellipse(
    [cat_dot_x - cat_dot_r, cat_dot_y - cat_dot_r, cat_dot_x + cat_dot_r, cat_dot_y + cat_dot_r],
    fill=AMBER + (220,)
)

try:
    cat_font = ImageFont.truetype(FONT_BODY, 22) if FONT_BODY else ImageFont.load_default()
except Exception:
    cat_font = ImageFont.load_default()

cat_text_x = cat_dot_x + cat_dot_r + 10
draw.text((cat_text_x, cat_y), category_label, fill=WARM, font=cat_font)

# ------------------------------------------------------------------
# 3) Bottom brand bar
# ------------------------------------------------------------------
# Soft amber accent line
bar_line_y = BAR_Y
for x in range(MARGIN, W - MARGIN):
    progress = abs(x - W // 2) / (W // 2 - MARGIN)
    alpha_line = max(0, int(50 * (1 - progress)))
    if alpha_line > 0:
        draw.point((x, bar_line_y), fill=AMBER + (alpha_line,))

# Bar background (very subtle)
bar_fill_y = bar_line_y + 2
for y in range(bar_fill_y, H):
    t = (y - bar_fill_y) / (H - bar_fill_y)
    alpha = int(12 * t)
    draw.rectangle([(0, y), (W, y + 1)], fill=(26, 24, 21, alpha))

# Category dot (bottom bar)
bar_dot_r = 4
bar_dot_cx = MARGIN
bar_dot_cy = bar_line_y + (H - bar_line_y) // 2 + 2
draw.ellipse(
    [bar_dot_cx - bar_dot_r, bar_dot_cy - bar_dot_r, bar_dot_cx + bar_dot_r, bar_dot_cy + bar_dot_r],
    fill=AMBER
)

# Category label in bar
try:
    bar_font = ImageFont.truetype(FONT_TITLE, 17) if FONT_TITLE else ImageFont.load_default()
except Exception:
    bar_font = ImageFont.load_default()

cat_bar_x = bar_dot_cx + bar_dot_r + 10
cat_bar_text = category_label.upper()
cat_bbox = draw.textbbox((0, 0), cat_bar_text, font=bar_font)
bar_text_h = cat_bbox[3] - cat_bbox[1]
cat_bar_y = bar_line_y + (H - bar_line_y - bar_text_h) // 2 + 2
draw.text((cat_bar_x, cat_bar_y), cat_bar_text, fill=WARM, font=bar_font)

# Brand name in bar (right)
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

# ------------------------------------------------------------------
# Save
# ------------------------------------------------------------------
out_dir = os.path.join(_SCRIPT_DIR, "..", "media")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "test-story-og-new.png")
img.save(out_path, format="PNG", optimize=True, compress_level=9)
print(f"Saved: {out_path}")
print(f"Layout: {W}x{H}, Illustration: {IMG_W}x{IMG_H}, Headline: {len(wrapped)} lines at {HEADLINE_SIZE}px")
