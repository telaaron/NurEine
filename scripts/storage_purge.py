#!/usr/bin/env python3
"""
Storage-Aufräumer für NurEine — „nur das Beste behalten".

Der Bilderbestand darf nicht endlos wachsen. Die Website zeigt im Archiv
ohnehin nur eine Handvoll Bilder pro Monat (Puls: 1, Logbuch: 5, Spur: nur
Perlen ab impact 75) — alles andere ist eine Textzeile mit Typo-Karte.
Bilder, die niemand je sieht, kosten trotzdem Speicher und haben am
2026-07-16 die Sperre ausgelöst (Storage 1137/1024 MB).

BEHALTEN wird ein Bild, wenn mindestens eines zutrifft:
  * is_hero              — war mal Tages-Hero
  * impact_score >= 75   — Perle, erscheint in der „Spur"
  * jünger als 30 Tage   — aktueller Bestand, noch im Umlauf
  * Top 5 seines Monats  — die Bilder, die das „Logbuch" zeigt
  * hat Reel/Audio       — in einem Video verbaut, Original wird gebraucht

Alles andere fliegt. Beim Löschen wird image_url auf NULL gesetzt, damit die
Website sauber auf die redaktionelle Typo-Karte fällt (StoryCard.svelte,
{:else}-Zweig) statt auf ein totes Bild zu zeigen.

Nutzung:
    python3 scripts/storage_purge.py                # Trockenlauf (Standard)
    python3 scripts/storage_purge.py --liste        # nur Dateinamen ausgeben
    python3 scripts/storage_purge.py --apply        # wirklich löschen

Braucht SUPABASE_URL + SUPABASE_SERVICE_KEY (aus .env).
"""

import argparse
import os
import sys
from urllib.parse import quote

import requests

KEEP_IMPACT = 75  # Perlen-Schwelle, spiegelt MILESTONE in ArchiveTrace.svelte
KEEP_DAYS = 30  # frischer Bestand
KEEP_TOP_PER_MONTH = 5  # spiegelt highlights() in ArchiveLogbook.svelte
BUCKET = "story_images"

# Ein Bild ist entbehrlich, wenn KEINE der Behalte-Regeln greift.
SQL_CANDIDATES = """
WITH obj AS (
  SELECT name, (metadata->>'size')::bigint AS bytes
  FROM storage.objects WHERE bucket_id = %(bucket)s
), s AS (
  SELECT id, title, impact_score, published_at, is_hero,
         tiktok_video_url, audio_url,
         regexp_replace(image_url, '^.*/' || %(bucket)s || '/', '') AS fname
  FROM nureine_stories
  WHERE image_url LIKE '%%' || %(bucket)s || '%%'
), j AS (
  SELECT s.*, o.bytes,
         row_number() OVER (
           PARTITION BY date_trunc('month', s.published_at)
           ORDER BY s.impact_score DESC NULLS LAST, s.published_at DESC
         ) AS rang
  FROM s JOIN obj o ON o.name = s.fname
)
SELECT id, fname, bytes, impact_score, published_at::date AS tag, title
FROM j
WHERE NOT (
     is_hero
  OR impact_score >= {keep_impact}
  OR published_at >= now() - interval '{keep_days} days'
  OR tiktok_video_url IS NOT NULL
  OR audio_url IS NOT NULL
  OR rang <= {keep_top}
)
ORDER BY bytes DESC
""".format(keep_impact=KEEP_IMPACT, keep_days=KEEP_DAYS, keep_top=KEEP_TOP_PER_MONTH)


def env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"FEHLER: {name} fehlt. Erst `set -a; source .env; set +a`.")
    return val


def fetch_candidates(base: str, key: str) -> list[dict]:
    """Kandidaten über die REST-API holen (RPC auf eine SQL-Query gibt es nicht,
    darum der Umweg über PostgREST mit den gleichen Regeln clientseitig)."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    url = (
        f"{base}/rest/v1/nureine_stories"
        "?select=id,title,impact_score,published_at,is_hero,image_url,"
        "tiktok_video_url,audio_url"
        f"&image_url=like.*{BUCKET}*"
        "&order=published_at.desc"
    )
    resp = requests.get(url, headers=headers, timeout=30)
    if resp.status_code == 402:
        sys.exit(
            "Supabase ist gesperrt (402). Löschen ist so nicht möglich — "
            "erst entsperren (Pro-Upgrade oder Support), dann erneut laufen lassen."
        )
    resp.raise_for_status()
    return resp.json()


def pick_deletable(stories: list[dict]) -> list[dict]:
    """Wendet die Behalte-Regeln an. Bewusst hier statt in SQL, damit die
    Regel an EINER Stelle steht und ohne DB-Zugriff testbar bleibt."""
    from collections import defaultdict
    from datetime import datetime, timedelta, timezone

    frisch_ab = datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)

    by_month: dict[str, list[dict]] = defaultdict(list)
    for s in stories:
        by_month[(s.get("published_at") or "")[:7]].append(s)

    top_ids: set = set()
    for monat, items in by_month.items():
        items.sort(key=lambda x: (x.get("impact_score") or 0), reverse=True)
        top_ids.update(i["id"] for i in items[:KEEP_TOP_PER_MONTH])

    weg = []
    for s in stories:
        pub = s.get("published_at") or ""
        try:
            pub_dt = datetime.fromisoformat(pub.replace("Z", "+00:00"))
        except ValueError:
            continue  # ohne Datum lieber behalten
        behalten = (
            s.get("is_hero")
            or (s.get("impact_score") or 0) >= KEEP_IMPACT
            or pub_dt >= frisch_ab
            or s.get("tiktok_video_url")
            or s.get("audio_url")
            or s["id"] in top_ids
        )
        if not behalten:
            weg.append(s)
    return weg


def delete_one(base: str, key: str, image_url: str, story_id: str) -> bool:
    """Datei löschen, dann image_url auf NULL — in dieser Reihenfolge, damit
    die DB nie auf eine Datei zeigt, die es nicht mehr gibt."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    fname = image_url.split(f"/{BUCKET}/", 1)[-1]
    d = requests.delete(
        f"{base}/storage/v1/object/{BUCKET}/{quote(fname)}", headers=headers, timeout=30
    )
    if d.status_code not in (200, 204, 404):
        print(f"  ! Storage-DELETE {d.status_code} für {fname}")
        return False
    u = requests.patch(
        f"{base}/rest/v1/nureine_stories?id=eq.{story_id}",
        headers={**headers, "Content-Type": "application/json", "Prefer": "return=minimal"},
        json={"image_url": None},
        timeout=30,
    )
    if u.status_code not in (200, 204):
        print(f"  ! DB-UPDATE {u.status_code} für {story_id}")
        return False
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true", help="wirklich löschen")
    ap.add_argument("--liste", action="store_true", help="nur Dateinamen ausgeben")
    args = ap.parse_args()

    base = env("PUBLIC_SUPABASE_URL").rstrip("/")
    key = env("SUPABASE_SERVICE_KEY")

    stories = fetch_candidates(base, key)
    weg = pick_deletable(stories)

    if args.liste:
        for s in weg:
            print(s["image_url"].split(f"/{BUCKET}/", 1)[-1])
        return 0

    print(f"Bilder gesamt:     {len(stories)}")
    print(f"Behalten:          {len(stories) - len(weg)}")
    print(f"Zu löschen:        {len(weg)}")
    if weg:
        hoechster = max((s.get("impact_score") or 0) for s in weg)
        print(f"Höchster Wirkungsindex darunter: {hoechster} (Grenze: {KEEP_IMPACT})")

    if not args.apply:
        print("\nTrockenlauf. Mit --apply wird wirklich gelöscht.")
        return 0

    ok = 0
    for i, s in enumerate(weg, 1):
        if delete_one(base, key, s["image_url"], s["id"]):
            ok += 1
        if i % 25 == 0:
            print(f"  … {i}/{len(weg)}")
    print(f"\nFertig: {ok}/{len(weg)} gelöscht, image_url auf NULL gesetzt.")
    return 0 if ok == len(weg) else 1


if __name__ == "__main__":
    sys.exit(main())
