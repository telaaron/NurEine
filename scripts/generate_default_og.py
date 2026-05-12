#!/usr/bin/env python3
"""
Generates the default NurEine OG image (og-default.png) for use as fallback
when no story-specific OG image is available.

Output: scripts/../static/og-default.png (1200×630)
"""
from __future__ import annotations

import io
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

# Reuse font loading from generate_og_images
from generate_og_images import _ensure_fonts  # noqa: E402

Image, ImageDraw, ImageFont, bold_path, regular_path, serif_path = _ensure_fonts()

W, H = 1200, 630
bg = (245, 241, 234)  # #f5f1ea
accent = (200, 115, 64)  # amber accent
ink = (26, 24, 21)  # #1a1815

img = Image.new("RGB", (W, H), bg)
draw = ImageDraw.Draw(img)

# Top glow gradient
for y in range(int(H * 0.35)):
    alpha = int(20 * (1 - y / (H * 0.35)))
    for x in range(W):
        draw.point((x, y), fill=accent + (alpha,))

# Center text
try:
    title_font = ImageFont.truetype(serif_path, 56)
    tagline_font = ImageFont.truetype(regular_path, 22)
except Exception:
    title_font = ImageFont.load_default()
    tagline_font = ImageFont.load_default()

# "NurEine" centered
title_bbox = draw.textbbox((0, 0), "NurEine", font=title_font)
title_w = title_bbox[2] - title_bbox[0]
draw.text(((W - title_w) // 2, 200), "NurEine", fill=ink, font=title_font)

# Taglines
tagline1 = "Gute Nachrichten. Jeden Tag exakt eine."
t1_bbox = draw.textbbox((0, 0), tagline1, font=tagline_font)
t1_w = t1_bbox[2] - t1_bbox[0]
draw.text(((W - t1_w) // 2, 290), tagline1, fill=(58, 52, 44), font=tagline_font)

tagline2 = "nureine.de"
t2_bbox = draw.textbbox((0, 0), tagline2, font=tagline_font)
t2_w = t2_bbox[2] - t2_bbox[0]
draw.text(((W - t2_w) // 2, 330), tagline2, fill=(154, 144, 135), font=tagline_font)

# Bottom accent line
line_y = H - 72
for x in range(60, W - 60):
    alpha = max(0, 60 - int(abs(x - W // 2) / (W // 2) * 60))
    if alpha > 0:
        draw.point((x, line_y), fill=accent + (alpha,))

# Footer
try:
    footer_font = ImageFont.truetype(regular_path, 14)
except Exception:
    footer_font = ImageFont.load_default()
draw.text((60, H - 36), "NurEine", fill=(107, 99, 89), font=footer_font)
domain = "nureine.de"
d_bbox = draw.textbbox((0, 0), domain, font=footer_font)
d_w = d_bbox[2] - d_bbox[0]
draw.text((W - 60 - d_w, H - 36), domain, fill=(154, 144, 135), font=footer_font)

# Save
out_path = os.path.join(os.path.dirname(__file__), "..", "static", "og-default.png")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
img.save(out_path, format="PNG", optimize=True)
print(f"Saved: {out_path} ({W}×{H})")
