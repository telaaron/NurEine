/**
 * WebAuthn / Passkey-Login für den Admin (Face ID / Touch ID).
 *
 * Prinzip: Das iPhone/Mac hält den privaten Schlüssel in der Secure Enclave und
 * gibt ihn nur nach Face/Touch ID frei. Der Server speichert NUR den öffentlichen
 * Schlüssel (nureine_admin_passkeys). Ein erfolgreicher Passkey-Login erzeugt am
 * Ende DASSELBE HMAC-Session-Cookie wie der Passwort-Login (createSessionToken) —
 * die restliche Auth-Kette bleibt unverändert.
 *
 * Single-Admin: alle Passkeys gehören einem konstanten Nutzer ('admin'). Mehrere
 * Geräte (iPhone + Mac via iCloud-Schlüsselbund) sind möglich.
 */
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
	RegistrationResponseJSON,
	AuthenticationResponseJSON
} from '@simplewebauthn/server';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/private';

const RP_NAME = 'NurEine Cockpit';
const USER_HANDLE = 'admin';

// RP-ID = registrierbare Domain OHNE Protokoll/Port (WebAuthn-Regel).
// Origin = vollständige Herkunft, die der Browser sendet.
// Aus PUBLIC_BASE_URL abgeleitet, mit localhost-Fallback für Dev.
function rpConfig(originHeader?: string | null): { rpID: string; origin: string } {
	const base = env.PUBLIC_BASE_URL || originHeader || 'http://localhost:5180';
	try {
		const u = new URL(base);
		return { rpID: u.hostname, origin: u.origin };
	} catch {
		return { rpID: 'localhost', origin: 'http://localhost:5180' };
	}
}

// ── Challenge-Handling (kurzlebig, gegen Replay) ─────────────────────────────
async function storeChallenge(id: string, challenge: string, kind: 'register' | 'auth') {
	await supabaseAdmin.from('nureine_webauthn_challenges').insert({ id, challenge, kind });
}
async function takeChallenge(id: string, kind: 'register' | 'auth'): Promise<string | null> {
	const { data } = await supabaseAdmin
		.from('nureine_webauthn_challenges')
		.select('challenge')
		.eq('id', id)
		.eq('kind', kind)
		.maybeSingle();
	if (data) await supabaseAdmin.from('nureine_webauthn_challenges').delete().eq('id', id);
	return data?.challenge ?? null;
}

// ── Registrierung (Passkey anlegen) ──────────────────────────────────────────
export async function beginRegistration(challengeId: string, originHeader?: string | null) {
	const { rpID } = rpConfig(originHeader);
	const { data: existing } = await supabaseAdmin
		.from('nureine_admin_passkeys')
		.select('id, transports')
		.eq('user_handle', USER_HANDLE);

	const options = await generateRegistrationOptions({
		rpName: RP_NAME,
		rpID,
		userName: 'Admin',
		userID: new TextEncoder().encode(USER_HANDLE),
		attestationType: 'none',
		// bereits registrierte Geräte ausschließen (kein Doppel-Passkey)
		excludeCredentials: (existing ?? []).map((c) => ({
			id: c.id,
			transports: (c.transports ?? undefined) as AuthenticatorTransportLike[] | undefined
		})),
		authenticatorSelection: {
			residentKey: 'preferred',
			userVerification: 'preferred' // Face/Touch ID
		}
	});
	await storeChallenge(challengeId, options.challenge, 'register');
	return options;
}

export async function finishRegistration(
	challengeId: string,
	response: RegistrationResponseJSON,
	originHeader: string | null,
	deviceLabel?: string
): Promise<boolean> {
	const { rpID, origin } = rpConfig(originHeader);
	const expectedChallenge = await takeChallenge(challengeId, 'register');
	if (!expectedChallenge) return false;

	const verification = await verifyRegistrationResponse({
		response,
		expectedChallenge,
		expectedOrigin: origin,
		expectedRPID: rpID
	});
	if (!verification.verified || !verification.registrationInfo) return false;

	const { credential } = verification.registrationInfo;
	await supabaseAdmin.from('nureine_admin_passkeys').insert({
		id: credential.id,
		public_key: Buffer.from(credential.publicKey),
		counter: credential.counter,
		transports: credential.transports ?? null,
		device_label: deviceLabel ?? null,
		user_handle: USER_HANDLE
	});
	return true;
}

// ── Authentifizierung (Login per Face ID) ────────────────────────────────────
export async function beginAuthentication(challengeId: string, originHeader?: string | null) {
	const { rpID } = rpConfig(originHeader);
	const options = await generateAuthenticationOptions({
		rpID,
		userVerification: 'preferred'
	});
	await storeChallenge(challengeId, options.challenge, 'auth');
	return options;
}

export async function finishAuthentication(
	challengeId: string,
	response: AuthenticationResponseJSON,
	originHeader: string | null
): Promise<boolean> {
	const { rpID, origin } = rpConfig(originHeader);
	const expectedChallenge = await takeChallenge(challengeId, 'auth');
	if (!expectedChallenge) return false;

	const { data: cred } = await supabaseAdmin
		.from('nureine_admin_passkeys')
		.select('id, public_key, counter, transports')
		.eq('id', response.id)
		.maybeSingle();
	if (!cred) return false;

	const verification = await verifyAuthenticationResponse({
		response,
		expectedChallenge,
		expectedOrigin: origin,
		expectedRPID: rpID,
		credential: {
			id: cred.id,
			publicKey: new Uint8Array(cred.public_key as unknown as Buffer),
			counter: Number(cred.counter),
			transports: (cred.transports ?? undefined) as AuthenticatorTransportLike[] | undefined
		}
	});
	if (!verification.verified) return false;

	// Counter fortschreiben (Klon-Erkennung) + last_used stempeln.
	await supabaseAdmin
		.from('nureine_admin_passkeys')
		.update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
		.eq('id', cred.id);
	return true;
}

export async function hasPasskeys(): Promise<boolean> {
	const { count } = await supabaseAdmin
		.from('nureine_admin_passkeys')
		.select('id', { count: 'exact', head: true })
		.eq('user_handle', USER_HANDLE);
	return (count ?? 0) > 0;
}

type AuthenticatorTransportLike = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb';
