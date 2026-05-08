#!/usr/bin/env python3
"""
NurEine — Seed Initial Stories

Fetches RSS feeds, analyzes articles with DeepSeek,
and inserts initial positive news stories into Supabase.

Usage:
    python3 scripts/seed_stories.py
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from typing import Any

import feedparser
import requests
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("seed_stories")

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"

MAX_ARTICLES_PER_RUN = 30
API_DELAY_SECONDS = 1.0
TARGET_STORIES = 12  # We want at least 12 good stories

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY]):
    log.error("Missing environment variables. Check .env file.")
    sys.exit(1)


def supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def supabase_get(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=supabase_headers(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_post(table: str, data: dict[str, Any]) -> dict[str, Any]:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=supabase_headers(), json=data, timeout=30)
    resp.raise_for_status()
    if not resp.text:
        return {}
    return resp.json()


def source_exists(source_url: str) -> bool:
    params = {"source_url": f"eq.{source_url}", "select": "id", "limit": "1"}
    rows = supabase_get("nureine_stories", params=params)
    return len(rows) > 0


def call_deepseek(prompt: str) -> str | None:
    lines = prompt.split("\n")
    sep_idx = next((i for i, line in enumerate(lines) if line.startswith("Artikel-Titel:")), len(lines))
    system_content = "\n".join(lines[:sep_idx]).strip()
    user_content = "\n".join(lines[sep_idx:]).strip()

    payload: dict[str, Any] = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content or prompt},
        ],
        "temperature": 0.2,
        "top_p": 0.95,
        "max_tokens": 1024,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            log.warning("DeepSeek returned no choices")
            return None
        return choices[0].get("message", {}).get("content", "")
    except requests.RequestException as exc:
        log.error("DeepSeek API request failed: %s", exc)
        return None


ANALYSIS_PROMPT_TEMPLATE = """\
Du bist Redakteur bei NurEine, einer Plattform fuer bedeutsame Good News.

Analysiere diesen Artikel und antworte NUR mit einem JSON-Objekt:

Artikel-Titel: {title}
Artikel-Text: {description}
Quelle: {source}

Aufgaben:

Ist das eine bedeutsame positive Nachricht (nicht bloss "nett", sondern mit echtem Impact)?
-> is_positive: true/false

Falls ja, extrahiere:

title: Deutscher Titel (max 80 Zeichen, praegnant)

subtitle: Eine Zeile Kontext (max 120 Zeichen)

summary: 2-3 deutsche Saetze, was passiert ist und warum es wichtig ist

body_markdown: 3-5 kurze Absaetze in Deutsch, die den Artikel erzaehlen (wie ein kleiner redaktioneller Text, kein copy-paste)

category: eine von [klima, gesundheit, wissenschaft, gemeinschaft, tiere, kultur, innovation]

region: Laendername auf Deutsch

region_code: ISO 3166-1 alpha-2

lat: Breitengrad (float, ungefaehr)

lng: Laengengrad (float, ungefaehr)

image_prompt: Ein kurzer englischer Prompt fuer eine Bild-KI (DALL-E 3). Stil: Minimalist vector art, isometric, flat colors, soft lighting, no text, clean composition. Der Prompt soll das zentrale Thema der Nachricht visuell beschreiben. Beispiel: "Minimalist vector art, isometric view of a mangrove forest with people planting saplings, flat earth tones, soft golden lighting, clean composition, no text"

impact_reach: geschaetzte Anzahl direkt positiv betroffener Menschen (integer)

impact_durability: 0-100 (Wie lange haelt der Effekt an? Strukturveraenderung=100, Einzelereignis=20)

impact_evidence: 0-100 (Peer-reviewed=100, etablierte Redaktion=75, lokal=50)

reading_time_min: geschaetzte Lesezeit in Minuten

Berechne impact_score = round(impact_reach_normalized * 0.4 + impact_durability * 0.35 + impact_evidence * 0.25)
wobei impact_reach_normalized = min(100, log10(impact_reach + 1) * 20)

Antworte ausschliesslich mit validem JSON. Kein Text davor oder danach."""


def build_prompt(entry: Any, source_name: str) -> str:
    title = entry.get("title", "(kein Titel)")
    description = entry.get("description", entry.get("summary", "(keine Beschreibung)"))
    description = (
        description.replace("<p>", "\n")
        .replace("</p>", "\n")
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )
    description = re.sub(r"<[^>]+>", "", description)
    if len(description) > 5000:
        description = description[:5000] + "..."
    return ANALYSIS_PROMPT_TEMPLATE.format(
        title=title,
        description=description,
        source=source_name,
    )


def parse_ai_response(text: str | None) -> dict[str, Any] | None:
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            cleaned = cleaned[first_newline + 1:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
        elif "```" in cleaned:
            cleaned = cleaned[: cleaned.rindex("```")].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        log.warning("Failed to parse AI JSON response: %s", exc)
        log.debug("Raw response: %s", text)
        return None


def load_active_sources() -> list[dict[str, Any]]:
    params = {"active": "eq.true", "select": "*"}
    try:
        sources = supabase_get("nureine_rss_sources", params=params)
        log.info("Loaded %d active RSS source(s)", len(sources))
        return sources
    except requests.RequestException as exc:
        log.error("Failed to load RSS sources: %s", exc)
        return []


def run() -> None:
    start_time = time.time()
    articles_processed = 0
    stories_added = 0
    errors = 0

    sources = load_active_sources()
    if not sources:
        log.warning("No active RSS sources found.")
        return

    for source in sources:
        if stories_added >= TARGET_STORIES:
            break
        if articles_processed >= MAX_ARTICLES_PER_RUN:
            break

        source_name = source.get("name", "Unbekannte Quelle")
        feed_url = source.get("url")
        if not feed_url:
            continue

        log.info("Fetching: %s", source_name)
        try:
            feed = feedparser.parse(feed_url)
        except Exception as exc:
            log.error("Failed to parse feed '%s': %s", feed_url, exc)
            errors += 1
            continue

        entries = feed.get("entries", [])
        log.info("  %d entries found", len(entries))

        for entry in entries:
            if stories_added >= TARGET_STORIES:
                break
            if articles_processed >= MAX_ARTICLES_PER_RUN:
                break

            source_url = entry.get("link", "")
            if not source_url:
                continue

            try:
                if source_exists(source_url):
                    log.info("  Skip (exists): %s", source_url[:80])
                    continue
            except requests.RequestException:
                pass

            prompt = build_prompt(entry, source_name)
            log.info("  Analyzing: %s", entry.get("title", "(kein Titel)")[:80])
            raw = call_deepseek(prompt)
            articles_processed += 1

            result = parse_ai_response(raw)
            if result is None:
                log.warning("  No valid result")
                time.sleep(API_DELAY_SECONDS)
                continue

            is_positive = result.get("is_positive", False)
            if not is_positive:
                log.info("  Not positive - skip")
                time.sleep(API_DELAY_SECONDS)
                continue

            published_at = entry.get("published", entry.get("updated", datetime.now(timezone.utc).isoformat()))
            if isinstance(published_at, str) and not published_at.endswith("Z"):
                try:
                    from email.utils import parsedate_to_datetime
                    parsed = parsedate_to_datetime(published_at)
                    published_at = parsed.isoformat()
                except (ValueError, TypeError):
                    pass

            story_record: dict[str, Any] = {
                "title": result.get("title", ""),
                "subtitle": result.get("subtitle", ""),
                "summary": result.get("summary", ""),
                "body_markdown": result.get("body_markdown", result.get("summary", "")),
                "category": result.get("category", "gemeinschaft"),
                "region": result.get("region", ""),
                "region_code": result.get("region_code", ""),
                "lat": result.get("lat"),
                "lng": result.get("lng"),
                "image_url": result.get("image_url", ""),
                "source_url": source_url,
                "source_name": source_name,
                "impact_reach": result.get("impact_reach"),
                "impact_durability": result.get("impact_durability"),
                "impact_evidence": result.get("impact_evidence"),
                "impact_score": result.get("impact_score"),
                "reading_time_min": result.get("reading_time_min"),
                "published_at": published_at,
            }

            try:
                supabase_post("nureine_stories", story_record)
                stories_added += 1
                log.info("  INSERTED: %s [%s - %s] (score: %s)",
                    story_record.get("title", "")[:50],
                    story_record.get("category", ""),
                    story_record.get("region", ""),
                    story_record.get("impact_score", "-"),
                )
            except requests.RequestException as exc:
                log.error("  Failed to insert: %s", exc)
                errors += 1

            time.sleep(API_DELAY_SECONDS)

    elapsed = time.time() - start_time
    log.info("DONE. processed=%d added=%d errors=%d (%.1fs)", articles_processed, stories_added, errors, elapsed)

    # Log cron run
    cron_record: dict[str, Any] = {
        "status": "completed" if errors == 0 else "completed_with_errors",
        "stories_added": stories_added,
        "articles_processed": articles_processed,
        "errors": errors,
        "finished_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase_post("nureine_cron_runs", cron_record)
        log.info("Cron run logged.")
    except requests.RequestException as exc:
        log.warning("Failed to log cron run: %s", exc)


if __name__ == "__main__":
    log.info("=" * 60)
    log.info("NurEine - Seed Initial Stories")
    log.info("=" * 60)
    run()
