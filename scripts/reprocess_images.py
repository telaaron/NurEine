#!/usr/bin/env python3
"""
NurEine — Reprocess All Existing Story Images

Finds all stories that have image_url set, downloads each image,
removes the background (white → transparent), auto-fits the object
with padding, re-uploads, and updates the DB record.

Also feeds the transparent image through generate_og_images so
Open Graph share images are updated too.

Usage:
    python scripts/reprocess_images.py
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("reprocess")

# ── Config ─────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
STORAGE_BUCKET = "story_images"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    log.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY")
    sys.exit(1)


def supabase_get(path: str, params: dict | None = None) -> list[dict[str, Any]]:
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_patch(table: str, data: dict, row_id: str) -> None:
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}",
        headers=headers, json=data, timeout=30,
    )
    resp.raise_for_status()


def supabase_upload(image_bytes: bytes, filename: str) -> str | None:
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    try:
        resp = requests.post(url, headers=headers, data=image_bytes, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("  Upload failed: %s", exc)
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"


# ── Background removal (forked from fetch_stories.py) ──────────────────
def remove_background(image_bytes: bytes) -> bytes | None:
    try:
        from PIL import Image as PILImage
        from rembg import remove
    except (ImportError, SystemExit):
        log.warning("  rembg not available")
        return None
    try:
        img = PILImage.open(io.BytesIO(image_bytes)).convert("RGBA")
        result = remove(img, alpha_matting=True)
        buf = io.BytesIO()
        result.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    except (SystemExit, Exception) as exc:
        log.warning("  rembg failed: %s", exc)
        return None


# ── Auto-fit (forked from fetch_stories.py) ────────────────────────────
def fit_object_in_frame(image_bytes: bytes) -> bytes | None:
    from PIL import Image as PILImage

    try:
        img = PILImage.open(io.BytesIO(image_bytes))
        if img.mode != "RGBA":
            return None
        w, h = img.size
        bbox = img.split()[-1].getbbox()
        if bbox is None:
            return None

        pad_pct = 0.20
        obj_x1, obj_y1, obj_x2, obj_y2 = bbox
        obj_w, obj_h = obj_x2 - obj_x1, obj_y2 - obj_y1
        pad_px = int(max(obj_w, obj_h) * pad_pct)
        obj_cx, obj_cy = obj_x1 + obj_w // 2, obj_y1 + obj_h // 2

        # Size the crop region to match the canvas aspect ratio (w:h)
        padded_dim = max(obj_w, obj_h) + 2 * pad_px
        crop_w = max(int(padded_dim), int(padded_dim * w / h * 0.9))
        crop_h = int(crop_w * h / w)

        # Ensure object fits
        if crop_w < obj_w + 2 * pad_px or crop_h < obj_h + 2 * pad_px:
            crop_w = int(max(obj_w + 2 * pad_px, (obj_h + 2 * pad_px) * w / h))
            crop_h = int(max(obj_h + 2 * pad_px, (obj_w + 2 * pad_px) * h / w))

        cx1, cy1 = obj_cx - crop_w // 2, obj_cy - crop_h // 2
        cx2, cy2 = cx1 + crop_w, cy1 + crop_h
        if cx1 < 0:
            cx2 -= cx1
            cx1 = 0
        if cy1 < 0:
            cy2 -= cy1
            cy1 = 0
        if cx2 > w:
            cx1 -= cx2 - w
            cx2 = w
        if cy2 > h:
            cy1 -= cy2 - h
            cy2 = h
        actual_w, actual_h = cx2 - cx1, cy2 - cy1
        cropped = img.crop((cx1, cy1, cx2, cy2))
        result = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
        margin_factor = 0.85
        scale = min(w / actual_w, h / actual_h) * margin_factor
        new_w, new_h = int(actual_w * scale), int(actual_h * scale)
        resized = cropped.resize((new_w, new_h), PILImage.LANCZOS)
        paste_x, paste_y = (w - new_w) // 2, (h - new_h) // 2
        result.paste(resized, (paste_x, paste_y))
        buf = io.BytesIO()
        result.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    except Exception as exc:
        log.warning("  auto-fit failed: %s", exc)
        return None


# ── OG image regeneration ──────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from generate_og_images import compose_og_image  # noqa: E402


def regenerate_og(story: dict, image_bytes: bytes) -> str | None:
    title = story.get("title", "")
    dek = story.get("subtitle") or story.get("summary", "")
    category = story.get("category", "innovation")
    label = story.get("category_label", category.capitalize())

    og_bytes = compose_og_image(
        story_title=title,
        story_dek=dek,
        category=category,
        image_bytes=image_bytes,
    )
    if not og_bytes:
        return None

    short_id = uuid.uuid4().hex[:8]
    filename = f"og-images/{story.get('id','story')[:12]}-{short_id}.png"
    return supabase_upload(og_bytes, filename)


# ── Main ───────────────────────────────────────────────────────────────
def run():
    # (a) Count total stories
    count_resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/nureine_stories",
        headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"},
        params={"select": "count"},
        timeout=30,
    )
    count_resp.raise_for_status()
    total = count_resp.json()[0]["count"]
    log.info("Total stories in DB: %d", total)

    # (b) Fetch all stories (Supabase REST has no "not null" filter, so fetch all)
    all_stories = supabase_get("nureine_stories", params={
        "select": "id,title,subtitle,summary,category,image_url,og_image_url",
    })
    stories = [s for s in all_stories if s.get("image_url")]
    without_count = sum(1 for s in all_stories if not s.get("image_url"))
    log.info("Stories with image: %d, without: %d", len(stories), without_count)

    if not stories:
        log.info("Nothing to reprocess.")
        return

    success = 0
    failed = 0
    skipped = 0

    for i, story in enumerate(stories):
        story_id = story["id"]
        title = story.get("title", "(no title)")
        slug = story_id[:40]  # Use truncated ID as filename slug
        image_url = story.get("image_url", "")

        log.info("[%d/%d] %s", i + 1, len(stories), title[:80])
        log.info("  URL: %.100s", image_url)

        # (1) Download existing image
        try:
            resp = requests.get(image_url, timeout=60)
            resp.raise_for_status()
            image_bytes = resp.content
        except requests.RequestException as exc:
            log.warning("  ❌ Download failed: %s", exc)
            failed += 1
            continue

        # Check if already transparent (RGBA with alpha)
        try:
            from PIL import Image as PILImage
            test_img = PILImage.open(io.BytesIO(image_bytes))
            if test_img.mode == "RGBA":
                alpha = test_img.split()[-1]
                bbox = alpha.getbbox()
                if bbox:
                    alpha_vals = list(alpha.getdata())
                    transparent_pct = sum(1 for a in alpha_vals if a < 255) / len(alpha_vals) * 100
                    if transparent_pct > 50:
                        log.info("  ⏭ Already transparent (%.0f%%), skipping", transparent_pct)
                        skipped += 1
                        continue
        except Exception:
            pass  # Can't check, just reprocess

        # (2) Remove background
        image_bytes_nobg = remove_background(image_bytes)
        if not image_bytes_nobg:
            log.warning("  ⏭ BG removal unavailable, skipping")
            failed += 1
            continue

        # (3) Auto-fit
        image_bytes_fit = fit_object_in_frame(image_bytes_nobg)
        if image_bytes_fit:
            image_bytes = image_bytes_fit
        else:
            image_bytes = image_bytes_nobg
            log.info("  Auto-fit skipped (object already ok)")

        # (4) Upload new image
        short_id = uuid.uuid4().hex[:8]
        filename = f"story-images/{slug[:40]}-reproc-{short_id}.png"
        new_url = supabase_upload(image_bytes, filename)
        if not new_url:
            failed += 1
            continue

        # (5) Regenerate OG image
        try:
            new_og_url = regenerate_og(story, image_bytes)
            if new_og_url:
                supabase_patch("nureine_stories", {"image_url": new_url, "og_image_url": new_og_url}, story_id)
                log.info("  ✓ Updated (image + OG)")
            else:
                supabase_patch("nureine_stories", {"image_url": new_url}, story_id)
                log.info("  ✓ Updated (image only, OG skipped)")
        except Exception:
            supabase_patch("nureine_stories", {"image_url": new_url}, story_id)
            log.info("  ✓ Updated (image only)")

        log.info("  → %s", new_url)
        success += 1
        time.sleep(0.5)  # gentle rate limit

    log.info("=" * 50)
    log.info("Done. Success: %d  Failed: %d  Skipped: %d", success, failed, skipped)


if __name__ == "__main__":
    run()
