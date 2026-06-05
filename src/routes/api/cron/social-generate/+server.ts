/**
 * POST /api/cron/social-generate
 * Legt täglich den Instagram-Post-Entwurf der Tagesstory an (status 'draft').
 * Postet NICHTS. Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { generateTodayDraft } from '$lib/server/social/queue';

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await generateTodayDraft();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/social-generate] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
