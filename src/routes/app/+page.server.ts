import { getLatestFeatured } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

// Screen 1 — Aufdecken/Heute. Die Tages-Ausgabe wird server-seitig geladen
// (SSR-first: das Aufdecken ist sofort da). getLatestFeatured() ist genau die
// Story, die auch die Website featured — kuratiert, wechselt 1×/Tag.
export const load: PageServerLoad = async () => {
	const story = await getLatestFeatured();
	return { story: story ?? null };
};
