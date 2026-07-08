/**
 * OG Image HTML template for Satori rendering.
 *
 * Design — matches static/og-slug-base.jpg + the site's new look:
 *   - Warm cream canvas (#f4efe6)
 *   - Amber brand circle, top-right
 *   - Story illustration in a rounded, framed card overlapping the circle (right)
 *   - Left column: logo mark → Space Grotesk headline → Newsreader-italic dek
 *     (amber) → short amber rule → category pill + location meta
 *   - "nureine.de" faint, bottom-right
 *
 * Dimensions: 1200×630 (1.91:1) — optimal for WhatsApp, iMessage, X, FB, LinkedIn.
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

const CATEGORY_LABELS: Record<string, string> = {
	klima: 'Klima',
	gesundheit: 'Gesundheit',
	wissenschaft: 'Wissenschaft',
	gemeinschaft: 'Gemeinschaft',
	tiere: 'Tiere',
	kultur: 'Kultur',
	innovation: 'Innovation'
};

export interface OgTemplateInput {
	title: string;
	dek: string;
	category: string;
	country?: string;
	code?: string; // 2-letter region code, e.g. "LA"
	imageBase64: string | null;
	logoDataUri?: string | null;
}

// ── Palette (matches src/app.css) ──
const CANVAS_W = 1200;
const CANVAS_H = 630;
const CANVAS = '#f4efe6';
const PAPER = '#fbf8f1';
const INK = '#16140f';
const MUTED = '#6b6359';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';
const AMBER_DEEP = '#9c5527';
const RULE = 'rgba(22,20,15,0.12)';

// ── Layout ──
const PAD = 64;
const COL_W = 600; // left text column width
const CIRCLE = 360; // amber brand circle diameter
const CARD_W = 470;
const CARD_H = 470;

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/** Headline-Größe, die lange Titel sicher in der Spalte hält.
 *  WICHTIG: berücksichtigt nicht nur die Zeichenzahl, sondern auch das LÄNGSTE
 *  Wort — lange Komposita ("Meeresboden-Entstehung") können nicht umbrechen und
 *  zwingen sonst zu breit/hoch. Ist ein Wort sehr lang, eine Stufe kleiner.
 *  Konservativer als zuvor, damit Headline + Dek nie die Meta-Zeile überlaufen. */
function headlineSize(title: string): number {
	const len = title.length;
	// Bindestrich-Komposita dürfen an "-" umbrechen → als getrennte Wörter zählen.
	const longestWord = Math.max(0, ...title.split(/[\s-]+/).map((w) => w.length));
	let size: number;
	if (len <= 32) size = 66;
	else if (len <= 50) size = 56;
	else if (len <= 72) size = 46;
	else if (len <= 95) size = 38;
	else size = 34;
	// Sehr langes Einzelwort (kein Umbruch möglich) → eine Stufe kleiner.
	if (longestWord >= 15 && size > 42) size -= 8;
	else if (longestWord >= 12 && size > 48) size -= 6;
	return size;
}

export function buildOgTemplate(input: OgTemplateInput): string {
	const { title, dek, category, country, code, imageBase64, logoDataUri } = input;
	const accent = CATEGORY_ACCENT[category] || AMBER;
	const categoryLabel = (CATEGORY_LABELS[category] || category).toUpperCase();
	const hSize = headlineSize(title);

	const maxDek = 95;
	const displayDek =
		dek && dek.length > 0 ? (dek.length > maxDek ? dek.slice(0, maxDek - 1) + '…' : dek) : '';

	const locationText = [country, code ? code.toUpperCase() : ''].filter(Boolean).join(' · ');

	// Story illustration card (right). Falls back to an amber-tinted panel.
	const cardInner = imageBase64
		? `<img src="${imageBase64}" width="${CARD_W}" height="${CARD_H}" style="object-fit:cover;width:${CARD_W}px;height:${CARD_H}px;" />`
		: `<div style="display:flex;width:${CARD_W}px;height:${CARD_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);">
			 <div style="font-family:'Space Grotesk';font-size:96px;font-weight:700;color:rgba(255,255,255,0.92);">N</div>
		   </div>`;

	return `<!DOCTYPE html>
<html>
<body style="margin:0;width:${CANVAS_W}px;height:${CANVAS_H}px;background:${CANVAS};font-family:'Inter';display:flex;position:relative;overflow:hidden;">

  <!-- Amber brand circle, top-right -->
  <div style="position:absolute;display:flex;top:-40px;right:96px;width:${CIRCLE}px;height:${CIRCLE}px;border-radius:${CIRCLE}px;background:linear-gradient(160deg,${AMBER} 0%,${AMBER_DEEP} 100%);"></div>

  <!-- Story illustration card, overlapping the circle (right) -->
  <div style="position:absolute;display:flex;top:80px;right:64px;width:${CARD_W}px;height:${CARD_H}px;border-radius:20px;overflow:hidden;background:${PAPER};box-shadow:0 18px 50px rgba(60,40,20,0.22);border:6px solid ${PAPER};">
    ${cardInner}
  </div>

  <!-- Left column -->
  <div style="position:absolute;display:flex;flex-direction:column;left:${PAD}px;top:${PAD}px;width:${COL_W}px;height:${CANVAS_H - PAD * 2}px;">

    <!-- Logo mark (lighthouse) + wordmark -->
    <div style="display:flex;align-items:center;">
      ${
		logoDataUri
			? `<img src="${logoDataUri}" width="31" height="44" style="width:31px;height:44px;" />`
			: `<div style="display:flex;width:30px;height:36px;background:${INK};border-radius:4px 4px 16px 16px;"></div>`
	}
      <div style="font-family:'Space Grotesk';font-size:27px;font-weight:700;color:${INK};margin-left:12px;letter-spacing:-0.02em;">NurEine</div>
    </div>

    <!-- Headline — hart auf max. 3 Zeilen begrenzt (line-clamp), damit ein
         langer Titel nie die Dek/Meta-Zeile überläuft. -->
    <div style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;font-family:'Space Grotesk';font-size:${hSize}px;font-weight:700;color:${INK};line-height:1.05;letter-spacing:-0.03em;margin-top:30px;max-width:${COL_W}px;">
      ${escapeHtml(title)}
    </div>

    ${
		displayDek
			? `<!-- Dek (serif italic, amber) — max. 2 Zeilen -->
    <div style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-family:'Newsreader';font-style:italic;font-size:26px;font-weight:400;color:${AMBER_DEEP};line-height:1.28;margin-top:20px;max-width:560px;">
      ${escapeHtml(displayDek)}
    </div>`
			: ''
	}

    <!-- Spacer pushes meta to the bottom -->
    <div style="display:flex;flex:1;"></div>

    <!-- Short amber rule -->
    <div style="display:flex;width:64px;height:3px;background:${AMBER};margin-bottom:24px;"></div>

    <!-- Category pill + location -->
    <div style="display:flex;align-items:center;">
      <div style="display:flex;align-items:center;border:1px solid ${RULE};border-radius:100px;padding:8px 16px;">
        <div style="display:flex;width:8px;height:8px;border-radius:8px;background:${accent};margin-right:9px;"></div>
        <div style="font-family:'Inter';font-size:15px;font-weight:600;color:${MUTED};letter-spacing:0.1em;">${categoryLabel}</div>
      </div>
      ${
		locationText
			? `<div style="font-family:'Inter';font-size:18px;font-weight:400;color:${MUTED};margin-left:18px;">${escapeHtml(locationText)}</div>`
			: ''
	}
    </div>
  </div>

  <!-- nureine.de, bottom-right -->
  <div style="position:absolute;display:flex;right:${PAD}px;bottom:${PAD - 16}px;font-family:'Inter';font-size:20px;font-weight:400;color:${FAINT};">nureine.de</div>

</body>
</html>`;
}
