#!/usr/bin/env python3
"""
NurEine — Shared image encoding helper.

Every story-image pipeline (fetch, regen, reprocess, backfill, test) ends
with the same step: composite the generated image onto the brand canvas,
then encode it for upload. This centralizes that final encode step so all
pipelines produce consistently small files instead of full-resolution PNGs.
"""

from __future__ import annotations

from io import BytesIO

# Story images are displayed at well under 1000px in the UI (cards, hero,
# detail view). 1200px covers retina at typical display sizes without
# shipping the full ~1500-2560px generator output.
MAX_DIMENSION = 1200
JPEG_QUALITY = 85


def encode_story_image(img) -> bytes:
    """Downscale (if needed) and encode a PIL Image as JPEG for upload.

    Takes a PIL Image (RGBA or RGB) already composited onto the brand
    canvas, flattens transparency onto the canvas colour, resizes to fit
    within MAX_DIMENSION, and returns JPEG bytes. JPEG instead of PNG
    because these are photographic/illustration content, not flat
    graphics — JPEG at q85 is visually indistinguishable here and runs
    5-10x smaller (source PNGs averaged ~730 KB).
    """
    from PIL import Image as PILImage

    if img.mode in ("RGBA", "LA", "P"):
        CANVAS = (245, 241, 234)  # #F5F1EA — must match composite_on_canvas
        background = PILImage.new("RGB", img.size, CANVAS)
        background.paste(img, mask=img.convert("RGBA").split()[-1])
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), PILImage.LANCZOS)

    buf = BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()
