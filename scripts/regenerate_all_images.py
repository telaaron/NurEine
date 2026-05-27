#!/usr/bin/env python3
"""
NurEine — Regenerate ALL Story Images

Regenerates images for all nureine_stories using the new
"Warm Paper Collage Editorial" style with FLUX.1 [pro].

Pipeline per story:
  1. Ask DeepSeek for a paper collage image prompt based on title + category
  2. Generate image with FLUX.1 [pro] via fal.ai
  3. Composite onto exact brand canvas #F5F1EA
  4. Upload to Supabase Storage
  5. Update the story record

Usage:
    # Test with 3 stories first
    python scripts/regenerate_all_images.py --test

    # Regenerate all 96 stories
    python scripts/regenerate_all_images.py

    # Regenerate a specific number
    python scripts/regenerate_all_images.py --limit 10

    # Regenerate specific stories by ID
    python scripts/regenerate_all_images.py --ids <uuid1> <uuid2>

Environment variables (from .env):
    SUPABASE_URL, SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY, FAL_KEY
"""
from __future__ import annotations

import io
import json
import logging
import os
import re
import sys
import time
import uuid
from typing import Any

import requests
from dotenv import load_dotenv

# Try to import image quality review (graceful fallback if not available)
try:
    from image_quality import review_and_retry as review_image_with_retry
    HAS_QUALITY_REVIEW = True
except ImportError:
    HAS_QUALITY_REVIEW = False
    def review_image_with_retry(image_bytes, title, category, prompt, generate_fn, max_retries=3):
        return image_bytes, 10.0, 0, "Review not available"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("regenerate_all")

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
FAL_KEY = os.environ.get("FAL_KEY")

DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro"
FAL_IMAGE_SIZE = "landscape_4_3"
STORAGE_BUCKET = "story_images"

MISSING: list[str] = []
for var, key in [("SUPABASE_URL", SUPABASE_URL), ("SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY),
                  ("FAL_KEY", FAL_KEY)]:
    if not key:
        MISSING.append(var)
if MISSING:
    log.error("Missing: %s", ", ".join(MISSING))
    sys.exit(1)

# ---------------------------------------------------------------------------
# Category → accent colour mapping (for prompt context)
# ---------------------------------------------------------------------------
CATEGORY_ACCENT: dict[str, str] = {
    "klima": "sage green",
    "gesundheit": "rose red",
    "wissenschaft": "sky blue",
    "gemeinschaft": "terracotta orange",
    "tiere": "sage green",
    "kultur": "terracotta orange",
    "innovation": "sky blue",
}

CATEGORY_LABELS: dict[str, str] = {
    "klima": "Klima & Umwelt",
    "gesundheit": "Gesundheit",
    "wissenschaft": "Wissenschaft",
    "gemeinschaft": "Gemeinschaft",
    "tiere": "Tiere & Natur",
    "kultur": "Kultur",
    "innovation": "Innovation",
}

# Fallback symbols per category (used if DeepSeek prompt is too vague)
CATEGORY_SYMBOLS: dict[str, str] = {
    "klima": "a paper tree with layered leaves",
    "gesundheit": "a paper heart with healing hands",
    "wissenschaft": "a paper microscope or DNA helix",
    "gemeinschaft": "two overlapping paper hands or people",
    "tiere": "a paper animal silhouette with habitat elements",
    "kultur": "an open paper book with creative elements",
    "innovation": "a paper lightbulb with geometric gear shapes",
}

# ---------------------------------------------------------------------------
# DeepSeek prompt for image generation
# ---------------------------------------------------------------------------
IMAGE_PROMPT_SYSTEM = (
    "You are an art director at a premium print magazine. "
    "Generate prompts for a 'warm paper collage editorial' illustration style. "
    "The images look like handcrafted paper cutout collages with visible paper "
    "textures, layered edges, and soft drop shadows between layers. "
    "The style is flat/semi-abstract and illustrative — NEVER 3D, NEVER photorealistic, "
    "NEVER glossy. Warm off-white paper background (#f5f1ea colour). "
    "Accent in ONE warm colour. Respond ONLY with the image prompt — no JSON, no explanation."
)

IMAGE_PROMPT_USER = """\
Create an English prompt for the FLUX.1 image AI.

Story title: {title}
Story category: {category}
Accent colour: {accent}
Category label: {category_label}
Suggested symbol: {fallback_symbol}

Style: "Warm paper collage editorial illustration". The image looks like a handcrafted paper cutout collage. Multiple overlapping paper layers with visible edges, paper fibre texture, and soft drop shadows between each layer. ONE central iconographic motif — a SIMPLE, abstracted symbol that represents the story's topic.

Technique: Flat illustrative style. Depth comes ONLY from paper overlap and cast shadows. NO 3D rendering. NO photorealism. NO glossy materials. NO plastic. NO shiny surfaces. NO environment backgrounds — the background is clean warm off-white paper (#f5f1ea).

Colours: Warm off-white paper background (#f5f1ea canvas). ONE accent colour: {accent}. The symbol is the ONLY coloured element — everything else is warm off-white paper tones.

Texture: Visible paper grain / fibre texture. Slight irregularity at cut edges. Organic, handmade feel.

CRITICAL RULES:
- ABSOLUTELY NO TEXT in the image (no letters, no words, no labels)
- MUST be flat 2D paper style — NOT 3D, NOT realistic photography, NOT glossy
- Background MUST be plain warm off-white paper (#f5f1ea) — NO environments, NO skies, NO landscapes
- ONLY one simple iconographic symbol, not a complex scene

Format: "Warm paper collage editorial illustration of [SIMPLE SYMBOL], made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in {accent}. Visible paper grain texture, soft cast shadows between paper layers. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism, no glossy materials."

Example for a mangrove story: "Warm paper collage editorial illustration of mangrove branches with layered leaves, made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in sage green. Visible paper grain texture, soft cast shadows between paper layers. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism, no glossy materials."

Respond ONLY with the image prompt — no markdown, no quotes, no explanation."""


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------
def supabase_rest_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def supabase_storage_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }


def supabase_get(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=supabase_rest_headers(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_patch(table: str, data: dict[str, Any], row_id: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    resp = requests.patch(url, headers=supabase_rest_headers(), json=data, timeout=30)
    resp.raise_for_status()


def supabase_upload(image_bytes: bytes, filename: str) -> str | None:
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    try:
        resp = requests.post(upload_url, headers=supabase_storage_headers(), data=image_bytes, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("  Upload failed: %s", exc)
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"


# ---------------------------------------------------------------------------
# DeepSeek prompt generation
# ---------------------------------------------------------------------------
def generate_image_prompt(title: str, category: str) -> str | None:
    """Ask DeepSeek to generate a paper collage image prompt for a story."""
    accent = CATEGORY_ACCENT.get(category, "terracotta orange")
    category_label = CATEGORY_LABELS.get(category, category.title())
    fallback_symbol = CATEGORY_SYMBOLS.get(category, "a symbolic paper cutout")

    user_content = IMAGE_PROMPT_USER.format(
        title=title,
        category=category,
        accent=accent,
        category_label=category_label,
        fallback_symbol=fallback_symbol,
    )

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": IMAGE_PROMPT_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.5,
    }

    try:
        resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        # Strip markdown code fences or quotes
        content = content.strip('"').strip("'")
        if content.startswith("```") and content.endswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1]).strip()
        return content
    except Exception as exc:
        log.error("  DeepSeek failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# FLUX.1 [pro] image generation
# ---------------------------------------------------------------------------
def generate_image_fal(prompt: str) -> bytes | None:
    """Generate an image using FLUX.1 [pro] via fal.ai."""
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
            while elapsed < FAL_POLL_TIMEOUT:
                time.sleep(FAL_POLL_INTERVAL)
                elapsed += FAL_POLL_INTERVAL
                sr = requests.get(status_url, headers=headers, timeout=30)
                sr.raise_for_status()
                sd = sr.json()
                if sd.get("status") == "COMPLETED":
                    submission = sd
                    break
                if sd.get("status") in ("FAILED", "CANCELLED"):
                    log.error("  Generation failed: %s", json.dumps(sd.get("error", sd), default=str)[:200])
                    return None
            else:
                log.error("  Generation timed out after %ds", FAL_POLL_TIMEOUT)
                return None

        images = submission.get("images", [])
        if not images or not images[0].get("url"):
            return None
        img_resp = requests.get(images[0]["url"], timeout=60)
        img_resp.raise_for_status()
        return img_resp.content
    except Exception as exc:
        log.error("  FLUX.1 [pro] failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Post-processing: composite onto brand canvas
# ---------------------------------------------------------------------------
def composite_on_canvas(image_bytes: bytes) -> bytes:
    """Soft-composite onto exact brand canvas #F5F1EA for colour consistency."""
    try:
        from PIL import Image
    except ImportError:
        log.warning("  PIL not available — skipping canvas composite")
        return image_bytes

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

        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    except Exception as exc:
        log.warning("  Canvas composite failed: %s", exc)
        return image_bytes


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def safe_filename(text: str) -> str:
    s = text.lower()
    for umlaut in [("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")]:
        s = s.replace(*umlaut)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:40]


# ---------------------------------------------------------------------------
# Configuration for regeneration run
# ---------------------------------------------------------------------------
FAL_POLL_INTERVAL = 3
FAL_POLL_TIMEOUT = 180
DELAY_BETWEEN_STORIES = 2  # seconds between stories (rate limiting + cooldown)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run(limit: int | None = None, story_ids: list[str] | None = None) -> None:
    log.info("=" * 60)
    log.info("NurEine — Regenerate ALL Story Images")
    log.info("Style: Warm Paper Collage Editorial | Model: FLUX.1 [pro]")
    log.info("=" * 60)

    # Fetch stories
    if story_ids:
        log.info("Fetching %d specific stories...", len(story_ids))
        stories = []
        for sid in story_ids:
            try:
                result = supabase_get("nureine_stories", {
                    "id": f"eq.{sid}",
                    "select": "id,title,category",
                })
                stories.extend(result)
            except Exception as exc:
                log.error("Failed to fetch story %s: %s", sid, exc)
    else:
        log.info("Fetching stories from Supabase...")
        params: dict[str, str] = {
            "select": "id,title,category",
            "order": "created_at.desc",
        }
        if limit:
            params["limit"] = str(limit)
        stories = supabase_get("nureine_stories", params=params)

    total = len(stories)
    if total == 0:
        log.info("No stories to process.")
        return

    log.info("Will regenerate images for %d stories.", total)

    # Cost estimate
    est_cost_per = 0.05  # FLUX pro ~$0.05/image on fal.ai
    log.info("Estimated cost: ~$%.2f (%d × ~$%.2f/image)", total * est_cost_per, total, est_cost_per)
    log.info("Estimated time: ~%d minutes (%d stories × ~15s each)", total * 15 // 60 + 1, total)

    success = 0
    failed = 0

    for i, story in enumerate(stories, 1):
        story_id = story.get("id")
        title = story.get("title", "Ohne Titel")
        category = story.get("category", "gemeinschaft")

        log.info("")
        log.info("[%d/%d] %s", i, total, title[:80])
        log.info("    Category: %s", category)

        # 1. Generate image prompt via DeepSeek
        image_prompt = generate_image_prompt(title, category)
        if not image_prompt:
            log.error("    SKIP — failed to generate image prompt")
            failed += 1
            continue
        log.info("    Prompt: %.120s...", image_prompt)

        # 2. Generate image via FLUX.1 [pro]
        raw_image = generate_image_fal(image_prompt)
        if not raw_image:
            log.error("    SKIP — image generation failed")
            failed += 1
            continue
        log.info("    Image generated: %d bytes", len(raw_image))

        # 2b. Quality review with GPT-4o-mini (retry up to 2x if score < 7)
        if HAS_QUALITY_REVIEW:
            raw_image, qscore, qretries, qfeedback = review_image_with_retry(
                raw_image, title, category, image_prompt, generate_image_fal, max_retries=2
            )
            log.info("    Quality: %.1f/10 (%d retries) — %s", qscore, qretries, qfeedback)

        # 3. Composite onto canvas
        processed = composite_on_canvas(raw_image)
        log.info("    Composited onto canvas: %d bytes", len(processed))

        # 4. Upload to Supabase Storage
        short_id = uuid.uuid4().hex[:12]
        slug = safe_filename(title)
        upload_path = f"story-images/{slug}-{short_id}.png"

        public_url = supabase_upload(processed, upload_path)
        if not public_url:
            log.error("    SKIP — upload failed")
            failed += 1
            continue

        # 5. Update database
        try:
            supabase_patch("nureine_stories", {"image_url": public_url}, story_id)
            log.info("    ✓ Uploaded: %s", public_url)
            success += 1
        except Exception as exc:
            log.error("    DB update failed: %s", exc)
            failed += 1

        # Rate limiting
        if i < total:
            time.sleep(DELAY_BETWEEN_STORIES)

    log.info("")
    log.info("=" * 60)
    log.info("DONE — Success: %d, Failed: %d, Total: %d", success, failed, total)
    log.info("=" * 60)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Regenerate all NurEine story images in the new paper collage style.")
    p.add_argument("--test", action="store_true", help="Quick test: regenerate only 3 stories")
    p.add_argument("--limit", type=int, default=None, help="Regenerate only N stories (most recent)")
    p.add_argument("--ids", nargs="+", default=None, help="Regenerate specific story UUIDs")
    args = p.parse_args()

    if args.test:
        log.info("🧪 TEST MODE — processing 3 stories")
        args.limit = 3

    try:
        run(limit=args.limit, story_ids=args.ids)
    except KeyboardInterrupt:
        log.info("Interrupted by user.")
        sys.exit(130)
    except Exception as exc:
        log.exception("Unhandled exception: %s", exc)
        sys.exit(1)
