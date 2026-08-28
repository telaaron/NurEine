#!/usr/bin/env python3
"""
Generiert die REEL-HINTERGRUND-ASSETS via Seedream v4.5 (fal.ai).

⛔ NICHT MEHR FUER REEL-HINTERGRUENDE VERWENDEN (Aaron 2026-08-28).

Dieses Skript legt pro Kategorie 4 Varianten aus EINEM Seedream-Call ab. In einem
Call haelt Seedream Person, Ort und Kleidung konstant — die 4 Bilder zeigen also
DIESELBE Person aus anderem Winkel (belegt: bg-gesundheit-1/-2, identische
Krankenschwester an derselben Bank). Werden diese Bilder als Vorrat ueber viele
Reels verteilt, entsteht eine wiederkehrende "Hauptdarstellerin", die es nicht
gibt — bei einer Marke mit dem USP "belegt" liest sich das als inszeniert.

Der Kopf sagte "Best-of-N: num_images 4", der Code speicherte aber ALLE vier
(Zeile ~142). Genau diese Luecke hat den Einheits-Look erzeugt.

Richtig ist: pro Story ein EIGENES Bild aus einem Prompt zu DIESER Story,
num_images=4 nur zur AUSWAHL — eines behalten, drei verwerfen. Siehe
docs/REEL_BAUKASTEN.md, Abschnitt Bild-Gate.

Fuer reine Texturen (tex-paper, tex-linen) ohne Menschen bleibt das Skript nutzbar.

WICHTIG — was hier bewusst NICHT generiert wird:
  Keine Dokumente, keine Zahlen, keine Schrift, keine Diagramme, keine Logos.
  Die Collage-/Beleg-Optik entsteht in Remotion aus ECHTEN Daten (Quellenname,
  echte Zahl aus nureine_stories). Ein KI-"Dokument" waere ein ERFUNDENER BELEG —
  bei einer Marke mit dem USP "belegt statt behauptet" der teuerste denkbare Fehler.
  Ausserdem koennen Bildmodelle keinen korrekten Text ("43 Millionen" -> Buchstabensalat).

Regeln aus docs/AI_ROADMAP.md (Bild-Regie, verbindlich):
  - Modell FIX: fal-ai/bytedance/seedream/v4.5/text-to-image
  - Fotografen-DNA konstant (Leica 35mm, Portra 400, warmes Licht, EIN Terracotta-Akzent)
  - Prompt Subject-first, dann DNA
  - ANATOMIE-HAERTUNG: Haende NICHT zeigen, keine Gesten, waist-up/Profil
  - Best-of-N: num_images 4 in EINEM Call
  - Seedream kennt KEIN negative_prompt und KEIN guidance_scale
  - Vor dem Ablegen verkleinern (Egress-Vorfall 2026-07-16): max 1536px, JPEG q85

Aufruf:  python3 scripts/gen_reel_assets.py <outdir> [key]
"""
import base64
import io
import json
import os
import sys
import urllib.request

ENDPOINT = "https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image"

DNA = (
    "Shot on Leica 35mm reportage lens, Kodak Portra 400 emulation, warm natural light, "
    "shallow depth of field, fine film grain, documentary photography, one single "
    "terracotta accent, muted earthy palette, no text, no letters, no numbers, no logo, "
    "no watermark, no signage"
)

SAFE_BODY = (
    "waist-up framing, hands not visible, natural relaxed posture, "
    "seen from behind or in profile"
)

ASSETS = [
    dict(key="tex-paper", note="Papier-Textur als Collage-Untergrund", prompt=(
        "Empty aged paper surface filling the entire frame, softly crumpled cream "
        "coloured stock with subtle fibre texture, faint foxing spots at the edges, "
        "one torn edge running across, raking side light revealing the grain. "
        "Completely blank, no writing of any kind. " + DNA)),
    dict(key="tex-linen", note="Leinen/Karton-Textur, zweiter Untergrund", prompt=(
        "Empty coarse linen book cloth filling the entire frame, natural undyed fibre "
        "with visible weave, one faint terracotta thread running through, soft even "
        "light, macro flat-lay. Completely blank surface, no print. " + DNA)),
    dict(key="bg-hunger", note="Welthunger — Getreidemarkt, wuerdevoll", prompt=(
        "Wide view of an open-air grain market at golden hour, full woven baskets of "
        "millet and rice in the foreground, a vendor standing in the background out of "
        "focus, dust in the warm light. Dignified, ordinary, abundant. "
        + SAFE_BODY + ". " + DNA)),
    dict(key="bg-gesundheit", note="Gesundheit — Klinik/Versorgung, ruhig", prompt=(
        "A quiet rural health post at morning light, simple wooden bench along a "
        "whitewashed wall, a nurse in profile facing away towards an open doorway, "
        "soft shaft of daylight across the floor. Calm, unhurried, hopeful. "
        + SAFE_BODY + ". " + DNA)),
    dict(key="bg-klima", note="Klima — Landschaft im Wandel", prompt=(
        "Wide landscape of returning green across dry savannah, young trees in regular "
        "rows planted along a shallow water channel, low sun behind them, long shadows, "
        "a distant figure walking away along the ridge. " + DNA)),
    dict(key="bg-archiv", note="Beleg/Archiv — Aktenstapel (Optik, KEIN Text)", prompt=(
        "Stack of plain unmarked file folders on a wooden desk seen from a low angle, "
        "warm desk lamp light from the left, dust motes in the beam, shallow focus so "
        "only the top folder edge is sharp. Blank covers, nothing written or printed "
        "on them. " + DNA)),
]

KEY_NAMES = ("FAL_KEY", "FAL_API_KEY", "FAL_AI_API_KEY")


def load_key():
    for name in KEY_NAMES:
        if os.environ.get(name):
            return os.environ[name]
    vault = os.path.expanduser("~/.claude/secrets/keys.env")
    if os.path.exists(vault):
        for line in open(vault, encoding="utf-8"):
            for name in KEY_NAMES:
                if line.strip().startswith(name + "="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    return None


def generate(key, spec, n=4):
    body = json.dumps({
        "prompt": spec["prompt"],
        "image_size": {"width": 1080, "height": 1920},
        "num_images": n,
        "enable_safety_checker": True,
    }).encode()
    req = urllib.request.Request(
        ENDPOINT, data=body,
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)


def save_downscaled(src, path, max_px=1536):
    from PIL import Image
    if src.startswith("data:"):
        raw = base64.b64decode(src.split(",", 1)[1])
    else:
        raw = urllib.request.urlopen(src, timeout=180).read()
    img = Image.open(io.BytesIO(raw))
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.thumbnail((max_px, max_px), Image.LANCZOS)
    img.save(path, "JPEG", quality=85, optimize=True)
    return os.path.getsize(path)


def main():
    key = load_key()
    if not key:
        print("FEHLER: kein FAL-Key (~/.claude/secrets/keys.env)", file=sys.stderr)
        return 1
    outdir = sys.argv[1] if len(sys.argv) > 1 else "."
    only = sys.argv[2] if len(sys.argv) > 2 else None
    os.makedirs(outdir, exist_ok=True)
    total = 0
    menschen = [a for a in ASSETS if a["key"].startswith("bg-")]
    if menschen:
        print("WARNUNG: bg-* Motive erzeugen 4 Varianten DERSELBEN Person aus einem")
        print("         Call. Als Reel-Vorrat gesperrt (siehe Kopf). Nur fortfahren,")
        print("         wenn du bewusst Texturen/Ersatz baust.")

    for spec in ASSETS:
        if only and spec["key"] != only:
            continue
        print(f"== {spec['key']} — {spec['note']}", flush=True)
        try:
            res = generate(key, spec)
        except Exception as e:
            detail = ""
            try:
                detail = e.read().decode()[:300]
            except Exception:
                pass
            print(f"   FEHLER: {e} {detail}")
            continue
        for i, im in enumerate(res.get("images", [])):
            p = os.path.join(outdir, f"{spec['key']}-{i+1}.jpg")
            try:
                kb = save_downscaled(im.get("url") or im.get("b64_json", ""), p) // 1024
                print(f"   -> {os.path.basename(p)}  {kb} KB", flush=True)
                total += 1
            except Exception as e:
                print(f"   Speichern fehlgeschlagen: {e}")
    print(f"fertig: {total} Bilder")
    return 0


if __name__ == "__main__":
    sys.exit(main())
