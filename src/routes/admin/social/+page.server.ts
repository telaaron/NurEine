import { listSocialPosts, socialAnalytics, getAppSetting } from '$lib/server/social/queue';
import { supabaseAdmin } from '$lib/server/supabase/client';

export async function load() {
	const [posts, analytics, autopilotVal, dryrunVal, storyRows, replyRows] = await Promise.all([
		listSocialPosts(60),
		socialAnalytics(),
		getAppSetting('social_autopilot'),
		getAppSetting('comments_dryrun'),
		supabaseAdmin
			.from('nureine_social_posts')
			.select('id,category,saves,reach,posted_at,ig_media_id')
			.eq('platform', 'instagram_story')
			.eq('status', 'posted')
			.order('posted_at', { ascending: false })
			.limit(40),
		supabaseAdmin
			.from('nureine_social_replies')
			.select('comment_text,reply_text,skipped_reason,replied_at')
			.order('replied_at', { ascending: false })
			.limit(20)
	]);

	const stories = (storyRows.data as { saves: number | null; reach: number | null; posted_at: string }[]) ?? [];
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
		commentsDryrun: dryrunVal !== 'false',
		storyStats,
		replies: (replyRows.data as { comment_text: string; reply_text: string | null; skipped_reason: string | null; replied_at: string }[]) ?? []
	};
}
