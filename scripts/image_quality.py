#!/usr/bin/env python3
"""
NurEine — Image Quality Review Layer

Uses GPT-4o-mini vision to evaluate FLUX.1 generated images against
the "Warm Paper Collage Editorial" style requirements.

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

import base64
import json
import logging
import os
from typing import Any, Callable

import requests
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("image_quality")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

REVIEW_MODEL = "gpt-4o-mini"
PASS_THRESHOLD = 7.0
MAX_RETRIES = 3

# ---------------------------------------------------------------------------
# Review prompt
# ---------------------------------------------------------------------------
REVIEW_SYSTEM = (
    "You are an experienced art director reviewing AI-generated editorial "
    "illustrations for a premium magazine. You evaluate images against "
    "strict style guidelines. Respond ONLY with the requested JSON — "
    "no markdown, no explanation outside the JSON."
)

REVIEW_USER = """\
Evaluate this AI-generated illustration against the "Warm Paper Collage Editorial" style.

Rate each criterion from 1-10 (10 = perfect, 1 = completely wrong):

1. STYLE (1-10): Is this a flat paper collage illustration? Visible paper layers
   with cast shadows? Paper grain texture? NOT 3D rendered, NOT photorealistic,
   NOT glossy/plastic? 10 = perfect paper collage, 1 = photorealistic/3D render.

2. PALETTE (1-10): Warm off-white paper background (#f5f1ea tone)? ONE accent
   colour (terracotta orange / sage green / rose red / sky blue)? No shiny
   or glossy materials? 10 = perfect palette, 1 = completely wrong colours.

3. MOTIF (1-10): Clear, simple, iconographic central symbol? Abstracted but
   recognizable? Not cluttered or confusing? 10 = perfect clear motif,
   1 = chaotic/unrecognizable.

4. TEXT (1-10): Is the image free of text? 10 = absolutely no text visible
   anywhere. 1 = text is clearly visible in the image.

OVERALL: Average of the 4 scores above, rounded to 1 decimal.
PASSED: "yes" if overall >= 7.0, "no" if below.
FEEDBACK: One SHORT sentence in German. If passed: what works well. If failed:
what specifically needs improvement (e.g. "zu fotorealistisch", "fehlende
Papiertextur", "falsche Farbpalette", "Text im Bild").

Story: {title}
Category: {category}

Respond with ONLY this JSON, nothing else:
{{"style": <int>, "palette": <int>, "motif": <int>, "text_free": <int>, "overall": <float>, "passed": "<yes/no>", "feedback": "<string>"}}"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def review_image(image_bytes: bytes, title: str, category: str) -> tuple[float, bool, str]:
    """Send an image to GPT-4o-mini for style quality review.

    Returns:
        (overall_score, passed, feedback)
        - overall_score: float 1-10
        - passed: True if score >= PASS_THRESHOLD
        - feedback: German feedback string
    """
    if not OPENAI_API_KEY:
        log.warning("OPENAI_API_KEY not set — image quality review skipped")
        return 10.0, True, "Kein API-Key — Review uebersprungen"

    img_b64 = base64.b64encode(image_bytes).decode("utf-8")
    user_content = REVIEW_USER.format(title=title, category=category)

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": REVIEW_MODEL,
        "messages": [
            {"role": "system", "content": REVIEW_SYSTEM},
            {"role": "user", "content": [
                {"type": "text", "text": user_content},
                {"type": "image_url", "image_url": {
                    "url": f"data:image/png;base64,{img_b64}",
                    "detail": "low",
                }},
            ]},
        ],
        "temperature": 0.2,
        "max_tokens": 200,
    }

    try:
        resp = requests.post(OPENAI_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        raw = data["choices"][0]["message"]["content"].strip()

        # Strip markdown fences
        raw = raw.strip("`").strip("json").strip()

        result = json.loads(raw)
        score = float(result.get("overall", 7.0))
        passed = result.get("passed", "yes") == "yes"
        feedback = result.get("feedback", "Kein Feedback")

        log.info("  Qualitaets-Review: Score=%.1f, Bestanden=%s", score, passed)
        log.info("    Stil=%d, Palette=%d, Motiv=%d, Textfrei=%d",
                 result.get("style", 0), result.get("palette", 0),
                 result.get("motif", 0), result.get("text_free", 0))
        log.info("    Feedback: %s", feedback)

        return score, passed, feedback

    except (requests.RequestException, json.JSONDecodeError, KeyError, IndexError) as exc:
        log.warning("  Review fehlgeschlagen: %s — Bild wird durchgelassen", exc)
        return 7.5, True, f"Review-Fehler: {exc}"


def enhance_prompt_for_retry(original_prompt: str, feedback: str, attempt: int) -> str:
    """Add quality feedback to the prompt for a retry generation."""
    # Get more aggressive with each retry
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
    current_bytes = image_bytes
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
