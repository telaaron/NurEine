/**
 * POST /api/cron/push
 *
 * Sibling of the newsletter cron. Sends the daily lead story as an APNs push
 * to all active iOS device tokens. Schedule it for the same morning slot the
 * newsletter uses (~04:20 UTC / 06:25 CEST) once APNs is configured.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (same secret as the newsletter).
 *
 * Manual smoke test:
 *   curl -X POST https://nureine.de/api/cron/push \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { json, error } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { getLatestFeatured } from '$lib/server/queries';
import { sendDailyPush, pushConfigured } from '$lib/server/push';

export async function POST({ request }) {
	if (!CRON_SECRET) throw error(500, 'Cron secret not configured');

	const auth = request.headers.get('authorization') || '';
	if (auth !== `Bearer ${CRON_SECRET}`) throw error(401, 'Unauthorized');

	if (!pushConfigured()) {
		return json({ ok: false, reason: 'APNs not configured' }, { status: 200 });
	}

	const story = await getLatestFeatured();
	if (!story) return json({ ok: false, reason: 'No story to send' }, { status: 200 });

	const result = await sendDailyPush({
		id: story.id,
		title: story.title,
		shareHook: story.shareHook,
		dek: story.dek
	});

	return json({ ok: true, ...result });
}
