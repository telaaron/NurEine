# NurEine-Moderator:innen — Posen erweitern

Zwei Figuren: **Moderator** (`mann/`, beiger Anzug) und **Moderatorin** (`frau/`,
Dutt + Terracotta-Schal, seit 2026-07-06). Pro Reel wählt der Seed (oder der
Regie-Plan via `"person"`) die Figur; die VO-Stimme folgt automatisch
(Florian/Seraphina).

Der Character ist die Signatur-Figur der Reels. Er nutzt **freigestellte PNGs**
(transparenter Hintergrund) und wechselt je Reel-Moment die Geste + Micro-Motion.

## Neue Bilder hinzufügen (damit der Feed abwechslungsreich wirkt)

1. Character in gewünschter Geste generieren, **freistellen** (transparenter BG,
   z.B. Photoroom / remove.bg), als PNG exportieren.
2. Nach `remotion/public/character/<person>/` legen (person: `mann` | `frau`,
   neue Person = neuer Ordner), benannt nach dem Schema:

   ```
   <geste>-<nummer>.png
   ```

   Bestehende Gesten: `idle` · `point-up` · `point-side` · `reading` · `thinking` · `wave`

   Beispiele für neue Varianten:
   - `point-up-2.png`, `point-up-3.png`  ← weitere „zeigt nach oben"-Bilder
   - `thinking-2.png`                     ← weitere „denkt"-Bilder
   - `wave-2.png`                         ← weitere „winkt"-Bilder

   Neue Geste? Einfach neuen Namen wählen (z.B. `celebrate-1.png`) — dann im
   Code die Geste an der passenden Stelle referenzieren.

3. Manifest neu generieren:

   ```
   cd remotion && node scripts/scan-poses.mjs
   ```

4. Fertig. Der Reel-Generator wählt pro Story **deterministisch** (per Story-id-Seed)
   eine Variante der jeweiligen Geste → über viele Reels sieht man verschiedene
   Bilder, obwohl es dieselbe Figur ist. Niemand durchschaut so schnell, dass es
   nur eine Handvoll Grundgesten sind.

## Tipp für konsistente Bilder
- Gleiche Figur, gleiche Kleidung (beiger Anzug, Brille, Rollkragen), gleicher
  3D-Cartoon-Stil, gleiche Beleuchtung.
- Immer freigestellt (transparent) — kein einfarbiger Hintergrund im PNG.
- Ähnlicher Bildausschnitt (Kopf + Oberkörper), damit die Größe im Reel passt.
