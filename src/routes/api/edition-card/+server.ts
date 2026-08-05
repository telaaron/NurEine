import type { RequestHandler } from './$types';
import { getLocalMarkers } from '$lib/server/queries';
import { loadFonts, loadLogoDataUri } from '$lib/server/og/fonts';
import { buildEditionCard, type EditionStory } from '$lib/server/og/edition-card';
import {
	haversineDistance,
	isDefaultCoord,
	formatDistance
} from '$lib/geo';
import { hasRealPlace, placeLine, placeDetail, newspaperName, issueNumber, issueDate } from '$lib/place';

/**
 * Die persönliche Titelseite als Bild — „Meine Ausgabe für <Ort>".
 *
 *   /api/edition-card?ort=Teltow&lat=52.39&lng=13.26
 *
 * Rangfolge und Aufmacher entstehen hier NOCH EINMAL server-seitig, statt sie
 * vom Client zu übernehmen: das Bild wird von WhatsApp/Instagram abgerufen,
 * nicht vom Browser des Nutzers — der Client kann also gar nichts mitgeben.
 * Die Logik liegt darum in $lib/geo und $lib/place, die sich beide Seiten
 * teilen.
 *
 * Ohne Story-Bilder (siehe edition-card.ts) — das hält den Render bei ~2 s und
 * zieht nichts aus dem Storage-Bucket.
 */
export const config = { maxDuration: 60 };

/** Wie viele Meldungen unter dem Aufmacher stehen. Zwei Spalten à 3. */
const COLUMN_STORIES = 6;

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const ort = (url.searchParams.get('ort') || '').trim();
	const latRaw = url.searchParams.get('lat');
	const lngRaw = url.searchParams.get('lng');
	const lat = Number(latRaw);
	const lng = Number(lngRaw);

	// Auf die Rohwerte prüfen, nicht nur auf isFinite: Number('') und Number(null)
	// sind 0 — ohne diese Prüfung liefe eine Anfrage ohne Koordinaten stillschweigend
	// auf 0/0 (Golf von Guinea) und ergäbe eine sinnlose Ausgabe statt eines Fehlers.
	if (!ort || !latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng)) {
		return new Response('ort, lat und lng sind erforderlich', { status: 400 });
	}
	if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
		return new Response('lat/lng außerhalb des gültigen Bereichs', { status: 400 });
	}

	const markers = await getLocalMarkers();

	// Gleiche Rangfolge wie auf /bei-dir: nach echter Entfernung, Stories ohne
	// brauchbare Koordinate fallen raus.
	const ranked = markers
		.filter((s) => s.coordsX && s.coordsY && !isDefaultCoord(s.coordsX, s.coordsY))
		.map((s) => ({ s, km: haversineDistance(lat, lng, s.coordsX, s.coordsY) }))
		.sort((a, b) => a.km - b.km);

	if (ranked.length === 0) {
		return new Response('Keine verorteten Geschichten', { status: 404 });
	}

	const toEdition = (m: (typeof ranked)[number]): EditionStory => ({
		title: m.s.title,
		dek: m.s.dek,
		category: m.s.category,
		place: placeLine(m.s),
		placeDetail: placeDetail(m.s),
		localPlace: hasRealPlace(m.s),
		distance: formatDistance(m.km),
		impactScore: m.s.impactScore
	});

	// Aufmacher: die nächste Meldung mit ECHTEM Ort — eine Titelseite lebt
	// davon, dass oben ein Ort steht, den man kennt. Sonst die nächste überhaupt.
	const leadIdx = ranked.findIndex((m) => hasRealPlace(m.s));
	const lead = toEdition(ranked[leadIdx >= 0 ? leadIdx : 0]);
	const rest = ranked
		.filter((_, i) => i !== (leadIdx >= 0 ? leadIdx : 0))
		.slice(0, COLUMN_STORIES)
		.map(toEdition);

	const now = new Date();
	const [fonts, logoDataUri] = await Promise.all([loadFonts(), loadLogoDataUri()]);

	const html = buildEditionCard({
		masthead: newspaperName(ort),
		issueLine: `${issueDate(now)} · Ausgabe Nr. ${issueNumber(now)}`,
		lead,
		stories: rest,
		count: ranked.length,
		nearest: formatDistance(ranked[0].km),
		logoDataUri
	});

	const satori = (await import('satori')).default;
	const { html: satoriHtml } = await import('satori-html');
	const svg = await satori(satoriHtml(html), { width: 1080, height: 1350, fonts });

	const { Resvg } = await import('@resvg/resvg-js');
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();
	const sharp = (await import('sharp')).default;
	const jpeg = await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer();

	// Kein Bucket-Cache wie bei /api/share-card: dort gibt es einen festen Key
	// pro Story, hier hätte jeder Ort seinen eigenen — das wäre unbegrenzt.
	// Der Inhalt ändert sich ohnehin täglich; das CDN übernimmt den Rest.
	setHeaders({
		'Content-Type': 'image/jpeg',
		'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400',
		'CDN-Cache-Control': 'public, max-age=21600'
	});
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
