#!/usr/bin/env python3
"""
World-Bank-Daten-Reporter — der Anti-Lärm-Moat (siehe REPORTER_BOTS.md).

Beobachtet kuratierte Entwicklungsindikatoren der Weltbank (offene API, kein Key)
und erkennt MESSBARE Verbesserungen, die nie als Schlagzeile erscheinen — z. B.
"Kindersterblichkeit weltweit auf historischem Tief". Aus jedem solchen Datenpunkt
baut DeepSeek eine NurEine-Story (Beat gesellschaft-bildung / gesundheit-forschung,
source_type=official_stats) und schiebt sie in dieselbe Pipeline.

Idempotent: ein Indikator wird pro Jahr nur einmal zur Story (Dedup über source_url).
Aufruf: python3 scripts/fetch_worldbank.py [--dry]
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("worldbank")

# Bild-Pipeline aus fetch_stories wiederverwenden (FLUX + Supabase-Upload + Quali-Check).
# Optional: ohne FAL_KEY / bei Import-Fehler laufen Stories mit Gradient-Fallback.
try:
    from fetch_stories import generate_and_upload_image, IMAGE_GENERATION_ENABLED
except Exception:  # noqa: BLE001
    generate_and_upload_image = None  # type: ignore[assignment]
    IMAGE_GENERATION_ENABLED = False

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DRY = "--dry" in sys.argv[1:]

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY]):
    log.error("Missing env (SUPABASE_URL / SUPABASE_SERVICE_KEY / DEEPSEEK_API_KEY)")
    sys.exit(1)

WB_BASE = "https://api.worldbank.org/v2"

# Kuratierte Indikatoren, bei denen FORTSCHRITT eine gute Nachricht ist.
# direction: 'down' = niedriger ist besser (Sterblichkeit), 'up' = höher ist besser (Stromzugang).
INDICATORS = [
    {"code": "SH.DYN.MORT", "name": "Kindersterblichkeit (unter 5 J., pro 1.000 Geburten)", "direction": "down", "beat": "gesundheit-forschung", "category": "gesundheit", "unit": "pro 1.000"},
    {"code": "SP.DYN.IMRT.IN", "name": "Säuglingssterblichkeit (pro 1.000 Geburten)", "direction": "down", "beat": "gesundheit-forschung", "category": "gesundheit", "unit": "pro 1.000"},
    {"code": "SH.STA.MMRT", "name": "Müttersterblichkeit (pro 100.000 Geburten)", "direction": "down", "beat": "gesundheit-forschung", "category": "gesundheit", "unit": "pro 100.000"},
    {"code": "EG.ELC.ACCS.ZS", "name": "Zugang zu Elektrizität (% der Bevölkerung)", "direction": "up", "beat": "gesellschaft-bildung", "category": "gemeinschaft", "unit": "%"},
    {"code": "SH.H2O.SMDW.ZS", "name": "Zugang zu sauberem Trinkwasser (% der Bevölkerung)", "direction": "up", "beat": "gesellschaft-bildung", "category": "gesundheit", "unit": "%"},
    {"code": "SE.PRM.CMPT.ZS", "name": "Abschlussrate der Grundschule (% der Altersgruppe)", "direction": "up", "beat": "gesellschaft-bildung", "category": "gemeinschaft", "unit": "%"},
    {"code": "SI.POV.DDAY", "name": "Extreme Armut (% unter 2,15 $/Tag)", "direction": "down", "beat": "gesellschaft-bildung", "category": "gemeinschaft", "unit": "%"},
    {"code": "SH.DYN.AIDS.ZS", "name": "HIV-Prävalenz (% der Erwachsenen 15-49)", "direction": "down", "beat": "gesundheit-forschung", "category": "gesundheit", "unit": "%"},
]

REGION = "WLD"  # Welt (kann später um Länder/Regionen erweitert werden)
# Mindest-relative-Verbesserung gegenüber Vorjahr, damit es eine Story wert ist (Rauschen filtern).
MIN_REL_CHANGE = 0.005  # 0,5 %


def supabase_get(table: str, params: dict[str, str]) -> list[dict[str, Any]]:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", params=params,
                     headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}, timeout=30)
    r.raise_for_status()
    return r.json()


def supabase_post(table: str, data: dict[str, Any]) -> None:
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", json=data,
                      headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                               "Content-Type": "application/json", "Prefer": "return=minimal"}, timeout=30)
    r.raise_for_status()


def source_exists(source_url: str) -> bool:
    rows = supabase_get("nureine_stories", {"source_url": f"eq.{source_url}", "select": "id", "limit": "1"})
    return len(rows) > 0


def fetch_indicator(code: str) -> list[tuple[int, float]]:
    """Letzte Jahreswerte (Jahr, Wert), neueste zuerst, None herausgefiltert."""
    try:
        r = requests.get(f"{WB_BASE}/country/{REGION}/indicator/{code}",
                         params={"format": "json", "per_page": "8", "date": "2015:2025"}, timeout=20)
        r.raise_for_status()
        data = r.json()
        if not isinstance(data, list) or len(data) < 2 or not data[1]:
            return []
        out = [(int(x["date"]), float(x["value"])) for x in data[1] if x.get("value") is not None]
        return sorted(out, key=lambda t: t[0], reverse=True)
    except (requests.RequestException, ValueError, KeyError) as exc:
        log.warning("  Indicator %s fetch failed: %s", code, exc)
        return []


def is_improvement(direction: str, latest: float, prev: float) -> bool:
    if prev == 0:
        return False
    rel = abs(latest - prev) / abs(prev)
    if rel < MIN_REL_CHANGE:
        return False
    return latest < prev if direction == "down" else latest > prev


def build_story_via_deepseek(ind: dict[str, Any], year: int, latest: float, prev: float, prev_year: int) -> dict[str, Any] | None:
    direction_word = "gesunken" if ind["direction"] == "down" else "gestiegen"
    prompt = f"""Du bist Chef vom Dienst bei NurEine (Good-News-Plattform). Aus einem offiziellen Weltbank-Datenpunkt
sollst du eine echte, sachliche gute Nachricht machen — eine Entwicklung, die in den Medien fast nie auftaucht.

Indikator: {ind['name']}
Region: Welt
Neuester Wert ({year}): {latest} {ind['unit']}
Vorwert ({prev_year}): {prev} {ind['unit']}
Die Zahl ist {direction_word} — das ist ein Fortschritt für menschliches Aufblühen.

Schreibe NUR ein JSON-Objekt:
{{
  "title": "max 65 Zeichen, klar, kein Fachjargon, sagt was besser wurde",
  "subtitle": "max 130 Zeichen, nennt die konkrete Zahl + Zeitraum",
  "summary": "EXAKT 4 deutsche Sätze: (1) Kontext warum der Indikator zählt, (2) die konkreten Zahlen, (3) strukturelle Bedeutung, (4) Ausblick. Sachlich, nicht reißerisch, kein Aktivismus.",
  "body": "8-12 Sätze fließender redaktioneller Text, ZEIT-ONLINE-Stil, erklärt jeden Begriff, nennt die Weltbank als Quelle, ordnet ein OHNE zu beschönigen (Grenzen erwähnen).",
  "impact_score": "Integer 1-100 nach NurEine-Wirkungsindex (verbessert es konkret Leben? globale Gesundheits-/Armutsindikatoren betreffen Millionen → meist 70-90, aber sei ehrlich)",
  "impact_reach_score": "0-100 Reichweite-Balken",
  "impact_durability": "0-100",
  "impact_evidence": "0-100 (offizielle Weltbank-Statistik = hoch)",
  "impact_explainer": "1 Satz, warum es die Leserin angeht, max 140 Zeichen",
  "share_hook": "1 Chat-Satz zum Weitergeben, neugierig, max 160 Zeichen",
  "image_prompt": "englischer FLUX-Prompt im Stil 'Warm paper collage editorial illustration of [KERN-SYMBOL der guten Entwicklung], made of layered matte paper cutouts on warm off-white #f5f1ea canvas. Accented in [warm color]. Visible paper grain texture, soft cast shadows. Flat semi-abstract premium magazine style. No text. No 3D, no photorealism.'"
}}"""
    try:
        r = requests.post("https://api.deepseek.com/chat/completions",
                          headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
                          json={"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}],
                                "temperature": 0.3, "response_format": {"type": "json_object"}}, timeout=60)
        r.raise_for_status()
        return json.loads(r.json()["choices"][0]["message"]["content"])
    except (requests.RequestException, ValueError, KeyError) as exc:
        log.warning("  DeepSeek story build failed: %s", exc)
        return None


def clamp(v: Any, lo: int, hi: int) -> int | None:
    try:
        return max(lo, min(hi, int(v)))
    except (ValueError, TypeError):
        return None


def main() -> None:
    log.info("World-Bank-Daten-Reporter gestartet%s", " [DRY]" if DRY else "")
    added = 0
    for ind in INDICATORS:
        values = fetch_indicator(ind["code"])
        if len(values) < 2:
            continue
        (year, latest), (prev_year, prev) = values[0], values[1]
        if not is_improvement(ind["direction"], latest, prev):
            log.info("  %s: keine relevante Verbesserung (%s→%s)", ind["code"], prev, latest)
            continue

        # Dedup: ein Indikator+Jahr nur einmal.
        source_url = f"https://data.worldbank.org/indicator/{ind['code']}?year={year}"
        if not DRY and source_exists(source_url):
            log.info("  %s %s: schon als Story vorhanden", ind["code"], year)
            continue

        log.info("  ✓ Verbesserung: %s %s→%s (%s)", ind["name"], prev, latest, year)
        s = build_story_via_deepseek(ind, year, latest, prev, prev_year)
        if not s or not s.get("title"):
            continue

        # Hero-Bild generieren (FLUX), wenn Pipeline + Prompt vorhanden.
        image_url = None
        img_prompt = s.get("image_prompt", "")
        if not DRY and IMAGE_GENERATION_ENABLED and generate_and_upload_image and img_prompt:
            try:
                image_url = generate_and_upload_image(img_prompt, s["title"], ind["category"])
            except Exception as exc:  # noqa: BLE001
                log.warning("    image gen failed: %s", exc)

        body = s.get("body") or s.get("summary", "")
        record = {
            "title": s["title"][:80],
            "subtitle": s.get("subtitle", "")[:200],
            "summary": (s.get("summary") or s["title"])[:1000],
            "body_markdown": body,
            "category": ind["category"],
            "region": "Welt",
            "region_code": "INT",
            "image_url": image_url,
            "source_url": source_url,
            "source_name": "Weltbank (data.worldbank.org)",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "reading_time_min": max(1, round(len(body.split()) / 200)),
            "impact_score": clamp(s.get("impact_score"), 1, 100) or 70,
            "impact_reach_score": clamp(s.get("impact_reach_score"), 0, 100),
            "impact_durability": clamp(s.get("impact_durability"), 0, 100),
            "impact_evidence": clamp(s.get("impact_evidence"), 0, 100) or 95,
            "impact_explainer": (s.get("impact_explainer") or "")[:200] or None,
            "share_hook": (s.get("share_hook") or "")[:220] or None,
            "beat": ind["beat"],
            "source_type": "official_stats",
            "sensitive": False,
        }
        if DRY:
            log.info("    [DRY] würde anlegen: %s (impact=%s)", record["title"], record["impact_score"])
            log.info("    share: %s", record["share_hook"])
            added += 1
            continue
        try:
            supabase_post("nureine_stories", record)
            log.info("    INSERTED: %s (impact=%s)", record["title"], record["impact_score"])
            added += 1
        except requests.RequestException as exc:
            log.error("    insert failed: %s", exc)

    log.info("Fertig. %d Daten-Stories %s.", added, "simuliert" if DRY else "angelegt")


if __name__ == "__main__":
    main()
