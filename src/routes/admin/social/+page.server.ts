import { listSocialPosts, socialAnalytics } from '$lib/server/social/queue';

export async function load() {
	const [posts, analytics] = await Promise.all([listSocialPosts(60), socialAnalytics()]);
	return { posts, analytics };
}
