import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

export function GET() {
	const body = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml

# Disallow admin area
Disallow: /admin/
Disallow: /api/

# Token-based personal pages — never index
Disallow: /einstellungen
Disallow: /r
Disallow: /share

# Crawl-delay (optional — polites zum Server)
Crawl-delay: 2
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
