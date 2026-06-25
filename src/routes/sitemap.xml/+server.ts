import { getStoryList } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export async function GET() {
	const stories = await getStoryList();

	// Hub/static pages get today's date as lastmod — they reflect the freshest
	// story set (archive, homepage, map all re-render daily), so a current
	// lastmod is honest and nudges Google to re-crawl the crawl entry points.
	const today = new Date().toISOString().slice(0, 10);

	const staticPages = [
		{ loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
		{ loc: `${BASE_URL}/warum`, priority: '0.9', changefreq: 'monthly' },
			{ loc: `${BASE_URL}/werte`, priority: '0.9', changefreq: 'monthly' },
			{ loc: `${BASE_URL}/redaktion`, priority: '0.8', changefreq: 'weekly' },
			{ loc: `${BASE_URL}/unterstuetzer`, priority: '0.4', changefreq: 'weekly' },
			{ loc: `${BASE_URL}/roadmap`, priority: '0.7', changefreq: 'weekly' },
			{ loc: `${BASE_URL}/teilen`, priority: '0.6', changefreq: 'monthly' },
		{ loc: `${BASE_URL}/einreichen`, priority: '0.6', changefreq: 'monthly' },
		{ loc: `${BASE_URL}/methodik`, priority: '0.7', changefreq: 'monthly' },
		{ loc: `${BASE_URL}/datenschutz`, priority: '0.2', changefreq: 'yearly' },
		{ loc: `${BASE_URL}/nutzungsbedingungen`, priority: '0.2', changefreq: 'yearly' },
		{ loc: `${BASE_URL}/stand-der-welt`, priority: '0.8', changefreq: 'monthly' },
		{ loc: `${BASE_URL}/archiv`, priority: '0.8', changefreq: 'daily' },
		...['klima', 'gesundheit', 'wissenschaft', 'gemeinschaft', 'tiere', 'kultur', 'innovation'].map(
			(c) => ({ loc: `${BASE_URL}/archiv/${c}`, priority: '0.7', changefreq: 'daily' })
		),
		{ loc: `${BASE_URL}/karte`, priority: '0.7', changefreq: 'daily' },
		{ loc: `${BASE_URL}/bei-dir`, priority: '0.6', changefreq: 'daily' },
		{ loc: `${BASE_URL}/manifest`, priority: '0.5', changefreq: 'monthly' },
		{ loc: `${BASE_URL}/newsletter`, priority: '0.8', changefreq: 'weekly' },
		{ loc: `${BASE_URL}/preise`, priority: '0.7', changefreq: 'weekly' },
		{ loc: `${BASE_URL}/lokal`, priority: '0.6', changefreq: 'daily' }
	];

	const urls = [
		...staticPages.map((p) => `  <url>
    <loc>${escapeXml(p.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
		...stories.map((s) => `  <url>
    <loc>${escapeXml(`${BASE_URL}/geschichte/${s.slug}`)}</loc>
    <lastmod>${escapeXml(s.publishedAt?.slice(0, 10) || '')}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
