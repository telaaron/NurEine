import { error } from '@sveltejs/kit';
import { getStoryBySlug } from '$lib/server/queries';

export const prerender = false;

export async function load({ params }) {
	const story = await getStoryBySlug(params.slug);
	if (!story) throw error(404, 'Geschichte nicht gefunden');

	// Human, "be the customer not the seller" caption — Aaron tweaks or ignores it.
	const caption =
		`Das hat mich heute bewegt:\n\n${story.title}\n\n` +
		`${story.dek}\n\n` +
		`Eine gute Nachricht am Tag — ehrlicher Fortschritt, belegt. 👉 nureine.de`;

	return {
		slug: params.slug,
		title: story.title,
		dek: story.dek,
		category: story.category,
		impactScore: story.impactScore,
		country: story.country,
		caption
	};
}
