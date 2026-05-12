#!/usr/bin/env python3
"""
NurEine — Demo: Image Prompt Experiment

Tests verschiedene FLUX.1 Prompts mit weißem Hintergrund (#ffffff),
um herauszufinden, welcher Prompt am besten mit dem Card-Background
(#faf6ee / --color-paper) zusammenarbeitet.

Generiert Test-Bilder, lädt sie in Supabase Storage und
erstellt eine Demo-Story in der DB.

Usage:
    python scripts/demo_image_prompts.py
"""
from __future__ import annotations

import io
import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("demo_prompts")

# ── Config ──────────────────────────────────────────────────────────────
FAL_KEY = os.environ.get("FAL_KEY")
FAL_ENDPOINT = "https://fal.run/fal-ai/flux/schnell"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
STORAGE_BUCKET = "story_images"

if not all([FAL_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    log.error("Missing env vars: FAL_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY")
    sys.exit(1)

# ── Card background colors (from the CSS) ───────────────────────────────
# --color-paper: #faf6ee (card surface, used by .paper class on StoryCard)
# --color-canvas: #f5f1ea (page background)
# The card image container has a gradient overlay:
#   linear-gradient(180deg, rgba(255,255,255,0.08), rgba(245,241,234,0.2))
# So the image blends from near-white at top to canvas-tinted at bottom.

# ── Experiment prompt variants ──────────────────────────────────────────
# Each variant tries a different approach to white background

DEMO_OBJECTS = [
    {
        "name": "dandelion-clock-seeds",
        "object_de": "Löwenzahn-Pusteblume",
        "object_en": "a single dandelion clock with seeds drifting away",
        "material": "delicate translucent glass",
        "concept": "hope spreading across the wind",
    },
    {
        "name": "ginkgo-leaf",
        "object_de": "Ginkgo-Blatt",
        "object_en": "a single golden ginkgo leaf",
        "material": "polished brass and silk",
        "concept": "resilience and adaptation",
    },
]

PROMPT_VARIANTS = [
    # V1: Pure white background, minimal modification from current
    {
        "id": "v1_white_bg",
        "description": "Pure white (#ffffff) background, minimal changes",
        "style_prefix": "Minimalist 3D spot illustration",
        "style_suffix": (
            "Isolated completely on pure white background #ffffff. "
            "Soft studio lighting, soft diffused shadows. "
            "High-end editorial, calming, 8K resolution. "
            "No text, no environment, no background elements. "
            "Subject centered exactly in the frame with equal empty space above and below."
        ),
    },
    # V2: White with "bright clean white" emphasis
    {
        "id": "v2_bright_white",
        "description": "Emphasizing bright clean white studio backdrop",
        "style_prefix": "Minimalist 3D spot illustration, product photography style",
        "style_suffix": (
            "Photographed on a bright clean white studio backdrop, pure white #ffffff. "
            "Soft studio lighting from above and front, soft diffused shadows beneath the subject. "
            "High-end editorial, calming, 8K resolution. "
            "No text, no environment, no background elements. "
            "Subject perfectly centered in the frame with generous empty space above and below. "
            "Clean product-shot composition, subject occupies middle 60% of the frame."
        ),
    },
    # V3: White seamless paper backdrop style
    {
        "id": "v3_seamless_paper",
        "description": "Seamless paper sweep backdrop, photorealistic reference",
        "style_prefix": "Minimalist 3D spot illustration on seamless white sweep",
        "style_suffix": (
            "Isolated on a seamless white sweep backdrop, pure white #ffffff, no horizon line visible. "
            "Soft diffused overhead lighting, subtle contact shadow beneath subject. "
            "High-end editorial product rendering, calming, photorealistic, 8K resolution. "
            "No text, no environment, no background elements. "
            "Subject centered in the middle of the frame with equal padding on all sides. "
            "Composition fills approximately 50-60% of the frame so subject is not cropped."
        ),
    },
]


# ── Helpers ─────────────────────────────────────────────────────────────

def supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def supabase_upload_image(image_bytes: bytes, filepath: str) -> str | None:
    upload_url = (
        f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filepath}"
    )
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    try:
        resp = requests.post(upload_url, headers=headers, data=image_bytes, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("  Upload failed: %s", exc)
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filepath}"


def generate_image(prompt: str) -> bytes | None:
    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt,
        "image_size": "square",
        "num_images": 1,
        "enable_safety_checker": True,
    }

    try:
        resp = requests.post(FAL_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        images = data.get("images", [])
        if not images:
            log.warning("  No images in response")
            return None
        image_url = images[0].get("url")
        if not image_url:
            return None

        img_resp = requests.get(image_url, timeout=60)
        img_resp.raise_for_status()
        return img_resp.content

    except requests.RequestException as exc:
        log.error("  Generation failed: %s", exc)
        return None


def analyze_background_color(image_bytes: bytes) -> dict[str, Any]:
    """Sample edge pixels and center to estimate the background color."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size

    # Sample corners and edges (where background should be)
    samples = []
    margin = 20
    for x in range(margin, w - margin, 30):
        samples.append(img.getpixel((x, margin)))             # top edge
        samples.append(img.getpixel((x, h - margin)))         # bottom edge
    for y in range(margin, h - margin, 30):
        samples.append(img.getpixel((margin, y)))             # left edge
        samples.append(img.getpixel((w - margin, y)))         # right edge

    # Average color of sampled pixels
    avg_r = sum(s[0] for s in samples) // len(samples)
    avg_g = sum(s[1] for s in samples) // len(samples)
    avg_b = sum(s[2] for s in samples) // len(samples)
    avg_hex = f"#{avg_r:02x}{avg_g:02x}{avg_b:02x}"

    # How close to pure white?
    whiteness = (avg_r + avg_g + avg_b) / (3 * 255) * 100

    # Distance from #faf6ee (card paper)
    target_r, target_g, target_b = 0xFA, 0xF6, 0xEE
    delta_from_paper = (
        (avg_r - target_r) ** 2 + (avg_g - target_g) ** 2 + (avg_b - target_b) ** 2
    ) ** 0.5

    return {
        "avg_background_hex": avg_hex,
        "whiteness_pct": round(whiteness, 1),
        "delta_from_card_paper_faf6ee": round(delta_from_paper, 1),
    }


# ── Main ────────────────────────────────────────────────────────────────

def run():
    log.info("=" * 70)
    log.info("NurEine — Image Prompt Demo: White Background Experiment")
    log.info("=" * 70)

    results: list[dict] = []

    for obj in DEMO_OBJECTS:
        for variant in PROMPT_VARIANTS:
            variant_id = f"demo_{variant['id']}_{obj['name']}"
            log.info("")
            log.info("─" * 60)
            log.info("Object:  %s (%s)", obj["object_de"], obj["name"])
            log.info("Variant: %s", variant["description"])
            log.info("─" * 60)

            # Build prompt
            prompt = (
                f"{variant['style_prefix']} of {obj['object_en']} "
                f"made of {obj['material']}. {obj['concept']} concept. "
                f"{variant['style_suffix']}"
            )
            log.info("Prompt: %.150s...", prompt)

            # Generate image
            log.info("  Generating with FLUX.1 [schnell]...")
            t0 = time.time()
            image_bytes = generate_image(prompt)
            elapsed = time.time() - t0

            if not image_bytes:
                log.error("  ✗ Generation failed after %.1fs", elapsed)
                results.append({"variant": variant_id, "status": "failed", "prompt": prompt})
                continue

            log.info("  ✓ Generated in %.1fs (%d bytes)", elapsed, len(image_bytes))

            # Analyze background
            bg_info = analyze_background_color(image_bytes)
            log.info(
                "  Background: %s (whiteness: %.1f%%, delta from #faf6ee: %.1f)",
                bg_info["avg_background_hex"],
                bg_info["whiteness_pct"],
                bg_info["delta_from_card_paper_faf6ee"],
            )

            # Upload to storage
            short_id = uuid.uuid4().hex[:8]
            filepath = f"demo/{variant_id}-{short_id}.png"
            public_url = supabase_upload_image(image_bytes, filepath)

            if not public_url:
                log.error("  ✗ Upload failed")
                results.append({"variant": variant_id, "status": "upload_failed", "prompt": prompt})
                continue

            log.info("  ✓ Uploaded: %s", public_url)

            results.append({
                "variant": variant_id,
                "status": "success",
                "url": public_url,
                "prompt": prompt,
                "background": bg_info,
                "object": obj["object_de"],
                "variant_desc": variant["description"],
            })

            # Small delay to respect rate limits
            time.sleep(1)

    # Summary
    log.info("")
    log.info("=" * 70)
    log.info("RESULTS SUMMARY")
    log.info("=" * 70)

    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] != "success"]

    log.info("Total: %d  Success: %d  Failed: %d", len(results), len(successful), len(failed))
    log.info("")

    for r in successful:
        log.info("  %s", r["variant"])
        log.info("    Object: %s", r.get("object"))
        log.info("    URL: %s", r["url"])
        log.info("    Background: %s (%.1f%% white, Δ #faf6ee = %.1f)",
                 r["background"]["avg_background_hex"],
                 r["background"]["whiteness_pct"],
                 r["background"]["delta_from_card_paper_faf6ee"])
        log.info("    Variant: %s", r.get("variant_desc"))
        log.info("")

    # Save results as JSON for reference
    results_path = "scripts/demo_results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    log.info("Results saved to %s", results_path)

    # Print the best result URL for easy viewing
    if successful:
        log.info("")
        log.info("=" * 70)
        log.info("OPEN IN BROWSER:")
        for r in successful:
            log.info("  %s", r["url"])


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        log.exception("Unhandled exception: %s", exc)
        sys.exit(1)
