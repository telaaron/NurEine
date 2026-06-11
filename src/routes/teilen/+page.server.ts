import { supabaseAdmin } from '$lib/server/supabase/client';

export const prerender = false;

// /teilen — Empfehlungs-Generator. Liefert ein paar Top-Stories zur optionalen Auswahl.
export async function load() {
	const { data } = await supabaseAdmin
		.from('nureine_stories')
		.select('id,title,category,impact_score')
		.gte('impact_score', 75)
		.not('image_url', 'is', null)
		.order('impact_score', { ascending: false })
		.limit(12);

	return {
		topStories: (data as { id: string; title: string; category: string; impact_score: number }[]) ?? []
	};
}
