#!/usr/bin/env python3
"""
NurEine — "Stand der Welt" Metrik-Fetcher.

Holt kuratierte globale Langzeit-Indikatoren von der World Bank API (kostenlos,
kein Key) und schreibt sie nach nureine_world_metrics (upsert). Monatlicher Cron
reicht — die Daten ändern sich jährlich.

Trendlinie schlägt Momentaufnahme: wir speichern die ganze Serie + Baseline (~1990),
damit das Frontend "X% in Y Jahren verbessert" zeigen kann.

Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python scripts/fetch_world_metrics.py
"""
from __future__ import annotations

import logging
import os
import sys

import requests
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-7s  %(message)s")
log = logging.getLogger("world_metrics")
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    log.error("SUPABASE_URL / SUPABASE_SERVICE_KEY not set")
    sys.exit(1)

WB = "https://api.worldbank.org/v2/country/WLD/indicator/{ind}?format=json&per_page=200"

# metric_key, World-Bank-Indicator, label, category, unit, direction, blurb, source_url, sort
METRICS = [
    ("extreme_poverty", "SI.POV.DDAY", "Extreme Armut", "ueberleben", "%", "down",
     "Anteil der Weltbevölkerung, der von weniger als 2,15 $/Tag lebt.",
     "https://data.worldbank.org/indicator/SI.POV.DDAY", 10),
    ("child_mortality", "SH.DYN.MORT", "Kindersterblichkeit", "ueberleben", "/1000", "down",
     "Sterbefälle vor dem 5. Geburtstag, je 1.000 Lebendgeburten.",
     "https://data.worldbank.org/indicator/SH.DYN.MORT", 20),
    ("life_expectancy", "SP.DYN.LE00.IN", "Lebenserwartung", "ueberleben", "Jahre", "up",
     "Durchschnittliche Lebenserwartung bei Geburt, weltweit.",
     "https://data.worldbank.org/indicator/SP.DYN.LE00.IN", 30),
    ("literacy", "SE.ADT.LITR.ZS", "Alphabetisierung", "wissen", "%", "up",
     "Anteil der Erwachsenen (15+), die lesen und schreiben können.",
     "https://data.worldbank.org/indicator/SE.ADT.LITR.ZS", 40),
    ("renewable_energy", "EG.FEC.RNEW.ZS", "Erneuerbare Energie", "planet", "%", "up",
     "Anteil erneuerbarer Energie am gesamten Endenergieverbrauch.",
     "https://data.worldbank.org/indicator/EG.FEC.RNEW.ZS", 50),
    ("electricity_access", "EG.ELC.ACCS.ZS", "Zugang zu Strom", "ueberleben", "%", "up",
     "Anteil der Weltbevölkerung mit Zugang zu Elektrizität.",
     "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS", 60),
]


def fetch_series(indicator: str) -> list[dict]:
    """Return [{year:int, value:float}] ascending, only non-null points."""
    try:
        r = requests.get(WB.format(ind=indicator), timeout=30)
        r.raise_for_status()
        data = r.json()
    except Exception as exc:
        log.warning("  fetch %s failed: %s", indicator, exc)
        return []
    if not isinstance(data, list) or len(data) < 2 or not data[1]:
        return []
    points = []
    for row in data[1]:
        v = row.get("value")
        y = row.get("date")
        if v is not None and y is not None:
            points.append({"year": int(y), "value": round(float(v), 2)})
    points.sort(key=lambda p: p["year"])
    return points


def upsert(rows: list[dict]) -> None:
    url = f"{SUPABASE_URL}/rest/v1/nureine_world_metrics?on_conflict=metric_key"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    resp = requests.post(url, headers=headers, json=rows, timeout=60)
    resp.raise_for_status()


def run() -> None:
    out = []
    for key, ind, label, cat, unit, direction, blurb, src_url, order in METRICS:
        series = fetch_series(ind)
        if not series:
            log.warning("  %s: no data, skipping", key)
            continue
        latest = series[-1]
        # baseline: first point at/after 1990, else earliest available
        baseline = next((p for p in series if p["year"] >= 1990), series[0])
        out.append({
            "metric_key": key,
            "label": label,
            "category": cat,
            "unit": unit,
            "latest_value": latest["value"],
            "latest_year": latest["year"],
            "baseline_value": baseline["value"],
            "baseline_year": baseline["year"],
            "direction": direction,
            "blurb": blurb,
            "series": series,
            "source": "World Bank",
            "source_url": src_url,
            "sort_order": order,
        })
        log.info("  %s: %s (%s) → %s (%s)", key, baseline["value"], baseline["year"],
                 latest["value"], latest["year"])

    if not out:
        log.error("No metrics fetched — aborting (keeping existing data)")
        sys.exit(1)

    upsert(out)
    log.info("Upserted %d metrics.", len(out))


if __name__ == "__main__":
    run()
