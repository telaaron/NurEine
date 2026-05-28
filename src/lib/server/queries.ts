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
    region: row.region_code || '',
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
  // Slug format: slugify(title)-8charUUIDprefix
  // We fetch all stories and filter by slug in memory.
  // Note: ILIKE on UUID columns doesn't work in PostgreSQL/PostgREST,
  // and adding a slug column requires a DB migration. For the current
  // story volume (< 1000), an in-memory filter is perfectly fine.
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
  b2b: number;
}> {
  const { data, error } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('confirmed, tier');

  if (error || !data) {
    console.error('getSubscriberStats error:', error);
    return { total: 0, confirmed: 0, free: 0, b2b: 0 };
  }

  const rows = data as { confirmed: boolean; tier: string }[];
  return {
    total: rows.length,
    confirmed: rows.filter(r => r.confirmed).length,
    free: rows.filter(r => r.tier === 'free').length,
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
    .select('id,title,subtitle,summary,category,image_url,impact_score,reading_time_min,published_at')
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
  const impactScore = story.impact_score || '?';
  const readingMinutes = story.reading_time_min || '?';
  const category = (story.category as string) || 'Allgemein';
  const storyId = story.id as string;
  const slug = slugify(title) + '-' + storyId.slice(0, 8);
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

  // Build header: hero image if available, otherwise emoji fallback
  const headerHtml = imageUrl
    ? `<tr><td style="padding:0;"><img src="${imageUrl}" alt="" width="600" height="450" style="display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px 10px 0 0;" /></td></tr>`
    : `<tr><td style="padding:32px 40px 0;"><div style="font-size:64px;line-height:1;text-align:center;">\u2728</div></td></tr>`;

  // 1x1 pixel PNG data URIs – Gmail never inverts actual images
  const PNG_CANVAS = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+vEVAAWvAtF1qGwPAAAAAElFTkSuQmCC";
  const PNG_CARD   = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP49e0dAAXMAt9NjFIKAAAAAElFTkSuQmCC";
  const PNG_INK    = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkhAFAACXAEiRX1b9AAAAAElFTkSuQmCC";

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"/><!--<![endif]--></head>
<body style="margin:0;padding:0;background:#f5f1ea url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<style type="text/css">:root{color-scheme:light;supported-color-schemes:light;}
[data-ogsc] .nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
[data-ogsc] .nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
[data-ogsc] .nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
[data-ogsc] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsc] .nur-eine-text-dek{color:#4a3f35!important;}
[data-ogsc] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsc] .nur-eine-text-muted{color:#6b6359!important;}
[data-ogsc] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsb] .nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
[data-ogsb] .nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
[data-ogsb] .nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
[data-ogsb] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsb] .nur-eine-text-dek{color:#4a3f35!important;}
[data-ogsb] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsb] .nur-eine-text-muted{color:#6b6359!important;}
[data-ogsb] .nur-eine-text-faint{color:#9a9087!important;}
@media (prefers-color-scheme:dark){.nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}.nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}.nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}.nur-eine-text-primary{color:#1a1815!important;}.nur-eine-text-dek{color:#4a3f35!important;}.nur-eine-text-body{color:#3a342c!important;}.nur-eine-text-muted{color:#6b6359!important;}.nur-eine-text-faint{color:#9a9087!important;}}
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background:#f5f1ea url('${PNG_CANVAS}');" class="nur-eine-bg">
<tr><td align="center" style="padding:40px 16px 32px;">

<!-- Brand header -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
<tr><td class="nur-eine-text-faint" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
</table>

<!-- Main card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf6ee url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

<!-- Hero -->
${headerHtml}

<!-- Body -->
<tr><td style="padding:28px 40px 24px;">

<!-- Test badge -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr><td>
<span style="display:inline-block;background-color:#c87340;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:4px 10px;border-radius:4px;">TEST</span>
</td></tr></table>

<!-- Category pill -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td>
<span style="display:inline-block;background-color:${color};color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:3px 12px;border-radius:9999px;">${category}</span>
</td></tr></table>

<!-- Title -->
<h2 class="nur-eine-text-primary" style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">${title}</h2>

<!-- Dek -->
${dek ? `<p class="nur-eine-text-dek" style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#4a3f35;line-height:1.5;letter-spacing:-0.005em;">${dek}</p>` : ''}

<!-- Summary -->
<p class="nur-eine-text-body" style="margin:0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">${summary || '<em>Keine Zusammenfassung vorhanden.</em>'}</p>

</td></tr>

<!-- Meta strip -->
<tr><td style="padding:0 40px;">
<hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/>
</td></tr>
<tr><td style="padding:18px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr>
<td style="padding-right:28px;"><span class="nur-eine-text-muted" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="font-weight:600;color:#1a1815;">Wirkung</strong> ${impactScore}/100</span></td>
<td><span class="nur-eine-text-muted" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="font-weight:600;color:#1a1815;">Lesezeit</strong> ${readingMinutes} Min.</span></td>
</tr>
</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 40px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td class="nur-eine-cta" style="background:#1a1815 url('${PNG_INK}');border-radius:9999px;text-align:center;">
<a href="${storyUrl}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Geschichte lesen &rarr;</a>
</td>
</tr></table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;">
<hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/>
</td></tr>

<!-- Footer -->
<tr><td style="padding:22px 40px 30px;">
<p class="nur-eine-text-faint" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
Dies ist ein Test-Newsletter aus dem Admin-Dashboard.<br/>Kein automatischer Versand.
</p>
</td></tr>

</table>

<!-- Site footer -->
<p class="nur-eine-text-faint" style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">
NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.
</p>

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

// ---- B2B Client Queries ----

export type B2BBrandingConfig = {
  show_logo: boolean;
  show_branding: boolean;
  branding_text: string | null;
};

export const DEFAULT_BRANDING_CONFIG: B2BBrandingConfig = {
  show_logo: true,
  show_branding: true,
  branding_text: null
};

export type B2BClient = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'lead' | 'pilot' | 'paid' | 'churned';
  pilot_ends_at: string | null;
  mrr_value: number;
  integration_type: 'email' | 'webhook' | 'iframe';
  integration_target: string;
  invoice_status: 'bezahlt' | 'offen' | 'storniert';
  notes: string | null;
  branding_config: B2BBrandingConfig | null;
  created_at: string;
};

export type DeliveryLogEntry = {
  id: string;
  b2b_client_id: string | null;
  story_id: string | null;
  integration_type: string;
  integration_target: string;
  status: 'pending' | 'sent' | 'failed';
  status_code: number | null;
  error_message: string | null;
  sent_at: string;
  company_name?: string;
  story_title?: string;
};

export type B2BDashboardStats = {
  mrr: number;
  activeClients: number;
  pilotCount: number;
  payingCount: number;
  churnedCount: number;
  pilotsExpiringSoon: number;
};

export async function getB2BDashboardStats(): Promise<B2BDashboardStats> {
  const { data, error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .select('status, mrr_value, pilot_ends_at');

  if (error || !data) {
    console.error('getB2BDashboardStats error:', error);
    return { mrr: 0, activeClients: 0, pilotCount: 0, payingCount: 0, churnedCount: 0, pilotsExpiringSoon: 0 };
  }

  const rows = data as { status: string; mrr_value: number; pilot_ends_at: string | null }[];
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return {
    mrr: rows
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + (r.mrr_value || 0), 0),
    activeClients: rows.filter(r => r.status === 'pilot' || r.status === 'paid').length,
    pilotCount: rows.filter(r => r.status === 'pilot').length,
    payingCount: rows.filter(r => r.status === 'paid').length,
    churnedCount: rows.filter(r => r.status === 'churned').length,
    pilotsExpiringSoon: rows.filter(r => {
      if (r.status !== 'pilot' || !r.pilot_ends_at) return false;
      const end = new Date(r.pilot_ends_at);
      return end <= threeDaysFromNow && end >= now;
    }).length
  };
}

export async function getAllB2BClients(): Promise<B2BClient[]> {
  const { data, error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('getAllB2BClients error:', error);
    return [];
  }
  return data as B2BClient[];
}

export async function getB2BClientById(id: string): Promise<B2BClient | undefined> {
  const { data, error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return data as B2BClient;
}

export async function createB2BClient(client: Omit<B2BClient, 'id' | 'created_at'>): Promise<string> {
  const insertData: Record<string, unknown> = {
    company_name: client.company_name,
    contact_name: client.contact_name,
    contact_email: client.contact_email,
    contact_phone: client.contact_phone,
    status: client.status,
    mrr_value: client.mrr_value,
    integration_type: client.integration_type,
    integration_target: client.integration_target,
    invoice_status: client.invoice_status,
    notes: client.notes,
    branding_config: client.branding_config ?? DEFAULT_BRANDING_CONFIG
  };

  // Auto-set pilot_ends_at to +30 days if status is pilot
  if (client.status === 'pilot') {
    const now = new Date();
    now.setDate(now.getDate() + 30);
    insertData.pilot_ends_at = now.toISOString();
  } else if (client.pilot_ends_at) {
    insertData.pilot_ends_at = client.pilot_ends_at;
  }

  const { data, error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('createB2BClient error:', error);
    throw new Error(`Failed to create B2B client: ${error.message}`);
  }
  return data.id as string;
}

export async function updateB2BClient(id: string, updates: Partial<B2BClient> & { pilot_ends_at?: string | null }): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (updates.company_name !== undefined) updateData.company_name = updates.company_name;
  if (updates.contact_name !== undefined) updateData.contact_name = updates.contact_name;
  if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email;
  if (updates.contact_phone !== undefined) updateData.contact_phone = updates.contact_phone;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.mrr_value !== undefined) updateData.mrr_value = updates.mrr_value;
  if (updates.integration_type !== undefined) updateData.integration_type = updates.integration_type;
  if (updates.integration_target !== undefined) updateData.integration_target = updates.integration_target;
  if (updates.invoice_status !== undefined) updateData.invoice_status = updates.invoice_status;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.branding_config !== undefined) updateData.branding_config = updates.branding_config;

  // Handle pilot_ends_at explicitly
  if ('pilot_ends_at' in updates) {
    updateData.pilot_ends_at = updates.pilot_ends_at;
  } else if (updates.status === 'pilot') {
    // If transitioning to pilot, auto-set to +30 days
    const existing = await getB2BClientById(id);
    if (existing && existing.status !== 'pilot') {
      const now = new Date();
      now.setDate(now.getDate() + 30);
      updateData.pilot_ends_at = now.toISOString();
    }
  }

  const { error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('updateB2BClient error:', error);
    throw new Error(`Failed to update B2B client: ${error.message}`);
  }
}

export async function deleteB2BClient(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteB2BClient error:', error);
    throw new Error(`Failed to delete B2B client: ${error.message}`);
  }
}

// ---- B2C Subscriber Queries (Admin) ----

export type SubscriberRow = {
  id: string;
  email: string;
  tier: string;
  confirmed: boolean;
  lat: number | null;
  lng: number | null;
  region: string | null;
  region_code: string | null;
  created_at: string;
};

export async function getAllSubscribers(): Promise<SubscriberRow[]> {
  const { data, error } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('getAllSubscribers error:', error);
    return [];
  }
  return data as SubscriberRow[];
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('nureine_subscribers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteSubscriber error:', error);
    return false;
  }
  return true;
}

export async function deleteSubscribers(ids: string[]): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('nureine_subscribers')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('deleteSubscribers error:', error);
    return false;
  }
  return true;
}

// ---- Delivery Log Queries ----

export async function getDeliveryLog(limit = 50): Promise<DeliveryLogEntry[]> {
  const { data, error } = await supabaseAdmin
    .from('nureine_delivery_log')
    .select('*, nureine_b2b_clients(company_name), nureine_stories(title)')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('getDeliveryLog error:', error);
    return [];
  }

  return (data as any[]).map(entry => ({
    id: entry.id,
    b2b_client_id: entry.b2b_client_id,
    story_id: entry.story_id,
    integration_type: entry.integration_type,
    integration_target: entry.integration_target,
    status: entry.status,
    status_code: entry.status_code,
    error_message: entry.error_message,
    sent_at: entry.sent_at,
    company_name: entry.nureine_b2b_clients?.company_name || null,
    story_title: entry.nureine_stories?.title || null
  }));
}
