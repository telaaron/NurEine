#!/usr/bin/env python3
"""
Aussprache-Gate: hört das FERTIGE VO-Audio ab und vergleicht mit dem geplanten Text.

Warum das nötig ist (Vorfall 2026-07-26): Der Englisch-Wächter in render.mjs prüft die
SCHREIBWEISE des voText. Er kann nicht sehen, was die Stimme daraus MACHT. Zwei belegte
Fehler gingen so durch und ruinierten ein fertiges Video:
    "Trachom."                 -> gesprochen "Trakum."            (Keyword des Videos!)
    "Prüfer suchten jahrelang."-> gesprochen "Proofers sucht den Geraldine."
Beide Wörter sehen deutsch aus (ch / ü) und werden von DE_MARKERS sogar entlastet.
Nur eine Gegenprobe am Audio findet diese Klasse von Fehlern.

Aufruf:
    verify_vo.py --audio vo.mp3 --text "Der geplante Satz." [--model small] [--json]

Exit 0 = Aussprache ok. Exit 3 = Abweichung (render.mjs bricht dann ab).
Exit 2 = Gate selbst nicht lauffähig (Whisper fehlt) -> render.mjs behandelt das als WARN,
damit ein kaputtes Gate nicht die ganze Pipeline blockiert.
"""
import argparse
import json
import os
import re
import sys
import unicodedata

# Wörter, die Whisper notorisch anders schreibt als gemeint, ohne dass die Aussprache
# falsch ist. Nur hier eintragen, was per Ohr geprüft wurde.
TOLERATED = {
    "trakom": "trachom",   # korrekte deutsche Aussprache Tra-KOM, Whisper schreibt es phonetisch
    "trakoms": "trachoms",
}

FILLER = {"und", "der", "die", "das", "den", "dem", "ein", "eine", "einen", "ist", "sind"}


def norm(s: str) -> str:
    """Vergleichsform: klein, ohne Interpunktion, Umlaute aufgelöst, Zahlen als Wort-Rest."""
    s = s.lower().strip()
    # Sprech-Silben-Bindestriche aus dem Lexikon ("Tra-kom", "Gebär-mutter-hals-krebs")
    # sind eine AUSSPRACHE-Hilfe, kein Wort-Trenner — sonst zählt jede Silbe als eigenes
    # Wort und das Gate schlägt falsch Alarm. Zusammenziehen VOR dem Tokenisieren.
    s = re.sub(r"(?<=[a-zäöüß])-(?=[a-zäöüß])", "", s)
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def tokens(s: str) -> list:
    return [TOLERATED.get(w, w) for w in norm(s).split() if w]


# Deutsche Zahlwörter -> Ziffern. Der voText wird vor dem TTS ausgeschrieben
# ("43" -> "dreiundvierzig"), Whisper schreibt aber wieder "43". Ohne diese
# Rueckuebersetzung meldet das Gate jede Zahl als Fehler (belegt 2026-07-30).
_ONES = {"null": 0, "ein": 1, "eine": 1, "eins": 1, "zwei": 2, "drei": 3, "vier": 4,
         "fuenf": 5, "sechs": 6, "sieben": 7, "acht": 8, "neun": 9, "zehn": 10,
         "elf": 11, "zwoelf": 12, "dreizehn": 13, "vierzehn": 14, "fuenfzehn": 15,
         "sechzehn": 16, "siebzehn": 17, "achtzehn": 18, "neunzehn": 19}
_TENS = {"zwanzig": 20, "dreissig": 30, "vierzig": 40, "fuenfzig": 50, "sechzig": 60,
         "siebzig": 70, "achtzig": 80, "neunzig": 90}


def word_to_int(w: str):
    """'dreiundvierzig' -> 43, 'sechshundertfuenfundvierzig' -> 645. None wenn kein Zahlwort."""
    if not w or any(c.isdigit() for c in w):
        return None
    # Jahreszahlen in Sprechweise: "zwanzigzwanzig" -> 2020, "zwanzigeinundzwanzig" -> 2021,
    # "neunzehnhundertneunzig" faengt die Hundert-Regel unten ab. Ohne das meldet das Gate
    # jede gesprochene Jahreszahl als Fehler (belegt 2026-08-01).
    for tens, base in (("zwanzig", 2000), ("neunzehn", 1900)):
        if w.startswith(tens) and len(w) > len(tens):
            rest = w[len(tens):]
            if rest.startswith("hundert"):
                break  # klassische Form -> normale Regeln unten
            r = word_to_int(rest)
            if r is not None and r < 100:
                return base + r
        if w == tens and base == 2000:
            break
    total, rest = 0, w
    for unit, mult in (("million", 1000000), ("tausend", 1000)):
        if unit in rest:
            head, rest = rest.split(unit, 1)
            total += (word_to_int(head) or 1) * mult
    if "hundert" in rest:
        head, rest = rest.split("hundert", 1)
        total += (word_to_int(head) or 1) * 100
    if not rest:
        return total or None
    if rest in _ONES:
        return total + _ONES[rest]
    if rest in _TENS:
        return total + _TENS[rest]
    if "und" in rest:
        a, b = rest.split("und", 1)
        if a in _ONES and b in _TENS:
            return total + _ONES[a] + _TENS[b]
    return total or None


def numeric_key(w: str):
    """Vergleichsschluessel: Zahlwort und Ziffer werden auf denselben Wert abgebildet."""
    if w.isdigit():
        return "#" + str(int(w))
    n = word_to_int(w)
    return "#" + str(n) if n is not None else w


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--model", default="small")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    try:
        import warnings
        warnings.filterwarnings("ignore")
        import whisper
    except Exception as e:  # Gate nicht lauffähig -> WARN, nicht Abbruch
        print(f"verify_vo: Whisper nicht verfügbar ({e})", file=sys.stderr)
        return 2

    try:
        # download_root explizit setzen: whisper legt sonst ~/.cache/whisper per
        # os.makedirs OHNE exist_ok an und wirft "[Errno 17] File exists", sobald der
        # Ordner schon da ist (belegt 2026-07-30 — das Gate fiel dadurch still auf
        # "nicht lauffähig" zurück und hätte ungeprüften Ton durchgelassen).
        cache = os.path.expanduser("~/.cache/whisper")
        os.makedirs(cache, exist_ok=True)
        model = whisper.load_model(a.model, download_root=cache)
        heard_raw = model.transcribe(a.audio, language="de", fp16=False)["text"].strip()
    except Exception as e:
        print(f"verify_vo: Transkription fehlgeschlagen ({e})", file=sys.stderr)
        return 2

    want, got = tokens(a.text), tokens(heard_raw)

    # Zahlwort <-> Ziffer auf denselben Schluessel bringen ("dreiundvierzig" == "43").
    wantk = [numeric_key(w) for w in want]
    gotk = [numeric_key(w) for w in got]

    # Whisper schreibt manches phonetisch anders, ohne dass die AUSSPRACHE falsch ist
    # ("Lösbar" -> "Lössbar"). Doppelkonsonanten und ss/s vereinheitlichen, bevor
    # verglichen wird — sonst blockiert das Gate korrekt gesprochene Saetze.
    def fuzzy(w: str) -> str:
        if w.startswith("#"):
            return w
        out, prev = [], ""
        for c in w:
            if c != prev:
                out.append(c)
            prev = c
        return "".join(out)

    wf, gf = [fuzzy(w) for w in wantk], [fuzzy(w) for w in gotk]
    # Getrennt/zusammen ist kein Aussprachefehler ("dranbleibt" == "dran bleibt"):
    # zusaetzlich gegen den zusammengezogenen Gesamtstring pruefen.
    wjoin, gjoin = "".join(wf), "".join(gf)

    missing = [w for w, k in zip(want, wf) if k not in gf and k not in FILLER and k not in gjoin]
    extra = [w for w, k in zip(got, gf) if k not in wf and k not in FILLER and k not in wjoin]

    ok = not missing and not extra
    out = {
        "ok": ok,
        "heard": heard_raw,
        "planned": a.text.strip(),
        "missing": missing,
        "extra": extra,
    }
    if a.json:
        print(json.dumps(out, ensure_ascii=False))
    else:
        print(("OK  " if ok else "ABWEICHUNG  ") + f'gehört: "{heard_raw}"')
        if missing:
            print("  nicht gesprochen:", ", ".join(missing))
        if extra:
            print("  erfunden/verhört:", ", ".join(extra))
    return 0 if ok else 3


if __name__ == "__main__":
    sys.exit(main())
