/**
 * Format-Scheduler — bestimmt die Carousel-FORM pro Wochentag (Wochenplan).
 *
 * Die Engine wählt täglich EINE ig_ok-Story (selectInstagramStory) — diese Datei
 * entscheidet nur, WELCHE Folien daraus gebaut werden, damit der Feed über die
 * Woche abwechslungsreich wirkt statt 7× dasselbe 3-Folien-Schema.
 *
 * Wochenplan (Feed-Post/Tag):
 *   Mo  Reel (Phase 2)            → hier Fallback: Standard-Carousel
 *   Di  Carousel + BELEG-Folie    → Glaubwürdigkeit zeigen (Save-Trigger, Idee #1)
 *   Mi  Reel (Phase 2)            → Fallback Standard
 *   Do  Carousel, KONTRAST-betont → "Was die Schlagzeile verschwieg" (Idee #2)
 *   Fr  Reel (Phase 2)            → Fallback Standard
 *   Sa  ruhiges Carousel          → "unscheinbarer Sieg"/charme (Idee #9/#5)
 *   So  Wochen-Digest (eigener Cron, Idee #10) — hier nicht behandelt
 *
 * Solange Reels (Phase 2) nicht live sind, bekommen Reel-Tage ein Standard-
 * Carousel — der Feed läuft also auch ohne Reels rund.
 */

export type SlideKind = 'hook' | 'aufloesung' | 'stille' | 'beleg' | 'methodik' | 'endcard';

export interface SlidePlan {
	kinds: SlideKind[]; // Reihenfolge der Folien
	label: string; // fürs Cockpit/Logging
}

/**
 * Liefert die Folien-Komposition für den Wochentag.
 * @param weekday 0=So .. 6=Sa (wie Date.getUTCDay()).
 * @param hasMethodikData ob die Story echte Wirkungs-Dimensionen hat (sonst Methodik überspringen)
 */
export function slidePlanForWeekday(weekday: number, hookType: string | null): SlidePlan {
	switch (weekday) {
		case 2: // Dienstag — Beleg-Tag: Glaubwürdigkeit sichtbar machen
			return { kinds: ['hook', 'aufloesung', 'beleg', 'endcard'], label: 'beleg' };
		case 4: // Donnerstag — Kontrast/Methodik: warum es zählt, offen gerechnet
			return { kinds: ['hook', 'aufloesung', 'methodik', 'endcard'], label: 'methodik' };
		case 6: // Samstag — ruhig: Hook, Auflösung, stiller Nachhall, schickbar
			return { kinds: ['hook', 'aufloesung', 'stille', 'endcard'], label: 'ruhig' };
		default:
			// Mo/Mi/Fr (Reel-Tage, bis Phase 2) + Fallback: kompaktes Standard-Carousel.
			// mensch/charme mögen den stillen Nachhall, Zahl/Sieg eher die Auflösung.
			if (hookType === 'mensch' || hookType === 'charme') {
				return { kinds: ['hook', 'aufloesung', 'stille', 'endcard'], label: 'standard-emotion' };
			}
			return { kinds: ['hook', 'aufloesung', 'beleg', 'endcard'], label: 'standard' };
	}
}

/**
 * Baut die konkreten Folien-URLs aus Plan + Slug.
 * Folie 'hook' trägt den A/B-Stil (image/number) für den Feed-Stopper.
 */
export function slideUrlsFromPlan(
	baseUrl: string,
	slug: string,
	plan: SlidePlan,
	hookStyle: 'image' | 'number'
): string[] {
	return plan.kinds.map((kind) => {
		if (kind === 'hook') {
			return `${baseUrl}/api/carousel/${slug}/1?style=${hookStyle}`;
		}
		// Die n-Komponente ist für kind-basierte Folien egal (kind überschreibt n),
		// wir setzen 1 als neutralen Platzhalter.
		return `${baseUrl}/api/carousel/${slug}/1?kind=${kind}`;
	});
}
