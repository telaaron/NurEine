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

export interface WaCardInput {
	title: string;
	hook?: string | null; // optionale Anmoderation (waOpener/igHook) ÜBER dem Titel
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
	const opener = (input.hook || '').trim();
	const showOpener = opener.length > 0 && opener.toLowerCase() !== title.toLowerCase();

	const titleSize = title.length <= 40 ? 60 : title.length <= 75 ? 50 : 42;

	const IMG_H = 980;
	const imageBlock = input.imageBase64
		? `<img src="${input.imageBase64}" width="960" height="${IMG_H}" style="width:960px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="display:flex;width:960px;height:${IMG_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"></div>`;

	const openerBlock = showOpener
		? `<div style="display:flex;font-family:'Newsreader';font-style:italic;font-size:34px;font-weight:400;color:${AMBER};line-height:1.3;margin-top:48px;width:960px;">${esc(opener)}</div>`
		: '';

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;align-items:center;justify-content:center;">

  <div style="display:flex;flex-direction:column;align-items:center;width:960px;">

    <!-- Große Illustration, gerundet, randlos-warm -->
    <div style="display:flex;width:960px;height:${IMG_H}px;border-radius:40px;overflow:hidden;box-shadow:0 24px 70px rgba(60,40,20,0.20);">
      ${imageBlock}
    </div>

    <!-- Anmoderation (optional) + Titel als Kern -->
    ${openerBlock}
    <div style="display:flex;font-family:'Newsreader';font-size:${titleSize}px;font-weight:600;color:${INK};line-height:1.22;margin-top:${showOpener ? 16 : 52}px;width:960px;">
      ${esc(title)}
    </div>

    <!-- Winziges nureine.de, dezent rechts -->
    <div style="display:flex;width:960px;margin-top:44px;">
      <div style="display:flex;flex:1;"></div>
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};letter-spacing:0.02em;">nureine.de</div>
    </div>

  </div>

</body></html>`;
}
