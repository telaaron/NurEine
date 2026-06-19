import { json } from '@sveltejs/kit';
import { verifyAdminRequest } from '$lib/server/auth';
import { getAllStories, getStats, insertStory, getLatestFeatured } from '$lib/server/queries';

export async function GET({ url }) {
  const category = url.searchParams.get('category');
  const limit = url.searchParams.get('limit');
  const stats = url.searchParams.get('stats');
  const featured = url.searchParams.get('featured');

  if (stats === 'true') {
    return json(await getStats());
  }

  // The app's "Heute" hero: the exact same story the website features, computed
  // server-side (getLatestFeatured), so the app never has to re-derive it.
  if (featured === 'true') {
    const hero = await getLatestFeatured();
    return json(hero ?? null);
  }

  let stories = await getAllStories();

  if (category) {
    stories = stories.filter((s) => s.category === category);
  }

  if (limit) {
    stories = stories.slice(0, parseInt(limit));
  }

  return json(stories);
}

export async function POST({ request, cookies }) {
  if (!verifyAdminRequest(cookies)) {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const data = await request.json();
  const result = await insertStory({
    slug: data.slug,
    title: data.title,
    dek: data.dek,
    body: data.body,
    category: data.category,
    region: data.region,
    country: data.country,
    coordsX: data.coordsX ?? data.coords?.[0] ?? 50,
    coordsY: data.coordsY ?? data.coords?.[1] ?? 50,
    source: data.source,
    sourceUrl: data.sourceUrl,
    publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
    readingMinutes: data.readingMinutes || 3,
    impactScore: data.impactScore || 50,
    impactNote: data.impactNote || '',
    tone: data.tone || 'amber',
    hero: data.hero || '✨',
    pinned: data.pinned ? 1 : 0,
    local: data.local ? 1 : 0,
    featuredDate: data.featuredDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return json({ success: true, id: result.lastInsertRowid }, { status: 201 });
}
