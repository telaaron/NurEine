import { getLatestFeatured, getAllStories } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

// Fokussierte Teil-Landing: EINE Story, EIN Ziel (Anmeldung). Bewusst minimal —
// die Mainpage lädt zum Stöbern ein, diese Seite konvertiert. Aaron teilt diesen
// Link 1:1, wenn jemand echtes Interesse zeigt.
export async function load() {
	const featured = await getLatestFeatured();
	const story = featured || (await getAllStories())[0] || null;
	const baseUrl = PUBLIC_BASE_URL || 'https://nureine.de';

	return {
		story: story
			? {
					slug: story.slug,
					title: story.title,
					dek: story.dek,
					shareHook: story.shareHook,
					summary: story.body ? story.body.slice(0, 280) : '',
					category: story.category,
					country: story.country,
					impactScore: story.impactScore,
					imageUrl: story.imageUrl,
					readingMinutes: story.readingMinutes
				}
			: null,
		baseUrl
	};
}
