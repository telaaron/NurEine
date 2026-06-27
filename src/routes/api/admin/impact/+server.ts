import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAdminRequest } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase/client';

// POST — Admin-Aktionen auf den Impact-Läufen.
//   { action: 'mark-merged', id }   → PR als gemerged abhaken (wandert in History)
//   { action: 'mark-closed', id }    → PR verworfen/geschlossen (ohne Merge)
export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: { action?: string; id?: number; storyId?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid body' }, { status: 400 });
	}

	if ((body.action === 'mark-merged' || body.action === 'mark-closed') && body.id) {
		const pr_state = body.action === 'mark-merged' ? 'merged' : 'closed';
		const { error } = await supabaseAdmin
			.from('nureine_impact_runs')
			.update({ pr_state })
			.eq('id', body.id);
		if (error) return json({ error: error.message }, { status: 500 });
		return json({ ok: true, pr_state });
	}

	// Kurations-Queue: eine der Top-3-Optionen freigeben (oder ganz ablehnen).
	// storyId = die vom Admin gewählte Option (eine der draft.options). Diese eine
	// Auswahl verdrahtet ALLES: Hero (Feed+Mail) + IG-Post (autonom). Kein Kanal-Tor.
	if ((body.action === 'curation-approve' || body.action === 'curation-reject') && body.id) {
		const status = body.action === 'curation-approve' ? 'approved' : 'rejected';

		const { data: item, error: fetchErr } = await supabaseAdmin
			.from('nureine_curation_queue')
			.select('id, channel, story_id, draft')
			.eq('id', body.id)
			.maybeSingle();
		if (fetchErr || !item) return json({ error: fetchErr?.message ?? 'not found' }, { status: 404 });

		if (body.action === 'curation-reject') {
			const { error } = await supabaseAdmin
				.from('nureine_curation_queue')
				.update({ status, decided_at: new Date().toISOString() })
				.eq('id', body.id);
			if (error) return json({ error: error.message }, { status: 500 });
			return json({ ok: true, status });
		}

		// --- Freigabe: gewählte Option bestimmen ---
		type Opt = { story_id: string; ig_caption?: string; mail_subject?: string; resonance_score?: number; rationale?: string };
		const options: Opt[] = ((item.draft as { options?: Opt[] } | null)?.options) ?? [];
		const chosenId = body.storyId || item.story_id;
		if (!chosenId) return json({ error: 'keine Story gewählt' }, { status: 400 });
		const chosen = options.find((o) => o.story_id === chosenId);

		// Queue-Zeile auf die gewählte Option festschreiben (für Dashboard-Anzeige).
		const newDraft = {
			...(item.draft as object),
			chosen_story_id: chosenId,
			ig_caption: chosen?.ig_caption ?? null,
			mail_subject: chosen?.mail_subject ?? null
		};
		const { error: updErr } = await supabaseAdmin
			.from('nureine_curation_queue')
			.update({ status, story_id: chosenId, decided_at: new Date().toISOString(), draft: newDraft })
			.eq('id', body.id);
		if (updErr) return json({ error: updErr.message }, { status: 500 });

		// DER DRAHT: exklusiv Hero setzen (Feed + Mail lesen is_hero).
		await supabaseAdmin.from('nureine_stories').update({ is_hero: false }).eq('is_hero', true);
		const { error: heroErr } = await supabaseAdmin
			.from('nureine_stories')
			.update({ is_hero: true })
			.eq('id', chosenId);
		if (heroErr) return json({ error: heroErr.message }, { status: 500 });

		// IG-POST AUTONOM: einen approved IG-Post-Draft für die gewählte Story anlegen,
		// damit der Publish-Cron (social-publish) ihn postet — ohne weiteres Tor.
		// Idempotent über den (story_id, platform)-Unique-Index der Post-Queue.
		await supabaseAdmin
			.from('nureine_social_posts')
			.upsert(
				{
					story_id: chosenId,
					platform: 'instagram',
					caption: chosen?.ig_caption ?? '',
					status: 'approved'
				},
				{ onConflict: 'story_id,platform' }
			);

		return json({ ok: true, status, hero_set: chosenId, ig_queued: true });
	}

	return json({ error: 'Unknown action' }, { status: 400 });
};
