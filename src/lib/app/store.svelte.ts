/**
 * Shared story store for the app. Fetches the full story list ONCE and keeps it
 * in memory so switching tabs (Heute / Archiv / Karte) is instant — no refetch,
 * no image reload. Seeds from the offline cache on cold start so the first
 * paint has content immediately, then refreshes in the background.
 */
import { fetchStories } from './api';
import { cacheGet, cacheSet } from './native';
import type { StoryResult } from '$lib/server/queries';

const CACHE_KEY = 'stories_all_v1';
const FRESH_MS = 5 * 60 * 1000; // refetch at most every 5 min

let stories = $state<StoryResult[]>([]);
let loading = $state(false);
let errored = $state(false);
let lastFetch = 0;
let seeded = false;

export function storeState() {
	return {
		get stories() {
			return stories;
		},
		get loading() {
			return loading;
		},
		get errored() {
			return errored;
		}
	};
}

/** Ensure the list is loaded. Returns cached data instantly when fresh; only
 *  hits the network on cold start, after the freshness window, or on force. */
export async function ensureStories(opts: { force?: boolean } = {}): Promise<void> {
	// Seed from offline cache once, synchronously-ish, before any network.
	if (!seeded) {
		seeded = true;
		const cached = await cacheGet<StoryResult[]>(CACHE_KEY);
		if (cached?.length && stories.length === 0) stories = cached;
	}

	const fresh = Date.now() - lastFetch < FRESH_MS;
	if (!opts.force && fresh && stories.length > 0) return;
	if (loading) return;

	loading = true;
	errored = false;
	try {
		const all = await fetchStories();
		stories = all;
		lastFetch = Date.now();
		cacheSet(CACHE_KEY, all);
	} catch {
		// Keep whatever we have (cache); only flag error if we have nothing.
		if (stories.length === 0) errored = true;
	} finally {
		loading = false;
	}
}
