/**
 * POST /api/cron/curation-reminder
 *
 * Läuft am Vorabend (vor dem 04:20-UTC-Versand). Schickt Aaron eine Erinnerung,
 * FALLS er die Story für morgen noch nicht freigegeben hat. Hat er freigegeben
 * → no-op. Der Auto-Fallback (beste kuratierte ≥7.0) greift unabhängig davon.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 *
 *   curl -X POST https://nureine.de/api/cron/curation-reminder \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { json, error } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { sendCurationReminderIfPending } from '$lib/server/newsletter';

export async function POST({ request }) {
  if (!CRON_SECRET) {
    console.error('[cron/curation-reminder] CRON_SECRET not configured');
    throw error(500, 'Cron secret not configured');
  }
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    throw error(401, 'Unauthorized');
  }
  try {
    const result = await sendCurationReminderIfPending();
    return json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/curation-reminder] failed:', err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
