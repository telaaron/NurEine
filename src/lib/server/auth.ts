import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * Stateless admin session tokens (HMAC-signed). No DB table needed.
 *
 * Token format:  <payloadB64url>.<sigB64url>
 *   payload = JSON { exp: <unix ms>, n: <random nonce> }
 *   sig     = HMAC-SHA256(payload, ADMIN_SESSION_SECRET)
 *
 * The signature makes the cookie unforgeable: without the server secret an
 * attacker cannot produce a valid <payload>.<sig> pair. Expiry is inside the
 * signed payload, so it can't be tampered with either.
 *
 * Fails closed: if ADMIN_SESSION_SECRET is unset, no token can be created or
 * verified (admin area becomes inaccessible rather than wide open).
 */

const COOKIE_NAME = 'admin_session';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function b64url(buf: Buffer): string {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
	return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function getSecret(): string | null {
	const s = env.ADMIN_SESSION_SECRET;
	return s && s.length >= 16 ? s : null;
}

function sign(payloadB64: string, secret: string): string {
	return b64url(createHmac('sha256', secret).update(payloadB64).digest());
}

export function createSessionToken(ttlMs = DEFAULT_TTL_MS): string | null {
	const secret = getSecret();
	if (!secret) return null;
	const payload = { exp: Date.now() + ttlMs, n: b64url(randomBytes(9)) };
	const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
	return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
	const secret = getSecret();
	if (!secret || !token) return false;

	const dot = token.indexOf('.');
	if (dot <= 0) return false;
	const payloadB64 = token.slice(0, dot);
	const sig = token.slice(dot + 1);

	// Constant-time signature comparison.
	const expected = sign(payloadB64, secret);
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

	// Signature valid → trust the payload's expiry.
	try {
		const payload = JSON.parse(fromB64url(payloadB64).toString('utf-8')) as { exp?: number };
		return typeof payload.exp === 'number' && payload.exp > Date.now();
	} catch {
		return false;
	}
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_TTL_MS = DEFAULT_TTL_MS;
