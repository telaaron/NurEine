import { supabaseAdmin } from '$lib/server/supabase/client';

/**
 * KI-Cockpit — die EINE Seite fürs autonome Agenten-System (docs/AI_QUALITY_SYSTEM.md).
 * Zeigt: was die Nacht-Agenten taten (nureine_ai_runs), was das System lernen will
 * (nureine_improvements), die heutigen Perlen (nureine_curation_queue) und die
 * Story-Qualität (resonance/impact + Quellen-Perlenrate). Bewusst schlank: nur das,
 * was Aaron gezielt anschauen will, der Rest läuft autonom.
 */
export async function load() {
	const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);

	const [runsRes, improvementsRes, curationRes, cronRes, qualityRes, sourceRes] = await Promise.all([
		// Agentenläufe (Herzstück)
		supabaseAdmin
			.from('nureine_ai_runs')
			.select('id,agent,layer,status,model,started_at,finished_at,metrics,summary,error')
			.order('started_at', { ascending: false })
			.limit(40),
		// Selbstlern-Ideen
		supabaseAdmin
			.from('nureine_improvements')
			.select('id,created_at,proposed_by,kind,target,title,rationale,hypothesis,metric,priority,status,baseline,result,outcome,applied_ref')
			.order('priority', { ascending: true })
			.order('created_at', { ascending: false })
			.limit(60),
		// Heutige Perlen (Kurations-Queue)
		supabaseAdmin
			.from('nureine_curation_queue')
			.select('for_date,channel,story_id,resonance_score,rationale,is_pearl,status')
			.gte('for_date', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
			.order('for_date', { ascending: false }),
		// Cron-Health (laufen die Pipeline-Jobs?)
		supabaseAdmin
			.from('nureine_cron_runs')
			.select('job,status,ran_at,detail')
			.order('ran_at', { ascending: false })
			.limit(20),
		// Story-Qualität der letzten 14 Tage
		supabaseAdmin
			.from('nureine_stories')
			.select('resonance_score,impact_score,ig_ok,category,created_at')
			.gte('created_at', since14d)
			.limit(2000),
		// Quellen-Perlenrate
		supabaseAdmin
			.from('nureine_source_quality')
			.select('source_name,stories,avg_impact,pct_stark,perlen_75plus,hero_eligible')
			.order('pct_stark', { ascending: false, nullsFirst: false })
			.limit(30)
	]);

	const runs = runsRes.data ?? [];
	const improvements = improvementsRes.data ?? [];
	const curation = curationRes.data ?? [];
	const cron = cronRes.data ?? [];
	const stories = (qualityRes.data as { resonance_score: number | null; impact_score: number | null; ig_ok: boolean | null; category: string | null }[]) ?? [];
	const sources = sourceRes.data ?? [];

	// Aggregat Story-Qualität: Verteilung resonance_score (0–100)
	const resBuckets = { '80+': 0, '60-79': 0, '40-59': 0, '20-39': 0, '<20': 0, 'unbewertet': 0 };
	let resSum = 0;
	let resCount = 0;
	for (const s of stories) {
		const r = s.resonance_score;
		if (r == null) {
			resBuckets['unbewertet']++;
			continue;
		}
		// Alt-Skala 0–10 auf 0–100 hochrechnen, damit die Verteilung stimmt
		const v = r <= 10 ? r * 10 : r;
		resSum += v;
		resCount++;
		if (v >= 80) resBuckets['80+']++;
		else if (v >= 60) resBuckets['60-79']++;
		else if (v >= 40) resBuckets['40-59']++;
		else if (v >= 20) resBuckets['20-39']++;
		else resBuckets['<20']++;
	}
	const avgResonance = resCount ? Math.round(resSum / resCount) : 0;
	const pearls14d = resBuckets['80+'];

	// Agent-Status: letzter Lauf je Agent
	const lastByAgent = new Map<string, (typeof runs)[number]>();
	for (const r of runs) if (!lastByAgent.has(r.agent)) lastByAgent.set(r.agent, r);

	// Improvement-Pipeline nach Status
	const improvementStats = { proposed: 0, applied: 0, verified: 0, rejected: 0 };
	let improvedCount = 0;
	for (const i of improvements) {
		if (i.status in improvementStats) improvementStats[i.status as keyof typeof improvementStats]++;
		if (i.outcome === 'improved') improvedCount++;
	}

	return {
		runs,
		lastByAgent: Array.from(lastByAgent.values()),
		improvements,
		improvementStats,
		improvedCount,
		curation,
		cron,
		quality: { resBuckets, avgResonance, pearls14d, total14d: stories.length },
		sources
	};
}
