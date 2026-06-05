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

const CATEGORY_HASHTAG: Record<string, string> = {
	klima: '#klimaschutz',
	gesundheit: '#globalhealth',
	wissenschaft: '#wissenschaft',
	gemeinschaft: '#gemeinsinn',
	tiere: '#artenschutz',
	kultur: '#kultur',
	innovation: '#innovation'
};

const BASE_HASHTAGS = ['#gutenachrichten', '#positivenews', '#fortschritt'];

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

/** Bis zu 5 gezielte Hashtags: 3 Basis + 1 Kategorie + (Platz für 1 manuell). */
export function hashtagsFor(category: string): string[] {
	const cat = CATEGORY_HASHTAG[category];
	const tags = [...BASE_HASHTAGS];
	if (cat && !tags.includes(cat)) tags.push(cat);
	return tags.slice(0, 5);
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

/** Folie-1-Hook-Text für die Karte (kurz, ein Gedanke). */
export function slide1Hook(story: CaptionStoryInput, hookType?: HookType): string {
	const hook = hookType ?? pickHookType(story);
	if (hook === 'frage') return `Warum ist das wichtiger, als es klingt?`;
	if (hook === 'kontrast') return story.title;
	return story.title;
}
