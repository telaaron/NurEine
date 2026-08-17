/**
 * POST /api/cron/social-publish
 * Postet fällige, freigegebene Instagram-Posts via Graph API.
 * No-op ohne IG-Token (Trockenlauf bleibt sicher). Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { publishDue } from '$lib/server/social/queue';

// Team-Board (reel-regie, 2026-08-17): 4x FUNCTION_INVOCATION_TIMEOUT bei 60s —
// Reel-Container brauchen bei Meta oft länger bis FINISHED als der bisherige
// Container-Poll (25s) + Publish-Retries + Netzwerk-Overhead in 60s passen.
// 120s wie bei /api/cron/social-insights, dort erwiesen im selben Vercel-Plan.
export const config = { maxDuration: 120 };

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await publishDue();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/social-publish] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
