import { supabaseAdmin } from '$lib/server/supabase/client';

export async function load() {
	const { data } = await supabaseAdmin
		.from('nureine_story_submissions')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(100);
	return { submissions: data ?? [] };
}
