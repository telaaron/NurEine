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

	// WhatsApp-Status: KURZ + der echte Funke. Der "krass, warum bekommt man das
	// sonst nirgends mit?"-Spirit gehört als BEGLEITTEXT unter die Karte, NICHT aufs
	// Bild. share_hook (der fertige Weitersagen-Satz) führt, sonst waOpener.
	const spark = story.shareHook || story.waOpener || 'Krass, warum bekommt man das sonst nirgends mit?';
	const whatsappCaption = `${spark}\n👉 nureine.de`;

	const hashtags = hashtagsFor(story.category, story.impactScore ?? 0);

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
		shareHook: story.shareHook,
		hashtags
	};
}
