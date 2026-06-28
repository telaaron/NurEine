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

export interface CurationOption {
	story_id: string;
	title?: string;
	summary?: string;
	resonance_score?: number;
	rationale?: string;
	ig_caption?: string;
	mail_subject?: string;
	is_pearl?: boolean;
	below_bar?: boolean;
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
	options: CurationOption[];
	// joined Story-Felder
	story_title?: string | null;
	story_summary?: string | null;
	story_category?: string | null;
}

export interface SourceQuality {
	source_name: string;
	stories: number;
	bewertet: number;
	avg_resonanz: number | null;
	avg_impact: number | null;
	stark_7plus: number;
	perlen_75plus: number;
	pct_stark: number | null;
	letzte_story: string | null;
	hero_eligible: boolean;
}

export interface CalibrationRow {
	id: string;
	title: string;
	category: string | null;
	resonance_score: number | null;
	impact_score: number | null;
	is_hero: boolean;
	published_at: string | null;
	reads: number;
	shares: number;
	cta: number;
}

export async function load() {
	const [runsRes, curationRes, sourcesRes, calibrationRes] = await Promise.all([
		supabaseAdmin.from('nureine_impact_runs').select('*').order('run_date', { ascending: false }).limit(60),
		// Kurations-Queue: offene Vorschläge (proposed/approved) für heute+morgen.
		supabaseAdmin
			.from('nureine_curation_queue')
			.select('*, story:story_id(title,summary,category)')
			.in('status', ['proposed', 'approved'])
			.order('for_date', { ascending: true }),
		// Quellen-Performance: welche Quelle bringt was (aus dem View).
		supabaseAdmin
			.from('nureine_source_quality')
			.select('*')
			.gte('bewertet', 3)
			.order('avg_resonanz', { ascending: false, nullsFirst: false }),
		// Resonanz-vs-Realität: Bewertung neben echtem Verhalten (Kalibrierung).
		supabaseAdmin
			.from('nureine_resonance_vs_reality')
			.select('*')
			.order('published_at', { ascending: false })
			.limit(12)
	]);

	const sources: SourceQuality[] = (sourcesRes.data ?? []) as SourceQuality[];
	const calibration: CalibrationRow[] = (calibrationRes.data ?? []) as CalibrationRow[];

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
			options: ((r.draft as { options?: CurationOption[] } | null)?.options) ?? [],
			story_title: story?.title ?? null,
			story_summary: story?.summary ?? null,
			story_category: story?.category ?? null
		};
	});

	const { data, error } = runsRes;
	if (error || !data) {
		return { ok: false as const, runs: [] as ImpactRun[], active: null, doneCount: 0, curation, sources, calibration };
	}
	const runs = data as ImpactRun[];

	// "Aktiv" = neuester Lauf, dessen PR noch offen ist (oder der blockiert/gate_failed
	// war und damit deine Aufmerksamkeit braucht). Abgehakte Läufe (merged/closed)
	// wandern in den History-Tab. Trend wird aus ALLEN Läufen gerechnet.
	const isDone = (r: ImpactRun) => r.pr_state === 'merged' || r.pr_state === 'closed';
	const active = runs.find((r) => !isDone(r)) ?? null;
	const doneCount = runs.filter(isDone).length;

	return { ok: true as const, runs, active, doneCount, curation, sources, calibration };
}
