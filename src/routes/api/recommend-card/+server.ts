import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildRecommendCard } from '$lib/server/og/recommend-card';

// 9:16 Empfehlungs-Karte (Hybrid: NurEine + Beispiel-Story). Für /teilen.
// Query: ?audience=allgemein|60plus|familie|skeptiker|klima  &ref=CODE  &slug=…(optional)
export const config = { maxDuration: 60 };

// Zielgruppen-Taglines: stellen NurEine im passenden Ton vor.
const TAGLINES: Record<string, string> = {
	allgemein: 'Schluss mit schlechten Nachrichten. Eine gute pro Tag — geprüft, werbefrei.',
	'60plus': 'Endlich mal eine gute Nachricht. Jeden Tag eine — verlässlich und ohne Stress.',
	familie: 'Gute Nachrichten zum Vorlesen und Weiterreden — auch für Kinder erklärt.',
	skeptiker: 'Keine rosa Brille — gute Nachrichten mit Quelle, Zahl und Wirkungsindex.',
	klima: 'Die Welt wird an vielen Stellen besser. Hier siehst du, wo — jeden Tag.'
};

// Welche Story-Kategorie passt zur Zielgruppe (für das Beispiel).
const AUDIENCE_CATEGORY: Record<string, string | null> = {
	allgemein: null, '60plus': 'gesundheit', familie: 'gemeinschaft', skeptiker: null, klima: 'klima'
};

async function imageToBase64(url: string): Promise<string | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!resp.ok) return null;
		const input = Buffer.from(await resp.arrayBuffer());
		const sharp = (await import('sharp')).default;
		const out = await sharp(input).resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
		return `data:image/jpeg;base64,${out.toString('base64')}`;
	} catch {
		return null;
	}
}

function slugify(t: string, id: string): string {
	return t.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) + '-' + id.slice(0, 8);
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const audience = url.searchParams.get('audience') || 'allgemein';
	const ref = (url.searchParams.get('ref') || '').replace(/[^a-z0-9]/gi, '').slice(0, 16);
	const explicitSlug = url.searchParams.get('slug');

	const tagline = TAGLINES[audience] || TAGLINES.allgemein;
	const cat = AUDIENCE_CATEGORY[audience] ?? null;

	// Beispiel-Story: stärkste frische passende Story (oder explizit gewählte).
	type Story = { id: string; title: string; subtitle: string | null; category: string; image_url: string | null; impact_score: number };
	let story: Story | null = null;
	if (explicitSlug) {
		const { data } = await supabaseAdmin.from('nureine_stories').select('id,title,subtitle,category,image_url,impact_score').limit(200);
		story = ((data as Story[]) ?? []).find((s) => slugify(s.title, s.id) === explicitSlug) ?? null;
	}
	if (!story) {
		let q = supabaseAdmin.from('nureine_stories').select('id,title,subtitle,category,image_url,impact_score').gte('impact_score', 70).not('image_url', 'is', null).order('impact_score', { ascending: false }).limit(20);
		if (cat) q = q.eq('category', cat);
		const { data } = await q;
		const list = (data as Story[]) ?? [];
		story = list[Math.floor(Math.random() * Math.min(list.length, 8))] || list[0] || null;
	}
	if (!story) return new Response('no story', { status: 404 });

	const linkLabel = ref ? `nureine.de/?ref=${ref}` : 'nureine.de';
	const imageBase64 = story.image_url ? await imageToBase64(story.image_url) : null;
	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const html = buildRecommendCard({
		tagline,
		storyTitle: story.title,
		storySubtitle: story.subtitle,
		impactScore: story.impact_score,
		category: story.category,
		imageBase64,
		logoDataUri,
		linkLabel
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
		'Cache-Control': 'public, max-age=3600, s-maxage=3600'
	});
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
