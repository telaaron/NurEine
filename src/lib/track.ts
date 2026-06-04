import { base } from '$app/paths';
import { browser } from '$app/environment';

/**
 * Lightweight first-party event tracking.
 * Privacy: no cookies, no PII. An anonymous random session id is stored in
 * localStorage purely to group a single browser's events. Never sent anywhere
 * else, never tied to identity.
 */

type EventName =
	| 'pageview'
	| 'newsletter_signup'
	| 'newsletter_signup_attempt'
	| 'story_read'
	| 'cta_click'
	| 'share'
	| 'ticker_click'
	| 'archive_filter';

function sessionId(): string {
	try {
		let id = localStorage.getItem('nureine_sid');
		if (!id) {
			id =
				(crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
				Date.now().toString(36);
			localStorage.setItem('nureine_sid', id);
		}
		return id;
	} catch {
		return 'anon';
	}
}

export function track(name: EventName, props: Record<string, unknown> = {}): void {
	if (!browser) return;
	try {
		const payload = JSON.stringify({
			name,
			props,
			path: location.pathname,
			referrer: document.referrer || null,
			session_id: sessionId()
		});
		const url = `${base}/api/track`;
		// Prefer sendBeacon: survives navigation, never blocks.
		if (navigator.sendBeacon) {
			navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
		} else {
			fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: payload,
				keepalive: true
			}).catch(() => {});
		}
	} catch {
		/* tracking must never throw */
	}
}
