import { redirect } from '@sveltejs/kit';
import { verifySessionToken, SESSION_COOKIE } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase/client';

export async function load({ cookies, url }) {
	const isLoginPage = url.pathname.includes('/admin/login');
	const authed = verifySessionToken(cookies.get(SESSION_COOKIE));

	if (!authed && !isLoginPage) {
		throw redirect(302, '/admin/login');
	}
	if (authed && isLoginPage) {
		throw redirect(302, '/admin');
	}

	// Notification-Dot: Anzahl ungelesener Feedbacks (status='new') für die Nav.
	let newFeedback = 0;
	if (authed) {
		const { count } = await supabaseAdmin
			.from('nureine_feedback')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'new');
		newFeedback = count ?? 0;
	}
	return { newFeedback };
}
