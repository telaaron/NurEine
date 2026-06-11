import { supabaseAdmin } from '$lib/server/supabase/client';

export const prerender = false;

// Öffentliches Vertrauenssignal: WIE NurEine arbeitet — welche Beats, welche
// Quellen, wie viel wir aus Primärquellen schöpfen. Bewusst KEINE Admin-Internals
// (keine abgelehnten Titel) — nur die transparente Arbeitsweise.
export async function load() {
	const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

	const [sourcesRes, beatStoriesRes, primaryCountRes] = await Promise.all([
		supabaseAdmin
			.from('nureine_rss_sources')
			.select('name,beat,source_type,is_primary')
			.eq('active', true)
			.not('beat', 'is', null),
		supabaseAdmin
			.from('nureine_stories')
			.select('beat,source_type')
			.gte('created_at', since30d)
			.not('beat', 'is', null),
		supabaseAdmin
			.from('nureine_stories')
			.select('id', { count: 'exact', head: true })
			.eq('source_type', 'official_stats')
	]);

	const sources = (sourcesRes.data as { name: string; beat: string; source_type: string | null; is_primary: boolean }[]) ?? [];
	const beatStories = (beatStoriesRes.data as { beat: string; source_type: string | null }[]) ?? [];

	// Quellen je Beat + Funde (30 Tage) je Beat.
	const beatMap = new Map<string, { sources: { name: string; type: string | null; primary: boolean }[]; finds: number }>();
	for (const s of sources) {
		if (!beatMap.has(s.beat)) beatMap.set(s.beat, { sources: [], finds: 0 });
		beatMap.get(s.beat)!.sources.push({ name: s.name, type: s.source_type, primary: s.is_primary });
	}
	for (const st of beatStories) {
		if (!beatMap.has(st.beat)) beatMap.set(st.beat, { sources: [], finds: 0 });
		beatMap.get(st.beat)!.finds += 1;
	}

	return {
		beats: [...beatMap.entries()].map(([beat, v]) => ({ beat, ...v })),
		totalSources: sources.length,
		primaryStoriesTotal: primaryCountRes.count ?? 0
	};
}
