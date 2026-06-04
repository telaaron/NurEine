import { supabaseAdmin } from '$lib/server/supabase/client';

export const prerender = false;

export async function load() {
	const { data } = await supabaseAdmin
		.from('nureine_world_metrics')
		.select('*')
		.order('sort_order', { ascending: true });
	return { metrics: data ?? [] };
}
