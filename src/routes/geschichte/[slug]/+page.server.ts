import { error } from '@sveltejs/kit';
import { getStoryBySlug, getRelatedStories, getAllSlugs, getAllStories } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

export async function entries() {
	const slugs = await getAllSlugs();
	return slugs.map((s) => ({ slug: s.slug }));
}

export async function load({ params }: { params: { slug: string } }) {
	const story = await getStoryBySlug(params.slug);
	if (!story) throw error(404, 'Geschichte nicht gefunden');

	const [allStories, related] = await Promise.all([
		getAllStories(),
		getRelatedStories(story.slug, 3)
	]);
	const idx = allStories.findIndex((s) => s.slug === story.slug);
	const next = allStories.length > 0
		? (idx < allStories.length - 1 ? allStories[idx + 1] : allStories[0])
		: undefined;
	const prev = allStories.length > 0
		? (idx > 0 ? allStories[idx - 1] : allStories[allStories.length - 1])
		: undefined;

	const baseUrl = PUBLIC_BASE_URL || 'https://nureine.de';

	// Perzentil: in den Top X% nach Wirkungsindex? Gibt der nackten Zahl einen Anker.
	// Billig in-memory — allStories ist ohnehin geladen.
	let impactPercentile: number | null = null;
	if (allStories.length > 1 && typeof story.impactScore === 'number') {
		const better = allStories.filter((s) => s.impactScore > story.impactScore).length;
		// "Top X%" — gerundet, mind. 1.
		impactPercentile = Math.max(1, Math.round((better / allStories.length) * 100));
	}

	return { story, next, prev, related, baseUrl, impactPercentile };
}
