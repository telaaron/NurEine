import { supabaseAdmin } from '$lib/server/supabase/client';

export const prerender = false;

export async function load() {
	const { data } = await supabaseAdmin
		.from('nureine_changelog')
		.select('released_at,status,category,title,description')
		.order('released_at', { ascending: false })
		.limit(100);

	const all = (data as { released_at: string; status: string; category: string | null; title: string; description: string | null }[]) ?? [];

	return {
		shipped: all.filter((e) => e.status === 'shipped'),
		inProgress: all.filter((e) => e.status === 'in_progress'),
		planned: all.filter((e) => e.status === 'planned')
	};
}
