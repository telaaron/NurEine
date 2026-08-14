import { json } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { beginAuthentication } from '$lib/server/passkeys';

// Öffentlich: das IST der Login-Schritt (noch keine Session vorhanden).
export async function POST({ request }) {
	const challengeId = randomBytes(16).toString('hex');
	const options = await beginAuthentication(challengeId, request.headers.get('origin'));
	return json({ challengeId, options });
}
