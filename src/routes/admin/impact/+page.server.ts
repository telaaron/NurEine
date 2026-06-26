import { supabaseAdmin } from '$lib/server/supabase/client';

// Liest die Impact-Routine-Läufe LIVE aus Supabase (nureine_impact_runs).
// Die Analyse erscheint dadurch schon VOR dem PR-Merge — die Routine schreibt
// beim Lauf direkt in die DB. Kein state.json-Datei-Umweg mehr.

export interface ImpactRun {
	id: number;
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

export interface CurationItem {
	id: number;
	for_date: string;
	channel: 'hero' | 'instagram' | 'email';
	story_id: string | null;
	resonance_score: number | null;
	rationale: string | null;
	is_pearl: boolean;
	below_bar: boolean;
	status: 'proposed' | 'approved' | 'rejected' | 'published';
	draft: Record<string, unknown>;
	// joined Story-Felder
	story_title?: string | null;
	story_summary?: string | null;
	story_category?: string | null;
}

export async function load() {
	const [runsRes, curationRes] = await Promise.all([
		supabaseAdmin.from('nureine_impact_runs').select('*').order('run_date', { ascending: false }).limit(60),
		// Kurations-Queue: offene Vorschläge (proposed/approved) für heute+morgen.
		supabaseAdmin
			.from('nureine_curation_queue')
			.select('*, story:story_id(title,summary,category)')
			.in('status', ['proposed', 'approved'])
			.order('for_date', { ascending: true })
	]);

	const curation: CurationItem[] = (curationRes.data ?? []).map((r) => {
		const story = (r as { story?: { title?: string; summary?: string; category?: string } }).story;
		return {
			id: r.id,
			for_date: r.for_date,
			channel: r.channel,
			story_id: r.story_id,
			resonance_score: r.resonance_score,
			rationale: r.rationale,
			is_pearl: r.is_pearl,
			below_bar: r.below_bar,
			status: r.status,
			draft: r.draft ?? {},
			story_title: story?.title ?? null,
			story_summary: story?.summary ?? null,
			story_category: story?.category ?? null
		};
	});

	const { data, error } = runsRes;
	if (error || !data) {
		return { ok: false as const, runs: [] as ImpactRun[], active: null, doneCount: 0, curation };
	}
	const runs = data as ImpactRun[];

	// "Aktiv" = neuester Lauf, dessen PR noch offen ist (oder der blockiert/gate_failed
	// war und damit deine Aufmerksamkeit braucht). Abgehakte Läufe (merged/closed)
	// wandern in den History-Tab. Trend wird aus ALLEN Läufen gerechnet.
	const isDone = (r: ImpactRun) => r.pr_state === 'merged' || r.pr_state === 'closed';
	const active = runs.find((r) => !isDone(r)) ?? null;
	const doneCount = runs.filter(isDone).length;

	return { ok: true as const, runs, active, doneCount, curation };
}
