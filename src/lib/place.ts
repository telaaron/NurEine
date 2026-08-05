/**
 * Wie ein Ort auf einer Karte/Meldung benannt wird.
 *
 * Regel: Ein Ort wird NUR gezeigt, wenn die Story wirklich dort spielt
 * (siehe scripts/resolve_places.py). Überregionale Meldungen — bundesweite
 * Gesetze, Studien, Weltzahlen — bekommen bewusst keinen Ort. Lieber die
 * Herkunftsangabe weglassen als einen Ort behaupten, den es so nicht gibt.
 */

export interface PlaceLike {
	placeName?: string;
	placeContext?: string;
	placeScope?: string;
	country?: string;
}

/** Hat die Story einen echten, lokal verorteten Schauplatz? */
export function hasRealPlace(s: PlaceLike): boolean {
	return !!s.placeName && s.placeScope !== 'none';
}

/**
 * Die Ortsmarke, wie sie in einer Zeitung über der Meldung steht.
 * Ohne echten Ort fällt sie auf das Land zurück — das ist ehrlich und
 * behauptet keine Nähe.
 */
export function placeLine(s: PlaceLike): string {
	if (hasRealPlace(s)) return s.placeName as string;
	return s.country || '';
}

/**
 * Zusatz für Ortsfremde: "Lankwitz · Berlin-Steglitz". Nur wenn der Kontext
 * wirklich etwas hinzufügt und nicht bloß den Namen wiederholt.
 */
export function placeDetail(s: PlaceLike): string {
	if (!hasRealPlace(s)) return '';
	const name = (s.placeName ?? '').trim();
	let ctx = (s.placeContext ?? '').trim().replace(/^,|,$/g, '').trim();
	if (!ctx) return '';

	// Letzte Verteidigungslinie gegen durchgerutschte Adressketten. Der
	// Resolver räumt das schon auf (scripts/resolve_places.py::clean_context),
	// aber die Ortszeile darf unter keinen Umständen zur Adresse werden.
	if (ctx.toLowerCase().startsWith(name.toLowerCase() + ',')) {
		ctx = ctx.slice(name.length + 1).trim();
	}
	if (ctx.split(',').length > 2) ctx = ctx.split(',')[0].trim();
	// "Lankwitz" + "Berlin-Lankwitz" -> "Berlin"
	if (ctx.toLowerCase().endsWith('-' + name.toLowerCase())) {
		ctx = ctx.slice(0, -(name.length + 1)).trim();
	}

	if (!ctx || ctx.toLowerCase() === name.toLowerCase()) return '';
	if (ctx.length > 40) return '';
	return ctx;
}

/**
 * Ortsadjektive, die keiner Regel folgen. Deutsche Einwohnerbezeichnungen sind
 * nicht ableitbar: Essen → Essener, aber Bremen → Bremer; Dresden → Dresdner,
 * aber Emden → Emder. Jede Heuristik produziert hier irgendwann Unsinn
 * („ESSER LICHTBLICK"), darum stehen die Ausnahmen ausgeschrieben.
 * Ergänzen, wenn ein falsch gebeugter Ort auffällt.
 */
const IRREGULAR_ADJECTIVES: Record<string, string> = {
	münchen: 'Münchner',
	dresden: 'Dresdner',
	essen: 'Essener',
	bremen: 'Bremer',
	emden: 'Emder',
	zwickau: 'Zwickauer',
	hannover: 'Hannoveraner',
	jena: 'Jenaer',
	gera: 'Geraer',
	fulda: 'Fuldaer',
	weimar: 'Weimarer'
};

/**
 * Kopfzeile der Zeitung: „TELTOWER LICHTBLICK“.
 *
 * Regelfall ist das angehängte -er (Teltow → Teltower, Berlin → Berliner).
 * Alles, was sich nicht sicher beugen lässt — mehrteilige Namen, Endung auf
 * -e, unbekannte Muster — bekommt die neutrale Form „LICHTBLICK FÜR <ORT>“.
 * Die ist immer korrekt; ein falsch gebeugter Ortsname im Zeitungskopf wäre
 * das erste, was einem Einheimischen auffällt.
 */
export function newspaperName(place: string): string {
	const p = place.trim();
	if (!p) return 'DEIN LICHTBLICK';

	const irregular = IRREGULAR_ADJECTIVES[p.toLowerCase()];
	if (irregular) return `${irregular.toUpperCase()} LICHTBLICK`;

	// Mehrteilige Namen ("Bad Belzig", "Frankfurt am Main") nicht beugen.
	if (/[\s-]/.test(p)) return `LICHTBLICK FÜR ${p.toUpperCase()}`;

	// Städte auf -e und -en sind zu unregelmäßig für eine Regel (Halle →
	// Hallesche, Essen → Essener, Bremen → Bremer). Was nicht oben in der
	// Liste steht, bekommt die neutrale Form.
	if (/e[ns]?$/i.test(p)) return `LICHTBLICK FÜR ${p.toUpperCase()}`;

	// Der Normalfall: Teltow → Teltower, Berlin → Berliner, Potsdam → Potsdamer
	if (/[a-zäöüß]$/i.test(p)) return `${p.toUpperCase()}ER LICHTBLICK`;

	return `LICHTBLICK FÜR ${p.toUpperCase()}`;
}

/** Ausgabennummer aus dem Datum — gibt der Zeitung Kontinuität. */
export function issueNumber(date: Date): number {
	const start = new Date(2026, 0, 1);
	const days = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
	return Math.max(1, days + 1);
}

/** „Freitag, 31. Juli 2026“ */
export function issueDate(date: Date): string {
	return date.toLocaleDateString('de-DE', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}
