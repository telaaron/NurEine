#!/usr/bin/env python3
"""
NurEine — Storage-Purge (Verbesserer-Agent, Idee #33)

Warum: Der Storage stand am 18.07. bei ~1,20 GB und lag damit ÜBER dem
1-GB-Free-Cap. Das ist die eigentliche Ursache der projektweiten 402-Sperre
(exceed_storage_size_quota) — der Abrechnungs-Reset entsperrt NICHT dauerhaft,
ohne Purge re-lockt das Projekt sofort wieder. Dieses Skript räumt genau die
Mengen auf, die docs/EFFIZIENZ_KONZEPT.md (R4 + §4.1) und der Analyst benannt
haben, und senkt den Storage von ~1,20 GB auf ~0,72 GB.

Was gelöscht wird (in dieser Reihenfolge, jede Klasse einzeln zuschaltbar):
  1. story_reels   — fertige Reel-MP4s, liegen längst auf IG/TikTok (Kopien)
  2. story_audio   — Vorlese-Audio, Feature ungenutzt
  3. story_images  — nur Dateien > MAX_IMAGE_BYTES (unkomprimierte Seedream-PNGs,
                     die die <150-KB-Upload-Regel verletzen). Für jede gelöschte
                     Bilddatei wird die referenzierende nureine_stories.image_url
                     auf NULL gesetzt, damit die App auf die Typo-Karte
                     zurückfällt statt ein 404-<img> zu zeigen (docs: gewollt).

SICHERHEIT:
  - Trockenlauf per Default. Es wird NICHTS gelöscht, bis --apply gesetzt ist.
  - Nur der Service-Key (Server-seitig) hat die Rechte. Nie committen.
  - Idempotent: mehrfach ausführbar, löscht nur noch, was übrig ist.

Usage:
    python scripts/purge_storage.py                     # Trockenlauf, alle Klassen
    python scripts/purge_storage.py --apply             # tatsächlich löschen
    python scripts/purge_storage.py --only reels,audio  # nur Render-Zwischenprodukte
    python scripts/purge_storage.py --max-image-mb 1     # Schwelle für story_images
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("purge")

# ── Config ─────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    log.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY")
    sys.exit(1)

# story_images: alles über dieser Größe ist ein unkomprimiertes Original
# (Upload-Regel: <150 KB). Default 1 MB = die 372 Objekte / 484 MB aus der
# Analyst-Messung vom 18.07.
DEFAULT_MAX_IMAGE_BYTES = 1024 * 1024

_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
}


def _mb(num_bytes: int) -> str:
    return f"{num_bytes / 1024 / 1024:.1f} MB"


def list_bucket(bucket: str) -> list[dict[str, Any]]:
    """Alle Objekte eines Buckets über die Storage-List-API (paginiert)."""
    url = f"{SUPABASE_URL}/storage/v1/object/list/{bucket}"
    objects: list[dict[str, Any]] = []
    offset = 0
    page = 1000
    while True:
        resp = requests.post(
            url,
            headers={**_HEADERS, "Content-Type": "application/json"},
            json={"prefix": "", "limit": page, "offset": offset,
                  "sortBy": {"column": "name", "order": "asc"}},
            timeout=60,
        )
        if resp.status_code == 402:
            log.error("  402 — Storage noch gesperrt (Quota). Kein Purge möglich, "
                      "bis der Spend-Cap entfernt / das Konto entsperrt ist.")
            raise SystemExit(2)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        objects.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return objects


def object_size(obj: dict[str, Any]) -> int:
    meta = obj.get("metadata") or {}
    return int(meta.get("size") or 0)


def delete_object(bucket: str, name: str) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{name}"
    try:
        resp = requests.delete(url, headers=_HEADERS, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("  Löschen fehlgeschlagen (%s/%s): %s", bucket, name, exc)
        return False
    return True


def null_image_url(public_url_fragment: str) -> int:
    """Setzt nureine_stories.image_url = NULL für alle Zeilen, deren URL den
    Dateinamen enthält. Verhindert 404-<img> nach dem Purge (Fallback: Typo-Karte).
    Gibt die Anzahl betroffener Zeilen zurück."""
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/nureine_stories",
        headers={**_HEADERS, "Content-Type": "application/json",
                 "Prefer": "return=representation"},
        params={"image_url": f"ilike.*{public_url_fragment}*"},
        json={"image_url": None},
        timeout=30,
    )
    resp.raise_for_status()
    return len(resp.json())


def purge_all(bucket: str, apply: bool) -> tuple[int, int]:
    """Ganzen Bucket leeren (für Render-Zwischenprodukte). -> (objekte, bytes)."""
    objs = list_bucket(bucket)
    total_bytes = sum(object_size(o) for o in objs)
    log.info("%s: %d Objekte, %s", bucket, len(objs), _mb(total_bytes))
    if not apply:
        return len(objs), total_bytes
    deleted = 0
    freed = 0
    for obj in objs:
        if delete_object(bucket, obj["name"]):
            deleted += 1
            freed += object_size(obj)
    log.info("  gelöscht: %d Objekte, %s freigegeben", deleted, _mb(freed))
    return deleted, freed


def purge_large_images(bucket: str, max_bytes: int, apply: bool) -> tuple[int, int]:
    """Nur unkomprimierte Originale (> max_bytes) aus story_images entfernen und
    die referenzierende image_url auf NULL setzen. -> (objekte, bytes)."""
    objs = list_bucket(bucket)
    large = [o for o in objs if object_size(o) > max_bytes]
    total_bytes = sum(object_size(o) for o in large)
    log.info("%s: %d/%d Objekte über %s = %s (Purge-Kandidaten)",
             bucket, len(large), len(objs), _mb(max_bytes), _mb(total_bytes))
    if not apply:
        return len(large), total_bytes
    deleted = 0
    freed = 0
    unlinked = 0
    for obj in large:
        name = obj["name"]
        # ERST die DB-Referenz kappen (sonst zeigt die App kurz ein 404-Bild),
        # DANN die Datei löschen.
        try:
            unlinked += null_image_url(name)
        except requests.RequestException as exc:
            log.error("  image_url-NULL fehlgeschlagen für %s: %s — überspringe", name, exc)
            continue
        if delete_object(bucket, name):
            deleted += 1
            freed += object_size(obj)
    log.info("  gelöscht: %d Objekte, %s freigegeben, %d image_url auf NULL",
             deleted, _mb(freed), unlinked)
    return deleted, freed


def main() -> None:
    parser = argparse.ArgumentParser(description="NurEine Storage-Purge (Idee #33)")
    parser.add_argument("--apply", action="store_true",
                        help="Tatsächlich löschen (ohne: Trockenlauf).")
    parser.add_argument("--only", default="reels,audio,images",
                        help="Kommagetrennt: reels,audio,images (Default: alle).")
    parser.add_argument("--max-image-mb", type=float, default=1.0,
                        help="story_images: Dateien größer als dies löschen (Default 1 MB).")
    args = parser.parse_args()

    classes = {c.strip() for c in args.only.split(",") if c.strip()}
    max_image_bytes = int(args.max_image_mb * 1024 * 1024) if args.max_image_mb else DEFAULT_MAX_IMAGE_BYTES

    if not args.apply:
        log.info("TROCKENLAUF — es wird nichts gelöscht. Mit --apply scharf schalten.")

    freed_total = 0
    if "reels" in classes:
        _, b = purge_all("story_reels", args.apply)
        freed_total += b
    if "audio" in classes:
        _, b = purge_all("story_audio", args.apply)
        freed_total += b
    if "images" in classes:
        _, b = purge_large_images("story_images", max_image_bytes, args.apply)
        freed_total += b

    verb = "freigegeben" if args.apply else "freigebbar"
    log.info("Summe %s: %s", verb, _mb(freed_total))
    if not args.apply:
        log.info("Zum Ausführen erneut mit --apply starten.")


if __name__ == "__main__":
    main()
