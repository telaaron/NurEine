import cairosvg
from pathlib import Path

# Read the original SVG and render it to see the full layout
orig = Path("/Users/aaronpfutzner/Downloads/NurEine.svg").read_bytes()

# Render full original to verify what it looks like
cairosvg.svg2png(bytestring=orig, write_to="/tmp/nureine_original.png", output_width=512, output_height=512)
print("Rendered original to /tmp/nureine_original.png")

# Now let me try different viewbox options to find the right one for just the logo mark (teardrop)
# The colored groups have y values that I need to check
# Looking at the path data manually:
# Path 1 (fill #272626): starts at 995,1714 - this is the bottom
# Path 2 (#272626): starts at 606,1182, has points up to...
# Path 3 (#171616): starts at 1022,1713 - bottom of right side

# Let me extract all Y values from the colored groups only
import re

svg_text = orig.decode('utf-8')
# Extract only the colored groups (skip the white bg group)
colored_svg = re.sub(r'<g fill="#ffffff">.*?</g>', '', svg_text, flags=re.DOTALL)

# Save just the colored groups to render
header = svg_text[:svg_text.find('<g fill="#272626">')].strip()
footer = '</svg>'
# Need to handle this differently - let me build a clean SVG with the colored groups

# More systematic approach - manually extract Y coordinates from all colored paths
import re

svg = orig.decode('utf-8')

# Find all path d= attributes in colored groups
colored_groups = re.findall(r'<g fill="#(?:272626|171616|e7632c|af3e1d)">.*?</g>', svg, re.DOTALL)
paths = []
for g in colored_groups:
    paths.extend(re.findall(r'd="([^"]*)"', g))

# Manually extract all y values from path data
all_ys = []
for d in paths:
    # Split on spaces and parse numbers
    parts = d.replace(',', ' ').split()
    # Look for numbers - simple approach: parse everything that looks like a number
    nums = []
    for p in parts:
        try:
            nums.append(float(p))
        except ValueError:
            pass

    # Every other number starting from index 1 should be a Y coordinate
    # But this is oversimplified. Let me just extract all pairs.
    for i in range(0, len(nums) - 1, 2):
        # This will capture some wrong pairs but should catch all Y values
        all_ys.append(nums[i+1])

print(f"\nColored groups Y range: {min(all_ys):.0f} - {max(all_ys):.0f}")

# Also extract from the white text group
white_group = re.search(r'<g fill="#ffffff">(.*?)</g>', svg, re.DOTALL)
if white_group:
    white_paths = re.findall(r'd="([^"]*)"', white_group.group(1))
    # The first path is the circle, skip it
    white_all_ys = []
    for d in white_paths[1:]:  # skip circle
        parts = d.replace(',', ' ').split()
        nums = []
        for p in parts:
            try:
                nums.append(float(p))
            except ValueError:
                pass
        for i in range(0, len(nums) - 1, 2):
            white_all_ys.append(nums[i+1])
    if white_all_ys:
        print(f"White text Y range: {min(white_all_ys):.0f} - {max(white_all_ys):.0f}")

print(f"\nOriginal canvas: 0-2048 x 0-2048")
print(f"White circle: centered at 1024,1024, radius 1024")
