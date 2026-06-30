import type { RequestHandler } from './$types';
import { selectWeeklyDigestStories } from '$lib/server/queries';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildDigestSlide, digestSlideCount, type DigestInput, type DigestStory } from '$lib/server/og/digest';

/** Story-Bild als JPEG-base64 (für Bild-oben-Layout der Digest-Folien). */
async function imageToBase64(url: string): Promise<string | null> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!resp.ok) return null;
		const buf = Buffer.from(await resp.arrayBuffer());
		const sharp = (await import('sharp')).default;
		const out = await sharp(buf)
			.resize({ width: 1080, height: 800, fit: 'cover' })
			.jpeg({ quality: 78 })
			.toBuffer();
		return `data:image/jpeg;base64,${out.toString('base64')}`;
	} catch {
		return null;
	}
}

// Wochen-Digest-Folie (Idee #10). 4:5 (1080×1350). Eigener Endpoint, damit das
// 3-Folien-Limit des Carousel-Endpoints umgangen wird (Digest hat N+2 Folien).
export const config = { maxDuration: 60 };

function evidenceLabel(score: number | null): string {
	const s = score ?? 60;
	if (s >= 90) return 'Peer-reviewed';
	if (s >= 70) return 'Belegt';
	if (s >= 50) return 'Solide Quelle';
	return 'Erste Hinweise';
}

function shorten(text: string, max = 150): string {
	const t = text.trim();
	if (t.length <= max) return t;
	const cut = t.slice(0, max);
	const lastDot = cut.lastIndexOf('. ');
	if (lastDot > 60) return cut.slice(0, lastDot + 1);
	return cut.replace(/\s+\S*$/, '') + ' …';
}

/** Wochenlabel "23.–29. Juni" aus dem aktuellen Datum (letzte 7 Tage). */
function weekLabel(): string {
	const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	const end = new Date();
	const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
	const sameMonth = start.getMonth() === end.getMonth();
	if (sameMonth) return `${start.getDate()}.–${end.getDate()}. ${months[end.getMonth()]}`;
	return `${start.getDate()}. ${months[start.getMonth()]} – ${end.getDate()}. ${months[end.getMonth()]}`;
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const n = Math.max(1, parseInt(params.n, 10) || 1);

	const stories = await selectWeeklyDigestStories(5);
	if (stories.length === 0) return new Response('Keine Stories für den Digest', { status: 404 });

	// n auf gültigen Bereich klemmen (1..N+2).
	const total = digestSlideCount(stories.length);
	const slideN = Math.min(total, n);

	// Bilder nur für die Folie laden, die sie braucht (schnell): Cover (n=1) →
	// die ersten 3 Story-Bilder als Thumbnails; Story-Folie (n=2..N+1) → ihr eigenes.
	const storyIdxForSlide = slideN - 2; // 0-basiert, -1 für Cover/Endcard
	const imageUrls = stories.map((s) => s.image_url || s.imageUrl || '');
	const imagesB64 = await Promise.all(
		stories.map(async (s, i) => {
			const wantThumb = slideN === 1 && i < 3;
			const wantOwn = i === storyIdxForSlide;
			return (wantThumb || wantOwn) && imageUrls[i] ? imageToBase64(imageUrls[i]) : null;
		})
	);

	const digestStories: DigestStory[] = stories.map((s, i) => ({
		title: s.title,
		oneLiner: shorten(s.slides?.aufloesung || s.dek || s.summary || ''),
		sourceName: s.source ?? null,
		category: s.category || 'gemeinschaft',
		evidenceLabel: evidenceLabel(s.impactEvidence),
		imageBase64: imagesB64[i]
	}));

	// Schickbare Endcard-Zeile aus der stärksten Story, falls vorhanden.
	const shareLine = stories[0]?.shareHook ?? null;

	const input: DigestInput = {
		stories: digestStories,
		weekLabel: weekLabel(),
		shareLine
	};

	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);
	input.logoDataUri = logoDataUri;

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const svg = await satori(satoriHtml(buildDigestSlide(input, slideN)), {
		width: 1080,
		height: 1350,
		fonts,
		tailwindConfig: undefined
	});

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();

	const sharp = (await import('sharp')).default;
	const jpeg = await sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer();

	setHeaders({
		'Content-Type': 'image/jpeg',
		// Kürzer cachen als Story-Cards: der Digest ändert sich wöchentlich.
		'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
		'CDN-Cache-Control': 'public, max-age=3600'
	});
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
