#!/usr/bin/env python3
"""
render_reel.py — "Atmendes Papier v2" Reel-Renderer.

Baut aus drei vorgerenderten 9:16-Standbildern (hook / aufloesung / endcard,
Satori-PNGs vom Endpoint /api/reel-frame/<slug>/<frame>) ein 1080x1920-MP4 mit
ruhiger Bewegung (Ken-Burns/Atmen, Crossfades) und optionaler CC0-Tonspur.

KEIN Text wird in ffmpeg gerendert — der Text steckt schon markenkonsistent in
den PNGs (gleiche Satori-Pipeline wie die Carousels). ffmpeg macht nur Bewegung.
So braucht ffmpeg weder libass noch Fonts → läuft in jeder Umgebung gleich.

Aufruf:
  python3 scripts/render_reel.py \
      --base-url https://nureine.de \
      --slug 50-millionen-... \
      --out /tmp/reel.mp4 \
      [--audio assets/audio/ambient1.m4a] \
      [--type A|B|C]

Ohne --out wird nach /tmp/reel-<slug>.mp4 geschrieben.
Exit 0 = MP4 erzeugt; Exit != 0 = Fehler (für cron_runs-Logging).

Timing (12 s @ 30 fps), bewusst ruhig:
  Hook        0.0 – 4.0 s   (sichtbar 4.0, davon 0.5 Crossfade in Auflösung)
  Auflösung   4.0 – 8.3 s   (etwas mehr Luft — Nutzer-Feedback: Auflösung landen lassen)
  Endcard     8.3 – 12.0 s  (schickbarer Schluss)
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

FPS = 30
W, H = 1080, 1920

# Dauer je Frame (inkl. der 0.5s-Crossfade-Überlappung zum nächsten).
DUR_HOOK = 4.0
DUR_AUFL = 4.3
DUR_END = 3.7
XFADE = 0.5  # Crossfade-Dauer zwischen den Segmenten


def fetch_frame(base_url: str, slug: str, frame: str, reel_type: str | None, dest: str) -> None:
    """Lädt ein Reel-Frame-PNG vom Endpoint."""
    url = f"{base_url.rstrip('/')}/api/reel-frame/{slug}/{frame}"
    if reel_type:
        url += f"?type={reel_type}"
    req = urllib.request.Request(url, headers={"User-Agent": "NurEine-ReelRenderer/1"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f"frame {frame} → HTTP {resp.status}")
        data = resp.read()
    if len(data) < 1000:
        raise RuntimeError(f"frame {frame} verdächtig klein ({len(data)} B)")
    with open(dest, "wb") as f:
        f.write(data)


def kenburns(src_png: str, duration: float, direction: str) -> str:
    """
    Baut einen zoompan-Ausdruck fürs 'Atmen'. direction steuert Zoom-Richtung,
    damit aufeinanderfolgende Segmente sich nicht gleich bewegen.

    Performance: leichte 1.4×-Vorskalierung (1512×2688) statt 4K reicht gegen
    den zoompan-Subpixel-Jitter und ist ~4× schneller im Encode (wichtig fürs
    GitHub-Actions-Gratiskontingent). Der sichtbare Zoom bleibt ≤1.06.
    """
    frames = int(duration * FPS)
    if direction == "in":
        z = "min(zoom+0.0010,1.06)"  # langsam reinzoomen 1.00 -> 1.06
    elif direction == "out":
        z = "if(eq(on,0),1.06,max(zoom-0.0010,1.0))"  # rauszoomen 1.06 -> 1.00
    else:  # still: fast unbewegt, minimaler Drift (Typ B/mensch ruhig)
        z = "min(zoom+0.0004,1.025)"
    sw, sh = int(W * 1.4), int(H * 1.4)
    return (
        f"scale={sw}:{sh},"
        f"zoompan=z='{z}':d={frames}:"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"s={W}x{H}:fps={FPS},"
        f"setpts=PTS-STARTPTS"
    )


def build_reel(pngs: dict[str, str], audio_path: str | None, out_mp4: str) -> None:
    """
    EIN ffmpeg-Pass: alle drei Standbilder bekommen je ein zoompan-'Atmen', werden
    per xfade weich verkettet, einmal mit Vignette/Korn versehen und EINMAL kodiert.
    Single-Pass statt Segment-für-Segment-Re-Encode → ~3× schneller, eine Datei.

    Audio (falls vorhanden) wird geloopt, normalisiert und sanft ein-/ausgeblendet.
    """
    frames = ["hook", "aufloesung", "endcard"]
    durs = {"hook": DUR_HOOK, "aufloesung": DUR_AUFL, "endcard": DUR_END}
    directions = {"hook": "in", "aufloesung": "out", "endcard": "still"}

    inputs: list[str] = []
    for fr in frames:
        inputs += ["-loop", "1", "-t", f"{durs[fr]:.3f}", "-i", pngs[fr]]

    # 1) je Input ein zoompan-Segment [s0]/[s1]/[s2]
    filt: list[str] = []
    for i, fr in enumerate(frames):
        filt.append(f"[{i}:v]{kenburns(pngs[fr], durs[fr], directions[fr])}[s{i}]")

    # 2) xfade-Kette über die Segmente
    offset = 0.0
    prev = "[s0]"
    for i in range(1, len(frames)):
        offset += durs[frames[i - 1]] - XFADE
        label = f"[x{i}]"
        filt.append(f"{prev}[s{i}]xfade=transition=fade:duration={XFADE}:offset={offset:.3f}{label}")
        prev = label

    # 3) einmal Look drüber (Vignette + dezentes statisches Korn) → [vout]
    filt.append(f"{prev}vignette=PI/5,noise=alls=6:allf=u,format=yuv420p[vout]")

    total = sum(durs.values()) - (len(frames) - 1) * XFADE

    cmd = ["ffmpeg", "-y", "-loglevel", "error", *inputs]
    if audio_path and os.path.exists(audio_path):
        af = f"afade=t=in:st=0:d=1,afade=t=out:st={total - 1.5:.2f}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11"
        cmd += ["-stream_loop", "-1", "-i", audio_path]
        filt.append(f"[{len(frames)}:a]{af}[aout]")
        cmd += [
            "-filter_complex", ";".join(filt),
            "-map", "[vout]", "-map", "[aout]",
            "-c:a", "aac", "-b:a", "128k", "-shortest",
        ]
    else:
        cmd += ["-filter_complex", ";".join(filt), "-map", "[vout]"]

    cmd += [
        "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-crf", "23", "-maxrate", "8M", "-bufsize", "12M",
        "-t", f"{total:.3f}",
        out_mp4,
    ]
    subprocess.run(cmd, check=True)


def _unused_add_audio(video_mp4: str, audio_path: str, out_mp4: str) -> None:
    """(ersetzt durch Single-Pass build_reel — nur als Referenz behalten)."""
    total = DUR_HOOK + DUR_AUFL + DUR_END - 2 * XFADE
    af = f"afade=t=in:st=0:d=1,afade=t=out:st={total - 1.5:.2f}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", video_mp4,
        "-stream_loop", "-1", "-i", audio_path,
        "-filter:a", af,
        "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        out_mp4,
    ]
    subprocess.run(cmd, check=True)


def upload_to_supabase(mp4_path: str, slug: str) -> str:
    """Lädt das MP4 in den public Storage-Bucket und gibt die public URL zurück.
    Erwartet SUPABASE_URL + SUPABASE_SERVICE_KEY in der Umgebung. Bucket 'story_images'.
    """
    supa_url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    bucket = os.environ.get("REEL_BUCKET", "story_images")
    # eindeutiger, kollisionsfreier Dateiname (slug + kurzer Hash der Größe).
    fname = f"reels/{slug}-{os.path.getsize(mp4_path) % 100000}.mp4"
    up_url = f"{supa_url}/storage/v1/object/{bucket}/{fname}"
    with open(mp4_path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(
        up_url,
        data=data,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "video/mp4",
            "x-upsert": "true",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        if resp.status not in (200, 201):
            raise RuntimeError(f"Storage-Upload HTTP {resp.status}")
    return f"{supa_url}/storage/v1/object/public/{bucket}/{fname}"


def queue_reel_post(story_id: str, video_url: str, caption: str, hashtags: list[str], category: str) -> None:
    """Legt einen Reel-Post-Draft in nureine_social_posts an (post_kind='reel')."""
    supa_url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    body = {
        "story_id": story_id,
        "platform": "instagram",
        "post_kind": "reel",
        "caption": caption,
        "hashtags": hashtags,
        "card_url": video_url,
        "og_url": video_url,
        "slide_urls": [video_url],  # publishDue liest die Video-URL hier
        "hook_type": "zahl",
        "hook_style": "image",
        "category": category,
        "is_carousel": False,
        "status": "draft",
    }
    req = urllib.request.Request(
        f"{supa_url}/rest/v1/nureine_social_posts",
        data=json.dumps(body).encode(),
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status not in (200, 201, 204):
            raise RuntimeError(f"Queue-Insert HTTP {resp.status}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--audio", default=None, help="optionale CC0-Tonspur")
    ap.add_argument("--type", default=None, choices=["A", "B", "C"], help="Reel-Typ überschreiben")
    ap.add_argument("--upload", action="store_true", help="MP4 nach Supabase Storage laden")
    ap.add_argument("--queue", action="store_true", help="Reel-Post-Draft anlegen (impliziert --upload)")
    ap.add_argument("--story-id", default=None, help="für --queue: story_id")
    ap.add_argument("--caption", default="", help="für --queue")
    ap.add_argument("--hashtags", default="", help="für --queue: kommasepariert")
    ap.add_argument("--category", default="gemeinschaft", help="für --queue")
    args = ap.parse_args()

    out = args.out or f"/tmp/reel-{args.slug}.mp4"
    tmp = tempfile.mkdtemp(prefix="reel-")

    try:
        # 1) Frames holen.
        frames = ["hook", "aufloesung", "endcard"]
        pngs = {}
        for fr in frames:
            p = os.path.join(tmp, f"{fr}.png")
            fetch_frame(args.base_url, args.slug, fr, args.type, p)
            pngs[fr] = p

        # 2) Single-Pass: zoompan + xfade + Look + Audio in EINEM ffmpeg-Lauf.
        build_reel(pngs, args.audio, out)

        size = os.path.getsize(out)
        print(f"OK reel → {out} ({size // 1024} KB)")

        # 5) Optional: hochladen + Post-Draft anlegen (für den Workflow).
        if args.upload or args.queue:
            video_url = upload_to_supabase(out, args.slug)
            print(f"OK upload → {video_url}")
            if args.queue:
                if not args.story_id:
                    print("FEHLER: --queue braucht --story-id", file=sys.stderr)
                    return 3
                tags = [t.strip() for t in args.hashtags.split(",") if t.strip()]
                queue_reel_post(args.story_id, video_url, args.caption, tags, args.category)
                print("OK reel-draft angelegt (status=draft)")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"FEHLER ffmpeg: {e}", file=sys.stderr)
        return 2
    except Exception as e:  # noqa: BLE001
        print(f"FEHLER: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
