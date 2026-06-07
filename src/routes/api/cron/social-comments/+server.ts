/**
 * POST /api/cron/social-comments
 * Beantwortet neue IG-Kommentare im NurEine-Ton (DeepSeek-klassifiziert + geguardet).
 * No-op ohne IG/DeepSeek-Token. Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { replyToComments } from '$lib/server/social/comments';

export const config = { maxDuration: 60 };

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await replyToComments();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/social-comments] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
