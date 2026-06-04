import { getStoryBySlug } from '$lib/server/queries';
import type { RequestHandler } from './$types';

// OG render (Satori + resvg) can take a few seconds cold; give Vercel headroom.
// Result is CDN-cached 24h so only the first request per story pays this.
export const config = { maxDuration: 30 };
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildOgTemplate } from '$lib/server/og/template';

/**
 * OG Image API endpoint — generates editorial story OG images via Satori.
 *
 * Uses Satori (Vercel's HTML/CSS → SVG renderer) for full CSS control,
 * then rasterizes to PNG via @resvg/resvg-js.
 *
 * Dimensions: 1200×630 (1.91:1) — optimal for WhatsApp, iMessage, Twitter, FB.
 *
 * Layout: "Editorial Spread" — story image framed on the left,
 * headline + category on the right, subtitle below, brand bar at bottom.
 *
 * Caching: 24h CDN cache. Vercel edge cache handles repeat requests.
 */

/** Download and convert a remote image to base64 data URI */
async function imageToBase64DataUri(url: string): Promise<string | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
		if (!resp.ok) return null;
		const buf = await resp.arrayBuffer();
		const b64 = Buffer.from(buf).toString('base64');
		const contentType = resp.headers.get('content-type') || 'image/png';
		return `data:${contentType};base64,${b64}`;
	} catch {
		return null;
	}
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const slug = params.slug;

	// --- 1) Look up the story ---
	const story = await getStoryBySlug(slug);
	if (!story) {
		return new Response('Story not found', { status: 404 });
	}

	// --- 2) Download story image, convert to base64 ---
	const imageUrl = story.image_url || story.imageUrl || '';
	let imageBase64: string | null = null;
	if (imageUrl) {
		imageBase64 = await imageToBase64DataUri(imageUrl);
	}

	// --- 3) Load fonts + logo for Satori ---
	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	// --- 4) Build the HTML template ---
	const html = buildOgTemplate({
		title: story.title || '',
		dek: story.dek || '',
		category: story.category || 'gemeinschaft',
		country: story.country || '',
		code: story.region || '',
		imageBase64,
		logoDataUri
	});

	// --- 5) Render HTML → SVG via Satori ---
	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');

	const vdom = satoriHtml(html);
	const svg = await satori(vdom, {
		width: 1200,
		height: 630,
		fonts,
		tailwindConfig: undefined
	});

	// --- 6) Render SVG → PNG ---
	const { Resvg } = await import('@resvg/resvg-js');
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: 1200 }
	});
	const pngData = resvg.render();
	const pngBuffer = new Uint8Array(pngData.asPng());

	// --- 7) Return with long-lived cache ---
	setHeaders({
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
		'CDN-Cache-Control': 'public, max-age=86400'
	});

	return new Response(pngBuffer, {
		headers: { 'Content-Type': 'image/png' }
	});
};
