import { listSocialPosts, socialAnalytics, getAppSetting } from '$lib/server/social/queue';

export async function load() {
	const [posts, analytics, autopilotVal] = await Promise.all([
		listSocialPosts(60),
		socialAnalytics(),
		getAppSetting('social_autopilot')
	]);
	return { posts, analytics, autopilot: autopilotVal === 'true' };
}
