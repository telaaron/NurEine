#!/usr/bin/env python3
"""VISION.md <-> Datenbank abgleichen.

Warum es das gibt: /admin/vision liest seit Migration 00051 aus der Tabelle
`nureine_vision`, nicht mehr aus der Datei. Auf Vercel liegt VISION.md gar nicht
im Serverless-Bundle (nachgemessen: null .md-Dateien im Build), die Seite war
live deshalb dauerhaft kaputt.

Die Datei bleibt trotzdem bestehen — sie ist Pflichtlektuere fuer alle
Claude-Sessions (CLAUDE.md). Dieses Skript haelt beide Seiten synchron.

    python3 scripts/vision_sync.py push   # Datei  -> Datenbank (Erstimport)
    python3 scripts/vision_sync.py pull   # Datenbank -> Datei  (nach Admin-Edit)
    python3 scripts/vision_sync.py status # nur vergleichen, nichts schreiben
"""
import os
import sys
import json
import hashlib
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
VISION = REPO / "VISION.md"
TABLE = "nureine_vision"


def env():
    """SUPABASE_URL + SERVICE_KEY aus .env lesen (ohne Zusatzabhaengigkeit)."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key
    envfile = REPO / ".env"
    if envfile.exists():
        for line in envfile.read_text().splitlines():
            if "=" not in line or line.strip().startswith("#"):
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k == "SUPABASE_URL" and not url:
                url = v
            elif k == "SUPABASE_SERVICE_KEY" and not key:
                key = v
    if not url or not key:
        sys.exit("SUPABASE_URL / SUPABASE_SERVICE_KEY fehlen (.env oder Umgebung).")
    return url.rstrip("/"), key


def request(method, path, body=None):
    url_base, key = env()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{url_base}/rest/v1/{path}", data=data,
                                 headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw.strip() else []
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()[:400]
        if exc.code == 404:
            sys.exit(f"Tabelle `{TABLE}` fehlt. Migration 00051 einspielen.\n{detail}")
        sys.exit(f"HTTP {exc.code}: {detail}")


def neueste():
    rows = request("GET", f"{TABLE}?select=content,updated_at&order=updated_at.desc&limit=1")
    return rows[0] if rows else None


def kurz(text):
    return hashlib.sha256(text.encode()).hexdigest()[:12]


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"

    datei_text = VISION.read_text(encoding="utf-8") if VISION.exists() else None
    db_row = neueste()
    db_text = db_row["content"] if db_row else None

    if cmd == "status":
        print(f"Datei     : {'fehlt' if datei_text is None else f'{len(datei_text)} Zeichen, sha {kurz(datei_text)}'}")
        if db_text is None:
            print("Datenbank : leer — 'push' fuer den Erstimport")
        else:
            print(f"Datenbank : {len(db_text)} Zeichen, sha {kurz(db_text)}, Stand {db_row['updated_at']}")
        if datei_text is not None and db_text is not None:
            print("Gleich    :", "ja" if datei_text == db_text else "NEIN — auseinandergelaufen")
        return

    if cmd == "push":
        if datei_text is None:
            sys.exit("VISION.md nicht gefunden.")
        if db_text == datei_text:
            print("Unveraendert — nichts zu tun.")
            return
        request("POST", TABLE, {"content": datei_text, "updated_by": "sync"})
        print(f"In die Datenbank geschrieben: {len(datei_text)} Zeichen (sha {kurz(datei_text)}).")
        return

    if cmd == "pull":
        if db_text is None:
            sys.exit("Datenbank leer — erst 'push'.")
        if datei_text == db_text:
            print("Unveraendert — nichts zu tun.")
            return
        VISION.write_text(db_text, encoding="utf-8")
        print(f"VISION.md aktualisiert: {len(db_text)} Zeichen (sha {kurz(db_text)}). Jetzt committen.")
        return

    sys.exit(f"Unbekannter Befehl '{cmd}'. Erlaubt: push | pull | status")


if __name__ == "__main__":
    main()
