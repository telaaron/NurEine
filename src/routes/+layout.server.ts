import { getLatestFeatured } from '$lib/server/queries';

/**
 * Site-wide layout data. Provides the latest story for the "Heute neu" ticker.
 * One cheap query, deduped by SvelteKit across navigations.
 *
 * NOTE: excluded from the Capacitor app build — scripts/app-prebuild.mjs moves
 * the root *.server.ts files aside before `BUILD_TARGET=app` builds, because a
 * static SPA has no server to answer their __data.json requests (it would error
 * with "Load failed"). The app shell (/app) does not use this data.
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
