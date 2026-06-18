/**
 * Thin wrappers over Capacitor native plugins. Each one degrades gracefully on
 * the web (where the plugins fall back to web APIs or no-op), so the same app
 * code runs in the browser preview and in the packaged iOS app.
 */
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { track } from '$lib/track';

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
