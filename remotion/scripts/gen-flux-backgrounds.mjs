#!/usr/bin/env node
/**
 * Generiert 4 abstrakte 9:16-Paper-Collage-Hintergründe via FLUX.1 [pro] (fal.ai)
 * als Vergleichsvarianten zu den prozeduralen Code-Hintergründen.
 * Speichert nach public/backgrounds/flux/. KEY aus dem Vault (~/.claude/secrets/keys.env).
 *
 * Bewusst: KEINE Menschen/Gesichter/Marken (rechtlich), reine abstrakte Textur/Form.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function loadFalKey() {
	const env = readFileSync(join(homedir(), '.claude/secrets/keys.env'), 'utf8');
	const m = env.match(/^FAL_AI_API_KEY=(.+)$/m) || env.match(/^FAL_KEY=(.+)$/m);
	if (!m) throw new Error('FAL key nicht im Vault gefunden');
	return m[1].trim().replace(/^["']|["']$/g, '');
}

const KEY = loadFalKey();
const OUT = join(process.cwd(), 'public/backgrounds/flux');
mkdirSync(OUT, { recursive: true });

// Vier Varianten — warm/hell (für dunklen Text) und dunkel (für hellen Text),
// alle im „Warm paper collage editorial illustration"-Marken-Stil, abstrakt.
const VARIANTS = [
	{
		name: 'warm-light',
		prompt:
			'Warm paper collage editorial illustration, abstract soft layered paper shapes in cream, sand and warm off-white tones, subtle amber accents, gentle organic curves, lots of empty space, calm minimal texture, no text, no people, no faces, no logos, tactile handmade paper grain, soft studio light, vertical composition'
	},
	{
		name: 'amber-deep',
		prompt:
			'Warm paper collage editorial illustration, abstract layered paper shapes in deep amber, terracotta and warm brown gradient, subtle darker vignette toward edges, organic torn-paper curves, calm sophisticated mood, no text, no people, no faces, no logos, tactile paper grain, vertical composition'
	},
	{
		name: 'sage-calm',
		prompt:
			'Warm paper collage editorial illustration, abstract layered paper shapes in muted sage green and warm cream, soft organic hills and curves, gentle depth, calm hopeful mood, no text, no people, no faces, no logos, tactile handmade paper grain, soft light, vertical composition'
	},
	{
		name: 'sky-quiet',
		prompt:
			'Warm paper collage editorial illustration, abstract layered paper shapes in muted dusty blue and warm cream, soft overlapping curves suggesting horizon and calm, gentle depth, quiet reflective mood, no text, no people, no faces, no logos, tactile paper grain, vertical composition'
	}
];

async function genOne(v) {
	const resp = await fetch('https://fal.run/fal-ai/flux-pro', {
		method: 'POST',
		headers: { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			prompt: v.prompt,
			image_size: 'portrait_16_9', // 9:16
			num_images: 1,
			enable_safety_checker: false
		})
	});
	if (!resp.ok) throw new Error(`${v.name}: fal ${resp.status} ${(await resp.text()).slice(0, 160)}`);
	const data = await resp.json();
	const url = data.images?.[0]?.url;
	if (!url) throw new Error(`${v.name}: keine Bild-URL`);
	const img = Buffer.from(await (await fetch(url)).arrayBuffer());
	const path = join(OUT, `${v.name}.png`);
	writeFileSync(path, img);
	console.log(`OK ${v.name} → ${path} (${Math.round(img.length / 1024)} KB)`);
}

const results = await Promise.allSettled(VARIANTS.map(genOne));
const ok = results.filter((r) => r.status === 'fulfilled').length;
console.log(`\nFertig: ${ok}/${VARIANTS.length} Hintergründe generiert.`);
results.filter((r) => r.status === 'rejected').forEach((r) => console.error('FEHLER:', r.reason.message));
process.exit(ok > 0 ? 0 : 1);
