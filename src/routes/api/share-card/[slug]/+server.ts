import type { RequestHandler } from './$types';
import { getStoryBySlug } from '$lib/server/queries';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildStoryCard } from '$lib/server/og/story-card';

// 9:16 social card (1080×1920) for WhatsApp status / IG story. CDN-cached.
// Bigger canvas than OG → give resvg/image-fetch more headroom on Vercel.
export const config = { maxDuration: 60 };

async function imageToBase64(url: string): Promise<string | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
		if (!resp.ok) return null;
		const buf = await resp.arrayBuffer();
		const ct = resp.headers.get('content-type') || 'image/png';
		return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`;
	} catch {
		return null;
	}
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const story = await getStoryBySlug(params.slug);
	if (!story) return new Response('Story not found', { status: 404 });

	const imageUrl = story.image_url || story.imageUrl || '';
	const imageBase64 = imageUrl ? await imageToBase64(imageUrl) : null;
	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const html = buildStoryCard({
		title: story.title || '',
		dek: story.dek || '',
		category: story.category || 'gemeinschaft',
		country: story.country || '',
		impactScore: story.impactScore ?? null,
		imageBase64,
		logoDataUri
	});

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const svg = await satori(satoriHtml(html), { width: 1080, height: 1920, fonts, tailwindConfig: undefined });

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();

	setHeaders({
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
		'CDN-Cache-Control': 'public, max-age=86400'
	});
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
