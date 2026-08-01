#!/usr/bin/env python3
"""
tts.py — Voiceover für NurEine-Reels via edge-tts (kostenlos, de-DE Neural).

Erzeugt MP3 + Wort-Timestamps (JSON), damit Remotion die Captions wortgenau
synchronisieren kann. Die Stimme ist bewusst KI (Kennzeichnung "Stimme: KI"
liegt im Reel-Endcard — EU-KI-VO + IG-Policy: nie täuschend-ungelabelt).

  python3 tts.py --text "…" --out vo.mp3 --words words.json [--voice de-DE-SeraphinaMultilingualNeural]

words.json: [{"t": "Wort", "start": 0.12, "end": 0.38}, …]  (Sekunden)
"""
import argparse
import asyncio
import json
import os
import sys

import edge_tts

DEFAULT_VOICE = "de-DE-SeraphinaMultilingualNeural"  # warm, klar; Fallback: de-DE-KatjaNeural

CLAUSE_END = ".,;:!?–—"
SENTENCE_END = ".!?"


def _mark_clause_breaks(words, text):
    """Markiert je Wort, welches Satzzeichen im Original-`text` direkt darauf folgt:
      brk  = irgendein Satzteil-Ende (. , ; : ! ? – —)
      sbrk = echtes SATZ-Ende (. ! ?) — Grenze für „ganze Sätze"-Captions (Aaron 2026-07-19)
    edge-tts liefert WordBoundaries ohne Interpunktion; so bekommt die Segmentierung
    die Satzgrenzen zurück. Robust: findet jedes Wort ab dem letzten Cursor."""
    cursor = 0
    low = text
    for w in words:
        tok = w.get("t", "")
        idx = low.find(tok, cursor)
        if idx < 0:
            w["brk"] = False
            w["sbrk"] = False
            continue
        after = idx + len(tok)
        cursor = after
        # Direkt folgende Satzzeichen einsammeln (auch „…", „?!"), Leerzeichen davor
        # zulassen ( „Wort ," kommt in handgeschriebenen voTexts vor).
        j = after
        while j < len(low) and low[j] == " ":
            j += 1
        punct = ""
        while j < len(low) and low[j] in CLAUSE_END:
            punct += low[j]
            j += 1
        w["brk"] = bool(punct)
        w["sbrk"] = any(c in SENTENCE_END for c in punct)
        # Das Satzzeichen AN DAS WORT hängen — sonst zeigen die Captions „Trachom Eine
        # Krankheit die blind macht" ohne Punkt/Komma und lesen sich wie Stichpunkte,
        # obwohl die Stimme deutlich pausiert (Aaron 2026-07-26: „regt nicht zum
        # Mitlesen an"). Gedankenstriche sind reine Sprech-Pausen → nicht anzeigen.
        visible = "".join(c for c in punct if c not in "–—")
        if visible:
            w["t"] = tok + visible


async def synth(text: str, voice: str, rate: str, out_mp3: str, out_words: str) -> None:
    # boundary explizit auf WordBoundary (edge-tts >= 7 default: SentenceBoundary)
    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(out_mp3, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset/duration kommen in 100-ns-Ticks
                start = chunk["offset"] / 10_000_000
                end = start + chunk["duration"] / 10_000_000
                words.append({"t": chunk["text"], "start": round(start, 3), "end": round(end, 3)})
    # WordBoundary liefert die Wörter OHNE Interpunktion. Für die satzzeichen-bewusste
    # Caption-Segmentierung (ReelTikTok) das im Original-text folgende Satzzeichen
    # zurückmappen: sequenziell durch den text laufen, je Wort das direkt danach
    # stehende [.,;:!?–—] als brk markieren (Panel-Fix 2026-07-17).
    _mark_clause_breaks(words, text)
    with open(out_words, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)
    if not words:
        print("WARNUNG: keine WordBoundaries erhalten", file=sys.stderr)


def speed_up(out_mp3: str, out_words: str, factor: float) -> None:
    """Tempo NACHTRÄGLICH per ffmpeg atempo — inkl. Wort-Timings.

    Warum nicht über voice_settings.speed: bei eleven_v3 ist der Parameter praktisch
    wirkungslos (gemessen 2026-08-01: speed 1.15 -> 11.84s, speed 1.20 -> 11.92s,
    also KEIN Unterschied). atempo wirkt zuverlässig (1.22 -> 9.72s) und lässt die
    Tonhöhe unangetastet. Die Timings werden mitskaliert, sonst laufen die
    Karaoke-Captions aus dem Takt.
    REEL_TEMPO übersteuert; 1.0 schaltet den Schritt ab.
    """
    import shutil
    import subprocess
    import tempfile

    if factor <= 1.001:
        return
    tmp = tempfile.mktemp(suffix=".mp3")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", out_mp3,
             "-filter:a", f"atempo={factor:.3f}", "-c:a", "libmp3lame", "-q:a", "2", tmp],
            check=True, timeout=120,
        )
        shutil.move(tmp, out_mp3)
    except Exception as e:  # Tempo ist Kür — lieber Originaltempo als kein Audio
        print(f"WARNUNG: atempo fehlgeschlagen ({e}) — Originaltempo", file=sys.stderr)
        return
    try:
        words = json.load(open(out_words, encoding="utf-8"))
        for w in words:
            w["start"] = round(w["start"] / factor, 3)
            w["end"] = round(w["end"] / factor, 3)
        json.dump(words, open(out_words, "w", encoding="utf-8"), ensure_ascii=False)
    except Exception as e:
        print(f"WARNUNG: Timings nicht skaliert ({e})", file=sys.stderr)


def synth_eleven(text: str, rate: str, out_mp3: str, out_words: str) -> None:
    """ElevenLabs-Backend (Premium-Stimme): with-timestamps liefert Char-Alignment,
    daraus bauen wir dieselben Wort-Timings wie bei edge-tts. Braucht
    ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (bzw. REEL_ELEVEN_VOICE) in der Env.
    rate "+16%" wird auf voice_settings.speed (0.7-1.2) gemappt."""
    import base64
    import os
    import urllib.error
    import urllib.request

    key = os.environ["ELEVENLABS_API_KEY"]
    # Marken-Stimme seit 2026-07-30: "Luca - Dynamic & Engaging" (deutsch, jung,
    # social_media). Ausgewählt im A/B am echten Reel-Text: sprach als einziger
    # Kandidat sowohl das Fachwort als auch "fühlt sich an" fehlerfrei (Laura sagte
    # reproduzierbar "führt sich an"). Env übersteuert für Tests.
    voice = (
        os.environ.get("REEL_ELEVEN_VOICE")
        or os.environ.get("ELEVENLABS_VOICE_ID")
        or "mmAbrxFQ9xjByXyBpqrK"
    )
    # UNTERTREIBUNG statt Euphorie (docs/REEL_TEXT_REGELN.md §2): Der Zuschauer soll
    # selbst "krass" denken. Sagt die Stimme es ihm, nimmt sie ihm die Schlussfolgerung
    # ab. Energie kommt aus dem TEMPO, nicht aus Begeisterung — deshalb [matter-of-fact]
    # und ausdrücklich NICHT [excited]. Nur wenn der Text nicht schon selbst taggt.
    if not text.lstrip().startswith("["):
        text = "[matter-of-fact] " + text
    try:
        speed = max(0.7, min(1.2, 1.0 + float(rate.replace("%", "").replace("+", "")) / 100.0))
    except ValueError:
        speed = 1.0
    body = {
        "text": text,
        "model_id": os.environ.get("ELEVEN_MODEL", "eleven_v3"),  # Aaron 2026-07-17: v3 = bestes Deutsch/Betonung (Panel-Fix); via ELEVEN_MODEL übersteuerbar
        # GEMESSEN 2026-07-30 (A/B am echten Reel-Text, Whisper-Gegenprobe):
        #   stability 0.30 -> halluziniert (Stimme wiederholte einen ganzen Satz)
        #   stability 0.45 -> verliert Wörter ('Trachom' -> 'Trahum')
        #   stability 0.65 -> sauber, immer noch ~2,4 Wörter/s
        # speed wird zusätzlich auf 1.15 gedeckelt: bei 1.2 verschluckt die Stimme
        # Silben ('Trachom' -> 'Tachom').
        "voice_settings": {
            "stability": float(os.environ.get("ELEVEN_STABILITY", "0.65")),
            "similarity_boost": 0.75,
            "speed": min(speed, 1.15),
        },
    }
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128"

    def call(payload: dict) -> dict:
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode(), headers={"xi-api-key": key, "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)

    try:
        resp = call(body)
    except urllib.error.HTTPError as e:
        # Kontingent/Key-Probleme NICHT verschlucken (Vorfall 2026-07-30: Free-Tier war
        # aufgebraucht — 4 von 10.000 Credits — die Pipeline fiel still auf edge-tts
        # zurück und die Aussprache-Fehler wurden der Stimme statt dem Kontingent
        # zugeschrieben). Klartext-Fehler mit dem Grund aus der API.
        detail = ""
        try:
            detail = json.load(e).get("detail", {})
            detail = detail.get("message") or detail.get("code") or str(detail)
        except Exception:
            pass
        if e.code in (401, 402, 403, 429):
            raise SystemExit(
                f"ElevenLabs nicht verfügbar (HTTP {e.code}): {detail}\n"
                f"  → Kontingent/Key prüfen. Bewusst auf die kostenlose Stimme wechseln: REEL_TTS=edge"
            )
        # Ältere Modelle/Stimmen kennen "speed" nicht → einmal ohne erneut versuchen.
        body["voice_settings"].pop("speed", None)
        resp = call(body)

    with open(out_mp3, "wb") as f:
        f.write(base64.b64decode(resp["audio_base64"]))
    al = resp["alignment"]
    words = []
    cur, start, end = "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append({"t": cur, "start": round(start, 3), "end": round(end, 3)})
            cur, start = "", None
        else:
            if start is None:
                start = s
            cur += ch
            end = e
    if cur:
        words.append({"t": cur, "start": round(start, 3), "end": round(end, 3)})
    # v3-Audio-Tags ([matter-of-fact], [pause] …) steuern nur die STIMME. Sie stehen
    # aber im Char-Alignment und würden sonst als Wort in den Untertiteln landen.
    # Raus damit — die Captions zeigen nur, was wirklich gesprochen wird.
    words = [w for w in words if not (w["t"].startswith("[") or w["t"].endswith("]"))]
    with open(out_words, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)
    if not words:
        print("WARNUNG: keine Timestamps von ElevenLabs", file=sys.stderr)


def synth_local(text: str, rate: str, out_mp3: str, out_words: str, voice: str) -> None:
    """Lokaler TTS-Service auf dem Mac Mini (Piper/Chatterbox) — kostenlos, offline,
    kein Cloud-Abhängigkeit. Adresse via TTS_LOCAL_URL (Default: Mini im Heimnetz).

    Engine wählbar über TTS_LOCAL_ENGINE (piper|chatterbox). Piper ist schnell
    (RTF ~0.3 auf dem Mini), Chatterbox besser in der Prosodie, aber viel langsamer.
    Liefert dieselbe words.json-Struktur wie edge/eleven, damit Remotion die
    Captions unverändert synchronisieren kann."""
    import base64 as _b64
    import urllib.request

    url = os.environ.get("TTS_LOCAL_URL", "http://192.168.178.3:8123").rstrip("/")
    engine = os.environ.get("TTS_LOCAL_ENGINE", "piper")
    # "+16%" → 1.16 (der Service erwartet einen Faktor, kein Prozent-String)
    try:
        speed = 1.0 + int(str(rate).replace("%", "").replace("+", "")) / 100.0
    except ValueError:
        speed = 1.0

    payload = json.dumps({
        "text": text, "engine": engine, "voice": voice or None,
        # thorsten_emotional: "amused" klingt warm/zugewandt, "neutral" unbeteiligt
        "emotion": os.environ.get("TTS_LOCAL_EMOTION") or None,
        "format": "mp3", "speed": round(speed, 2), "words": True,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{url}/tts", data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except Exception as exc:
        raise SystemExit(f"Lokaler TTS-Service ({url}) nicht erreichbar: {exc}")

    with open(out_mp3, "wb") as f:
        f.write(_b64.b64decode(resp["audio_base64"]))

    words = [{"t": w["t"], "start": w["s"], "end": w["e"]} for w in resp.get("words", [])]
    _mark_clause_breaks(words, text)
    with open(out_words, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)
    if not words:
        print("WARNUNG: keine Timestamps vom lokalen TTS-Service", file=sys.stderr)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--words", required=True)
    p.add_argument("--voice", default=DEFAULT_VOICE)
    p.add_argument("--rate", default="+4%")  # minimal flotter = weniger Hänger
    p.add_argument("--engine", default="edge", choices=["edge", "eleven", "local"])
    args = p.parse_args()
    if args.engine == "eleven":
        synth_eleven(args.text, args.rate, args.out, args.words)
    elif args.engine == "local":
        # Piper hat eigene Stimmnamen — der edge-Default passt hier nicht.
        voice = None if args.voice == DEFAULT_VOICE else args.voice
        synth_local(args.text, args.rate, args.out, args.words, voice)
    else:
        asyncio.run(synth(args.text, args.voice, args.rate, args.out, args.words))
    # Tempo-Nachschärfung (Aaron 2026-08-01: "noch schneller"). Gilt für JEDE Engine,
    # weil sie am fertigen Audio ansetzt — anders als voice_settings.speed, das bei
    # eleven_v3 wirkungslos ist. Default 1.12; REEL_TEMPO=1.0 schaltet ab.
    try:
        tempo = float(os.environ.get("REEL_TEMPO", "1.12"))
    except ValueError:
        tempo = 1.12
    speed_up(args.out, args.words, tempo)
    print(f"OK vo -> {args.out}")


if __name__ == "__main__":
    main()
