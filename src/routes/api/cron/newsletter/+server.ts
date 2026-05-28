/**
 * POST /api/cron/newsletter
 *
 * Triggered by the Cloudflare Worker cron (workers/newsletter-cron).
 * Authentication: Authorization: Bearer <CRON_SECRET>.
 *
 * The Worker only acts as a scheduler — every byte of sending logic lives in
 * src/lib/server/newsletter.ts so it stays editable with the rest of the app.
 *
 * Manual trigger (admin emergency / smoke test):
 *   curl -X POST https://nureine.de/api/cron/newsletter \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

import { json, error } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { sendDailyNewsletter } from '$lib/server/newsletter';

export async function POST({ request }) {
  if (!CRON_SECRET) {
    console.error('[cron/newsletter] CRON_SECRET env var not configured');
    throw error(500, 'Cron secret not configured');
  }

  const auth = request.headers.get('authorization') || '';
  const expected = `Bearer ${CRON_SECRET}`;
  if (auth !== expected) {
    console.warn('[cron/newsletter] unauthorized request');
    throw error(401, 'Unauthorized');
  }

  try {
    const result = await sendDailyNewsletter();
    return json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/newsletter] run failed:', err);
    return json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
