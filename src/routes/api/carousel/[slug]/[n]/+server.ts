import type { RequestHandler } from './$types';
import { getStoryBySlug } from '$lib/server/queries';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildCarouselSlide, type CarouselInput } from '$lib/server/og/carousel';

// 4:5 Instagram-Carousel-Folie (1080×1350). CDN-cached. Folie n = 1..3.
export const config = { maxDuration: 60 };

async function imageToBase64(url: string): Promise<string | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!resp.ok) return null;
		const input = Buffer.from(await resp.arrayBuffer());
		const sharp = (await import('sharp')).default;
		const out = await sharp(input)
			.resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
			.jpeg({ quality: 80 })
			.toBuffer();
		return `data:image/jpeg;base64,${out.toString('base64')}`;
	} catch {
		return null;
	}
}

/**
 * Held-Zahl aus Text ziehen (für die Riesen-Zahl-Variante).
 * Bevorzugt Prozent/Mio/Mrd, sonst die erste markante Zahl. Null wenn keine.
 */
function extractHeroNumber(text: string): string | null {
	// −60%, 60 %, 11 Mio, 3,7 Mrd, 603, 1.800
	const pct = text.match(/[−-]?\d[\d.,]*\s?%/);
	if (pct) return pct[0].replace(/\s/g, '');
	const big = text.match(/\d[\d.,]*\s?(Mrd|Mio|Millionen|Milliarden|Tsd)\b/i);
	if (big) return big[0];
	const num = text.match(/\d[\d.,]{2,}/); // mind. 3 Stellen (vermeidet Jahre? nein, ok)
	if (num) return num[0];
	return null;
}

export const GET: RequestHandler = async ({ params, setHeaders, url }) => {
	const story = await getStoryBySlug(params.slug);
	if (!story) return new Response('Story not found', { status: 404 });

	const n = Math.min(3, Math.max(1, parseInt(params.n, 10) || 1));

	// Slides come from the editorial pipeline. Fallback if not yet scored.
	const slides = story.slides;
	const hook = slides?.hook || story.igHook || story.title;
	const aufloesung = slides?.aufloesung || story.dek || story.title;
	const stille = slides?.stille || 'Manchmal tut so eine Nachricht einfach gut.';

	// Folie-1-Stopper-Stil: ?style=image|number|minimal (Default image, A/B-testbar).
	const hookStyle = (url.searchParams.get('style') as 'image' | 'number' | 'minimal' | null) || undefined;
	// Held-Zahl für number-Variante: ?n= überschreibt, sonst aus Titel/dek extrahiert.
	const heroNumber = url.searchParams.get('hero') || extractHeroNumber(`${hook} ${story.dek}`);

	// Folie 1 (image-Stil) + Folie 3 brauchen das Bild. Folie 2 nicht.
	const imageUrl = story.image_url || story.imageUrl || '';
	const needsImage = n === 3 || (n === 1 && hookStyle !== 'number' && hookStyle !== 'minimal');
	const imageBase64 = needsImage && imageUrl ? await imageToBase64(imageUrl) : null;

	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const input: CarouselInput = {
		hook,
		aufloesung,
		stille,
		category: story.category || 'gemeinschaft',
		impactScore: story.impactScore ?? null,
		imageBase64,
		logoDataUri,
		heroNumber,
		hookStyle
	};

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const svg = await satori(satoriHtml(buildCarouselSlide(input, n)), {
		width: 1080,
		height: 1350,
		fonts,
		tailwindConfig: undefined
	});

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();

	// PNG → JPEG: Satori-PNG ist 1.5-2.2 MB → IG-Container-Fetch (~5s Timeout) bricht
	// mit Code 9004 ab. JPEG q85 schrumpft auf ~150 KB → IG lädt es sofort.
	const sharp = (await import('sharp')).default;
	const jpeg = await sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer();

	setHeaders({
		'Content-Type': 'image/jpeg',
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
		'CDN-Cache-Control': 'public, max-age=86400'
	});
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
