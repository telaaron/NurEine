/**
 * APNs push — the app's morning distribution channel.
 *
 * Sends the daily lead story to every active iOS device token, directly to
 * Apple (no third-party service), authenticated with a token-based .p8 key
 * (ES256 JWT). The send job (api/cron/push) is the sibling of the newsletter
 * cron: same story, same 6:25 CEST slot, but it lands on the lock screen
 * instead of the inbox — which dodges Apple-MPP open-rate blindness.
 *
 * Required env (set once, alongside CRON_SECRET):
 *   APNS_KEY_ID     — 10-char Key ID of the APNs Auth Key (.p8)
 *   APNS_TEAM_ID    — 10-char Apple Developer Team ID
 *   APNS_KEY_P8     — the .p8 private key contents (PEM, newlines ok)
 *   APNS_BUNDLE_ID  — de.nureine.app (the app bundle id = APNs topic)
 *   APNS_PRODUCTION — "true" for the production APNs host, else sandbox
 */
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from './supabase/client';
import crypto from 'node:crypto';

// Optional env — read dynamically so the build doesn't require them to exist.
const APNS_KEY_ID = env.APNS_KEY_ID ?? '';
const APNS_TEAM_ID = env.APNS_TEAM_ID ?? '';
const APNS_KEY_P8 = env.APNS_KEY_P8 ?? '';
const APNS_BUNDLE_ID = env.APNS_BUNDLE_ID ?? '';
const APNS_PRODUCTION = env.APNS_PRODUCTION ?? '';

const APNS_HOST = APNS_PRODUCTION === 'true' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

export function pushConfigured(): boolean {
	return !!(APNS_KEY_ID && APNS_TEAM_ID && APNS_KEY_P8 && APNS_BUNDLE_ID);
}

// APNs provider JWT (ES256). Valid up to 1h; Apple wants it refreshed < 60 min.
// Cached briefly so a single send run reuses one token.
let cachedJwt: { token: string; at: number } | null = null;

function providerToken(): string {
	if (cachedJwt && Date.now() - cachedJwt.at < 45 * 60 * 1000) return cachedJwt.token;

	const header = { alg: 'ES256', kid: APNS_KEY_ID };
	const payload = { iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) };
	const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
	const signingInput = `${enc(header)}.${enc(payload)}`;

	const key = crypto.createPrivateKey(APNS_KEY_P8.replace(/\\n/g, '\n'));
	const der = crypto.sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
	const token = `${signingInput}.${der.toString('base64url')}`;

	cachedJwt = { token, at: Date.now() };
	return token;
}

type PushStory = { id: string; title: string; shareHook: string | null; dek: string | null };

async function sendOne(deviceToken: string, story: PushStory): Promise<{ ok: boolean; status: number }> {
	const body = {
		aps: {
			alert: {
				title: 'Dein Lichtblick für heute',
				body: story.shareHook || story.dek || story.title
			},
			sound: 'default',
			'mutable-content': 1
		},
		storyId: story.id
	};

	const res = await fetch(`https://${APNS_HOST}/3/device/${deviceToken}`, {
		method: 'POST',
		headers: {
			authorization: `bearer ${providerToken()}`,
			'apns-topic': APNS_BUNDLE_ID,
			'apns-push-type': 'alert',
			'apns-priority': '10'
		},
		body: JSON.stringify(body)
	});
	return { ok: res.ok, status: res.status };
}

export interface PushSendResult {
	configured: boolean;
	total: number;
	sent: number;
	deactivated: number;
}

/**
 * Send the given story to all active tokens. Deactivates tokens APNs reports
 * as 410 Gone (Unregistered). Runs sequentially in small batches — token
 * volume is tiny early on; HTTP/2 multiplexing can come later if needed.
 */
export async function sendDailyPush(story: PushStory): Promise<PushSendResult> {
	if (!pushConfigured()) return { configured: false, total: 0, sent: 0, deactivated: 0 };

	const { data: tokens } = await supabaseAdmin
		.from('nureine_device_tokens')
		.select('token, categories')
		.eq('active', true);

	const rows = (tokens ?? []) as { token: string; categories: string[] }[];
	let sent = 0;
	let deactivated = 0;
	const dead: string[] = [];

	for (const row of rows) {
		try {
			const { ok, status } = await sendOne(row.token, story);
			if (ok) sent++;
			else if (status === 410) dead.push(row.token);
		} catch (err) {
			console.error('[push] send error:', err);
		}
	}

	if (dead.length) {
		await supabaseAdmin.from('nureine_device_tokens').update({ active: false }).in('token', dead);
		deactivated = dead.length;
	}
	if (sent) {
		await supabaseAdmin
			.from('nureine_device_tokens')
			.update({ last_pushed_at: new Date().toISOString() })
			.eq('active', true);
	}

	return { configured: true, total: rows.length, sent, deactivated };
}
