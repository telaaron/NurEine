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
import sys

import edge_tts

DEFAULT_VOICE = "de-DE-SeraphinaMultilingualNeural"  # warm, klar; Fallback: de-DE-KatjaNeural

CLAUSE_END = ".,;:!?–—"


def _mark_clause_breaks(words, text):
    """Setzt words[i]['brk']=True, wenn im Original-`text` direkt nach diesem Wort
    ein Satzzeichen (. , ; : ! ? – —) steht. edge-tts liefert die WordBoundaries
    ohne Interpunktion; so bekommt die Caption-Segmentierung die Satzgrenzen zurück.
    Robust gegen Nicht-Übereinstimmungen: findet jedes Wort ab dem letzten Cursor."""
    cursor = 0
    low = text
    for w in words:
        tok = w.get("t", "")
        idx = low.find(tok, cursor)
        if idx < 0:
            w["brk"] = False
            continue
        after = idx + len(tok)
        cursor = after
        # Whitespace überspringen ist NICHT gewollt — ein Satzzeichen klebt direkt am Wort.
        nxt = low[after] if after < len(low) else ""
        w["brk"] = nxt in CLAUSE_END


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
    voice = os.environ.get("REEL_ELEVEN_VOICE") or os.environ["ELEVENLABS_VOICE_ID"]
    try:
        speed = max(0.7, min(1.2, 1.0 + float(rate.replace("%", "").replace("+", "")) / 100.0))
    except ValueError:
        speed = 1.0
    body = {
        "text": text,
        "model_id": os.environ.get("ELEVEN_MODEL", "eleven_v3"),  # Aaron 2026-07-17: v3 = bestes Deutsch/Betonung (Panel-Fix); via ELEVEN_MODEL übersteuerbar
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "speed": speed},
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
    except urllib.error.HTTPError:
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
    with open(out_words, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)
    if not words:
        print("WARNUNG: keine Timestamps von ElevenLabs", file=sys.stderr)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--words", required=True)
    p.add_argument("--voice", default=DEFAULT_VOICE)
    p.add_argument("--rate", default="+4%")  # minimal flotter = weniger Hänger
    p.add_argument("--engine", default="edge", choices=["edge", "eleven"])
    args = p.parse_args()
    if args.engine == "eleven":
        synth_eleven(args.text, args.rate, args.out, args.words)
    else:
        asyncio.run(synth(args.text, args.voice, args.rate, args.out, args.words))
    print(f"OK vo -> {args.out}")


if __name__ == "__main__":
    main()
