import { error } from '@sveltejs/kit';
import { getStoryBySlug, getRelatedStories, getAllSlugs, getAllStories } from '$lib/server/queries';

export const prerender = true;

export function entries() {
	const slugs = getAllSlugs();
	return slugs.map((s) => ({ slug: s.slug }));
}

export function load({ params }: { params: { slug: string } }) {
	const story = getStoryBySlug(params.slug);
	if (!story) throw error(404, 'Geschichte nicht gefunden');

	const allStories = getAllStories();
	const idx = allStories.findIndex((s) => s.slug === story.slug);
	const next = idx < allStories.length - 1 ? allStories[idx + 1] : allStories[0];
	const prev = idx > 0 ? allStories[idx - 1] : allStories[allStories.length - 1];
	const related = getRelatedStories(story.slug, 3);

	return { story, next, prev, related };
}
