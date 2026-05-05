# VoltFleet — Design Decisions

Operations dashboard for B2B fleet management. Audience: dispatchers + fleet managers.
Stance: density, keyboard, configurability — `category = Enterprise B2B / admin` from design-skill §5.

## References pulled (Layer 3)

- `linear.app` — dark-mode-native operations UI, ultra-thin borders, 4-tier text ramp, tabular numerics.
- `tesla` — color restraint (single accent), industrial typography, no decorative chrome.

Both are reference techniques only. VoltFleet identity, palette and copy are its own.

## 1. Dashboard type — Operations (skill §10)

Real-time fleet monitoring fits the **Operations** dashboard pattern: simple charts, status indicators, threshold alerts. No exploratory drill-down, no curated KPI hero.

- F-pattern reading: top → KPI strip (overview), middle-left → alerts (primary operator concern, 3/5 width), middle-right → efficiency chart (2/5 width).
- One focal point per section. The numbers (47 / 12 / 5) are the loudest items on screen by design.
- Same color = same metric everywhere: green = OK / on-route, blue = electric / charging, red = danger / fault. Yellow reserved for "warn" only.

## 2. Color system

Built around darkness as the native medium (Linear move) — eyes survive a 9-hour dispatcher shift better on `#08090a` than glare-white.

| Role | Token | Value | Contrast on canvas |
|---|---|---|---|
| Canvas | `--color-canvas` | `#08090a` | — |
| Panel | `--color-panel` | `#0f1011` | — |
| Text primary | `--color-text-primary` | `#f7f8f8` | 18.5 : 1 |
| Text secondary | `--color-text-secondary` | `#c9ced6` | 12.4 : 1 |
| Text muted | `--color-text-muted` | `#8b9099` | 5.8 : 1 |
| Accent (Volt blue) | `--color-volt` | `#3e8eff` | 6.4 : 1 |
| Success | `--color-ok` | `#22c55e` | 8.1 : 1 |
| Warning | `--color-warn` | `#f59e0b` | 9.7 : 1 |
| Danger | `--color-danger` | `#ef4444` | 5.0 : 1 |

All body text ≥ 4.5 : 1 (WCAG 1.4.3 AA). Borders are semi-transparent white at 8 % — structure without noise.

**Color is never the only signal** (WCAG 1.4.1):

- Fleet-status icons (▶ / ⚡ / ⚠) double-encode each metric.
- Battery alerts pair color with shape glyph (■ Kritisch / ▲ Warnung) and explicit text label.
- Route bars switch hue *and* the value label flips color when below plan.

## 3. Typography

- **Inter** at sizes 11/12/13/14/15/44 px. Three sizes dominate the screen; weight (400/500/600) carries sub-hierarchy (skill §3 typography).
- **JetBrains Mono** for vehicle IDs (`VF-1042`) — the eye locks onto monospaced identifiers in a scrollable column.
- `font-variant-numeric: tabular-nums` everywhere a number lives. Critical for any column comparison (Material data-viz rule).
- OpenType `cv01`, `ss03` enabled globally — borrowed from Linear; geometric `a` reads cleaner at 12 px.
- No thin weights (skill anti-pattern). No all-caps over 3 words — section headers use 11–13 px medium with `tracking-wide` instead.

## 4. Data viz — route efficiency chart

Decision: **horizontal bar chart with planned-line reference**, not a line/area chart.

Why bar (skill §10 + chart-csv #2):
- Question = "compare today's routes by efficiency" — category comparison, not time series.
- Length on common baseline reads fastest.
- 8 routes ≤ 15 → vertical/horizontal bar; horizontal chosen because route IDs read better left-aligned than rotated 90°.

Tufte / Cairo discipline (skill §14):
- **Y/X axis starts at zero** (`maxKm = 6`, scale starts at 0). Truncating distorts.
- **Title states finding** ("3 von 8 Routen unter Plan") — not topic ("Route efficiency").
- Subtitle gives causal hypothesis. Footer states denominators (avg, plan).
- Direct labels on each bar — legend exists once for the planned-vs-actual encoding, then never repeats.
- Dashed reference line for `Plan`, solid bar for `Ist`. Two encodings = readable in greyscale and for colorblind viewers.
- No gridlines, no 3D, no drop shadows, no ducks. Data-ink ratio kept high.

Series cap: 2 (plan + actual). Within skill's "≤ 4 series for bar" rule.

## 5. Spacing & layout

- 8-pt base, sub-grid 4-pt. Scale `4 / 8 / 12 / 16 / 24 / 32 / 48`.
- Max content width 1440 px — dispatchers run on wide industrial monitors; not artificially constrained to 1024.
- Cards use `p-5` (20 px) — dense enough to fit on a 13" laptop without scrolling the KPI strip out of view.
- Whitespace as separator between sections (Carbon: ~20 % comprehension lift).

## 6. Interaction & motion

- Hover only changes background, never moves elements (skill §3 motion: don't animate frequent actions).
- Transitions 150 ms, ease-out — within Doherty < 400 ms.
- `prefers-reduced-motion` honored globally in `app.css`.
- No bouncy easing — operations UI is serious work, not consumer polish.

## 7. Accessibility ship-gate

| Item | Status |
|---|---|
| Body text contrast ≥ 4.5 : 1 (WCAG 1.4.3) | ✅ all tiers |
| UI / graphic contrast ≥ 3 : 1 (1.4.11) | ✅ borders + bars vs panel |
| Focus indicator ≥ 2 px, ≥ 3 : 1 (2.4.11) | ✅ `:focus-visible` Volt-blue ring |
| Color not sole signal (1.4.1) | ✅ icons + labels + shape glyphs |
| Reflow at 320 px (1.4.10) | ✅ grid collapses to 1 col |
| Tabular numerals on data | ✅ `.tnum` class |
| Reduced-motion fallback | ✅ kills all transitions |
| Chart sr-only fallback | ✅ each bar `<span class="sr-only">…</span>` |
| Progress bars `role=progressbar` + aria values | ✅ on each KPI card |
| Section headings semantic + `aria-labelledby` | ✅ |

## 8. What was rejected & why

- **Donut/pie for fleet split** — only 3 categories so it would technically work, but bar/bullet form gives count + total + percent in one read. Pie hides the absolute number the dispatcher needs to call about.
- **Sparklines per row** — adds chartjunk to a table whose primary job is precise lookup. Tables win precision; charts win pattern (skill §10 step 0).
- **Map of fleet positions** — out of scope for this brief; would dominate visual hierarchy and bury the alert table.
- **Light mode** — operations UI runs 24 h. Dark canvas reduces glare for night-shift dispatchers and matches automotive/industrial vibe brief.

## 9. Open questions for next iteration

- Threshold (< 20 % SoC) is hard-coded — should be per-vehicle / per-depot.
- "ETA Depot" needs traffic data, not naive distance / speed.
- Real chart library (Apache ECharts / D3) once data is bigger than 8 rows.
