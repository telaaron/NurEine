/**
 * OG Image HTML template for Satori rendering.
 *
 * Design matches the base template (static/og-slug-base.jpg):
 *   - Background: light blue-gray #DFE9F0
 *   - Blue elliptical orb on the right side (brand panel)
 *   - Story image framed on the left
 *   - Headline + category below the image
 *   - Brand bar at the bottom
 *
 * Dimensions: 1200×630 (1.91:1) — scaled from 1424×748 base.
 */

// Category → accent color
const CATEGORY_ACCENT: Record<string, string> = {
	klima: '#5a7a52',
	gesundheit: '#b87a7a',
	wissenschaft: '#6c8aa8',
	gemeinschaft: '#c87340',
	tiere: '#5a7a52',
	kultur: '#c87340',
	innovation: '#6c8aa8'
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

export interface OgTemplateInput {
	title: string;
	dek: string;
	category: string;
	imageBase64: string | null;
}

// Layout constants (scaled from 1424×748 base to 1200×630)
const CANVAS_W = 1200;
const CANVAS_H = 630;
const BG = '#DFE9F0';          // light blue-gray background
const INK = '#1A1815';          // dark text color
const MUTED = '#5B6B7A';        // muted text for category
const FAINT = '#8A9AAA';        // faint text for dek / brand

const PAD = 48;
const IMG_W = 560;
const IMG_H = 400;
const IMG_X = PAD;
const IMG_Y = 54;
const IMG_RADIUS = 6;

// Blue orb (scaled: 380×377px at 1424 → 320×318px at 1200)
const ORB_W = 320;
const ORB_H = 318;
const ORB_RIGHT = 48;
const ORB_TOP = 83;
const ORB_COLOR = '#4A76BD';

// Brand text on orb
const BRAND_SIZE = 24;

// Text area below the image
const TEXT_Y = IMG_Y + IMG_H + 36;
const TEXT_MAX_W = CANVAS_W - PAD * 2;

export function buildOgTemplate(input: OgTemplateInput): string {
	const { title, dek, category, imageBase64 } = input;
	const accent = CATEGORY_ACCENT[category] || '#c87340';
	const categoryLabel = CATEGORY_LABELS[category] || category;

	// Story image HTML
	const imageHtml = imageBase64
		? `<img src="${imageBase64}" width="${IMG_W}" height="${IMG_H}" style="object-fit:cover;border-radius:${IMG_RADIUS}px;" />`
		: `<div style="width:${IMG_W}px;height:${IMG_H}px;background:rgba(200,115,64,0.06);border-radius:${IMG_RADIUS}px;display:flex;align-items:center;justify-content:center;"><div style="color:rgba(200,115,64,0.15);font-size:72px;font-weight:700;">NurEine</div></div>`;

	// Truncate dek to fit
	const maxDekChars = 120;
	const displayDek = dek && dek.length > 0
		? (dek.length > maxDekChars ? dek.slice(0, maxDekChars - 3) + '...' : dek)
		: null;

	return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;width:${CANVAS_W}px;height:${CANVAS_H}px;background:${BG};font-family:Inter,sans-serif;display:flex;position:relative;overflow:hidden;">

<!-- Blue orb — elliptical brand panel on the right -->
<div style="position:absolute;right:${ORB_RIGHT}px;top:${ORB_TOP}px;width:${ORB_W}px;height:${ORB_H}px;background:${ORB_COLOR};border-radius:50%;"></div>

<!-- Brand name on the orb -->
<div style="position:absolute;right:${ORB_RIGHT}px;top:${ORB_TOP}px;width:${ORB_W}px;height:${ORB_H}px;display:flex;align-items:center;justify-content:center;">
  <div style="font-size:${BRAND_SIZE}px;font-weight:600;color:#FFFFFF;letter-spacing:0.08em;">NurEine</div>
</div>

<!-- Story image — left side -->
<div style="position:absolute;left:${IMG_X}px;top:${IMG_Y}px;width:${IMG_W}px;height:${IMG_H}px;border-radius:${IMG_RADIUS}px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
  ${imageHtml}
</div>

<!-- Text area — below the image -->
<div style="position:absolute;left:${PAD}px;top:${TEXT_Y}px;width:${TEXT_MAX_W}px;display:flex;flex-direction:column;">

  <!-- Headline -->
  <div style="font-size:40px;font-weight:700;color:${INK};line-height:1.2;letter-spacing:-0.02em;margin-bottom:16px;max-width:720px;">
    ${escapeHtml(title)}
  </div>

  ${displayDek ? `
  <!-- Subtitle -->
  <div style="font-size:18px;font-weight:400;color:${FAINT};line-height:1.45;max-width:620px;margin-bottom:20px;">
    ${escapeHtml(displayDek)}
  </div>` : ''}

  <!-- Category badge -->
  <div style="display:flex;align-items:center;">
    <div style="width:8px;height:8px;border-radius:50%;background:${accent};flex-shrink:0;"></div>
    <div style="font-size:18px;font-weight:600;color:${MUTED};margin-left:10px;letter-spacing:0.02em;">${categoryLabel}</div>
  </div>

</div>

</body>
</html>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
