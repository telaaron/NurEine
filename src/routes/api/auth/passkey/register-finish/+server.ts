import { json } from '@sveltejs/kit';
import { verifyAdminRequest } from '$lib/server/auth';
import { finishRegistration } from '$lib/server/passkeys';

export async function POST({ cookies, request }) {
	if (!verifyAdminRequest(cookies)) {
		return json({ error: 'Nicht angemeldet' }, { status: 401 });
	}
	const { challengeId, response, deviceLabel } = await request.json();
	if (!challengeId || !response) {
		return json({ error: 'Unvollständige Anfrage' }, { status: 400 });
	}
	const ok = await finishRegistration(
		challengeId,
		response,
		request.headers.get('origin'),
		deviceLabel
	);
	return json({ verified: ok }, { status: ok ? 200 : 400 });
}
