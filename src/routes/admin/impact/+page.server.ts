import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Liest das von der Impact-Routine committete state.json (Single Source of Truth
// fürs Dashboard). Bewusst KEIN DB-Call — die Routine hat die Bewertung schon
// gemacht; wir rendern nur. Fällt leer-aber-valide aus, falls noch kein Lauf war.

export interface ImpactScores {
	Z: number;
	S: number;
	E: number;
	D: number;
	gesamt: number;
}
export interface ImpactHistory {
	date: string;
	scores: ImpactScores;
	channels?: Record<string, Omit<ImpactScores, 'gesamt'>>;
}
export interface ImpactHypothesis {
	id: string;
	created: string;
	channel: string;
	root_cause: string;
	change: string;
	file?: string;
	commit_sha?: string;
	predicts?: string;
	status: 'applied' | 'confirmed' | 'rejected';
	verdict_source?: 'metric' | 'self' | 'mixed';
	verdict_note?: string;
}
interface ImpactState {
	history: ImpactHistory[];
	open_hypotheses: ImpactHypothesis[];
	last_run: string | null;
}

export async function load() {
	const path = join(process.cwd(), 'nureine-impact', 'state.json');
	try {
		const raw = await readFile(path, 'utf-8');
		const state = JSON.parse(raw) as Partial<ImpactState>;
		const history = (state.history ?? []).filter((h) => h?.scores);
		return {
			ok: true as const,
			history,
			openHypotheses: state.open_hypotheses ?? [],
			lastRun: state.last_run ?? null
		};
	} catch {
		// Datei fehlt oder kaputt → Dashboard zeigt Leerzustand statt 500.
		return { ok: false as const, history: [], openHypotheses: [], lastRun: null };
	}
}
