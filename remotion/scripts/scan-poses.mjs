#!/usr/bin/env node
/**
 * Scannt public/character/ nach Character-Posen und schreibt src/character/pose-manifest.ts.
 * Konvention: <geste>-<n>.png   z.B. point-up-1.png, point-up-2.png, thinking-1.png …
 * Erlaubte Gesten: idle, point-up, point-side, reading, thinking, wave (+ frei erweiterbar).
 *
 * Neue Bilder einbauen: PNG (transparent) mit passendem Namen nach public/character/ legen,
 * dann `node scripts/scan-poses.mjs` ausführen. Fertig — der Reel-Generator rotiert automatisch.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public/character');

const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
// Nach Geste gruppieren: "point-up-2.png" → geste "point-up", variante 2
const groups = {};
for (const f of files) {
	const m = f.match(/^([a-z-]+?)-(\d+)\.png$/);
	if (!m) continue;
	const [, gesture, n] = m;
	(groups[gesture] ??= []).push({ file: `character/${f}`, n: parseInt(n, 10) });
}
for (const g of Object.keys(groups)) groups[g].sort((a, b) => a.n - b.n);

const manifest = Object.fromEntries(Object.entries(groups).map(([g, arr]) => [g, arr.map((x) => x.file)]));

const out = `// AUTO-GENERIERT von scripts/scan-poses.mjs — nicht von Hand editieren.
// Jede Geste → Liste der verfügbaren Varianten-PNGs (transparent).
export const POSE_VARIANTS: Record<string, string[]> = ${JSON.stringify(manifest, null, 2)};
`;
writeFileSync(join(root, 'src/character/pose-manifest.ts'), out);
const total = Object.values(manifest).reduce((s, a) => s + a.length, 0);
console.log(`OK pose-manifest.ts: ${Object.keys(manifest).length} Gesten, ${total} Bilder`);
for (const [g, a] of Object.entries(manifest)) console.log(`  ${g}: ${a.length}`);
