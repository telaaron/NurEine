#!/usr/bin/env python3
"""
NurEine — Image Backfill (Single Test)

Generates a test image for ONE story. Uses FLUX pro on white background,
then software-replaces white pixels with #FBF6EE.
"""

from __future__ import annotations

import logging
import os
import sys
import time
import uuid
from typing import Any

import requests
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
log = logging.getLogger("test_image")

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
FAL_KEY = os.environ.get("FAL_KEY")

FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"
FAL_POLL_INTERVAL = 2
FAL_POLL_TIMEOUT = 120
STORAGE_BUCKET = "story_images"

TEST_STORY_ID = sys.argv[1] if len(sys.argv) > 1 else None

# Target background color
TARGET_BG = (251, 246, 238)  # #FBF6EE
WHITE_THRESHOLD = 240  # pixels with all channels >= this are considered "white"

# ---------------------------------------------------------------------------
# Background replacement: white -> #FBF6EE with soft edges
# ---------------------------------------------------------------------------
def replace_white_background(img: Image.Image) -> Image.Image:
    """Replace white/near-white pixels with #FBF6EE, preserving alpha for soft edges."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # If pixel is white-ish (all channels above threshold)
            if r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD and a > 0:
                # Calculate how "white" it is (for anti-aliased edge blending)
                whiteness = min(r, g, b) / 255.0
                # Blend: fully white pixels become #FBF6EE, edge pixels blend proportionally
                blend = whiteness
                nr = int(TARGET_BG[0] * blend + r * (1 - blend))
                ng = int(TARGET_BG[1] * blend + g * (1 - blend))
                nb = int(TARGET_BG[2] * blend + b * (1 - blend))
                pixels[x, y] = (nr, ng, nb, a)

    return img

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------
def supabase_get(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
    resp = requests.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()

def supabase_patch(table: str, data: dict[str, Any], row_id: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    resp = requests.patch(url, headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}, json=data, timeout=30)
    resp.raise_for_status()

def generate_image(prompt: str) -> bytes | None:
    resp = requests.post(FAL_ENDPOINT, json={"prompt": prompt, "image_size": FAL_IMAGE_SIZE, "num_images": 1, "enable_safety_checker": True}, headers={"Authorization": f"Key {FAL_KEY}", "Content-Type": "application/json"}, timeout=30)
    resp.raise_for_status()
    submission = resp.json()

    status_url = submission.get("status_url")
    if status_url:
        elapsed = 0
        while elapsed < FAL_POLL_TIMEOUT:
            time.sleep(FAL_POLL_INTERVAL)
            elapsed += FAL_POLL_INTERVAL
            sr = requests.get(status_url, headers={"Authorization": f"Key {FAL_KEY}"}, timeout=30)
            sr.raise_for_status()
            sd = sr.json()
            if sd.get("status") == "COMPLETED":
                submission = sd
                break
            if sd.get("status") in ("FAILED", "CANCELLED"):
                log.error("Failed: %s", sd)
                return None

    images = submission.get("images", [])
    if not images or not images[0].get("url"):
        return None
    img_resp = requests.get(images[0]["url"], timeout=60)
    img_resp.raise_for_status()
    return img_resp.content

def upload_image(image_bytes: bytes, filename: str) -> str | None:
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    try:
        resp = requests.post(upload_url, headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type": "image/jpeg", "x-upsert": "true"}, data=image_bytes, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("Upload failed: %s", exc)
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"


def delete_from_storage(public_url: str | None) -> None:
    if not public_url or f"/{STORAGE_BUCKET}/" not in public_url:
        return
    key = public_url.split(f"/{STORAGE_BUCKET}/", 1)[1]
    try:
        requests.delete(
            f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{key}",
            headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"},
            timeout=30,
        )
    except Exception as exc:
        log.warning("Old image delete failed (non-fatal): %s", exc)

# ---------------------------------------------------------------------------
# Category-specific objects (varied to prevent prompt caching)
# ---------------------------------------------------------------------------
CATEGORY_OBJECTS: dict[str, list[str]] = {
    "klima": [
        "a single glowing young tree sprouting from rich soil",
        "a glass terrarium with a miniature forest inside",
    ],
    "gesundheit": [
        "a single heart made of translucent glass with a warm glow inside",
        "a pill capsule split open revealing a tiny garden",
    ],
    "wissenschaft": [
        "a single Erlenmeyer flask with a miniature galaxy inside",
        "a telescope pointed at a single bright star",
    ],
    "gemeinschaft": [
        "two hands of different colors meeting in a handshake, arms forming a heart shape",
        "a single campfire with sparks turning into stars",
    ],
    "tiere": [
        "a single colorful bird mid-flight with a seed in its beak",
        "a turtle with a tiny forest growing on its back",
    ],
    "kultur": [
        "a single open antique book with a paper city rising from its pages",
        "a violin with vines growing through its f-holes",
    ],
    "innovation": [
        "a single filament lightbulb with a glowing tree inside",
        "a single gear made of wood with flowers growing between the teeth",
    ],
}

IMAGE_STYLE = (
    "Clean 3D render, isolated object perfectly centered. "
    "Pure white #FFFFFF solid background, no gradients, no environment. "
    "Single soft drop shadow directly beneath the object on the white surface. "
    "Object fully contained within frame, generous padding on all sides, not touching any edge. "
    "Soft diffused studio lighting. High-end editorial product photography style. "
    "No text, no labels, no extra elements, no ground plane, no horizon line."
)

def build_prompt(story: dict[str, Any], index: int) -> str:
    title = story.get("title", "")
    category = story.get("category", "gemeinschaft")
    objects = CATEGORY_OBJECTS.get(category, CATEGORY_OBJECTS["gemeinschaft"])
    obj = objects[index % len(objects)]
    story_id = story.get("id", "")
    seed_hint = f"Unique variant {hash(story_id) % 10000}"
    keyword = title.split(" – ")[0].split(": ")[0].split(" in ")[0].strip()[:80]
    return f"{IMAGE_STYLE} The object is: {obj}. The story is about: \"{keyword}\". {seed_hint}"

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run() -> None:
    if TEST_STORY_ID:
        stories = supabase_get("nureine_stories", {"id": f"eq.{TEST_STORY_ID}", "select": "id,title,category,image_url"})
    else:
        stories = supabase_get("nureine_stories", {"image_url": "is.null", "select": "id,title,category,image_url", "limit": "1"})

    if not stories:
        log.error("No story found.")
        sys.exit(1)

    story = stories[0]
    log.info("Testing: %s (category=%s)", story.get("title"), story.get("category"))

    prompt = build_prompt(story, 0)
    log.info("Prompt:\n%s", prompt)

    raw_bytes = generate_image(prompt)
    if not raw_bytes:
        log.error("Generation failed.")
        sys.exit(1)

    # Replace white background with #FBF6EE
    img = Image.open(BytesIO(raw_bytes))
    log.info("Original size: %dx%d", img.width, img.height)
    img = replace_white_background(img)

    from image_utils import encode_story_image
    final_bytes = encode_story_image(img)
    log.info("White background replaced with #FBF6EE, final size: %d bytes", len(final_bytes))

    short_id = uuid.uuid4().hex[:12]
    safe = story.get("title","test").lower().replace("ä","ae").replace("ö","oe").replace("ü","ue").replace("ß","ss")
    safe = "".join(c for c in safe if c.isalnum() or c == "-")[:30]
    filename = f"story-images/test-{safe}-{short_id}.jpg"

    public_url = upload_image(final_bytes, filename)
    if not public_url:
        log.error("Upload failed.")
        sys.exit(1)

    old_url = story.get("image_url")
    supabase_patch("nureine_stories", {"image_url": public_url}, story["id"])
    delete_from_storage(old_url)
    log.info("DONE — %s", public_url)


if __name__ == "__main__":
    log.info("=" * 60)
    log.info("Test — FLUX pro + white-to-#FBF6EE replacement")
    log.info("=" * 60)
    run()
