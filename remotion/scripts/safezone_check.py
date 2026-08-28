#!/usr/bin/env python3
"""Legt TikToks Bedienelemente ueber Standbilder eines Reels.

Warum: Ob Text unter dem Kommentar-Icon oder der Caption verschwindet, sieht man
im nackten MP4 NICHT — erst in der App, also nach dem Posten. Dieses Skript
zieht Standbilder und markiert die Zonen, in denen TikTok eigene Bedienelemente
zeichnet. Was dort hineinragt, ist im Feed verdeckt.

Zonen an Screenshots der laufenden App ausgemessen (2026-08-26, iPhone):
    oben   270 px  Suchleiste "Finde aehnliche Inhalte"
    rechts 141 px  Aktionsspalte (Avatar, Herz, Kommentar, Lesezeichen)
    unten  393 px  Caption, KI-Label, Aufrufe-Leiste

    ./safezone_check.py out/reel.mp4 [-o /tmp/check]
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

OBEN, RECHTS, UNTEN = 270, 141, 393


def dauer(video: Path) -> float:
    roh = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", str(video)],
        capture_output=True, text=True, check=True).stdout
    return float(json.loads(roh)["format"]["duration"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("-o", "--out", default="/tmp/safezone")
    ap.add_argument("-n", "--anzahl", type=int, default=8)
    a = ap.parse_args()

    video = Path(a.video)
    if not video.exists():
        print(f"nicht gefunden: {video}", file=sys.stderr)
        return 1

    ziel = Path(a.out)
    ziel.mkdir(parents=True, exist_ok=True)
    laenge = dauer(video)

    # Halbtransparentes Rot ueber jede Zone; was darunter liegt, ist im Feed verdeckt.
    zonen = (
        f"drawbox=x=0:y=0:w=iw:h={OBEN}:color=red@0.35:t=fill,"
        f"drawbox=x=iw-{RECHTS}:y=0:w={RECHTS}:h=ih:color=red@0.35:t=fill,"
        f"drawbox=x=0:y=ih-{UNTEN}:w=iw:h={UNTEN}:color=red@0.35:t=fill"
    )

    for i in range(a.anzahl):
        t = laenge * (i + 0.5) / a.anzahl
        bild = ziel / f"{i:02d}-{t:04.1f}s.png"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(video),
             "-vf", zonen, "-frames:v", "1", str(bild)], check=True)
        print(f"  {bild}")

    print(f"\n{a.anzahl} Bilder in {ziel}")
    print("Rot = TikToks Bedienelemente. Ragt Inhalt hinein, ist er im Feed verdeckt.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
