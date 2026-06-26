import { read } from '$app/server';
import SpaceGroteskMedium from '$lib/server/fonts/SpaceGrotesk-Medium.ttf?url';
import SpaceGroteskBold from '$lib/server/fonts/SpaceGrotesk-Bold.ttf?url';
import NewsreaderItalic from '$lib/server/fonts/Newsreader-Italic.ttf?url';
import NewsreaderMedium from '$lib/server/fonts/Newsreader-Medium.ttf?url';
import InterRegular from '$lib/server/fonts/Inter-Regular.ttf?url';
import InterSemiBold from '$lib/server/fonts/Inter-SemiBold.ttf?url';
import InterBold from '$lib/server/fonts/Inter-Bold.ttf?url';
import LogoPng from '$lib/server/og/NurEine-mark.png?url';

/**
 * Load TTF fonts for Satori OG image rendering.
 *
 * Assets are imported via Vite `?url` and read with SvelteKit's `read()` so
 * they are bundled into the serverless function. `readFile(process.cwd()/src/...)`
 * does NOT work on Vercel — `src/` is not in the deployed function bundle, so it
 * threw ENOENT (500) in production while working in dev. `read()` is the
 * canonical, adapter-agnostic way to access bundled assets at runtime.
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

/** NurEine lighthouse logo as a base64 PNG data-URI (cached). */
export async function loadLogoDataUri(): Promise<string> {
	if (_logo) return _logo;
	const buf = Buffer.from(await read(LogoPng).arrayBuffer());
	_logo = `data:image/png;base64,${buf.toString('base64')}`;
	return _logo;
}

export async function loadFonts(): Promise<SatoriFont[]> {
	if (_fonts) return _fonts;

	// NOTE: Satori's opentype parser cannot read variable fonts — use static instances only.
	const spec: { url: string; name: string; weight: SatoriFont['weight']; style: SatoriFont['style'] }[] = [
		{ url: SpaceGroteskMedium, name: 'Space Grotesk', weight: 500, style: 'normal' },
		{ url: SpaceGroteskBold, name: 'Space Grotesk', weight: 700, style: 'normal' },
		{ url: NewsreaderItalic, name: 'Newsreader', weight: 400, style: 'italic' },
		{ url: NewsreaderMedium, name: 'Newsreader', weight: 500, style: 'normal' },
		{ url: InterRegular, name: 'Inter', weight: 400, style: 'normal' },
		{ url: InterSemiBold, name: 'Inter', weight: 600, style: 'normal' },
		{ url: InterBold, name: 'Inter', weight: 700, style: 'normal' }
	];

	const fonts: SatoriFont[] = [];
	for (const { url, name, weight, style } of spec) {
		const data = await read(url).arrayBuffer();
		fonts.push({ name, data, weight, style });
	}

	_fonts = fonts;
	return fonts;
}
