#!/usr/bin/env python3
"""
NurEine — 2-Stage Image Quality Review Layer (NO-GO Guard)

Stage 1 — Prompt Review (DeepSeek, ~1s, cheap):
    Checks the image prompt TEXT for NO-GO violations BEFORE FLUX generation.
    Catches Frankenstein, Zoo, Medical, Kitsch early. Saves FLUX credits.

Stage 2 — Visual Review (fal.ai LLaVA-NeXT, ~90s):
    Final visual quality check on generated images. Runs only if Stage 1 passed.

Usage (from other scripts):
    from image_quality import review_image_prompt, review_image, review_and_retry

    # Stage 1: Fast text review (before generating)
    passed, reject_reason, flags = review_image_prompt(image_prompt, title, category)

    # Stage 2: Visual review (after generating)
    passed, reject_reason, score, feedback = review_image(image_bytes, title, category)

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
# Configuration (uses existing keys: FAL_KEY for vision, DEEPSEEK for prompt check)
# ---------------------------------------------------------------------------
FAL_KEY: str | None = os.environ.get("FAL_KEY")
DEEPSEEK_API_KEY: str | None = os.environ.get("DEEPSEEK_API_KEY")
SUPABASE_URL: str | None = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str | None = os.environ.get("SUPABASE_SERVICE_KEY")

LLAVA_ENDPOINT = "https://fal.run/fal-ai/llava-next"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
STORAGE_BUCKET = "story_images"
TEMP_PREFIX = "quality-review"

MAX_RETRIES = 3
MIN_QUALITY_SCORE = 5.0  # Hard-fail threshold: if best image scores below this after all retries,
                         # signal to the caller that a fresh prompt is needed

# ---------------------------------------------------------------------------
# Review prompt — 4 binary NO-GOs + GOLD criteria
# ---------------------------------------------------------------------------
REVIEW_PROMPT = """\
You are an art director for a premium B2B magazine. Evaluate this editorial illustration.

=== 4 NO-GO RULES (if ANY triggered → rejected=true) ===

NO-GO #1 — "FRANKENSTEIN": Does the image mash up TWO incompatible objects into
one unnatural hybrid? (Examples: a DNA helix with an animal jammed inside, a
stethoscope fused with a clock, a robot face fused with a child). If the image
tries to merge two unrelated things → no_go_frankenstein: true.

NO-GO #2 — "ZOO MODE": Is the main subject a LITERAL, recognizable animal, person
face, car, or famous artwork? We want ABSTRACTION, not encyclopedia illustrations.
A literal lion, turtle, car, or Mona Lisa → no_go_zoo: true.

NO-GO #3 — "MEDICAL HORROR": Does the image show internal organs, raw meat textures,
parasites, worms, bloody structures, or anything clinically repulsive? Think "would
this ruin someone's breakfast?" If yes → no_go_medical: true.

NO-GO #4 — "KITSCH & CLIPART": Does the image use overused PowerPoint metaphors?
Puzzle pieces for unity, calendar pages for time, generic handshakes, cliché hearts.
If the symbolism is lazy ClipArt-level → no_go_kitsch: true.

=== WHAT GOLD LOOKS LIKE (APPROVE) ===
Abstract geometric forms, elegant shapes, subtle color gradients, iconographic
simplicity. Examples: a luminous abstract diamond/crystal, layered concentric
rings, an abstract droplet/flask form, a stylized wave pattern. High-end,
editorial, not literal.

=== SCORING ===
style_score (1-10): How well does it match the warm paper collage style?
(Flat layers, paper texture, cast shadows, off-white #f5f1ea background)

=== OUTPUT ===
Respond ONLY with this exact JSON — no markdown, no extra text:

{{
  "no_go_frankenstein": true/false,
  "no_go_zoo": true/false,
  "no_go_medical": true/false,
  "no_go_kitsch": true/false,
  "rejected": true/false,
  "reject_reason": "if rejected: ONE German sentence saying what went wrong. if NOT rejected: empty string",
  "style_score": 1-10,
  "feedback": "ONE SHORT German sentence: either praise (if good) or what to improve (if borderline)"
}}

Story: {title} | Category: {category}"""


# ---------------------------------------------------------------------------
# Stage 1 — Prompt text review (DeepSeek, fast/cheap, catches NO-GOs early)
# ---------------------------------------------------------------------------
PROMPT_REVIEW_SYSTEM = """\
You are an art director screening image prompts BEFORE generation.
Your job: Check if the prompt violates any of 4 NO-GO rules.
Be STRICT — if it's borderline, reject it. We want only abstract, elegant prompts.

=== 4 NO-GO RULES ===
1. FRANKENSTEIN: Prompt asks to MERGE two incompatible objects into one hybrid
   (e.g. "DNA with animal inside", "stethoscope fused with clock")
2. ZOO MODE: Prompt asks for a LITERAL recognizable animal, person, car, artwork
   (e.g. "a lion", "Mona Lisa", "a turtle")
3. MEDICAL HORROR: Prompt mentions organs, meat, blood, parasites, worms
   (e.g. "internal organs", "bloody texture")
4. KITSCH: Prompt uses overused PowerPoint metaphors
   (e.g. "puzzle pieces", "calendar pages", "handshake", "heart")

Reject if the prompt explicitly asks for these things.
If it says "abstract" or "stylized" or "geometric" — that's good, approve."""

PROMPT_REVIEW_USER = """\
Check this image prompt for NO-GO violations:

PROMPT: {prompt}

STORY: {title}
CATEGORY: {category}

Respond ONLY with this JSON (no markdown):
{{
  "rejected": true/false,
  "no_go_frankenstein": true/false,
  "no_go_zoo": true/false,
  "no_go_medical": true/false,
  "no_go_kitsch": true/false,
  "reason": "if rejected: ONE German sentence"
}}"""

# System prompt for regenerating prompts after NO-GO rejection
PROMPT_REGENERATE_SYSTEM = """\
You are a creative director fixing bad image prompts.
The prompt below was REJECTED for violating style rules.
Rewrite it to be abstract, elegant, paper collage style.
Respond ONLY with the corrected prompt — no JSON, no explanation."""

PROMPT_REGENERATE_USER = """\
REJECTED prompt: {prompt}
REJECT REASON: {reason}
FIX INSTRUCTION: {fix_instruction}

Rewrite the prompt. Must be:
- A SINGLE abstract symbol (not a complex scene)
- Warm paper collage style, #f5f1ea background
- Flat 2D, NO 3D, NO photorealism
- NO text in the image
- Use only geometric/shape-based abstraction
- One accent colour

Respond ONLY with the corrected English prompt text."""


# ---------------------------------------------------------------------------
# Fix instructions per NO-GO (used in retry prompts)
# ---------------------------------------------------------------------------
FIX_INSTRUCTIONS: dict[str, str] = {
    "no_go_frankenstein": (
        "NO HYBRID OBJECTS. Use only ONE simple, clean symbol. "
        "Do NOT merge two different things into one shape. "
        "Pick the primary concept and make it a single elegant paper cutout."
    ),
    "no_go_zoo": (
        "NO LITERAL ANIMALS, PEOPLE, CARS, OR ARTWORKS. Abstract the concept. "
        "Instead of a literal animal, use geometric shapes, patterns, or "
        "stylized forms that hint at the idea without being a realistic depiction."
    ),
    "no_go_medical": (
        "NO ORGANS, NO MEAT, NO BLOOD, NO PARASITES, NOTHING GROSS. "
        "If the topic is medical, use abstract symbols like circles, waves, "
        "light rays, or geometric forms. Keep it clean and elegant."
    ),
    "no_go_kitsch": (
        "NO CLIPART METAPHORS. No puzzle pieces, no calendar pages, no generic "
        "handshakes or hearts. Use sophisticated abstract symbolism — think "
        "high-end editorial magazine, not PowerPoint."
    ),
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _resize_for_review(image_bytes: bytes, max_width: int = 512) -> bytes:
    """Resize image to max_width px wide for faster LLaVA upload/processing."""
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
        if w > max_width:
            new_h = int(h * max_width / w)
            img = img.resize((max_width, new_h), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75, optimize=True)
        return buf.getvalue()
    except Exception:
        return image_bytes


def _temp_upload(image_bytes: bytes) -> str | None:
    """Upload image bytes to Supabase temp location, return public URL.

    Resizes to max 512px wide before upload to speed up LLaVA processing.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None

    # Resize for review (LLaVA doesn't need full resolution)
    review_bytes = _resize_for_review(image_bytes)

    filename = f"{TEMP_PREFIX}/review-{uuid.uuid4().hex[:12]}.jpg"
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
    }
    try:
        resp = requests.post(url, headers=headers, data=review_bytes, timeout=30)
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
# Stage 1 — Prompt text review (DeepSeek, fast ~1-2s, cheap)
# ---------------------------------------------------------------------------
def review_image_prompt(
    image_prompt: str, title: str, category: str
) -> tuple[bool, str, dict[str, bool]]:
    """Check an image prompt TEXT for NO-GO violations using DeepSeek.

    This runs BEFORE FLUX generation — saves credits by catching bad prompts early.
    Response time: ~1-2 seconds (text-only).

    Returns:
        (passed, reject_reason, flags_dict)
        - passed: True if prompt is clean
        - reject_reason: German explanation (empty if passed)
        - flags_dict: {{"frankenstein": bool, "zoo": bool, "medical": bool, "kitsch": bool}}
    """
    if not DEEPSEEK_API_KEY:
        log.warning("DEEPSEEK_API_KEY not set — prompt review skipped")
        return True, "", {}

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    user_content = PROMPT_REVIEW_USER.format(
        prompt=image_prompt, title=title, category=category
    )
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": PROMPT_REVIEW_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.1,
        "max_tokens": 200,
    }

    try:
        resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        raw_text = data["choices"][0]["message"]["content"].strip()

        # Parse JSON
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:]) if len(lines) > 1 else raw_text
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        result = json.loads(raw_text)
        rejected = bool(result.get("rejected", False))
        reason = result.get("reason", "")

        flags = {
            "frankenstein": bool(result.get("no_go_frankenstein", False)),
            "zoo": bool(result.get("no_go_zoo", False)),
            "medical": bool(result.get("no_go_medical", False)),
            "kitsch": bool(result.get("no_go_kitsch", False)),
        }

        if rejected:
            flagged = [k for k, v in flags.items() if v]
            flag_str = ", ".join(flagged) if flagged else "unknown"
            log.warning("  Prompt-Review: REJECTED — %s (%s)", reason, flag_str)
        else:
            log.info("  Prompt-Review: BESTANDEN")

        return not rejected, reason, flags

    except (requests.RequestException, json.JSONDecodeError, KeyError, IndexError) as exc:
        log.warning("  Prompt-Review fehlgeschlagen: %s — Prompt wird durchgelassen", exc)
        return True, "", {}


def review_prompt_and_retry(
    image_prompt: str,
    title: str,
    category: str,
    max_retries: int = 2,
) -> tuple[str, bool, str]:
    """Stage 1: Review prompt + retry via DeepSeek regeneration if rejected.

    Args:
        image_prompt: The image prompt to review
        title: Story title
        category: Story category
        max_retries: Max prompt regeneration attempts

    Returns:
        (final_prompt, was_clean_initially, reject_reason_of_final_attempt)
    """
    passed, reject_reason, flags = review_image_prompt(
        image_prompt, title, category
    )

    if passed:
        return image_prompt, True, ""

    # Retry: regenerate prompt with fix instructions
    current_prompt = image_prompt
    for attempt in range(1, max_retries + 1):
        log.info("  Prompt retry %d/%d — %s", attempt, max_retries, reject_reason)

        # Build fix instruction from flags
        fix_parts: list[str] = []
        if flags.get("frankenstein"):
            fix_parts.append(FIX_INSTRUCTIONS["no_go_frankenstein"])
        if flags.get("zoo"):
            fix_parts.append(FIX_INSTRUCTIONS["no_go_zoo"])
        if flags.get("medical"):
            fix_parts.append(FIX_INSTRUCTIONS["no_go_medical"])
        if flags.get("kitsch"):
            fix_parts.append(FIX_INSTRUCTIONS["no_go_kitsch"])

        fix_instruction = " ".join(fix_parts) if fix_parts else (
            "Create an ABSTRACT, elegant paper collage symbol. "
            "No literal objects, no hybrid mashups."
        )

        new_prompt = _regenerate_prompt_via_deepseek(
            current_prompt, reject_reason, fix_instruction
        )

        if not new_prompt:
            log.warning("  Prompt regeneration failed — using original")
            return current_prompt, False, reject_reason

        log.info("  Regenerated prompt: %.120s...", new_prompt)

        # Review the new prompt
        new_passed, new_reason, new_flags = review_image_prompt(
            new_prompt, title, category
        )

        if new_passed:
            log.info("  Prompt retry %d: PASSED", attempt)
            return new_prompt, False, ""

        # Update for next retry
        reject_reason = new_reason
        flags = new_flags
        current_prompt = new_prompt

    log.warning("  Max prompt retries — using last regenerated prompt")
    return current_prompt, False, reject_reason


def _regenerate_prompt_via_deepseek(
    bad_prompt: str, reject_reason: str, fix_instruction: str
) -> str | None:
    """Ask DeepSeek to rewrite a rejected image prompt with fix instructions."""
    if not DEEPSEEK_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    user_content = PROMPT_REGENERATE_USER.format(
        prompt=bad_prompt, reason=reject_reason, fix_instruction=fix_instruction
    )
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": PROMPT_REGENERATE_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.5,
    }

    try:
        resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        # Strip quotes or markdown fences
        content = content.strip('"').strip("'")
        if content.startswith("```") and content.endswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1]).strip()
        return content
    except Exception as exc:
        log.warning("  DeepSeek prompt regeneration failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Stage 2 — Visual quality review (LLaVA-NeXT via fal.ai)
# ---------------------------------------------------------------------------
def review_image(
    image_bytes: bytes, title: str, category: str
) -> tuple[bool, str, float, str]:
    """Send image to LLaVA-NeXT for NO-GO quality review.

    Returns:
        (passed, reject_reason, style_score, feedback)
        - passed: False if ANY NO-GO triggered (must regenerate)
        - reject_reason: German explanation of which NO-GO failed (empty if passed)
        - style_score: 1-10 paper collage style score
        - feedback: German quality feedback
    """
    if not FAL_KEY:
        log.warning("FAL_KEY not set — image quality review skipped")
        return True, "", 10.0, "Kein FAL_KEY — Review uebersprungen"

    image_url = _temp_upload(image_bytes)
    if not image_url:
        log.warning("  Temp upload failed — review skipped")
        return True, "", 8.0, "Upload fehlgeschlagen — akzeptiert"

    prompt = REVIEW_PROMPT.format(title=title, category=category)

    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "prompt": prompt,
        "image_url": image_url,
        "max_tokens": 300,
        "temperature": 0.1,
    }

    try:
        resp = requests.post(LLAVA_ENDPOINT, json=payload, headers=headers, timeout=180)
        resp.raise_for_status()
        submission = resp.json()

        # Poll async if needed
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
                    log.warning("  LLaVA review failed: %s", sd)
                    _temp_delete(image_url)
                    return True, "", 7.5, "LLaVA fehlgeschlagen — akzeptiert"
            else:
                log.warning("  LLaVA review timed out")
                _temp_delete(image_url)
                return True, "", 7.5, "LLaVA timeout — akzeptiert"

        # Extract text response
        raw_text = ""
        output = submission.get("output", "")
        if isinstance(output, str):
            raw_text = output
        elif isinstance(output, dict):
            raw_text = output.get("text", output.get("response", ""))
        elif isinstance(output, list) and output:
            raw_text = str(output[0])

        if not raw_text:
            raw_text = submission.get("text", submission.get("response", ""))

        if not raw_text:
            log.warning("  LLaVA returned empty response")
            _temp_delete(image_url)
            return True, "", 7.5, "Leere Antwort — akzeptiert"

        # Parse JSON
        raw_text = raw_text.strip()
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:]) if len(lines) > 1 else raw_text
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        result = json.loads(raw_text)

        # Check NO-GOs
        frankenstein = bool(result.get("no_go_frankenstein", False))
        zoo = bool(result.get("no_go_zoo", False))
        medical = bool(result.get("no_go_medical", False))
        kitsch = bool(result.get("no_go_kitsch", False))
        rejected = bool(result.get("rejected", False))

        # Build reject reason
        reject_flags: list[str] = []
        if frankenstein:
            reject_flags.append("[Frankenstein]")
        if zoo:
            reject_flags.append("[Zoo-Modus]")
        if medical:
            reject_flags.append("[Medical-Horror]")
        if kitsch:
            reject_flags.append("[Kitsch]")

        reject_reason = result.get("reject_reason", "")
        if not reject_reason and reject_flags:
            reject_reason = f"NO-GO: {', '.join(reject_flags)}"

        style_score = float(result.get("style_score", 7.0))
        feedback = result.get("feedback", "")

        passed = not rejected

        if passed:
            log.info("  Qualitaet: BESTANDEN (Score=%.1f)", style_score)
            log.info("    Feedback: %s", feedback)
        else:
            log.warning("  Qualitaet: ABGELEHNT — %s", reject_reason)
            log.warning("    Flags: %s", ", ".join(reject_flags) if reject_flags else "none")
            log.warning("    Style=%.1f, Feedback: %s", style_score, feedback)

        _temp_delete(image_url)
        return passed, reject_reason, style_score, feedback

    except (requests.RequestException, json.JSONDecodeError, KeyError, IndexError) as exc:
        log.warning("  Review fehlgeschlagen: %s — Bild wird durchgelassen", exc)
        _temp_delete(image_url)
        return True, "", 7.5, f"Review-Fehler: {exc}"


def enhance_prompt_for_retry(
    original_prompt: str, reject_reason: str, attempt: int
) -> str:
    """Build a targeted fix prompt based on which NO-GO was triggered."""
    emphasis = [
        "",
        "CRITICAL QUALITY FIX:",
        "URGENT — SECOND ATTEMPT:",
        "FINAL ATTEMPT:",
    ]
    prefix = emphasis[min(attempt, len(emphasis) - 1)]

    # Determine which fix instruction applies
    fix_parts: list[str] = []
    lowered = reject_reason.lower()
    if "frankenstein" in lowered:
        fix_parts.append(FIX_INSTRUCTIONS["no_go_frankenstein"])
    if "zoo" in lowered or "literal" in lowered or "tier" in lowered:
        fix_parts.append(FIX_INSTRUCTIONS["no_go_zoo"])
    if "medical" in lowered or "organ" in lowered or "fleisch" in lowered:
        fix_parts.append(FIX_INSTRUCTIONS["no_go_medical"])
    if "kitsch" in lowered or "clipart" in lowered:
        fix_parts.append(FIX_INSTRUCTIONS["no_go_kitsch"])

    fix_instruction = " ".join(fix_parts) if fix_parts else (
        "Create an ABSTRACT, elegant paper collage symbol. "
        "NO literal objects. NO hybrid mashups. Think high-end editorial magazine."
    )

    return (
        f"{prefix} {reject_reason} "
        f"{fix_instruction} "
        f"Original prompt: {original_prompt} "
        "Must be flat paper collage on #f5f1ea background. Abstract, elegant, ONE symbol only."
    )


def review_and_retry(
    image_bytes: bytes,
    title: str,
    category: str,
    image_prompt: str,
    generate_fn: Callable[[str], bytes | None],
    max_retries: int = MAX_RETRIES,
) -> tuple[bytes | None, float, int, str]:
    """Review an image and retry if NO-GOs are triggered.

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
    passed, reject_reason, score, feedback = review_image(
        image_bytes, title, category
    )

    if passed or max_retries == 0:
        return image_bytes, score, 0, feedback

    # Retry loop
    best_score = score
    best_bytes = image_bytes
    best_feedback = feedback
    current_prompt = image_prompt

    for attempt in range(1, max_retries + 1):
        log.info("  Retry %d/%d — %s", attempt, max_retries, reject_reason)

        enhanced_prompt = enhance_prompt_for_retry(
            current_prompt, reject_reason, attempt
        )
        log.info("  Fix prompt: %.150s...", enhanced_prompt)

        new_bytes = generate_fn(enhanced_prompt)
        if not new_bytes:
            log.warning("  Retry generation failed — keeping previous image")
            break

        new_passed, new_reason, new_score, new_feedback = review_image(
            new_bytes, title, category
        )
        log.info("  Retry %d: passed=%s, score=%.1f", attempt, new_passed, new_score)

        # Keep the best image (highest score)
        if new_score > best_score:
            best_score = new_score
            best_bytes = new_bytes
            best_feedback = new_feedback

        if new_passed:
            return best_bytes, best_score, attempt, new_feedback

        # Update for next retry
        reject_reason = new_reason
        current_bytes = new_bytes
        current_prompt = enhanced_prompt

    log.info("  Max retries reached — best score %.1f", best_score)
    if best_score < MIN_QUALITY_SCORE:
        log.warning(
            "  HARD FAIL: best image score %.1f < %.1f — returning None to trigger fresh prompt",
            best_score, MIN_QUALITY_SCORE,
        )
        return None, best_score, max_retries, best_feedback
    log.info("  Using best image (score=%.1f)", best_score)
    return best_bytes, best_score, max_retries, best_feedback
