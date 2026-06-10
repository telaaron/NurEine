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
const PAPER = '#fbf8f1';
const INK = '#16140f';
const MUTED = '#6b6359';
const FAINT = '#9a9087';
const AMBER = '#bd6a35';
const AMBER_DEEP = '#9c5527';

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

// Warmer, menschlicher Aufmacher statt institutionellem "Ehrlicher Fortschritt".
// Passt zur Emotion — die Karte soll wirken wie "hey, das hat mich bewegt".
const EMOTION_TAG: Record<string, string> = {
	relief: 'durchatmen',
	wonder: 'kurz gestaunt',
	hope: 'da bewegt sich was',
	pride: 'Menschen, die anpacken',
	warmth: 'das wärmt'
};

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function headlineSize(title: string): number {
	const n = title.length;
	if (n <= 38) return 78;
	if (n <= 60) return 66;
	if (n <= 90) return 56;
	return 48;
}

export function buildStoryCard(input: StoryCardInput): string {
	const { title, dek, category, country, impactScore, emotion, imageBase64, logoDataUri } = input;
	const accent = CATEGORY_ACCENT[category] || AMBER;
	const catLabel = (CATEGORY_LABELS[category] || category).toUpperCase();
	const hSize = headlineSize(title);
	// Subtitle gibt der Story TIEFE — ohne ihn ist die Karte eine leere Behauptung.
	// Der Leser soll sofort das Warum + die Kern-Zahl sehen, nicht nur eine Headline.
	const dekShort = dek && dek.length > 145 ? dek.slice(0, 144) + '…' : (dek || '');
	const emotionTag = (emotion && EMOTION_TAG[emotion]) || 'gefunden · geteilt';

	// WhatsApp-Status verdeckt oben (~280px Header) + unten (~400px Caption/Buttons).
	// Darum: ALLES Wichtige in die sichere Mitte (y≈300–1480). Oben/unten nur Farbe.
	// Kein langer Text — im Status liest niemand. Bild + kurze Headline + ein Tag.
	const IMG_H = 660;
	const imageBlock = imageBase64
		? `<img src="${imageBase64}" width="940" height="${IMG_H}" style="width:940px;height:${IMG_H}px;object-fit:cover;" />`
		: `<div style="display:flex;width:940px;height:${IMG_H}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"><div style="font-family:'Space Grotesk';font-size:200px;font-weight:700;color:rgba(255,255,255,0.92);">N</div></div>`;

	const waHSize = title.length <= 40 ? 60 : title.length <= 70 ? 52 : 44;

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;align-items:center;justify-content:center;">

  <!-- ALLES in der sicheren Mitte (WA-Header/Footer verdecken Rand) -->
  <div style="display:flex;flex-direction:column;align-items:center;width:940px;">

    <!-- Bild gerundet + Kategorie-Pill -->
    <div style="display:flex;position:relative;width:940px;height:${IMG_H}px;">
      <div style="display:flex;width:940px;height:${IMG_H}px;border-radius:36px;overflow:hidden;box-shadow:0 22px 60px rgba(60,40,20,0.18);">
        ${imageBlock}
      </div>
      <div style="position:absolute;display:flex;top:28px;left:28px;background:rgba(251,248,241,0.94);border-radius:100px;padding:12px 26px;">
        <div style="display:flex;width:12px;height:12px;border-radius:12px;background:${accent};margin-right:12px;margin-top:7px;"></div>
        <div style="font-family:'Inter';font-size:24px;font-weight:600;letter-spacing:0.12em;color:${accent};">${catLabel}</div>
      </div>
    </div>

    <!-- Headline (kurz, fett) -->
    <div style="display:flex;font-family:'Space Grotesk';font-size:${waHSize}px;font-weight:700;color:${INK};line-height:1.08;letter-spacing:-0.03em;margin-top:40px;width:940px;">
      ${esc(title)}
    </div>

    <!-- Subtitle: das WARUM + die Kern-Zahl. Gibt der Story Substanz statt leerer Headline. -->
    ${dekShort ? `<div style="display:flex;font-family:'Newsreader';font-size:34px;font-weight:400;color:${MUTED};line-height:1.34;margin-top:24px;width:940px;">${esc(dekShort)}</div>` : ''}

    <!-- Markenzeile + klarer Verweis (kein Link-Sticker möglich → Profil-Hinweis) -->
    <div style="display:flex;align-items:center;margin-top:40px;width:940px;">
      ${logoDataUri ? `<img src="${logoDataUri}" width="42" height="42" style="width:42px;height:42px;" />` : ''}
      <div style="font-family:'Space Grotesk';font-size:32px;font-weight:700;color:${INK};margin-left:14px;">NurEine</div>
      ${impactScore ? `<div style="font-family:'Inter';font-size:28px;font-weight:600;color:${MUTED};margin-left:20px;">· Wirkung ${impactScore}/100</div>` : ''}
    </div>

    <!-- Call-to-Action-Leiste: sagt dem Leser, wo er die ganze Story findet -->
    <div style="display:flex;align-items:center;justify-content:center;margin-top:28px;width:940px;background:${AMBER};border-radius:100px;padding:22px 0;">
      <div style="font-family:'Inter';font-size:30px;font-weight:700;color:#fff;letter-spacing:0.01em;">Ganze Geschichte → @nureine.de</div>
    </div>

  </div>

</body></html>`;
}
