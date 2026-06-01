import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Load TTF fonts for Satori OG image rendering.
 * Fonts are bundled in src/lib/server/fonts/ and included in the deployment.
 */
export interface SatoriFont {
	name: string;
	data: ArrayBuffer;
	weight: 400 | 600 | 700;
	style: 'normal' | 'italic';
}

let _fonts: SatoriFont[] | null = null;

export async function loadFonts(): Promise<SatoriFont[]> {
	if (_fonts) return _fonts;

	const fontDir = join(process.cwd(), 'src/lib/server/fonts');

	const fontFiles = [
		{ file: 'Inter-Regular.ttf', weight: 400 as const },
		{ file: 'Inter-SemiBold.ttf', weight: 600 as const },
		{ file: 'Inter-Bold.ttf', weight: 700 as const }
	];

	const fonts: SatoriFont[] = [];
	for (const { file, weight } of fontFiles) {
		const data = await readFile(join(fontDir, file));
		fonts.push({
			name: 'Inter',
			data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
			weight,
			style: 'normal'
		});
	}

	_fonts = fonts;
	return fonts;
}
