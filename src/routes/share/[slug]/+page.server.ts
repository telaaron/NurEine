import { error } from '@sveltejs/kit';
import { getStoryBySlug } from '$lib/server/queries';

export const prerender = false;

export async function load({ params }) {
	const story = await getStoryBySlug(params.slug);
	if (!story) throw error(404, 'Geschichte nicht gefunden');

	// WhatsApp-Status: KURZ. Karte trägt die Story, Text ist nur ein Funke + Link.
	const opener = story.waOpener || 'Das hat mich heute kurz innehalten lassen.';
	const caption = `${opener}\n👉 nureine.de`;

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
