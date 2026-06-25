import { getStoryList, getLatestFeatured, getStats } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

export async function load() {
	const [allStories, featured, stats] = await Promise.all([
		getStoryList(),
		getLatestFeatured(),
		getStats()
	]);

	const hero = featured || allStories[0] || undefined;
	const avgImpact = allStories.length
		? Math.round(allStories.reduce((sum, s) => sum + s.impactScore, 0) / allStories.length)
		: 0;

	return {
		featured: hero,
		stats,
		avgImpact,
		baseUrl: PUBLIC_BASE_URL || 'https://nureine.de'
	};
}
