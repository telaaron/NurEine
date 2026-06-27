/**
 * POST /api/cron/social-story
 * Postet eine IG-Story (9:16) der RESONANZ-stärksten story-würdigen News. Max 10/Tag.
 * No-op ohne IG-Token. Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { publishStoryDue } from '$lib/server/social/queue';

// 60s: CDN-Vorwärmen (~6s Render) + IG-Container-Polling bis FINISHED + Publish-Retry.
export const config = { maxDuration: 60 };

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await publishStoryDue();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/social-story] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
