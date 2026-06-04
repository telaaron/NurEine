import { browser } from '$app/environment';

/**
 * Referral capture (client-side, no login).
 * If the visitor arrived via ?ref=CODE, persist it so the eventual signup
 * (which may happen on another page) attributes the referrer.
 */
const KEY = 'nureine_ref';

export function captureRef(): void {
	if (!browser) return;
	try {
		const ref = new URLSearchParams(location.search).get('ref');
		if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) {
			localStorage.setItem(KEY, ref);
		}
	} catch {
		/* ignore */
	}
}

export function getRef(): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(KEY);
	} catch {
		return null;
	}
}
