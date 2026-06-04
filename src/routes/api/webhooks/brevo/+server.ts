import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/private';

/**
 * Brevo transactional event webhook → first-party email metrics.
 *
 * Configure in Brevo (Transactional → Settings → Webhook):
 *   URL:  https://nureine.de/api/webhooks/brevo?secret=<BREVO_WEBHOOK_SECRET>
 *   Events: opened (unique), click, delivered, soft_bounce, hard_bounce, spam
 *
 * We map opens/clicks to nureine_events (email_open / email_click) so the admin
 * funnel shows real open- and click-rates. Category-level taste learning stays
 * on the /r click-redirect (it carries the story category); this webhook is for
 * aggregate deliverability + engagement metrics.
 *
 * Auth: shared `secret` query param (Brevo has no signing). Set
 * BREVO_WEBHOOK_SECRET in env and in the Brevo webhook URL.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const expected = env.BREVO_WEBHOOK_SECRET;
	if (expected && url.searchParams.get('secret') !== expected) {
		return json({ ok: false }, { status: 401 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: true }); // never make Brevo retry on a parse issue
	}

	// Brevo sends `event` like: "opened" | "unique_opened" | "click" | "delivered" | ...
	const ev = String(body.event || '');
	const email = typeof body.email === 'string' ? body.email : null;

	let name: 'email_open' | 'email_click' | null = null;
	if (ev === 'opened' || ev === 'unique_opened') name = 'email_open';
	else if (ev === 'click') name = 'email_click';

	if (name) {
		try {
			await supabaseAdmin.from('nureine_events').insert({
				name,
				props: { provider: 'brevo', event: ev, hasEmail: !!email },
				referrer: typeof body.link === 'string' ? body.link.slice(0, 512) : null
			});
		} catch {
			/* swallow — never fail the webhook */
		}
	}

	return json({ ok: true });
};
