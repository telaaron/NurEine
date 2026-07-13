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

	// Map to a named funnel event for the two we chart (open/click); log every
	// other Brevo event under the generic `email_event` (real type in props.event)
	// so we keep full deliverability data without a CHECK migration per type.
	let name: 'email_open' | 'email_click' | 'email_event';
	if (ev === 'opened' || ev === 'unique_opened' || ev === 'proxy_open') name = 'email_open';
	else if (ev === 'click') name = 'email_click';
	else name = 'email_event';

	if (ev) {
		try {
			await supabaseAdmin.from('nureine_events').insert({
				name,
				props: { provider: 'brevo', event: ev, hasEmail: !!email, tag: body.tag ?? null },
				referrer: typeof body.link === 'string' ? body.link.slice(0, 512) : null
			});
		} catch {
			/* swallow — never fail the webhook */
		}
	}

	// improvement #5: newsletter_open_rate war strukturell 0 (opened wurde nie
	// gesetzt). logSend() speichert keine Brevo-messageId, also mappen wir per
	// E-Mail + Zeit: bei einem open-Event den Send markieren, der ZEITLICH am
	// besten passt — der letzte Send dieses Subscribers VOR dem Öffnungszeitpunkt.
	// (Nicht pauschal den jüngsten: eine späte Öffnung eines alten Newsletters
	// darf nicht den neuesten Send als geöffnet markieren.) Idempotent (opened=
	// false-Filter), best-effort, bricht den Webhook nie ab. Die echte E-Mail wird
	// NUR zum Matchen genutzt, nicht in nureine_events gespeichert (Datenschutz).
	if (name === 'email_open' && email) {
		try {
			const { data: sub } = await supabaseAdmin
				.from('nureine_subscribers')
				.select('id')
				.eq('email', email)
				.maybeSingle();
			if (sub?.id) {
				// Brevo liefert die Event-Zeit als `ts_event` (Unix-Sekunden) oder `date`.
				const evTs =
					typeof body.ts_event === 'number'
						? new Date(body.ts_event * 1000)
						: typeof body.date === 'string'
							? new Date(body.date)
							: new Date();
				const evIso = isNaN(evTs.getTime()) ? new Date().toISOString() : evTs.toISOString();
				const { data: match } = await supabaseAdmin
					.from('nureine_newsletter_sends')
					.select('id')
					.eq('subscriber_id', sub.id)
					.eq('opened', false)
					.lte('sent_at', evIso) // nur Sends VOR der Öffnung
					.order('sent_at', { ascending: false })
					.limit(1)
					.maybeSingle();
				if (match?.id) {
					await supabaseAdmin
						.from('nureine_newsletter_sends')
						.update({ opened: true })
						.eq('id', match.id);
				}
			}
		} catch {
			/* swallow — never fail the webhook */
		}
	}

	return json({ ok: true });
};
