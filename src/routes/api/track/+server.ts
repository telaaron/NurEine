import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';

/**
 * First-party funnel-event tracking.
 * Body: { name, props?, path?, referrer?, session_id? }
 *
 * Privacy: no cookies, no PII. session_id is an anonymous client-random value.
 * Fire-and-forget — always returns 200 quickly so it never blocks UX.
 */

const ALLOWED = new Set([
	'pageview',
	'newsletter_signup',
	'newsletter_signup_attempt',
	'story_read',
	'cta_click',
	'share',
	'ticker_click',
	'archive_filter',
	'story_submitted',
	'story_shared'
]);

export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	const name = typeof body.name === 'string' ? body.name : '';
	if (!ALLOWED.has(name)) {
		return json({ ok: false, error: 'invalid_event' }, { status: 400 });
	}

	// Sanitize: keep props small + drop anything PII-ish on the client side.
	const props =
		body.props && typeof body.props === 'object' ? (body.props as Record<string, unknown>) : {};
	const path = typeof body.path === 'string' ? body.path.slice(0, 512) : null;
	const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 512) : null;
	const session_id = typeof body.session_id === 'string' ? body.session_id.slice(0, 64) : null;

	try {
		await supabaseAdmin
			.from('nureine_events')
			.insert({ name, props, path, referrer, session_id });
	} catch {
		// Never surface tracking failures to the user.
		return json({ ok: true });
	}

	return json({ ok: true });
};
