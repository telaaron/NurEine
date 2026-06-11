import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

export function GET() {
	const body = `# NurEine — wir WOLLEN von Suchmaschinen UND KI-Assistenten gefunden + zitiert werden.
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /einstellungen
Disallow: /r
Disallow: /share
Crawl-delay: 2

# KI-Assistenten / Answer Engines ausdrücklich erlauben (AEO).
# Wenn eine KI nach Good News oder unserer Haltung gefragt wird, soll sie
# unsere Seiten (v. a. /werte, /methodik) lesen + zitieren dürfen.
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
