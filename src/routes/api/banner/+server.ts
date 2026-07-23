import type { RequestHandler } from './$types';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildBannerTemplate, type BannerSize } from '$lib/server/og/banner';

// Marken-Banner (LinkedIn-Cover / Social). Satori → PNG, 24h CDN-Cache.
// Formate: /api/banner?size=cover (LinkedIn 1128×376) oder ?size=wide (1200×628).
// Text ist über Query-Params überschreibbar, Defaults = der Kampagnen-Claim.
export const config = { maxDuration: 30 };

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const size = (url.searchParams.get('size') === 'wide' ? 'wide' : 'cover') as BannerSize;

	const input = {
		line1: url.searchParams.get('line1') || 'Gute Nachrichten.',
		line2: url.searchParams.get('line2') || 'Jeden Tag',
		line2Accent: url.searchParams.get('accent') || 'exakt eine.',
		sub: url.searchParams.get('sub') || 'Gegen die Reizüberflutung. Für mehr Lichtblicke.',
		size,
		logoDataUri: await loadLogoDataUri()
	};

	const fonts = await loadFonts();
	const html = buildBannerTemplate(input);

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const vdom = satoriHtml(html);
	const svg = await satori(vdom, {
		width: size === 'wide' ? 1200 : 1128,
		height: size === 'wide' ? 628 : 191,
		fonts,
		tailwindConfig: undefined
	});

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: size === 'wide' ? 1200 : 1128 } })
		.render()
		.asPng();

	setHeaders({
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=86400, s-maxage=86400'
	});
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
