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
 * Kopfzeile der Zeitung: „TELTOWER LICHTBLICK“.
 *
 * Deutsche Ortsadjektive sind unregelmäßig (München → Münchner, Teltow →
 * Teltower, Halle → Hallesche). Ein voller Regelsatz wäre Ratespiel; hier
 * deckt eine kleine Heuristik die häufigen Muster ab, und wo sie unsicher
 * ist, wird die neutrale Form „LICHTBLICK FÜR <ORT>“ benutzt — die ist immer
 * korrekt.
 */
export function newspaperName(place: string): string {
	const p = place.trim();
	if (!p) return 'DEIN LICHTBLICK';

	// Mehrteilige Namen ("Bad Belzig", "Frankfurt am Main") nicht beugen.
	if (/[\s-]/.test(p)) return `LICHTBLICK FÜR ${p.toUpperCase()}`;

	// -en/-er/-en-Endungen: München → Münchner, Bremen → Bremer
	if (p.endsWith('en')) return `${p.slice(0, -2).toUpperCase()}ER LICHTBLICK`;
	// Städte auf -e: Halle → Hallenser wäre falsch geraten → neutral bleiben
	if (p.endsWith('e')) return `LICHTBLICK FÜR ${p.toUpperCase()}`;
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
