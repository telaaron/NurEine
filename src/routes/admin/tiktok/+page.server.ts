/**
 * /admin/tiktok — manuelles TikTok-Posten der fertigen Reels.
 *
 * Solange TikTok nicht auto-postet (kein Wrapper-Key), lädt Aaron die Reels von
 * Hand hoch. Diese Seite liefert pro Reel alles, was er dafür braucht:
 *   - die fertige 9:16-MP4 (Download aus dem Bucket story_reels, slide_urls[0]),
 *   - die TikTok-Caption (handgepflegt in nureine_stories.tiktok_caption, sonst
 *     regelbasierter Fallback aus tiktok-caption.ts),
 *   - 3-5 Hashtags + das gesprochene Keyword (Erinnerung: Keyword muss im Video
 *     vorkommen — gesprochen UND eingeblendet, TikTok-SEO).
 *
 * „Auf TikTok gepostet" wird als eigene Zeile platform='tiktok' in
 * nureine_social_posts markiert (Muster wie Threads). Der Unique-Index
 * (story_id, platform, post_kind) hält das kollisionsfrei zum IG-Reel.
 * KEIN DB-Schema-Eingriff, kein Auto-Post — reine manuelle Ablauf-Hilfe.
 */
import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { buildTikTokCaption, type TikTokStoryInput } from '$lib/server/social/tiktok-caption';
import type { Actions, PageServerLoad } from './$types';

interface StoryRow extends TikTokStoryInput {
	id: string;
	image_url: string | null;
	tiktok_caption: string | null;
	tiktok_hashtags: string[] | null;
	tiktok_video_url: string | null;
}

const STORY_COLS =
	'id,title,subtitle,share_hook,summary,category,source_name,impact_score,image_url,tiktok_caption,tiktok_hashtags,tiktok_video_url';

export interface TikTokReelCard {
	postId: number;
	storyId: string;
	title: string;
	category: string | null;
	impactScore: number | null;
	igStatus: string;
	igPostedAt: string | null;
	videoUrl: string | null;
	imageUrl: string | null;
	/** Fertige Caption (handgepflegt oder Fallback). */
	caption: string;
	hashtags: string[];
	keyword: string;
	/** Komplett kopierbare Version: caption + Leerzeile + Hashtags. */
	full: string;
	/** true = die Caption stammt aus der handgepflegten Spalte, nicht vom Fallback. */
	captionCurated: boolean;
	/** true = schon als auf TikTok gepostet markiert. */
	tiktokPosted: boolean;
	tiktokPostedAt: string | null;
}

export const load: PageServerLoad = async () => {
	// NUR echte TikTok-Master: Stories, für die die Reel-Regie ein eigenes ReelTikTok-
	// Video gerendert hat (tiktok_video_url gesetzt). Bewusst KEINE alten IG-Reels mehr
	// (andere Ästhetik, Fallback-Caption) — diese Seite ist der TikTok-Kanal, nicht das
	// IG-Reel-Archiv. Neueste Master zuerst.
	const { data: storyRows } = await supabaseAdmin
		.from('nureine_stories')
		.select(STORY_COLS + ',published_at')
		.not('tiktok_video_url', 'is', null)
		.order('published_at', { ascending: false })
		.limit(80);
	const stories = (storyRows as (StoryRow & { published_at: string | null })[] | null) ?? [];

	// Welche Stories sind bereits als auf TikTok gepostet markiert?
	const { data: tiktokRows } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('story_id,posted_at')
		.eq('platform', 'tiktok')
		.eq('status', 'posted');
	const tiktokByStory = new Map<string, string | null>();
	for (const t of (tiktokRows as { story_id: string; posted_at: string | null }[] | null) ?? [])
		tiktokByStory.set(t.story_id, t.posted_at);

	// Post-ID ist hier synthetisch/negativ — es gibt (noch) keine social_posts-Zeile,
	// bis Aaron „gepostet" klickt. markPosted arbeitet dann rein über die storyId.
	let synthId = -1;
	const cards: TikTokReelCard[] = stories.map((s) => {
		const curated = !!(s.tiktok_caption && s.tiktok_caption.trim());
		const built = buildTikTokCaption(storyInput(s));
		const caption = curated ? s.tiktok_caption!.trim() : built.caption;
		let hashtags = curated ? (s.tiktok_hashtags ?? []).filter(Boolean) : built.hashtags;
		if (!hashtags.length) hashtags = built.hashtags;
		return {
			postId: synthId--,
			storyId: s.id,
			title: s.title ?? '(ohne Titel)',
			category: s.category ?? null,
			impactScore: s.impact_score ?? null,
			igStatus: 'none',
			igPostedAt: null,
			videoUrl: s.tiktok_video_url,
			imageUrl: s.image_url ?? null,
			caption,
			hashtags,
			keyword: built.keyword,
			full: `${caption}\n\n${hashtags.join(' ')}`.trim(),
			captionCurated: curated,
			tiktokPosted: tiktokByStory.has(s.id),
			tiktokPostedAt: tiktokByStory.get(s.id) ?? null
		};
	});

	const postedCount = cards.filter((c) => c.tiktokPosted).length;
	return { cards, stats: { total: cards.length, posted: postedCount, open: cards.length - postedCount } };
};

function storyInput(s: StoryRow): TikTokStoryInput {
	return {
		title: s.title,
		subtitle: s.subtitle,
		share_hook: s.share_hook,
		summary: s.summary,
		category: s.category,
		source_name: s.source_name,
		impact_score: s.impact_score
	};
}

export const actions: Actions = {
	// Markiert ein Reel als auf TikTok gepostet: legt eine platform='tiktok'-Zeile
	// an (bzw. reaktiviert sie). Idempotent über den Unique-Index.
	markPosted: async ({ request }) => {
		const form = await request.formData();
		const storyId = String(form.get('storyId') ?? '');
		if (!storyId) return fail(400, { error: 'storyId fehlt' });
		const postId = Number(form.get('postId') ?? 0);

		// Quelldaten vom IG-Reel (Snapshot), falls vorhanden. Bei TikTok-only-Mastern
		// (synthetische negative postId, kein IG-Reel) fallen wir auf die Story-Daten
		// + tiktok_video_url zurück.
		const { data: src } =
			postId > 0
				? await supabaseAdmin
						.from('nureine_social_posts')
						.select('story_id,category,slide_urls,card_url,og_url,hook_type,hook_style')
						.eq('id', postId)
						.single()
				: { data: null };

		const { data: story } = await supabaseAdmin
			.from('nureine_stories')
			.select('tiktok_caption,tiktok_hashtags,tiktok_video_url,category')
			.eq('id', storyId)
			.single();
		const st = story as {
			tiktok_caption: string | null;
			tiktok_hashtags: string[] | null;
			tiktok_video_url: string | null;
			category: string | null;
		} | null;

		const s = src as {
			category: string | null;
			slide_urls: string[] | null;
			card_url: string | null;
			og_url: string | null;
			hook_type: string;
			hook_style: string | null;
		} | null;

		const videoUrl = st?.tiktok_video_url ?? s?.slide_urls?.[0] ?? null;
		const { error } = await supabaseAdmin.from('nureine_social_posts').upsert(
			{
				story_id: storyId,
				platform: 'tiktok',
				post_kind: 'reel',
				caption: st?.tiktok_caption ?? '',
				hashtags: st?.tiktok_hashtags ?? [],
				slide_urls: videoUrl ? [videoUrl] : (s?.slide_urls ?? null),
				card_url: s?.card_url ?? videoUrl,
				og_url: s?.og_url ?? videoUrl,
				// hook_type-Check-Constraint erlaubt nur zahl|frage|kontrast.
				hook_type: ['zahl', 'frage', 'kontrast'].includes(s?.hook_type ?? '') ? s!.hook_type : 'zahl',
				hook_style: s?.hook_style ?? 'image',
				category: s?.category ?? st?.category ?? null,
				is_carousel: false,
				status: 'posted',
				posted_at: new Date().toISOString(),
				scheduled_for: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'story_id,platform,post_kind' }
		);
		if (error) return fail(500, { error: error.message });
		return { ok: true };
	},

	// Rückgängig: die TikTok-Markierung wieder entfernen.
	unmark: async ({ request }) => {
		const form = await request.formData();
		const storyId = String(form.get('storyId') ?? '');
		if (!storyId) return fail(400, { error: 'storyId fehlt' });
		const { error } = await supabaseAdmin
			.from('nureine_social_posts')
			.delete()
			.eq('story_id', storyId)
			.eq('platform', 'tiktok')
			.eq('post_kind', 'reel');
		if (error) return fail(500, { error: error.message });
		return { ok: true };
	}
};
