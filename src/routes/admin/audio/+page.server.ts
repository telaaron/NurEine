import { supabaseAdmin } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/private';

// Audio-Cockpit: alle Vertonungen + ElevenLabs-Nutzung (Zeichen) der letzten 30 Tage.
export async function load() {
	const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

	const [voicedRes, candidatesRes] = await Promise.all([
		// Bereits vertonte Stories.
		supabaseAdmin
			.from('nureine_stories')
			.select('id,title,category,impact_score,audio_url,emotion,created_at')
			.not('audio_url', 'is', null)
			.order('created_at', { ascending: false })
			.limit(60),
		// Frische Top-Stories ohne Audio (zum Test-Vertonen).
		supabaseAdmin
			.from('nureine_stories')
			.select('id,title,category,impact_score,emotion')
			.is('audio_url', null)
			.gte('created_at', since30d)
			.gte('impact_score', 60)
			.order('impact_score', { ascending: false })
			.limit(20)
	]);

	// ElevenLabs-Nutzung (Zeichen) — usage/character-stats braucht KEIN user_read.
	let usage: { totalChars: number; days: { date: string; chars: number }[] } | null = null;
	if (env.ELEVENLABS_API_KEY) {
		try {
			const start = Date.now() - 30 * 24 * 60 * 60 * 1000;
			const end = Date.now();
			const r = await fetch(
				`https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${start}&end_unix=${end}`,
				{ headers: { 'xi-api-key': env.ELEVENLABS_API_KEY }, signal: AbortSignal.timeout(10000) }
			);
			if (r.ok) {
				const j = (await r.json()) as { time?: number[]; usage?: Record<string, number[]> };
				const times = j.time ?? [];
				// usage ist ein Objekt mit einer/mehreren Serien — summiere alle.
				const series = Object.values(j.usage ?? {});
				const perDay = times.map((_, i) => series.reduce((sum, s) => sum + (s[i] ?? 0), 0));
				usage = {
					totalChars: perDay.reduce((a, b) => a + b, 0),
					days: times.map((t, i) => ({ date: new Date(t).toISOString().slice(0, 10), chars: perDay[i] ?? 0 }))
				};
			}
		} catch {
			usage = null;
		}
	}

	return {
		voiced: (voicedRes.data as { id: string; title: string; category: string; impact_score: number; audio_url: string; emotion: string | null; created_at: string }[]) ?? [],
		candidates: (candidatesRes.data as { id: string; title: string; category: string; impact_score: number; emotion: string | null }[]) ?? [],
		usage,
		audioConfigured: !!env.ELEVENLABS_API_KEY
	};
}
