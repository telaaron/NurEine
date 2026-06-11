import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAdminRequest } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

// Diagnose: welche Server-Keys sind in DIESER Umgebung gesetzt + leben die externen
// Dienste? Zeigt NIE die Key-Werte, nur ob vorhanden + ein Live-Ping. Admin-only.

async function pingElevenLabs(key: string): Promise<{ ok: boolean; detail: string }> {
	try {
		const r = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
			headers: { 'xi-api-key': key },
			signal: AbortSignal.timeout(8000)
		});
		if (!r.ok) return { ok: false, detail: `HTTP ${r.status}: ${(await r.text()).slice(0, 120)}` };
		const j = (await r.json()) as { character_count?: number; character_limit?: number; tier?: string };
		const used = j.character_count ?? 0;
		const limit = j.character_limit ?? 0;
		return { ok: true, detail: `Tier ${j.tier ?? '?'} · ${used}/${limit} Zeichen genutzt (${Math.max(0, limit - used)} frei)` };
	} catch (e) {
		return { ok: false, detail: (e as Error).message.slice(0, 120) };
	}
}

export const GET: RequestHandler = async ({ cookies }) => {
	if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });

	const present = (k: string) => !!(env[k] && env[k]!.length > 0);

	const keys = {
		ELEVENLABS_API_KEY: present('ELEVENLABS_API_KEY'),
		ELEVENLABS_VOICE_ID: present('ELEVENLABS_VOICE_ID'),
		OPENAI_TTS_API_KEY: present('OPENAI_TTS_API_KEY'),
		DEEPSEEK_API_KEY: present('DEEPSEEK_API_KEY'),
		FAL_KEY: present('FAL_KEY'),
		BREVO_API_KEY: present('BREVO_API_KEY'),
		IG_ACCESS_TOKEN: present('IG_ACCESS_TOKEN'),
		IG_USER_ID: present('IG_USER_ID'),
		SUPABASE_SERVICE_KEY: present('SUPABASE_SERVICE_KEY'),
		CRON_SECRET: present('CRON_SECRET'),
		AUDIO_AUTOGEN: env.AUDIO_AUTOGEN ?? '(nicht gesetzt)'
	};

	// Live-Ping nur für ElevenLabs (das ist das aktuelle Problem).
	const elevenlabs = keys.ELEVENLABS_API_KEY
		? await pingElevenLabs(env.ELEVENLABS_API_KEY!)
		: { ok: false, detail: 'Key in dieser Umgebung NICHT gesetzt (Vercel env fehlt?)' };

	return json({ ok: true, env: 'production-runtime', keys, elevenlabs });
};
