export const storyHeroImages: Record<string, string> = {
	'Kenia pflanzt 8 Millionen Mangroven': 'Kenia pflanzt 8 Millionen Mangroven.jpeg',
	'KI erkennt Bauchspeicheldrüsenkrebs früher': 'KI erkennt Bauchspeicheldrüsenkrebs früher.jpeg',
	'Portugal 149 Tage auf erneuerbarem Strom': 'Portugal 149 Tage auf erneuerbarem Strom.jpeg',
	'Verwaister Otter wird Ersatzmutter': 'Verwaister Otter wird Ersatzmutter.jpeg',
	'Erstes Fahrrad-Autobahn-Netzwerk in Amsterdam':
		'Erstes Fahrrad-Autobahn-Netzwerk in Amsterdam.jpeg'
};

function normalize(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

const normalizedImageMap = Object.entries(storyHeroImages).map(([title, fileName]) => ({
	title,
	fileName,
	normalizedTitle: normalize(title)
}));

export function getStoryHeroImageSrc(title: string, basePath: string): string | null {
	const normalized = normalize(title);
	if (!normalized) return null;

	const exact = normalizedImageMap.find((entry) => entry.normalizedTitle === normalized);
	if (exact) return `${basePath}/images/${encodeURIComponent(exact.fileName)}`;

	const fuzzy = normalizedImageMap.find(
		(entry) => normalized.includes(entry.normalizedTitle) || entry.normalizedTitle.includes(normalized)
	);
	return fuzzy ? `${basePath}/images/${encodeURIComponent(fuzzy.fileName)}` : null;
}
