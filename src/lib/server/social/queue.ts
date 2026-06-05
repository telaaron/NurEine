/**
 * Social-Post-Queue — Kernlogik für das Instagram-Posting-System.
 *
 * Workflow (siehe GROWTH.md §4):
 *   1. Generator-Cron ruft täglich generateTodayDraft() → legt 'draft' an.
 *   2. Admin gibt im Cockpit frei → status 'approved'.
 *   3. Publish-Cron ruft publishApproved() → postet via Graph API → 'posted'.
 *
 * Trockenlauf: nur Schritt 1 läuft, Publish-Cron tut nichts (kein Token /
 * SOCIAL_AUTOPILOT aus → bleibt bei 'approved' bis manuell/Token vorhanden).
 */
import { supabaseAdmin } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { getLatestFeatured } from '$lib/server/queries';
import { buildCaption, hashtagsFor, pickHookType } from './caption';

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

export interface SocialPostRow {
	id: number;
	story_id: string;
	platform: string;
	caption: string;
	hashtags: string[];
	card_url: string | null;
	og_url: string | null;
	hook_type: string;
	category: string | null;
	status: 'draft' | 'approved' | 'posted' | 'skipped' | 'failed';
	scheduled_for: string | null;
	posted_at: string | null;
	ig_media_id: string | null;
	error: string | null;
	saves: number | null;
	reach: number | null;
	created_at: string;
	updated_at: string;
}

/** Nächster 07:30 lokaler Zeit (Europe/Berlin ≈ UTC+2 im Sommer) als ISO. */
function nextPostSlot(): string {
	const now = new Date();
	const slot = new Date(now);
	slot.setUTCHours(5, 30, 0, 0); // 07:30 CEST = 05:30 UTC
	if (slot <= now) slot.setUTCDate(slot.getUTCDate() + 1);
	return slot.toISOString();
}

/**
 * Erzeugt den heutigen Post-Entwurf aus der aktuellen Tagesstory.
 * Idempotent: ein Post pro Story (unique index). Re-Run am selben Tag = no-op.
 */
export async function generateTodayDraft(): Promise<{
	created: boolean;
	reason: string;
	storyId?: string;
}> {
	const story = await getLatestFeatured();
	if (!story) return { created: false, reason: 'no featured story' };

	const hookType = pickHookType(story);
	// Woche-4-CTA-Logik bewusst aus: Entwurf neutral, du entscheidest pro Post.
	const caption = buildCaption(story, { hookType, withCta: false });
	const hashtags = hashtagsFor(story.category);

	const { error } = await supabaseAdmin.from('nureine_social_posts').insert({
		story_id: story.id,
		platform: 'instagram',
		caption,
		hashtags,
		card_url: `${BASE_URL}/api/share-card/${story.slug}`,
		og_url: `${BASE_URL}/api/og/${story.slug}`,
		hook_type: hookType,
		category: story.category,
		status: 'draft',
		scheduled_for: nextPostSlot()
	});

	if (error) {
		// 23505 = unique violation → Post existiert schon (idempotent).
		if (error.code === '23505') return { created: false, reason: 'already queued', storyId: story.id };
		console.error('[social] generateTodayDraft error:', error);
		return { created: false, reason: `db error: ${error.message}` };
	}
	console.info('[social] draft created for story', story.id, 'hook', hookType);
	return { created: true, reason: 'draft created', storyId: story.id };
}

/** Queue für das Admin-Cockpit (neueste zuerst). */
export async function listSocialPosts(limit = 50): Promise<SocialPostRow[]> {
	const { data, error } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(limit);
	if (error) {
		console.error('[social] listSocialPosts error:', error);
		return [];
	}
	return (data as SocialPostRow[]) ?? [];
}

export async function updateSocialPost(
	id: number,
	patch: Partial<Pick<SocialPostRow, 'caption' | 'hashtags' | 'status' | 'saves' | 'reach' | 'scheduled_for'>>
): Promise<boolean> {
	const { error } = await supabaseAdmin
		.from('nureine_social_posts')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id);
	if (error) {
		console.error('[social] updateSocialPost error:', error);
		return false;
	}
	return true;
}

/** A/B-Auswertung: Ø Saves nach Hook-Typ + Kategorie über gepostete Posts. */
export async function socialAnalytics(): Promise<{
	byHook: { hook_type: string; posts: number; avgSaves: number }[];
	byCategory: { category: string; posts: number; avgSaves: number }[];
}> {
	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('hook_type,category,saves')
		.eq('status', 'posted');
	const rows = (data as { hook_type: string; category: string | null; saves: number | null }[]) ?? [];

	const agg = (key: 'hook_type' | 'category') => {
		const m = new Map<string, { sum: number; n: number }>();
		for (const r of rows) {
			const k = (r[key] as string) || 'unbekannt';
			const cur = m.get(k) ?? { sum: 0, n: 0 };
			cur.sum += r.saves ?? 0;
			cur.n += 1;
			m.set(k, cur);
		}
		return [...m.entries()].map(([k, v]) => ({
			[key]: k,
			posts: v.n,
			avgSaves: v.n ? Math.round((v.sum / v.n) * 10) / 10 : 0
		}));
	};

	return {
		byHook: agg('hook_type') as { hook_type: string; posts: number; avgSaves: number }[],
		byCategory: agg('category') as { category: string; posts: number; avgSaves: number }[]
	};
}

// ---------------------------------------------------------------------------
// Publishing via Instagram Graph API
// ---------------------------------------------------------------------------
//
// Zwei-Schritt-Flow: (1) Media-Container mit image_url + caption erstellen,
// (2) Container publizieren. Braucht IG_USER_ID + IG_ACCESS_TOKEN (Long-Lived).
// Erst nach Meta-Setup scharf — ohne Token tut publishApproved nichts.

function igConfigured(): boolean {
	return !!(env.IG_USER_ID && env.IG_ACCESS_TOKEN);
}

async function igPost(imageUrl: string, caption: string): Promise<string> {
	const userId = env.IG_USER_ID!;
	const token = env.IG_ACCESS_TOKEN!;
	const v = 'v21.0';

	// 1) Container
	const createResp = await fetch(`https://graph.facebook.com/${v}/${userId}/media`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ image_url: imageUrl, caption, access_token: token })
	});
	if (!createResp.ok) throw new Error(`IG container ${createResp.status}: ${(await createResp.text()).slice(0, 300)}`);
	const { id: creationId } = (await createResp.json()) as { id: string };

	// 2) Publish
	const pubResp = await fetch(`https://graph.facebook.com/${v}/${userId}/media_publish`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ creation_id: creationId, access_token: token })
	});
	if (!pubResp.ok) throw new Error(`IG publish ${pubResp.status}: ${(await pubResp.text()).slice(0, 300)}`);
	const { id: mediaId } = (await pubResp.json()) as { id: string };
	return mediaId;
}

/**
 * Postet fällige Posts.
 * - Approval-Gate (Default): nur status='approved' & scheduled_for <= jetzt.
 * - Autopilot (SOCIAL_AUTOPILOT='true'): auch 'draft' wird gepostet, sobald fällig.
 * Ohne IG-Token: no-op (Trockenlauf bleibt sicher).
 */
export async function publishDue(): Promise<{ posted: number; failed: number; skipped: string }> {
	if (!igConfigured()) {
		return { posted: 0, failed: 0, skipped: 'IG not configured (dry run)' };
	}
	const autopilot = env.SOCIAL_AUTOPILOT === 'true';
	const statuses = autopilot ? ['approved', 'draft'] : ['approved'];

	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*')
		.in('status', statuses)
		.lte('scheduled_for', new Date().toISOString())
		.eq('platform', 'instagram')
		.order('scheduled_for', { ascending: true })
		.limit(5);

	const due = (data as SocialPostRow[]) ?? [];
	let posted = 0;
	let failed = 0;

	for (const p of due) {
		// IG Feed-Post braucht eine 1:1/4:5/1.91:1-Bild-URL → wir nutzen die OG-Karte (1.91:1).
		const imageUrl = p.og_url || p.card_url;
		if (!imageUrl) {
			await updateSocialPost(p.id, { status: 'failed' });
			failed += 1;
			continue;
		}
		const fullCaption = [p.caption, '', p.hashtags.join(' ')].join('\n').trim();
		try {
			const mediaId = await igPost(imageUrl, fullCaption);
			await supabaseAdmin
				.from('nureine_social_posts')
				.update({ status: 'posted', posted_at: new Date().toISOString(), ig_media_id: mediaId, error: null, updated_at: new Date().toISOString() })
				.eq('id', p.id);
			posted += 1;
		} catch (err) {
			await supabaseAdmin
				.from('nureine_social_posts')
				.update({ status: 'failed', error: (err as Error).message.slice(0, 500), updated_at: new Date().toISOString() })
				.eq('id', p.id);
			console.error('[social] publish failed for', p.id, err);
			failed += 1;
		}
	}

	return { posted, failed, skipped: '' };
}
