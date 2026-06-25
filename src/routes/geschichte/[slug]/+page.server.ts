import { error } from '@sveltejs/kit';
import {
	getStoryBySlug,
	getRelatedStories,
	getAllSlugs,
	getStoryNeighbors,
	getImpactPercentile
} from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

export async function entries() {
	const slugs = await getAllSlugs();
	return slugs.map((s) => ({ slug: s.slug }));
}

export async function load({ params }: { params: { slug: string } }) {
	const story = await getStoryBySlug(params.slug);
	if (!story) throw error(404, 'Geschichte nicht gefunden');

	// Prev/next pager and the impact percentile used to require loading ALL stories
	// (twice — once here, once inside getRelatedStories). Now each is an indexed
	// lookup/count, so a single article view no longer drags the whole table.
	const [related, neighbors, impactPercentile] = await Promise.all([
		getRelatedStories(story.slug, 3),
		getStoryNeighbors(story.publishedAt, story.id),
		typeof story.impactScore === 'number'
			? getImpactPercentile(story.impactScore)
			: Promise.resolve(null)
	]);

	const baseUrl = PUBLIC_BASE_URL || 'https://nureine.de';

	return {
		story,
		next: neighbors.next,
		prev: neighbors.prev,
		related,
		baseUrl,
		impactPercentile
	};
}
