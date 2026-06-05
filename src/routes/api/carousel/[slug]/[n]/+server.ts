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

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const story = await getStoryBySlug(params.slug);
	if (!story) return new Response('Story not found', { status: 404 });

	const n = Math.min(3, Math.max(1, parseInt(params.n, 10) || 1));

	// Slides come from the editorial pipeline. Fallback if not yet scored.
	const slides = story.slides;
	const hook = slides?.hook || story.igHook || story.title;
	const aufloesung = slides?.aufloesung || story.dek || story.title;
	const stille = slides?.stille || 'Manchmal tut so eine Nachricht einfach gut.';

	// Slide 3 needs the image; slides 1+2 don't → skip the fetch for speed.
	const imageUrl = story.image_url || story.imageUrl || '';
	const imageBase64 = n === 3 && imageUrl ? await imageToBase64(imageUrl) : null;

	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const input: CarouselInput = {
		hook,
		aufloesung,
		stille,
		category: story.category || 'gemeinschaft',
		impactScore: story.impactScore ?? null,
		imageBase64,
		logoDataUri
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

	setHeaders({
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
		'CDN-Cache-Control': 'public, max-age=86400'
	});
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
