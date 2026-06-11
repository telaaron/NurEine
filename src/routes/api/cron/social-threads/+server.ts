/**
 * POST /api/cron/social-threads
 * Postet die stärkste frische Story auf Threads (1/Tag). No-op ohne Threads-Token.
 * Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { publishThreadsDue } from '$lib/server/social/threads';

export const config = { maxDuration: 60 };

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await publishThreadsDue();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/social-threads] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
