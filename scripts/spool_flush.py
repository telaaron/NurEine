#!/usr/bin/env python3
"""Trägt geparkte Agenten-Arbeit nach, sobald Supabase wieder erreichbar ist.

Hintergrund: Wenn Supabase hakt (Quota-Sperre 2026-07-16, Netzausfall), arbeiten
die Agenten weiter und legen ihr fertiges Ergebnis in `.agent-spool/` ab statt
abzubrechen. Dieses Skript ist der Gegenpart: es lädt hoch, setzt die DB-Felder
und räumt auf.

    python3 scripts/spool_flush.py            # Trockenlauf — zeigt nur, was anliegt
    python3 scripts/spool_flush.py --apply    # führt aus

Ablauf pro Eintrag: <datei> + <datei>.json (das Ziel). Details: .agent-spool/README.md
Idempotent: was erledigt ist, wandert nach `_erledigt/` und wird nie doppelt geladen.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SPOOL = ROOT / ".agent-spool"
DONE = SPOOL / "_erledigt"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
APPLY = "--apply" in sys.argv


def _headers(content_type: str | None = None) -> dict[str, str]:
    h = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    if content_type:
        h["Content-Type"] = content_type
    return h


def supabase_reachable() -> tuple[bool, str]:
    """Prüft, ob Storage UND DB antworten — sonst hat Nachtragen keinen Sinn."""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/nureine_stories?select=id&limit=1",
            headers=_headers(), timeout=15,
        )
        if r.status_code == 402 or "restricted" in r.text.lower():
            return False, "Projekt weiterhin gesperrt (Quota)"
        if not r.ok:
            return False, f"DB antwortet {r.status_code}"
        return True, "ok"
    except requests.RequestException as exc:
        return False, f"nicht erreichbar: {exc}"


def public_url(bucket: str, path: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


def flush_binary(meta_path: Path, meta: dict) -> bool:
    """Lädt eine geparkte Datei hoch und setzt das DB-Feld. True = erledigt."""
    data_file = meta_path.parent / meta["datei"]
    if not data_file.exists():
        print(f"  ! Datei fehlt: {data_file.name} — übersprungen")
        return False

    size_kb = data_file.stat().st_size / 1024
    dest = f"{meta['bucket']}/{meta['pfad']}"
    print(f"  → {data_file.name} ({size_kb:.0f} KB) → {dest}")
    if not APPLY:
        return False

    with data_file.open("rb") as fh:
        r = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{dest}",
            headers={**_headers(meta.get("content_type", "application/octet-stream")),
                     "x-upsert": "true"},
            data=fh, timeout=120,
        )
    if not r.ok:
        print(f"  ! Upload fehlgeschlagen ({r.status_code}): {r.text[:160]}")
        return False

    db = meta.get("db")
    if db:
        url = public_url(meta["bucket"], meta["pfad"])
        r2 = requests.patch(
            f"{SUPABASE_URL}/rest/v1/{db['tabelle']}?id=eq.{db['id']}",
            headers={**_headers("application/json"), "Prefer": "return=minimal"},
            json={db["spalte"]: url}, timeout=30,
        )
        if not r2.ok:
            print(f"  ! DB-Update fehlgeschlagen ({r2.status_code}): {r2.text[:160]}")
            return False
        print(f"  ✓ hochgeladen + {db['tabelle']}.{db['spalte']} gesetzt")
    else:
        print("  ✓ hochgeladen (kein DB-Feld zu setzen)")
    return True


def flush_sql(sql_file: Path) -> bool:
    """SQL-Dateien kann dieses Skript nicht selbst ausführen (kein PG-Zugang) —
    es zeigt sie an, damit ein Mensch/Agent sie per MCP einspielt."""
    print(f"  → {sql_file.name}: bitte per Supabase-MCP (execute_sql) einspielen")
    print(f"    {sql_file}")
    return False


def main() -> None:
    if not SPOOL.exists():
        print("Kein .agent-spool/ — nichts zu tun.")
        return
    if not SUPABASE_URL or not SERVICE_KEY:
        sys.exit("SUPABASE_URL / SUPABASE_SERVICE_KEY fehlen (set -a; source .env; set +a)")

    ok, why = supabase_reachable()
    print(f"Supabase: {why}")
    if not ok:
        print("→ Nachtragen macht jetzt keinen Sinn. Spool bleibt unangetastet.")
        sys.exit(1)

    DONE.mkdir(exist_ok=True)
    metas = sorted(p for d in ("bilder", "videos", "texte") for p in (SPOOL / d).glob("*.json"))
    sqls = sorted((SPOOL / "sql").glob("*.sql"))

    if not metas and not sqls:
        print("Spool ist leer — alles nachgetragen.")
        return

    print(f"\n{len(metas)} Datei(en) + {len(sqls)} SQL im Spool"
          f"{'' if APPLY else '  [TROCKENLAUF — nichts wird geändert]'}\n")

    done = 0
    for meta_path in metas:
        meta = json.loads(meta_path.read_text())
        print(f"{meta_path.parent.name}/{meta_path.stem}  (von {meta.get('agent','?')},"
              f" Grund: {meta.get('grund','?')})")
        if flush_binary(meta_path, meta):
            for f in (meta_path, meta_path.parent / meta["datei"]):
                shutil.move(str(f), str(DONE / f.name))
            done += 1

    for sql_file in sqls:
        print(f"sql/{sql_file.name}")
        flush_sql(sql_file)

    if APPLY:
        print(f"\nFertig: {done}/{len(metas)} nachgetragen → .agent-spool/_erledigt/")
        if done:
            print("Denk ans Team-Board: offene 'uebergabe'-Einträge auf resolved=true setzen.")
    else:
        print("\nTrockenlauf. Mit --apply wirklich nachtragen.")


if __name__ == "__main__":
    main()
