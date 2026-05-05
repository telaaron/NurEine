import sqlite from '$lib/server/db/connection';

export type StoryRow = {
  id: number;
  slug: string;
  title: string;
  dek: string;
  body: string;
  category: string;
  region: string;
  country: string;
  coords_x: number;
  coords_y: number;
  source: string;
  source_url: string;
  published_at: string;
  reading_minutes: number;
  impact_score: number;
  impact_note: string;
  tone: string;
  hero: string;
  pinned: number;
  local: number;
  featured_date: string | null;
  created_at: string;
  updated_at: string;
};

function mapStory(row: StoryRow) {
  return {
    ...row,
    coords: [row.coords_x, row.coords_y] as [number, number],
    coordsX: row.coords_x,
    coordsY: row.coords_y,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    readingMinutes: row.reading_minutes,
    impactScore: row.impact_score,
    impactNote: row.impact_note,
    featuredDate: row.featured_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getAllStories() {
  const rows = sqlite.prepare('SELECT * FROM stories ORDER BY published_at DESC').all() as StoryRow[];
  return rows.map(mapStory);
}

export function getStoryBySlug(slug: string) {
  const row = sqlite.prepare('SELECT * FROM stories WHERE slug = ?').get(slug) as StoryRow | undefined;
  return row ? mapStory(row) : undefined;
}

export function getStoryById(id: number) {
  const row = sqlite.prepare('SELECT * FROM stories WHERE id = ?').get(id) as StoryRow | undefined;
  return row ? mapStory(row) : undefined;
}

export function getLatestFeatured() {
  const row = sqlite.prepare(
    "SELECT * FROM stories WHERE featured_date IS NOT NULL ORDER BY featured_date DESC LIMIT 1"
  ).get() as StoryRow | undefined;
  return row ? mapStory(row) : undefined;
}

export function getLocalStories() {
  const rows = sqlite.prepare('SELECT * FROM stories WHERE local = 1 ORDER BY published_at DESC').all() as StoryRow[];
  return rows.map(mapStory);
}

export function getRelatedStories(slug: string, limit = 3) {
  const story = getStoryBySlug(slug);
  if (!story) return [];
  const rows = sqlite.prepare(
    'SELECT * FROM stories WHERE category = ? AND slug != ? ORDER BY impact_score DESC LIMIT ?'
  ).all(story.category, slug, limit) as StoryRow[];
  return rows.map(mapStory);
}

export function getAllSlugs() {
  return sqlite.prepare('SELECT slug FROM stories').all() as { slug: string }[];
}

export function getSetting(key: string) {
  const row = sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function getStats() {
  const countRow = sqlite.prepare('SELECT COUNT(*) as count FROM stories').get() as { count: number };
  return {
    storiesCount: countRow?.count ?? 0,
    sourcesCount: getSetting('sources_count') ?? '2.847',
    co2Saved: getSetting('co2_saved') ?? '128'
  };
}

// Write operations (for admin API)
export function insertStory(data: Record<string, any>) {
  const stmt = sqlite.prepare(`
    INSERT INTO stories (slug, title, dek, body, category, region, country, coords_x, coords_y,
      source, source_url, published_at, reading_minutes, impact_score, impact_note, tone, hero, pinned, local, featured_date)
    VALUES (@slug, @title, @dek, @body, @category, @region, @country, @coordsX, @coordsY,
      @source, @sourceUrl, @publishedAt, @readingMinutes, @impactScore, @impactNote, @tone, @hero, @pinned, @local, @featuredDate)
  `);
  return stmt.run(data);
}

export function updateStory(id: number, data: Record<string, any>) {
  const stmt = sqlite.prepare(`
    UPDATE stories SET slug = @slug, title = @title, dek = @dek, body = @body,
      category = @category, region = @region, country = @country,
      coords_x = @coordsX, coords_y = @coordsY,
      source = @source, source_url = @sourceUrl, published_at = @publishedAt,
      reading_minutes = @readingMinutes, impact_score = @impactScore,
      impact_note = @impactNote, tone = @tone, hero = @hero,
      pinned = @pinned, local = @local, featured_date = @featuredDate,
      updated_at = datetime('now')
    WHERE id = ?
  `);
  return stmt.run(data, id);
}

export function deleteStory(id: number) {
  return sqlite.prepare('DELETE FROM stories WHERE id = ?').run(id);
}

export function verifyAdminLogin(username: string, passwordHash: string) {
  const row = sqlite.prepare('SELECT id FROM admins WHERE username = ? AND password_hash = ?').get(username, passwordHash) as { id: number } | undefined;
  return !!row;
}
