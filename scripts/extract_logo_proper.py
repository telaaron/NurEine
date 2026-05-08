#!/usr/bin/env python3
"""Extract the full NurEine logo (teardrop icon + wordmark) with proper viewBox.
The logo consists of:
  - Colored teardrop icon (y ~ -239 to 664)
  - White "NurEine" wordmark letterforms (in the white group, upper section)
Together they form the complete logo in a circle on the 2048×2048 canvas.
"""

import re
from pathlib import Path

ORIG = Path("/Users/aaronpfutzner/Downloads/NurEine.svg")
svg = ORIG.read_text()

# Extract Y ranges from ALL groups (excluding the circle background path)
all_ys = []
all_xs = []

# Parse paths
for path_str in re.findall(r'd="([^"]*)"', svg):
    # Skip the big white circle background
    if 'l0 -1024' in path_str and '0 -1024z' in path_str:
        continue

    parts = path_str.replace(',', ' ').split()
    nums = []
    for p in parts:
        try:
            nums.append(float(p))
        except ValueError:
            pass

    # Every odd-indexed number in pairs should be Y (very rough heuristic)
    for i in range(0, len(nums) - 1, 2):
        all_xs.append(nums[i])
        all_ys.append(nums[i+1])

print(f"Logo content X: {min(all_xs):.0f} - {max(all_xs):.0f}")
print(f"Logo content Y: {min(all_ys):.0f} - {max(all_ys):.0f}")
print(f"Canvas: 2048 × 2048")

# With padding
pad = 40
y_min = min(all_ys)
y_max = max(all_ys)
x_min = min(all_xs)
x_max = max(all_xs)
print(f"\nWith {pad}px padding:")
print(f"  viewBox: {x_min-pad:.0f} {y_min-pad:.0f} {x_max-x_min+2*pad:.0f} {y_max-y_min+2*pad:.0f}")
print(f"  height: {y_max - y_min + 2*pad:.0f}")
print(f"  aspect: {(x_max - x_min + 2*pad) / (y_max - y_min + 2*pad):.4f}")
