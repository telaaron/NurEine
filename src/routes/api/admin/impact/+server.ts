import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAdminRequest } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase/client';

// POST — Admin-Aktionen auf den Impact-Läufen.
//   { action: 'mark-merged', id }   → PR als gemerged abhaken (wandert in History)
//   { action: 'mark-closed', id }    → PR verworfen/geschlossen (ohne Merge)
export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: { action?: string; id?: number };
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

	// Kurations-Queue: Vorschlag für morgen freigeben/ablehnen.
	if ((body.action === 'curation-approve' || body.action === 'curation-reject') && body.id) {
		const status = body.action === 'curation-approve' ? 'approved' : 'rejected';

		// Die freizugebende Zeile holen (Kanal + Story).
		const { data: item, error: fetchErr } = await supabaseAdmin
			.from('nureine_curation_queue')
			.select('id, channel, story_id')
			.eq('id', body.id)
			.maybeSingle();
		if (fetchErr || !item) return json({ error: fetchErr?.message ?? 'not found' }, { status: 404 });

		const { error } = await supabaseAdmin
			.from('nureine_curation_queue')
			.update({ status, decided_at: new Date().toISOString() })
			.eq('id', body.id);
		if (error) return json({ error: error.message }, { status: 500 });

		// DER DRAHT: Freigabe des HERO-Kanals macht die Story exklusiv zum Hero.
		// is_hero wird sonst nirgends automatisch gesetzt (nur manuell im Admin) —
		// daher kein Konflikt mit der DeepSeek-Pipeline. Feed + Newsletter lesen is_hero.
		if (body.action === 'curation-approve' && item.channel === 'hero' && item.story_id) {
			// erst alle entflaggen, dann die kuratierte setzen (exklusiv, genau eine Hero).
			await supabaseAdmin.from('nureine_stories').update({ is_hero: false }).eq('is_hero', true);
			const { error: heroErr } = await supabaseAdmin
				.from('nureine_stories')
				.update({ is_hero: true })
				.eq('id', item.story_id);
			if (heroErr) return json({ error: heroErr.message }, { status: 500 });
			return json({ ok: true, status, hero_set: item.story_id });
		}

		return json({ ok: true, status });
	}

	return json({ error: 'Unknown action' }, { status: 400 });
};
