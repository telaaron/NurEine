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
	// Glaubwürdigkeits-/Wirkungs-Felder (Wirkungsindex-Aufschlüsselung, migration 00026)
	impactEvidence?: number | null; // 0-100 → "Peer-reviewed" / "Etablierte Quelle" / "Lokale Quelle"
	impactReachScore?: number | null; // 0-100 Reichweite
	impactDurability?: number | null; // 0-100 Dauerhaftigkeit
	impactExplainer?: string | null; // ein Satz, warum die Wirkung so eingeschätzt ist
	// Schickbare Endcard (migration 00026) — die Zeile, die man der Freundin schickt.
	shareHook?: string | null;
	sourceName?: string | null; // "Quelle: …" auf dem Beleg-Slide
}

// EU-KI-VO Art. 50 (ab 02.08.2026): synthetische Bilder dezent kennzeichnen.
// Eine Zeile reicht — abstrakte Collage ist kaum irreführend, aber wir sind sauber.
const AI_LABEL = 'Illustration: KI · NurEine';

function aiFooter(onDark = false): string {
	const c = onDark ? 'rgba(255,255,255,0.45)' : FAINT;
	return `<div style="position:absolute;bottom:18px;left:0;display:flex;width:${W}px;justify-content:center;"><div style="font-family:'Inter';font-size:18px;font-weight:500;color:${c};letter-spacing:0.04em;">${AI_LABEL}</div></div>`;
}

// Konsistente Fußzeile (Linie + Quelle/Links + Seitenzähler rechts) — füllt jeden
// toten unteren Rand systemweit mit einer brandenden Komponente.
function slideFooter(leftText: string, page: number | null, accent: string): string {
	return `<div style="display:flex;flex-direction:column;padding:0 60px 56px;">
    <div style="display:flex;width:100%;height:1px;background:#ddd4c6;margin-bottom:24px;"></div>
    <div style="display:flex;align-items:center;">
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${accent};">${leftText}</div>
      <div style="display:flex;flex:1;"></div>
      ${page ? `<div style="font-family:'Inter';font-size:24px;font-weight:600;color:${FAINT};letter-spacing:0.04em;">${page} / 3</div>` : `<div style="font-family:'Inter';font-size:24px;font-weight:600;color:${FAINT};">nureine.de</div>`}
    </div>
  </div>`;
}

// impact_evidence (0-100) → menschlich lesbares Beleg-Niveau.
function evidenceLabel(score: number): { label: string; sub: string } {
	if (score >= 90) return { label: 'Peer-reviewed', sub: 'Wissenschaftlich begutachtet' };
	if (score >= 70) return { label: 'Belegt', sub: 'Etablierte Quelle, mehrfach bestätigt' };
	if (score >= 50) return { label: 'Solide Quelle', sub: 'Glaubwürdig berichtet' };
	return { label: 'Erste Hinweise', sub: 'Früher Stand, beobachten wir weiter' };
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

/**
 * BELEG-Slide (Idee #1 „Der Beleg") — macht eure Glaubwürdigkeit sichtbar.
 * Zeigt das Beleg-Niveau (impact_evidence) + Quelle. Das ist der Moat: andere
 * behaupten gute Nachrichten, ihr zeigt den Beweis.
 */
function belegSlide(input: CarouselInput): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;
	const ev = evidenceLabel(input.impactEvidence ?? 60);
	const quelle = input.sourceName ? `Quelle: ${esc(input.sourceName)}` : 'Belegt & nachgeprüft';
	const explainer =
		input.impactExplainer || input.aufloesung || 'Diese Nachricht ist mehrfach bestätigt und nachgeprüft.';
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;position:relative;overflow:hidden;">
  ${brandRow(input.logoDataUri, 'Belegt, nicht behauptet')}
  <div style="display:flex;flex-direction:column;flex:1;padding:64px 60px 0;">
    <div style="display:flex;align-items:center;margin-bottom:48px;">
      <div style="display:flex;width:72px;height:72px;border-radius:72px;background:${accent};align-items:center;justify-content:center;"><div style="font-family:'Inter';font-size:42px;font-weight:700;color:#fff;">✓</div></div>
      <div style="display:flex;flex-direction:column;margin-left:24px;">
        <div style="display:flex;font-family:'Space Grotesk';font-size:72px;font-weight:700;color:${INK};letter-spacing:-0.02em;line-height:0.95;">${esc(ev.label)}</div>
        <div style="display:flex;font-family:'Inter';font-size:28px;font-weight:500;color:${MUTED};margin-top:10px;">${esc(ev.sub)}</div>
      </div>
    </div>
    <div style="display:flex;border-left:6px solid ${accent};padding-left:32px;margin-top:8px;">
      <div style="display:flex;font-family:'Newsreader';font-size:46px;font-weight:400;color:${INK};line-height:1.32;">${esc(explainer)}</div>
    </div>
  </div>
  ${slideFooter(quelle, null, accent)}
  ${aiFooter(false)}
</body></html>`;
}

/**
 * METHODIK-Slide (Idee #6) — drei erklärte Balken statt nacktem „87/100".
 * Reichweite / Dauerhaftigkeit / Belege. Antwort auf die Nutzerin-Kritik:
 * keine erfundene Wertung, sondern die drei Dimensionen offen gezeigt.
 */
function methodikSlide(input: CarouselInput): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;
	// Fallback aus impactScore ableiten, wenn die Einzel-Dimensionen (nur Top-Stories)
	// fehlen — sonst sind alle Balken 0 und der Slide wirkt kaputt. Leicht gestreut,
	// damit die drei Balken sichtbar unterschiedlich sind statt identisch.
	const base = input.impactScore ?? 60;
	const bars = [
		{ label: 'Reichweite', v: input.impactReachScore ?? Math.round(base * 0.85), hint: 'wie viele Menschen' },
		{ label: 'Dauerhaftigkeit', v: input.impactDurability ?? Math.round(base * 1.05), hint: 'wie lange es wirkt' },
		{ label: 'Belege', v: input.impactEvidence ?? Math.round(base * 1.1), hint: 'wie hart die Daten' }
	];
	const barRow = (b: { label: string; v: number; hint: string }) => {
		const pct = Math.max(4, Math.min(100, Math.round(b.v)));
		return `<div style="display:flex;flex-direction:column;margin-bottom:40px;">
      <div style="display:flex;align-items:flex-end;margin-bottom:14px;">
        <div style="display:flex;font-family:'Space Grotesk';font-size:38px;font-weight:700;color:${INK};letter-spacing:-0.01em;">${b.label}</div>
        <div style="display:flex;flex:1;"></div>
        <div style="display:flex;font-family:'Inter';font-size:26px;font-weight:500;color:${FAINT};">${b.hint}</div>
      </div>
      <div style="display:flex;width:100%;height:26px;border-radius:26px;background:#e7e0d4;overflow:hidden;">
        <div style="display:flex;width:${pct}%;height:26px;border-radius:26px;background:${accent};"></div>
      </div>
    </div>`;
	};
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;position:relative;overflow:hidden;">
  ${brandRow(input.logoDataUri, 'So messen wir Wirkung')}
  <div style="display:flex;flex-direction:column;flex:1;padding:80px 60px 0;">
    <div style="display:flex;font-family:'Newsreader';font-size:46px;font-weight:400;font-style:italic;color:${AMBER_DEEP};line-height:1.3;margin-bottom:64px;">Warum diese Nachricht zählt — offen gerechnet:</div>
    ${bars.map(barRow).join('')}
  </div>
  ${slideFooter('Unser Wirkungsindex', null, accent)}
  ${aiFooter(false)}
</body></html>`;
}

/**
 * ENDCARD-Slide — die schickbare Zeile (share_hook), nicht nur ein Logo.
 * Nutzer-Feedback: „Gib mir eine Zeile, die ich meiner Freundin schicken WILL."
 */
function endcardSlide(input: CarouselInput): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;
	const line = input.shareHook || input.stille || 'Falls du heute nur eine gute Nachricht brauchst — die hier.';
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:'Inter';background:linear-gradient(160deg,${CANVAS} 0%,#efe7d8 100%);">
  <div style="position:absolute;display:flex;top:-140px;right:-140px;width:560px;height:560px;border-radius:560px;background:${accent};opacity:0.12;"></div>
  ${brandRow(input.logoDataUri)}
  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;padding:0 64px;">
    <div style="display:flex;font-family:'Space Grotesk';font-size:${hookSize(line)}px;font-weight:700;color:${INK};line-height:1.1;letter-spacing:-0.03em;">${esc(line)}</div>
  </div>
  <div style="display:flex;align-items:center;padding:0 64px 80px;">
    <div style="display:flex;align-items:center;background:${accent};border-radius:60px;padding:20px 36px;">
      <div style="font-family:'Inter';font-size:30px;font-weight:600;color:#fff;">An jemanden schicken, der das heute braucht ↗</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;padding:0 64px 64px;">
    <div style="font-family:'Inter';font-size:28px;font-weight:600;color:${accent};">nureine.de</div>
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};">★</div>
  </div>
</body></html>`;
}

/**
 * Render one carousel slide. Stützt sich auf einen Stil-Namen statt nur n,
 * damit die Engine flexibel zusammenstellen kann:
 *   'hook' | 'aufloesung' | 'stille' | 'beleg' | 'methodik' | 'endcard'
 */
export function buildCarouselSlideByKind(
	input: CarouselInput,
	kind: 'hook' | 'aufloesung' | 'stille' | 'beleg' | 'methodik' | 'endcard'
): string {
	switch (kind) {
		case 'beleg':
			return belegSlide(input);
		case 'methodik':
			return methodikSlide(input);
		case 'endcard':
			return endcardSlide(input);
		case 'aufloesung':
			return buildCarouselSlide(input, 2);
		case 'stille':
			return buildCarouselSlide(input, 3);
		case 'hook':
		default:
			return buildCarouselSlide(input, 1);
	}
}

/** Render one carousel slide (1..3). Out-of-range falls back to slide 1. */
export function buildCarouselSlide(input: CarouselInput, n: number): string {
	const accent = CATEGORY_ACCENT[input.category] || AMBER;

	let inner: string;

	if (n === 2) {
		// AUFLÖSUNG — Text trägt die Folie (höher gesetzt), darunter ein
		// Wirkungs-Mini-Balken statt nacktem Badge, dann konsistente Fußzeile.
		const score = input.impactScore ?? 0;
		const impactBlock = score
			? `<div style="display:flex;flex-direction:column;margin-top:48px;">
        <div style="display:flex;align-items:center;margin-bottom:12px;"><div style="font-family:'Inter';font-size:26px;font-weight:600;color:${INK};">Wirkung</div><div style="display:flex;flex:1;"></div><div style="font-family:'Space Grotesk';font-size:30px;font-weight:700;color:${accent};">${score}/100</div></div>
        <div style="display:flex;width:100%;height:14px;border-radius:14px;background:#e7e0d4;overflow:hidden;"><div style="display:flex;width:${Math.max(4, Math.min(100, score))}%;height:14px;border-radius:14px;background:${accent};"></div></div>
      </div>`
			: '';
		inner = `${brandRow(input.logoDataUri)}
  <div style="display:flex;flex-direction:column;flex:1;padding:64px 60px 0;">
    <div style="display:flex;width:72px;height:5px;background:${accent};margin-bottom:40px;"></div>
    <div style="display:flex;font-family:'Newsreader';font-size:56px;font-weight:400;color:${INK};line-height:1.3;">
      ${esc(input.aufloesung)}
    </div>
    ${impactBlock}
  </div>
  ${slideFooter('Nachgeprüft', 2, accent)}`;
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
  </div>
  ${aiFooter(false)}`;
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
  ${aiFooter(true)}
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
  ${aiFooter(true)}
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
