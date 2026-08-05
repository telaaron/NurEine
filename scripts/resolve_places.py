#!/usr/bin/env python3
"""Löst für Stories den ECHTEN Ort auf — passend zur Reichweite der Story.

    DEEPSEEK_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
        python scripts/resolve_places.py [--limit 200] [--dry-run]

Warum es das gibt
-----------------
In `region` stand bisher nur der Ländername ("Deutschland"), weil der
Analyse-Prompt genau danach fragt. Auf /bei-dir ("Vor deiner Haustür") stand
darum auf jeder Karte "Deutschland" — obwohl die Koordinaten spezifisch sind.

Warum nicht einfach Reverse-Geocoding
-------------------------------------
Weil die Genauigkeit der Koordinate NICHTS über die Reichweite der Story sagt.
Eine Meldung über ganz Berlin trägt oft die Koordinate von Berlin-Mitte.
Schriebe man "Mitte", wäre das schlicht falsch. Umgekehrt ist bei einem neu
gebauten Supermarkt in Lankwitz "Berlin" zu grob — "Lankwitz" ist die Aussage,
mit der jemand etwas anfangen kann.

Darum zwei Stufen:
  1. Nominatim liefert die KANDIDATEN (Stadtteil, Stadt, Kreis, Bundesland) —
     also was an dieser Koordinate überhaupt existiert.
  2. Das LLM liest Titel + Text und entscheidet, welche Ebene die Reichweite
     der Story trifft — oder dass es gar keinen lokalen Ort gibt.

Lieber gröber als falsch. Im Zweifel 'none'.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

NOMINATIM = "https://nominatim.openstreetmap.org/reverse"
# Nominatim erlaubt ~1 Anfrage/Sekunde. Wer schneller fragt, wird gesperrt.
NOMINATIM_DELAY = 1.1
USER_AGENT = "NurEine/1.0 (https://nureine.de; kontakt@nureine.de)"

# Koordinaten, die keine Aussage sind, sondern ein Platzhalter für "irgendwo im
# Land" — Länder-Zentroide. Stories darauf bekommen bewusst KEINEN Ort.
# Toleranz in Grad; großzügig, weil Modelle gern leicht gerundete Zentroide
# liefern (51.1657/10.4515 ist der Klassiker für Deutschland: 44 Stories).
CENTROID_TOLERANCE = 0.06
KNOWN_CENTROIDS = [
    (51.1657, 10.4515),  # Deutschland
    (47.5162, 14.5501),  # Österreich
    (46.8182, 8.2275),   # Schweiz
    (46.2276, 2.2137),   # Frankreich
    (40.4637, -3.7492),  # Spanien
    (41.8719, 12.5674),  # Italien
    (52.1326, 5.2913),   # Niederlande
    (55.3781, -3.4360),  # Vereinigtes Königreich
    (37.0902, -95.7129),  # USA
    (56.1304, -106.3468),  # Kanada
    (-25.2744, 133.7751),  # Australien
    (35.8617, 104.1954),  # China
    (20.5937, 78.9629),  # Indien
    (-14.2350, -51.9253),  # Brasilien
    (36.2048, 138.2529),  # Japan
    (61.5240, 105.3188),  # Russland
]


def is_centroid(lat: float, lng: float) -> bool:
    """True, wenn die Koordinate ein Länder-Mittelpunkt ist (= kein echter Ort)."""
    for clat, clng in KNOWN_CENTROIDS:
        if abs(lat - clat) < CENTROID_TOLERANCE and abs(lng - clng) < CENTROID_TOLERANCE:
            return True
    return False


def supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def fetch_pending(limit: int) -> list[dict[str, Any]]:
    """Stories, die noch nie aufgelöst wurden (place_resolved_at IS NULL)."""
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/nureine_stories",
        headers=supabase_headers(),
        params={
            "select": "id,title,summary,subtitle,region,region_code,lat,lng",
            "place_resolved_at": "is.null",
            "lat": "not.is.null",
            "order": "published_at.desc",
            "limit": str(limit),
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def reverse_geocode(lat: float, lng: float) -> dict[str, str]:
    """Die Ortsebenen, die an dieser Koordinate existieren — als Kandidaten."""
    try:
        resp = requests.get(
            NOMINATIM,
            headers={"User-Agent": USER_AGENT},
            params={
                "format": "json",
                "lat": lat,
                "lon": lng,
                "zoom": 14,  # Stadtteil-Ebene: feiner als Stadt, gröber als Straße
                "addressdetails": 1,
                "accept-language": "de",
            },
            timeout=20,
        )
        if resp.status_code != 200:
            return {}
        addr = resp.json().get("address", {})
    except Exception as exc:  # Netzfehler dürfen den Lauf nicht abbrechen
        print(f"    ! Nominatim: {exc}", file=sys.stderr)
        return {}

    return {
        "neighbourhood": addr.get("suburb")
        or addr.get("borough")
        or addr.get("city_district")
        or addr.get("neighbourhood")
        or "",
        "city": addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("municipality")
        or "",
        "county": addr.get("county") or "",
        "state": addr.get("state") or "",
        "country": addr.get("country") or "",
    }


PROMPT = """\
Du ordnest einer Nachricht den Ort zu, den ein Mensch nennen würde.

NACHRICHT
Titel: {title}
Text: {summary}

ORTE AN DIESER KOORDINATE (nur diese sind erlaubt)
Stadtteil: {neighbourhood}
Stadt: {city}
Kreis: {county}
Bundesland/Region: {state}
Land: {country}

AUFGABE
Wähle die Ebene, die zur REICHWEITE der Nachricht passt — nicht die genaueste.

  - Betrifft die Nachricht eine konkrete Einrichtung, Straße oder ein Viertel
    (ein neuer Supermarkt, eine sanierte Schule, ein Projekt im Kiez)
    -> scope "neighbourhood", place_name = der Stadtteil.
  - Betrifft sie eine ganze Stadt (Verkehrsnetz, Stadtrat, stadtweites Programm)
    -> scope "city", place_name = die Stadt. NIEMALS der Stadtteil, auch wenn
       die Koordinate zufällig in einem bestimmten Viertel liegt.
  - Betrifft sie ein Bundesland oder eine Region
    -> scope "region", place_name = Bundesland/Region.
  - Gilt sie bundesweit, international, oder ist sie reine Forschung ohne
    lokalen Bezug (Studie, Laborergebnis, allgemeine Erkenntnis)
    -> scope "none", place_name = null.

HARTE REGELN
1. Erfinde NICHTS. Nur Namen aus der Liste oben.
2. Zu genau ist FALSCH. Eine Meldung über ganz Berlin ist "Berlin", niemals
   "Mitte" — auch wenn die Koordinate in Mitte liegt.
3. Den Stadtteil NUR dann, wenn der Text ihn selbst nennt ODER es klar um
   eine einzelne Einrichtung/Straße dort geht. Steht im Text nur die Stadt
   ("in London", "in Berlin"), ist die Antwort die STADT — auch wenn oben ein
   Stadtteil angeboten wird. Die Koordinate ist kein Beleg für den Stadtteil.
4. Im Zweifel die gröbere Ebene. Im starken Zweifel "none".
5. Eine Universitätsstudie ist KEINE Lokalnachricht, nur weil die Uni
   irgendwo steht -> "none".

Antworte NUR mit JSON:
{{"scope":"neighbourhood|city|region|none","place_name":"…oder null","place_context":"…oder null"}}

place_context ordnet Ortsfremden den Ort ein ("Berlin-Steglitz", "Sachsen").
Bei scope "none" sind place_name und place_context null."""


def ask_llm(story: dict[str, Any], cand: dict[str, str]) -> dict[str, Any] | None:
    text = (story.get("summary") or story.get("subtitle") or "")[:700]
    prompt = PROMPT.format(
        title=story.get("title", ""),
        summary=text,
        neighbourhood=cand.get("neighbourhood") or "—",
        city=cand.get("city") or "—",
        county=cand.get("county") or "—",
        state=cand.get("state") or "—",
        country=cand.get("country") or "—",
    )
    try:
        resp = requests.post(
            DEEPSEEK_ENDPOINT,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
                "response_format": {"type": "json_object"},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return json.loads(resp.json()["choices"][0]["message"]["content"])
    except Exception as exc:
        print(f"    ! LLM: {exc}", file=sys.stderr)
        return None


def validate(
    result: dict[str, Any], cand: dict[str, str], story_text: str = ""
) -> dict[str, Any]:
    """Modellantwort gegen die Kandidaten prüfen — kein erfundener Ort kommt durch."""
    scope = (result.get("scope") or "none").strip()
    if scope not in {"neighbourhood", "city", "region", "none"}:
        scope = "none"

    name = (result.get("place_name") or "").strip()
    if scope == "none" or not name:
        return {"place_scope": "none", "place_name": None, "place_context": None}

    # Der Name MUSS aus den Nominatim-Kandidaten stammen. Sonst hat das Modell
    # ihn erfunden — dann lieber gar kein Ort als ein falscher.
    allowed = {v.strip() for v in cand.values() if v and v.strip()}
    if name not in allowed:
        print(f"    ! '{name}' nicht in Kandidaten {sorted(allowed)} — verworfen")
        return {"place_scope": "none", "place_name": None, "place_context": None}

    # Stadtteil nur mit Beleg im Text. Sonst entsteht der Fehler, den die
    # Koordinate nahelegt: "Biber lösen Überschwemmungsproblem in London" lag
    # zufällig in Millbank und wurde zu "Millbank". Nennt der Text den
    # Stadtteil nicht, ist die Stadt die richtige Antwort.
    if scope == "neighbourhood" and name.casefold() not in story_text.casefold():
        city = (cand.get("city") or "").strip()
        if city:
            print(f"    ! Stadtteil '{name}' steht nicht im Text — nutze '{city}'")
            return {
                "place_scope": "city",
                "place_name": city,
                "place_context": clean_context(cand.get("state"), city),
            }
        return {"place_scope": "none", "place_name": None, "place_context": None}

    context = clean_context(result.get("place_context"), name)
    return {"place_scope": scope, "place_name": name, "place_context": context}


def clean_context(raw: Any, name: str) -> str | None:
    """Kontext auf das reduzieren, was in einer Ortszeile stehen darf.

    Das Modell reicht gern die volle Nominatim-Adresskette durch
    ("Overstrand Ward 10, Overstrand Local Municipality, Overberg District
    Municipality, Westkap, Südafrika"). Als Einordnung taugt aber nur ein
    kurzer Zusatz — und einer, der nicht bloß den Ortsnamen wiederholt.
    """
    context = (raw or "").strip().strip(",")
    if not context:
        return None

    # Adresskette -> nur die gröbste sinnvolle Ebene behalten. Die vorderen
    # Glieder wiederholen meist den Ort selbst.
    if context.count(",") >= 1:
        parts = [p.strip() for p in context.split(",") if p.strip()]
        parts = [p for p in parts if p.casefold() != name.casefold()]
        if not parts:
            return None
        # Bei langen Ketten das vorletzte Glied (Bundesland/Region) statt des
        # Landes — "Westkap" sagt mehr als "Südafrika".
        context = parts[-2] if len(parts) >= 3 else parts[0]

    if context.casefold() == name.casefold():
        return None
    # Ein Kontext, der den Namen bloß umschließt ("Camberwell, Groß-London"
    # -> "Groß-London" ist ok; "Berlin" bei place_name "Berlin" nicht).
    if name.casefold() in context.casefold() and len(context) <= len(name) + 3:
        return None
    if len(context) > 40:
        return None
    return context


def save(story_id: str, fields: dict[str, Any]) -> bool:
    payload = dict(fields)
    payload["place_resolved_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/nureine_stories",
        headers={**supabase_headers(), "Prefer": "return=minimal"},
        params={"id": f"eq.{story_id}"},
        json=payload,
        timeout=30,
    )
    if resp.status_code >= 300:
        print(f"    ! Speichern fehlgeschlagen: {resp.status_code} {resp.text[:200]}",
              file=sys.stderr)
        return False
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=200)
    ap.add_argument("--dry-run", action="store_true", help="nichts schreiben")
    args = ap.parse_args()

    missing = [n for n, v in [
        ("SUPABASE_URL", SUPABASE_URL),
        ("SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY),
        ("DEEPSEEK_API_KEY", DEEPSEEK_API_KEY),
    ] if not v]
    if missing:
        print(f"Fehlende Umgebungsvariablen: {', '.join(missing)}", file=sys.stderr)
        return 1

    stories = fetch_pending(args.limit)
    print(f"{len(stories)} Stories zu prüfen\n")

    stats = {"neighbourhood": 0, "city": 0, "region": 0, "none": 0, "fehler": 0}

    for i, story in enumerate(stories, 1):
        title = (story.get("title") or "")[:58]
        lat, lng = story.get("lat"), story.get("lng")

        # Länder-Zentroid: kein echter Ort. Ohne Netzanfrage abhaken.
        if lat is None or lng is None or is_centroid(float(lat), float(lng)):
            fields = {"place_scope": "none", "place_name": None, "place_context": None}
            if not args.dry_run:
                save(story["id"], fields)
            stats["none"] += 1
            print(f"[{i}/{len(stories)}] {title}\n    → kein Ort (Länder-Mittelpunkt)")
            continue

        cand = reverse_geocode(float(lat), float(lng))
        time.sleep(NOMINATIM_DELAY)

        if not any(cand.values()):
            fields = {"place_scope": "none", "place_name": None, "place_context": None}
            if not args.dry_run:
                save(story["id"], fields)
            stats["none"] += 1
            print(f"[{i}/{len(stories)}] {title}\n    → kein Ort (Geocoding leer)")
            continue

        raw = ask_llm(story, cand)
        if raw is None:
            stats["fehler"] += 1
            print(f"[{i}/{len(stories)}] {title}\n    → übersprungen (LLM-Fehler)")
            continue

        # Titel + Text als Beleg für die Stadtteil-Prüfung.
        evidence = " ".join(
            str(story.get(k) or "") for k in ("title", "summary", "subtitle")
        )
        fields = validate(raw, cand, evidence)
        if not args.dry_run and not save(story["id"], fields):
            stats["fehler"] += 1
            continue

        stats[fields["place_scope"]] += 1
        shown = fields["place_name"] or "kein Ort"
        ctx = f" ({fields['place_context']})" if fields["place_context"] else ""
        print(f"[{i}/{len(stories)}] {title}\n    → {shown}{ctx} [{fields['place_scope']}]")

    print(
        "\nFertig — "
        f"Stadtteil: {stats['neighbourhood']}, Stadt: {stats['city']}, "
        f"Region: {stats['region']}, ohne Ort: {stats['none']}, Fehler: {stats['fehler']}"
    )
    if args.dry_run:
        print("(--dry-run: nichts geschrieben)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
