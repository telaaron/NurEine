/**
 * Empfehlungs-Karte (1080×1920, 9:16) — Hybrid: stellt NurEine vor UND zeigt eine
 * konkrete Geschichte als Beweis. Für den Teilen-Generator (/teilen): jemand
 * empfiehlt NurEine weiter, das Asset selbst trägt die Botschaft (weil der
 * Begleittext oft nicht gelesen wird, z.B. im WhatsApp-Status).
 *
 * Aufbau: Marken-Kopf (Logo + Tagline für die Zielgruppe) → Beispiel-Story
 * (Bild + Titel + Wirkung-Badge) → Call-to-Action mit Link.
 */

const W = 1080;
const H = 1920;
const CANVAS = '#f4efe6';
const INK = '#16140f';
const MUTED = '#6b6359';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';

export interface RecommendCardInput {
	tagline: string;       // zielgruppen-spezifischer Aufmacher
	storyTitle: string;
	storySubtitle?: string | null;
	impactScore?: number | null;
	category?: string;
	imageBase64: string | null;
	logoDataUri?: string | null;
	linkLabel: string;     // z.B. "nureine.de" oder "nureine.de/?ref=anna"
}

const CAT_LABELS: Record<string, string> = {
	klima: 'Klima', gesundheit: 'Gesundheit', wissenschaft: 'Wissenschaft',
	gemeinschaft: 'Gemeinschaft', tiere: 'Tiere', kultur: 'Kultur', innovation: 'Innovation'
};

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildRecommendCard(input: RecommendCardInput): string {
	const { tagline, storyTitle, storySubtitle, impactScore, category, imageBase64, logoDataUri, linkLabel } = input;
	const catLabel = category ? (CAT_LABELS[category] || category).toUpperCase() : '';
	const tSize = tagline.length <= 38 ? 60 : tagline.length <= 64 ? 50 : 42;
	const hSize = storyTitle.length <= 42 ? 50 : storyTitle.length <= 72 ? 42 : 36;
	const dek = storySubtitle && storySubtitle.length > 130 ? storySubtitle.slice(0, 129) + '…' : (storySubtitle || '');

	const IMG_H = 620;
	const imageBlock = imageBase64
		? `<img src="${imageBase64}" width="900" height="${IMG_H}" style="width:900px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="display:flex;width:900px;height:${IMG_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"></div>`;

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;align-items:center;justify-content:center;">

  <div style="display:flex;flex-direction:column;align-items:center;width:900px;">

    <!-- Marken-Kopf -->
    <div style="display:flex;align-items:center;margin-bottom:18px;width:900px;">
      ${logoDataUri ? `<img src="${logoDataUri}" width="54" height="54" style="width:54px;height:54px;" />` : ''}
      <div style="font-family:'Space Grotesk';font-size:40px;font-weight:700;color:${INK};margin-left:16px;">NurEine</div>
      <div style="display:flex;flex:1;"></div>
      <div style="font-family:'Inter';font-size:26px;font-weight:600;color:${FAINT};">Gute Nachrichten</div>
    </div>

    <!-- Zielgruppen-Tagline (trägt die Botschaft) -->
    <div style="display:flex;font-family:'Newsreader';font-size:${tSize}px;font-weight:600;color:${INK};line-height:1.2;width:900px;margin-bottom:34px;">
      ${esc(tagline)}
    </div>

    <!-- Beispiel-Story als Beweis -->
    <div style="display:flex;position:relative;width:900px;height:${IMG_H}px;">
      <div style="display:flex;width:900px;height:${IMG_H}px;border-radius:32px;overflow:hidden;box-shadow:0 22px 60px rgba(60,40,20,0.18);">
        ${imageBlock}
      </div>
      ${catLabel ? `<div style="position:absolute;display:flex;top:24px;left:24px;background:rgba(251,248,241,0.94);border-radius:100px;padding:10px 24px;"><div style="font-family:'Inter';font-size:22px;font-weight:600;letter-spacing:0.12em;color:${AMBER};">${catLabel}</div></div>` : ''}
    </div>

    <div style="display:flex;font-family:'Space Grotesk';font-size:${hSize}px;font-weight:700;color:${INK};line-height:1.1;letter-spacing:-0.02em;margin-top:30px;width:900px;">
      ${esc(storyTitle)}
    </div>
    ${dek ? `<div style="display:flex;font-family:'Newsreader';font-size:30px;font-weight:400;color:${MUTED};line-height:1.32;margin-top:18px;width:900px;">${esc(dek)}</div>` : ''}

    ${impactScore ? `<div style="display:flex;align-items:center;margin-top:24px;width:900px;"><div style="font-family:'Inter';font-size:26px;font-weight:600;color:${MUTED};">Wirkung ${impactScore}/100 · geprüft & werbefrei</div></div>` : ''}

    <!-- Call-to-Action mit Link -->
    <div style="display:flex;align-items:center;justify-content:center;margin-top:34px;width:900px;background:${AMBER};border-radius:100px;padding:26px 0;">
      <div style="font-family:'Inter';font-size:32px;font-weight:700;color:#fff;letter-spacing:0.01em;">Eine Geschichte am Tag → ${esc(linkLabel)}</div>
    </div>

  </div>

</body></html>`;
}
