import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAdminRequest } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

// Diagnose: welche Server-Keys sind in DIESER Umgebung gesetzt + leben die externen
// Dienste? Zeigt NIE die Key-Werte, nur ob vorhanden + ein Live-Ping. Admin-only.

async function pingElevenLabs(key: string, voiceId: string): Promise<{ ok: boolean; detail: string }> {
	// Testet GENAU die Permission, die das Vorlesen braucht: text_to_speech.
	// (Nicht /user/subscription — das verlangt user_read, was der Key evtl. nicht hat,
	//  obwohl TTS selbst funktioniert. Genau dieser 401-Fall.)
	try {
		const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'JBFqnCBsd6RMkjVDRZzb'}`, {
			method: 'POST',
			headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
			body: JSON.stringify({ text: 'Test.', model_id: 'eleven_multilingual_v2' }),
			signal: AbortSignal.timeout(12000)
		});
		if (r.ok) {
			const bytes = (await r.arrayBuffer()).byteLength;
			return { ok: true, detail: `Text-to-Speech funktioniert (${bytes} Bytes Audio erzeugt).` };
		}
		const txt = (await r.text()).slice(0, 200);
		if (r.status === 401) return { ok: false, detail: `401 — Key fehlt Permission. Nötig: text_to_speech. ${txt}` };
		return { ok: false, detail: `HTTP ${r.status}: ${txt}` };
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
		? await pingElevenLabs(env.ELEVENLABS_API_KEY!, env.ELEVENLABS_VOICE_ID ?? '')
		: { ok: false, detail: 'Key in dieser Umgebung NICHT gesetzt (Vercel env fehlt?)' };

	return json({ ok: true, env: 'production-runtime', keys, elevenlabs });
};
