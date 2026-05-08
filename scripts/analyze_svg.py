import re

svg = open("/Users/aaronpfutzner/Dateien - Local/lichtblick/static/logo.svg").read()

def extract_coords(d):
    tokens = d.replace(',', ' ').split()
    i = 0
    coords = []
    cmd = 'M'
    cmd_chars = set('MmLlHhVvCcSsQqTtAa')
    while i < len(tokens):
        tok = tokens[i]
        if tok[0] in cmd_chars or (len(tok) == 1 and tok in cmd_chars):
            cmd = tok[0].upper()
            i += 1
        elif tok.lower() == 'z':
            i += 1
            continue
        else:
            pass

        if cmd in 'MLTCSQ':
            coords.append((float(tokens[i]), float(tokens[i+1])))
            i += 2
        elif cmd in 'A':
            i += 7
        elif cmd in 'HVhv':
            i += 1
        else:
            i += 1
    return coords

all_ys = []
all_xs = []
for path in re.findall(r'd="([^"]*)"', svg):
    coords = extract_coords(path)
    for x, y in coords:
        all_xs.append(x)
        all_ys.append(y)

print(f"X range: {min(all_xs):.0f} - {max(all_xs):.0f}")
print(f"Y range: {min(all_ys):.0f} - {max(all_ys):.0f}")
print(f"Current viewBox: 0 580 2048 1210 -> canvas Y: 580 to {580+1210}")

unique_ys = sorted(set(all_ys))
print(f"\nAll unique Y values sorted:")
print(f"First 5: {unique_ys[:5]}")
print(f"Last 5: {unique_ys[-5:]}")

# Check if any Y coordinates are above 580 (would be clipped)
below = [y for y in all_ys if y < 580]
if below:
    print(f"\n❗ Y values BELOW 580 (CLIPPED): {sorted(set(below))}")
else:
    print(f"\nNo Y values below 580 - nothing should be clipped at the top")
