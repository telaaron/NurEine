import { error } from '@sveltejs/kit';
import { getLatestFeatured } from '$lib/server/queries';
import { buildCaption, buildCaptionFromHook, hashtagsFor, pickHookType } from '$lib/server/social/caption';

export const prerender = false;

export async function load() {
	const story = await getLatestFeatured();
	if (!story) throw error(404, 'Keine Geschichte für heute gefunden');

	// Instagram: Hook führt (KI-igHook falls vorhanden), Caption baut auf, wiederholt nicht.
	const hookType = pickHookType(story);
	const igCaption = story.igHook
		? buildCaptionFromHook(story)
		: buildCaption(story, { hookType, withCta: true });

	// WhatsApp: persönlich + aufbauend. Opener (KI-waOpener) → Story → ruhiger Schluss.
	// Bewusst KEINE Wiederholung von Titel als Floskel. Friction-frei zum Kopieren.
	const opener = story.waOpener || 'Das hat mich heute bewegt:';
	const whatsappCaption =
		`${opener}\n\n${story.title}\n\n${story.dek}\n\n` +
		`Manchmal tut so eine Nachricht einfach gut. 👉 nureine.de`;

	const hashtags = hashtagsFor(story.category);

	return {
		slug: story.slug,
		title: story.title,
		dek: story.dek,
		category: story.category,
		impactScore: story.impactScore,
		emotion: story.emotion,
		igHook: story.igHook,
		slides: story.slides,
		igCaption,
		whatsappCaption,
		hashtags
	};
}
