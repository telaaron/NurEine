import { supabaseAdmin } from '$lib/server/supabase/client';

export const prerender = false;

export async function load({ url }) {
	const email = (url.searchParams.get('email') || '').toLowerCase().trim();
	const token = url.searchParams.get('token') || '';

	if (!email || !token) {
		return { ok: false, reason: 'missing' as const, email: '', token: '', categories: [] as string[] };
	}

	const { data: sub, error } = await supabaseAdmin
		.from('nureine_subscribers')
		.select('confirmation_token, categories, confirmed')
		.eq('email', email)
		.maybeSingle();

	if (error || !sub) {
		return { ok: false, reason: 'notfound' as const, email: '', token: '', categories: [] as string[] };
	}
	if (!sub.confirmation_token || token !== sub.confirmation_token) {
		return { ok: false, reason: 'invalid' as const, email: '', token: '', categories: [] as string[] };
	}

	return {
		ok: true as const,
		email,
		token,
		categories: (sub.categories as string[]) ?? []
	};
}
