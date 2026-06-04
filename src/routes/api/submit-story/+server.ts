import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { CATEGORY_SLUGS } from '$lib/categories';

/**
 * Community story submission (UGC). Public, no login.
 * Body: { title, source_url, reason?, category?, region?, submitter_email? }
 * Lands in nureine_story_submissions (status=pending) for admin moderation.
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ungültige Anfrage.' }, { status: 400 });
	}

	const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
	const sourceUrl = typeof body.source_url === 'string' ? body.source_url.trim().slice(0, 600) : '';
	const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
	const category =
		typeof body.category === 'string' && CATEGORY_SLUGS.includes(body.category) ? body.category : null;
	const region = typeof body.region === 'string' ? body.region.trim().slice(0, 120) : null;
	const submitterEmail =
		typeof body.submitter_email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.submitter_email)
			? body.submitter_email.trim().toLowerCase()
			: null;

	if (!title || !sourceUrl) {
		return json({ error: 'Titel und Quelle-Link sind erforderlich.' }, { status: 400 });
	}
	// Basic URL sanity.
	try {
		const u = new URL(sourceUrl);
		if (!['http:', 'https:'].includes(u.protocol)) throw new Error('proto');
	} catch {
		return json({ error: 'Bitte gib einen gültigen Link an.' }, { status: 400 });
	}

	const { error } = await supabaseAdmin.from('nureine_story_submissions').insert({
		title,
		source_url: sourceUrl,
		reason: reason || null,
		category,
		region,
		submitter_email: submitterEmail
	});

	if (error) {
		console.error('submit-story insert error:', error);
		return json({ error: 'Speichern fehlgeschlagen. Bitte später erneut.' }, { status: 500 });
	}

	return json({ ok: true });
};
