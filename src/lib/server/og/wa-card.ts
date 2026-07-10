/**
 * WhatsApp-Status-Karte (1080×1920, 9:16) — fast UNBRANDED.
 *
 * Ziel: wirkt wie ein Screenshot, den man entdeckt hat ("guck mal, cool"),
 * NICHT wie Werbung. Darum: große schöne Illustration, ein kurzer Satz,
 * winziges nureine.de in der Ecke. Kein Logo-Header, kein Wirkung-Badge,
 * kein Kategorie-Pill. Alles in der WA-sicheren Mitte (Header/Caption verdecken Rand).
 */

const CANVAS = '#f4efe6';
const INK = '#16140f';
const AMBER = '#bd6a35';
const FAINT = '#9a9087';

const W = 1080;
const H = 1920;

const CATEGORY_LABELS: Record<string, string> = {
	klima: 'Klima', gesundheit: 'Gesundheit', wissenschaft: 'Wissenschaft',
	gemeinschaft: 'Gemeinschaft', tiere: 'Tiere', kultur: 'Kultur', innovation: 'Innovation'
};

export interface WaCardInput {
	title: string;
	hook?: string | null; // optionale Anmoderation (waOpener/igHook) ÜBER dem Titel
	category?: string | null;
	imageBase64: string | null;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildWaCard(input: WaCardInput): string {
	const title = (input.title || '').trim();
	// Der Opener ist eine offene Anmoderation ("Das hat mich hoffnungsvoll gemacht:").
	// OHNE Titel bleibt sie eine unaufgelöste Schleife → Empfänger versteht nichts.
	// Darum: Opener klein als Anmoderation, der TITEL groß als Kern darunter (Auflösung).
	// Opener nur zeigen, wenn er sich vom Titel unterscheidet und nicht leer ist.
	const titleSize = title.length <= 40 ? 62 : title.length <= 75 ? 52 : 44;
	const catLabel = input.category ? (CATEGORY_LABELS[input.category] || input.category).toUpperCase() : '';

	const IMG_H = 1040;
	const imageBlock = input.imageBase64
		? `<img src="${input.imageBase64}" width="960" height="${IMG_H}" style="width:960px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="display:flex;width:960px;height:${IMG_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"><div style="font-family:'Space Grotesk';font-size:200px;font-weight:700;color:rgba(255,255,255,0.9);">N</div></div>`;

	// Kategorie-Chip statt Spruch — newsletter-/OG-artig, klickbar wirkend.
	const catChip = catLabel
		? `<div style="display:flex;align-items:center;margin-top:44px;width:960px;">
        <div style="display:flex;align-items:center;background:#fff;border-radius:100px;padding:12px 26px;box-shadow:0 4px 16px rgba(60,40,20,0.08);">
          <div style="display:flex;width:12px;height:12px;border-radius:12px;background:${AMBER};margin-right:12px;"></div>
          <div style="font-family:'Inter';font-size:24px;font-weight:700;letter-spacing:0.12em;color:${INK};">${esc(catLabel)}</div>
        </div>
      </div>`
		: '';

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;align-items:center;justify-content:center;">

  <div style="display:flex;flex-direction:column;align-items:center;width:960px;">

    <!-- Große Illustration, gerundet, randlos-warm -->
    <div style="display:flex;width:960px;height:${IMG_H}px;border-radius:40px;overflow:hidden;box-shadow:0 24px 70px rgba(60,40,20,0.20);">
      ${imageBlock}
    </div>

    <!-- Kategorie-Chip + Titel als Kern (KEIN Spruch aufs Bild) -->
    ${catChip}
    <div style="display:flex;font-family:'Newsreader';font-size:${titleSize}px;font-weight:600;color:${INK};line-height:1.2;margin-top:${catChip ? 24 : 52}px;width:960px;">
      ${esc(title)}
    </div>

    <!-- nureine.de, dezent rechts -->
    <div style="display:flex;width:960px;margin-top:40px;">
      <div style="display:flex;flex:1;"></div>
      <div style="font-family:'Inter';font-size:28px;font-weight:600;color:${FAINT};letter-spacing:0.02em;">nureine.de</div>
    </div>

  </div>

</body></html>`;
}
