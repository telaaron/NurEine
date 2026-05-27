#!/usr/bin/env python3
"""
NurEine — Generate Category Fallback Images

Creates one paper collage editorial illustration per category,
saved to static/images/ for use as fallback/placeholder images.

Usage:
    python scripts/generate_fallback_images.py
"""
from __future__ import annotations

import io
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("fallback_images")

load_dotenv()

FAL_KEY = os.environ.get("FAL_KEY")
FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"

PROJECT_DIR = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_DIR / "static" / "images"

if not FAL_KEY:
    log.error("FAL_KEY not set")
    sys.exit(1)

# Category → prompt definitions
CATEGORIES: list[dict[str, str]] = [
    {
        "category": "klima",
        "label": "Klima",
        "accent": "sage green",
        "symbol": "a layered paper tree with roots spreading into folded earth textures",
    },
    {
        "category": "gesundheit",
        "label": "Gesundheit",
        "accent": "rose red",
        "symbol": "a paper heart with abstract healing light rays radiating outward",
    },
    {
        "category": "wissenschaft",
        "label": "Wissenschaft",
        "accent": "sky blue",
        "symbol": "a paper DNA double helix with tiny paper molecule shapes orbiting",
    },
    {
        "category": "gemeinschaft",
        "label": "Gemeinschaft",
        "accent": "terracotta orange",
        "symbol": "two overlapping paper hands meeting with layered paper community shapes",
    },
    {
        "category": "tiere",
        "label": "Tiere",
        "accent": "sage green",
        "symbol": "a layered paper bird in flight with leaf-shaped paper wing layers",
    },
    {
        "category": "kultur",
        "label": "Kultur",
        "accent": "terracotta orange",
        "symbol": "an open paper book with musical notes and paint elements floating upward",
    },
    {
        "category": "innovation",
        "label": "Innovation",
        "accent": "sky blue",
        "symbol": "a paper lightbulb with layered gear cutouts and tech paper elements",
    },
]

STYLE = (
    "made of layered matte paper cutouts on warm off-white #f5f1ea canvas. "
    "Visible paper grain texture, soft cast shadows between paper layers. "
    "Flat semi-abstract premium magazine style. "
    "No text. No 3D, no photorealism, no glossy materials."
)


def generate_image(prompt: str) -> bytes | None:
    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "prompt": prompt,
        "image_size": FAL_IMAGE_SIZE,
        "num_images": 1,
        "enable_safety_checker": True,
    }
    try:
        resp = requests.post(FAL_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        submission = resp.json()

        status_url = submission.get("status_url")
        if status_url:
            elapsed = 0
            while elapsed < 180:
                time.sleep(3)
                elapsed += 3
                sr = requests.get(status_url, headers=headers, timeout=30)
                sr.raise_for_status()
                sd = sr.json()
                if sd.get("status") == "COMPLETED":
                    submission = sd
                    break
                if sd.get("status") in ("FAILED", "CANCELLED"):
                    log.error("  Failed")
                    return None
            else:
                log.error("  Timed out")
                return None

        images = submission.get("images", [])
        if not images or not images[0].get("url"):
            return None
        img_resp = requests.get(images[0]["url"], timeout=60)
        img_resp.raise_for_status()
        return img_resp.content
    except Exception as exc:
        log.error("  Generation failed: %s", exc)
        return None


def composite_on_canvas(image_bytes: bytes) -> bytes:
    try:
        from PIL import Image
    except ImportError:
        return image_bytes
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        w, h = img.size
        pixels = img.load()
        CANVAS = (245, 241, 234)
        THRESHOLD = 225
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a > 0 and r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
                    whiteness = min(r, g, b) / 255.0
                    blend = whiteness ** 1.5
                    nr = int(CANVAS[0] * blend + r * (1 - blend))
                    ng = int(CANVAS[1] * blend + g * (1 - blend))
                    nb = int(CANVAS[2] * blend + b * (1 - blend))
                    pixels[x, y] = (nr, ng, nb, a)
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    except Exception:
        return image_bytes


def run() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    log.info("Generating %d category fallback images...", len(CATEGORIES))

    for cat in CATEGORIES:
        slug = cat["category"]
        label = cat["label"]
        accent = cat["accent"]
        symbol = cat["symbol"]

        log.info("[%s] %s", slug, label)

        prompt = (
            f"Warm paper collage editorial illustration of {symbol} {STYLE} "
            f"Accented in {accent}."
        )

        raw = generate_image(prompt)
        if not raw:
            log.error("  SKIP — generation failed for %s", slug)
            continue

        processed = composite_on_canvas(raw)

        # Save as optimized JPEG (for faster web delivery)
        try:
            from PIL import Image as PILImage
            img = PILImage.open(io.BytesIO(processed)).convert("RGB")
            jpg_path = OUTPUT_DIR / f"category-{slug}.jpg"
            img.save(jpg_path, format="JPEG", quality=85, optimize=True, progressive=True)
            log.info("  Saved: %s", jpg_path.name)

            # Also save a WebP version
            webp_path = OUTPUT_DIR / f"category-{slug}.webp"
            img.save(webp_path, format="WEBP", quality=80)
            log.info("  Saved: %s", webp_path.name)
        except Exception as exc:
            log.error("  Save failed: %s", exc)

        time.sleep(1)

    log.info("DONE — %d fallback images generated", len(CATEGORIES))


if __name__ == "__main__":
    run()
