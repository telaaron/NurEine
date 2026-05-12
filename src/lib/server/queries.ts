import { supabaseAdmin } from './supabase/client';
import { ADMIN_USERNAME, ADMIN_PASSWORD, BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

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
  image_url: string | null;
  og_image_url: string | null;
  is_hero: boolean;
  published_at: string;
  created_at: string;
  gut_filter_reason: string | null;
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
  imageUrl: string | null;
  image_url: string | null;
  ogImageUrl: string | null;
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
    hero: row.image_url || row.emoji || '✨',
    imageUrl: row.image_url,
    image_url: row.image_url,
    ogImageUrl: row.og_image_url || null,
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
    .from('nureine_stories')
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
    .from('nureine_stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return mapStory(data as SupabaseStory);
}

export async function getLatestFeatured(): Promise<StoryResult | undefined> {
  const { data, error } = await supabaseAdmin
    .from('nureine_stories')
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
    .from('nureine_stories')
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
    .from('nureine_stories')
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
    .from('nureine_stories')
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
  const result = await supabaseAdmin.from('nureine_stories').insert({
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
    image_url: data.imageUrl || data.image_url || data.hero || null,
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
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.hero !== undefined) updateData.image_url = data.hero;
  if (data.image_url !== undefined) updateData.image_url = data.image_url;
  if (data.featuredDate !== undefined) updateData.is_hero = data.featuredDate ? true : false;
  if (data.is_hero !== undefined) updateData.is_hero = data.is_hero;
  if (data.publishedAt !== undefined) updateData.published_at = data.publishedAt;
  if (data.published_at !== undefined) updateData.published_at = data.published_at;

  const { error } = await supabaseAdmin
    .from('nureine_stories')
    .update(updateData)
    .eq('id', id);

  return { success: !error };
}

export async function deleteStory(id: string) {
  const { error } = await supabaseAdmin
    .from('nureine_stories')
    .delete()
    .eq('id', id);

  return { success: !error };
}

// ---- Subscriber Stats ----

export async function getSubscriberStats(): Promise<{
  total: number;
  confirmed: number;
  free: number;
  plus: number;
  b2b: number;
}> {
  const { data, error } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('confirmed, tier');

  if (error || !data) {
    console.error('getSubscriberStats error:', error);
    return { total: 0, confirmed: 0, free: 0, plus: 0, b2b: 0 };
  }

  const rows = data as { confirmed: boolean; tier: string }[];
  return {
    total: rows.length,
    confirmed: rows.filter(r => r.confirmed).length,
    free: rows.filter(r => r.tier === 'free').length,
    plus: rows.filter(r => r.tier === 'plus').length,
    b2b: rows.filter(r => r.tier === 'b2b').length
  };
}

// ---- Newsletter Send (shared by cron + admin test) ----

export interface NewsletterSendResult {
  success: boolean;
  total: number;
  sent: number;
  errors: Array<{ email: string; error: string }>;
  messageId?: string;
}

export async function sendTestNewsletter(toEmail: string): Promise<NewsletterSendResult> {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    return { success: false, total: 1, sent: 0, errors: [{ email: toEmail, error: 'Brevo env vars not configured' }] };
  }

  // Get the hero story
  const { data: storyData, error: storyError } = await supabaseAdmin
    .from('nureine_stories')
    .select('id,title,subtitle,body_markdown,summary,category,image_url,impact_score,reading_time_min')
    .eq('is_hero', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (storyError || !storyData) {
    return { success: false, total: 1, sent: 0, errors: [{ email: toEmail, error: 'No hero story found' }] };
  }

  const story = storyData as Record<string, unknown>;
  const title = (story.title as string) || 'Kein Titel';
  const dek = (story.subtitle as string) || '';
  const summary = (story.summary as string) || '';
  const imageUrl = (story.image_url as string) || '';
  const emojiData = (story.emoji as string) || '';
  const emojiHeader = emojiData
    ? `<div style="margin:0;font-size:72px;line-height:1;text-align:center;padding:32px 36px 0;filter:saturate(0.85);">${emojiData}</div>`
    : `<div style="margin:0;font-size:72px;line-height:1;text-align:center;padding:32px 36px 0;filter:saturate(0.85);">\u2728</div>`;
  const impactScore = story.impact_score || '?';
  const readingMinutes = story.reading_time_min || '?';
  const category = (story.category as string) || 'Allgemein';
  const storyId = story.id as string;
  const slug = `${title}-${storyId.slice(0, 8)}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const storyUrl = `${PUBLIC_BASE_URL || 'https://nureine.de'}/geschichte/${slug}`;

  // Category -> Tone mapping (matches website toneStyles)
  const toneMap: Record<string, string> = {
    klima: 'sage', gesundheit: 'rose', wissenschaft: 'sky',
    gemeinschaft: 'amber', tiere: 'sage', kultur: 'amber', innovation: 'sky'
  };
  const tone = toneMap[category] || 'amber';
  const categoryColor: Record<string, string> = {
    amber: '#c87340', sage: '#5a7a52', rose: '#b87a7a', sky: '#6c8aa8'
  };
  const color = categoryColor[tone] || '#c87340';

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#f5f1ea;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ea;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#faf6ee;border-radius:8px;overflow:hidden;border:1px solid rgba(26,24,21,0.12);">
<tr><td style="padding:0;">
${emojiHeader}
</td></tr>
<tr><td style="padding:20px 36px 28px;">
<!-- Test badge -->
<table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td>
<span style="display:inline-block;background-color:#c87340;color:#faf6ee;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.16em;padding:3px 10px;border-radius:9999px;">TEST</span>
</td></tr></table>
<!-- Category -->
<table cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td>
<span style="display:inline-block;background-color:${color};color:#faf6ee;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.16em;padding:3px 10px;border-radius:9999px;">${category}</span>
</td></tr></table>
<h2 style="margin:0 0 12px;font-family:'Fraunces','Cambria',Georgia,serif;font-size:26px;font-weight:500;color:#1a1815;line-height:1.18;letter-spacing:-0.01em;">${title}</h2>
${dek ? `<p style="margin:0 0 20px;font-family:'Fraunces','Cambria',Georgia,serif;font-size:17px;color:#3a342c;line-height:1.45;">${dek}</p>` : ''}
<p style="margin:0 0 24px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.65;">${summary || '<em>Keine Zusammenfassung vorhanden.</em>'}</p>
</td></tr>
<!-- Meta strip -->
<tr><td style="padding:0 36px 0;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0;"/></td></tr>
<tr><td style="padding:16px 36px 0;">
<table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="padding-right:24px;"><span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="color:#1a1815;">Wirkung</strong> ${impactScore}/100</span></td>
<td><span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="color:#1a1815;">Lesezeit</strong> ${readingMinutes} Min.</span></td></tr>
</table>
</td></tr>
<!-- CTA -->
<tr><td style="padding:0 36px 28px;">
<table cellpadding="0" cellspacing="0"><tr>
<td style="background-color:#1a1815;border-radius:9999px;text-align:center;">
<a href="${storyUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:500;color:#faf6ee;text-decoration:none;border-radius:9999px;">Geschichte lesen &rarr;</a>
</td>
</tr></table>
</td></tr>
<!-- Divider -->
<tr><td style="padding:0 36px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0;"/></td></tr>
<!-- Footer -->
<tr><td style="padding:24px 36px 32px;">
<p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.5;">Test-Newsletter, gesendet aus dem Admin-Dashboard.</p>
</td></tr>
</table>
<p style="margin:16px 0 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;">NurEine &mdash; Eine Geschichte am Tag. Mehr nicht.</p>
</td></tr></table></body></html>`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: BREVO_FROM_NAME || 'NurEine', email: BREVO_FROM_EMAIL },
        to: [{ email: toEmail }],
        subject: `[TEST] NurEine — ${title}`,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, total: 1, sent: 0, errors: [{ email: toEmail, error: `Brevo error: ${errText}` }] };
    }

    const result = await response.json();
    return {
      success: true,
      total: 1,
      sent: 1,
      errors: [],
      messageId: result.messageId
    };
  } catch (err) {
    return { success: false, total: 1, sent: 0, errors: [{ email: toEmail, error: String(err) }] };
  }
}

// ---- Admin Auth ----
import { timingSafeEqual } from 'node:crypto';

export async function verifyAdminLogin(username: string, password: string): Promise<boolean> {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD env vars not set');
    return false;
  }

  const userOk = username.length === ADMIN_USERNAME.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(ADMIN_USERNAME));
  const passOk = password.length === ADMIN_PASSWORD.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));

  return userOk && passOk;
}
