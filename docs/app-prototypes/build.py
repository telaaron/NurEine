#!/usr/bin/env python3
"""Build an artifact HTML for the Artifact tool.

The Artifact wrapper controls <head>, so we can't set a charset. To render
correctly regardless, we make the file pure ASCII:
  - In HTML/CSS regions: non-ASCII -> numeric HTML entity (&#NNN;)
  - Inside <script>...</script>: non-ASCII -> JS unicode escape (\\uXXXX / surrogate pair)
    because HTML entities are NOT decoded inside script text / assigned via textContent.
Also embeds the two brand fonts as base64 (placeholders __SG_B64__ / __NR_B64__).
Usage: python3 build.py <raw.html> <out.html>
"""
import base64, re, sys

FONTS = "/Volumes/SSD 500G/offloaded/home/aaronpfutzner/Dateien - Local/NurEine/remotion/public/fonts"

def to_entities(text):
    return ''.join(ch if ord(ch) < 128 else '&#%d;' % ord(ch) for ch in text)

def to_js_escapes(text):
    out = []
    for ch in text:
        o = ord(ch)
        if o < 128:
            out.append(ch)
        elif o <= 0xFFFF:
            out.append('\\u%04x' % o)
        else:  # astral plane -> UTF-16 surrogate pair
            o -= 0x10000
            hi = 0xD800 + (o >> 10)
            lo = 0xDC00 + (o & 0x3FF)
            out.append('\\u%04x\\u%04x' % (hi, lo))
    return ''.join(out)

def main(src_path, out_path):
    src = open(src_path, encoding="utf-8").read()
    # Split into script and non-script segments, keeping the <script>..</script> tags.
    parts = re.split(r'(<script\b[^>]*>.*?</script>)', src, flags=re.DOTALL | re.IGNORECASE)
    rebuilt = []
    for seg in parts:
        if seg[:7].lower() == '<script':
            # entity-escape the tag itself is unnecessary (ASCII); JS-escape only inner text
            m = re.match(r'(<script\b[^>]*>)(.*)(</script>)', seg, flags=re.DOTALL | re.IGNORECASE)
            if m:
                rebuilt.append(m.group(1) + to_js_escapes(m.group(2)) + m.group(3))
            else:
                rebuilt.append(to_js_escapes(seg))
        else:
            rebuilt.append(to_entities(seg))
    src = ''.join(rebuilt)

    sg = base64.b64encode(open(f"{FONTS}/SpaceGrotesk-Bold.ttf", "rb").read()).decode()
    nr = base64.b64encode(open(f"{FONTS}/Newsreader-Italic.ttf", "rb").read()).decode()
    src = src.replace("__SG_B64__", sg).replace("__NR_B64__", nr)

    open(out_path, "w", encoding="utf-8").write(src)
    remaining = sum(1 for ch in src if ord(ch) >= 128)
    print(f"built {out_path}: {len(src)} bytes, {remaining} raw-non-ascii (want 0)")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
