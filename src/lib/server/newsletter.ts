/**
 * Newsletter Sender — TypeScript port of scripts/send_newsletter.py
 *
 * Triggered daily by a Cloudflare Worker cron via POST /api/cron/newsletter.
 * Sunday newsletter has been removed (B2C daily only).
 *
 * Flow:
 *   1. Fetch hero story (is_hero = true).
 *   2. Send B2C email to all confirmed free-tier subscribers via Brevo.
 *   3. Deliver to active B2B clients (status in: pilot, paid, free).
 *   4. Log to nureine_newsletter_sends, nureine_delivery_log, nureine_cron_runs.
 *
 * All HTML templates and helpers live here so the entire newsletter behaviour
 * stays editable from the SvelteKit repo without touching the Worker.
 */

import { supabaseAdmin } from './supabase/client';
import { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME, BREVO_REPLY_TO_EMAIL } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroStory {
  id: string;
  title: string;
  subtitle: string | null;
  body_markdown: string | null;
  summary: string | null;
  category: string | null;
  image_url: string | null;
  impact_score: number | null;
  reading_time_min: number | null;
  kid_min_age?: number | null;
  kid_explainer?: string | null;
  conversation_starter?: string | null;
  audio_url?: string | null;
}

export interface Subscriber {
  id: string;
  email: string;
  confirmation_token: string | null;
  tier: string;
  categories: string[];
  category_scores: Record<string, number>;
  has_kids?: boolean | null;
}

export type B2BBranding = {
  show_logo?: boolean;
  show_branding?: boolean;
  branding_text?: string | null;
} | null;

export interface B2BClient {
  id: string;
  company_name: string;
  contact_email: string | null;
  integration_type: 'email' | 'webhook' | 'iframe';
  integration_target: string;
  mrr_value: number | null;
  logo_url: string | null;
  branding_config: B2BBranding;
}

export interface NewsletterRunResult {
  story: { id: string; title: string } | null;
  b2c: { total: number; sent: number; failed: number };
  b2b: { total: number; sent: number; failed: number };
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Constants — 1x1 PNG data URIs (block Gmail dark-mode inversion)
// ---------------------------------------------------------------------------

const PNG_CANVAS =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+vEVAAWvAtF1qGwPAAAAAElFTkSuQmCC';
const PNG_CARD =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP49e0dAAXMAt9NjFIKAAAAAElFTkSuQmCC';
const PNG_INK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkhAFAACXAEiRX1b9AAAAAElFTkSuQmCC';

const TONE_MAP: Record<string, string> = {
  klima: 'sage',
  gesundheit: 'rose',
  wissenschaft: 'sky',
  gemeinschaft: 'amber',
  tiere: 'sage',
  kultur: 'amber',
  innovation: 'sky'
};

const CATEGORY_COLOR: Record<string, string> = {
  amber: '#c87340',
  sage: '#5a7a52',
  rose: '#b87a7a',
  sky: '#6c8aa8'
};

const COMPANY_NAME_FULL = 'NurEine';
const COMPANY_ADDRESS = 'Teltow, Brandenburg';
const COMPANY_EMAIL = 'newsletter@nureine.de';

const SUBJECT_DAILY = 'NurEine – Gute Nachrichten. Jeden Tag exakt eine.';

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function storyUrl(story: HeroStory): string {
  const slug = `${slugify(story.title)}-${story.id.slice(0, 8)}`;
  return `${BASE_URL}/geschichte/${slug}`;
}

/**
 * Story link routed through the tracked redirect /r so we learn the reader's
 * category taste (auto-personalization) from real clicks. Falls back to a plain
 * link if we lack the subscriber token.
 */
function trackedStoryUrl(story: HeroStory, email: string, token: string): string {
  const slug = `${slugify(story.title)}-${story.id.slice(0, 8)}`;
  const to = `/geschichte/${slug}`;
  if (!token) return `${BASE_URL}${to}`;
  const q = new URLSearchParams({
    e: email,
    t: token,
    c: story.category || '',
    to
  });
  return `${BASE_URL}/r?${q.toString()}`;
}

function categoryColor(category: string | null): string {
  const tone = TONE_MAP[(category || '').toLowerCase()] || 'amber';
  return CATEGORY_COLOR[tone] || '#c87340';
}

function headerHtml(imageUrl: string | null): string {
  if (imageUrl) {
    return `<tr><td style="padding:0;"><img src="${imageUrl}" alt="" style="display:block;width:100%;height:auto;object-fit:cover;aspect-ratio:4/3;border-radius:10px 10px 0 0;" /></td></tr>`;
  }
  return '<tr><td style="padding:32px 40px 0;"><div style="font-size:64px;line-height:1;text-align:center;">&#10024;</div></td></tr>';
}

function formatBodyHtml(bodyMarkdown: string | null): string {
  if (!bodyMarkdown) return '';
  const paragraphs = bodyMarkdown
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return '';

  const parts = paragraphs.map(
    (para) =>
      `<p class="nur-eine-text-body" style="margin:0 0 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">${para}</p>`
  );
  // strip bottom margin from last paragraph
  parts[parts.length - 1] = parts[parts.length - 1].replace('margin:0 0 18px;', 'margin:0;');
  return parts.join('\n');
}

function escapeForHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// B2C HTML Template
// ---------------------------------------------------------------------------

export function buildB2CHtml(
  story: HeroStory,
  subscriberEmail: string,
  confirmationToken: string,
  forParent = false
): string {
  // Tracked link → learns the reader's category taste from clicks.
  const url = trackedStoryUrl(story, subscriberEmail, confirmationToken);

  // Family block — only for the parent segment AND only when the story is tagged
  // family-suitable. "Ein Gespräch mehr."
  const familyBlock =
    forParent && story.kid_min_age
      ? `<tr><td style="padding:0 40px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9dc;border-radius:10px;"><tr><td style="padding:18px 20px;">
    <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#bd6a35;">★ Für die Familie · ab ${story.kid_min_age} Jahren erklärbar</p>
    ${story.kid_explainer ? `<p style="margin:0 0 10px;font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#3a342c;">${escapeForHtml(story.kid_explainer)}</p>` : ''}
    ${story.conversation_starter ? `<p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:15px;line-height:1.55;color:#9c5527;">Frage für heute Abend: ${escapeForHtml(story.conversation_starter)}</p>` : ''}
  </td></tr></table>
</td></tr>`
      : '';
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${encodeURIComponent(
    confirmationToken
  )}&email=${encodeURIComponent(subscriberEmail)}`;
  const settingsUrl = `${BASE_URL}/einstellungen?token=${encodeURIComponent(
    confirmationToken
  )}&email=${encodeURIComponent(subscriberEmail)}`;

  const category = story.category || 'Allgemein';
  const color = categoryColor(category);
  const header = headerHtml(story.image_url);
  const summary = story.summary || '';
  const dek = story.subtitle || '';
  const impact = story.impact_score ?? '?';
  const minutes = story.reading_time_min ?? '?';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting" /><!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea;background-image:url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <style type="text/css">
    :root { color-scheme: light; supported-color-schemes: light; }
    [data-ogsc] .nur-eine-bg { background: #f5f1ea url('${PNG_CANVAS}') !important; }
    [data-ogsc] .nur-eine-card { background: #faf6ee url('${PNG_CARD}') !important; }
    [data-ogsc] .nur-eine-cta { background: #1a1815 url('${PNG_INK}') !important; }
    [data-ogsc] .nur-eine-text-primary { color: #1a1815 !important; }
    [data-ogsc] .nur-eine-text-dek { color: #4a3f35 !important; }
    [data-ogsc] .nur-eine-text-body { color: #3a342c !important; }
    [data-ogsc] .nur-eine-text-muted { color: #6b6359 !important; }
    [data-ogsc] .nur-eine-text-faint { color: #9a9087 !important; }
    [data-ogsc] .nur-eine-link { color: #c87340 !important; }
    [data-ogsb] .nur-eine-bg { background: #f5f1ea url('${PNG_CANVAS}') !important; }
    [data-ogsb] .nur-eine-card { background: #faf6ee url('${PNG_CARD}') !important; }
    [data-ogsb] .nur-eine-cta { background: #1a1815 url('${PNG_INK}') !important; }
    [data-ogsb] .nur-eine-text-primary { color: #1a1815 !important; }
    [data-ogsb] .nur-eine-text-dek { color: #4a3f35 !important; }
    [data-ogsb] .nur-eine-text-body { color: #3a342c !important; }
    [data-ogsb] .nur-eine-text-muted { color: #6b6359 !important; }
    [data-ogsb] .nur-eine-text-faint { color: #9a9087 !important; }
    [data-ogsb] .nur-eine-link { color: #c87340 !important; }
    @media (prefers-color-scheme: dark) {
      .nur-eine-bg { background: #f5f1ea url('${PNG_CANVAS}') !important; }
      .nur-eine-card { background: #faf6ee url('${PNG_CARD}') !important; }
      .nur-eine-cta { background: #1a1815 url('${PNG_INK}') !important; }
      .nur-eine-text-primary { color: #1a1815 !important; }
      .nur-eine-text-dek { color: #4a3f35 !important; }
      .nur-eine-text-body { color: #3a342c !important; }
      .nur-eine-text-muted { color: #6b6359 !important; }
      .nur-eine-text-faint { color: #9a9087 !important; }
      .nur-eine-link { color: #c87340 !important; }
    }
  </style>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background-color:#f5f1ea;background-image:url('${PNG_CANVAS}');" class="nur-eine-bg">
    <tr><td align="center" style="padding:40px 16px 32px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
        <tr><td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
        <tr><td class="nur-eine-text-faint" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee" style="max-width:600px;width:100%;background-color:#faf6ee;background-image:url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

        ${header}

        <tr><td style="padding:28px 40px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td>
            <span style="display:inline-block;background-color:${color};color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:3px 12px;border-radius:9999px;">${category}</span>
          </td></tr></table>

          <h2 class="nur-eine-text-primary" style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">${story.title}</h2>
          ${dek ? `<p class="nur-eine-text-dek" style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#4a3f35;line-height:1.5;letter-spacing:-0.005em;">${dek}</p>` : ''}
          <p class="nur-eine-text-body" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">${summary}</p>
          ${story.audio_url ? `<p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6b6359;">&#x1F50A; <a href="${url}" target="_blank" class="nur-eine-link" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Lieber hören? Geschichte anhören &rarr;</a></p>` : ''}
        </td></tr>

        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" /></td></tr>
        <tr><td style="padding:18px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
            <td style="padding-right:28px;"><span class="nur-eine-text-muted" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="font-weight:600;color:#1a1815;">Wirkung</strong> ${impact}/100</span></td>
            <td><span class="nur-eine-text-muted" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="font-weight:600;color:#1a1815;">Lesezeit</strong> ${minutes} Min.</span></td>
          </tr></table>
        </td></tr>

        ${familyBlock}

        <tr><td style="padding:0 40px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td class="nur-eine-cta" bgcolor="#1a1815" style="background-color:#1a1815;background-image:url('${PNG_INK}');border-radius:9999px;text-align:center;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Geschichte lesen &rarr;</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" /></td></tr>

        <tr><td style="padding:22px 40px 30px;">
          <p class="nur-eine-text-faint" style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.</p>
          <p class="nur-eine-text-faint" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
            <a href="${settingsUrl}" target="_blank" class="nur-eine-link" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Themen anpassen</a>
            &nbsp;&middot;&nbsp;
            <a href="${unsubscribeUrl}" target="_blank" class="nur-eine-link" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Abmelden</a>
          </p>
        </td></tr>
      </table>

      <p class="nur-eine-text-faint" style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// B2B HTML Template
// ---------------------------------------------------------------------------

export function buildB2BHtml(
  story: HeroStory,
  companyName: string,
  logoUrl: string,
  branding: B2BBranding
): string {
  const cfg = branding ?? {};
  const showLogo = cfg.show_logo ?? true;
  const showBranding = cfg.show_branding ?? true;
  const brandingText = cfg.branding_text || companyName;

  const url = storyUrl(story);
  const category = story.category || 'Allgemein';
  const color = categoryColor(category);
  const header = headerHtml(story.image_url);

  const bodyHtml =
    formatBodyHtml(story.body_markdown) ||
    (story.summary
      ? `<p class="nur-eine-text-body" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">${story.summary}</p>`
      : '');

  const subtitleHtml = story.subtitle
    ? `<tr><td style="padding:0 40px;"><p class="nur-eine-text-body" style="margin:0 0 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4a3f35;line-height:1.55;">${story.subtitle}</p></td></tr>`
    : '';

  const logoHtml =
    showLogo && logoUrl
      ? `<tr><td style="padding-top:16px;"><img src="${logoUrl}" alt="${companyName}" style="display:block;margin:0 auto;max-height:34px;width:auto;" /></td></tr>`
      : '';

  const brandingHtml = showBranding
    ? `<tr><td style="padding:0 40px 24px;"><p class="nur-eine-text-muted" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#6b6359;line-height:1.6;text-align:center;font-style:italic;">Ein Moment des Fokus.<br/>Erm&ouml;glicht durch die Leitung des ${brandingText}.</p></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"/><!--<![endif]--></head>
<body style="margin:0;padding:0;background-color:#f5f1ea;background-image:url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<style type="text/css">:root{color-scheme:light;supported-color-schemes:light;}
[data-ogsc] .nur-eine-bg{background-color:#f5f1ea;background-image:url('${PNG_CANVAS}')!important;}
[data-ogsc] .nur-eine-card{background-color:#faf6ee;background-image:url('${PNG_CARD}')!important;}
[data-ogsc] .nur-eine-cta{background-color:#1a1815;background-image:url('${PNG_INK}')!important;}
[data-ogsc] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsc] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsc] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsc] .nur-eine-text-muted{color:#6b6359!important;}
[data-ogsb] .nur-eine-bg{background-color:#f5f1ea;background-image:url('${PNG_CANVAS}')!important;}
[data-ogsb] .nur-eine-card{background-color:#faf6ee;background-image:url('${PNG_CARD}')!important;}
[data-ogsb] .nur-eine-cta{background-color:#1a1815;background-image:url('${PNG_INK}')!important;}
[data-ogsb] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsb] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsb] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsb] .nur-eine-text-muted{color:#6b6359!important;}
@media (prefers-color-scheme:dark){.nur-eine-bg{background-color:#f5f1ea;background-image:url('${PNG_CANVAS}')!important;}.nur-eine-card{background-color:#faf6ee;background-image:url('${PNG_CARD}')!important;}.nur-eine-cta{background-color:#1a1815;background-image:url('${PNG_INK}')!important;}.nur-eine-text-primary{color:#1a1815!important;}.nur-eine-text-body{color:#3a342c!important;}.nur-eine-text-faint{color:#9a9087!important;}.nur-eine-text-muted{color:#6b6359!important;}}
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background-color:#f5f1ea;background-image:url('${PNG_CANVAS}');" class="nur-eine-bg">
<tr><td align="center" style="padding:40px 16px 32px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
<tr><td class="nur-eine-text-faint" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
${logoHtml}
</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee" style="max-width:600px;width:100%;background-color:#faf6ee;background-image:url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

${header}

<tr><td style="padding:28px 40px 12px;">
<p class="nur-eine-text-primary" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#1a1815;line-height:1.4;letter-spacing:-0.005em;">Guten Morgen, Team ${companyName},</p>
</td></tr>

<tr><td style="padding:10px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td>
<span style="display:inline-block;background-color:${color};color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:3px 12px;border-radius:9999px;">${category}</span>
</td></tr></table>
</td></tr>

<tr><td style="padding:0 40px;">
<h2 class="nur-eine-text-primary" style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">${story.title}</h2>
</td></tr>

${subtitleHtml}

<tr><td style="padding:0 40px 24px;">
${bodyHtml}
</td></tr>

${brandingHtml}

<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/></td></tr>

<tr><td style="padding:24px 40px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td class="nur-eine-cta" bgcolor="#1a1815" style="background-color:#1a1815;background-image:url('${PNG_INK}');border-radius:9999px;text-align:center;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Hat dir das den Morgen versch&ouml;nert? Teile diese Story &rarr;</a>
</td></tr></table>
</td></tr>

</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:20px;">
<tr><td style="padding:0 16px;">
<p class="nur-eine-text-faint" style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;line-height:1.6;text-align:center;">
${COMPANY_NAME_FULL} &mdash; ${COMPANY_ADDRESS}. Gegr&uuml;ndet 2026. <a href="mailto:${COMPANY_EMAIL}" style="color:#b0a79e;text-decoration:underline;">${COMPANY_EMAIL}</a>
</p>
<p class="nur-eine-text-faint" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;line-height:1.6;text-align:center;">
Du erh&auml;ltst diese E-Mail, weil dein Arbeitgeber NurEine nutzt.
<a href="mailto:${COMPANY_EMAIL}?subject=B2B%20Abmeldung%20${encodeURIComponent(companyName)}" style="color:#b0a79e;text-decoration:underline;">Hier abmelden</a>
</p>
</td></tr>
</table>

</td></tr></table></body></html>`;
}

// ---------------------------------------------------------------------------
// B2B Webhook payload (Slack/Teams compatible)
// ---------------------------------------------------------------------------

export function buildWebhookPayload(story: HeroStory): Record<string, unknown> {
  const url = storyUrl(story);
  return {
    text: story.title,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: story.title } },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: story.summary || '(Keine Zusammenfassung)' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Kategorie:* ${story.category || '—'}` },
          { type: 'mrkdwn', text: `*Impact:* ${story.impact_score ?? '?'}/100` }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Geschichte lesen' },
            url,
            style: 'primary'
          }
        ]
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// Brevo
// ---------------------------------------------------------------------------

async function sendBrevoEmail(toEmail: string, subject: string, html: string): Promise<string> {
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { name: BREVO_FROM_NAME || 'NurEine', email: BREVO_FROM_EMAIL },
      to: [{ email: toEmail }],
      replyTo: { email: BREVO_REPLY_TO_EMAIL || BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || 'NurEine' },
      subject,
      htmlContent: html
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Brevo ${resp.status}: ${text.slice(0, 300)}`);
  }
  const data = (await resp.json()) as { messageId?: string };
  return data.messageId || '';
}

// ---------------------------------------------------------------------------
// DB queries
// ---------------------------------------------------------------------------

/**
 * Atomic send-time story selection — the core of the robust newsletter.
 *
 * Instead of relying on a separate 02:00 cron to set is_hero (which created a
 * cross-platform race and a 3-layer dedup mess), the newsletter picks its own
 * story at the moment of sending. Selection is tiered by freshness:
 *
 *   Tier 1 (24 h):  highest impact among unsent stories created in the last 24 h
 *   Tier 2 (48 h):  fallback — same but 48 h window
 *   Tier 3 (∞):     any unsent story, highest impact (last-resort fallback)
 *
 * This prevents very old high-impact stories from blocking fresh content.
 * `created_at` (DB insert time), not `published_at` (RSS feed date, which can
 * lag by 24h+), is the freshness signal. Because every send marks the chosen
 * story's newsletter_sent_at, the next day automatically gets a different one —
 * no dedup window guessing, no race, no empty sends as long as any unsent
 * story exists.
 */
async function selectNewsletterStory(): Promise<HeroStory | null> {
  const BASE_SELECT =
    'id,title,subtitle,body_markdown,summary,category,image_url,impact_score,reading_time_min,kid_min_age,kid_explainer,conversation_starter,audio_url';
  const now = new Date();

  // ── Tier 1: last 24 h ──────────────────────────────────────────────
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: t1 } = await supabaseAdmin
    .from('nureine_stories')
    .select(BASE_SELECT)
    .is('newsletter_sent_at', null)
    .not('impact_score', 'is', null)
    .gte('created_at', since24h)
    .order('impact_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (t1) {
    console.log('[newsletter] story selected from tier 1 (≤24 h)');
    return t1 as HeroStory;
  }

  // ── Tier 2: last 48 h ──────────────────────────────────────────────
  const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const { data: t2 } = await supabaseAdmin
    .from('nureine_stories')
    .select(BASE_SELECT)
    .is('newsletter_sent_at', null)
    .not('impact_score', 'is', null)
    .gte('created_at', since48h)
    .order('impact_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (t2) {
    console.log('[newsletter] story selected from tier 2 (≤48 h)');
    return t2 as HeroStory;
  }

  // ── Tier 3: Notfall — ungesendete Story der letzten 7 Tage mit Wirkung ≥ 60.
  // KEINE uralte Story mehr (das war der Bug: tagealte Story landete im Newsletter,
  // wenn Tier 1/2 leer waren). Lieber kein Newsletter als ein verstaubter.
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: t3, error } = await supabaseAdmin
    .from('nureine_stories')
    .select(BASE_SELECT)
    .is('newsletter_sent_at', null)
    .gte('impact_score', 60)
    .gte('created_at', since7d)
    .order('impact_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[newsletter] selectNewsletterStory error:', error);
    return null;
  }
  if (t3) {
    console.log('[newsletter] story selected from tier 3 (≤7d, impact≥60)');
    return t3 as HeroStory;
  }
  console.warn('[newsletter] no suitable story — skipping newsletter today (better empty than stale)');
  return null;
}

/**
 * Mark a story as having been sent as newsletter hero.
 * Set BEFORE the send loop so the row is claimed atomically — even if the
 * function crashes mid-send, the story will not be picked again tomorrow.
 */
async function markStorySent(storyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('nureine_stories')
    .update({ newsletter_sent_at: new Date().toISOString() })
    .eq('id', storyId);
  if (error) console.error('[newsletter] markStorySent error:', error);
}

/**
 * Ranked candidate stories for the personalized send.
 *
 * Like selectNewsletterStory but returns the top-N unsent stories (impact desc),
 * tiered by freshness, so each subscriber can be matched to the best story in
 * THEIR categories. One query, in-memory matching afterwards — O(stories+users),
 * no per-user DB round-trips (cost- and exponential-safe).
 */
async function selectRankedStories(limit = 12): Promise<HeroStory[]> {
  const BASE_SELECT =
    'id,title,subtitle,body_markdown,summary,category,image_url,impact_score,reading_time_min,kid_min_age,kid_explainer,conversation_starter,audio_url';
  const now = Date.now();

  async function tier(sinceMs: number | null): Promise<HeroStory[]> {
    let q = supabaseAdmin
      .from('nureine_stories')
      .select(BASE_SELECT)
      .is('newsletter_sent_at', null)
      .not('impact_score', 'is', null);
    if (sinceMs !== null) q = q.gte('created_at', new Date(now - sinceMs).toISOString());
    const { data } = await q
      .order('impact_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data as HeroStory[]) ?? [];
  }

  // Prefer fresh; fall back to wider windows only if nothing fresh exists.
  let ranked = await tier(24 * 3600e3);
  if (ranked.length === 0) ranked = await tier(48 * 3600e3);
  if (ranked.length === 0) ranked = await tier(null);
  return ranked;
}

/**
 * For a set of candidate story ids, return which story ids each subscriber has
 * already been sent (so we never resend the same story to the same person).
 * One query for the whole audience.
 */
async function fetchRecentSendsByStory(storyIds: string[]): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (storyIds.length === 0) return map;
  const { data, error } = await supabaseAdmin
    .from('nureine_newsletter_sends')
    .select('subscriber_id, story_id')
    .in('story_id', storyIds);
  if (error || !data) return map;
  for (const row of data as { subscriber_id: string; story_id: string }[]) {
    if (!map.has(row.subscriber_id)) map.set(row.subscriber_id, new Set());
    map.get(row.subscriber_id)!.add(row.story_id);
  }
  return map;
}

/**
 * Pick the best story for one subscriber:
 *   1. If they have category prefs, prefer the highest-impact ranked story in
 *      one of those categories that they haven't been sent yet.
 *   2. Else (no prefs OR no match left), the highest-impact ranked story they
 *      haven't been sent yet.
 *   3. Else null (everything already sent to them — rare; skip).
 */
function pickForSubscriber(
  ranked: HeroStory[],
  categories: string[],
  scores: Record<string, number>,
  alreadySent: Set<string>
): HeroStory | null {
  const unseen = ranked.filter((s) => !alreadySent.has(s.id));
  if (unseen.length === 0) return null;

  // 1) Explicit prefs win — the reader told us directly.
  if (categories.length > 0) {
    const match = unseen.find((s) => s.category && categories.includes(s.category));
    if (match) return match;
    return unseen[0];
  }

  // 2) No explicit prefs → fall back to LEARNED taste (from click signals).
  //    Prefer categories with a meaningful score; among those, highest impact.
  const learned = Object.entries(scores)
    .filter(([, v]) => v >= 2) // ignore one-off clicks; need a small signal
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  if (learned.length > 0) {
    const match = unseen.find((s) => s.category && learned.includes(s.category));
    if (match) return match;
  }

  // 3) Otherwise the globally strongest unseen story.
  return unseen[0];
}

async function fetchConfirmedFreeSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('id,email,confirmation_token,tier,categories,category_scores,has_kids')
    .eq('confirmed', true)
    .eq('tier', 'free');

  if (error || !data) {
    console.error('[newsletter] fetchConfirmedFreeSubscribers error:', error);
    return [];
  }
  return (data as Subscriber[]).map((s) => ({
    ...s,
    categories: s.categories ?? [],
    category_scores: s.category_scores ?? {}
  }));
}

async function fetchActiveB2BClients(): Promise<B2BClient[]> {
  // Sunday gone. Daily delivers to pilot, paid, free.
  const { data, error } = await supabaseAdmin
    .from('nureine_b2b_clients')
    .select(
      'id,company_name,contact_email,integration_type,integration_target,mrr_value,logo_url,branding_config'
    )
    .in('status', ['pilot', 'paid', 'free']);

  if (error || !data) {
    console.error('[newsletter] fetchActiveB2BClients error:', error);
    return [];
  }
  return data as B2BClient[];
}

async function logSend(subscriberId: string, storyId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('nureine_newsletter_sends').insert({
    subscriber_id: subscriberId,
    story_id: storyId,
    sent_at: new Date().toISOString()
  });
  if (error) console.error('[newsletter] logSend error:', error);
}

async function logDelivery(
  clientId: string,
  storyId: string,
  integrationType: string,
  target: string,
  status: 'sent' | 'failed',
  statusCode?: number,
  errorMessage?: string
): Promise<void> {
  const row: Record<string, unknown> = {
    b2b_client_id: clientId,
    story_id: storyId,
    integration_type: integrationType,
    integration_target: target,
    status,
    sent_at: new Date().toISOString()
  };
  if (statusCode !== undefined) row.status_code = statusCode;
  if (errorMessage) row.error_message = errorMessage;

  const { error } = await supabaseAdmin.from('nureine_delivery_log').insert(row);
  if (error) console.error('[newsletter] logDelivery error:', error);
}

async function logCronRun(
  type: string,
  total: number,
  success: number,
  failure: number
): Promise<void> {
  const row: Record<string, unknown> = {
    type,
    stories_found: total,
    stories_inserted: success,
    ran_at: new Date().toISOString()
  };
  if (failure > 0) {
    row.error = `${failure} of ${total} sends failed`;
  }
  const { error } = await supabaseAdmin.from('nureine_cron_runs').insert(row);
  if (error) console.error('[newsletter] logCronRun error:', error);
}

// ---------------------------------------------------------------------------
// Main entry: sendDailyNewsletter
// ---------------------------------------------------------------------------

export async function sendDailyNewsletter(): Promise<NewsletterRunResult> {
  const startedAt = Date.now();
  console.info('[newsletter] daily run started');

  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('BREVO_API_KEY / BREVO_FROM_EMAIL not configured');
  }

  // Rank today's unsent candidates once. The #1 is the global hero (used for
  // B2B + the return value); each B2C subscriber gets the best story in THEIR
  // categories, matched in-memory (cost-/exponential-safe).
  const ranked = await selectRankedStories(12);
  const story = ranked[0] ?? null;
  if (!story) {
    // No unsent story left — the only legitimate "send nothing" case.
    console.warn('[newsletter] no unsent story available, nothing to send');
    await logCronRun('daily', 0, 0, 0);
    return {
      story: null,
      b2c: { total: 0, sent: 0, failed: 0 },
      b2b: { total: 0, sent: 0, failed: 0 },
      durationMs: Date.now() - startedAt
    };
  }
  console.info(
    '[newsletter] ranked candidates:',
    ranked.map((s) => `${s.category}:${s.impact_score}`).join(', ')
  );

  // ---- B2C (personalized) ----
  const subscribers = await fetchConfirmedFreeSubscribers();
  console.info('[newsletter] B2C subscribers:', subscribers.length);

  // Per-subscriber dedup: which candidate stories has each already received?
  const sentByStory = await fetchRecentSendsByStory(ranked.map((s) => s.id));

  let b2cSent = 0;
  let b2cFailed = 0;
  const sentStoryIds = new Set<string>(); // stories actually sent today → mark once

  for (const sub of subscribers) {
    if (!sub.email || !sub.id) {
      b2cFailed += 1;
      continue;
    }
    const pick = pickForSubscriber(ranked, sub.categories, sub.category_scores, sentByStory.get(sub.id) ?? new Set());
    if (!pick) {
      // Everything in the candidate set already sent to this subscriber — skip.
      continue;
    }
    try {
      const html = buildB2CHtml(pick, sub.email, sub.confirmation_token || '', sub.has_kids === true);
      await sendBrevoEmail(sub.email, SUBJECT_DAILY, html);
      await logSend(sub.id, pick.id);
      sentStoryIds.add(pick.id);
      b2cSent += 1;
    } catch (err) {
      console.error('[newsletter] B2C send failed', sub.email, err);
      b2cFailed += 1;
    }
  }

  // Mark every story that actually went out today so it won't be re-picked
  // globally tomorrow. (The hero #1 always gets marked even if B2C is empty,
  // because B2B uses it below.)
  sentStoryIds.add(story.id);
  for (const id of sentStoryIds) await markStorySent(id);

  await logCronRun('daily', subscribers.length, b2cSent, b2cFailed);

  // ---- B2B ----
  const clients = await fetchActiveB2BClients();
  console.info('[newsletter] B2B clients:', clients.length);
  let b2bSent = 0;
  let b2bFailed = 0;

  for (const client of clients) {
    const clientId = client.id;
    const company = client.company_name || 'Unbekannt';
    const integrationType = client.integration_type || 'email';
    const target = client.integration_target || '';

    if (!target) {
      await logDelivery(clientId, story.id, integrationType, target, 'failed', undefined, 'Missing integration_target');
      b2bFailed += 1;
      continue;
    }

    try {
      if (integrationType === 'email') {
        const html = buildB2BHtml(story, company, client.logo_url || '', client.branding_config);
        const emails = target
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.includes('@'));

        if (emails.length === 0) {
          await logDelivery(clientId, story.id, 'email', target, 'failed', undefined, 'No valid email address');
          b2bFailed += 1;
          continue;
        }

        for (const addr of emails) {
          try {
            await sendBrevoEmail(addr, `NurEine – ${story.title}`, html);
            await logDelivery(clientId, story.id, 'email', addr, 'sent');
            b2bSent += 1;
          } catch (err) {
            await logDelivery(clientId, story.id, 'email', addr, 'failed', undefined, String(err));
            b2bFailed += 1;
          }
        }
      } else if (integrationType === 'webhook') {
        const payload = buildWebhookPayload(story);
        const resp = await fetch(target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          await logDelivery(clientId, story.id, 'webhook', target, 'sent', resp.status);
          b2bSent += 1;
        } else {
          const txt = await resp.text();
          await logDelivery(
            clientId,
            story.id,
            'webhook',
            target,
            'failed',
            resp.status,
            `HTTP ${resp.status}: ${txt.slice(0, 200)}`
          );
          b2bFailed += 1;
        }
      } else if (integrationType === 'iframe') {
        await logDelivery(clientId, story.id, 'iframe', target, 'sent');
        b2bSent += 1;
      } else {
        await logDelivery(
          clientId,
          story.id,
          integrationType,
          target,
          'failed',
          undefined,
          `Unknown integration_type: ${integrationType}`
        );
        b2bFailed += 1;
      }
    } catch (err) {
      console.error('[newsletter] B2B delivery error', company, err);
      await logDelivery(clientId, story.id, integrationType, target, 'failed', undefined, String(err));
      b2bFailed += 1;
    }
  }

  const durationMs = Date.now() - startedAt;
  console.info(
    `[newsletter] done in ${durationMs}ms — B2C ${b2cSent}/${subscribers.length} (failed ${b2cFailed}), B2B ${b2bSent}/${clients.length} (failed ${b2bFailed})`
  );

  // Story was already claimed (newsletter_sent_at set) before the send loop —
  // nothing more to mark here.

  return {
    story: { id: story.id, title: story.title },
    b2c: { total: subscribers.length, sent: b2cSent, failed: b2cFailed },
    b2b: { total: clients.length, sent: b2bSent, failed: b2bFailed },
    durationMs
  };
}

// ---------------------------------------------------------------------------
// Monthly "Stand der Welt" newsletter — free for all confirmed subscribers.
// ---------------------------------------------------------------------------

interface WorldMetricRow {
  metric_key: string;
  label: string;
  unit: string | null;
  latest_value: number;
  latest_year: number;
  baseline_value: number;
  baseline_year: number;
  direction: 'up' | 'down';
  blurb: string | null;
}

function metricImprovementPct(m: WorldMetricRow): number {
  if (!m.baseline_value) return 0;
  const change = ((m.latest_value - m.baseline_value) / m.baseline_value) * 100;
  const better = m.direction === 'up' ? change > 0 : change < 0;
  return better ? Math.abs(change) : 0;
}

function fmtMetric(v: number, unit: string | null): string {
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
  if (unit === '%') return `${s} %`;
  if (unit === 'Jahre') return `${s} Jahre`;
  return s;
}

function buildWorldMetricsHtml(m: WorldMetricRow, email: string, token: string): string {
  const dashUrl = `${BASE_URL}/stand-der-welt`;
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const settingsUrl = `${BASE_URL}/einstellungen?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const pct = Math.round(metricImprovementPct(m));
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background-color:#f5f1ea;background-image:url('${PNG_CANVAS}');">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background-color:#f5f1ea;background-image:url('${PNG_CANVAS}');">
<tr><td align="center" style="padding:40px 16px 32px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td style="font-family:Georgia,serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
<tr><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;text-transform:uppercase;letter-spacing:0.14em;">Der Stand der Welt</td></tr>
</table>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#faf6ee;background-image:url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);">
<tr><td style="padding:36px 40px 8px;">
<p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#bd6a35;">Diesen Monat bewegt</p>
<h2 style="margin:0 0 14px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1a1815;line-height:1.2;">${escapeForHtml(m.label)}</h2>
<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:19px;line-height:1.5;color:#3a342c;">
<span style="color:#bd6a35;">${fmtMetric(m.baseline_value, m.unit)}</span> (${m.baseline_year})
&rarr; <span style="color:#bd6a35;">${fmtMetric(m.latest_value, m.unit)}</span> (${m.latest_year})${pct ? ` — <strong>${pct}% besser</strong>` : ''}.
</p>
${m.blurb ? `<p style="margin:0 0 24px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;">${escapeForHtml(m.blurb)}</p>` : ''}
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;">
Dieselbe Welt. Eine andere Geschichte. Auf den Metriken, die wirklich z&auml;hlen, bewegt sich die Welt in die richtige Richtung.
</p>
</td></tr>
<tr><td style="padding:0 40px 36px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="background-color:#1a1815;background-image:url('${PNG_INK}');border-radius:9999px;text-align:center;">
<a href="${dashUrl}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Alle Metriken ansehen &rarr;</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/></td></tr>
<tr><td style="padding:22px 40px 30px;">
<p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">Einmal im Monat: der Stand der Welt. Quellen: World Bank u.a.</p>
<p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
<a href="${settingsUrl}" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Themen anpassen</a>&nbsp;&middot;&nbsp;
<a href="${unsubscribeUrl}" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Abmelden</a>
</p>
</td></tr>
</table>
<p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.</p>
</td></tr></table></body></html>`;
}

/** Render-only preview of the monthly world newsletter (admin). No send. */
export async function renderWorldMetricsHtml(toEmail = 'preview@nureine.de'): Promise<string | null> {
  const { data: rows } = await supabaseAdmin
    .from('nureine_world_metrics')
    .select('metric_key,label,unit,latest_value,latest_year,baseline_value,baseline_year,direction,blurb');
  const metrics = (rows as WorldMetricRow[]) ?? [];
  if (!metrics.length) return null;
  const featured = [...metrics].sort((a, b) => metricImprovementPct(b) - metricImprovementPct(a))[0];
  const { data: sub } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('confirmation_token')
    .eq('email', toEmail.toLowerCase().trim())
    .maybeSingle();
  return buildWorldMetricsHtml(featured, toEmail, (sub?.confirmation_token as string) || 'test-token');
}

export async function sendWorldMetricsNewsletter(): Promise<NewsletterRunResult> {
  const startedAt = Date.now();
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('BREVO_API_KEY / BREVO_FROM_EMAIL not configured');
  }

  const { data: rows } = await supabaseAdmin
    .from('nureine_world_metrics')
    .select('metric_key,label,unit,latest_value,latest_year,baseline_value,baseline_year,direction,blurb');
  const metrics = (rows as WorldMetricRow[]) ?? [];
  if (!metrics.length) {
    console.warn('[world-newsletter] no metrics, nothing to send');
    return { story: null, b2c: { total: 0, sent: 0, failed: 0 }, b2b: { total: 0, sent: 0, failed: 0 }, durationMs: Date.now() - startedAt };
  }

  // Pick the most-improved metric this run.
  const featured = [...metrics].sort((a, b) => metricImprovementPct(b) - metricImprovementPct(a))[0];
  console.info('[world-newsletter] featured:', featured.metric_key);

  const subscribers = await fetchConfirmedFreeSubscribers();
  const subject = `Der Stand der Welt — ${featured.label} verbessert sich`;
  let sent = 0, failed = 0;
  for (const sub of subscribers) {
    if (!sub.email || !sub.id) { failed += 1; continue; }
    try {
      const html = buildWorldMetricsHtml(featured, sub.email, sub.confirmation_token || '');
      await sendBrevoEmail(sub.email, subject, html);
      sent += 1;
    } catch (err) {
      console.error('[world-newsletter] send failed', sub.email, err);
      failed += 1;
    }
  }
  await logCronRun('world_metrics', subscribers.length, sent, failed);
  return { story: null, b2c: { total: subscribers.length, sent, failed }, b2b: { total: 0, sent: 0, failed: 0 }, durationMs: Date.now() - startedAt };
}

// ---------------------------------------------------------------------------
// Highlight morning email — "Be the customer, not the seller"
//
// Each morning we look at today's stories. If one genuinely stands out
// (impact_score >= HIGHLIGHT_THRESHOLD), we email *Aaron* — not subscribers —
// a link to its /share page, where he finds a ready-made 9:16 card + caption
// to post on his WhatsApp status. The rule: only post when the story moves you.
// So this mail fires ONLY for true highlights, not daily out of duty.
// ---------------------------------------------------------------------------

const HIGHLIGHT_THRESHOLD = 85;

/**
 * Find today's highest-impact story and, if it clears the highlight bar,
 * email Aaron a /share link. Returns a small status object for the endpoint.
 */
export async function sendHighlightEmailIfWorthy(): Promise<{
  sent: boolean;
  reason: string;
  slug?: string;
  impactScore?: number;
}> {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('BREVO_API_KEY / BREVO_FROM_EMAIL not configured');
  }

  // Recipient: HIGHLIGHT_EMAIL override → reply-to → from. Always Aaron, never subscribers.
  const recipient = env.HIGHLIGHT_EMAIL || BREVO_REPLY_TO_EMAIL || BREVO_FROM_EMAIL;
  if (!recipient) return { sent: false, reason: 'no recipient configured' };

  // Pipeline-Auswahl (inline, um Zirkular-Import mit queries.ts zu vermeiden):
  // bevorzugt eine wa_ok-Story der letzten 36 h; Fallback = höchste Wirkung ≥85.
  // "Lieber leer als falsch" — keine würdige Story heute → keine Mail.
  const since36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const COLS = 'id,title,subtitle,category,image_url,impact_score,wa_opener,wa_ok';

  type PickedStory = {
    id: string; title: string; subtitle: string | null; category: string | null;
    image_url: string | null; impact_score: number; wa_opener: string | null; wa_ok: boolean | null;
  };
  let picked: PickedStory | null = null;

  const { data: waRow } = await supabaseAdmin
    .from('nureine_stories')
    .select(COLS)
    .eq('wa_ok', true)
    .gte('created_at', since36h)
    .order('impact_score', { ascending: false })
    .limit(1)
    .maybeSingle();
  picked = (waRow as PickedStory | null) ?? null;

  if (!picked) {
    // Fallback: höchste Wirkung der letzten 36 h, muss ≥ Schwelle sein.
    const { data: fbRow } = await supabaseAdmin
      .from('nureine_stories')
      .select(COLS)
      .not('impact_score', 'is', null)
      .gte('created_at', since36h)
      .order('impact_score', { ascending: false })
      .limit(1)
      .maybeSingle();
    const fb = (fbRow as PickedStory | null) ?? null;
    if (!fb) return { sent: false, reason: 'no story in last 36 h' };
    if ((fb.impact_score ?? 0) < HIGHLIGHT_THRESHOLD) {
      return {
        sent: false,
        reason: `top story impact ${fb.impact_score} < ${HIGHLIGHT_THRESHOLD} and none wa_ok — no highlight`,
        impactScore: fb.impact_score
      };
    }
    picked = fb;
  }

  const story = {
    title: picked.title,
    subtitle: picked.subtitle,
    category: picked.category,
    image_url: picked.image_url,
    impact_score: picked.impact_score
  };

  const slug = `${slugify(picked.title)}-${picked.id.slice(0, 8)}`;
  const shareUrl = `${BASE_URL}/share/${slug}`;
  const dek = picked.subtitle || '';
  // WhatsApp-Status-Begleittext: KURZ. Karte trägt die Story, niemand liest lange
  // Status-Texte. Ein persönlicher Funke + Link — mehr nicht.
  const opener = picked.wa_opener || 'Das hat mich heute kurz innehalten lassen.';
  const caption = `${opener}\n👉 nureine.de`;

  const subject = `🔥 Heute postenswert — ${picked.title}`;
  const html = renderHighlightHtml(story, shareUrl, caption);

  try {
    await sendBrevoEmail(recipient, subject, html);
    console.info('[highlight] sent', slug, 'impact', story.impact_score, '→', recipient);
    return { sent: true, reason: 'highlight sent', slug, impactScore: story.impact_score };
  } catch (err) {
    console.error('[highlight] send failed', err);
    return { sent: false, reason: `send failed: ${(err as Error).message}`, slug, impactScore: story.impact_score };
  }
}

function renderHighlightHtml(
  story: { title: string; subtitle: string | null; impact_score: number; image_url: string | null },
  shareUrl: string,
  caption: string
): string {
  const dek = story.subtitle || '';
  const cap = escapeForHtml(caption).replace(/\n/g, '<br>');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4efe6;font-family:'Helvetica Neue',Arial,sans-serif;color:#16140f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf8f1;border-radius:18px;overflow:hidden;border:1px solid #e8ddc9;">
        <tr><td style="padding:28px 36px 8px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c87340;font-weight:600;">Highlight des Tages · Wirkung ${story.impact_score}/100</p>
        </td></tr>
        ${story.image_url ? `<tr><td style="padding:14px 36px 0;"><img src="${story.image_url}" alt="" width="448" style="width:100%;border-radius:12px;display:block;"></td></tr>` : ''}
        <tr><td style="padding:18px 36px 0;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:23px;line-height:1.25;color:#16140f;">${escapeForHtml(story.title)}</h1>
          ${dek ? `<p style="margin:12px 0 0;font-family:Georgia,serif;font-style:italic;font-size:16px;color:#4a3f35;line-height:1.5;">${escapeForHtml(dek)}</p>` : ''}
        </td></tr>
        <tr><td style="padding:24px 36px 6px;">
          <a href="${shareUrl}" style="display:block;background:#16140f;color:#fbf8f1;text-decoration:none;text-align:center;padding:15px 24px;border-radius:999px;font-size:15px;font-weight:600;">Karte + Text holen → posten</a>
        </td></tr>
        <tr><td style="padding:10px 36px 4px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#c87340;font-weight:600;">Begleittext (zum Kopieren)</p>
        </td></tr>
        <tr><td style="padding:6px 36px 0;">
          <div style="background:#f4efe6;border:1px solid #e8ddc9;border-radius:10px;padding:16px;font-family:Georgia,serif;font-size:15px;color:#4a3f35;line-height:1.55;">${cap}</div>
        </td></tr>
        <tr><td style="padding:18px 36px 30px;">
          <p style="margin:0;font-size:13px;color:#8a7d6a;line-height:1.5;">Nur posten, wenn dich die Geschichte selbst bewegt. Nicht aus Pflicht. Du postest nicht als Gründer — als Mensch, den etwas bewegt hat.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
