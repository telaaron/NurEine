/**
 * Regelbasierter Instagram-Caption + Hashtag-Generator.
 *
 * Kein KI-Call — deterministisch aus den Story-Feldern, im NurEine-Ton
 * (siehe GROWTH.md §2). Du editierst jeden Entwurf eh im Admin, daher reicht
 * eine saubere, ruhige Basis: Hook → eine Zeile Kontext → (ab Woche 4) CTA.
 *
 * Regeln: kein Emoji-Spam, kein "Folgt uns", kein Ausrufezeichen, max 5 Hashtags.
 */

export type HookType = 'zahl' | 'frage' | 'kontrast';

/** Story-Felder, die der Generator braucht (Subset von StoryResult). */
export interface CaptionStoryInput {
	title: string;
	dek: string;
	category: string;
	impactScore: number;
	source?: string;
}

// Größere Hashtag-Pools pro Kategorie. Das System wählt rotierend einen Mix —
// IG belohnt 8-12 RELEVANTE Hashtags (nicht 30 Spam). Mix aus Reichweite-Tags
// (groß) + Nischen-Tags (gezielt). Performance-Lernen via Insights später.
const CATEGORY_HASHTAGS: Record<string, string[]> = {
	klima: ['#klimaschutz', '#klimawandel', '#nachhaltigkeit', '#erneuerbareenergien', '#umweltschutz', '#klimakrise', '#energiewende', '#zukunft'],
	gesundheit: ['#globalhealth', '#gesundheit', '#medizin', '#forschung', '#prävention', '#wellbeing', '#publichealth', '#fortschrittmedizin'],
	wissenschaft: ['#wissenschaft', '#forschung', '#science', '#durchbruch', '#innovation', '#zukunft', '#technologie', '#entdeckung'],
	gemeinschaft: ['#gemeinsinn', '#solidarität', '#zusammenhalt', '#engagement', '#sozialeswandel', '#miteinander', '#hoffnung', '#menschlichkeit'],
	tiere: ['#artenschutz', '#tierschutz', '#wildlife', '#naturschutz', '#biodiversität', '#tiere', '#rewilding', '#naturefirst'],
	kultur: ['#kultur', '#bildung', '#gesellschaft', '#kunst', '#zukunft', '#wandel', '#inspiration', '#community'],
	innovation: ['#innovation', '#technologie', '#zukunft', '#fortschritt', '#startup', '#nachhaltigetechnik', '#cleantech', '#techforgood']
};

const BASE_HASHTAGS = ['#gutenachrichten', '#positivenews', '#fortschritt', '#hoffnung', '#ehrlicherfortschritt'];

/** Erkennt eine Zahl/Prozent im Titel — Signal für Hook-Typ "zahl". */
function hasNumber(text: string): boolean {
	return /\d/.test(text);
}

/**
 * Hook-Typ aus der Story ableiten (A/B-Achse).
 * - Titel mit Zahl/Prozent → 'zahl'
 * - sonst rotierend nach impactScore-Parität → 'frage' | 'kontrast'
 * So entsteht über die Zeit ein Mix aller drei Typen für die Auswertung.
 */
export function pickHookType(story: CaptionStoryInput): HookType {
	if (hasNumber(story.title) || hasNumber(story.dek)) return 'zahl';
	return story.impactScore % 2 === 0 ? 'frage' : 'kontrast';
}

/**
 * ~10 relevante Hashtags: 3 rotierende Basis + ~5 rotierende Kategorie-Tags.
 * `seed` (z.B. impactScore oder Post-Zähler) rotiert die Auswahl deterministisch,
 * damit nicht immer dieselben Tags laufen → mehr Reichweiten-Diversität + A/B-Daten.
 */
export function hashtagsFor(category: string, seed = 0): string[] {
	const rotate = <T>(arr: T[], n: number, start: number): T[] => {
		if (arr.length <= n) return arr;
		const out: T[] = [];
		for (let i = 0; i < n; i++) out.push(arr[(start + i) % arr.length]);
		return out;
	};
	const base = rotate(BASE_HASHTAGS, 3, seed);
	const catPool = CATEGORY_HASHTAGS[category] || [];
	const cat = rotate(catPool, 5, seed);
	return [...new Set([...base, ...cat])];
}

/**
 * Caption im Plan-Format. `withCta` ab Woche 4 (Newsletter-CTA).
 * Hook variiert nach hookType, damit Folie-1-Text & Caption-Einstieg matchen.
 */
export function buildCaption(
	story: CaptionStoryInput,
	opts: { hookType?: HookType; withCta?: boolean } = {}
): string {
	const hook = opts.hookType ?? pickHookType(story);
	const title = story.title.trim().replace(/\s+/g, ' ');
	const context = story.dek.trim().replace(/\s+/g, ' ');

	let opener: string;
	switch (hook) {
		case 'frage':
			opener = `${title}`;
			break;
		case 'kontrast':
			opener = `${title}`;
			break;
		default: // 'zahl'
			opener = `${title}`;
	}

	const lines: string[] = [opener, '', context];

	if (story.source) {
		lines.push('', `Quelle: ${story.source}`);
	}

	if (opts.withCta) {
		lines.push('', 'Täglich eine belegte gute Nachricht → nureine.de');
	}

	return lines.join('\n').trim();
}

/**
 * Instagram-Caption, die auf dem Bild/Hook AUFBAUT statt zu wiederholen.
 * Annahme: das Bild (Karte/Carousel) trägt bereits den Hook. Die Caption liefert
 * also NICHT denselben Text nochmal, sondern Kontext → Quelle → Link.
 * Erste 1,5 Zeilen = der Hook (überlebt vor dem "… mehr"), dann Substanz.
 */
export function buildCaptionFromHook(story: {
	igHook?: string | null;
	dek: string;
	source?: string;
	slides?: { aufloesung?: string; stille?: string } | null;
}): string {
	// WICHTIG: Die Caption darf NIEMALS mit dem Hook starten — der steht schon
	// auf Folie 1. Doppelung killt die Wirkung. Stattdessen liefert die Caption
	// die SUBSTANZ (Auflösung/Kontext, der NICHT auf der Karte steht) + einen
	// ruhigen Schluss + CTA. Erste Zeile = neuer Gedanke, nicht das Bild-Echo.
	const hook = (story.igHook || '').trim().toLowerCase();
	const aufloesung = (story.slides?.aufloesung || story.dek || '').trim();
	const stille = (story.slides?.stille || '').trim();

	const lines: string[] = [];
	// Substanz zuerst — aber nur, wenn sie NICHT bloß der Hook ist.
	if (aufloesung && aufloesung.toLowerCase() !== hook) {
		lines.push(aufloesung);
	} else if (story.dek && story.dek.trim().toLowerCase() !== hook) {
		lines.push(story.dek.trim());
	}
	// Ruhiger Nachhall (Folie-3-Satz) als zweiter Absatz, wenn vorhanden + neu.
	if (stille && stille.toLowerCase() !== hook && stille !== aufloesung) {
		lines.push('', stille);
	}
	if (story.source) lines.push('', `Quelle: ${story.source}`);
	lines.push('', 'Mehr belegte gute Nachrichten → nureine.de');
	return lines.join('\n').trim();
}

/** Folie-1-Hook-Text für die Karte (kurz, ein Gedanke). */
export function slide1Hook(story: CaptionStoryInput, hookType?: HookType): string {
	const hook = hookType ?? pickHookType(story);
	if (hook === 'frage') return `Warum ist das wichtiger, als es klingt?`;
	if (hook === 'kontrast') return story.title;
	return story.title;
}
