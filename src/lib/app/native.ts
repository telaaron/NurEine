/**
 * Thin wrappers over Capacitor native plugins. Each one degrades gracefully on
 * the web (where the plugins fall back to web APIs or no-op), so the same app
 * code runs in the browser preview and in the packaged iOS app.
 */
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { track } from '$lib/track';

/** True only inside the packaged iOS/Android app (not the web build). */
export const isNative = Capacitor.isNativePlatform();

/**
 * Match the native status bar to the current color scheme and let the webview
 * draw under it (so the warm canvas / dark canvas reaches the very top, no beige
 * strip). Re-applies on scheme change. No-op on web.
 */
export function setupStatusBar(): void {
	if (!isNative) return;
	const apply = async () => {
		const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		try {
			await StatusBar.setOverlaysWebView({ overlay: true });
			// Style.Dark = light text (for dark bg); Style.Light = dark text.
			await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
		} catch {
			/* ignore */
		}
	};
	apply();
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
}

/** Open the native iOS share sheet (falls back to Web Share / nothing). */
export async function shareStory(opts: { title: string; text?: string; url: string }): Promise<void> {
	track('share', { method: 'native', url: opts.url });
	try {
		await Share.share({
			title: opts.title,
			text: opts.text,
			url: opts.url,
			dialogTitle: 'Geschichte teilen'
		});
	} catch {
		// User cancelled, or sharing unavailable — no action needed.
	}
}

/**
 * Ask for push permission and register with APNs. Returns whether permission
 * was granted. On the web this resolves false (no native push). The device
 * token is sent to the backend by the registration listener (set up once in
 * the app layout) — see registerPushListeners.
 */
export async function requestPush(): Promise<boolean> {
	if (!isNative) return false;
	try {
		const perm = await PushNotifications.requestPermissions();
		if (perm.receive !== 'granted') return false;
		await PushNotifications.register();
		return true;
	} catch {
		return false;
	}
}

/**
 * Wire the APNs token + incoming-notification listeners once at app start.
 * The token is posted to /api/app/register-token (built in M2); the tap
 * handler deep-links to the story. Safe no-op on web.
 */
export function registerPushListeners(onDeepLink: (storyId: string) => void): void {
	if (!isNative) return;
	PushNotifications.addListener('registration', async (token) => {
		try {
			await fetch(`${apiBase()}/api/app/register-token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: token.value, platform: 'ios' })
			});
			await cacheSet('apns_token', token.value);
		} catch {
			/* backend not ready yet / offline — token cached for retry */
		}
	});
	PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
		const id = action.notification.data?.storyId;
		if (id) onDeepLink(String(id));
	});
}

function apiBase(): string {
	return import.meta.env.PROD ? 'https://nureine.de' : '';
}

/**
 * Fire a LOCAL test notification that looks like the morning push, so the
 * lock-screen presentation can be checked without an Apple Developer account or
 * APNs. Schedules ~4s out so the user can lock the phone first. Returns a status
 * the UI can show. (Real server-driven push needs the dev account; see push.ts.)
 */
export async function sendTestNotification(opts: { title: string; body: string }): Promise<'sent' | 'denied' | 'unavailable'> {
	if (!isNative) return 'unavailable';
	try {
		const perm = await LocalNotifications.checkPermissions();
		let granted = perm.display === 'granted';
		if (!granted) {
			const req = await LocalNotifications.requestPermissions();
			granted = req.display === 'granted';
		}
		if (!granted) return 'denied';

		await LocalNotifications.schedule({
			notifications: [
				{
					id: Date.now() % 2147483647,
					title: opts.title,
					body: opts.body,
					schedule: { at: new Date(Date.now() + 4000) }
				}
			]
		});
		return 'sent';
	} catch {
		return 'unavailable';
	}
}

/** Open a URL outside the app (system browser). */
export function openExternal(url: string): void {
	try {
		window.open(url, '_blank', 'noopener');
	} catch {
		/* ignore */
	}
}

/** Light tap feedback for primary actions. No-op where haptics are unavailable. */
export async function tapLight(): Promise<void> {
	try {
		await Haptics.impact({ style: ImpactStyle.Light });
	} catch {
		/* ignore */
	}
}

/**
 * Tiny offline cache over Capacitor Preferences (native key-value store, falls
 * back to localStorage on web). Used so the morning story is readable on the
 * subway / in a dead zone.
 */
export async function cacheSet(key: string, value: unknown): Promise<void> {
	try {
		await Preferences.set({ key, value: JSON.stringify(value) });
	} catch {
		/* ignore */
	}
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const { value } = await Preferences.get({ key });
		return value ? (JSON.parse(value) as T) : null;
	} catch {
		return null;
	}
}
