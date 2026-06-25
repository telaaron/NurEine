import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';

/**
 * Universal tracked redirector — the attribution backbone.
 *
 *   https://nureine.de/go?bet=geo&src=reddit&asset=beste-app&lang=de&to=app
 *
 * Logs one go_click event into nureine_events (so every channel is measurable
 * in the existing admin funnel), then routes by platform/intent:
 *   to=app  → App Store (iOS) / Play (android) / website (desktop)
 *   to=<url path> → that page on nureine.de (e.g. /newsletter)
 *
 * Params: bet, src, asset, lang, v (variant), to. All optional except a sane
 * default. Fire-and-forget logging never blocks the redirect.
 */

// Update these once the apps are live.
const APP_STORE = 'https://apps.apple.com/de/app/nureine/id0000000000';
const PLAY_STORE = 'https://nureine.de/'; // no Android app yet → site
const SITE = 'https://nureine.de';

export const GET: RequestHandler = async ({ url, request }) => {
	const p = url.searchParams;
	const ua = request.headers.get('user-agent') || '';
	const platform = /iphone|ipad|ipod/i.test(ua)
		? 'ios'
		: /android/i.test(ua)
			? 'android'
			: 'web';

	// Log (best-effort) into the existing events table.
	const props = {
		bet: p.get('bet'),
		src: p.get('src'),
		asset: p.get('asset'),
		lang: p.get('lang'),
		v: p.get('v'),
		to: p.get('to'),
		platform
	};
	try {
		await supabaseAdmin.from('nureine_events').insert({
			name: 'go_click',
			props,
			path: '/go',
			referrer: request.headers.get('referer')?.slice(0, 512) ?? null
		});
	} catch {
		/* never block the redirect */
	}

	// Resolve destination.
	const to = p.get('to') || 'app';
	let dest: string;
	if (to === 'app') {
		dest = platform === 'ios' ? APP_STORE : platform === 'android' ? PLAY_STORE : SITE;
	} else if (to.startsWith('http')) {
		dest = to; // only used internally; external pass-through is intentional for our own assets
	} else {
		dest = `${SITE}/${to.replace(/^\/+/, '')}`;
	}

	throw redirect(302, dest);
};
