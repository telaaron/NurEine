import { supabaseAdmin } from './supabase/client';
import { ADMIN_USERNAME, ADMIN_PASSWORD, BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME, BREVO_REPLY_TO_EMAIL } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { buildB2CHtml, type HeroStory } from './newsletter';

// ---- Types ----

export type OgImageSrcset = Record<string, string | null>;

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
  og_image_srcset: OgImageSrcset | null;
  is_hero: boolean;
  published_at: string;
  created_at: string;
  gut_filter_reason: string | null;
  // Editorial pipeline (migration 00023)
  emotion: string | null;
  ig_ok: boolean | null;
  wa_ok: boolean | null;
  ig_hook: string | null;
  wa_opener: string | null;
  slides: { hook: string; aufloesung: string; stille: string } | null;
  ig_caption: string | null;
  // Vorlesen-Feature (migration 00024) — nur Top-Stories.
  audio_url: string | null;
  // Jugendschutz-Flag (migration 00025).
  sensitive: boolean | null;
  // Wirkungsindex-Aufschlüsselung (migration 00026).
  impact_reach_score: number | null;
  impact_explainer: string | null;
  share_hook: string | null;
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
  ogImageSrcset: OgImageSrcset | null;
  pinned: number;
  local: number;
  featuredDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Editorial pipeline
  emotion: string | null;
  igOk: boolean;
  waOk: boolean;
  igHook: string | null;
  waOpener: string | null;
  slides: { hook: string; aufloesung: string; stille: string } | null;
  igCaption: string | null;
  audioUrl: string | null;
  sensitive: boolean;
  // Wirkungsindex-Aufschlüsselung
  impactReach: number | null;
  impactDurability: number | null;
  impactEvidence: number | null;
  impactExplainer: string | null;
  shareHook: string | null;
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
    ogImageSrcset: row.og_image_srcset || null,
    pinned: 0,
    local: 0,
    featuredDate: row.is_hero ? row.published_at : null,
    createdAt: row.created_at,
    updatedAt: row.published_at,
    emotion: row.emotion ?? null,
    igOk: row.ig_ok ?? false,
    waOk: row.wa_ok ?? false,
    igHook: row.ig_hook ?? null,
    waOpener: row.wa_opener ?? null,
    slides: row.slides ?? null,
    igCaption: row.ig_caption ?? null,
    audioUrl: row.audio_url ?? null,
    sensitive: row.sensitive ?? false,
    impactReach: row.impact_reach_score ?? null,
    impactDurability: row.impact_durability ?? null,
    impactEvidence: row.impact_evidence ?? null,
    impactExplainer: row.impact_explainer ?? null,
    shareHook: row.share_hook ?? null
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

/**
 * The website front story ("Geschichte des Tages").
 *
 * Coupled to the newsletter: the homepage shows the story that most recently
 * went out as the daily newsletter (highest newsletter_sent_at). This keeps the
 * header in lockstep with what readers receive in their inbox, and because the
 * newsletter picks a fresh, never-before-sent story every day (see
 * selectNewsletterStory in newsletter.ts), the header automatically rotates
 * daily, never repeats, and never shows a stale story.
 *
 * Fallbacks (so the homepage is NEVER empty — e.g. before the first send):
 *   1. most recently sent story (newsletter_sent_at desc)
 *   2. freshest story by created_at (until the first newsletter has gone out)
 *   3. highest-impact story overall
 *
 * Uses created_at (true insert time), not published_at (RSS date, lags 24h+).
 */
export async function getLatestFeatured(): Promise<StoryResult | undefined> {
  // 1. The story last sent as the daily newsletter — the "story of the day".
  const { data: sent } = await supabaseAdmin
    .from('nureine_stories')
    .select('*')
    .not('newsletter_sent_at', 'is', null)
    .order('newsletter_sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sent) return mapStory(sent as SupabaseStory);

  // 2. No newsletter sent yet — show the freshest scored story so the page lives.
  const { data: fresh } = await supabaseAdmin
    .from('nureine_stories')
    .select('*')
    .not('impact_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fresh) return mapStory(fresh as SupabaseStory);

  // 3. Last-resort: highest-impact story overall.
  const all = await getAllStories();
  return all[0];
}

// ---------------------------------------------------------------------------
// Editorial pipeline — channel selection (GROWTH.md §Tages-Auswahl)
//
// "Lieber leer als falsch." Each channel has its own bar. If no story clears
// a channel's bar today, that channel gets NOTHING — quality over rhythm.
// Stories from before migration 00023 have ig_ok/wa_ok=false (default), so a
// heuristic fallback keeps the channels alive until the pipeline has run a bit.
// ---------------------------------------------------------------------------

const FRESH_WINDOW_H = 36; // a story counts as "today's" within this window

function sinceFresh(): string {
  return new Date(Date.now() - FRESH_WINDOW_H * 60 * 60 * 1000).toISOString();
}

/**
 * Today's Instagram pick: a fresh, ig_ok story with the strongest visual moment
 * (proxied by impact_score). Returns undefined if none qualifies → no post today.
 * Fallback (no ig_ok stories scored yet): fresh story with impact ≥ 75.
 */
export async function selectInstagramStory(): Promise<StoryResult | undefined> {
  const since = sinceFresh();
  const { data } = await supabaseAdmin
    .from('nureine_stories')
    .select('*')
    .eq('ig_ok', true)
    .gte('created_at', since)
    .order('impact_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return mapStory(data as SupabaseStory);

  // Fallback only while no ig_ok-tagged stories exist at all (pre-pipeline).
  const { count } = await supabaseAdmin
    .from('nureine_stories')
    .select('*', { count: 'exact', head: true })
    .eq('ig_ok', true);
  if ((count ?? 0) > 0) return undefined; // pipeline active but nothing today → no post

  const { data: fb } = await supabaseAdmin
    .from('nureine_stories')
    .select('*')
    .gte('created_at', since)
    .gte('impact_score', 75)
    .order('impact_score', { ascending: false })
    .limit(1)
    .maybeSingle();
  return fb ? mapStory(fb as SupabaseStory) : undefined;
}

/**
 * Today's WhatsApp pick: a fresh, wa_ok story. Returns undefined if none.
 * Fallback (pre-pipeline): fresh story with impact ≥ 85 (the old highlight bar).
 */
export async function selectWhatsappStory(): Promise<StoryResult | undefined> {
  const since = sinceFresh();
  const { data } = await supabaseAdmin
    .from('nureine_stories')
    .select('*')
    .eq('wa_ok', true)
    .gte('created_at', since)
    .order('impact_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return mapStory(data as SupabaseStory);

  const { count } = await supabaseAdmin
    .from('nureine_stories')
    .select('*', { count: 'exact', head: true })
    .eq('wa_ok', true);
  if ((count ?? 0) > 0) return undefined;

  const { data: fb } = await supabaseAdmin
    .from('nureine_stories')
    .select('*')
    .gte('created_at', since)
    .gte('impact_score', 85)
    .order('impact_score', { ascending: false })
    .limit(1)
    .maybeSingle();
  return fb ? mapStory(fb as SupabaseStory) : undefined;
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

/**
 * Render the test newsletter HTML for a recipient using the SAME template real
 * subscribers receive (buildB2CHtml) — keeps test == production, one template.
 * Returns null if no hero story exists. Used by both the send and the preview.
 */
export async function renderTestNewsletterHtml(
  toEmail: string
): Promise<{ html: string; title: string } | null> {
  const { data: storyData } = await supabaseAdmin
    .from('nureine_stories')
    .select('id,title,subtitle,summary,category,image_url,impact_score,reading_time_min,published_at,kid_min_age,kid_explainer,conversation_starter')
    .eq('is_hero', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback: if no story is flagged is_hero, use the freshest high-impact one.
  let row = storyData as Record<string, unknown> | null;
  if (!row) {
    const { data: fresh } = await supabaseAdmin
      .from('nureine_stories')
      .select('id,title,subtitle,summary,category,image_url,impact_score,reading_time_min,published_at,kid_min_age,kid_explainer,conversation_starter')
      .not('impact_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    row = fresh as Record<string, unknown> | null;
  }
  if (!row) return null;

  const title = (row.title as string) || 'Kein Titel';
  const heroStory: HeroStory = {
    id: row.id as string,
    title,
    subtitle: (row.subtitle as string) || null,
    body_markdown: null,
    summary: (row.summary as string) || null,
    category: (row.category as string) || null,
    image_url: (row.image_url as string) || null,
    impact_score: (row.impact_score as number) ?? null,
    reading_time_min: (row.reading_time_min as number) ?? null,
    kid_min_age: (row.kid_min_age as number) ?? null,
    kid_explainer: (row.kid_explainer as string) ?? null,
    conversation_starter: (row.conversation_starter as string) ?? null
  };

  // Use the recipient's real confirmation_token if they are a subscriber, so the
  // "Themen anpassen" + unsubscribe links in the test are live too.
  const { data: subRow } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('confirmation_token, has_kids')
    .eq('email', toEmail.toLowerCase().trim())
    .maybeSingle();
  const token = (subRow?.confirmation_token as string) || 'test-token';

  return { html: buildB2CHtml(heroStory, toEmail, token, subRow?.has_kids === true), title };
}

export async function sendTestNewsletter(toEmail: string): Promise<NewsletterSendResult> {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    return { success: false, total: 1, sent: 0, errors: [{ email: toEmail, error: 'Brevo env vars not configured' }] };
  }

  const rendered = await renderTestNewsletterHtml(toEmail);
  if (!rendered) {
    return { success: false, total: 1, sent: 0, errors: [{ email: toEmail, error: 'No hero story found' }] };
  }
  const { html, title } = rendered;

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
        replyTo: { email: BREVO_REPLY_TO_EMAIL || BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || 'NurEine' },
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
  status: 'lead' | 'pilot' | 'paid' | 'churned' | 'free';
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

// ---- Funnel / Analytics (nureine_events) ----

export interface FunnelStats {
  pageviews7d: number;
  signups7d: number;
  signupsToday: number;
  storyReads7d: number;
  shares7d: number;
  ctaClicks7d: number;
  emailOpens7d: number;
  emailClicks7d: number;
  emailsDelivered7d: number;
  bounces7d: number;
  unsubs7d: number;
  openRate7d: number; // opens / delivered, %
  referralSignups7d: number;
  signupRate7d: number; // signups / pageviews, %
  pendingSubmissions: number;
  totalSubscribers: number;
  confirmedSubscribers: number;
  topStories: { slug: string; reads: number }[];
  referralLeaders: { code: string; count: number }[];
  byDay: { day: string; pageviews: number; signups: number }[];
}

export async function getFunnelStats(): Promise<FunnelStats> {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from('nureine_events')
    .select('name, props, created_at')
    .gte('created_at', since)
    .limit(50000);

  const rows = error || !data ? [] : data;

  let pageviews = 0,
    signups = 0,
    signupsToday = 0,
    reads = 0,
    shares = 0,
    cta = 0,
    opens = 0,
    clicks = 0,
    referrals = 0,
    delivered = 0,
    bounces = 0,
    unsubs = 0;
  const storyReads: Record<string, number> = {};
  const dayMap: Record<string, { pageviews: number; signups: number }> = {};

  for (const r of rows as { name: string; props: any; created_at: string }[]) {
    const day = r.created_at.slice(0, 10);
    dayMap[day] ??= { pageviews: 0, signups: 0 };
    switch (r.name) {
      case 'pageview':
        pageviews++;
        dayMap[day].pageviews++;
        break;
      case 'newsletter_signup':
        signups++;
        dayMap[day].signups++;
        if (r.created_at >= todayStart.toISOString()) signupsToday++;
        break;
      case 'story_read': {
        reads++;
        const slug = r.props?.slug;
        if (typeof slug === 'string') storyReads[slug] = (storyReads[slug] || 0) + 1;
        break;
      }
      case 'share':
        shares++;
        break;
      case 'cta_click':
        cta++;
        break;
      case 'email_open':
        opens++;
        break;
      case 'email_click':
        clicks++;
        break;
      case 'referral_signup':
        referrals++;
        break;
      case 'email_event': {
        const e = r.props?.event;
        if (e === 'delivered') delivered++;
        else if (e === 'hard_bounce' || e === 'soft_bounce' || e === 'blocked') bounces++;
        else if (e === 'unsubscribed') unsubs++;
        break;
      }
    }
  }

  const topStories = Object.entries(storyReads)
    .map(([slug, reads]) => ({ slug, reads }))
    .sort((a, b) => b.reads - a.reads)
    .slice(0, 5);

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10);
    return { day: d, pageviews: dayMap[d]?.pageviews ?? 0, signups: dayMap[d]?.signups ?? 0 };
  });

  // Subscriber + submission + referral aggregates (cheap, parallel).
  const [{ count: totalSubs }, { count: confirmedSubs }, { count: pendingSubs }, { data: leaders }] =
    await Promise.all([
      supabaseAdmin.from('nureine_subscribers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('nureine_subscribers').select('*', { count: 'exact', head: true }).eq('confirmed', true),
      supabaseAdmin.from('nureine_story_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin
        .from('nureine_subscribers')
        .select('referral_code, referral_count')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(5)
    ]);

  return {
    pageviews7d: pageviews,
    signups7d: signups,
    signupsToday,
    storyReads7d: reads,
    shares7d: shares,
    ctaClicks7d: cta,
    emailOpens7d: opens,
    emailClicks7d: clicks,
    emailsDelivered7d: delivered,
    bounces7d: bounces,
    unsubs7d: unsubs,
    openRate7d: delivered ? Math.round((opens / delivered) * 1000) / 10 : 0,
    referralSignups7d: referrals,
    signupRate7d: pageviews ? Math.round((signups / pageviews) * 1000) / 10 : 0,
    pendingSubmissions: pendingSubs ?? 0,
    totalSubscribers: totalSubs ?? 0,
    confirmedSubscribers: confirmedSubs ?? 0,
    topStories,
    referralLeaders: (leaders ?? []).map((l: { referral_code: string; referral_count: number }) => ({
      code: l.referral_code,
      count: l.referral_count
    })),
    byDay
  };
}
