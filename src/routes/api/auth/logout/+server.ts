import { json } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/auth';

export async function POST({ cookies }) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	// Clean up the legacy insecure cookie if still present.
	cookies.delete('admin_token', { path: '/' });
	return json({ success: true });
}
