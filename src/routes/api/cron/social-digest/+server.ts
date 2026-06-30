/**
 * POST /api/cron/social-digest
 * Legt sonntags den Wochen-Digest-Carousel an (Idee #10, status 'draft').
 * Im Autopilot wird er direkt im selben Lauf gepostet.
 * Auth: Bearer CRON_SECRET.
 *
 * Cron-Zeit: Sonntag (eigener Schedule, kollidiert NICHT mit dem täglichen
 * social-generate — der Digest ist ein zusätzlicher Wochen-Post).
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { generateDigestDraft, publishDue, getAppSetting } from '$lib/server/social/queue';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
	if (!CRON_SECRET) return json({ error: 'Server misconfigured' }, { status: 500 });
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await generateDigestDraft();
		const autopilot =
			(await getAppSetting('social_autopilot')) === 'true' || env.SOCIAL_AUTOPILOT === 'true';
		const published = autopilot && result.created ? await publishDue() : null;
		return json({ ok: true, ...result, autopilot, published });
	} catch (err) {
		console.error('[cron/social-digest] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
