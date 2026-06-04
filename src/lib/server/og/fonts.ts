import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Load TTF fonts for Satori OG image rendering.
 * Fonts are bundled in src/lib/server/fonts/ and included in the deployment.
 *
 * Families:
 *   - Space Grotesk  → OG headline (matches site display font)
 *   - Newsreader     → OG dek (serif italic, matches site body font)
 *   - Inter          → meta / category pill / brand line
 */
export interface SatoriFont {
	name: string;
	data: ArrayBuffer;
	weight: 400 | 500 | 600 | 700;
	style: 'normal' | 'italic';
}

let _fonts: SatoriFont[] | null = null;
let _logo: string | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** NurEine water-drop logo as a base64 SVG data-URI (cached). */
export async function loadLogoDataUri(): Promise<string> {
	if (_logo) return _logo;
	const svg = await readFile(join(process.cwd(), 'static/NurEine.svg'), 'utf-8');
	_logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
	return _logo;
}

export async function loadFonts(): Promise<SatoriFont[]> {
	if (_fonts) return _fonts;

	const fontDir = join(process.cwd(), 'src/lib/server/fonts');

	// NOTE: Satori's opentype parser cannot read variable fonts — use static instances only.
	const spec: { file: string; name: string; weight: SatoriFont['weight']; style: SatoriFont['style'] }[] = [
		// Display — Space Grotesk (static)
		{ file: 'SpaceGrotesk-Medium.ttf', name: 'Space Grotesk', weight: 500, style: 'normal' },
		{ file: 'SpaceGrotesk-Bold.ttf', name: 'Space Grotesk', weight: 700, style: 'normal' },
		// Serif dek — Newsreader (static)
		{ file: 'Newsreader-Italic.ttf', name: 'Newsreader', weight: 400, style: 'italic' },
		{ file: 'Newsreader-Medium.ttf', name: 'Newsreader', weight: 500, style: 'normal' },
		// UI / meta — Inter
		{ file: 'Inter-Regular.ttf', name: 'Inter', weight: 400, style: 'normal' },
		{ file: 'Inter-SemiBold.ttf', name: 'Inter', weight: 600, style: 'normal' },
		{ file: 'Inter-Bold.ttf', name: 'Inter', weight: 700, style: 'normal' }
	];

	const fonts: SatoriFont[] = [];
	for (const { file, name, weight, style } of spec) {
		const data = await readFile(join(fontDir, file));
		fonts.push({ name, data: toArrayBuffer(data), weight, style });
	}

	_fonts = fonts;
	return fonts;
}
