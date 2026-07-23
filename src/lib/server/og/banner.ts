/**
 * Marken-Banner (Kampagne/Social/LinkedIn) via Satori — gleiche Design-DNA wie
 * das Story-OG-Image (src/lib/server/og/template.ts): warmer Creme-Canvas,
 * Papier-Glow, Amber-Kreis, Leuchtturm-Logo, Space-Grotesk-Headline mit
 * Amber-Newsreader-Kursiv-Akzent, "nureine.de" schwach.
 *
 * Bewusst OHNE Story-Bild — das ist der Marken-Banner, kein Story-Teaser.
 *
 * Formate:
 *   'cover' 1128×191 — LinkedIn-Firmen-Cover (5.9:1, sehr flach! eine Zeile)
 *   'wide'  1200×628 — Social-Share / Post-Bild (mehr Luft, mit Subline)
 */

const CANVAS = '#f4efe6';
const PAPER = '#faf6ee';
const INK = '#16140f';
const INK_SOFT = '#2a2620';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';
const AMBER_DEEP = '#a2572c';

export type BannerSize = 'wide' | 'cover';

export interface BannerInput {
	/** Erster Teil der Headline (schwarz). */
	line1: string;
	/** Zweiter Teil, direkt hinter line1 (schwarz). */
	line2: string;
	/** Kursiver Amber-Akzent am Ende (z.B. "exakt eine."). */
	line2Accent: string;
	/** Subline (nur im wide-Format sichtbar). */
	sub: string;
	size?: BannerSize;
	logoDataUri?: string | null;
}

function esc(t: string): string {
	return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * LinkedIn-Firmen-Cover: 1128×191 (5.9:1). Alles vertikal zentriert, EINE
 * Headline-Zeile, Grundlinien via align-items:baseline exakt bündig (Space
 * Grotesk + Newsreader haben verschiedene Grundlinien — das war der Höhen-Bug).
 * Logo NICHT unten links (dort sitzt LinkedIns Logo-Overlay) → in der Marke-Zeile.
 */
function coverTemplate(i: BannerInput, logo: string): string {
	return `<!DOCTYPE html>
<html>
<body style="margin:0;width:1128px;height:191px;background:${CANVAS};font-family:'Inter';display:flex;position:relative;overflow:hidden;">
  <div style="position:absolute;display:flex;top:-70%;left:-6%;width:60%;height:240%;background:${PAPER};border-radius:50%;opacity:0.6;"></div>
  <div style="position:absolute;display:flex;top:21px;right:74px;width:150px;height:150px;border-radius:150px;background:linear-gradient(155deg,#c8824c 0%,${AMBER_DEEP} 100%);"></div>
  <div style="position:absolute;display:flex;flex-direction:column;left:64px;top:36px;">
    <div style="display:flex;align-items:center;margin-bottom:12px;">
      ${logo}
      <div style="font-family:'Space Grotesk';font-size:21px;font-weight:700;color:${INK};margin-left:11px;letter-spacing:-0.02em;">NurEine</div>
    </div>
    <div style="display:flex;align-items:baseline;">
      <div style="font-family:'Space Grotesk';font-size:40px;font-weight:700;color:${INK};letter-spacing:-0.03em;">${esc(i.line1)} ${esc(i.line2)}</div>
      <div style="font-family:'Newsreader';font-style:italic;font-size:42px;font-weight:600;color:${AMBER};letter-spacing:-0.01em;margin-left:14px;">${esc(i.line2Accent)}</div>
    </div>
  </div>
  <div style="position:absolute;display:flex;right:270px;bottom:20px;font-family:'Inter';font-size:15px;color:${FAINT};">nureine.de</div>
</body>
</html>`;
}

/** Breites Format (Social-Share / Post-Bild): 1200×628, mit Subline. */
function wideTemplate(i: BannerInput, logo: string): string {
	return `<!DOCTYPE html>
<html>
<body style="margin:0;width:1200px;height:628px;background:${CANVAS};font-family:'Inter';display:flex;position:relative;overflow:hidden;">
  <div style="position:absolute;display:flex;top:-30%;left:-10%;width:70%;height:120%;background:${PAPER};border-radius:50%;opacity:0.55;"></div>
  <div style="position:absolute;display:flex;top:115px;left:710px;width:370px;height:370px;border-radius:370px;background:linear-gradient(155deg,#c07a44 0%,${AMBER_DEEP} 100%);"></div>
  <div style="position:absolute;display:flex;flex-direction:column;left:96px;top:0;height:628px;justify-content:center;">
    <div style="display:flex;align-items:center;margin-bottom:44px;">
      ${logo}
      <div style="font-family:'Space Grotesk';font-size:30px;font-weight:700;color:${INK};margin-left:14px;letter-spacing:-0.02em;">NurEine</div>
    </div>
    <div style="display:flex;font-family:'Space Grotesk';font-size:84px;font-weight:700;color:${INK};letter-spacing:-0.03em;line-height:1;">${esc(i.line1)}</div>
    <div style="display:flex;align-items:baseline;margin-top:12px;">
      <div style="font-family:'Space Grotesk';font-size:84px;font-weight:700;color:${INK};letter-spacing:-0.03em;line-height:1;">${esc(i.line2)}</div>
      <div style="font-family:'Newsreader';font-style:italic;font-size:88px;font-weight:600;color:${AMBER};line-height:1;margin-left:20px;">${esc(i.line2Accent)}</div>
    </div>
    <div style="display:flex;width:56px;height:4px;border-radius:2px;background:${INK};margin-top:40px;margin-bottom:26px;"></div>
    <div style="display:flex;font-family:'Inter';font-size:31px;font-weight:400;color:${INK_SOFT};">${esc(i.sub)}</div>
  </div>
  <div style="position:absolute;display:flex;right:96px;bottom:88px;font-family:'Inter';font-size:26px;font-weight:400;color:${FAINT};">nureine.de</div>
</body>
</html>`;
}

export function buildBannerTemplate(input: BannerInput): string {
	const size = input.size || 'wide';
	const logoH = size === 'cover' ? 34 : 52;
	const logoW = Math.round(logoH * 0.7);
	const logo = input.logoDataUri
		? `<img src="${input.logoDataUri}" width="${logoW}" height="${logoH}" style="width:${logoW}px;height:${logoH}px;" />`
		: `<div style="display:flex;width:${logoW}px;height:${logoH}px;background:${INK};border-radius:6px 6px 22px 22px;"></div>`;
	return size === 'cover' ? coverTemplate(input, logo) : wideTemplate(input, logo);
}
