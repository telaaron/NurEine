import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllStories } from '$lib/server/queries';
import { CATEGORIES, isValidCategory, categoryLabel } from '$lib/categories';

export const prerender = false;

// pSEO hub: one template, one instance per category. Keyword-targeted URL
// ("gute-nachrichten/klima") that lists that category's stories and funnels
// crawlers/link-equity into the individual story pages.
export const load: PageServerLoad = async ({ params }) => {
	const thema = params.thema;
	if (!isValidCategory(thema)) throw error(404, 'Thema nicht gefunden');

	const all = await getAllStories();
	const stories = all
		.filter((s) => s.category === thema)
		.sort((a, b) => b.impactScore - a.impactScore)
		.slice(0, 40);

	const label = categoryLabel(thema);
	const otherThemes = CATEGORIES.filter((c) => c.slug !== thema);

	return { thema, label, stories, otherThemes, total: stories.length };
};
