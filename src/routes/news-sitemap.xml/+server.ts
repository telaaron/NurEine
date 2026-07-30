import { getStoryList } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';
const PUBLICATION_NAME = 'NurEine';
const PUBLICATION_LANG = 'de';

// Google News only considers articles from roughly the last 2 days. Anything
// older must be dropped — a News sitemap listing stale URLs gets the whole feed
// distrusted. We use 48h to be safe against timezone/clock skew.
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export async function GET() {
	let stories: Awaited<ReturnType<typeof getStoryList>>;
	try {
		stories = await getStoryList(); // newest first
	} catch {
		stories = [];
	}

	// DB-Ausfall-Guard (Vorfall 2026-07-20): Bei gesperrtem Supabase (402) liefert
	// getStoryList() [] → eine leere News-Sitemap. Google News verlangt eine
	// nicht-leere Sitemap; eine leere erzeugt genau den "1 error" in der GSC und
	// lässt den ganzen News-Feed misstrauen. 503 + Retry-After hält den letzten
	// guten Stand, statt einen kaputten Feed auszuliefern.
	if (stories.length === 0) {
		return new Response('Story data temporarily unavailable', {
			status: 503,
			headers: {
				'Retry-After': '900',
				'Cache-Control': 'no-store'
			}
		});
	}

	const cutoff = Date.now() - NEWS_WINDOW_MS;

	const recent = stories.filter((s) => {
		const t = Date.parse(s.publishedAt);
		return Number.isFinite(t) && t >= cutoff;
	});

	// Kein Artikel im 48h-Fenster (Pipeline-Stillstand oder ruhiger Tag): lieber
	// den letzten guten Stand halten (503) als einen leeren <urlset> ausliefern,
	// der in der GSC exakt als "1 error" auftaucht und den Feed distrusten lässt.
	if (recent.length === 0) {
		return new Response('No recent articles for the news window', {
			status: 503,
			headers: {
				'Retry-After': '900',
				'Cache-Control': 'no-store'
			}
		});
	}

	const urls = recent
		.map((s) => {
			const loc = `${BASE_URL}/geschichte/${s.slug}`;
			// Google News requires a W3C/ISO-8601 publication date.
			const pubDate = new Date(s.publishedAt).toISOString();
			return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(s.title)}</news:title>
    </news:news>
  </url>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			// Short cache — the news window shifts continuously.
			'Cache-Control': 'public, max-age=900'
		}
	});
}
