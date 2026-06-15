/**
 * POST /api/cron/indexnow
 *
 * Pings IndexNow (Bing, Yandex, and other participating engines) so freshly
 * published stories get crawled within minutes instead of waiting for Google's
 * slow discovery of a young, low-authority domain. Google itself does not
 * consume IndexNow directly, but the faster third-party indexing + the resulting
 * crawl activity are useful discovery signals.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (same scheme as /api/cron/newsletter).
 *
 * Body (optional):
 *   { "urls": ["https://nureine.de/geschichte/..."] }  — ping these exact URLs
 *   { "recent": 25 }                                    — ping the N newest stories
 * Default (no body): pings the 25 newest stories + the key hub pages.
 *
 * Manual trigger:
 *   curl -X POST https://nureine.de/api/cron/indexnow \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { getAllStories } from '$lib/server/queries';

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';
const HOST = new URL(BASE_URL).host;

// Hub pages worth re-announcing on every run — these are the crawl entry points
// that link out to the full story archive.
const HUB_PATHS = ['/', '/archiv', '/stand-der-welt', '/warum', '/methodik', '/karte'];

async function submitToIndexNow(
  urlList: string[],
  key: string
): Promise<{ status: number; sent: number }> {
  // IndexNow caps a single bulk submission at 10 000 URLs — far above our volume.
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key,
      keyLocation: `${BASE_URL}/${key}.txt`,
      urlList
    })
  });
  return { status: res.status, sent: urlList.length };
}

export async function POST({ request }) {
  const cronSecret = env.CRON_SECRET;
  const indexnowKey = env.INDEXNOW_KEY;

  if (!cronSecret) {
    console.error('[cron/indexnow] CRON_SECRET not configured');
    throw error(500, 'Cron secret not configured');
  }
  if (!indexnowKey) {
    console.error('[cron/indexnow] INDEXNOW_KEY not configured');
    throw error(500, 'IndexNow key not configured');
  }

  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${cronSecret}`) {
    console.warn('[cron/indexnow] unauthorized request');
    throw error(401, 'Unauthorized');
  }

  let body: { urls?: string[]; recent?: number } = {};
  try {
    body = await request.json();
  } catch {
    // No body / invalid JSON → fall through to defaults.
  }

  let urlList: string[];
  if (Array.isArray(body.urls) && body.urls.length > 0) {
    urlList = body.urls;
  } else {
    const limit = typeof body.recent === 'number' && body.recent > 0 ? body.recent : 25;
    const stories = await getAllStories(); // newest first (published_at DESC)
    const storyUrls = stories.slice(0, limit).map((s) => `${BASE_URL}/geschichte/${s.slug}`);
    const hubUrls = HUB_PATHS.map((p) => `${BASE_URL}${p === '/' ? '' : p}`);
    urlList = [...hubUrls, ...storyUrls];
  }

  try {
    const result = await submitToIndexNow(urlList, indexnowKey);
    return json({ ok: true, host: HOST, ...result });
  } catch (err) {
    console.error('[cron/indexnow] submit failed:', err);
    return json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
