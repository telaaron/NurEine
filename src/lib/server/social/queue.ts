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
import { selectInstagramStory } from '$lib/server/queries';
import { buildCaption, buildCaptionFromHook, hashtagsFor, pickHookType } from './caption';

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
	hook_style: string; // 'image' | 'number' — A/B-Folie-1-Stil
	category: string | null;
	is_carousel: boolean;
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
/** App-Setting lesen (z.B. social_autopilot). */
export async function getAppSetting(key: string): Promise<string | null> {
	const { data } = await supabaseAdmin.from('nureine_app_settings').select('value').eq('key', key).maybeSingle();
	return (data as { value: string } | null)?.value ?? null;
}

/** App-Setting schreiben. */
export async function setAppSetting(key: string, value: string): Promise<void> {
	await supabaseAdmin.from('nureine_app_settings').upsert({ key, value, updated_at: new Date().toISOString() });
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

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
	// "Lieber leer als falsch": nur eine Instagram-taugliche Story wird zum Draft.
	// Hat heute keine Story ig_ok → kein Post. Qualität vor Rhythmus.
	const story = await selectInstagramStory();
	if (!story) return { created: false, reason: 'no instagram-worthy story today (kein Post)' };

	// KONSISTENTER Grid-Look: IMMER illustriert (image). number-Variante (dunkelgrün-Zahl)
	// brach die visuelle Einheitlichkeit im Profil-Grid → raus. A/B läuft jetzt nur
	// noch TEXTLICH (Hook-/Caption-Formulierung), nicht visuell.
	const { count: postCount } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram');
	const hookStyle = 'image';

	const hookType = pickHookType(story);
	// Caption-Priorität: (1) KI-igCaption (eigener Blickwinkel, wiederholt Folien NICHT),
	// (2) buildCaptionFromHook (aus Substanz), (3) regelbasiert.
	const caption = story.igCaption
		? story.igCaption
		: story.igHook
			? buildCaptionFromHook(story)
			: buildCaption(story, { hookType, withCta: false });
	const hashtags = hashtagsFor(story.category, postCount ?? 0);

	const { error } = await supabaseAdmin.from('nureine_social_posts').insert({
		story_id: story.id,
		platform: 'instagram',
		caption,
		hashtags,
		card_url: `${BASE_URL}/api/share-card/${story.slug}`,
		og_url: `${BASE_URL}/api/og/${story.slug}`,
		hook_type: hookType,
		hook_style: hookStyle,
		category: story.category,
		// Carousel nur wenn die Pipeline 3 Folien geliefert hat, sonst Einzelbild.
		is_carousel: !!story.slides,
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
	byStyle: { hook_style: string; posts: number; avgSaves: number }[];
}> {
	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('hook_type,hook_style,category,saves')
		.eq('status', 'posted');
	const rows =
		(data as { hook_type: string; hook_style: string; category: string | null; saves: number | null }[]) ?? [];

	const agg = (key: 'hook_type' | 'category' | 'hook_style') => {
		const m = new Map<string, { sum: number; n: number }>();
		for (const r of rows) {
			const k = ((r as Record<string, unknown>)[key] as string) || 'unbekannt';
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
		byCategory: agg('category') as { category: string; posts: number; avgSaves: number }[],
		byStyle: agg('hook_style') as { hook_style: string; posts: number; avgSaves: number }[]
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

const IG_V = 'v21.0';

async function igCreateContainer(body: Record<string, unknown>): Promise<string> {
	const userId = env.IG_USER_ID!;
	const token = env.IG_ACCESS_TOKEN!;
	const resp = await fetch(`https://graph.facebook.com/${IG_V}/${userId}/media`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...body, access_token: token })
	});
	if (!resp.ok) throw new Error(`IG container ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
	return ((await resp.json()) as { id: string }).id;
}

async function igPublish(creationId: string): Promise<string> {
	const userId = env.IG_USER_ID!;
	const token = env.IG_ACCESS_TOKEN!;
	const resp = await fetch(`https://graph.facebook.com/${IG_V}/${userId}/media_publish`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ creation_id: creationId, access_token: token })
	});
	if (!resp.ok) throw new Error(`IG publish ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
	return ((await resp.json()) as { id: string }).id;
}

/** Single-image feed post. */
async function igPost(imageUrl: string, caption: string): Promise<string> {
	const creationId = await igCreateContainer({ image_url: imageUrl, caption });
	return igPublish(creationId);
}

/**
 * Carousel feed post: one child container per image (is_carousel_item), then a
 * parent carousel container with the children, then publish the parent.
 */
async function igPostCarousel(imageUrls: string[], caption: string): Promise<string> {
	const children: string[] = [];
	for (const url of imageUrls) {
		children.push(await igCreateContainer({ image_url: url, is_carousel_item: true }));
	}
	const parent = await igCreateContainer({
		media_type: 'CAROUSEL',
		children: children.join(','),
		caption
	});
	return igPublish(parent);
}

/** Build the 3 carousel slide URLs from a post's og_url (same slug + base).
 *  Folie 1 trägt den A/B-Stil (?style=image|number) für den Feed-Stopper. */
function carouselUrlsFor(p: SocialPostRow): string[] | null {
	// og_url looks like {BASE}/api/og/{slug}; derive {BASE}/api/carousel/{slug}/{1..3}.
	const m = p.og_url?.match(/^(.*)\/api\/og\/(.+)$/);
	if (!m) return null;
	const [, base, slug] = m;
	const style = p.hook_style === 'number' ? 'number' : 'image';
	return [1, 2, 3].map((n) =>
		n === 1 ? `${base}/api/carousel/${slug}/1?style=${style}` : `${base}/api/carousel/${slug}/${n}`
	);
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
	// Autopilot aus DB-Setting (im Admin toggelbar) ODER env-Fallback.
	const autopilot = (await getAppSetting('social_autopilot')) === 'true' || env.SOCIAL_AUTOPILOT === 'true';
	const statuses = autopilot ? ['approved', 'draft'] : ['approved'];

	// GUARD: max 1 Feed-Post pro Tag (kein Spam, IG straft Bulk ab). Schon heute
	// gepostet → Schluss. Schützt besonders im Autopilot-Modus.
	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);
	const { count: postedToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram')
		.eq('status', 'posted')
		.gte('posted_at', todayStart.toISOString());
	if ((postedToday ?? 0) >= 1) {
		return { posted: 0, failed: 0, skipped: 'daily feed-post limit reached (1/day)' };
	}

	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*')
		.in('status', statuses)
		.lte('scheduled_for', new Date().toISOString())
		.eq('platform', 'instagram')
		.order('scheduled_for', { ascending: true })
		.limit(1); // nur 1/Tag

	const due = (data as SocialPostRow[]) ?? [];
	let posted = 0;
	let failed = 0;

	for (const p of due) {
		const fullCaption = [p.caption, '', p.hashtags.join(' ')].join('\n').trim();
		try {
			let mediaId: string;
			if (p.is_carousel) {
				// 3-Folien-Carousel (4:5). URLs aus og_url-Slug abgeleitet.
				const urls = carouselUrlsFor(p);
				if (!urls) throw new Error('cannot derive carousel urls from og_url');
				mediaId = await igPostCarousel(urls, fullCaption);
			} else {
				// Einzelbild — 4:5 Hook-Folie (NICHT das quere 1.91:1-OG, das sieht
				// im IG-Feed klein/falsch aus). Wir nutzen Carousel-Folie 1 (1080×1350).
				const urls = carouselUrlsFor(p);
				const imageUrl = urls?.[0] || p.card_url || p.og_url;
				if (!imageUrl) throw new Error('no image url');
				mediaId = await igPost(imageUrl, fullCaption);
			}
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

/** Postet EINEN Post sofort (Admin-„Jetzt posten"-Button). Bypassed Cron + Tageslimit. */
export async function publishPostNow(id: number): Promise<{ ok: boolean; reason: string; mediaId?: string }> {
	if (!igConfigured()) return { ok: false, reason: 'IG not configured' };

	const { data } = await supabaseAdmin.from('nureine_social_posts').select('*').eq('id', id).maybeSingle();
	const p = data as SocialPostRow | null;
	if (!p) return { ok: false, reason: 'post not found' };
	if (p.status === 'posted') return { ok: false, reason: 'already posted' };

	const fullCaption = [p.caption, '', p.hashtags.join(' ')].join('\n').trim();
	try {
		let mediaId: string;
		if (p.platform === 'instagram_story') {
			mediaId = await igPostStory(p.card_url || '');
		} else if (p.is_carousel) {
			const urls = carouselUrlsFor(p);
			if (!urls) throw new Error('cannot derive carousel urls');
			mediaId = await igPostCarousel(urls, fullCaption);
		} else {
			const urls = carouselUrlsFor(p);
			const imageUrl = urls?.[0] || p.card_url || p.og_url;
			if (!imageUrl) throw new Error('no image url');
			mediaId = await igPost(imageUrl, fullCaption);
		}
		await supabaseAdmin
			.from('nureine_social_posts')
			.update({ status: 'posted', posted_at: new Date().toISOString(), ig_media_id: mediaId, error: null, updated_at: new Date().toISOString() })
			.eq('id', id);
		return { ok: true, reason: 'posted', mediaId };
	} catch (err) {
		await supabaseAdmin
			.from('nureine_social_posts')
			.update({ status: 'failed', error: (err as Error).message.slice(0, 500), updated_at: new Date().toISOString() })
			.eq('id', id);
		return { ok: false, reason: (err as Error).message };
	}
}

// ---------------------------------------------------------------------------
// Insights — saves / reach / likes / shares automatisch ziehen (kein manuelles
// Eintragen mehr). Läuft täglich für geposteten Content der letzten 30 Tage.
// ---------------------------------------------------------------------------

/**
 * Holt IG-Insights pro geposteten Post via Graph API und schreibt saves/reach
 * in die DB. Insights sind erst ein paar Stunden nach dem Post verfügbar.
 */
export async function refreshInsights(): Promise<{ updated: number; skipped: string }> {
	if (!igConfigured()) return { updated: 0, skipped: 'IG not configured' };
	const token = env.IG_ACCESS_TOKEN!;

	const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('id,ig_media_id')
		.eq('status', 'posted')
		.not('ig_media_id', 'is', null)
		.gte('posted_at', since30d);

	const posts = (data as { id: number; ig_media_id: string }[]) ?? [];
	let updated = 0;

	for (const p of posts) {
		try {
			// IG-Media-Insights: saved, reach, likes, shares, total_interactions.
			const metrics = 'saved,reach,likes,shares,total_interactions';
			const resp = await fetch(
				`https://graph.facebook.com/${IG_V}/${p.ig_media_id}/insights?metric=${metrics}&access_token=${token}`
			);
			if (!resp.ok) continue; // manche Metriken fehlen je Medientyp → still skip
			const json = (await resp.json()) as { data?: { name: string; values: { value: number }[] }[] };
			const get = (name: string) => json.data?.find((m) => m.name === name)?.values?.[0]?.value ?? null;

			const saves = get('saved');
			const reach = get('reach');
			if (saves === null && reach === null) continue;

			await supabaseAdmin
				.from('nureine_social_posts')
				.update({ saves, reach, updated_at: new Date().toISOString() })
				.eq('id', p.id);
			updated += 1;
		} catch (err) {
			console.error('[social] insights failed for', p.id, err);
		}
	}

	return { updated, skipped: '' };
}

// ---------------------------------------------------------------------------
// IG-Stories — mehrere/Tag, mittlere Schwelle, über den Tag verteilt.
// Hält den Account aktiv (Algo mag Frequenz) ohne den kuratierten Feed zu fluten.
// Story = 9:16 share-card der Story. media_type=STORIES, läuft 24h.
// ---------------------------------------------------------------------------

/** Eine IG-Story posten (9:16 Bild). */
async function igPostStory(imageUrl: string): Promise<string> {
	const creationId = await igCreateContainer({ image_url: imageUrl, media_type: 'STORIES' });
	return igPublish(creationId);
}

/**
 * Postet die nächste fällige IG-Story. JEDE valide Story (≤72h) wird über den Tag
 * verteilt zur IG-Story — der Cron feuert oft (z.B. stündlich), postet aber pro Lauf
 * nur EINE, sodass eine natürliche Story-Kette über den Tag entsteht statt Spam-Block.
 * No-op ohne IG-Token. Nutzt die 9:16 share-card (mit Wirkung-Badge).
 */
const DAILY_STORY_LIMIT = 15;

export async function publishStoryDue(): Promise<{ posted: boolean; reason: string; slug?: string }> {
	if (!igConfigured()) return { posted: false, reason: 'IG not configured' };

	// Tageslimit (Schutz gegen Rate-Limit / Story-Overload).
	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);
	const { count: storiesToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram_story')
		.eq('status', 'posted')
		.gte('posted_at', todayStart.toISOString());
	if ((storiesToday ?? 0) >= DAILY_STORY_LIMIT) return { posted: false, reason: `daily story limit (${DAILY_STORY_LIMIT})` };

	// Jede Story die noch nicht als IG-Story lief (72h-Fenster, jede valide = impact≥50).
	const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
	const { data: posted } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('story_id')
		.eq('platform', 'instagram_story');
	const usedIds = new Set((posted as { story_id: string }[] ?? []).map((r) => r.story_id));

	const { data: cand } = await supabaseAdmin
		.from('nureine_stories')
		.select('id,title,subtitle,category,image_url,impact_score')
		.gte('impact_score', 50)
		.gte('created_at', since72h)
		.order('created_at', { ascending: false }) // neueste zuerst → aktuell
		.limit(40);

	const story = (cand as { id: string; title: string; subtitle: string | null; category: string; image_url: string | null; impact_score: number }[] ?? [])
		.find((s) => !usedIds.has(s.id));
	if (!story) return { posted: false, reason: 'no fresh story to post' };

	const slug = `${slugify(story.title)}-${story.id.slice(0, 8)}`;
	const imageUrl = `${BASE_URL}/api/share-card/${slug}`;

	try {
		const mediaId = await igPostStory(imageUrl);
		await supabaseAdmin.from('nureine_social_posts').insert({
			story_id: story.id,
			platform: 'instagram_story',
			caption: '',
			hashtags: [],
			card_url: imageUrl,
			og_url: `${BASE_URL}/api/og/${slug}`,
			hook_type: 'zahl',
			hook_style: 'image',
			category: story.category,
			is_carousel: false,
			status: 'posted',
			posted_at: new Date().toISOString(),
			ig_media_id: mediaId,
			scheduled_for: new Date().toISOString()
		});
		console.info('[social] story posted', slug, story.impact_score);
		return { posted: true, reason: 'story posted', slug };
	} catch (err) {
		console.error('[social] story publish failed', err);
		return { posted: false, reason: `failed: ${(err as Error).message}` };
	}
}
