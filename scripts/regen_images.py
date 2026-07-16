#!/usr/bin/env python3
"""
NurEine — Re-generate images for the 3 most recent stories.
Uses the current image_prompt instructions from fetch_stories.py.
"""
from __future__ import annotations

import io
import json
import logging
import os
import sys
import time
import uuid
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

# Try to import image quality review (graceful fallback)
try:
    from image_quality import review_and_retry
    from image_quality import review_prompt_and_retry
    HAS_QUALITY_REVIEW = True
except ImportError:
    HAS_QUALITY_REVIEW = False
    def review_and_retry(*args, **kwargs):
        return args[0], 10.0, 0, "Review not available"
    def review_prompt_and_retry(image_prompt, title, category, max_retries=2):
        return image_prompt, True, ""

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("regen")

# ── Config ─────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
FAL_KEY = os.environ.get("FAL_KEY")

DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"
STORAGE_BUCKET = "story_images"

# ── Image-prompt-only instruction (paper collage style) ──
IMAGE_PROMPT_INSTRUCTION = """\
Create an English prompt for the FLUX.1 image AI. Style: "Warm editorial paper collage illustration". The image looks like a handcrafted paper cutout collage — multiple overlapping matte paper layers with visible edges, paper fibre grain texture, and soft cast shadows between layers. Depth comes ONLY from paper overlap. NO 3D rendering, NO photorealism, NO glossy/shinny/plastic materials. Warm off-white paper background (#f5f1ea canvas tone). One accent colour that fits the topic: terracotta orange, sage green, rose red, or sky blue. A single central iconographic symbol represents the story — abstracted and simple.

Format: "Warm paper collage editorial illustration of [SIMPLE SYMBOL], made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in [COLOUR]. Visible paper grain texture, soft cast shadows between paper layers. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism, no glossy materials."

Respond ONLY with the image prompt text — no JSON, no explanation, no extra words."""

# ── Helpers ────────────────────────────────────────────────────────────
def supabase_get(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    resp = requests.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_patch(table: str, data: dict[str, Any], row_id: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    resp = requests.patch(url, headers=headers, json=data, timeout=30)
    resp.raise_for_status()


def call_deepseek_for_prompt(story: dict[str, Any]) -> str | None:
    """Ask DeepSeek for just an image prompt based on story title/category."""
    title = story.get("title", "")
    category = story.get("category", "")

    user = f"Title: {title}\nCategory: {category}\n\n{IMAGE_PROMPT_INSTRUCTION}"

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a creative director. Generate FLUX.1 image prompts."},
            {"role": "user", "content": user},
        ],
        "temperature": 0.5,
    }

    try:
        resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        # Remove markdown code fences if present
        if content.startswith('"') and content.endswith('"'):
            content = content[1:-1]
        return content
    except Exception as exc:
        log.error("  DeepSeek failed: %s", exc)
        return None


def generate_image_fal(prompt: str) -> bytes | None:
    headers = {"Authorization": f"Key {FAL_KEY}", "Content-Type": "application/json"}
    payload = {"prompt": prompt, "image_size": FAL_IMAGE_SIZE, "num_images": 1, "enable_safety_checker": True}

    try:
        resp = requests.post(FAL_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        submission = resp.json()

        status_url = submission.get("status_url")
        if status_url:
            elapsed = 0
            while elapsed < 120:
                time.sleep(2)
                elapsed += 2
                sr = requests.get(status_url, headers=headers, timeout=30)
                sr.raise_for_status()
                sd = sr.json()
                if sd.get("status") == "COMPLETED":
                    submission = sd
                    break
                if sd.get("status") in ("FAILED", "CANCELLED"):
                    log.error("  Generation failed: %s", sd)
                    return None
            else:
                log.error("  Generation timed out")
                return None

        images = submission.get("images", [])
        if not images or not images[0].get("url"):
            return None
        img_resp = requests.get(images[0]["url"], timeout=60)
        img_resp.raise_for_status()
        return img_resp.content
    except Exception as exc:
        log.error("  FLUX.1 failed: %s", exc)
        return None


def composite_on_canvas(image_bytes: bytes) -> bytes:
    """Soft-composite onto exact brand canvas #F5F1EA, then downscale +
    encode as JPEG for upload (see image_utils.encode_story_image)."""
    try:
        from PIL import Image
    except ImportError:
        return image_bytes
    from image_utils import encode_story_image
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        w, h = img.size
        pixels = img.load()
        CANVAS = (245, 241, 234)  # #F5F1EA
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
        return encode_story_image(img)
    except Exception:
        return image_bytes


def delete_from_storage(public_url: str | None) -> None:
    """Best-effort delete of a previous story image so regenerating never
    leaves an orphaned object behind in the bucket."""
    if not public_url or f"/{STORAGE_BUCKET}/" not in public_url:
        return
    key = public_url.split(f"/{STORAGE_BUCKET}/", 1)[1]
    try:
        requests.delete(
            f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{key}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            },
            timeout=30,
        )
    except Exception as exc:
        log.warning("  Old image delete failed (non-fatal): %s", exc)


def upload_to_storage(image_bytes: bytes, filename: str) -> str | None:
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
    }
    try:
        resp = requests.post(url, headers=headers, data=image_bytes, timeout=60)
        resp.raise_for_status()
        return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
    except Exception as exc:
        log.error("  Upload failed: %s", exc)
        return None


# ── Main ───────────────────────────────────────────────────────────────
def run() -> None:
    # 1. Fetch 3 most recent stories
    log.info("Fetching 3 most recent stories...")
    stories = supabase_get("nureine_stories", {
        "select": "id,title,category,region,image_url",
        "order": "created_at.desc",
        "limit": "3",
    })
    log.info("Found %d stories.", len(stories))

    for i, story in enumerate(stories, 1):
        log.info("=" * 70)
        log.info("[%d/3] %s (category=%s)", i, story["title"], story.get("category", "-"))
        log.info("=" * 70)

        # 2. Get image prompt from DeepSeek
        log.info("  Asking DeepSeek for image prompt...")
        prompt = call_deepseek_for_prompt(story)
        if not prompt:
            log.error("  SKIP — no prompt generated")
            continue
        log.info("  Prompt: %s", prompt)

        # 2b. Stage 1: Prompt quality review (DeepSeek, fast text check)
        if HAS_QUALITY_REVIEW:
            prompt, was_clean, retry_reason = review_prompt_and_retry(
                prompt, story["title"], story.get("category", "gemeinschaft"), max_retries=2
            )
            if not was_clean:
                log.info("  Prompt fixed: %s", prompt)

        # 3. Generate image via FLUX.1 [pro]
        raw = generate_image_fal(prompt)
        if not raw:
            log.error("  SKIP — generation failed")
            continue
        log.info("  Raw image: %d bytes", len(raw))

        # 3b. Quality review with GPT-4o-mini (retry up to 2x if score < 7)
        if HAS_QUALITY_REVIEW:
            raw, qscore, qretries, qfeedback = review_and_retry(
                raw, story["title"], story.get("category", "gemeinschaft"),
                prompt, generate_image_fal, max_retries=2
            )
            log.info("  Quality: %.1f/10 (%d retries) — %s", qscore, qretries, qfeedback)

        # 4. Composite onto brand canvas
        processed = composite_on_canvas(raw)
        log.info("  Canvas composite: %d -> %d bytes", len(raw), len(processed))

        # 5. Upload
        short_id = uuid.uuid4().hex[:12]
        safe = story["title"].lower()
        for umlaut in [("ä","ae"),("ö","oe"),("ü","ue"),("ß","ss")]:
            safe = safe.replace(*umlaut)
        safe = "".join(c for c in safe if c.isalnum() or c == "-")[:40]
        filename = f"story-images/{safe}-{short_id}.jpg"

        public_url = upload_to_storage(processed, filename)
        if not public_url:
            log.error("  SKIP — upload failed")
            continue
        log.info("  Uploaded: %s", public_url)

        # 7. Update database (delete the old image afterward so a failed
        # DB write never leaves the story pointing at a deleted object)
        old_url = story.get("image_url")
        supabase_patch("nureine_stories", {"image_url": public_url}, story["id"])
        log.info("  DB updated. ✓")
        delete_from_storage(old_url)

    log.info("\nDONE — 3 stories processed.")


if __name__ == "__main__":
    run()
