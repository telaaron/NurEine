import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { verifyAdminRequest } from '$lib/server/auth';
import { insertStory } from '$lib/server/queries';

// POST { id, status: 'approved'|'rejected' } — moderate a submission. Admin-only.
// On approval we also create a real story (draft) so it appears in the archive;
// the admin can then enrich/score it via /admin/stories/[id]/edit.
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

	// Load the submission first (needed to build the story on approval).
	const { data: sub } = await supabaseAdmin
		.from('nureine_story_submissions')
		.select('*')
		.eq('id', body.id)
		.maybeSingle();
	if (!sub) return json({ error: 'Submission not found' }, { status: 404 });

	let storyId: string | null = null;
	if (body.status === 'approved' && sub.status !== 'approved') {
		const validCats = ['klima', 'gesundheit', 'wissenschaft', 'gemeinschaft', 'tiere', 'kultur', 'innovation'];
		const category = validCats.includes(sub.category) ? sub.category : 'gemeinschaft';
		try {
			const res = await insertStory({
				title: sub.title,
				dek: sub.reason || 'Von der Community eingereicht.',
				body: sub.reason || sub.title,
				summary: 'Community-Einreichung — vor Veröffentlichung redaktionell prüfen.',
				sourceUrl: sub.source_url,
				source: 'Community',
				category,
				country: sub.region || null,
				impactScore: 50
			});
			storyId = res.lastInsertRowid || null;
		} catch (e) {
			console.error('approve→insertStory failed:', e);
			return json({ error: 'Story-Anlage fehlgeschlagen' }, { status: 500 });
		}
	}

	const { error } = await supabaseAdmin
		.from('nureine_story_submissions')
		.update({ status: body.status })
		.eq('id', body.id);
	if (error) return json({ error: 'Update failed' }, { status: 500 });

	return json({ ok: true, storyId });
};
