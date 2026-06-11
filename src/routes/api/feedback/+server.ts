import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { createHash } from 'node:crypto';

// Öffentliches Feedback-Postfach. Rate-limited (pro IP-Hash), schreibt nach Supabase.
// KEINE PII im Klartext: die IP wird gehasht (nur für Limit-Vergleich), nie roh gespeichert.

const MAX_LEN = 2000;
const WINDOW_MIN = 60;       // Zeitfenster
const MAX_PER_WINDOW = 5;    // max Einsendungen pro IP-Hash / Stunde
const ALLOWED_KINDS = ['idea', 'bug', 'praise', 'other'];

function hashIp(ip: string): string {
	// Tages-Salt, damit Hashes nicht dauerhaft korrelierbar sind.
	const salt = new Date().toISOString().slice(0, 10);
	return createHash('sha256').update(`${ip}|${salt}`).digest('hex').slice(0, 32);
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let body: { message?: string; kind?: string; email?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ungültige Anfrage.' }, { status: 400 });
	}

	const message = (body.message ?? '').trim();
	if (message.length < 3) return json({ error: 'Bitte schreib etwas mehr.' }, { status: 400 });
	if (message.length > MAX_LEN) return json({ error: 'Etwas zu lang — bitte kürzer.' }, { status: 400 });

	const kind = ALLOWED_KINDS.includes(body.kind ?? '') ? body.kind! : 'idea';
	const email = (body.email ?? '').trim().slice(0, 200) || null;

	let ipHash: string | null = null;
	try {
		ipHash = hashIp(getClientAddress());
	} catch {
		ipHash = null;
	}

	// Rate-Limit: max N pro IP-Hash im Zeitfenster.
	if (ipHash) {
		const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();
		const { count } = await supabaseAdmin
			.from('nureine_feedback')
			.select('id', { count: 'exact', head: true })
			.eq('ip_hash', ipHash)
			.gte('created_at', since);
		if ((count ?? 0) >= MAX_PER_WINDOW) {
			return json({ error: 'Danke! Du hast gerade viel geteilt — bitte versuch es später nochmal.' }, { status: 429 });
		}
	}

	const { error } = await supabaseAdmin.from('nureine_feedback').insert({
		message,
		kind,
		email,
		ip_hash: ipHash,
		user_agent: (request.headers.get('user-agent') ?? '').slice(0, 300)
	});
	if (error) {
		console.error('[feedback] insert failed:', error);
		return json({ error: 'Konnte nicht gespeichert werden.' }, { status: 500 });
	}

	return json({ ok: true });
};
