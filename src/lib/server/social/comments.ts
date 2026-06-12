/**
 * KI-Kommentar-Antworten — beantwortet neue IG-Kommentare im NurEine-Ton.
 *
 * HEIKEL für Authentizität. Darum harte Guards:
 *  - nur Top-Level-Kommentare der letzten geposteten Medien
 *  - nur einmal pro Kommentar (DB-Dedup)
 *  - DeepSeek klassifiziert ZUERST: nur positive/Frage/neutral → Antwort.
 *    Negativ/Troll/Spam/politisch → skip (still, kein Bait).
 *  - max N Antworten pro Run (Rate-Limit gegen Bot-Verdacht)
 *  - kurze, menschliche, variierende Antworten — kein Marketing-Geblubber.
 */
import { supabaseAdmin } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/private';

const IG_V = 'v21.0';
const MAX_REPLIES_PER_RUN = 8;

function igConfigured(): boolean {
	return !!(env.IG_USER_ID && env.IG_ACCESS_TOKEN && env.DEEPSEEK_API_KEY);
}

interface IgComment {
	id: string;
	text: string;
	username?: string;
	timestamp?: string;
}

/** Neueste geposteten Media-IDs (Feed-Posts der letzten 7 Tage). */
async function recentMediaIds(): Promise<string[]> {
	const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('ig_media_id')
		.eq('status', 'posted')
		.not('ig_media_id', 'is', null)
		.gte('posted_at', since7d);
	return (data as { ig_media_id: string }[] ?? []).map((r) => r.ig_media_id);
}

async function fetchComments(mediaId: string, token: string): Promise<IgComment[]> {
	const resp = await fetch(
		`https://graph.facebook.com/${IG_V}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${token}`
	);
	if (!resp.ok) return [];
	const json = (await resp.json()) as { data?: IgComment[] };
	return json.data ?? [];
}

/**
 * DeepSeek: klassifiziert den Kommentar + formuliert (falls passend) eine Antwort.
 * Gibt {reply: string|null, reason}. reply=null → nicht antworten.
 */
async function classifyAndReply(commentText: string): Promise<{ reply: string | null; reason: string }> {
	const prompt = `Du bist die Stimme von NurEine, einer Good-News-Plattform. Jemand hat unter einem Instagram-Post kommentiert. Entscheide, ob + wie wir antworten.

Kommentar: "${commentText}"

Regeln:
- Antworte NUR auf positive, neugierige, dankbare oder ehrlich fragende Kommentare.
- Bei Hass, Trollerei, Spam, Werbung, politischer Provokation oder Sinnlosem: NICHT antworten (reply=null).
- Antwort ist KURZ (max 1-2 Sätze), menschlich, warm, NICHT werblich, kein Hashtag, kein "Folge uns".
- Klinge wie ein echter Mensch, der sich über das Interesse freut. Variiere, keine Floskel.
- Bei einer echten inhaltlichen Frage: kurz + hilfreich antworten, ggf. auf nureine.de verweisen (nur wenn's wirklich passt).

Antworte NUR mit JSON: {"reply": "die Antwort ODER null", "reason": "kurz warum"}`;

	const resp = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.8,
			response_format: { type: 'json_object' }
		})
	});
	if (!resp.ok) return { reply: null, reason: `deepseek ${resp.status}` };
	const data = (await resp.json()) as { choices: { message: { content: string } }[] };
	try {
		const parsed = JSON.parse(data.choices[0].message.content);
		const reply = typeof parsed.reply === 'string' && parsed.reply.trim() && parsed.reply !== 'null'
			? parsed.reply.trim().slice(0, 300)
			: null;
		return { reply, reason: parsed.reason || '' };
	} catch {
		return { reply: null, reason: 'parse error' };
	}
}

async function postReply(commentId: string, message: string, token: string): Promise<boolean> {
	const resp = await fetch(`https://graph.facebook.com/${IG_V}/${commentId}/replies`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message, access_token: token })
	});
	return resp.ok;
}

/**
 * Hauptlauf: neue Kommentare finden, klassifizieren, Antwort-ENTWURF in die
 * Freigabe-Queue legen (status 'pending'). Gepostet wird erst nach Freigabe
 * im Admin (approveReply) — ein Bot, der ungekennzeichnet als Mensch wirkt,
 * ist auf einer Empathie-Marke ein Vertrauensrisiko.
 * Idempotent über nureine_social_replies (comment_id unique).
 */
export async function replyToComments(): Promise<{ queued: number; skipped: number; reason: string }> {
	if (!igConfigured()) return { queued: 0, skipped: 0, reason: 'IG/DeepSeek not configured' };
	const token = env.IG_ACCESS_TOKEN!;

	const mediaIds = await recentMediaIds();
	let queued = 0;
	let skipped = 0;

	for (const mediaId of mediaIds) {
		if (queued >= MAX_REPLIES_PER_RUN) break;
		const comments = await fetchComments(mediaId, token);

		for (const c of comments) {
			if (queued >= MAX_REPLIES_PER_RUN) break;
			if (!c.text || c.text.trim().length < 2) continue;

			// Schon bearbeitet? (Dedup)
			const { data: existing } = await supabaseAdmin
				.from('nureine_social_replies')
				.select('id')
				.eq('comment_id', c.id)
				.maybeSingle();
			if (existing) continue;

			const { reply, reason } = await classifyAndReply(c.text);

			if (!reply) {
				// Skip merken, damit wir denselben Kommentar nicht nochmal klassifizieren.
				await supabaseAdmin.from('nureine_social_replies').insert({
					comment_id: c.id, media_id: mediaId, comment_text: c.text.slice(0, 500),
					reply_text: null, skipped_reason: reason.slice(0, 200), status: 'skipped'
				});
				skipped += 1;
				continue;
			}

			await supabaseAdmin.from('nureine_social_replies').insert({
				comment_id: c.id, media_id: mediaId, comment_text: c.text.slice(0, 500),
				reply_text: reply, skipped_reason: null, status: 'pending'
			});
			queued += 1;
		}
	}

	return { queued, skipped, reason: '' };
}

/** Freigegebene Antwort wirklich auf Instagram posten. */
export async function approveReply(id: number): Promise<{ ok: boolean; reason: string }> {
	if (!igConfigured()) return { ok: false, reason: 'IG not configured' };
	const { data } = await supabaseAdmin
		.from('nureine_social_replies')
		.select('id,comment_id,reply_text,status')
		.eq('id', id)
		.maybeSingle();
	const row = data as { comment_id: string; reply_text: string | null; status: string } | null;
	if (!row) return { ok: false, reason: 'reply not found' };
	if (row.status !== 'pending') return { ok: false, reason: `status is ${row.status}` };
	if (!row.reply_text) return { ok: false, reason: 'no reply text' };

	const ok = await postReply(row.comment_id, row.reply_text, env.IG_ACCESS_TOKEN!);
	await supabaseAdmin
		.from('nureine_social_replies')
		.update({ status: ok ? 'posted' : 'failed', skipped_reason: ok ? null : 'post failed' })
		.eq('id', id);
	return ok ? { ok: true, reason: '' } : { ok: false, reason: 'graph post failed' };
}

/** Antwort-Entwurf verwerfen (es wird nicht geantwortet). */
export async function rejectReply(id: number): Promise<boolean> {
	const { error } = await supabaseAdmin
		.from('nureine_social_replies')
		.update({ status: 'rejected' })
		.eq('id', id)
		.eq('status', 'pending');
	return !error;
}
