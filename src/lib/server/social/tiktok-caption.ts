/**
 * Regelbasierter TikTok-Caption-Builder (Fallback / Referenz).
 *
 * Kein KI-Call — deterministisch aus den Story-Feldern, im NurEine-Ton
 * (duzen, warm, nie kitschig, keine Superlative ohne Beleg). Setzt die Regeln
 * aus TIKTOK_PLAN.md §3 (Format) und §5 (Hashtags & SEO) um:
 *   - Haupt-Keyword in den ersten ~60 Zeichen (Caption-Gewicht 40 %).
 *   - Hook = Payoff/Zahl/Überraschung sofort (kein Intro, anders als IG).
 *   - 3–5 Hashtags, nie mehr; #gutenachrichten immer als erstes (Marken-/Nischen-Tag).
 *   - Save/Comment-CTA (NICHT der IG-"Schick's jemandem"-Send-CTA).
 *   - Quellenzeile am Ende ("… — von uns nachgeprüft.") = unser USP.
 *
 * Wird vom Admin-Tool genutzt, wenn keine handgeschriebene oder vom
 * Veredler/Reel-Regie-Agenten erzeugte Caption vorliegt. Reine Funktion,
 * keine DB-Calls, keine Seiteneffekte.
 */

export interface TikTokStoryInput {
	title: string;
	subtitle: string | null;
	share_hook: string | null;
	summary: string | null;
	category: string | null;
	source_name: string | null;
	impact_score: number | null;
}

export interface TikTokCaption {
	/** Fertige Caption inkl. Hook, Keyword vorne, CTA, Quellenzeile (OHNE Hashtags). */
	caption: string;
	/** 3–5 Hashtags, inkl. führendem '#'. #gutenachrichten immer zuerst. */
	hashtags: string[];
	/** Haupt-Keyword, das gesprochen UND eingeblendet werden soll (Erinnerung fürs Video). */
	keyword: string;
	/** Komplett kopierbare Version: caption + "\n\n" + hashtags.join(' '). */
	full: string;
}

/**
 * Kategorie → (Anzeige-Keyword, Thema-Hashtags). Analog zu caption.ts, aber
 * TikTok-eigen: 1–2 Thema-Tags reichen (§5), das Keyword ist die sprechbare
 * Kurzform für Voiceover + Texteinblendung.
 */
const CATEGORY_MAP: Record<string, { keyword: string; hashtags: string[] }> = {
	klima: { keyword: 'Klima', hashtags: ['#klima', '#nachhaltigkeit'] },
	gesundheit: { keyword: 'Gesundheit', hashtags: ['#gesundheit', '#medizin'] },
	wissenschaft: { keyword: 'Wissenschaft', hashtags: ['#wissen', '#forschung'] },
	gemeinschaft: { keyword: 'Zusammenhalt', hashtags: ['#zusammenhalt', '#gesellschaft'] },
	tiere: { keyword: 'Artenschutz', hashtags: ['#artenschutz', '#natur'] },
	kultur: { keyword: 'Kultur', hashtags: ['#kultur', '#bildung'] },
	innovation: { keyword: 'Innovation', hashtags: ['#innovation', '#technologie'] }
};

/** Breiter Basis-Tag: für Wissens-/Edu-Kategorien '#wissen', sonst '#gutenachrichten'-nah. */
const WISSENS_KATEGORIEN = new Set(['wissenschaft', 'innovation', 'gesundheit', 'klima']);

/** Marken-/Nischen-Tag, den wir selbst aufbauen — laut §5 IMMER dabei, als erstes. */
const BRAND_HASHTAG = '#gutenachrichten';

/**
 * Umlaut-/Sonderzeichen-Ersetzung wie slugify() in threads.ts, aber OHNE
 * Bindestriche — ein Hashtag ist ein Wort. Ergebnis: lowercase [a-z0-9].
 */
function hashtagSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '');
}

/** '#' voranstellen und sauber sluggen; leere Ergebnisse werden vom Aufrufer gefiltert. */
function toHashtag(raw: string): string {
	const slug = hashtagSlug(raw.replace(/^#/, ''));
	return slug ? `#${slug}` : '';
}

/** Whitespace normalisieren (Zeilenumbrüche, Mehrfach-Spaces → ein Space). */
function normalize(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

// Stoppwörter, die als Haupt-Keyword nichts taugen (zu generisch / Funktionswörter).
const STOPWORDS = new Set([
	'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder', 'aber',
	'mit', 'ohne', 'für', 'von', 'vom', 'bei', 'aus', 'auf', 'über', 'unter', 'nach', 'vor',
	'ist', 'sind', 'war', 'wird', 'werden', 'hat', 'haben', 'kann', 'können', 'macht', 'machen',
	'mehr', 'viele', 'vier', 'fünf', 'drei', 'zwei', 'eins', 'millionen', 'million', 'tausend',
	'deutschland', 'deutsche', 'deutschen', 'jahr', 'jahre', 'prozent', 'menschen', 'welt',
	'neue', 'neuer', 'neues', 'erste', 'ersten', 'gute', 'guten', 'nachricht', 'zum', 'zur', 'im', 'in'
]);

/**
 * Markantes Substantiv aus dem Titel ziehen: das längste großgeschriebene Wort,
 * das kein Stoppwort ist (deutsche Substantive sind großgeschrieben → guter Proxy,
 * ohne NLP). Gibt null zurück, wenn nichts Brauchbares gefunden wird.
 *
 * Hinweis: Bindestrich-Komposita ("Social-Media-Firmen") sind hier bewusst
 * zugelassen — sie sind oft das eigentliche Subjekt der Schlagzeile. Damit sie
 * nicht zu Kunstwörtern verstümmelt werden, lässt singularize() sie ganz.
 */
function nounFromTitle(title: string): string | null {
	const words = normalize(title)
		// Anführungszeichen/Klammern etc. abstreifen, Buchstaben + Bindestriche behalten.
		.split(/\s+/)
		.map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
		.filter((w) => w.length >= 4);

	let best: string | null = null;
	for (const w of words) {
		const first = w[0];
		const isCapitalized = first === first.toUpperCase() && first !== first.toLowerCase();
		if (!isCapitalized) continue;
		if (STOPWORDS.has(w.toLowerCase())) continue;
		if (!best || w.length > best.length) best = w;
	}
	return best;
}

/**
 * Haupt-Keyword ableiten: bevorzugt ein markantes Substantiv aus dem Titel
 * (z.B. "Balkonkraftwerke" → "Balkonkraftwerk"), sonst das Kategorie-Keyword,
 * sonst ein neutraler Fallback. Wird gesprochen UND eingeblendet.
 */
function deriveKeyword(story: TikTokStoryInput): string {
	const noun = nounFromTitle(story.title);
	if (noun) return singularize(noun);

	const cat = story.category ? CATEGORY_MAP[story.category.toLowerCase()] : undefined;
	if (cat) return cat.keyword;

	return 'Gute Nachricht';
}

/**
 * Sehr leichte Singular-Heuristik für deutsche Plural-Endungen — nur um das
 * gesprochene Keyword natürlicher zu machen (kein vollständiger Stemmer).
 */
function singularize(word: string): string {
	if (word.length <= 5) return word;
	// Bindestrich-Komposita ("Social-Media-Firmen") NICHT anfassen: naives
	// "-en"/"-e"-Abschneiden erzeugt Kunstwörter ("…-Firm"). Der Plural ist als
	// eingeblendetes/gesprochenes Keyword in Ordnung → ganzes Wort behalten.
	if (word.includes('-')) return word;
	// "Balkonkraftwerke" → "Balkonkraftwerk", "Städte"/"Häuser" bleiben unangetastet
	// (Umlaut-Rückbildung wäre fehleranfällig, daher nur einfache Endungen).
	if (/[a-zäöü]en$/.test(word) && !/(chen|innen)$/.test(word)) {
		return word.slice(0, -2);
	}
	if (/[a-zäöü]e$/.test(word)) {
		return word.slice(0, -1);
	}
	return word;
}

/** Prüft, ob das Keyword in den ersten `n` Zeichen (case-insensitive) vorkommt. */
function keywordInFirstChars(text: string, keyword: string, n: number): boolean {
	return text.slice(0, n).toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Hook verdichten: nutze share_hook, sonst subtitle, sonst title. Auf einen
 * knackigen ersten Satz kürzen (kein Roman). TikTok will den Payoff sofort.
 */
function buildHook(story: TikTokStoryInput): string {
	const raw = normalize(story.share_hook || story.subtitle || story.title || '');
	if (!raw) return '';
	// Ersten Satz nehmen (bis zum ersten Satzende), aber mind. etwas Substanz behalten.
	const firstSentenceMatch = raw.match(/^.*?[.!?…](?:\s|$)/);
	let hook = firstSentenceMatch ? firstSentenceMatch[0].trim() : raw;
	// Falls der erste Satz sehr kurz ist (< 40 Z.) und mehr Kontext folgt, den
	// zweiten Satz noch mitnehmen — aber gesamt nicht ausufern lassen.
	if (hook.length < 40 && hook.length < raw.length) {
		hook = normalize(raw.slice(0, 200));
	}
	// Harte Obergrenze für den Fließtext-Kern.
	if (hook.length > 220) {
		hook = `${hook.slice(0, 217).replace(/\s+\S*$/, '')}…`;
	}
	return hook;
}

/**
 * Baut die Hashtag-Liste nach §5:
 *   [ #gutenachrichten (Marke, immer),  1 breit (#wissen bei Edu),  1–2 Thema ]
 * Dedupliziert, lowercase, ohne Umlaute/Spaces, 3–5 Stück (nie mehr).
 */
function buildHashtags(story: TikTokStoryInput, keyword: string): string[] {
	const out: string[] = [BRAND_HASHTAG];
	const cat = story.category ? story.category.toLowerCase() : '';

	// 1 breiter Tag: bei Wissens-/Edu-Kategorien '#wissen', sonst '#hoffnung'
	// (immer noch breit, aber nicht redundant zum Marken-Tag).
	out.push(WISSENS_KATEGORIEN.has(cat) ? '#wissen' : '#hoffnung');

	// 1–2 Thema-Tags aus der Kategorie.
	const mapped = CATEGORY_MAP[cat];
	if (mapped) {
		out.push(...mapped.hashtags);
	}

	// Optionaler Story-spezifischer Thema-Tag aus dem Keyword (falls es ein
	// echtes Substantiv ist und noch Platz bleibt) — schärft das SEO-Signal.
	const kwTag = toHashtag(keyword);
	if (kwTag && kwTag !== BRAND_HASHTAG) out.push(kwTag);

	// Dedup (nach Slug), leere raus, auf max. 5 kappen (§5: nie mehr).
	const seen = new Set<string>();
	const cleaned: string[] = [];
	for (const tag of out) {
		const norm = toHashtag(tag);
		if (!norm || seen.has(norm)) continue;
		seen.add(norm);
		cleaned.push(norm);
		if (cleaned.length >= 5) break;
	}
	return cleaned;
}

/**
 * Baut eine TikTok-optimierte Caption + Hashtags + gesprochenes Keyword aus
 * den Story-Daten. Siehe TIKTOK_PLAN.md §3 / §5.
 */
export function buildTikTokCaption(story: TikTokStoryInput): TikTokCaption {
	const keyword = deriveKeyword(story);
	let hook = buildHook(story);

	// §5: Haupt-Keyword MUSS in den ersten ~60 Zeichen stehen. Wenn der Hook es
	// nicht schon vorne trägt, stellen wir das Keyword als Label voran.
	let leadText = hook;
	if (!keywordInFirstChars(leadText, keyword, 60)) {
		leadText = hook ? `${keyword}: ${hook}` : keyword;
	}

	// Save/Comment-CTA (§3) — NICHT der IG-Send-CTA. Deterministisch nach
	// impact_score rotiert, damit über die Zeit beide CTA-Typen laufen.
	const seed = story.impact_score ?? 0;
	const cta = seed % 2 === 0 ? 'Speichern für später.' : 'Was denkst du? Schreib’s in die Kommentare.';

	// Quellenzeile (§ USP): Beleg = unser Alleinstellungsmerkmal.
	const sourceLine = story.source_name
		? `Quelle: ${normalize(story.source_name)} — von uns nachgeprüft.`
		: 'Von uns nachgeprüft.';

	// Caption zusammensetzen: Hook (Keyword vorne) → CTA → Quelle. Knapp halten.
	const caption = [leadText, '', cta, sourceLine].join('\n').trim();

	const hashtags = buildHashtags(story, keyword);
	const full = `${caption}\n\n${hashtags.join(' ')}`.trim();

	return { caption, hashtags, keyword, full };
}
