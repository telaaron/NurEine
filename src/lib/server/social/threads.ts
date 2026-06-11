/**
 * Threads-Auto-Posting (Meta Threads API).
 *
 * Eigenständig, analog zum IG-Flow in queue.ts, aber eigene API (graph.threads.net)
 * + eigenes Token (THREADS_USER_ID / THREADS_ACCESS_TOKEN, separate Scopes
 * threads_basic + threads_content_publish — NICHT das IG-Token).
 *
 * Zwei-Schritt-Flow: (1) Media-Container erstellen, (2) publizieren.
 * Threads erlaubt link_attachment OHNE Zusatzkosten (anders als X) → wir hängen
 * den Link zur ganzen Geschichte an. Mit Bild: media_type=IMAGE + image_url.
 *
 * Idempotenz + Frequenz: 1 Post/Lauf, max 1/Tag (Guard), dedup über
 * nureine_social_posts (platform='threads', story_id unique-pro-Plattform).
 */
import { supabaseAdmin } from '$lib/server/supabase/client';
import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';
const TH_V = 'v1.0';
const DAILY_LIMIT = 1;

function threadsConfigured(): boolean {
	return !!(env.THREADS_USER_ID && env.THREADS_ACCESS_TOKEN);
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

async function thCreateContainer(body: Record<string, unknown>): Promise<string> {
	const userId = env.THREADS_USER_ID!;
	const token = env.THREADS_ACCESS_TOKEN!;
	const resp = await fetch(`https://graph.threads.net/${TH_V}/${userId}/threads`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!resp.ok) throw new Error(`Threads container ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
	return ((await resp.json()) as { id: string }).id;
}

async function thPublish(creationId: string): Promise<string> {
	const userId = env.THREADS_USER_ID!;
	const token = env.THREADS_ACCESS_TOKEN!;
	// Threads empfiehlt ~30s Wartezeit nach Container-Erstellung; bei Bildern nötig,
	// damit der Server das Medium gefetcht hat. Wir pollen kurz statt blind zu warten.
	await new Promise((r) => setTimeout(r, 3000));
	for (let attempt = 0; attempt < 3; attempt++) {
		const resp = await fetch(`https://graph.threads.net/${TH_V}/${userId}/threads_publish`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ creation_id: creationId })
		});
		if (resp.ok) return ((await resp.json()) as { id: string }).id;
		const txt = await resp.text();
		// Medium noch nicht verarbeitet → kurz warten + retry.
		if ((resp.status === 400 || txt.includes('not ready')) && attempt < 2) {
			await new Promise((r) => setTimeout(r, 5000));
			continue;
		}
		throw new Error(`Threads publish ${resp.status}: ${txt.slice(0, 300)}`);
	}
	throw new Error('Threads publish failed after retries');
}

/** Einen Threads-Post (Text + optionales Bild + Link zur Geschichte). */
async function postToThreads(text: string, imageUrl: string | null, linkUrl: string): Promise<string> {
	const body: Record<string, unknown> = {
		text,
		link_attachment: linkUrl
	};
	if (imageUrl) {
		body.media_type = 'IMAGE';
		body.image_url = imageUrl;
	} else {
		body.media_type = 'TEXT';
	}
	const creationId = await thCreateContainer(body);
	return thPublish(creationId);
}

/** Threads-Text bauen: Hook führt, kurz, menschlich. Kein Hashtag-Spam (Threads mag das nicht). */
function buildThreadsText(story: { title: string; subtitle: string | null; share_hook: string | null }): string {
	const hook = (story.share_hook || story.subtitle || story.title).trim();
	// Threads-Limit 500 Zeichen. Hook + dezenter Hinweis.
	const text = `${hook}\n\nDie ganze Geschichte – belegt & werbefrei:`;
	return text.slice(0, 480);
}

/**
 * Postet die nächste fällige Story auf Threads. Wählt die stärkste frische Story
 * (impact≥60, ≤48h), die noch nicht auf Threads lief. 1/Tag.
 */
export async function publishThreadsDue(): Promise<{ posted: boolean; reason: string; slug?: string }> {
	if (!threadsConfigured()) return { posted: false, reason: 'Threads not configured' };

	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);
	const { count: postedToday } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('*', { count: 'exact', head: true })
		.eq('platform', 'threads')
		.eq('status', 'posted')
		.gte('posted_at', todayStart.toISOString());
	if ((postedToday ?? 0) >= DAILY_LIMIT) return { posted: false, reason: `daily threads limit (${DAILY_LIMIT})` };

	const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
	const { data: used } = await supabaseAdmin
		.from('nureine_social_posts')
		.select('story_id')
		.eq('platform', 'threads');
	const usedIds = new Set((used as { story_id: string }[] ?? []).map((r) => r.story_id));

	const { data: cand } = await supabaseAdmin
		.from('nureine_stories')
		.select('id,title,subtitle,share_hook,category,image_url,impact_score')
		.gte('impact_score', 60)
		.gte('created_at', since48h)
		.order('impact_score', { ascending: false })
		.order('created_at', { ascending: false })
		.limit(40);

	const story = (cand as { id: string; title: string; subtitle: string | null; share_hook: string | null; category: string; image_url: string | null; impact_score: number }[] ?? [])
		.find((s) => !usedIds.has(s.id));
	if (!story) return { posted: false, reason: 'no fresh story to post' };

	const slug = `${slugify(story.title)}-${story.id.slice(0, 8)}`;
	const linkUrl = `${BASE_URL}/geschichte/${slug}`;
	const text = buildThreadsText(story);
	// Bild bevorzugt die echte Hero-Illustration (öffentliche URL).
	const imageUrl = story.image_url || null;

	try {
		const mediaId = await postToThreads(text, imageUrl, linkUrl);
		await supabaseAdmin.from('nureine_social_posts').insert({
			story_id: story.id,
			platform: 'threads',
			caption: text,
			hashtags: [],
			card_url: imageUrl,
			og_url: `${BASE_URL}/api/og/${slug}`,
			hook_type: 'hook',
			hook_style: 'image',
			category: story.category,
			is_carousel: false,
			status: 'posted',
			posted_at: new Date().toISOString(),
			ig_media_id: mediaId,
			scheduled_for: new Date().toISOString()
		});
		console.info('[threads] posted', slug, story.impact_score);
		return { posted: true, reason: 'threads posted', slug };
	} catch (err) {
		console.error('[threads] publish failed', err);
		return { posted: false, reason: `failed: ${(err as Error).message}` };
	}
}
