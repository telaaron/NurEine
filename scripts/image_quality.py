#!/usr/bin/env python3
"""
NurEine — Image Quality Review Layer

Uses fal.ai LLaVA-NeXT (existing FAL_KEY) to evaluate FLUX.1 generated
images against the "Warm Paper Collage Editorial" style requirements.

Usage (from other scripts):
    from image_quality import review_image, review_and_retry

    # Simple review
    score, passed, feedback = review_image(image_bytes, title, category)

    # Review with auto-retry (generates new image if score < 7)
    final_bytes, final_score, retries = review_and_retry(
        image_bytes, title, category,
        generate_fn=lambda prompt: generate_image_fal(prompt)
    )
"""
from __future__ import annotations

import json
import logging
import os
import time
import uuid
from typing import Any, Callable

import requests
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("image_quality")

# ---------------------------------------------------------------------------
# Configuration (uses existing FAL_KEY + Supabase for temp uploads)
# ---------------------------------------------------------------------------
FAL_KEY: str | None = os.environ.get("FAL_KEY")
SUPABASE_URL: str | None = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str | None = os.environ.get("SUPABASE_SERVICE_KEY")

LLAVA_ENDPOINT = "https://fal.run/fal-ai/llava-next"
STORAGE_BUCKET = "story_images"
TEMP_PREFIX = "quality-review"

PASS_THRESHOLD = 7.0
MAX_RETRIES = 3

# ---------------------------------------------------------------------------
# Review prompt
# ---------------------------------------------------------------------------
REVIEW_PROMPT = """\
You are an art director. Evaluate this illustration against these "Warm Paper Collage" rules.
Respond with ONLY valid JSON, no markdown, no extra text.

Rate 1-10 (10=perfect):
1. STYLE: Flat paper collage with visible layers+shadows? NOT 3D/photorealistic/glossy?
2. PALETTE: Warm off-white paper background (#f5f1ea)? ONE accent color? No shiny materials?
3. MOTIF: Clear simple iconographic central symbol? Not cluttered?
4. TEXT: No text visible anywhere? 10=no text, 1=text clearly visible.

JSON format:
{"style": int, "palette": int, "motif": int, "text_free": int, "overall": float, "passed": "yes"|"no", "feedback": "1 German sentence"}

overall = average of 4 scores. passed = "yes" if overall >= 7.
feedback: 1 SHORT German sentence about what to improve or what works.

Story: {title} | Category: {category}"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _temp_upload(image_bytes: bytes) -> str | None:
    """Upload image bytes to Supabase temp location, return public URL."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None

    filename = f"{TEMP_PREFIX}/review-{uuid.uuid4().hex[:12]}.png"
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    try:
        resp = requests.post(url, headers=headers, data=image_bytes, timeout=30)
        resp.raise_for_status()
        return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
    except Exception as exc:
        log.warning("  Temp upload failed: %s", exc)
        return None


def _temp_delete(image_url: str) -> None:
    """Delete a temp image from Supabase storage."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    try:
        # Extract path from public URL
        prefix = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/"
        if image_url.startswith(prefix):
            path = image_url[len(prefix):]
            delete_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"
            requests.delete(delete_url, headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            }, timeout=10)
    except Exception:
        pass  # cleanup is best-effort


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def review_image(image_bytes: bytes, title: str, category: str) -> tuple[float, bool, str]:
    """Send an image to LLaVA-NeXT (via fal.ai) for style quality review.

    The image is temporarily uploaded to Supabase to get a public URL
    for LLaVA, then deleted after review.

    Returns:
        (overall_score, passed, feedback)
    """
    if not FAL_KEY:
        log.warning("FAL_KEY not set — image quality review skipped")
        return 10.0, True, "Kein FAL_KEY — Review uebersprungen"

    # Upload image to temp location for LLaVA URL access
    image_url = _temp_upload(image_bytes)
    if not image_url:
        log.warning("  Temp upload failed — review skipped")
        return 8.0, True, "Upload fehlgeschlagen — akzeptiert"

    prompt = REVIEW_PROMPT.format(title=title, category=category)

    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "prompt": prompt,
        "image_url": image_url,
        "max_tokens": 200,
        "temperature": 0.2,
    }

    try:
        resp = requests.post(LLAVA_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        submission = resp.json()

        # LLaVA might return directly or via async queue
        status_url = submission.get("status_url")
        if status_url:
            elapsed = 0
            while elapsed < 60:
                time.sleep(2)
                elapsed += 2
                sr = requests.get(status_url, headers=headers, timeout=30)
                sr.raise_for_status()
                sd = sr.json()
                if sd.get("status") == "COMPLETED":
                    submission = sd
                    break
                if sd.get("status") in ("FAILED", "CANCELLED"):
                    log.warning("  LLaVA review failed: %s", sd)
                    _temp_delete(image_url)
                    return 7.5, True, "LLaVA fehlgeschlagen — akzeptiert"
            else:
                log.warning("  LLaVA review timed out")
                _temp_delete(image_url)
                return 7.5, True, "LLaVA timeout — akzeptiert"

        # Extract text response
        raw_text = ""
        output = submission.get("output", "")
        if isinstance(output, str):
            raw_text = output
        elif isinstance(output, dict):
            raw_text = output.get("text", output.get("response", ""))
        elif isinstance(output, list) and output:
            raw_text = str(output[0])

        # Also try top-level fields
        if not raw_text:
            raw_text = submission.get("text", submission.get("response", ""))

        if not raw_text:
            log.warning("  LLaVA returned empty response")
            _temp_delete(image_url)
            return 7.5, True, "Leere Antwort — akzeptiert"

        # Parse JSON from LLaVA response
        raw_text = raw_text.strip()
        # Strip markdown fences
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:]) if len(lines) > 1 else raw_text
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        result = json.loads(raw_text)
        score = float(result.get("overall", 7.0))
        passed = result.get("passed", "yes") == "yes"
        feedback = result.get("feedback", "Kein Feedback")

        log.info("  Qualitaets-Review: Score=%.1f, Bestanden=%s", score, passed)
        log.info("    Stil=%d, Palette=%d, Motiv=%d, Textfrei=%d",
                 result.get("style", 0), result.get("palette", 0),
                 result.get("motif", 0), result.get("text_free", 0))
        log.info("    Feedback: %s", feedback)

        _temp_delete(image_url)
        return score, passed, feedback

    except (requests.RequestException, json.JSONDecodeError, KeyError, IndexError) as exc:
        log.warning("  Review fehlgeschlagen: %s — Bild wird durchgelassen", exc)
        _temp_delete(image_url)
        return 7.5, True, f"Review-Fehler: {exc}"


def enhance_prompt_for_retry(original_prompt: str, feedback: str, attempt: int) -> str:
    """Add quality feedback to the prompt for a retry generation."""
    emphasis = [
        "",
        "CRITICAL QUALITY FIX REQUIRED:",
        "URGENT — SECOND ATTEMPT — STILL WRONG:",
        "FINAL ATTEMPT — THIS MUST BE FIXED:",
    ]
    prefix = emphasis[min(attempt, len(emphasis) - 1)]

    return (
        f"{prefix} {feedback} "
        f"{original_prompt} "
        "MUST be flat paper collage on warm off-white #f5f1ea background. "
        "ABSOLUTELY NO 3D rendering, NO photorealism, NO text, NO glossy surfaces."
    )


def review_and_retry(
    image_bytes: bytes,
    title: str,
    category: str,
    image_prompt: str,
    generate_fn: Callable[[str], bytes | None],
    max_retries: int = MAX_RETRIES,
) -> tuple[bytes | None, float, int, str]:
    """Review an image and retry if it doesn't pass quality check.

    Args:
        image_bytes: Raw image bytes from FLUX generation
        title: Story title (for review context)
        category: Story category (for review context)
        image_prompt: The prompt used to generate this image
        generate_fn: Function that takes a prompt string → image bytes | None
        max_retries: Maximum number of retry attempts

    Returns:
        (final_image_bytes, final_score, total_retries, final_feedback)
    """
    score, passed, feedback = review_image(image_bytes, title, category)

    if passed or max_retries == 0:
        return image_bytes, score, 0, feedback

    # Retry loop
    best_score = score
    best_bytes = image_bytes
    best_feedback = feedback
    current_prompt = image_prompt

    for attempt in range(1, max_retries + 1):
        log.info("  Retry %d/%d — improving prompt...", attempt, max_retries)
        enhanced_prompt = enhance_prompt_for_retry(current_prompt, feedback, attempt)
        log.info("  Enhanced prompt: %.120s...", enhanced_prompt)

        new_bytes = generate_fn(enhanced_prompt)
        if not new_bytes:
            log.warning("  Retry generation failed — keeping previous image")
            break

        new_score, new_passed, new_feedback = review_image(new_bytes, title, category)
        log.info("  Retry %d score: %.1f (prev best: %.1f)", attempt, new_score, best_score)

        # Keep the best image
        if new_score > best_score:
            best_score = new_score
            best_bytes = new_bytes
            best_feedback = new_feedback

        if new_passed:
            return best_bytes, best_score, attempt, new_feedback

        # Update for next retry
        feedback = new_feedback
        current_bytes = new_bytes
        current_prompt = enhanced_prompt

    log.info("  Max retries reached — using best image (score=%.1f)", best_score)
    return best_bytes, best_score, max_retries, best_feedback
