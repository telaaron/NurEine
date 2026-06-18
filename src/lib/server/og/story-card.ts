/**
 * 9:16 social story-card (1080×1920) for WhatsApp status / IG story.
 * Full-bleed story illustration on a warm canvas, with a brand header and a
 * headline + impact + nureine.de block at the bottom. Satori-rendered.
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

const W = 1080;
const H = 1920;
const CANVAS = '#f4efe6';
const MUTED = '#6b6359';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';

export interface StoryCardInput {
	title: string;
	dek: string;
	category: string;
	country?: string;
	impactScore?: number | null;
	emotion?: string | null;
	imageBase64: string | null;
	logoDataUri?: string | null;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Headline sits ON the image (first visual eindruck) → größer & weiß.
// Größer als die alte Footer-Headline, weil sie jetzt die Stop-Rate trägt.
function overlayHeadlineSize(title: string): number {
	const n = title.length;
	if (n <= 32) return 82;
	if (n <= 55) return 70;
	if (n <= 85) return 58;
	return 50;
}

// Zieht die erste markante Zahl aus dem Dek (z.B. "69%", "1.200", "3×").
// Eine Zahl ist der stärkste Stopper — die heben wir groß auf dem Bild hervor.
// Nur prozent-/multiplikator-/größenordnungs-Zahlen, keine nackten "5".
function extractStat(dek: string): string | null {
	const m = dek.match(/(\d[\d.,]*\s?(?:%|×|x|Mio\.?|Mrd\.?|Tsd\.?))/);
	return m ? m[1].trim() : null;
}

export function buildStoryCard(input: StoryCardInput): string {
	const { title, dek, category, impactScore, imageBase64, logoDataUri } = input;
	const accent = CATEGORY_ACCENT[category] || AMBER;
	const catLabel = (CATEGORY_LABELS[category] || category).toUpperCase();

	const dekShort = dek && dek.length > 130 ? dek.slice(0, 129) + '…' : (dek || '');
	const stat = extractStat(dek || '');

	// WhatsApp-Status verdeckt oben (~280px Header) + unten (~400px Caption/Buttons).
	// Darum: ALLES Wichtige in die sichere Mitte (y≈300–1480). Oben/unten nur Farbe.
	// Redesign: Headline liegt JETZT auf dem Bild (erster visueller Eindruck →
	// Stop-Rate), Bild größer. Darunter nur Hook-Zahl + Impact-Bar + Newsletter-CTA.
	const IMG_H = 920;
	const hSize = overlayHeadlineSize(title);

	const imageInner = imageBase64
		? `<img src="${imageBase64}" width="940" height="${IMG_H}" style="width:940px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="display:flex;width:940px;height:${IMG_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"><div style="font-family:'Space Grotesk';font-size:240px;font-weight:700;color:rgba(255,255,255,0.92);">N</div></div>`;

	// Satori kann kein text-shadow → dunkler Verlauf als Lese-Untergrund für die
	// weiße Headline am Bildboden. Deckt unteres Drittel, garantiert Kontrast.
	const scrim = `<div style="position:absolute;display:flex;left:0;bottom:0;width:940px;height:560px;background:linear-gradient(180deg,rgba(10,8,5,0) 0%,rgba(10,8,5,0.45) 45%,rgba(10,8,5,0.88) 100%);"></div>`;

	const impactPct = impactScore ? Math.max(0, Math.min(100, impactScore)) : 0;

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;align-items:center;justify-content:center;">

  <!-- ALLES in der sicheren Mitte (WA-Header/Footer verdecken Rand) -->
  <div style="display:flex;flex-direction:column;align-items:center;width:940px;">

    <!-- Bild + Headline-Overlay = erster visueller Eindruck (Stop-Hook) -->
    <div style="display:flex;position:relative;width:940px;height:${IMG_H}px;border-radius:36px;overflow:hidden;box-shadow:0 22px 60px rgba(60,40,20,0.22);">
      ${imageInner}
      ${scrim}

      <!-- Kategorie-Pill oben links -->
      <div style="position:absolute;display:flex;top:28px;left:28px;background:rgba(251,248,241,0.94);border-radius:100px;padding:12px 26px;">
        <div style="display:flex;width:12px;height:12px;border-radius:12px;background:${accent};margin-right:12px;margin-top:7px;"></div>
        <div style="font-family:'Inter';font-size:24px;font-weight:600;letter-spacing:0.12em;color:${accent};">${catLabel}</div>
      </div>

      <!-- Headline groß weiß am Bildboden -->
      <div style="position:absolute;display:flex;flex-direction:column;left:48px;right:48px;bottom:48px;width:844px;">
        ${stat ? `<div style="display:flex;font-family:'Space Grotesk';font-size:120px;font-weight:700;color:#f0b67a;line-height:0.95;letter-spacing:-0.04em;margin-bottom:8px;">${esc(stat)}</div>` : ''}
        <div style="display:flex;font-family:'Space Grotesk';font-size:${hSize}px;font-weight:700;color:#fff;line-height:1.04;letter-spacing:-0.03em;">${esc(title)}</div>
      </div>
    </div>

    <!-- Subtitle: das WARUM in einem Satz -->
    ${dekShort ? `<div style="display:flex;font-family:'Newsreader';font-size:32px;font-weight:400;color:${MUTED};line-height:1.32;margin-top:30px;width:940px;">${esc(dekShort)}</div>` : ''}

    <!-- Impact als selbsterklärender Balken (nicht "55/100" ohne Kontext) -->
    ${impactScore ? `<div style="display:flex;flex-direction:column;width:940px;margin-top:30px;">
      <div style="display:flex;align-items:center;justify-content:space-between;width:940px;margin-bottom:12px;">
        <div style="display:flex;font-family:'Inter';font-size:24px;font-weight:600;letter-spacing:0.08em;color:${FAINT};">WIRKUNG FÜR MENSCHEN</div>
        <div style="display:flex;font-family:'Space Grotesk';font-size:30px;font-weight:700;color:${accent};">${impactScore}/100</div>
      </div>
      <div style="display:flex;width:940px;height:16px;border-radius:100px;background:rgba(0,0,0,0.08);">
        <div style="display:flex;width:${Math.round((impactPct / 100) * 940)}px;height:16px;border-radius:100px;background:${accent};"></div>
      </div>
    </div>` : ''}

    <!-- Newsletter-CTA (echtes Conversion-Ziel, nicht eine getippte URL) -->
    <div style="display:flex;flex-direction:column;align-items:center;width:940px;background:${AMBER};border-radius:28px;padding:30px 0;margin-top:36px;">
      <div style="display:flex;font-family:'Space Grotesk';font-size:38px;font-weight:700;color:#fff;letter-spacing:-0.01em;">Täglich 1 gute Nachricht</div>
      <div style="display:flex;font-family:'Inter';font-size:28px;font-weight:600;color:rgba(255,255,255,0.92);margin-top:8px;">Kostenlos abonnieren → Link im Profil</div>
    </div>

    <!-- Brand klein als Footer (für Bestandskunden, kein Hook-Platz) -->
    <div style="display:flex;align-items:center;justify-content:center;width:940px;margin-top:24px;">
      ${logoDataUri ? `<img src="${logoDataUri}" width="34" height="34" style="width:34px;height:34px;" />` : ''}
      <div style="font-family:'Space Grotesk';font-size:26px;font-weight:700;color:${FAINT};margin-left:12px;">nureine.de</div>
    </div>

  </div>

</body></html>`;
}
