import { getStoryBySlug } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

/**
 * Dynamisches OG-Image als SVG.
 *
 * URL: /api/og/[slug]
 *
 * Erzeugt ein 1200x630px Social-Media-Preview-Bild bestehend aus:
 *   - Kreisförmig maskiertem FLUX.1-Story-Bild (links)
 *   - Titel + Subtitle + Category-Badge (rechts)
 *   - NurEine-Logo + Domain (unten)
 *
 * Farbpalette passt zu ton-basierten Akzenten (amber/sage/rose/sky).
 * SVG weil: keine Generierungskosten, instant, SEO-freundlich.
 */

// Category -> tone -> accent color
const toneColors: Record<string, string> = {
	amber: '#c87340',
	sage: '#5a7a52',
	rose: '#b87a7a',
	sky: '#6c8aa8'
};

const categoryTone: Record<string, string> = {
	klima: 'sage',
	gesundheit: 'rose',
	wissenschaft: 'sky',
	gemeinschaft: 'amber',
	tiere: 'sage',
	kultur: 'amber',
	innovation: 'sky'
};

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
	const words = text.split(' ');
	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		if ((current + word).length > maxChars && current.length > 0) {
			lines.push(current.trim());
			current = word + ' ';
		} else {
			current += word + ' ';
		}
	}
	if (current.trim()) lines.push(current.trim());
	return lines;
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const slug = params.slug;
	const story = await getStoryBySlug(slug);

	if (!story) {
		return new Response('Story not found', { status: 404 });
	}

	const tone = categoryTone[story.category] || 'amber';
	const accent = toneColors[tone];
	const baseUrl = PUBLIC_BASE_URL || 'https://nureine.de';
	const storyUrl = `${baseUrl}/geschichte/${story.slug}`;
	const imageUrl = story.image_url || story.imageUrl || '';

	const title = escapeXml(story.title);
	const dek = escapeXml(story.dek);
	const category = escapeXml(story.category);
	const categoryLabel =
		{ klima: 'Klima', gesundheit: 'Gesundheit', wissenschaft: 'Wissenschaft', gemeinschaft: 'Gemeinschaft', tiere: 'Tiere', kultur: 'Kultur', innovation: 'Innovation' }[
			story.category
		] || story.category;

	// Title wrapping for OG card
	const titleLines = wrapText(story.title, 28);

	// Build the SVG
	const W = 1200;
	const H = 630;
	const marginX = 60;
	const circleCx = 280;
	const circleCy = 315;
	const circleR = 210;
	const textX = circleCx + circleR + 60;

	const svgParts: string[] = [];

	// Background
	svgParts.push(`<rect width="${W}" height="${H}" fill="#f5f1ea"/>`);

	// Subtle accent gradient top
	svgParts.push(`<defs>
		<linearGradient id="topGlow" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="${accent}" stop-opacity="0.08"/>
			<stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
		</linearGradient>
		<linearGradient id="bottomLine" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="${accent}" stop-opacity="0"/>
			<stop offset="30%" stop-color="${accent}" stop-opacity="0.4"/>
			<stop offset="70%" stop-color="${accent}" stop-opacity="0.4"/>
			<stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
		</linearGradient>
		<clipPath id="circleClip">
			<circle cx="${circleCx}" cy="${circleCy}" r="${circleR}"/>
		</clipPath>
	</defs>`);

	// Top glow
	svgParts.push(`<rect width="${W}" height="${H * 0.4}" fill="url(#topGlow)"/>`);

	// Image circle (with accent ring)
	if (imageUrl && imageUrl.startsWith('http')) {
		const escapedImageUrl = escapeXml(imageUrl);
		svgParts.push(`<image href="${escapedImageUrl}" x="${circleCx - circleR}" y="${circleCy - circleR}" width="${circleR * 2}" height="${circleR * 2}" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice"/>`);
	} else {
		// Fallback: tone-colored circle with category indicator
		svgParts.push(`<circle cx="${circleCx}" cy="${circleCy}" r="${circleR}" fill="${accent}" fill-opacity="0.12"/>`);
		svgParts.push(`<text x="${circleCx}" y="${circleCy + 18}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="72" fill="${accent}" fill-opacity="0.3">${categoryLabel}</text>`);
	}

	// Accent ring around circle
	svgParts.push(`<circle cx="${circleCx}" cy="${circleCy}" r="${circleR + 4}" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="2"/>`);

	// Category badge (top right area)
	svgParts.push(`<rect x="${textX}" y="100" rx="20" ry="20" width="${categoryLabel.length * 12 + 32}" height="32" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.25" stroke-width="1"/>`);
	svgParts.push(`<text x="${textX + categoryLabel.length * 6 + 16}" y="121" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="${accent}" text-transform="uppercase" letter-spacing="0.15em">${categoryLabel.toUpperCase()}</text>`);

	// Title
	const titleY = 170;
	titleLines.forEach((line, i) => {
		const escaped = escapeXml(line);
		svgParts.push(`<text x="${textX}" y="${titleY + i * 58}" font-family="Fraunces, Cambria, Georgia, serif" font-size="38" font-weight="500" fill="#1a1815" letter-spacing="-0.01em">${escaped}</text>`);
	});

	// Dek / subtitle
	const dekY = titleY + titleLines.length * 58 + 16;
	const dekLines = wrapText(story.dek, 52);
	if (story.dek) {
		dekLines.slice(0, 3).forEach((line, i) => {
			const escaped = escapeXml(line);
			svgParts.push(`<text x="${textX}" y="${dekY + i * 32}" font-family="Fraunces, Cambria, Georgia, serif" font-size="20" font-style="italic" fill="#3a342c">${escaped}</text>`);
		});
	}

	// Bottom accent line
	svgParts.push(`<line x1="60" y1="${H - 72}" x2="${W - 60}" y2="${H - 72}" stroke="url(#bottomLine)" stroke-width="1"/>`);

	// Footer: logo + domain
	svgParts.push(`<text x="60" y="${H - 36}" font-family="Fraunces, Cambria, Georgia, serif" font-size="16" font-weight="500" fill="#6b6359">NurEine</text>`);
	svgParts.push(`<text x="${W - 60}" y="${H - 36}" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="14" fill="#9a9087">nureine.de</text>`);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svgParts.join('')}</svg>`;

	setHeaders({
		'Content-Type': 'image/svg+xml',
		'Cache-Control': 'public, max-age=3600, s-maxage=86400',
		'CDN-Cache-Control': 'public, max-age=86400'
	});

	return new Response(svg, {
		headers: { 'Content-Type': 'image/svg+xml' }
	});
};
