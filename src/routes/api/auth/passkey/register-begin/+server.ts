import { json } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { verifyAdminRequest } from '$lib/server/auth';
import { beginRegistration } from '$lib/server/passkeys';

// Nur der bereits eingeloggte Admin darf ein neues Gerät (Passkey) hinzufügen.
export async function POST({ cookies, request }) {
	if (!verifyAdminRequest(cookies)) {
		return json({ error: 'Nicht angemeldet' }, { status: 401 });
	}
	const challengeId = randomBytes(16).toString('hex');
	const options = await beginRegistration(challengeId, request.headers.get('origin'));
	return json({ challengeId, options });
}
