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

interface ReelRow {
	id: number;
	story_id: string;
	status: string;
	posted_at: string | null;
	created_at: string;
	category: string | null;
	slide_urls: string[] | null;
	caption: string | null;
}

interface StoryRow extends TikTokStoryInput {
	id: string;
	image_url: string | null;
	tiktok_caption: string | null;
	tiktok_hashtags: string[] | null;
}

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
	// Alle Reels (Bestand — bewusst OHNE 72h-Frische-Guard, damit der Startbestand
	// nutzbar ist). Neueste zuerst.
	const { data: reelRows } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('id,story_id,status,posted_at,created_at,category,slide_urls,caption')
		.eq('post_kind', 'reel')
		.eq('platform', 'instagram')
		.order('created_at', { ascending: false })
		.limit(60);

	const reels = (reelRows as ReelRow[] | null) ?? [];
	const storyIds = [...new Set(reels.map((r) => r.story_id))];

	// Story-Daten (für Caption-Fallback + Titel/Bild) in einem Rutsch.
	const storyById = new Map<string, StoryRow>();
	if (storyIds.length) {
		const { data: storyRows } = await supabaseAdmin
			.from('nureine_stories')
			.select(
				'id,title,subtitle,share_hook,summary,category,source_name,impact_score,image_url,tiktok_caption,tiktok_hashtags'
			)
			.in('id', storyIds);
		for (const s of (storyRows as StoryRow[] | null) ?? []) storyById.set(s.id, s);
	}

	// Welche Stories sind bereits auf TikTok markiert?
	const { data: tiktokRows } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('story_id,posted_at')
		.eq('platform', 'tiktok')
		.eq('status', 'posted');
	const tiktokByStory = new Map<string, string | null>();
	for (const t of (tiktokRows as { story_id: string; posted_at: string | null }[] | null) ?? [])
		tiktokByStory.set(t.story_id, t.posted_at);

	const cards: TikTokReelCard[] = reels.map((r) => {
		const s = storyById.get(r.story_id);
		const curated = !!(s?.tiktok_caption && s.tiktok_caption.trim());

		let caption: string;
		let hashtags: string[];
		let keyword: string;

		if (curated && s) {
			caption = s.tiktok_caption!.trim();
			hashtags = (s.tiktok_hashtags ?? []).filter(Boolean);
			// Keyword-Hinweis auch bei handgepflegter Caption aus dem Builder ableiten.
			keyword = buildTikTokCaption(storyInput(s)).keyword;
			// Falls handgepflegt keine Hashtags hinterlegt sind: Fallback-Tags nehmen.
			if (!hashtags.length) hashtags = buildTikTokCaption(storyInput(s)).hashtags;
		} else if (s) {
			const built = buildTikTokCaption(storyInput(s));
			caption = built.caption;
			hashtags = built.hashtags;
			keyword = built.keyword;
		} else {
			// Story fehlt (sollte nicht vorkommen) — auf die IG-Caption zurückfallen.
			caption = r.caption ?? '';
			hashtags = ['#gutenachrichten'];
			keyword = '';
		}

		const full = `${caption}\n\n${hashtags.join(' ')}`.trim();

		return {
			postId: r.id,
			storyId: r.story_id,
			title: s?.title ?? '(Story nicht gefunden)',
			category: r.category ?? s?.category ?? null,
			impactScore: s?.impact_score ?? null,
			igStatus: r.status,
			igPostedAt: r.posted_at,
			videoUrl: r.slide_urls?.[0] ?? null,
			imageUrl: s?.image_url ?? null,
			caption,
			hashtags,
			keyword,
			full,
			captionCurated: curated,
			tiktokPosted: tiktokByStory.has(r.story_id),
			tiktokPostedAt: tiktokByStory.get(r.story_id) ?? null
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
		const postId = Number(form.get('postId') ?? 0);
		if (!storyId || !postId) return fail(400, { error: 'storyId/postId fehlt' });

		// Quelldaten vom IG-Reel + die TikTok-Caption übernehmen (Snapshot).
		const { data: src } = await supabaseAdmin
			.from('nureine_social_posts')
			.select('story_id,category,slide_urls,card_url,og_url,hook_type,hook_style')
			.eq('id', postId)
			.single();
		if (!src) return fail(404, { error: 'Reel nicht gefunden' });

		const { data: story } = await supabaseAdmin
			.from('nureine_stories')
			.select('tiktok_caption,tiktok_hashtags')
			.eq('id', storyId)
			.single();

		const s = src as {
			category: string | null;
			slide_urls: string[] | null;
			card_url: string | null;
			og_url: string | null;
			hook_type: string;
			hook_style: string | null;
		};
		const st = story as { tiktok_caption: string | null; tiktok_hashtags: string[] | null } | null;

		const { error } = await supabaseAdmin.from('nureine_social_posts').upsert(
			{
				story_id: storyId,
				platform: 'tiktok',
				post_kind: 'reel',
				caption: st?.tiktok_caption ?? '',
				hashtags: st?.tiktok_hashtags ?? [],
				slide_urls: s.slide_urls,
				card_url: s.card_url,
				og_url: s.og_url,
				hook_type: s.hook_type,
				hook_style: s.hook_style ?? 'image',
				category: s.category,
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
