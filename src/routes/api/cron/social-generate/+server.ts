/**
 * POST /api/cron/social-generate
 * Legt täglich den Instagram-Post-Entwurf der Tagesstory an (status 'draft').
 * Im Autopilot wird der frische Draft direkt im selben Lauf gepostet —
 * der separate Publish-Cron (05:30) läuft VOR dem Generator (06:15) und kann
 * den Tages-Draft daher nie selbst posten (Race, siehe queue.ts nextPostSlot).
 * Auth: Bearer CRON_SECRET.
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { generateTodayDraft, publishDue, getAppSetting } from '$lib/server/social/queue';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await generateTodayDraft();
		const autopilot =
			(await getAppSetting('social_autopilot')) === 'true' || env.SOCIAL_AUTOPILOT === 'true';
		const published = autopilot ? await publishDue() : null;
		return json({ ok: true, ...result, autopilot, published });
	} catch (err) {
		console.error('[cron/social-generate] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
