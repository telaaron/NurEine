/**
 * Reel-Frames (9:16, 1080×1920) für "Atmendes Papier v2" — die durch Experte ↔
 * echte Nutzerin validierten DREI Reel-Typen. Diese Datei rendert nur die STAND-
 * BILDER (PNG) pro Typ; die Bewegung (Ken-Burns, Fades, Audio) macht ffmpeg
 * (scripts/render_reel.py) darüber. So bleibt der Text markenidentisch zu den
 * Carousels (gleiche Satori-Pipeline) und es gibt KEIN libass/Font-Risiko.
 *
 * Router (aus ig_hook_type, migration 00033):
 *   zahl, kontrast  → Typ C "Zahl zählt hoch"
 *   wow, sieg       → Typ A "Satz auf Schwarz"
 *   mensch, charme  → Typ B "Atmendes Bild" (Bild BEWUSST stilisiert, ehrlich-KI)
 *
 * Jeder Typ liefert benannte Frames; render_reel.py kennt die Reihenfolge/Dauer.
 */

const W = 1080;
const H = 1920;
const CANVAS = '#f4efe6';
const INK = '#16140f';
const MUTED = '#6b6359';
const AMBER = '#bd6a35';
const AMBER_DEEP = '#9c5527';

const CATEGORY_ACCENT: Record<string, string> = {
	klima: '#56764e',
	gesundheit: '#b06f6f',
	wissenschaft: '#5d7e9c',
	gemeinschaft: '#bd6a35',
	tiere: '#56764e',
	kultur: '#bd6a35',
	innovation: '#5d7e9c'
};

export type ReelType = 'A' | 'B' | 'C';
export type ReelFrame = 'hook' | 'aufloesung' | 'endcard';

export function reelTypeForHook(hookType: string | null): ReelType {
	switch (hookType) {
		case 'zahl':
		case 'kontrast':
			return 'C';
		case 'mensch':
		case 'charme':
			return 'B';
		case 'wow':
		case 'sieg':
		default:
			return 'A';
	}
}

export interface ReelFrameInput {
	hook: string;
	aufloesung: string;
	shareHook: string; // schickbare Endcard-Zeile (Nutzer-Feedback)
	category: string;
	heroNumber?: string | null; // Typ C
	heroUnit?: string | null; // "Menschen", "Bäume" …
	placeStamp?: string | null; // "Nepal · 2026" — erdet die abstrakte Collage
	imageBase64?: string | null; // Typ B
	logoDataUri?: string | null;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fitSize(text: string, big: number, mid: number, small: number): number {
	const n = text.length;
	if (n <= 50) return big;
	if (n <= 95) return mid;
	return small;
}

function logoLine(logoDataUri: string | null | undefined, onDark: boolean): string {
	const color = onDark ? '#fff' : INK;
	const inner = logoDataUri
		? onDark
			? `<div style="display:flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:54px;background:#fff;"><img src="${logoDataUri}" width="36" height="36" style="width:36px;height:36px;" /></div>`
			: `<img src="${logoDataUri}" width="44" height="44" style="width:44px;height:44px;" />`
		: '';
	return `<div style="display:flex;align-items:center;">${inner}<div style="font-family:'Space Grotesk';font-size:34px;font-weight:700;color:${color};margin-left:12px;letter-spacing:-0.02em;">NurEine</div></div>`;
}

function placeRow(stamp: string | null | undefined, onDark: boolean): string {
	if (!stamp) return '';
	const c = onDark ? 'rgba(255,255,255,0.75)' : AMBER;
	return `<div style="display:flex;font-family:'Inter';font-size:28px;font-weight:600;color:${c};letter-spacing:0.06em;margin-bottom:24px;">${esc(stamp)}</div>`;
}

const AI_LABEL = `<div style="position:absolute;bottom:120px;left:0;display:flex;width:${W}px;justify-content:center;"><div style="font-family:'Inter';font-size:20px;font-weight:500;color:rgba(120,112,100,0.6);letter-spacing:0.04em;">Illustration: KI · NurEine</div></div>`;

// ─── TYP A: Satz auf Schwarz ────────────────────────────────────────────────
function typeA(input: ReelFrameInput, frame: ReelFrame): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;
	if (frame === 'aufloesung') {
		return wrap(
			CANVAS,
			`<div style="display:flex;width:84px;height:6px;background:${accent};margin:0 0 36px 72px;"></div>
       <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 72px;">
         <div style="display:flex;font-family:'Newsreader';font-size:${fitSize(input.aufloesung, 64, 52, 44)}px;font-weight:400;color:${INK};line-height:1.34;">${esc(input.aufloesung)}</div>
       </div>`
		);
	}
	if (frame === 'endcard') return endcard(input);
	// hook — voller Satz SOFORT auf Schwarz, kein Aufbau. Oben Brand-Lockup +
	// dezenter angeschnittener Akzent-Kreis, damit der obere Crop nicht tot wirkt.
	return wrapRaw(
		'#16140f',
		`<div style="position:absolute;display:flex;top:-180px;right:-220px;width:620px;height:620px;border-radius:620px;background:${accent};opacity:0.14;"></div>
     <div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;width:${W}px;height:${H}px;">
       <div style="display:flex;flex-direction:column;padding:72px 72px 0;">
         ${logoLine(input.logoDataUri, true)}
         <div style="display:flex;font-family:'Inter';font-size:26px;font-weight:500;color:rgba(255,255,255,0.5);letter-spacing:0.06em;margin-top:10px;margin-left:66px;">GUTE NACHRICHTEN · BELEGT</div>
       </div>
       <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 72px;">
         ${placeRow(input.placeStamp, true)}
         <div style="display:flex;font-family:'Space Grotesk';font-size:${fitSize(input.hook, 92, 74, 60)}px;font-weight:700;color:#fff;line-height:1.08;letter-spacing:-0.03em;">${esc(input.hook)}</div>
         <div style="display:flex;width:120px;height:7px;background:${accent};margin-top:40px;"></div>
       </div>
     </div>`
	);
}

// ─── TYP B: Atmendes Bild (Bild stilisiert = ehrlich künstlich) ─────────────
function typeB(input: ReelFrameInput, frame: ReelFrame): string {
	if (frame === 'aufloesung') {
		// Bild stark gedimmt, Text trägt.
		const bg = input.imageBase64
			? `<img src="${input.imageBase64}" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;object-fit:cover;opacity:0.22;" />`
			: '';
		return wrapRaw(
			CANVAS,
			`${bg}<div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;width:${W}px;height:${H}px;justify-content:center;padding:0 72px;">
         <div style="display:flex;font-family:'Newsreader';font-size:${fitSize(input.aufloesung, 62, 52, 44)}px;font-weight:400;color:${INK};line-height:1.34;">${esc(input.aufloesung)}</div>
       </div>`
		);
	}
	if (frame === 'endcard') return endcard(input);
	// hook — Bild vollflächig, Verlauf unten, Satz im unteren Drittel.
	const img = input.imageBase64
		? `<img src="${input.imageBase64}" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;object-fit:cover;" />`
		: `<div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${H}px;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"></div>`;
	return wrapRaw(
		'#16140f',
		`${img}
     <div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${H}px;background:linear-gradient(180deg,rgba(18,16,11,0.5) 0%,rgba(18,16,11,0.05) 38%,rgba(18,16,11,0.45) 72%,rgba(18,16,11,0.82) 100%);"></div>
     <div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;width:${W}px;height:${H}px;">
       <div style="display:flex;flex-direction:column;padding:72px 72px 0;">${logoLine(input.logoDataUri, true)}</div>
       <div style="display:flex;flex:1;"></div>
       <div style="display:flex;flex-direction:column;padding:0 72px 200px;">
         ${placeRow(input.placeStamp, true)}
         <div style="display:flex;font-family:'Space Grotesk';font-size:${fitSize(input.hook, 80, 66, 54)}px;font-weight:700;color:#fff;line-height:1.1;letter-spacing:-0.02em;text-shadow:0 2px 24px rgba(0,0,0,0.5);">${esc(input.hook)}</div>
       </div>
     </div>
     ${AI_LABEL}`
	);
}

// ─── TYP C: Zahl zählt hoch (echte Story-Zahl, kein Pseudo-Score) ───────────
function typeC(input: ReelFrameInput, frame: ReelFrame): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;
	if (frame === 'aufloesung') {
		return wrap(
			CANVAS,
			`<div style="display:flex;width:84px;height:6px;background:${accent};margin:0 0 36px 72px;"></div>
       <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 72px;">
         <div style="display:flex;font-family:'Newsreader';font-size:${fitSize(input.aufloesung, 62, 52, 44)}px;font-weight:400;color:${INK};line-height:1.34;">${esc(input.aufloesung)}</div>
       </div>`
		);
	}
	if (frame === 'endcard') return endcard(input);
	// hook — echte Zahl riesig auf farbigem Grund. Einheit auf gleicher Baseline
	// rechts neben der Zahl ("50 Mio. Afrikaner" = eine optische Einheit).
	const num = esc(input.heroNumber || '');
	const numSize = num.length <= 4 ? 360 : num.length <= 7 ? 260 : 190;
	return wrapRaw(
		accent,
		`<div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${H}px;background:linear-gradient(160deg,${accent} 0%,#16140f 240%);"></div>
     <div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;width:${W}px;height:${H}px;">
       <div style="display:flex;flex-direction:column;padding:72px 72px 0;">${logoLine(input.logoDataUri, true)}</div>
       <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 72px;">
         ${placeRow(input.placeStamp, true)}
         <div style="display:flex;align-items:baseline;flex-wrap:wrap;">
           <div style="display:flex;font-family:'Space Grotesk';font-size:${numSize}px;font-weight:700;color:#fff;line-height:0.9;letter-spacing:-0.04em;">${num}</div>
           ${input.heroUnit ? `<div style="display:flex;font-family:'Inter';font-size:52px;font-weight:600;color:rgba(255,255,255,0.92);margin-left:24px;">${esc(input.heroUnit)}</div>` : ''}
         </div>
         <div style="display:flex;font-family:'Newsreader';font-size:44px;font-weight:400;color:rgba(255,255,255,0.88);line-height:1.25;margin-top:38px;max-width:880px;">${esc(input.hook)}</div>
       </div>
     </div>`
	);
}

// ─── geteilte Endcard (schickbar, share_hook) ───────────────────────────────
function endcard(input: ReelFrameInput): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;
	const line = input.shareHook || 'Falls du heute nur eine gute Nachricht brauchst — die hier.';
	return wrapRaw(
		CANVAS,
		`<div style="position:absolute;display:flex;top:-160px;right:-160px;width:620px;height:620px;border-radius:620px;background:${accent};opacity:0.12;"></div>
     <div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;width:${W}px;height:${H}px;">
       <div style="display:flex;flex-direction:column;padding:72px 72px 0;">${logoLine(input.logoDataUri, false)}</div>
       <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 72px;">
         <div style="display:flex;font-family:'Space Grotesk';font-size:${fitSize(line, 72, 58, 48)}px;font-weight:700;color:${INK};line-height:1.12;letter-spacing:-0.03em;">${esc(line)}</div>
       </div>
       <div style="display:flex;flex-direction:column;padding:0 72px 160px;">
         <div style="display:flex;align-items:center;background:${accent};border-radius:60px;padding:22px 40px;margin-bottom:24px;align-self:flex-start;"><div style="font-family:'Inter';font-size:32px;font-weight:600;color:#fff;">An jemanden schicken ↗</div></div>
         <div style="display:flex;font-family:'Inter';font-size:30px;font-weight:600;color:${AMBER_DEEP};">nureine.de</div>
       </div>
     </div>`
	);
}

function wrap(bg: string, inner: string): string {
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${bg};font-family:'Inter';display:flex;flex-direction:column;position:relative;overflow:hidden;">${inner}</body></html>`;
}
function wrapRaw(bg: string, inner: string): string {
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${bg};font-family:'Inter';display:flex;position:relative;overflow:hidden;">${inner}</body></html>`;
}

/** Render einen Reel-Frame als HTML (→ Satori → PNG im Endpoint). */
export function buildReelFrame(type: ReelType, frame: ReelFrame, input: ReelFrameInput): string {
	if (type === 'B') return typeB(input, frame);
	if (type === 'C') return typeC(input, frame);
	return typeA(input, frame);
}
