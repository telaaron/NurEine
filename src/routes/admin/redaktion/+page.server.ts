import { supabaseAdmin } from '$lib/server/supabase/client';

// Redaktions-Monitor: welche Quellen werden abgefragt, was kommt durch, was wird
// abgelehnt (mit Grund). Speist sich aus nureine_rss_sources + nureine_fetch_log.
export async function load() {
	const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

	const [sourcesRes, logRes, recentRes] = await Promise.all([
		supabaseAdmin
			.from('nureine_rss_sources')
			.select('name,beat,source_type,is_primary,active')
			.order('beat', { ascending: true }),
		supabaseAdmin
			.from('nureine_fetch_log')
			.select('decision,reason,beat,impact_score')
			.gte('ran_at', since7d)
			.limit(5000),
		supabaseAdmin
			.from('nureine_fetch_log')
			.select('ran_at,source_name,beat,title,decision,reason,impact_score')
			.order('ran_at', { ascending: false })
			.limit(60)
	]);

	const sources = (sourcesRes.data as { name: string; beat: string | null; source_type: string | null; is_primary: boolean; active: boolean }[]) ?? [];
	const logs = (logRes.data as { decision: string; reason: string | null; beat: string | null; impact_score: number | null }[]) ?? [];
	const recent = (recentRes.data as { ran_at: string; source_name: string | null; beat: string | null; title: string | null; decision: string; reason: string | null; impact_score: number | null }[]) ?? [];

	// Aggregate: Entscheidungen + Ablehnungsgründe (7 Tage).
	const decisions = { accepted: 0, rejected_ai: 0, rejected_prefilter: 0 };
	const reasons = new Map<string, number>();
	const byBeat = new Map<string, { accepted: number; rejected: number }>();
	const scoreBuckets = { '85+': 0, '65-84': 0, '45-64': 0, '25-44': 0, '<25': 0 };

	for (const l of logs) {
		if (l.decision in decisions) decisions[l.decision as keyof typeof decisions] += 1;
		if (l.decision !== 'accepted' && l.reason) reasons.set(l.reason, (reasons.get(l.reason) ?? 0) + 1);
		const beat = l.beat || 'allgemein';
		const b = byBeat.get(beat) ?? { accepted: 0, rejected: 0 };
		if (l.decision === 'accepted') b.accepted += 1;
		else b.rejected += 1;
		byBeat.set(beat, b);
		if (l.decision === 'accepted' && typeof l.impact_score === 'number') {
			const s = l.impact_score;
			if (s >= 85) scoreBuckets['85+'] += 1;
			else if (s >= 65) scoreBuckets['65-84'] += 1;
			else if (s >= 45) scoreBuckets['45-64'] += 1;
			else if (s >= 25) scoreBuckets['25-44'] += 1;
			else scoreBuckets['<25'] += 1;
		}
	}

	// Quellen je Beat gruppieren.
	const sourcesByBeat = new Map<string, typeof sources>();
	for (const s of sources) {
		const beat = s.beat || 'allgemein';
		if (!sourcesByBeat.has(beat)) sourcesByBeat.set(beat, []);
		sourcesByBeat.get(beat)!.push(s);
	}

	return {
		decisions,
		reasons: [...reasons.entries()].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n),
		byBeat: [...byBeat.entries()].map(([beat, v]) => ({ beat, ...v })).sort((a, b) => b.accepted - a.accepted),
		scoreBuckets,
		sourcesByBeat: [...sourcesByBeat.entries()].map(([beat, list]) => ({ beat, sources: list })),
		recent,
		totalSources: sources.length,
		activeSources: sources.filter((s) => s.active).length
	};
}
