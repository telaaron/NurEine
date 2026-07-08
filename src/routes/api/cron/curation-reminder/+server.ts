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

export async function POST({ request }) {
  if (!CRON_SECRET) {
    console.error('[cron/curation-reminder] CRON_SECRET not configured');
    throw error(500, 'Cron secret not configured');
  }
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    throw error(401, 'Unauthorized');
  }
  // ABGESCHALTET (2026-07-08, Aaron): Wir laufen wieder voll autonom. Die
  // Story-Auswahl macht der Chefredakteur-Agent (docs/AI_QUALITY_SYSTEM.md);
  // ein Vorabend-Freigabe-Reminder passt nicht mehr ins Modell (und zeigte die
  // alte 0–10-Skala). Der zugehörige GitHub-Cron wurde entfernt. Endpoint bleibt
  // als No-op bestehen, damit ein evtl. manueller Aufruf nichts Falsches mailt.
  return json({ ok: true, sent: false, reason: 'curation reminder deaktiviert — System läuft autonom (Chefredakteur wählt)' });
}
