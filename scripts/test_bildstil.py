#!/usr/bin/env python3
"""
Bildstil-Test: 4 Ansaetze x 2 Bilder an EINER echten Story (Utah/Solar, Panel-Video 1).

HINTERGRUND (Panel 2026-08-03): Lena "sieht aus wie eine RWE-Werbung", Slop-Radar 8/10.
Das Bestandsbild ist ein perfekt komponierter Solarpark im goldenen Sonnenuntergang.

WURZEL, nicht Symptom: Die Bild-DNA schreibt EINEN konstanten Look vor (Leica 35mm,
Portra 400, warmes Licht, eine Akzentfarbe). Das erzeugt zwangslaeufig den
"professionelles Shooting"-Eindruck — jedes Bild sieht aus wie aus derselben
Werbekampagne. Recherche 2026-08-03 (pixova/hedra/superfiles) sagt einhellig: Was ein
Bild echt wirken laesst, sind UNVOLLKOMMENHEITEN — schiefe Kadrierung, hartes
Seitenlicht, sichtbare Unordnung, Filmkorn. Woerter wie "perfect", "8k", "cinematic",
"masterpiece" ziehen aktiv in die falsche Richtung.

Die vier Ansaetze isolieren je EINE Hypothese, damit man sieht, WAS wirkt:
  A) BESTAND      — heutige DNA, als Referenz
  B) SCHNAPPSCHUSS— Handy-Foto-Logik: schief, hartes Licht, Unordnung, kein Goldlicht
  C) DETAIL       — kein Uebersichtsbild, sondern ein Ausschnitt (Textur, Nahaufnahme)
  D) DOKUMENT     — Sachaufnahme wie aus einem Bericht: flach, nuechtern, kein Drama

Aufruf: python3 scripts/test_bildstil.py <outdir>
"""
import base64
import io
import json
import os
import sys
import urllib.request

ENDPOINT = "https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image"

# Das Motiv bleibt in allen Ansaetzen GLEICH, damit nur der Stil variiert.
MOTIV = "a utility-scale solar farm in the high desert of Utah, red rock mesa in the distance"

ANSAETZE = [
    ("A-bestand", "Heutige DNA (Referenz)",
     f"{MOTIV}. Shot on Leica 35mm reportage lens, Kodak Portra 400 emulation, warm "
     "natural light, shallow depth of field, fine film grain, documentary photography, "
     "one single terracotta accent, muted earthy palette, no text, no logo"),

    ("B-schnappschuss", "Handy-Schnappschuss: schief, hartes Licht, Unordnung",
     f"{MOTIV}. Casual phone snapshot taken from a car window at midday, harsh overhead "
     "sun, hard shadows, slightly tilted horizon, dusty windshield reflection at the edge, "
     "power lines cutting across the frame, dry weeds in the foreground, flat unremarkable "
     "sky, slightly overexposed, no golden hour, off-center composition, nothing arranged"),

    ("C-detail", "Detail statt Uebersicht: Textur, Nahaufnahme",
     f"Close-up of the underside and mounting frame of a single solar panel in the Utah "
     "desert, dust on the glass, visible bolts and scratched aluminium, dry cracked soil "
     "below, one weed growing through, hard side light from the left, shallow focus, "
     "35mm, visible sensor noise, no sky, no wide view, no drama"),

    ("D-dokument", "Sachaufnahme wie aus einem Bericht",
     f"{MOTIV}, photographed plainly for a technical report, flat overcast light, no "
     "shadows, straight-on angle, centred but unglamorous, muted colours, slightly dull, "
     "utilitarian, looks like documentation not advertising, no golden hour, no lens flare"),
]

KEY_NAMES = ("FAL_KEY", "FAL_API_KEY", "FAL_AI_API_KEY")


def load_key():
    for n in KEY_NAMES:
        if os.environ.get(n):
            return os.environ[n]
    vault = os.path.expanduser("~/.claude/secrets/keys.env")
    if os.path.exists(vault):
        for line in open(vault, encoding="utf-8"):
            for n in KEY_NAMES:
                if line.strip().startswith(n + "="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    return None


def save(src, path, max_px=1400):
    from PIL import Image
    raw = (base64.b64decode(src.split(",", 1)[1]) if src.startswith("data:")
           else urllib.request.urlopen(src, timeout=180).read())
    im = Image.open(io.BytesIO(raw))
    if im.mode != "RGB":
        im = im.convert("RGB")
    im.thumbnail((max_px, max_px), Image.LANCZOS)
    im.save(path, "JPEG", quality=88, optimize=True)
    return os.path.getsize(path)


def main():
    key = load_key()
    if not key:
        print("FEHLER: kein FAL-Key", file=sys.stderr)
        return 1
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    for slug, note, prompt in ANSAETZE:
        print(f"== {slug} — {note}", flush=True)
        body = json.dumps({
            "prompt": prompt,
            "image_size": {"width": 1024, "height": 1024},
            "num_images": 2,
            "enable_safety_checker": True,
        }).encode()
        req = urllib.request.Request(
            ENDPOINT, data=body,
            headers={"Authorization": f"Key {key}", "Content-Type": "application/json"})
        try:
            res = json.load(urllib.request.urlopen(req, timeout=300))
        except Exception as e:
            detail = ""
            try:
                detail = e.read().decode()[:200]
            except Exception:
                pass
            print(f"   FEHLER: {e} {detail}")
            continue
        for i, im in enumerate(res.get("images", [])):
            p = os.path.join(out, f"{slug}-{i+1}.jpg")
            print(f"   -> {os.path.basename(p)} {save(im.get('url') or im.get('b64_json',''), p)//1024} KB", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
