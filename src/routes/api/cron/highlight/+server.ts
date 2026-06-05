/**
 * POST /api/cron/highlight
 *
 * Fires each morning. If today's top story clears the highlight bar
 * (impact_score >= 85), it emails Aaron a /share link with a ready-to-post
 * 9:16 card + caption. Sends to Aaron only — never to subscribers.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 *
 *   curl -X POST https://nureine.de/api/cron/highlight \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { sendHighlightEmailIfWorthy } from '$lib/server/newsletter';

export async function POST({ request }) {
	if (!CRON_SECRET) {
		console.error('[cron/highlight] CRON_SECRET not configured');
		return json({ error: 'Server misconfigured' }, { status: 500 });
	}
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await sendHighlightEmailIfWorthy();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/highlight] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
