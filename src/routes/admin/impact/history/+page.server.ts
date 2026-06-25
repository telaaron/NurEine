import { supabaseAdmin } from '$lib/server/supabase/client';
import type { ImpactRun } from '../+page.server';

// History = abgehakte Läufe (PR gemerged oder geschlossen). Der aktive/offene
// Lauf lebt auf der Hauptseite /admin/impact.
export async function load() {
	const { data, error } = await supabaseAdmin
		.from('nureine_impact_runs')
		.select('*')
		.in('pr_state', ['merged', 'closed'])
		.order('run_date', { ascending: false })
		.limit(200);

	if (error || !data) return { runs: [] as ImpactRun[] };
	return { runs: data as ImpactRun[] };
}
