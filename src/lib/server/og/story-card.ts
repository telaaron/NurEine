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
	const dekShort = dek && dek.length > 120 ? dek.slice(0, 119) + '…' : dek;
	const emotionTag = (emotion && EMOTION_TAG[emotion]) || 'gefunden · geteilt';

	const imageBlock = imageBase64
		? `<img src="${imageBase64}" width="${W}" height="980" style="width:${W}px;height:980px;object-fit:cover;" />`
		: `<div style="display:flex;width:${W}px;height:980px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"><div style="font-family:'Space Grotesk';font-size:200px;font-weight:700;color:rgba(255,255,255,0.92);">N</div></div>`;

	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${CANVAS};font-family:'Inter';display:flex;flex-direction:column;">

  <!-- Brand header -->
  <div style="display:flex;align-items:center;padding:54px 64px 30px;">
    ${
		logoDataUri
			? `<img src="${logoDataUri}" width="48" height="48" style="width:48px;height:48px;" />`
			: ''
	}
    <div style="font-family:'Space Grotesk';font-size:40px;font-weight:700;color:${INK};margin-left:16px;letter-spacing:-0.02em;">NurEine</div>
    <div style="display:flex;flex:1;"></div>
    <!-- Emotion-Tag (handschriftlich-warm), statt institutionellem Label -->
    <div style="font-family:'Newsreader';font-style:italic;font-size:30px;font-weight:400;color:${AMBER_DEEP};">— ${esc(emotionTag)}</div>
  </div>

  <!-- Story image (gerundet, freigestellt → wirkt wie eingeklebt, nicht wie Header) -->
  <div style="display:flex;position:relative;width:${W}px;height:980px;padding:0 40px;">
    <div style="display:flex;width:1000px;height:960px;border-radius:36px;overflow:hidden;box-shadow:0 22px 60px rgba(60,40,20,0.18);">
      ${imageBlock.replace(`width:${W}px;height:980px`, 'width:1000px;height:960px')}
    </div>
    <div style="position:absolute;display:flex;top:32px;left:80px;background:rgba(251,248,241,0.92);border-radius:100px;padding:12px 26px;">
      <div style="display:flex;width:12px;height:12px;border-radius:12px;background:${accent};margin-right:12px;margin-top:7px;"></div>
      <div style="font-family:'Inter';font-size:24px;font-weight:600;letter-spacing:0.12em;color:${accent};">${catLabel}</div>
    </div>
  </div>

  <!-- Headline + meta -->
  <div style="display:flex;flex-direction:column;flex:1;padding:48px 64px 0;">
    <div style="display:flex;font-family:'Space Grotesk';font-size:${hSize}px;font-weight:700;color:${INK};line-height:1.04;letter-spacing:-0.03em;">
      ${esc(title)}
    </div>
    ${
		dekShort
			? `<div style="display:flex;font-family:'Newsreader';font-style:italic;font-size:34px;font-weight:400;color:${AMBER_DEEP};line-height:1.34;margin-top:28px;">${esc(dekShort)}</div>`
			: ''
	}
  </div>

  <!-- Footer bar -->
  <div style="display:flex;align-items:center;padding:0 64px 64px;">
    ${
		impactScore
			? `<div style="display:flex;align-items:center;">
        <div style="display:flex;width:14px;height:14px;border-radius:14px;background:${accent};margin-right:14px;"></div>
        <div style="font-family:'Inter';font-size:30px;font-weight:600;color:${INK};">belegt · Wirkung ${impactScore}</div>
      </div>`
			: ''
	}
    ${country ? `<div style="font-family:'Inter';font-size:30px;color:${MUTED};margin-left:24px;">· ${esc(country)}</div>` : ''}
    <div style="display:flex;flex:1;"></div>
    <div style="font-family:'Inter';font-size:30px;font-weight:600;color:${AMBER};">nureine.de</div>
  </div>

</body></html>`;
}
