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
	hook?: string | null; // kurzer Satz (igHook/waOpener) — wenn da, statt Titel
	imageBase64: string | null;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildWaCard(input: WaCardInput): string {
	// Ein kurzer, menschlicher Satz. Hook bevorzugt (knackiger), sonst Titel.
	const line = (input.hook || input.title || '').trim();
	const lineSize = line.length <= 45 ? 56 : line.length <= 80 ? 48 : 40;

	const IMG_H = 1000;
	const imageBlock = input.imageBase64
		? `<img src="${input.imageBase64}" width="960" height="${IMG_H}" style="width:960px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="display:flex;width:960px;height:${IMG_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"></div>`;

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;align-items:center;justify-content:center;">

  <div style="display:flex;flex-direction:column;align-items:center;width:960px;">

    <!-- Große Illustration, gerundet, randlos-warm -->
    <div style="display:flex;width:960px;height:${IMG_H}px;border-radius:40px;overflow:hidden;box-shadow:0 24px 70px rgba(60,40,20,0.20);">
      ${imageBlock}
    </div>

    <!-- EIN kurzer, persönlicher Satz -->
    <div style="display:flex;font-family:'Newsreader';font-size:${lineSize}px;font-weight:400;color:${INK};line-height:1.3;margin-top:56px;width:960px;">
      ${esc(line)}
    </div>

    <!-- Winziges nureine.de, dezent rechts -->
    <div style="display:flex;width:960px;margin-top:40px;">
      <div style="display:flex;flex:1;"></div>
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};letter-spacing:0.02em;">nureine.de</div>
    </div>

  </div>

</body></html>`;
}
