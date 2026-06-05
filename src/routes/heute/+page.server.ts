import { error } from '@sveltejs/kit';
import { getLatestFeatured } from '$lib/server/queries';
import { buildCaption, hashtagsFor, pickHookType } from '$lib/server/social/caption';

export const prerender = false;

export async function load() {
	const story = await getLatestFeatured();
	if (!story) throw error(404, 'Keine Geschichte für heute gefunden');

	const hookType = pickHookType(story);
	const caption = buildCaption(story, { hookType, withCta: true });
	const hashtags = hashtagsFor(story.category);

	// Menschlicher WhatsApp-Begleittext (wie /share).
	const whatsappCaption =
		`Das hat mich heute bewegt:\n\n${story.title}\n\n${story.dek}\n\n` +
		`Eine gute Nachricht am Tag — ehrlicher Fortschritt, belegt. 👉 nureine.de`;

	return {
		slug: story.slug,
		title: story.title,
		dek: story.dek,
		category: story.category,
		impactScore: story.impactScore,
		igCaption: caption,
		whatsappCaption,
		hashtags
	};
}
