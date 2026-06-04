import { getLatestFeatured } from '$lib/server/queries';

/**
 * Site-wide layout data. Provides the latest story for the "Heute neu" ticker.
 * One cheap query, deduped by SvelteKit across navigations.
 */
export async function load() {
	try {
		const latest = await getLatestFeatured();
		return {
			ticker: latest
				? { title: latest.title, slug: latest.slug, category: latest.category }
				: null
		};
	} catch {
		return { ticker: null };
	}
}
