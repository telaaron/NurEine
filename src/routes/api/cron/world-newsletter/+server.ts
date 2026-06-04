/**
 * POST /api/cron/world-newsletter
 *
 * Sends the monthly "Stand der Welt" newsletter to all confirmed subscribers.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 *
 *   curl -X POST https://nureine.de/api/cron/world-newsletter \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { json } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import { sendWorldMetricsNewsletter, renderWorldMetricsHtml } from '$lib/server/newsletter';
import { verifyAdminRequest } from '$lib/server/auth';

// GET ?email= → admin-only HTML preview (no send).
export async function GET({ url, cookies }) {
	if (!verifyAdminRequest(cookies)) return new Response('Unauthorized', { status: 401 });
	const html = await renderWorldMetricsHtml(url.searchParams.get('email') || 'preview@nureine.de');
	if (!html) return new Response('No metrics to render', { status: 404 });
	return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST({ request }) {
	if (!CRON_SECRET) {
		console.error('[cron/world-newsletter] CRON_SECRET not configured');
		return json({ error: 'Server misconfigured' }, { status: 500 });
	}
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const result = await sendWorldMetricsNewsletter();
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron/world-newsletter] failed:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
