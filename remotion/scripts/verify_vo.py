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
    # Whisper KUERZT beim Schreiben ab, obwohl das Wort voll gesprochen wird.
    # Ohne diese Zuordnung meldet das Gate jedes "Prozent"/"Millionen" als Fehler
    # (belegt 2026-08-03).
    "%": "prozent",
    "mio": "millionen",
    "mrd": "milliarden",
    "tsd": "tausend",
    # Whisper schreibt gesprochenes "Quadratkilometer" nach einer Zahl als Einheiten-
    # Abkuerzung statt es auszuschreiben, obwohl die Stimme das Wort voll spricht
    # (belegt 2026-08-18, "700.000 Quadratkilometer" -> je nach Versuch Whisper "700.000
    # km²" ODER "700.000 qkm", nicht deterministisch). Nach norm()/NFKD wird "km²" zu "km2"
    # (Zifferndekomposition des Hochzeichens).
    "km2": "quadratkilometer",
    "qkm": "quadratkilometer",
    # Das kleine Whisper-Modell verschluckt bei medizinischen Fremdwoertern gern ein "r"
    # und variiert die Endung — NICHT deterministisch: derselbe Ton wurde einmal als
    # "Nakolepsie", einmal als "NACOLEPSI" transkribiert. Mit dem medium-Modell
    # gegengeprueft (2026-08-26): die Stimme spricht "Narkolepsie" KORREKT.
    # Kein Aussprachefehler, nur eine Schwaeche der Transkription.
    "nakolepsie": "narkolepsie",
    "nacolepsi": "narkolepsie",
    "nacolepsie": "narkolepsie",
    "nakolepsi": "narkolepsie",
}

FILLER = {"und", "der", "die", "das", "den", "dem", "ein", "eine", "einen", "ist", "sind"}


def norm(s: str) -> str:
    """Vergleichsform: klein, ohne Interpunktion, Umlaute aufgelöst, Zahlen als Wort-Rest."""
    s = s.lower().strip()
    # Whisper schreibt "47%" als ein Token direkt an die Ziffer angehängt — die generische
    # Interpunktions-Bereinigung unten würde das "%" ersatzlos löschen (nicht durch ein
    # Leerzeichen ersetzen), bevor TOLERATED es zu "prozent" auflösen kann. Deshalb hier
    # VOR dem Strip in Textform bringen (belegt 2026-08-15: "47%" != "Siebenundvierzig Prozent").
    s = s.replace("%", " prozent ")
    # Deutsche Tausendertrennpunkte ("500.000") sind nie Dezimalpunkte (die nutzen im
    # Deutschen ein Komma) — als Zifferngruppe zusammenziehen, sonst zerfällt die Zahl in
    # "500"+"000" und matcht nicht mehr gegen das gesprochene Zahlwort "fünfhunderttausend"
    # (belegt 2026-08-15).
    s = re.sub(r"(?<=\d)\.(?=\d{3}(\D|$))", "", s)
    # Sprech-Silben-Bindestriche aus dem Lexikon ("Tra-kom", "Gebär-mutter-hals-krebs")
    # sind eine AUSSPRACHE-Hilfe, kein Wort-Trenner — sonst zählt jede Silbe als eigenes
    # Wort und das Gate schlägt falsch Alarm. Zusammenziehen VOR dem Tokenisieren.
    s = re.sub(r"(?<=[a-zäöüß])-(?=[a-zäöüß])", "", s)
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    # "%" MUSS vor der Interpunktions-Regex zu "prozent" werden, sonst streicht die
    # Regex das Zeichen ersatzlos und die TOLERATED-Zuordnung unten laeuft nie (belegt
    # 2026-08-06: "80%" wurde zu "80", das Gate meldete "prozent" faelschlich als fehlend).
    s = s.replace("%", " prozent ")
    # Tausender-Punkt MUSS vor der Interpunktions-Regex verschwinden, sonst wird er zu
    # einem Leerzeichen und "8.000" zerfaellt in die zwei Tokens "8"/"000" statt EINER
    # Zahl "8000" -- numeric_key() kann das gesprochene "achttausend" dann nie matchen
    # (belegt 2026-08-07: "achttausend Arbeitsplaetze" wurde als "achttausend"/"000"
    # fehlend/erfunden gemeldet, obwohl die Aussprache korrekt war).
    s = re.sub(r"(?<=\d)\.(?=\d{3}(?:\D|$))", "", s)
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


def transkribiere(audio: str, modell: str) -> str:
    """Ton -> Text. Wirft bei Fehlern, der Aufrufer entscheidet ueber WARN/Abbruch."""
    # download_root explizit setzen: whisper legt sonst ~/.cache/whisper per
    # os.makedirs OHNE exist_ok an und wirft "[Errno 17] File exists", sobald der
    # Ordner schon da ist (belegt 2026-07-30 — das Gate fiel dadurch still auf
    # "nicht lauffähig" zurück und hätte ungeprüften Ton durchgelassen).
    import whisper
    cache = os.path.expanduser("~/.cache/whisper")
    os.makedirs(cache, exist_ok=True)
    model = whisper.load_model(modell, download_root=cache)
    return model.transcribe(audio, language="de", fp16=False)["text"].strip()


def vergleiche(geplant: str, heard_raw: str) -> tuple:
    """Vergleicht Plan und Gehoertes. Gibt (missing, extra) zurueck."""
    want, got = tokens(geplant), tokens(heard_raw)

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

    # Getrennt/zusammen ist kein Aussprachefehler ("dranbleibt" == "dran bleibt").
    # Dafuer pruefen wir, ob ein nicht gefundenes Wort mit seinem NACHBARN verschmolzen
    # bzw. aufgeteilt wurde — statt es blind im gesamten zusammengezogenen Text zu suchen.
    #
    # Der frueher genutzte Gesamtstring-Vergleich liess kurze Woerter durchrutschen:
    # ElevenLabs fuegte "um" hinzu ("nur, um Symptome zu lindern" statt "nur, Symptome
    # zu lindern"), und das Gate meldete OK, weil "um" zufaellig in "zum" und "Nummer"
    # steckte (belegt 2026-08-26).
    def nachbar_paar(i: int, liste: list) -> set:
        """Das Wort mit seinem linken bzw. rechten Nachbarn verschmolzen."""
        paare = set()
        if i > 0:
            paare.add(liste[i - 1] + liste[i])
        if i + 1 < len(liste):
            paare.add(liste[i] + liste[i + 1])
        return paare

    def erklaerbar(i: int, k: str, eigene: list, andere: list) -> bool:
        """Wort fehlt nur scheinbar: es wurde drueben zusammengezogen oder aufgeteilt."""
        # a) DRUEBEN verschmolzen: "dran"+"bleibt" -> hier steht "dranbleibt"
        if nachbar_paar(i, eigene) & set(andere):
            return True
        # b) HIER verschmolzen: "dranbleibt" -> drueben "dran"+"bleibt"
        for j in range(len(andere) - 1):
            if andere[j] + andere[j + 1] == k:
                return True
        # c) Teil eines laengeren Wortes (nur ab 4 Zeichen, sonst rutschen kurze durch)
        return any(k in a and len(k) >= 4 for a in andere)

    missing = [
        w for i, (w, k) in enumerate(zip(want, wf))
        if k not in gf and k not in FILLER and not erklaerbar(i, k, wf, gf)
    ]
    extra = [
        w for i, (w, k) in enumerate(zip(got, gf))
        if k not in wf and k not in FILLER and not erklaerbar(i, k, gf, wf)
    ]

    return missing, extra


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--model", default="small")
    ap.add_argument("--gegenprobe", default="medium",
                    help='Modell fuer die zweite Meinung ("" schaltet sie ab)')
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    try:
        import warnings
        warnings.filterwarnings("ignore")
        import whisper  # noqa: F401  (nur Verfuegbarkeitspruefung)
    except Exception as e:  # Gate nicht lauffähig -> WARN, nicht Abbruch
        print(f"verify_vo: Whisper nicht verfügbar ({e})", file=sys.stderr)
        return 2

    try:
        heard_raw = transkribiere(a.audio, a.model)
    except Exception as e:
        print(f"verify_vo: Transkription fehlgeschlagen ({e})", file=sys.stderr)
        return 2

    missing, extra = vergleiche(a.text, heard_raw)

    # GEGENPROBE: Das kleine Modell verhoert sich bei Fachwoertern — und zwar NICHT
    # reproduzierbar: derselbe Ton wurde einmal "Nakolepsie", einmal "NACOLEPSI"
    # transkribiert (belegt 2026-08-26). Eine gepflegte Toleranzliste kommt dagegen
    # nie hinterher, sie waere Symptombekaempfung. Darum wird JEDER Befund vom
    # groesseren Modell gegengeprueft; nur was BEIDE bemaengeln, stoppt den Render.
    # Kosten entstehen nur im Fehlerfall, der Normalfall bleibt schnell.
    gegen = ""
    if (missing or extra) and a.gegenprobe:
        try:
            gegen = transkribiere(a.audio, a.gegenprobe)
            m2, e2 = vergleiche(a.text, gegen)
            missing = [w for w in missing if w in m2]
            extra = [w for w in extra if w in e2]
        except Exception as e:
            # Zweitmodell nicht ladbar -> beim strengeren Erstbefund bleiben.
            print(f"verify_vo: Gegenprobe nicht möglich ({e})", file=sys.stderr)

    ok = not missing and not extra
    out = {
        "ok": ok,
        "heard": heard_raw,
        "planned": a.text.strip(),
        "missing": missing,
        "extra": extra,
    }
    if gegen:
        out["gegenprobe"] = gegen
    if a.json:
        print(json.dumps(out, ensure_ascii=False))
    else:
        print(("OK  " if ok else "ABWEICHUNG  ") + f'gehört: "{heard_raw}"')
        if gegen:
            print(f'  gegengeprüft ({a.gegenprobe}): "{gegen}"')
        if missing:
            print("  nicht gesprochen:", ", ".join(missing))
        if extra:
            print("  erfunden/verhört:", ", ".join(extra))
    return 0 if ok else 3


if __name__ == "__main__":
    sys.exit(main())
