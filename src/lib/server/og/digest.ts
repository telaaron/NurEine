/**
 * Wochen-Digest-Carousel (Idee #10) — "X belegte gute Nachrichten dieser Woche".
 *
 * Der RITUAL-Post: ein wiederkehrendes Sonntags-Format, das aktive Follower
 * zum Account zurückbringt. Höchste Save-Rate, weil es zum Aufheben einlädt
 * ("zum Speichern") und zum Weiterschicken ("der wöchentliche Gute-Nachrichten-Brief").
 *
 * Aufbau (N Stories → N+2 Folien):
 *   Folie 1     — COVER: "N belegte gute Nachrichten dieser Woche · zum Speichern"
 *   Folie 2..N+1 — je eine Story: Nummer, Titel, ein-Satz-Auflösung, Quelle, Beleg-Tag
 *   Folie N+2   — ENDCARD: "Jede Woche. Mit Quelle." + Schick-/Folgen-CTA
 *
 * Bewusst TEXT-getrieben (keine Bilder pro Story) — ein sauberes, schnell lesbares,
 * screenshot-bares Referenz-Format. Identische Marken-DNA wie carousel.ts.
 */

const CATEGORY_ACCENT: Record<string, string> = {
	klima: '#56764e',
	gesundheit: '#b06f6f',
	wissenschaft: '#5d7e9c',
	gemeinschaft: '#bd6a35',
	tiere: '#56764e',
	kultur: '#bd6a35',
	innovation: '#5d7e9c'
};

const W = 1080;
const H = 1350;
const CANVAS = '#f4efe6';
const INK = '#16140f';
const MUTED = '#6b6359';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';
const AMBER_DEEP = '#9c5527';

export interface DigestStory {
	title: string;
	oneLiner: string; // kurze Auflösung — slides.aufloesung gekürzt oder dek
	sourceName: string | null;
	category: string;
	evidenceLabel: string; // "Peer-reviewed" / "Belegt" / …
	imageBase64?: string | null; // KI-Collage der Story (Bild oben auf der Folie)
}

export interface DigestInput {
	stories: DigestStory[];
	weekLabel: string; // z.B. "23.–29. Juni"
	logoDataUri?: string | null;
	shareLine?: string | null; // schickbare Zeile auf der Endcard
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function titleSize(text: string): number {
	const n = text.length;
	if (n <= 48) return 56;
	if (n <= 80) return 46;
	return 38;
}

function logoMark(logoDataUri?: string | null, onDark = false): string {
	if (!logoDataUri) return '';
	if (onDark) {
		return `<div style="display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:60px;background:#fff;"><img src="${logoDataUri}" width="40" height="40" style="width:40px;height:40px;" /></div>`;
	}
	return `<img src="${logoDataUri}" width="44" height="44" style="width:44px;height:44px;" />`;
}

function brandRow(logoDataUri: string | null | undefined, right: string, onDark = false): string {
	const ink = onDark ? '#fff' : INK;
	const muted = onDark ? 'rgba(255,255,255,0.7)' : MUTED;
	return `<div style="display:flex;align-items:center;padding:48px 60px 0;">
    ${logoMark(logoDataUri, onDark)}
    <div style="font-family:'Space Grotesk';font-size:36px;font-weight:700;color:${ink};margin-left:14px;letter-spacing:-0.02em;">NurEine</div>
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:22px;font-weight:500;color:${muted};letter-spacing:0.05em;">${esc(right)}</div>
  </div>`;
}

/**
 * Konsistente Fußzeile (dünne Linie + nureine.de links + Zähler rechts).
 * Füllt jeden toten unteren Rand systemweit mit einer brandenden Komponente.
 */
function footer(leftText: string, page: number, total: number, accent: string): string {
	return `<div style="display:flex;flex-direction:column;padding:0 64px 56px;">
    <div style="display:flex;width:100%;height:1px;background:#ddd4c6;margin-bottom:24px;"></div>
    <div style="display:flex;align-items:center;">
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${accent};">${leftText}</div>
      <div style="display:flex;flex:1;"></div>
      <div style="font-family:'Inter';font-size:24px;font-weight:600;color:${FAINT};letter-spacing:0.04em;">${page} / ${total}</div>
    </div>
  </div>`;
}

/** COVER (Folie 1) — mit Mini-Thumbnail-Trailer der Story-Bilder. */
function coverSlide(input: DigestInput): string {
	const n = input.stories.length;
	const thumbs = input.stories
		.filter((s) => s.imageBase64)
		.slice(0, 3)
		.map(
			(s) =>
				`<div style="display:flex;width:300px;height:300px;border-radius:18px;overflow:hidden;border:3px solid rgba(255,255,255,0.25);margin-right:18px;"><img src="${s.imageBase64}" width="300" height="300" style="width:300px;height:300px;object-fit:cover;" /></div>`
		)
		.join('');
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:'Inter';background:linear-gradient(158deg,${AMBER} 0%,${AMBER_DEEP} 60%,#16140f 200%);">
  ${brandRow(input.logoDataUri, esc(input.weekLabel), true)}
  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 64px;">
    <div style="display:flex;font-family:'Space Grotesk';font-size:210px;font-weight:700;color:#fff;line-height:0.82;letter-spacing:-0.04em;">${n}</div>
    <div style="display:flex;font-family:'Space Grotesk';font-size:62px;font-weight:700;color:#fff;line-height:1.05;letter-spacing:-0.03em;margin-top:18px;max-width:880px;">belegte gute Nachrichten dieser Woche</div>
    ${thumbs ? `<div style="display:flex;margin-top:52px;">${thumbs}</div>` : ''}
  </div>
  <div style="display:flex;align-items:center;padding:0 64px 80px;">
    <div style="display:flex;align-items:center;height:72px;background:rgba(255,255,255,0.18);border-radius:60px;padding:0 36px;">
      <div style="font-family:'Inter';font-size:30px;font-weight:600;color:#fff;">📌 Zum Speichern → wisch durch</div>
    </div>
  </div>
</body></html>`;
}

/** STORY-Folie (Folie 2..N+1) — Bild oben (Editorial-Aufmacher), Text unten. */
function storySlide(s: DigestStory, index: number, total: number, logoDataUri?: string | null): string {
	const accent = CATEGORY_ACCENT[s.category] || AMBER;
	const num = String(index + 1).padStart(2, '0');
	const IMG_H = 786; // ~58 % der Höhe — vollbreit angeschnitten = Magazin-Anmutung

	// Bild oben, vollbreit. Nummer + Badge in den dunklen Verlauf am Bild-Fuß
	// eingebrannt (nutzt den Platz doppelt, verankert die Serie).
	const imageBlock = s.imageBase64
		? `<img src="${s.imageBase64}" width="${W}" height="${IMG_H}" style="position:absolute;top:0;left:0;width:${W}px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${IMG_H}px;background:linear-gradient(150deg,${accent},#16140f 220%);"></div>`;

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:'Inter';background:${CANVAS};">
  <div style="display:flex;position:relative;width:${W}px;height:${IMG_H}px;">
    ${imageBlock}
    <div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${IMG_H}px;background:linear-gradient(180deg,rgba(18,16,11,0.42) 0%,rgba(18,16,11,0) 30%,rgba(18,16,11,0) 58%,rgba(18,16,11,0.72) 100%);"></div>
    <div style="position:absolute;top:0;left:0;display:flex;align-items:center;width:${W}px;padding:40px 64px 0;">
      ${logoMark(logoDataUri, true)}
      <div style="font-family:'Space Grotesk';font-size:32px;font-weight:700;color:#fff;margin-left:12px;letter-spacing:-0.02em;">NurEine</div>
      <div style="display:flex;flex:1;"></div>
      <div style="display:flex;align-items:center;height:44px;background:rgba(255,255,255,0.16);border-radius:44px;padding:0 22px;"><div style="font-family:'Inter';font-size:24px;font-weight:600;color:#fff;">✓ ${esc(s.evidenceLabel)}</div></div>
    </div>
    <div style="position:absolute;left:64px;bottom:34px;display:flex;font-family:'Space Grotesk';font-size:128px;font-weight:700;color:#fff;line-height:0.8;letter-spacing:-0.04em;text-shadow:0 2px 30px rgba(0,0,0,0.45);">${num}</div>
  </div>
  <div style="display:flex;flex-direction:column;flex:1;padding:44px 64px 0;">
    <div style="display:flex;font-family:'Space Grotesk';font-size:${titleSize(s.title)}px;font-weight:700;color:${INK};line-height:1.1;letter-spacing:-0.02em;margin-bottom:22px;">${esc(s.title)}</div>
    <div style="display:flex;font-family:'Newsreader';font-size:38px;font-weight:400;color:${MUTED};line-height:1.34;">${esc(s.oneLiner)}</div>
  </div>
  ${footer(s.sourceName ? 'Quelle: ' + esc(s.sourceName) : 'Belegt', index + 1, total, accent)}
</body></html>`;
}

/** ENDCARD (letzte Folie) — Wertversprechen + Touch-Button. */
function endcardSlide(input: DigestInput): string {
	const line = input.shareLine || 'Jede Woche eine Handvoll gute Nachrichten — mit Quelle, nicht mit Bauchgefühl.';
	const promise = (t: string) =>
		`<div style="display:flex;align-items:center;margin-bottom:14px;"><div style="display:flex;font-family:'Inter';font-size:30px;font-weight:700;color:${AMBER};margin-right:14px;">✓</div><div style="font-family:'Inter';font-size:30px;font-weight:500;color:${INK};">${t}</div></div>`;
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:'Inter';background:linear-gradient(160deg,${CANVAS} 0%,#efe7d8 100%);">
  <div style="position:absolute;display:flex;top:-220px;right:-220px;width:720px;height:720px;border-radius:720px;background:${AMBER};opacity:0.14;"></div>
  ${brandRow(input.logoDataUri, 'Ehrlicher Fortschritt')}
  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 64px;">
    <div style="display:flex;font-family:'Newsreader';font-style:italic;font-size:52px;font-weight:400;color:${AMBER_DEEP};line-height:1.3;margin-bottom:48px;">${esc(line)}</div>
    <div style="display:flex;flex-direction:column;">
      ${promise('Jeden Sonntag')}
      ${promise('Immer belegt, mit Quelle')}
      ${promise('In 2 Minuten durch')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;padding:0 64px 80px;">
    <div style="display:flex;align-items:center;justify-content:center;height:88px;background:${AMBER};border-radius:60px;margin-bottom:22px;">
      <div style="font-family:'Inter';font-size:32px;font-weight:600;color:#fff;">Folgen → der Wochen-Brief</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;font-family:'Inter';font-size:28px;font-weight:600;color:${AMBER};">nureine.de</div>
  </div>
</body></html>`;
}

/**
 * Render eine Digest-Folie. n ist 1-basiert:
 *   1            → Cover
 *   2..N+1       → Story 1..N
 *   N+2          → Endcard
 */
export function buildDigestSlide(input: DigestInput, n: number): string {
	const total = input.stories.length + 2;
	const idx = Math.min(total, Math.max(1, n));
	if (idx === 1) return coverSlide(input);
	if (idx === total) return endcardSlide(input);
	const storyIndex = idx - 2; // 0-basiert
	return storySlide(input.stories[storyIndex], storyIndex, total, input.logoDataUri);
}

/** Anzahl Folien für diesen Digest (Cover + Stories + Endcard). */
export function digestSlideCount(storyCount: number): number {
	return storyCount + 2;
}
