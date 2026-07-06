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
    with open(out_words, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)
    if not words:
        print("WARNUNG: keine WordBoundaries erhalten", file=sys.stderr)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--words", required=True)
    p.add_argument("--voice", default=DEFAULT_VOICE)
    p.add_argument("--rate", default="+4%")  # minimal flotter = weniger Hänger
    args = p.parse_args()
    asyncio.run(synth(args.text, args.voice, args.rate, args.out, args.words))
    print(f"OK vo -> {args.out}")


if __name__ == "__main__":
    main()
