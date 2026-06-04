import { json } from '@sveltejs/kit';
import { verifyAdminLogin } from '$lib/server/queries';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from '$lib/server/auth';

export async function POST({ request, cookies }) {
	const { username, password } = await request.json();

	if (await verifyAdminLogin(username, password)) {
		const token = createSessionToken();
		if (!token) {
			// ADMIN_SESSION_SECRET not configured — fail closed, do not log in.
			console.error('ADMIN_SESSION_SECRET not set — admin login disabled');
			return json(
				{ success: false, error: 'Server nicht konfiguriert (Session-Secret fehlt).' },
				{ status: 500 }
			);
		}
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: Math.floor(SESSION_TTL_MS / 1000)
		});
		return json({ success: true });
	}

	return json({ success: false, error: 'Ungültige Anmeldedaten' }, { status: 401 });
}
