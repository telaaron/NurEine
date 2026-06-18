/**
 * Local app preferences — the no-login personalization layer.
 *
 * The website personalizes via a subscriber's confirmation_token (emailed,
 * never held by the app). The app therefore keeps its own local preferences in
 * Capacitor Preferences so personalization works for everyone immediately;
 * when the user later subscribes and confirms, the newsletter side personalizes
 * independently. Topic prefs here drive in-app filtering/ordering.
 */
import { cacheGet, cacheSet } from './native';

export type AppPrefs = {
	categories: string[]; // empty = all topics
	hasKids: boolean | null;
	pushWanted: boolean; // user's intent; real APNs registration lands in M2
	email: string | null; // last email the user subscribed with (for display)
	onboarded: boolean;
};

const KEY = 'app_prefs_v1';

const DEFAULTS: AppPrefs = {
	categories: [],
	hasKids: null,
	pushWanted: false,
	email: null,
	onboarded: false
};

export async function loadPrefs(): Promise<AppPrefs> {
	const stored = await cacheGet<Partial<AppPrefs>>(KEY);
	return { ...DEFAULTS, ...(stored ?? {}) };
}

export async function savePrefs(patch: Partial<AppPrefs>): Promise<AppPrefs> {
	const next = { ...(await loadPrefs()), ...patch };
	await cacheSet(KEY, next);
	return next;
}
