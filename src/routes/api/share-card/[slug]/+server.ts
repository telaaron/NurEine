import type { RequestHandler } from './$types';
import { getStoryBySlug } from '$lib/server/queries';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildStoryCard, asTemplateName } from '$lib/server/og/story-card';

// 9:16 social card (1080×1920) for WhatsApp status / IG story. CDN-cached.
// Bigger canvas than OG → give resvg/image-fetch more headroom on Vercel.
export const config = { maxDuration: 60 };

// Downscale + recompress before embedding — Satori rasterizes the embedded
// image on every render; a full-size PNG makes that take ~70 s. A 1080 px JPEG
// keeps the whole card render at a few seconds. (See /api/og for the same fix.)
// Returns the base64 JPEG plus its real aspect ratio (height / width) so the
// card can render the image full-width at its NATURAL height (no square crop).
async function imageToBase64(
	url: string
): Promise<{ data: string; aspect: number } | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!resp.ok) return null;
		const input = Buffer.from(await resp.arrayBuffer());
		const sharp = (await import('sharp')).default;
		// 860px @ q72 statt 1080 @ q80: das Bild ist nur Cover/Hintergrund der Card,
		// die kleinere base64-Nutzlast beschleunigt den Satori-Parse spürbar
		// (Render-Zeit ist der Engpass, der Stories ausbremste).
		const out = await sharp(input)
			.resize({ width: 860, height: 860, fit: 'inside', withoutEnlargement: true })
			.jpeg({ quality: 72, mozjpeg: true })
			.toBuffer();
		const meta = await sharp(out).metadata();
		const aspect = meta.width && meta.height ? meta.height / meta.width : 1;
		return { data: `data:image/jpeg;base64,${out.toString('base64')}`, aspect };
	} catch {
		return null;
	}
}

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	const story = await getStoryBySlug(params.slug);
	if (!story) return new Response('Story not found', { status: 404 });

	const imageUrl = story.image_url || story.imageUrl || '';
	const img = imageUrl ? await imageToBase64(imageUrl) : null;
	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const html = buildStoryCard({
		title: story.title || '',
		dek: story.dek || '',
		category: story.category || 'gemeinschaft',
		country: story.country || '',
		impactScore: story.impactScore ?? null,
		emotion: story.emotion ?? null,
		imageBase64: img?.data ?? null,
		imageAspect: img?.aspect ?? null,
		logoDataUri,
		id: story.id,
		template: asTemplateName(url.searchParams.get('tpl'))
	});

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const svg = await satori(satoriHtml(html), { width: 1080, height: 1920, fonts, tailwindConfig: undefined });

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();
	const sharp = (await import('sharp')).default;
	const jpeg = await sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer();

	setHeaders({
		'Content-Type': 'image/jpeg',
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
		'CDN-Cache-Control': 'public, max-age=86400'
	});
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
