/**
 * Instagram-Carousel — drei 1080×1350 (4:5) Folien, die aufeinander aufbauen.
 *
 * Folie 1 — HOOK:        große Emotion auf warmem Grund, fast kein Bild. Stoppt das Scrollen.
 * Folie 2 — AUFLÖSUNG:   die Substanz, ruhig gesetzt, mit Wirkungs-Badge.
 * Folie 3 — STILLE:      das Story-Bild großflächig + ein letzter ruhiger Satz, klein nureine.de.
 *
 * Bewusst verspielter/wärmer als die OG-Karte — wir wirken wie ein Mensch,
 * der etwas teilt, nicht wie eine Institution. 4:5 ist das reichweitenstärkste
 * Feed-Format auf Instagram.
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
const PAPER = '#fbf8f1';
const INK = '#16140f';
const MUTED = '#6b6359';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';
const AMBER_DEEP = '#9c5527';

export interface CarouselInput {
	hook: string; // Folie 1
	aufloesung: string; // Folie 2
	stille: string; // Folie 3
	category: string;
	impactScore?: number | null;
	imageBase64: string | null;
	logoDataUri?: string | null;
	// Feed-Stopper-Optionen (Folie 1)
	heroNumber?: string | null; // z.B. "−60%", "603", "11 Mio" — für number-Variante
	hookStyle?: 'image' | 'number' | 'minimal'; // Default 'image' (vollflächiges Bild + Overlay)
}

// Dunkles Overlay für Bild-Hook (Text bleibt lesbar, Kontrast knallt im Feed).
const INK_OVERLAY = 'rgba(18,16,11,0.55)';

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hookSize(text: string): number {
	const n = text.length;
	if (n <= 40) return 96;
	if (n <= 70) return 78;
	if (n <= 110) return 62;
	return 52;
}

function logoMark(logoDataUri?: string | null, onDark = false): string {
	if (!logoDataUri) return '';
	// Auf dunklen/farbigen Folien: weißer Kreis hinter dem Logo → immer sichtbar.
	if (onDark) {
		return `<div style="display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:60px;background:#fff;">
      <img src="${logoDataUri}" width="40" height="40" style="width:40px;height:40px;" />
    </div>`;
	}
	return `<img src="${logoDataUri}" width="44" height="44" style="width:44px;height:44px;" />`;
}

function brandRow(logoDataUri?: string | null, right = 'Ehrlicher Fortschritt'): string {
	return `<div style="display:flex;align-items:center;padding:48px 60px 0;">
    ${logoMark(logoDataUri)}
    <div style="font-family:'Space Grotesk';font-size:36px;font-weight:700;color:${INK};margin-left:14px;letter-spacing:-0.02em;">NurEine</div>
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:22px;font-weight:500;color:${MUTED};letter-spacing:0.05em;">${right}</div>
  </div>`;
}

/** Render one carousel slide (1..3). Out-of-range falls back to slide 1. */
export function buildCarouselSlide(input: CarouselInput, n: number): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;

	let inner: string;

	if (n === 2) {
		// AUFLÖSUNG — Text trägt die Folie, ruhig, mit Wirkungs-Badge.
		inner = `${brandRow(input.logoDataUri)}
  <div style="display:flex;flex-direction:column;flex:1;padding:70px 60px 0;">
    <div style="display:flex;width:72px;height:5px;background:${accent};margin-bottom:44px;"></div>
    <div style="display:flex;font-family:'Newsreader';font-size:54px;font-weight:400;color:${INK};line-height:1.32;">
      ${esc(input.aufloesung)}
    </div>
  </div>
  <div style="display:flex;align-items:center;padding:0 60px 60px;">
    ${
		input.impactScore
			? `<div style="display:flex;align-items:center;"><div style="display:flex;width:14px;height:14px;border-radius:14px;background:${accent};margin-right:14px;"></div><div style="font-family:'Inter';font-size:28px;font-weight:600;color:${INK};">Wirkung ${input.impactScore}/100</div></div>`
			: ''
	}
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};">2 / 3</div>
  </div>`;
	} else if (n === 3) {
		// STILLE — Bild großflächig oben, ein ruhiger Satz, klein nureine.de.
		const imageBlock = input.imageBase64
			? `<img src="${input.imageBase64}" width="${W}" height="820" style="width:${W}px;height:820px;object-fit:cover;" />`
			: `<div style="display:flex;width:${W}px;height:820px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"><div style="font-family:'Space Grotesk';font-size:180px;font-weight:700;color:rgba(255,255,255,0.92);">N</div></div>`;
		inner = `<div style="display:flex;width:${W}px;height:820px;">${imageBlock}</div>
  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 64px;">
    <div style="display:flex;font-family:'Newsreader';font-style:italic;font-size:46px;font-weight:400;color:${AMBER_DEEP};line-height:1.34;">
      ${esc(input.stille)}
    </div>
  </div>
  <div style="display:flex;align-items:center;padding:0 64px 56px;">
    ${logoMark(input.logoDataUri, true)}
    <div style="font-family:'Inter';font-size:30px;font-weight:600;color:${AMBER};margin-left:12px;">nureine.de</div>
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};">3 / 3</div>
  </div>`;
	} else {
		// ── FOLIE 1: der DAUMEN-STOPPER ──────────────────────────────────────
		const style = input.hookStyle || (input.imageBase64 ? 'image' : 'number');
		const hSize = hookSize(input.hook);

		if (style === 'number' && input.heroNumber) {
			// VARIANTE B — Riesen-Zahl-Held auf gesättigter Markenfarbe.
			// Zahl stoppt + löst Staunen aus. Kontext klein drunter. Hoher Kontrast.
			const num = esc(input.heroNumber);
			const numSize = num.length <= 4 ? 360 : num.length <= 7 ? 260 : 190;
			return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;position:relative;overflow:hidden;background:linear-gradient(155deg,${accent} 0%,#16140f 230%);font-family:'Inter';">
  <div style="display:flex;align-items:center;padding:48px 60px 0;">
    ${logoMark(input.logoDataUri, true)}
    <div style="font-family:'Space Grotesk';font-size:36px;font-weight:700;color:#fff;margin-left:14px;letter-spacing:-0.02em;">NurEine</div>
  </div>
  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 60px;">
    <div style="display:flex;font-family:'Space Grotesk';font-size:${numSize}px;font-weight:700;color:#fff;line-height:0.9;letter-spacing:-0.04em;">${num}</div>
    <div style="display:flex;font-family:'Newsreader';font-size:48px;font-weight:400;color:rgba(255,255,255,0.92);line-height:1.25;margin-top:36px;max-width:880px;">${esc(input.hook)}</div>
  </div>
  <div style="display:flex;align-items:center;padding:0 60px 56px;">
    <div style="font-family:'Inter';font-size:26px;font-weight:600;color:rgba(255,255,255,0.85);">Wisch weiter →</div>
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:26px;font-weight:600;color:rgba(255,255,255,0.5);">1 / 3</div>
  </div>
</body></html>`;
		}

		if (style === 'image' && input.imageBase64) {
			// VARIANTE A — vollflächiges Bild + dunkler Gradient + heller Hook drauf.
			// Bild stoppt den Daumen, dunkles Overlay sichert Lesbarkeit, Amber-Akzent = Marke.
			return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;display:flex;position:relative;overflow:hidden;font-family:'Inter';">
  <img src="${input.imageBase64}" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;object-fit:cover;" />
  <div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${H}px;background:linear-gradient(180deg,rgba(18,16,11,0.45) 0%,rgba(18,16,11,0.0) 32%,rgba(18,16,11,0.35) 60%,${INK_OVERLAY} 100%);"></div>
  <div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;width:${W}px;height:${H}px;">
    <div style="display:flex;align-items:center;padding:48px 60px 0;">
      ${logoMark(input.logoDataUri, true)}
      <div style="font-family:'Space Grotesk';font-size:36px;font-weight:700;color:#fff;margin-left:14px;letter-spacing:-0.02em;">NurEine</div>
    </div>
    <div style="display:flex;flex:1;"></div>
    <div style="display:flex;width:84px;height:6px;background:${accent};margin:0 0 28px 60px;"></div>
    <div style="display:flex;font-family:'Space Grotesk';font-size:${hSize}px;font-weight:700;color:#fff;line-height:1.05;letter-spacing:-0.03em;padding:0 60px;text-shadow:0 2px 24px rgba(0,0,0,0.4);">${esc(input.hook)}</div>
    <div style="display:flex;align-items:center;padding:36px 60px 56px;">
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:rgba(255,255,255,0.85);">Wisch weiter →</div>
      <div style="display:flex;flex:1;"></div>
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:rgba(255,255,255,0.6);">1 / 3</div>
    </div>
  </div>
</body></html>`;
		}

		// FALLBACK — minimal (warm, kein Bild verfügbar).
		inner = `<div style="position:absolute;display:flex;top:-120px;right:-120px;width:520px;height:520px;border-radius:520px;background:linear-gradient(160deg,${AMBER} 0%,${AMBER_DEEP} 100%);opacity:0.16;"></div>
  ${brandRow(input.logoDataUri)}
  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 64px;">
    <div style="display:flex;font-family:'Space Grotesk';font-size:${hSize}px;font-weight:700;color:${INK};line-height:1.06;letter-spacing:-0.03em;">
      ${esc(input.hook)}
    </div>
  </div>
  <div style="display:flex;align-items:center;padding:0 64px 56px;">
    <div style="font-family:'Inter';font-size:26px;font-weight:500;color:${MUTED};">Wisch weiter →</div>
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};">1 / 3</div>
  </div>`;
	}

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;position:relative;overflow:hidden;">
  ${inner}
</body></html>`;
}
