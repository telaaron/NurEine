/**
 * POST /api/cron/social-reel-select
 * Wählt die heutige Reel-Story (frische ig_ok-Story, noch nicht als Reel gepostet)
 * und gibt die Metadaten zurück, die der ffmpeg-Renderer (GitHub Action) braucht.
 * Postet NICHTS — nur Auswahl. Der Render/Upload/Queue-Schritt läuft in der Action.
 * Auth: Bearer CRON_SECRET.
 *
 * Antwort: { ok, story: { id, slug, caption, hashtags, category } } oder { ok, story: null }.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { selectInstagramStory } from '$lib/server/queries';
import { buildCaption, buildCaptionFromHook, hashtagsFor, pickHookType } from '$lib/server/social/caption';
import { supabaseAdmin } from '$lib/server/supabase/client';

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const story = await selectInstagramStory();
		if (!story) return json({ ok: true, story: null, reason: 'keine ig_ok-Story heute' });

		// Schon als Reel gepostet/eingeplant? (Reel-Posts sind eigene post_kind.)
		const { count } = await supabaseAdmin
			.from('nureine_social_posts')
			.select('*', { count: 'exact', head: true })
			.eq('platform', 'instagram')
			.eq('post_kind', 'reel')
			.eq('story_id', story.id);
		if ((count ?? 0) > 0) return json({ ok: true, story: null, reason: 'Reel existiert schon' });

		const hookType = pickHookType(story);
		const caption = story.igCaption
			? story.igCaption
			: story.igHook
				? buildCaptionFromHook(story)
				: buildCaption(story, { hookType, withCta: false });
		const hashtags = hashtagsFor(story.category, 0);

		return json({
			ok: true,
			story: {
				id: story.id,
				slug: story.slug,
				caption,
				hashtags,
				category: story.category
			}
		});
	} catch (err) {
		console.error('[cron/social-reel-select] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
