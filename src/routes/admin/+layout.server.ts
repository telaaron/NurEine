import { redirect } from '@sveltejs/kit';
import { verifySessionToken, SESSION_COOKIE } from '$lib/server/auth';

export function load({ cookies, url }) {
	const isLoginPage = url.pathname.includes('/admin/login');
	const authed = verifySessionToken(cookies.get(SESSION_COOKIE));

	// Unauthenticated → bounce to login (except the login page itself).
	if (!authed && !isLoginPage) {
		throw redirect(302, '/admin/login');
	}
	// Already authenticated and sitting on /admin/login → send to dashboard.
	if (authed && isLoginPage) {
		throw redirect(302, '/admin');
	}
}
