import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { CATEGORY_SLUGS } from '$lib/categories';

/**
 * Tracked redirect for newsletter story links.
 *   /r?e=email&t=token&c=category&to=<relative path>
 *
 * Records an identity-linked click as a category-preference signal:
 * increments nureine_subscribers.category_scores[category]. This is how the
 * newsletter learns each reader's taste over time (auto-personalization),
 * without any login. Then 302s to the real story.
 *
 * Safety: only redirects to same-site relative paths (no open-redirect).
 */
export const GET: RequestHandler = async ({ url }) => {
	const email = (url.searchParams.get('e') || '').toLowerCase().trim();
	const token = url.searchParams.get('t') || '';
	const category = url.searchParams.get('c') || '';
	const to = url.searchParams.get('to') || '/';

	// Open-redirect guard: only allow same-site relative paths.
	const safeTo = to.startsWith('/') && !to.startsWith('//') ? to : '/';

	// Tag the landing URL so analytics attributes the visit to the newsletter
	// (and not to "direct" or to the www duplicate). Added after the open-redirect
	// guard so it can't be abused. Preserves any existing query on `safeTo`.
	const sep = safeTo.includes('?') ? '&' : '?';
	const dest = `${safeTo}${sep}utm_source=newsletter&utm_medium=email&utm_campaign=daily`;

	// Fire-and-forget the signal; never block the redirect on it.
	if (email && token && CATEGORY_SLUGS.includes(category)) {
		try {
			const { data: sub } = await supabaseAdmin
				.from('nureine_subscribers')
				.select('id, confirmation_token, category_scores')
				.eq('email', email)
				.maybeSingle();
			if (sub && sub.confirmation_token && sub.confirmation_token === token) {
				const scores = (sub.category_scores as Record<string, number>) || {};
				scores[category] = (scores[category] || 0) + 1;
				await supabaseAdmin
					.from('nureine_subscribers')
					.update({ category_scores: scores })
					.eq('id', sub.id);
			}
		} catch {
			/* never block redirect on tracking */
		}
	}

	throw redirect(302, dest);
};
