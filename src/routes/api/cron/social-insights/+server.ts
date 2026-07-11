/**
 * POST /api/cron/social-insights
 * Zieht IG-Insights (saves/reach/likes/shares) für geposteten Content der
 * letzten 30 Tage in die DB. No-op ohne IG-Token. Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { refreshInsights } from '$lib/server/social/queue';

// 120s: viele Graph-Calls, aber jetzt parallel + gecappt (refreshInsights).
export const config = { maxDuration: 120 };

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await refreshInsights();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/social-insights] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
