import type { RequestHandler } from './$types';
import { getStoryBySlug } from '$lib/server/queries';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import {
	buildReelFrame,
	reelTypeForHook,
	type ReelFrame,
	type ReelFrameInput,
	type ReelType
} from '$lib/server/og/reel-frames';

// 9:16 Reel-Standbild (1080×1920). Die Bewegung legt ffmpeg darüber
// (scripts/render_reel.py). frame ∈ hook|aufloesung|endcard.
export const config = { maxDuration: 60 };

const VALID_FRAMES: ReelFrame[] = ['hook', 'aufloesung', 'endcard'];

async function imageToBase64(url: string): Promise<string | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!resp.ok) return null;
		const buf = Buffer.from(await resp.arrayBuffer());
		const sharp = (await import('sharp')).default;
		// Typ B: Bild BEWUSST stilisieren (ehrlich-künstlich statt Pseudo-Foto) —
		// leichte Sättigung + warme Tönung, damit es als Illustration liest.
		const out = await sharp(buf)
			.resize({ width: 1080, height: 1920, fit: 'cover' })
			.modulate({ saturation: 1.18, brightness: 1.02 })
			.tint({ r: 255, g: 246, b: 232 })
			.jpeg({ quality: 82 })
			.toBuffer();
		return `data:image/jpeg;base64,${out.toString('base64')}`;
	} catch {
		return null;
	}
}

/** Held-Zahl + Einheit (Wort danach) aus Titel/Auflösung ziehen (Typ C). */
function extractHeroNumberWithUnit(text: string): { num: string | null; unit: string | null } {
	const m = text.match(/([−-]?\d[\d.,]*\s?(?:%|Mrd|Mio|Millionen|Milliarden|Tsd)?)\s+([A-Za-zÄÖÜäöüß]+)/);
	if (m) return { num: m[1].replace(/\s+/g, ' ').trim(), unit: m[2] };
	const pct = text.match(/[−-]?\d[\d.,]*\s?%/);
	if (pct) return { num: pct[0].replace(/\s/g, ''), unit: null };
	const big = text.match(/\d[\d.,]*\s?(Mrd|Mio|Millionen|Milliarden|Tsd)\b/i);
	if (big) return { num: big[0], unit: null };
	const num = text.match(/\d[\d.,]{2,}/);
	if (num) return { num: num[0], unit: null };
	return { num: null, unit: null };
}

export const GET: RequestHandler = async ({ params, setHeaders, url }) => {
	const story = await getStoryBySlug(params.slug);
	if (!story) return new Response('Story not found', { status: 404 });

	const frame: ReelFrame = (VALID_FRAMES as string[]).includes(params.frame)
		? (params.frame as ReelFrame)
		: 'hook';

	const slides = story.slides;
	const hook = slides?.hook || story.igHook || story.title;
	const aufloesung = slides?.aufloesung || story.dek || story.summary || story.title;
	const shareHook = story.shareHook || slides?.stille || '';

	const { num, unit } = extractHeroNumberWithUnit(`${story.title} ${hook} ${aufloesung}`);

	// Typ aus Hook-Typ ableiten; ?type= überschreibt (für die Preview).
	// WICHTIG: Typ C braucht eine echte Zahl — fehlt sie, auf Typ A zurückfallen
	// (sonst leerer farbiger Frame ohne Held). So nie ein "Zahl-Reel" ohne Zahl.
	const typeOverride = url.searchParams.get('type') as ReelType | null;
	let type: ReelType =
		typeOverride && ['A', 'B', 'C'].includes(typeOverride)
			? typeOverride
			: reelTypeForHook(story.igHookType);
	if (type === 'C' && !num) type = 'A';

	// Ortsstempel: lesbarer Regionsname; 2-Buchstaben-Codes (NP) → weglassen,
	// die erden nicht, sie verwirren. Lieber ganzer Name oder nichts.
	const rawPlace = story.region || story.country || null;
	const placeStamp = rawPlace && rawPlace.length > 3 ? rawPlace : null;

	// Bild nur für Typ B (Hook-Frame) laden.
	const needsImage = type === 'B' && (frame === 'hook' || frame === 'aufloesung');
	const imageUrl = story.image_url || story.imageUrl || '';
	const imageBase64 = needsImage && imageUrl ? await imageToBase64(imageUrl) : null;

	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const input: ReelFrameInput = {
		hook,
		aufloesung,
		shareHook,
		category: story.category || 'gemeinschaft',
		heroNumber: num,
		heroUnit: unit,
		placeStamp,
		imageBase64,
		logoDataUri
	};

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const svg = await satori(satoriHtml(buildReelFrame(type, frame, input)), {
		width: 1080,
		height: 1920,
		fonts,
		tailwindConfig: undefined
	});

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();

	setHeaders({
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
	});
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
