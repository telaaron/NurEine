import { json } from '@sveltejs/kit';
import { getStoryById, updateStory, deleteStory } from '$lib/server/queries';

export async function GET({ params }) {
  const story = getStoryById(parseInt(params.id));
  if (!story) {
    return json({ error: 'Story nicht gefunden' }, { status: 404 });
  }
  return json(story);
}

export async function PUT({ request, params, cookies }) {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const data = await request.json();
  const id = parseInt(params.id);

  updateStory(id, {
    slug: data.slug,
    title: data.title,
    dek: data.dek,
    body: data.body,
    category: data.category,
    region: data.region,
    country: data.country,
    coordsX: data.coordsX ?? data.coords?.[0],
    coordsY: data.coordsY ?? data.coords?.[1],
    source: data.source,
    sourceUrl: data.sourceUrl,
    publishedAt: data.publishedAt,
    readingMinutes: data.readingMinutes,
    impactScore: data.impactScore,
    impactNote: data.impactNote,
    tone: data.tone,
    hero: data.hero,
    pinned: data.pinned ? 1 : 0,
    local: data.local ? 1 : 0,
    featuredDate: data.featuredDate || null
  });

  return json({ success: true });
}

export async function DELETE({ params, cookies }) {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  deleteStory(parseInt(params.id));
  return json({ success: true });
}
