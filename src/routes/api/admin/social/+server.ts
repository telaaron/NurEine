import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAdminRequest } from '$lib/server/auth';
import { updateSocialPost, generateTodayDraft, publishPostNow } from '$lib/server/social/queue';

// POST — admin actions on the social queue.
//   { action: 'update', id, patch: { ... } }
//   { action: 'generate' }   → manually trigger today's draft
//   { action: 'post-now', id } → post this entry to Instagram right now
export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: { action?: string; id?: number; patch?: Record<string, unknown> };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid body' }, { status: 400 });
	}

	if (body.action === 'generate') {
		const result = await generateTodayDraft();
		return json({ ok: true, ...result });
	}

	if (body.action === 'post-now') {
		if (!body.id) return json({ error: 'id required' }, { status: 400 });
		const result = await publishPostNow(body.id);
		return result.ok
			? json({ ok: true, reason: result.reason, mediaId: result.mediaId })
			: json({ error: result.reason }, { status: 500 });
	}

	if (body.action === 'update') {
		if (!body.id) return json({ error: 'id required' }, { status: 400 });
		const allowed = ['caption', 'hashtags', 'status', 'saves', 'reach', 'scheduled_for'] as const;
		const patch: Record<string, unknown> = {};
		for (const k of allowed) {
			if (body.patch && k in body.patch) patch[k] = body.patch[k];
		}
		if (patch.status && !['draft', 'approved', 'posted', 'skipped', 'failed'].includes(patch.status as string)) {
			return json({ error: 'invalid status' }, { status: 400 });
		}
		const ok = await updateSocialPost(body.id, patch);
		return ok ? json({ ok: true }) : json({ error: 'update failed' }, { status: 500 });
	}

	return json({ error: 'unknown action' }, { status: 400 });
};
