import { json } from '@sveltejs/kit';
import { finishAuthentication } from '$lib/server/passkeys';
import { issueSessionCookie } from '$lib/server/auth';

// Öffentlich. Bei Erfolg wird DASSELBE HMAC-Session-Cookie wie beim
// Passwort-Login gesetzt — die restliche Auth-Kette bleibt unverändert.
export async function POST({ request, cookies }) {
	const { challengeId, response } = await request.json();
	if (!challengeId || !response) {
		return json({ error: 'Unvollständige Anfrage' }, { status: 400 });
	}
	const ok = await finishAuthentication(challengeId, response, request.headers.get('origin'));
	if (!ok) {
		return json({ error: 'Passkey abgelehnt' }, { status: 401 });
	}
	if (!issueSessionCookie(cookies)) {
		console.error('ADMIN_SESSION_SECRET not set — passkey login disabled');
		return json({ error: 'Server nicht konfiguriert (Session-Secret fehlt).' }, { status: 500 });
	}
	return json({ success: true });
}
