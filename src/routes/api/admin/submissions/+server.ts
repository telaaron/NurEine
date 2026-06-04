import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { verifyAdminRequest } from '$lib/server/auth';

// POST { id, status: 'approved'|'rejected' } — moderate a submission. Admin-only.
export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!verifyAdminRequest(cookies)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	let body: { id?: number; status?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid body' }, { status: 400 });
	}
	if (!body.id || !['approved', 'rejected'].includes(body.status || '')) {
		return json({ error: 'id + valid status required' }, { status: 400 });
	}
	const { error } = await supabaseAdmin
		.from('nureine_story_submissions')
		.update({ status: body.status })
		.eq('id', body.id);
	if (error) return json({ error: 'Update failed' }, { status: 500 });
	return json({ ok: true });
};
