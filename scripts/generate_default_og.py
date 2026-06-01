#!/usr/bin/env python3
"""
NurEine Default OG Image — bold, iconic, editorial.

Composition: Left-aligned editorial typography over a warm beige background,
accented by an abstract rising sun (a single glowing amber orb) on the right
to symbolize "Lichtblick" and the single daily good news.

Output:
  static/og-default.png      — 1200x630 (1x, PNG, universal OG fallback)
  static/og-default-2x.png   — 2400x1260 (2x, PNG, retina displays)
  static/og-default.webp     — 1200x630 (1x, WebP, website srcset)

OG meta tag notes:
  - og:image uses PNG because iMessage, WhatsApp, Facebook, and Twitter
    DO NOT reliably support WebP in link previews.
  - WebP variants are for website <img> tags via srcset (performance).
  - The 2x PNG targets high-DPI screens (retina).
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
# Save — all formats
# ------------------------------------------------------------------
static_dir = os.path.join(_sd, "..", "static")
os.makedirs(static_dir, exist_ok=True)

# Normalize to exact 1200x630
if img.size == (1201, 631):
    img = img.crop((1, 1, 1201, 631))
elif img.size != (1200, 630):
    img = img.resize((1200, 630), Image.Resampling.LANCZOS)

# 1x PNG — universal OG compatibility (iMessage, WhatsApp, FB, Twitter)
out_png = os.path.join(static_dir, "og-default.png")
img.save(out_png, format="PNG", optimize=True, compress_level=9)
print(f"Default OG (1x PNG):  {out_png}")

# 2x PNG — retina / high-DPI displays
img_2x = img.resize((W * 2, H * 2), Image.Resampling.LANCZOS)
out_png_2x = os.path.join(static_dir, "og-default-2x.png")
img_2x.save(out_png_2x, format="PNG", optimize=True, compress_level=9)
print(f"Default OG (2x PNG):  {out_png_2x}")

# 1x WebP — website <img> srcset (modern browsers, ~60% smaller)
out_webp = os.path.join(static_dir, "og-default.webp")
img.save(out_webp, format="WEBP", quality=85, method=6)
print(f"Default OG (1x WebP): {out_webp}")
