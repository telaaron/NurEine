#!/usr/bin/env python3
"""Generate all NurEine logo and favicon assets from the original SVG.
Creates a clean wordmark SVG without the white circle background,
sets correct viewBox to fit the full logo (teardrop icon + wordmark).
"""

import cairosvg
import subprocess
from pathlib import Path
from PIL import Image
import re

PROJECT = Path("/Users/aaronpfutzner/Dateien - Local/lichtblick")
IMAGES = PROJECT / "static" / "images"
IMAGES.mkdir(parents=True, exist_ok=True)

# Read original SVG and extract relevant groups
orig = Path("/Users/aaronpfutzner/Downloads/NurEine.svg").read_text()

# Extract the colored groups (teardrop icon) and white group (wordmark text)
# Skip the white circle background (first path in white group)
colored_groups = re.findall(r'<g fill="#(?:272626|171616|e7632c|af3e1d)">.*?</g>', orig, re.DOTALL)

# For the white group, keep the text path but skip the circle background
white_group_match = re.search(r'<g fill="#ffffff">(.*?)</g>', orig, re.DOTALL)
white_text_paths = []
if white_group_match:
    white_paths = re.findall(r'<path d="([^"]*)"', white_group_match.group(1))
    # First path is the circle bg, rest are the wordmark letterforms
    if len(white_paths) > 1:
        for p in white_paths[1:]:
            white_text_paths.append(f'    <path d="{p}"/>')

# ViewBox: fit all content with padding
# Content bounds: X -252 to 1714, Y -279 to 664
PAD = 40
VB_X = -292
VB_Y = -279
VB_W = 2046
VB_H = 984

# Build clean SVG
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="2046" height="984" viewBox="{VB_X} {VB_Y} {VB_W} {VB_H}" fill="none">
  <!-- NurEine logo — teardrop icon + wordmark -->

  {/* White wordmark letterforms (render as dark text since we have no dark bg now) */}
  <g fill="#1a1815">
{chr(10).join(white_text_paths)}
  </g>

  {/* Teardrop icon */}
  <g fill="#272626">
    <path d="M995 1714 c-89.80 -7.60 -173.60 -47.40 -242 -115 -58.40 -57.60 -98.80 -124.40 -126 -208.20 -12.60 -39 -23 -99.60 -23 -135 l0 -17.80 213 0 213 0 0 239 0 239 -8.40 -0.20 c-4.80 -0.20 -16.60 -1 -26.60 -1.80z"/>
    <path d="M606.20 1181.60 c1.40 -2.60 20.20 -37 41.80 -76.60 21.80 -39.60 58.60 -107 82 -150 23.40 -42.80 47.60 -87.40 54 -99 6.40 -11.60 17 -30.80 23.40 -43 6.60 -12 33.40 -61.20 59.60 -109 26.20 -47.80 70.80 -130.20 99.20 -183 28.40 -52.80 52.60 -97.20 53.80 -98.60 1.40 -1.40 3.80 -2.40 5.60 -2 3.20 0.60 3.40 18.80 4.40 233.60 0.80 170.60 0.40 233.40 -1.20 234.40 -1.20 0.80 -3.40 4.40 -5 8 -1.40 3.60 -20.60 40.80 -42.60 82.60 -21.80 41.80 -51.40 98 -65.60 125 -14.20 27 -29.60 56.40 -34.20 65.60 l-8.20 16.40 -134.80 0 -134.60 0 2.40 -4.40z"/>
  </g>
  <g fill="#171616">
    <path d="M1021.60 1713.40 c1.80 -2.20 2.40 -55.40 2 -239.20 l-0.60 -236.20 210.80 0 210.80 0 -1.20 28.60 c-5.20 124.80 -62.80 252.20 -152.60 337.20 -72.20 68.40 -154.20 104.60 -251.80 111.20 -17.40 1.20 -19.60 1 -17.40 -1.60z"/>
    <path d="M1166 1168.40 c-9 -18 -40.40 -77.80 -94.40 -180.40 -47.20 -89.40 -53.20 -102 -49.60 -104.40 2.60 -1.80 3 -29.40 2.40 -231.80 -0.40 -172.20 -1 -229.60 -2.80 -228.60 -1.40 0.80 -1.60 0.60 -0.80 -0.80 3.40 -5.60 7.60 -0.80 20.40 23.20 25.80 49 147.40 272 361.80 664.40 19 34.60 36 66 37.80 69.60 l3.40 6.40 -134.60 0 -134.60 0 -9 -17.60z"/>
  </g>
  <g fill="#e7632c">
    <path d="M864 1185.40 c0 -0.40 5.80 -11.40 12.60 -24.60 7 -13 24 -45.40 37.80 -71.80 13.80 -26.40 42.20 -80.40 63 -120 20.80 -39.60 39 -75 40.40 -78.40 2.80 -7 8.80 -8.80 11 -3.40 0.60 1.80 1.20 69.60 1.20 151 l0 147.80 -83 0 c-45.60 0 -83 -0.20 -83 -0.60z"/>
  </g>
  <g fill="#af3e1d">
    <path d="M1024 1038 c0 -81.40 -0.80 -148 -1.60 -148 -0.80 0 -2.80 1.20 -4.20 2.60 -1.60 1.40 -1.40 0 0.60 -4.20 1.80 -3.40 4.20 -6.40 5.20 -6.40 1 0 7.40 10.60 13.80 23.60 6.60 13 24.60 48 40.20 77.60 52.40 99 67.40 127.60 85 161.80 9.60 18.80 18.40 34.80 19.20 36 1 1 1.80 2.60 1.80 3.40 0 0.80 -36 1.60 -80 1.60 l-80 0 0 -148z"/>
  </g>
</svg>
'''

# Write cleaned SVG
logo_path = PROJECT / "static" / "logo.svg"
logo_path.write_text(svg)
print(f"Wrote {logo_path}")

# Render to verify
cairosvg.svg2png(bytestring=svg.encode(), write_to="/tmp/nureine_clean.png", output_width=1024)
print("Verification render: /tmp/nureine_clean.png")

# ── Logo PNGs + WebPs ──
ASPECT = VB_W / VB_H  # 2046/984 ≈ 2.08
svg_bytes = svg.encode()
logo_sizes = [48, 96, 180, 360, 720]

for w in logo_sizes:
    h = round(w / ASPECT)
    png = cairosvg.svg2png(bytestring=svg_bytes, output_width=w, output_height=h)
    png_path = IMAGES / f"logo-{w}.png"
    png_path.write_bytes(png)
    print(f"  logo-{w}.png ({w}×{h})")

    # WebP
    webp_path = IMAGES / f"logo-{w}.webp"
    subprocess.run(
        ["cwebp", "-q", "90", "-o", str(webp_path), str(png_path)],
        capture_output=True,
    )
    print(f"  logo-{w}.webp")

# ── Favicon: square SVG with full logo centered ──
# The logo occupies VB_X=-292 to VB_X+VB_W=1754 horizontally
# and VB_Y=-279 to VB_Y+VB_H=705 vertically (in original coords)
# For a 2048×2048 square canvas, center the logo:
# Center of logo: X = (-292+1754)/2 = 731, Y = (-279+705)/2 = 213
# Center of square: X = 1024, Y = 1024
# Shift: X = 1024-731 = 293, Y = 1024-213 = 811
# So translate the content group by (293, 811)

# Actually, the original coords in NurEine.svg are in the 2048×2048 space
# Our clean SVG has viewBox="-292 -279 2046 984"
# To center in a 2048×2048 square:
# Content center X: (-292 + -292+2046)/2 = (-292 + 1754)/2 = 731
# Content center Y: (-279 + -279+984)/2 = (-279 + 705)/2 = 213
# Target center: 1024, 1024
# Shift: dx=293, dy=811

# Simplest approach: just use viewBox that centers the content in a 2048 square
# Full logo fits in: VB_X=-292 to 1754, VB_Y=-279 to 705
# Center of logo bounds: X=731, Y=213
# 2048 square center: 1024, 1024
# Shift: dx=293, dy=811

# But with viewBox we can't shift without transform. Let's use a wrapper group.
# Alternative: compute a square viewBox that centers the logo.
# Logo width=2046, height=984. To fit in a square, we need square side = max(2046, 984) = 2046
# So viewBox width = 2046, height = 2046
# Center content in that square:
# Content center X = (2046)/2 = 1023
# Current content X range: -292 to 1754, midpoint = 731
# So viewBox x = 731 - 1023 = -292 (perfect - it's already centered horizontally!)
# Content center Y = (2046)/2 = 1023
# Current content Y range: -279 to 705, midpoint = 213
# So viewBox y = 213 - 1023 = -810

# Simpler approach: use square viewBox that fits the content with extra padding
# Content needs at least 2046 width and 984 height
# Square side = 2046. Extra vertical = 2046 - 984 = 1062
# Pad top = 1062/2 = 531, pad bottom = 531
# viewBox: x = -292, y = -279 - 531 = -810
# Wait, that puts the wordmark too high. Let me just use a transform group.

# The cleanSVG viewBox is "-292 -279 2046 984"
# In a square, I want to center it:
# Horizontal: already centered in 2046 width (from -292 to 1754, which is 2046)
# Vertical: content is -279 to 705 (height 984). In a 2046-tall square, center at 1023.
# Vert center = (-279+705)/2 = 213
# Shift to center at 1023: dy = 1023 - 213 = 810
# So transform="translate(0, 810)"

# Build favicon SVG
# Use viewBox="-292 -810 2046 2046" to avoid transforms

favicon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-292 -810 2046 2046" fill="none">
  <g fill="#1a1815">
{chr(10).join(white_text_paths)}
  </g>
  <g fill="#272626">
    <path d="M995 1714 c-89.80 -7.60 -173.60 -47.40 -242 -115 -58.40 -57.60 -98.80 -124.40 -126 -208.20 -12.60 -39 -23 -99.60 -23 -135 l0 -17.80 213 0 213 0 0 239 0 239 -8.40 -0.20 c-4.80 -0.20 -16.60 -1 -26.60 -1.80z"/>
    <path d="M606.20 1181.60 c1.40 -2.60 20.20 -37 41.80 -76.60 21.80 -39.60 58.60 -107 82 -150 23.40 -42.80 47.60 -87.40 54 -99 6.40 -11.60 17 -30.80 23.40 -43 6.60 -12 33.40 -61.20 59.60 -109 26.20 -47.80 70.80 -130.20 99.20 -183 28.40 -52.80 52.60 -97.20 53.80 -98.60 1.40 -1.40 3.80 -2.40 5.60 -2 3.20 0.60 3.40 18.80 4.40 233.60 0.80 170.60 0.40 233.40 -1.20 234.40 -1.20 0.80 -3.40 4.40 -5 8 -1.40 3.60 -20.60 40.80 -42.60 82.60 -21.80 41.80 -51.40 98 -65.60 125 -14.20 27 -29.60 56.40 -34.20 65.60 l-8.20 16.40 -134.80 0 -134.60 0 2.40 -4.40z"/>
  </g>
  <g fill="#171616">
    <path d="M1021.60 1713.40 c1.80 -2.20 2.40 -55.40 2 -239.20 l-0.60 -236.20 210.80 0 210.80 0 -1.20 28.60 c-5.20 124.80 -62.80 252.20 -152.60 337.20 -72.20 68.40 -154.20 104.60 -251.80 111.20 -17.40 1.20 -19.60 1 -17.40 -1.60z"/>
    <path d="M1166 1168.40 c-9 -18 -40.40 -77.80 -94.40 -180.40 -47.20 -89.40 -53.20 -102 -49.60 -104.40 2.60 -1.80 3 -29.40 2.40 -231.80 -0.40 -172.20 -1 -229.60 -2.80 -228.60 -1.40 0.80 -1.60 0.60 -0.80 -0.80 3.40 -5.60 7.60 -0.80 20.40 23.20 25.80 49 147.40 272 361.80 664.40 19 34.60 36 66 37.80 69.60 l3.40 6.40 -134.60 0 -134.60 0 -9 -17.60z"/>
  </g>
  <g fill="#e7632c">
    <path d="M864 1185.40 c0 -0.40 5.80 -11.40 12.60 -24.60 7 -13 24 -45.40 37.80 -71.80 13.80 -26.40 42.20 -80.40 63 -120 20.80 -39.60 39 -75 40.40 -78.40 2.80 -7 8.80 -8.80 11 -3.40 0.60 1.80 1.20 69.60 1.20 151 l0 147.80 -83 0 c-45.60 0 -83 -0.20 -83 -0.60z"/>
  </g>
  <g fill="#af3e1d">
    <path d="M1024 1038 c0 -81.40 -0.80 -148 -1.60 -148 -0.80 0 -2.80 1.20 -4.20 2.60 -1.60 1.40 -1.40 0 0.60 -4.20 1.80 -3.40 4.20 -6.40 5.20 -6.40 1 0 7.40 10.60 13.80 23.60 6.60 13 24.60 48 40.20 77.60 52.40 99 67.40 127.60 85 161.80 9.60 18.80 18.40 34.80 19.20 36 1 1 1.80 2.60 1.80 3.40 0 0.80 -36 1.60 -80 1.60 l-80 0 0 -148z"/>
  </g>
</svg>
'''

favicon_path = IMAGES / "favicon.svg"
favicon_path.write_text(favicon_svg)
print(f"  favicon.svg")

# Favicon PNGs
favicon_bytes = favicon_svg.encode()
for size, name in [(16, "favicon-16.png"), (32, "favicon-32.png"), (180, "favicon-180.png")]:
    png = cairosvg.svg2png(bytestring=favicon_bytes, output_width=size, output_height=size)
    out = IMAGES / name
    out.write_bytes(png)
    print(f"  {name}")

# Favicon ICO
img16 = Image.open(IMAGES / "favicon-16.png")
ico = IMAGES / "favicon.ico"
img16.save(ico, format="ICO", sizes=[(16, 16), (32, 32)])
# Also add 32
img32 = Image.open(IMAGES / "favicon-32.png")
img16.save(ico, format="ICO", sizes=[(16, 16), (32, 32)])
print(f"  favicon.ico")

print("\n✅ All assets generated!")
