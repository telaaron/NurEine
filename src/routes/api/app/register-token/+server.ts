import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { CATEGORY_SLUGS } from '$lib/categories';

/**
 * POST /api/app/register-token
 *
 * The iOS app calls this after the user grants push permission and APNs
 * returns a device token. Upsert on the token (re-registering the same device
 * just refreshes it and re-activates it). No auth: the token itself is the
 * opaque identifier, exactly like a newsletter confirmation token — there is
 * nothing sensitive to protect and no user account to tie it to.
 *
 * Body: { token: string, platform?: 'ios', categories?: string[] }
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ungültige Anfrage.' }, { status: 400 });
	}

	const token = typeof body.token === 'string' ? body.token.trim() : '';
	if (!token || token.length > 400) {
		return json({ error: 'Kein gültiges Token.' }, { status: 400 });
	}

	const platform = body.platform === 'android' ? 'android' : 'ios';
	const categories = Array.isArray(body.categories)
		? [...new Set(body.categories.filter((c): c is string => typeof c === 'string' && CATEGORY_SLUGS.includes(c)))]
		: [];

	const { error } = await supabaseAdmin
		.from('nureine_device_tokens')
		.upsert(
			{ token, platform, categories, active: true },
			{ onConflict: 'token' }
		);

	if (error) {
		console.error('[register-token] upsert failed:', error);
		return json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 });
	}

	return json({ ok: true });
};
