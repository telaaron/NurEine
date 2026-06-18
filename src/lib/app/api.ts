/**
 * App API client. The Capacitor app is a static bundle with no server of its
 * own, so every data call goes to the live production API over HTTPS.
 *
 * On the web (dev / preview of the /app routes) we use a relative base so the
 * local SvelteKit server answers; in the packaged app `import.meta.env.PROD`
 * is true and we hit nureine.de directly.
 */
import type { StoryResult } from '$lib/server/queries';

export const API_BASE = import.meta.env.PROD ? 'https://nureine.de' : '';

/** Canonical public web URL for a story — what we share so links open the real
 *  site (with OG image), not the app deep link. */
export function publicStoryUrl(slug: string): string {
	return `https://nureine.de/geschichte/${slug}`;
}

async function getJson<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
	return (await res.json()) as T;
}

/** All stories, newest first (same shape the website uses). */
export function fetchStories(opts: { category?: string; limit?: number } = {}) {
	const qs = new URLSearchParams();
	if (opts.category) qs.set('category', opts.category);
	if (opts.limit) qs.set('limit', String(opts.limit));
	const q = qs.toString();
	return getJson<StoryResult[]>(`/api/stories${q ? `?${q}` : ''}`);
}

/** A single story by id. */
export function fetchStory(id: string) {
	return getJson<StoryResult>(`/api/stories/${id}`);
}

/** Today's lead story: highest-impact of the freshest set (mirrors getLatestFeatured intent). */
export async function fetchToday(): Promise<StoryResult | null> {
	const stories = await fetchStories({ limit: 30 });
	if (!stories.length) return null;
	return [...stories].sort((a, b) => b.impactScore - a.impactScore)[0];
}

export type SubscribeResult = { ok: boolean; message: string };

/** Subscribe an email to the daily newsletter (double-opt-in handled server-side). */
export async function subscribe(email: string, categories: string[], ref: string | null): Promise<SubscribeResult> {
	try {
		const res = await fetch(`${API_BASE}/api/subscribe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, tier: 'free', categories, ref })
		});
		const data = await res.json();
		return { ok: res.ok, message: data.message || data.error || '' };
	} catch {
		return { ok: false, message: 'Keine Verbindung. Bitte versuche es später erneut.' };
	}
}
