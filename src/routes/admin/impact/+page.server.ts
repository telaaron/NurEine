import { supabaseAdmin } from '$lib/server/supabase/client';

// Liest die Impact-Routine-Läufe LIVE aus Supabase (nureine_impact_runs).
// Die Analyse erscheint dadurch schon VOR dem PR-Merge — die Routine schreibt
// beim Lauf direkt in die DB. Kein state.json-Datei-Umweg mehr.

export interface ImpactRun {
	run_date: string;
	status: 'ok' | 'blocked' | 'gate_failed';
	blocked_reason: string | null;
	scores: { gesamt?: number; [channel: string]: { Z: number; S: number; E: number; D: number } | number | undefined };
	channel: string | null;
	root_cause: string | null;
	change_summary: string | null;
	change_file: string | null;
	predicts: string | null;
	pr_url: string | null;
	pr_number: number | null;
	pr_state: 'open' | 'merged' | 'closed' | null;
	verify_of_date: string | null;
	verdict: 'confirmed' | 'rejected' | 'pending' | null;
	verdict_source: 'metric' | 'self' | 'mixed' | null;
	verdict_note: string | null;
	metrics: Record<string, number>;
	log_markdown: string | null;
}

export async function load() {
	const { data, error } = await supabaseAdmin
		.from('nureine_impact_runs')
		.select('*')
		.order('run_date', { ascending: false })
		.limit(60);

	if (error || !data) {
		return { ok: false as const, runs: [] as ImpactRun[] };
	}
	return { ok: true as const, runs: data as ImpactRun[] };
}
