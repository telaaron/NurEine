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
import { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME } from '$env/static/private';
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
}

export interface Subscriber {
  id: string;
  email: string;
  confirmation_token: string | null;
  tier: string;
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

// ---------------------------------------------------------------------------
// B2C HTML Template
// ---------------------------------------------------------------------------

export function buildB2CHtml(
  story: HeroStory,
  subscriberEmail: string,
  confirmationToken: string
): string {
  const url = storyUrl(story);
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${encodeURIComponent(
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
<body style="margin:0;padding:0;background:#f5f1ea url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background:#f5f1ea url('${PNG_CANVAS}');" class="nur-eine-bg">
    <tr><td align="center" style="padding:40px 16px 32px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
        <tr><td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
        <tr><td class="nur-eine-text-faint" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee" style="max-width:600px;width:100%;background:#faf6ee url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

        ${header}

        <tr><td style="padding:28px 40px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td>
            <span style="display:inline-block;background-color:${color};color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:3px 12px;border-radius:9999px;">${category}</span>
          </td></tr></table>

          <h2 class="nur-eine-text-primary" style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">${story.title}</h2>
          ${dek ? `<p class="nur-eine-text-dek" style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#4a3f35;line-height:1.5;letter-spacing:-0.005em;">${dek}</p>` : ''}
          <p class="nur-eine-text-body" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">${summary}</p>
        </td></tr>

        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" /></td></tr>
        <tr><td style="padding:18px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
            <td style="padding-right:28px;"><span class="nur-eine-text-muted" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="font-weight:600;color:#1a1815;">Wirkung</strong> ${impact}/100</span></td>
            <td><span class="nur-eine-text-muted" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;"><strong style="font-weight:600;color:#1a1815;">Lesezeit</strong> ${minutes} Min.</span></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:0 40px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td class="nur-eine-cta" style="background:#1a1815 url('${PNG_INK}');border-radius:9999px;text-align:center;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Geschichte lesen &rarr;</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" /></td></tr>

        <tr><td style="padding:22px 40px 30px;">
          <p class="nur-eine-text-faint" style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.</p>
          <p class="nur-eine-text-faint" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
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
<body style="margin:0;padding:0;background:#f5f1ea url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<style type="text/css">:root{color-scheme:light;supported-color-schemes:light;}
[data-ogsc] .nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
[data-ogsc] .nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
[data-ogsc] .nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
[data-ogsc] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsc] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsc] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsc] .nur-eine-text-muted{color:#6b6359!important;}
[data-ogsb] .nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
[data-ogsb] .nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
[data-ogsb] .nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
[data-ogsb] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsb] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsb] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsb] .nur-eine-text-muted{color:#6b6359!important;}
@media (prefers-color-scheme:dark){.nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}.nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}.nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}.nur-eine-text-primary{color:#1a1815!important;}.nur-eine-text-body{color:#3a342c!important;}.nur-eine-text-faint{color:#9a9087!important;}.nur-eine-text-muted{color:#6b6359!important;}}
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background:#f5f1ea url('${PNG_CANVAS}');" class="nur-eine-bg">
<tr><td align="center" style="padding:40px 16px 32px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
<tr><td class="nur-eine-text-faint" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
${logoHtml}
</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee" style="max-width:600px;width:100%;background:#faf6ee url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

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
<td class="nur-eine-cta" style="background:#1a1815 url('${PNG_INK}');border-radius:9999px;text-align:center;">
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

async function fetchHeroStory(): Promise<(HeroStory & { newsletter_sent_at: string | null }) | null> {
  const { data, error } = await supabaseAdmin
    .from('nureine_stories')
    .select(
      'id,title,subtitle,body_markdown,summary,category,image_url,impact_score,reading_time_min,newsletter_sent_at'
    )
    .eq('is_hero', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[newsletter] fetchHeroStory error:', error);
    return null;
  }
  return (data as (HeroStory & { newsletter_sent_at: string | null })) ?? null;
}

/**
 * Returns true if the story was already sent as newsletter hero within the
 * given number of hours.  Used as a safety net: if select_hero.py failed
 * to run, we must not send the same story again.
 */
function wasSentRecently(
  story: HeroStory & { newsletter_sent_at: string | null },
  hours = 23
): boolean {
  if (!story.newsletter_sent_at) return false;
  const sentAt = new Date(story.newsletter_sent_at).getTime();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return sentAt > cutoff;
}

/**
 * Mark a story as having been sent as newsletter hero.
 * Called after at least one successful send so select_hero.py
 * can exclude this story tomorrow.
 */
async function markStorySent(storyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('nureine_stories')
    .update({ newsletter_sent_at: new Date().toISOString() })
    .eq('id', storyId);
  if (error) console.error('[newsletter] markStorySent error:', error);
}

async function fetchConfirmedFreeSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabaseAdmin
    .from('nureine_subscribers')
    .select('id,email,confirmation_token,tier')
    .eq('confirmed', true)
    .eq('tier', 'free');

  if (error || !data) {
    console.error('[newsletter] fetchConfirmedFreeSubscribers error:', error);
    return [];
  }
  return data as Subscriber[];
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

  const story = await fetchHeroStory();
  if (!story) {
    console.warn('[newsletter] no hero story found, aborting');
    await logCronRun('daily', 0, 0, 0);
    return {
      story: null,
      b2c: { total: 0, sent: 0, failed: 0 },
      b2b: { total: 0, sent: 0, failed: 0 },
      durationMs: Date.now() - startedAt
    };
  }

  // Safety net: if select_hero.py didn't run and this story was already
  // sent yesterday, don't send it again.
  if (wasSentRecently(story)) {
    console.warn('[newsletter] hero story was already sent recently, skipping duplicate:', story.id, story.title);
    await logCronRun('daily', 0, 0, 0);
    return {
      story: { id: story.id, title: story.title },
      b2c: { total: 0, sent: 0, failed: 0 },
      b2b: { total: 0, sent: 0, failed: 0 },
      durationMs: Date.now() - startedAt
    };
  }

  console.info('[newsletter] hero story:', story.id, story.title);

  // ---- B2C ----
  const subscribers = await fetchConfirmedFreeSubscribers();
  console.info('[newsletter] B2C subscribers:', subscribers.length);
  let b2cSent = 0;
  let b2cFailed = 0;

  for (const sub of subscribers) {
    if (!sub.email || !sub.id) {
      b2cFailed += 1;
      continue;
    }
    try {
      const html = buildB2CHtml(story, sub.email, sub.confirmation_token || '');
      await sendBrevoEmail(sub.email, SUBJECT_DAILY, html);
      await logSend(sub.id, story.id);
      b2cSent += 1;
    } catch (err) {
      console.error('[newsletter] B2C send failed', sub.email, err);
      b2cFailed += 1;
    }
  }

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

  // Mark story as sent so select_hero.py won't pick it again tomorrow
  if (b2cSent > 0 || b2bSent > 0) {
    await markStorySent(story.id);
  }

  return {
    story: { id: story.id, title: story.title },
    b2c: { total: subscribers.length, sent: b2cSent, failed: b2cFailed },
    b2b: { total: clients.length, sent: b2bSent, failed: b2bFailed },
    durationMs
  };
}
