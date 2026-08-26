/**
 * Doppelte Texte auf derselben Oberfläche verhindern.
 *
 * Hintergrund: Eine Story hat mehrere kurze Textfelder (`title`, `subtitle`,
 * `share_hook`, `slides.*`), und mehrere Kanäle greifen auf dieselben Felder zu.
 * Dadurch stand derselbe Satz an zwei Stellen, die der Nutzer gleichzeitig sieht:
 *
 *   - TikTok: `share_hook` als Endcard IM Video und als erste Zeile der Caption
 *     DARUNTER. Ein Bildschirm, ein Satz, zweimal.
 *   - Newsletter: `share_hook` als Betreffzeile und als einziger Teaser-Satz
 *     im Mail-Körper, zwei Zentimeter darunter.
 *
 * Die Regel dagegen (docs/STIMME.md § 9): Ist ein Feld auf einer Oberfläche
 * schon sichtbar, nimmt die zweite Stelle das nächste Feld der Kaskade.
 * `isEcho` entscheidet, ob zwei Texte für den Leser dasselbe sagen.
 */

/** Kleinschreibung, Satzzeichen und Mehrfach-Leerzeichen weg. */
function normalizeForCompare(text: string): string {
	return text
		.toLowerCase()
		.replace(/[„“”"'’‚‘]/g, '')
		.replace(/[.,;:!?…]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Wortmenge ohne Füllwörter, die jede Überschneidung künstlich aufblähen. */
const STOPWORDS = new Set([
	'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
	'und', 'oder', 'aber', 'als', 'wie', 'in', 'im', 'an', 'am', 'auf', 'aus', 'bei',
	'für', 'mit', 'von', 'vom', 'zu', 'zum', 'zur', 'ist', 'sind', 'war', 'waren',
	'hat', 'haben', 'wird', 'werden', 'es', 'sich', 'nicht', 'auch', 'so', 'jetzt'
]);

function contentWords(text: string): Set<string> {
	return new Set(
		normalizeForCompare(text)
			.split(' ')
			.filter((w) => w.length > 2 && !STOPWORDS.has(w))
	);
}

/**
 * Sagen zwei Texte für den Leser dasselbe?
 *
 * Verglichen werden die Inhaltswörter des KÜRZEREN Textes: Steht ein kurzer
 * Betreff fast vollständig in einem längeren Teaser, ist der Teaser für den
 * Leser trotzdem eine Wiederholung.
 *
 * @param a         erster Text
 * @param b         zweiter Text
 * @param threshold Anteil gemeinsamer Inhaltswörter, ab dem es als Echo gilt
 */
export function isEcho(a: string | null | undefined, b: string | null | undefined, threshold = 0.7): boolean {
	const wa = contentWords(a ?? '');
	const wb = contentWords(b ?? '');
	if (wa.size === 0 || wb.size === 0) return false;

	const [kleiner, groesser] = wa.size <= wb.size ? [wa, wb] : [wb, wa];
	let gemeinsam = 0;
	for (const w of kleiner) if (groesser.has(w)) gemeinsam++;
	return gemeinsam / kleiner.size >= threshold;
}

/**
 * Erste Option, die kein Echo eines bereits sichtbaren Textes ist.
 *
 * @param bereitsSichtbar Texte, die der Nutzer an dieser Stelle schon liest
 * @param kandidaten      Kaskade in absteigender Präferenz
 */
export function pickNonEcho(
	bereitsSichtbar: (string | null | undefined)[],
	kandidaten: (string | null | undefined)[]
): string {
	const sichtbar = bereitsSichtbar.filter((t): t is string => !!t && t.trim().length > 0);
	for (const kandidat of kandidaten) {
		const text = (kandidat ?? '').trim();
		if (!text) continue;
		if (!sichtbar.some((s) => isEcho(s, text))) return text;
	}
	// Nichts Eigenständiges gefunden: die erste nicht-leere Option ist besser als nichts.
	return (kandidaten.find((k) => (k ?? '').trim().length > 0) ?? '').trim();
}
