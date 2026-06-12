import { json } from '@sveltejs/kit';
import { verifyAdminRequest } from '$lib/server/auth';
import { getAppSetting, setAppSetting } from '$lib/server/social/queue';

/**
 * POST /api/admin/audio — Audio-Cockpit-Aktionen.
 * action 'toggle-autopilot': schaltet die Auto-Vertonung (Pipeline Stage 8) scharf/aus.
 * Das Setting liest fetch_stories.py (audio_autogen_enabled) vor jedem Run aus der DB.
 */
export async function POST({ request, cookies }) {
	if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = (await request.json().catch(() => ({}))) as { action?: string };

	if (body.action === 'toggle-autopilot') {
		const cur = await getAppSetting('audio_autopilot');
		const next = cur === 'true' ? 'false' : 'true';
		await setAppSetting('audio_autopilot', next);
		return json({ ok: true, autopilot: next === 'true' });
	}

	return json({ error: 'Unbekannte Aktion' }, { status: 400 });
}
