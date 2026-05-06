import { supabaseAdmin } from './supabase/client';

// ---- Types ----

export type SupabaseStory = {
  id: string;
  title: string;
  subtitle: string | null;
  body_markdown: string;
  summary: string;
  source_url: string;
  source_name: string;
  category: string;
  region: string | null;
  region_code: string | null;
  lat: number | null;
  lng: number | null;
  impact_score: number;
  impact_reach: number | null;
  impact_durability: number | null;
  impact_evidence: number | null;
  reading_time_min: number;
  emoji: string | null;
  is_hero: boolean;
  published_at: string;
  created_at: string;
};

export type StoryResult = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  body: string;
  category: string;
  region: string;
  country: string;
  coords: [number, number];
  coordsX: number;
  coordsY: number;
  source: string;
  source_url: string;
  sourceUrl: string;
  publishedAt: string;
  readingMinutes: number;
  impactScore: number;
  impactNote: string;
  tone: 'amber' | 'sage' | 'rose' | 'sky';
  hero: string;
  pinned: number;
  local: number;
  featuredDate: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---- Helpers ----

const toneMap: Record<string, 'amber' | 'sage' | 'rose' | 'sky'> = {
  klima: 'sage',
  gesundheit: 'rose',
  wissenschaft: 'sky',
  gemeinschaft: 'amber',
  tiere: 'sage',
  kultur: 'amber',
  innovation: 'sky'
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function mapStory(row: SupabaseStory): StoryResult {
  const tone = toneMap[row.category] || 'amber';
  const lat = row.lat ?? 50;
  const lng = row.lng ?? 10;
  return {
    id: row.id,
    slug: slugify(row.title) + '-' + row.id.slice(0, 8),
    title: row.title,
    dek: row.subtitle || '',
    body: row.body_markdown,
    category: row.category,
    region: row.region || '',
    country: row.region || '',
    coords: [lat, lng] as [number, number],
    coordsX: lat,
    coordsY: lng,
    source: row.source_name,
    source_url: row.source_url,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    readingMinutes: row.reading_time_min || 3,
    impactScore: row.impact_score,
    impactNote: beschreibeWirkung(row.impact_score, row.impact_durability),
    tone,
    hero: row.emoji || '✨',
    pinned: 0,
    local: 0,
    featuredDate: row.is_hero ? row.published_at : null,
    createdAt: row.created_at,
    updatedAt: row.published_at
  };
}

function beschreibeWirkung(score: number, durability: number | null): string {
  if (durability === null) {
    if (score >= 80) return 'Strukturelle Veränderung';
    if (score >= 60) return 'Nachhaltiger Fortschritt';
    if (score >= 40) return 'Bedeutender Schritt';
    return 'Erster Schritt';
  }
  if (durability >= 80) return 'Strukturelle Veränderung';
  if (durability >= 60) return 'Nachhaltiger Fortschritt';
  if (durability >= 40) return 'Bedeutender Schritt';
  if (durability >= 20) return 'Positive Entwicklung';
  return 'Erster Schritt';
}

// ---- Public Query Functions ----

export async function getAllStories(): Promise<StoryResult[]> {
  const { data, error } = await supabaseAdmin
    .from('lichtblick_stories')
    .select('*')
    .order('published_at', { ascending: false });

  if (error || !data) {
    console.error('getAllStories error:', error);
    return [];
  }

  return (data as SupabaseStory[]).map(mapStory);
}

export async function getStoryBySlug(slug: string): Promise<StoryResult | undefined> {
  // Stories are identified by UUID, not slug. We need to decode the slug to find the story.
  // We fetch all and match by slug.
  const stories = await getAllStories();
  return stories.find((s) => s.slug === slug);
}

export async function getStoryById(id: string): Promise<StoryResult | undefined> {
  const { data, error } = await supabaseAdmin
    .from('lichtblick_stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return mapStory(data as SupabaseStory);
}

export async function getLatestFeatured(): Promise<StoryResult | undefined> {
  const { data, error } = await supabaseAdmin
    .from('lichtblick_stories')
    .select('*')
    .eq('is_hero', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback: get the highest-impact story
    const all = await getAllStories();
    return all[0];
  }
  return mapStory(data as SupabaseStory);
}

export async function getLocalStories(): Promise<StoryResult[]> {
  // Stories with lat/lng data, sorted by recent
  const { data, error } = await supabaseAdmin
    .from('lichtblick_stories')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('published_at', { ascending: false });

  if (error || !data) return [];
  return (data as SupabaseStory[]).map(mapStory);
}

export async function getRelatedStories(slug: string, limit = 3): Promise<StoryResult[]> {
  const story = await getStoryBySlug(slug);
  if (!story) return [];

  const { data, error } = await supabaseAdmin
    .from('lichtblick_stories')
    .select('*')
    .eq('category', story.category)
    .order('impact_score', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  const results = (data as SupabaseStory[]).map(mapStory);
  return results.filter((s) => s.slug !== slug).slice(0, limit);
}

export async function getAllSlugs(): Promise<{ slug: string }[]> {
  const stories = await getAllStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function getSetting(key: string): Promise<string | undefined> {
  // Settings were in the old SQLite schema. In Supabase, we don't have a settings table.
  // Return defaults.
  const defaults: Record<string, string> = {
    sources_count: '2.847',
    co2_saved: '128'
  };
  return defaults[key];
}

export async function getStats(): Promise<{
  storiesCount: number;
  sourcesCount: string;
  co2Saved: string;
}> {
  const { count, error } = await supabaseAdmin
    .from('lichtblick_stories')
    .select('*', { count: 'exact', head: true });

  return {
    storiesCount: count ?? 0,
    sourcesCount: (await getSetting('sources_count')) ?? '2.847',
    co2Saved: (await getSetting('co2_saved')) ?? '128'
  };
}

// ---- Write Operations (Admin API) ----

export async function insertStory(data: Record<string, any>): Promise<{ lastInsertRowid: string }> {
  // Map camelCase form fields back to Supabase column names
  const result = await supabaseAdmin.from('lichtblick_stories').insert({
    title: data.title,
    subtitle: data.dek || data.subtitle,
    body_markdown: data.body || data.body_markdown,
    summary: data.impactNote || data.summary || '',
    source_url: data.sourceUrl || data.source_url,
    source_name: data.source || data.source_name,
    category: data.category,
    region: data.region || data.country,
    region_code: data.region_code,
    lat: data.coordsX ?? data.lat ?? (data.coords ? data.coords[0] : null),
    lng: data.coordsY ?? data.lng ?? (data.coords ? data.coords[1] : null),
    impact_score: data.impactScore || data.impact_score || 50,
    impact_reach: data.impact_reach,
    impact_durability: data.impact_durability,
    impact_evidence: data.impact_evidence,
    reading_time_min: data.readingMinutes || data.reading_time_min || 3,
    emoji: data.hero || data.emoji || '✨',
    is_hero: data.featuredDate ? true : false,
    published_at: data.publishedAt || data.published_at || new Date().toISOString()
  }).select('id').single();

  return { lastInsertRowid: result.data?.id || '' };
}

export async function updateStory(id: string, data: Record<string, any>) {
  const updateData: Record<string, any> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.dek !== undefined) updateData.subtitle = data.dek;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.body !== undefined) updateData.body_markdown = data.body;
  if (data.body_markdown !== undefined) updateData.body_markdown = data.body_markdown;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.impactNote !== undefined) updateData.summary = data.impactNote;
  if (data.source !== undefined) updateData.source_name = data.source;
  if (data.source_name !== undefined) updateData.source_name = data.source_name;
  if (data.sourceUrl !== undefined) updateData.source_url = data.sourceUrl;
  if (data.source_url !== undefined) updateData.source_url = data.source_url;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.region !== undefined) updateData.region = data.region;
  if (data.country !== undefined) updateData.region = data.country;
  if (data.region_code !== undefined) updateData.region_code = data.region_code;
  if (data.coordsX !== undefined) updateData.lat = data.coordsX;
  if (data.coordsY !== undefined) updateData.lng = data.coordsY;
  if (data.lat !== undefined) updateData.lat = data.lat;
  if (data.lng !== undefined) updateData.lng = data.lng;
  if (data.impactScore !== undefined) updateData.impact_score = data.impactScore;
  if (data.impact_score !== undefined) updateData.impact_score = data.impact_score;
  if (data.impact_reach !== undefined) updateData.impact_reach = data.impact_reach;
  if (data.impact_durability !== undefined) updateData.impact_durability = data.impact_durability;
  if (data.impact_evidence !== undefined) updateData.impact_evidence = data.impact_evidence;
  if (data.readingMinutes !== undefined) updateData.reading_time_min = data.readingMinutes;
  if (data.reading_time_min !== undefined) updateData.reading_time_min = data.reading_time_min;
  if (data.hero !== undefined) updateData.emoji = data.hero;
  if (data.emoji !== undefined) updateData.emoji = data.emoji;
  if (data.featuredDate !== undefined) updateData.is_hero = data.featuredDate ? true : false;
  if (data.is_hero !== undefined) updateData.is_hero = data.is_hero;
  if (data.publishedAt !== undefined) updateData.published_at = data.publishedAt;
  if (data.published_at !== undefined) updateData.published_at = data.published_at;

  const { error } = await supabaseAdmin
    .from('lichtblick_stories')
    .update(updateData)
    .eq('id', id);

  return { success: !error };
}

export async function deleteStory(id: string) {
  const { error } = await supabaseAdmin
    .from('lichtblick_stories')
    .delete()
    .eq('id', id);

  return { success: !error };
}

// ---- Admin Auth ----

export async function verifyAdminLogin(username: string, passwordHash: string): Promise<boolean> {
  // In Supabase, we no longer have an admins table by default.
  // This is kept as a simple check for now - will be enhanced.
  // For development, accept hardcoded admin credentials.
  return username === 'admin' && passwordHash === hashPassword('lichtblick2025');
}

import { createHash } from 'node:crypto';

function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + 'lichtblick-salt-2024')
    .digest('hex');
}
