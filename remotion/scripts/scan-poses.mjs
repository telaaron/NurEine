#!/usr/bin/env node
/**
 * Scannt public/character/<person>/ nach Posen und schreibt src/character/pose-manifest.ts.
 * Konvention: character/<person>/<geste>-<n>.png   z.B. mann/point-up-1.png, frau/wave-2.png
 * Personen: mann, frau (+ frei erweiterbar — einfach neuen Ordner anlegen).
 * Gesten: idle, point-up, point-side, reading, thinking, wave (+ frei erweiterbar).
 *
 * Neue Bilder: PNG (transparent, ~1200px breit, 4:3) in den Personen-Ordner legen,
 * dann `node scripts/scan-poses.mjs`. Der Reel-Generator rotiert automatisch.
 */
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public/character');

const manifest = {};
for (const person of readdirSync(dir)) {
	const pdir = join(dir, person);
	if (!statSync(pdir).isDirectory()) continue;
	const groups = {};
	for (const f of readdirSync(pdir).filter((f) => f.endsWith('.png'))) {
		const m = f.match(/^([a-z-]+?)-(\d+)\.png$/);
		if (!m) continue;
		const [, gesture, n] = m;
		(groups[gesture] ??= []).push({ file: `character/${person}/${f}`, n: parseInt(n, 10) });
	}
	for (const g of Object.keys(groups)) groups[g].sort((a, b) => a.n - b.n);
	manifest[person] = Object.fromEntries(Object.entries(groups).map(([g, arr]) => [g, arr.map((x) => x.file)]));
}

const out = `// AUTO-GENERIERT von scripts/scan-poses.mjs — nicht von Hand editieren.
// person → Geste → Liste der verfügbaren Varianten-PNGs (transparent).
export const POSE_VARIANTS: Record<string, Record<string, string[]>> = ${JSON.stringify(manifest, null, 2)};
`;
writeFileSync(join(root, 'src/character/pose-manifest.ts'), out);
for (const [person, groups] of Object.entries(manifest)) {
	const total = Object.values(groups).reduce((s, a) => s + a.length, 0);
	console.log(`${person}: ${Object.keys(groups).length} Gesten, ${total} Bilder`);
}
