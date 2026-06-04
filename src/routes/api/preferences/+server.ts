import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { CATEGORY_SLUGS } from '$lib/categories';

/**
 * Update a subscriber's category preferences (no login).
 * Body: { email, token, categories: string[] }
 *
 * Auth: the subscriber's confirmation_token (same secret used for
 * confirm/unsubscribe links). Verified, NOT cleared — the prefs link must keep
 * working across emails.
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ungültige Anfrage.' }, { status: 400 });
	}

	const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
	const token = typeof body.token === 'string' ? body.token : '';
	const rawCats = Array.isArray(body.categories) ? body.categories : [];

	if (!email || !token) {
		return json({ error: 'Fehlende Angaben.' }, { status: 400 });
	}

	// Keep only valid, unique category slugs.
	const categories = [...new Set(rawCats.filter((c): c is string => typeof c === 'string' && CATEGORY_SLUGS.includes(c)))];
	// has_kids: true | false | null (only set if explicitly provided)
	const hasKids = typeof body.has_kids === 'boolean' ? body.has_kids : undefined;

	const { data: sub, error: lookupErr } = await supabaseAdmin
		.from('nureine_subscribers')
		.select('id, confirmation_token')
		.eq('email', email)
		.maybeSingle();

	if (lookupErr) return json({ error: 'Technischer Fehler.' }, { status: 500 });
	if (!sub) return json({ error: 'Abonnent nicht gefunden.' }, { status: 404 });
	if (!sub.confirmation_token || token !== sub.confirmation_token) {
		return json({ error: 'Ungültiger Link.' }, { status: 403 });
	}

	const { error: updErr } = await supabaseAdmin
		.from('nureine_subscribers')
		.update({
			categories,
			preferences_updated_at: new Date().toISOString(),
			...(hasKids !== undefined ? { has_kids: hasKids } : {})
		})
		.eq('id', sub.id);

	if (updErr) return json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 });

	return json({ ok: true, categories });
};
