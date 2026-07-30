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
        model = whisper.load_model(a.model)
        heard_raw = model.transcribe(a.audio, language="de", fp16=False)["text"].strip()
    except Exception as e:
        print(f"verify_vo: Transkription fehlgeschlagen ({e})", file=sys.stderr)
        return 2

    want, got = tokens(a.text), tokens(heard_raw)

    # Fehlende Wörter = geplant, aber nicht gehört. Füllwörter ignorieren (die Stimme
    # verschleift "und"/"der" gern, das ist kein Aussprachefehler).
    missing = [w for w in want if w not in got and w not in FILLER]
    # Erfundene Wörter = gehört, aber nie geplant -> genau der "Geraldine"-Fall.
    extra = [w for w in got if w not in want and w not in FILLER]

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
