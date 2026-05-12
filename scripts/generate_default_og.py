#!/usr/bin/env python3
"""
NurEine Default OG Image — bold, iconic, editorial.

Composition: Left-aligned editorial typography over a warm beige background,
accented by an abstract rising sun (a single glowing amber orb) on the right
to symbolize "Lichtblick" and the single daily good news.

Output: static/og-default.png (1200x630)
"""
from __future__ import annotations

import os
import sys

_sd = os.path.dirname(__file__)
sys.path.insert(0, _sd)

from generate_og_images import _discover_fonts, FONT_TITLE, FONT_BODY
_discover_fonts()

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

# Colors — warm, editorial palette
BG    = (245, 241, 234)  # #f5f1ea
INK   = (26, 24, 21)     # #1a1815
SOFT  = (107, 99, 89)    # #6b6359
AMBER = (200, 115, 64)   # #c87340

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# ------------------------------------------------------------------
# Geometry: The "Lichtblick" (Sunburst/Halo)
# ------------------------------------------------------------------
# A large circle radiating warmth on the right side
center_x = int(W * 0.75)
center_y = int(H * 0.5)
base_radius = 280

# Draw subtle blooming halos
for i in range(12, 0, -1):
    r = base_radius + (i * 25)
    alpha = int(40 * (1 - (i / 12)))
    draw.ellipse([center_x - r, center_y - r, center_x + r, center_y + r], fill=AMBER + (alpha,))

# Draw the solid sun
draw.ellipse([center_x - base_radius, center_y - base_radius, center_x + base_radius, center_y + base_radius], fill=AMBER + (255,))

# ------------------------------------------------------------------
# Typography layout: Left side editorial 
# ------------------------------------------------------------------
left_margin = 100
top_margin = 140

# Wordmark
wordmark_part_1 = "Nur"
wordmark_part_2 = "Eine"
wordmark_size = 130
try:
    wm_font = ImageFont.truetype(FONT_TITLE, wordmark_size) if FONT_TITLE else ImageFont.load_default()
except Exception:
    wm_font = ImageFont.load_default()

p1_bbox = draw.textbbox((0, 0), wordmark_part_1, font=wm_font)
p1_w = p1_bbox[2] - p1_bbox[0]
wm_h = p1_bbox[3] - p1_bbox[1]

draw.text((left_margin, top_margin), wordmark_part_1, fill=INK, font=wm_font)
draw.text((left_margin + p1_w, top_margin), wordmark_part_2, fill=BG, font=wm_font) # Contrast "Eine" against the sun if it overlaps, but it's on left. Wait, BG text might be invisible. Let's stick to INK for all, or maybe amber for 'Eine'.

# Let's use INK for all, but maybe highlight 'Eine' in AMBER where it's on BG, or just use INK.
p2_color = INK
draw.text((left_margin + p1_w, top_margin), wordmark_part_2, fill=p2_color, font=wm_font)


# Rule under wordmark
rule_y = top_margin + wm_h + 30
draw.line([(left_margin, rule_y), (left_margin + 60, rule_y)], fill=INK, width=6)

# Tagline
tagline = "Gute Nachrichten.\nJeden Tag exakt eine."
tagline_size = 52
try:
    tag_font = ImageFont.truetype(FONT_TITLE, tagline_size) if FONT_TITLE else ImageFont.load_default()
except Exception:
    tag_font = ImageFont.load_default()

draw.text((left_margin, rule_y + 40), tagline, fill=INK, font=tag_font, spacing=20)

# Bottom text: url
try:
    dom_font = ImageFont.truetype(FONT_BODY, 26) if FONT_BODY else ImageFont.load_default()
except Exception:
    dom_font = ImageFont.load_default()

draw.text((left_margin, H - left_margin), "nureine.de", fill=SOFT, font=dom_font)

# ------------------------------------------------------------------
# Save
# ------------------------------------------------------------------
out = os.path.join(_sd, "..", "static", "og-default.png")
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, format="PNG", optimize=True)
print(f"Default OG saved: {out}")
