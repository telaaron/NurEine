import { listSocialPosts, socialAnalytics, getAppSetting } from '$lib/server/social/queue';
import { supabaseAdmin } from '$lib/server/supabase/client';

export async function load() {
	const [allPosts, analytics, autopilotVal, storyRows, replyRows] = await Promise.all([
		listSocialPosts(80),
		socialAnalytics(),
		getAppSetting('social_autopilot'),
		supabaseAdmin
			.from('nureine_social_posts')
			.select('id,category,saves,reach,posted_at,ig_media_id,card_url,story_id')
			.eq('platform', 'instagram_story')
			.eq('status', 'posted')
			.order('posted_at', { ascending: false })
			.limit(40),
		supabaseAdmin
			.from('nureine_social_replies')
			.select('id,comment_text,reply_text,skipped_reason,replied_at,status')
			.order('replied_at', { ascending: false })
			.limit(30)
	]);

	// Feed-Posts (Carousel/Einzelbild) und IG-Stories sind verschiedene Dinge —
	// in der editierbaren Queue NUR Feed-Posts zeigen. Stories laufen automatisch
	// (keine Caption, kein Approval) und erscheinen im eigenen Story-Block.
	const posts = allPosts.filter((p) => p.platform === 'instagram');

	const stories = (storyRows.data as { saves: number | null; reach: number | null; posted_at: string; card_url: string | null; category: string | null }[]) ?? [];
	const storyStats = {
		total: stories.length,
		today: stories.filter((s) => new Date(s.posted_at).toDateString() === new Date().toDateString()).length,
		totalReach: stories.reduce((a, s) => a + (s.reach ?? 0), 0),
		totalSaves: stories.reduce((a, s) => a + (s.saves ?? 0), 0)
	};

	return {
		posts,
		analytics,
		autopilot: autopilotVal === 'true',
		storyStats,
		recentStories: stories.slice(0, 12),
		replies: (replyRows.data as { id: number; comment_text: string; reply_text: string | null; skipped_reason: string | null; replied_at: string; status: string }[]) ?? []
	};
}
