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
import { selectInstagramStory, selectWeeklyDigestStories } from '$lib/server/queries';
import { buildCaption, buildCaptionFromHook, hashtagsFor, pickHookType } from './caption';
import { slidePlanForWeekday, slideUrlsFromPlan } from './schedule';

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
	shares: number | null; // migration 00046 — Sends (Leitmetrik shares/reach)
	created_at: string;
	updated_at: string;
	// Wochen-Digest + Reel-Erweiterung (migration 00041/00042).
	post_kind?: 'story' | 'digest' | 'reel';
	slide_urls?: string[] | null;
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
	// Sofort fällig. Früher: nächster Morgen 05:30 UTC — aber der Publish-Cron
	// (05:30) läuft VOR dem Generator (06:15), d.h. jeder Draft wartete ~23h und
	// die Story war beim Posten bis zu 2 Tage alt. Im Autopilot postet jetzt der
	// Generate-Cron direkt nach dem Anlegen (garantierte Reihenfolge); der
	// 05:30-Publish-Cron bleibt als Fallback für approved/Gate-Posts.
	return new Date().toISOString();
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
	// Sonntag = Digest-Tag: der Generator legt sonntags GAR KEIN Carousel an.
	// (Vorher: Guard prüfte nur, ob der Digest-Draft schon existiert — der
	// Digest-Cron läuft aber erst 15:30 UTC, der Generator 06:15 → das Carousel
	// gewann IMMER den Morgen-Slot und der Digest blieb liegen / verstopfte
	// montags die Queue. Schlägt der Digest fehl, bleibt der Feed sonntags leer —
	// lieber leer als falsch.)
	if (new Date().getUTCDay() === 0) {
		return { created: false, reason: 'Sonntag = Digest-Tag — kein Carousel' };
	}
	const dayStart0 = new Date();
	dayStart0.setUTCHours(0, 0, 0, 0);
	const { count: digestToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram')
		.eq('post_kind', 'digest')
		.gte('created_at', dayStart0.toISOString());
	if ((digestToday ?? 0) >= 1) {
		return { created: false, reason: 'Digest-Tag — täglicher Story-Post macht Platz' };
	}

	// Reel-Tage: Ist heute schon ein Reel gepostet worden ODER eines für heute
	// eingeplant (approved/draft mit fälligem scheduled_for — z.B. die von Aaron
	// abgenommene Wochen-Queue), ist das Reel der Feed-Post des Tages und das
	// Carousel entfällt. Gibt es keins (Render fehlgeschlagen/nichts geplant),
	// läuft das Carousel als Fallback weiter — der Feed bleibt nie leer.
	const dayEnd = new Date(dayStart0.getTime() + 24 * 60 * 60 * 1000);
	const { count: reelPostedToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram')
		.eq('post_kind', 'reel')
		.eq('status', 'posted')
		.gte('posted_at', dayStart0.toISOString());
	const { count: reelPlannedToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram')
		.eq('post_kind', 'reel')
		.in('status', ['draft', 'approved'])
		.lte('scheduled_for', dayEnd.toISOString());
	if ((reelPostedToday ?? 0) + (reelPlannedToday ?? 0) >= 1) {
		return { created: false, reason: 'Reel-Tag — Reel ist der Feed-Post, Carousel entfällt' };
	}

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

	// Format-Scheduler: Wochentag bestimmt die Carousel-FORM (Beleg/Methodik/ruhig)
	// → der Feed wird über die Woche abwechslungsreich. Nur wenn die Pipeline Folien
	// geliefert hat (sonst Einzelbild wie bisher).
	const weekday = new Date().getUTCDay();
	const plan = slidePlanForWeekday(weekday, story.igHookType);
	// hookStyle ist aktuell immer 'image' (konsistenter Grid-Look, siehe oben).
	const slideUrls = story.slides ? slideUrlsFromPlan(BASE_URL, story.slug, plan, hookStyle) : null;

	const { error } = await supabaseAdmin.from('nureine_social_posts').insert({
		story_id: story.id,
		platform: 'instagram',
		post_kind: 'story',
		caption,
		hashtags,
		card_url: `${BASE_URL}/api/share-card/${story.slug}`,
		og_url: `${BASE_URL}/api/og/${story.slug}`,
		slide_urls: slideUrls,
		hook_type: hookType,
		hook_style: hookStyle,
		category: story.category,
		// Carousel nur wenn die Pipeline Folien geliefert hat, sonst Einzelbild.
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

/**
 * Wochen-Digest-Draft (Idee #10) — der Sonntags-Carousel mit den Top-Stories
 * der Woche. Eigene Post-Art ('digest'), eigene Folien-URLs (/api/digest/<n>).
 * Idempotent: max ein Digest pro Tag (Teil-Index in migration 00041).
 */
export async function generateDigestDraft(): Promise<{ created: boolean; reason: string }> {
	// Idempotenz: höchstens ein Digest pro Tag (Code-Guard, da Teil-Index auf
	// scheduled_for::date nicht IMMUTABLE wäre). Re-Run am selben Tag = no-op.
	const dayStart = new Date();
	dayStart.setUTCHours(0, 0, 0, 0);
	const { count: digestToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'instagram')
		.eq('post_kind', 'digest')
		.gte('created_at', dayStart.toISOString());
	if ((digestToday ?? 0) >= 1) return { created: false, reason: 'Digest heute schon angelegt' };

	const stories = await selectWeeklyDigestStories(5);
	if (stories.length < 3) {
		// Unter 3 Stories lohnt kein Digest — lieber kein Post ("lieber leer als dünn").
		return { created: false, reason: `nur ${stories.length} Stories diese Woche (kein Digest)` };
	}

	const slideCount = stories.length + 2; // Cover + Stories + Endcard
	const slideUrls = Array.from({ length: slideCount }, (_, i) => `${BASE_URL}/api/digest/${i + 1}`);

	const n = stories.length;
	const caption = [
		`${n} belegte gute Nachrichten dieser Woche. 📌 Zum Speichern.`,
		'',
		'Jede mit Quelle — kein Bauchgefühl, sondern nachgeprüft.',
		'Welche hat dir am meisten Hoffnung gemacht? 👇',
		'',
		'Mehr ehrlicher Fortschritt → nureine.de'
	].join('\n');

	const hashtags = ['#gutenachrichten', '#positivenews', '#ehrlicherfortschritt', '#hoffnung', '#wochenrückblick'];

	// story_id zeigt auf die Top-Story der Woche (FK-Pflicht), post_kind='digest'.
	const { error } = await supabaseAdmin.from('nureine_social_posts').insert({
		story_id: stories[0].id,
		platform: 'instagram',
		post_kind: 'digest',
		caption,
		hashtags,
		card_url: slideUrls[0],
		og_url: slideUrls[0],
		slide_urls: slideUrls,
		hook_type: 'zahl', // CHECK erlaubt nur zahl|frage|kontrast; Digest führt mit Zahl.
		hook_style: 'image',
		category: stories[0].category,
		is_carousel: true,
		status: 'draft',
		scheduled_for: nextPostSlot()
	});

	if (error) {
		if (error.code === '23505') return { created: false, reason: 'Digest heute schon angelegt' };
		console.error('[social] generateDigestDraft error:', error);
		return { created: false, reason: `db error: ${error.message}` };
	}
	console.info('[social] digest draft created with', n, 'stories');
	return { created: true, reason: `digest draft created (${n} stories)` };
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

/**
 * Meta App-Level / User-Level Rate-Limit-Codes. Bei diesen ist der Post NICHT
 * kaputt — nur das Kontingent erschöpft. Wir wollen ihn dann NICHT permanent auf
 * 'failed' setzen (sonst klickt jemand „Jetzt posten" → noch mehr Calls → tiefer
 * ins Limit), sondern als rate-limited erkennen und später erneut versuchen.
 *   2207051 = Application request limit reached
 *   4 / 17 / 32 / 613 = App/User/Page rate limits, calls-per-hour
 */
const RATE_LIMIT_CODES = ['2207051', '"code":4', '"code":17', '"code":32', '"code":613'];
export class RateLimitedError extends Error {
	constructor(msg: string) {
		super(msg);
		this.name = 'RateLimitedError';
	}
}
function isRateLimit(body: string): boolean {
	return RATE_LIMIT_CODES.some((c) => body.includes(c)) || /request limit reached/i.test(body);
}

/**
 * Validiert eine Bild-URL BEVOR sie an IG geht. IG fetcht die URL selbst; liefert
 * sie kein echtes Bild (z.B. weil die share-card/carousel-Funktion 500/HTML
 * zurückgab oder noch nicht warm im CDN ist), antwortet Graph mit Code 9004
 * „Only photo or video can be accepted as media type" — und verbrennt Quota.
 * Darum hier vorab prüfen: HTTP 200 + Content-Type image/*. Mit kurzem Retry,
 * da frische share-card-URLs ein paar Sekunden Render+CDN brauchen.
 */
async function assertImageUrl(url: string): Promise<void> {
	let lastReason = 'unknown';
	// 5 Versuche à 45s + 5s Pause → ein kalter Card-Render (1080×1920 + Bild)
	// hat genug Zeit. Vorher: 3×20s → brach bei langsamem Render ab ("timeout").
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			const resp = await fetch(url, { signal: AbortSignal.timeout(45000) });
			const ct = resp.headers.get('content-type') || '';
			if (resp.ok && ct.startsWith('image/')) return;
			lastReason = `HTTP ${resp.status}, content-type "${ct}"`;
		} catch (e) {
			lastReason = (e as Error).message;
		}
		if (attempt < 4) await new Promise((r) => setTimeout(r, 5000));
	}
	throw new Error(`image url not a valid image (${lastReason}): ${url.slice(0, 120)}`);
}

/**
 * Wärmt eine Card-URL vor: fetcht sie wiederholt, bis sie ein GÜLTIGES Bild
 * liefert (200 + image/*) — max. ~4 Min Budget. Danach liegt sie im CDN, IG
 * bekommt sie sofort. Wirft NICHT (Vorwärmen ist best-effort); der eigentliche
 * assertImageUrl-Check entscheidet danach über Erfolg/Fehler.
 */
async function warmCard(url: string): Promise<void> {
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			const resp = await fetch(url, { signal: AbortSignal.timeout(50000) });
			const ct = resp.headers.get('content-type') || '';
			if (resp.ok && ct.startsWith('image/')) return; // fertig & warm
		} catch {
			// weiter versuchen — Render evtl. noch nicht fertig
		}
		await new Promise((r) => setTimeout(r, 3000));
	}
}

async function igCreateContainer(body: Record<string, unknown>): Promise<string> {
	const userId = env.IG_USER_ID!;
	const token = env.IG_ACCESS_TOKEN!;
	// Bis zu 3 Versuche mit Backoff, falls Meta rate-limitet (vorübergehend).
	for (let attempt = 0; attempt < 3; attempt++) {
		const resp = await fetch(`https://graph.facebook.com/${IG_V}/${userId}/media`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...body, access_token: token })
		});
		if (resp.ok) return ((await resp.json()) as { id: string }).id;
		const text = await resp.text();
		if (isRateLimit(text)) {
			if (attempt < 2) {
				await new Promise((r) => setTimeout(r, 8000 * (attempt + 1)));
				continue;
			}
			throw new RateLimitedError(`IG container rate-limited: ${text.slice(0, 200)}`);
		}
		throw new Error(`IG container ${resp.status}: ${text.slice(0, 300)}`);
	}
	throw new RateLimitedError('IG container rate-limited after retries');
}

/**
 * Wartet bis der Media-Container FINISHED ist, BEVOR publiziert wird.
 * Ohne das schlägt media_publish mit Code 9007 fehl ("Media ID is not available /
 * Die Medien können noch nicht veröffentlicht werden"), weil IG das Bild
 * (besonders frische, nicht-gecachte share-card-URLs) noch fetcht/verarbeitet.
 * Pollt status_code: IN_PROGRESS → warten, FINISHED → ok, ERROR/EXPIRED → abbrechen.
 */
async function waitForContainer(creationId: string, maxWaitMs = 25000): Promise<void> {
	const token = env.IG_ACCESS_TOKEN!;
	const start = Date.now();
	let delay = 2000;
	while (Date.now() - start < maxWaitMs) {
		const resp = await fetch(
			`https://graph.facebook.com/${IG_V}/${creationId}?fields=status_code,status&access_token=${token}`
		);
		if (resp.ok) {
			const j = (await resp.json()) as { status_code?: string; status?: string };
			if (j.status_code === 'FINISHED') return;
			if (j.status_code === 'ERROR' || j.status_code === 'EXPIRED') {
				throw new Error(`IG container ${j.status_code}: ${j.status ?? ''}`.slice(0, 300));
			}
		}
		await new Promise((r) => setTimeout(r, delay));
		delay = Math.min(delay + 1500, 6000); // sanft hochfahren
	}
	// Timeout — trotzdem versuchen zu publizieren (igPublish retryt 9007 nochmal).
}

async function igPublish(creationId: string): Promise<string> {
	const userId = env.IG_USER_ID!;
	const token = env.IG_ACCESS_TOKEN!;
	// Erst auf FINISHED warten, dann publizieren (verhindert 9007-Race).
	await waitForContainer(creationId);

	for (let attempt = 0; attempt < 3; attempt++) {
		const resp = await fetch(`https://graph.facebook.com/${IG_V}/${userId}/media_publish`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ creation_id: creationId, access_token: token })
		});
		if (resp.ok) return ((await resp.json()) as { id: string }).id;
		const text = await resp.text();
		// 9007 = noch nicht bereit → kurz warten + nochmal (max 3 Versuche).
		if (text.includes('9007') && attempt < 2) {
			await new Promise((r) => setTimeout(r, 5000));
			continue;
		}
		if (isRateLimit(text)) {
			if (attempt < 2) {
				await new Promise((r) => setTimeout(r, 8000 * (attempt + 1)));
				continue;
			}
			throw new RateLimitedError(`IG publish rate-limited: ${text.slice(0, 200)}`);
		}
		throw new Error(`IG publish ${resp.status}: ${text.slice(0, 300)}`);
	}
	throw new Error('IG publish failed after retries');
}

/** Single-image feed post. */
async function igPost(imageUrl: string, caption: string): Promise<string> {
	await assertImageUrl(imageUrl); // verhindert 9004 (IG fetcht kaputte URL)
	const creationId = await igCreateContainer({ image_url: imageUrl, caption });
	return igPublish(creationId);
}

/**
 * Carousel feed post: one child container per image (is_carousel_item), then a
 * parent carousel container with the children, then publish the parent.
 */
async function igPostCarousel(imageUrls: string[], caption: string): Promise<string> {
	// Alle Folien-URLs vorab prüfen — eine kaputte Folie = ganzer Carousel 9004.
	for (const url of imageUrls) await assertImageUrl(url);
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

/**
 * Reel-Post (media_type=REELS). Erwartet eine öffentliche MP4-URL (vom Renderer
 * nach Supabase Storage hochgeladen). Video-Container brauchen länger als Bilder
 * bis FINISHED → igPublish/waitForContainer pollt ohnehin auf den Status.
 */
async function igPostReel(videoUrl: string, caption: string): Promise<string> {
	const creationId = await igCreateContainer({
		media_type: 'REELS',
		video_url: videoUrl,
		caption,
		share_to_feed: true
	});
	return igPublish(creationId);
}

/** Build the 3 carousel slide URLs from a post's og_url (same slug + base).
 *  Folie 1 trägt den A/B-Stil (?style=image|number) für den Feed-Stopper. */
function carouselUrlsFor(p: SocialPostRow): string[] | null {
	// Digest (oder jeder Post mit expliziten Folien-URLs): direkt verwenden.
	if (p.slide_urls && p.slide_urls.length > 0) return p.slide_urls;
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

	// GUARD: max 2 Feed-Posts pro Tag mit ≥3h Abstand (kein Spam, IG straft
	// Bulk ab; 2/Tag erlaubt Carousel morgens + Regie-Reel vormittags/abends).
	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);
	const { data: postedTodayRows } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('posted_at')
		.eq('platform', 'instagram')
		.eq('status', 'posted')
		.gte('posted_at', todayStart.toISOString())
		.order('posted_at', { ascending: false });
	const postedToday = postedTodayRows ?? [];
	if (postedToday.length >= 2) {
		return { posted: 0, failed: 0, skipped: 'daily feed-post limit reached (2/day)' };
	}
	if (postedToday[0] && Date.now() - new Date(postedToday[0].posted_at as string).getTime() < 3 * 60 * 60 * 1000) {
		return { posted: 0, failed: 0, skipped: 'min 3h gap between feed posts' };
	}

	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*')
		.in('status', statuses)
		.lte('scheduled_for', new Date().toISOString())
		// FRISCHE-GUARD: Auto-Drafts älter als 72h posten wir nicht mehr — eine
		// „gute Nachricht von vorgestern" ist redaktionell tot; alter Backlog darf
		// die tagesaktuellen Posts nicht blockieren. MANUELL Freigegebenes
		// ('approved', z.B. Aarons abgenommene Reel-Wochen-Queue) ist eine
		// redaktionelle Entscheidung und altert nicht aus.
		.or(`status.eq.approved,created_at.gte.${new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()}`)
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
			if (p.post_kind === 'reel') {
				// Reel (9:16 MP4). Fertige Video-URL liegt in slide_urls[0].
				const videoUrl = p.slide_urls?.[0];
				if (!videoUrl) throw new Error('reel without video url (slide_urls[0])');
				mediaId = await igPostReel(videoUrl, fullCaption);
			} else if (p.is_carousel) {
				// 3-Folien-Carousel (4:5). URLs aus og_url-Slug abgeleitet.
				const urls = carouselUrlsFor(p);
				if (!urls) throw new Error('cannot derive carousel urls from og_url');
				// Alle Folien vorwärmen, damit IG sie fertig vorfindet (kein 9004/Timeout).
				for (const u of urls) await warmCard(u);
				mediaId = await igPostCarousel(urls, fullCaption);
			} else {
				// Einzelbild — 4:5 Hook-Folie (NICHT das quere 1.91:1-OG, das sieht
				// im IG-Feed klein/falsch aus). Wir nutzen Carousel-Folie 1 (1080×1350).
				const urls = carouselUrlsFor(p);
				const imageUrl = urls?.[0] || p.card_url || p.og_url;
				if (!imageUrl) throw new Error('no image url');
				await warmCard(imageUrl);
				mediaId = await igPost(imageUrl, fullCaption);
			}
			await supabaseAdmin
				.from('nureine_social_posts')
				.update({ status: 'posted', posted_at: new Date().toISOString(), ig_media_id: mediaId, error: null, updated_at: new Date().toISOString() })
				.eq('id', p.id);
			posted += 1;
		} catch (err) {
			if (err instanceof RateLimitedError) {
				// Rate-Limit: Post NICHT auf 'failed' setzen (sonst nie wieder
				// versucht). Status bleibt → nächster Cron probiert erneut. Nur
				// Fehlertext zur Sichtbarkeit ablegen.
				await supabaseAdmin
					.from('nureine_social_posts')
					.update({ error: `rate-limited, retry later: ${(err as Error).message.slice(0, 200)}`, updated_at: new Date().toISOString() })
					.eq('id', p.id);
				console.warn('[social] rate-limited, will retry:', p.id);
				// Loop abbrechen — bei Rate-Limit bringen weitere Calls nichts.
				return { posted, failed, skipped: 'rate-limited' };
			}
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
		if (err instanceof RateLimitedError) {
			// Status erhalten → bleibt postbar. Nur Hinweis ablegen.
			await supabaseAdmin
				.from('nureine_social_posts')
				.update({ error: `rate-limited, retry later: ${(err as Error).message.slice(0, 200)}`, updated_at: new Date().toISOString() })
				.eq('id', id);
			return { ok: false, reason: 'Meta rate-limit erreicht — später erneut versuchen (Post bleibt postbar).' };
		}
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

// Kleiner fetch-Wrapper mit hartem Timeout — ein hängender Graph-Call darf NIE
// die ganze Funktion in den Vercel-60s-Timeout reißen (Ursache der alten 504er).
async function fetchJson(url: string, ms = 6000): Promise<{ ok: boolean; status: number; body: string }> {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(ms) });
		const body = await resp.text().catch(() => '');
		return { ok: resp.ok, status: resp.status, body };
	} catch (err) {
		return { ok: false, status: 0, body: String(err) };
	}
}

// Verarbeitet ein Array in Häppchen fester Größe parallel (einfacher Pool ohne
// externe Lib) — hält die Graph-API-Last im Zaum, bleibt aber schnell.
async function inChunks<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const out: R[] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
	}
	return out;
}

/**
 * Holt IG-Insights pro geposteten Post via Graph API und schreibt saves/reach/
 * likes/shares/comments in die DB.
 *
 * WICHTIG (Fix 2026-07-12): der alte Lauf ging SEQUENZIELL über 30 Tage × ~256
 * Posts × 2 Calls → >500 Requests → Vercel-60s-Timeout (504), der Analyst sah
 * NIE Daten. Jetzt:
 *  - Nur Posts im sinnvollen Fenster: Stories laufen 24h → Insights nur für die
 *    letzten 3 Tage sinnvoll; Feed-Posts 30 Tage. Spart hunderte tote Calls.
 *  - Cap auf MAX_POSTS, PARALLEL in Häppchen, harter Fetch-Timeout je Call.
 *  - Story-Insights nutzen ANDERE Metriken als Feed (reach,replies,shares vs
 *    saved,reach,likes,shares) — sonst „metric not supported"-Fehler.
 */
const INSIGHTS_MAX_POSTS = 60;
const INSIGHTS_CHUNK = 8;

export async function refreshInsights(): Promise<{ updated: number; skipped: string; debug?: Record<string, string> }> {
	if (!igConfigured()) return { updated: 0, skipped: 'IG not configured' };
	const token = env.IG_ACCESS_TOKEN!;

	const since3d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
	const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

	// Feed-Posts (30d) + Stories NUR der letzten 3 Tage (danach sind Story-
	// Insights ohnehin weg). Neueste zuerst, hart gecappt.
	const { data } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('id,ig_media_id,platform,posted_at')
		.eq('status', 'posted')
		.not('ig_media_id', 'is', null)
		.or(`platform.eq.instagram,and(platform.eq.instagram_story,posted_at.gte.${since3d})`)
		.gte('posted_at', since30d)
		.order('posted_at', { ascending: false })
		.limit(INSIGHTS_MAX_POSTS);

	const posts = (data as { id: number; ig_media_id: string; platform: string; posted_at: string }[]) ?? [];
	if (posts.length === 0) return { updated: 0, skipped: 'no recent posts in window' };

	let updated = 0;
	let firstError: string | null = null;
	// Diagnose: je Plattform die erste rohe Insights-Antwort festhalten. Wird nur
	// via ?debug=1 nach außen gegeben (sonst verworfen) — hilft, „reach bleibt
	// null"-Ursachen (Scope vs. Metrik vs. leer) zu sehen, ohne Vercel-Logs.
	const debugSample: Record<string, string> = {};

	await inChunks(posts, INSIGHTS_CHUNK, async (p) => {
		const isStory = p.platform === 'instagram_story';
		// Story vs. Feed: unterschiedliche gültige Metriken (Graph API 2024+).
		const metrics = isStory ? 'reach,replies,shares' : 'saved,reach,likes,shares,total_interactions';
		const r = await fetchJson(
			`https://graph.facebook.com/${IG_V}/${p.ig_media_id}/insights?metric=${metrics}&access_token=${token}`
		);
		if (!debugSample[p.platform]) debugSample[p.platform] = `HTTP ${r.status} ${r.body.slice(0, 300)}`;
		if (r.ok) {
			try {
				const json = JSON.parse(r.body) as { data?: { name: string; values: { value: number }[] }[]; error?: unknown };
				const get = (name: string) => json.data?.find((m) => m.name === name)?.values?.[0]?.value ?? null;
				const reach = get('reach');
				const saves = get('saved');
				const shares = get('shares');
				if (reach === null && saves === null && shares === null) {
					// 200, aber keine verwertbaren Werte (leere data / error-Objekt im
					// Body). Ersten solchen Fall festhalten, damit „updated>0 durch
					// Fallback" nicht fälschlich wie Erfolg aussieht.
					if (!firstError)
						firstError = `insights leer (${p.platform}, metric=${metrics}): ${r.body.slice(0, 220)}`;
					return;
				}
				await supabaseAdmin
					.from('nureine_social_posts')
					.update({ reach, saves, shares, updated_at: new Date().toISOString() })
					.eq('id', p.id);
				updated += 1;
				return;
			} catch { /* fällt unten in den Basis-Fallback */ }
		}
		if (!firstError && !r.ok) {
			firstError = `media ${p.ig_media_id} (${p.platform}): HTTP ${r.status} ${r.body.slice(0, 240)}`;
			console.error('[social] insights request failed:', firstError);
		}
		// Basis-Fallback ohne instagram_manage_insights: like_count/comments_count.
		const fb = await fetchJson(
			`https://graph.facebook.com/${IG_V}/${p.ig_media_id}?fields=like_count,comments_count&access_token=${token}`
		);
		if (fb.ok) {
			try {
				const j = JSON.parse(fb.body) as { like_count?: number; comments_count?: number };
				if (j.like_count !== undefined || j.comments_count !== undefined) {
					await supabaseAdmin
						.from('nureine_social_posts')
						.update({ likes: j.like_count ?? null, comments: j.comments_count ?? null, updated_at: new Date().toISOString() })
						.eq('id', p.id);
					updated += 1;
				}
			} catch { /* ignore */ }
		}
	});

	return { updated, skipped: firstError ?? '', debug: debugSample };
}

// ---------------------------------------------------------------------------
// IG-Stories — mehrere/Tag, mittlere Schwelle, über den Tag verteilt.
// Hält den Account aktiv (Algo mag Frequenz) ohne den kuratierten Feed zu fluten.
// Story = 9:16 share-card der Story. media_type=STORIES, läuft 24h.
// ---------------------------------------------------------------------------

/** Eine IG-Story posten (9:16 Bild). */
async function igPostStory(imageUrl: string): Promise<string> {
	await assertImageUrl(imageUrl); // verhindert 9004 bei kaputter share-card-URL
	const creationId = await igCreateContainer({ image_url: imageUrl, media_type: 'STORIES' });
	return igPublish(creationId);
}

/**
 * Postet die nächste fällige IG-Story. JEDE valide Story (≤72h) wird über den Tag
 * verteilt zur IG-Story — der Cron feuert oft (z.B. stündlich), postet aber pro Lauf
 * nur EINE, sodass eine natürliche Story-Kette über den Tag entsteht statt Spam-Block.
 * No-op ohne IG-Token. Nutzt die 9:16 share-card (mit Wirkung-Badge).
 */
// Qualität statt Frequenz: max 10 IG-Stories/Tag, und zwar die RESONANZ-stärksten
// (nicht einfach die neuesten). "Wenige, aber sehr gute."
const DAILY_STORY_LIMIT = 10;

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
		.select('id,title,subtitle,category,image_url,impact_score,resonance_score')
		// Gleiche redaktionelle Schwelle wie der Feed-Post: nur ig_ok=true und kein
		// sensibler Stoff. ig_ok IST die Ton-Entscheidung der Pipeline.
		.eq('ig_ok', true)
		.not('sensitive', 'is', true)
		// HARTE Bild-Pflicht: eine IG-Story OHNE echtes Bild sieht auf dem Kanal wie
		// ein Platzhalter aus (nur das "N"-Fallback). Lieber keine Story posten als
		// eine bildlose. (Aaron 2026-07-10: die VR/Magersucht-Story lief ohne Bild.)
		.not('image_url', 'is', null)
		.neq('image_url', '')
		.gte('impact_score', 50)
		.gte('created_at', since72h)
		// RELEVANTESTE zuerst: hohe Resonanz schlägt Neuheit (NULLS LAST, dann impact).
		.order('resonance_score', { ascending: false, nullsFirst: false })
		.order('impact_score', { ascending: false })
		.limit(40);

	// Zweiter Riegel in JS (falls die Spalte je Whitespace/kaputte URL enthält).
	const story = (cand as { id: string; title: string; subtitle: string | null; category: string; image_url: string | null; impact_score: number; resonance_score: number | null }[] ?? [])
		.find((s) => !usedIds.has(s.id) && !!s.image_url && s.image_url.trim() !== '');
	if (!story) return { posted: false, reason: 'no fresh story with image to post' };

	const slug = `${slugify(story.title)}-${story.id.slice(0, 8)}`;
	const imageUrl = `${BASE_URL}/api/share-card/${slug}`;

	// CDN VORWÄRMEN — bis die Karte WIRKLICH ein gültiges Bild liefert. Ein
	// kalter Satori-Render (1080×1920 + FLUX-Bild) kann >20s dauern; ein einzelner
	// 20s-Fetch bricht dann ab und die Karte ist beim IG-Abruf noch nicht fertig
	// → assertImageUrl-Timeout → 'failed' (Ursache der ausbleibenden Stories).
	// Darum: mehrere Versuche mit langem Budget, bis Status 200 + image/*.
	await warmCard(imageUrl);

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
