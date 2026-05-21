#!/usr/bin/env python3
"""
NurEine Newsletter Sender

Called from GitHub Actions with one argument:
  sunday  — send to all confirmed subscribers
  daily   — send to all confirmed subscribers (daily hero story)

Requires the following environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  BREVO_API_KEY
  BREVO_FROM_EMAIL
  BREVO_FROM_NAME
  PUBLIC_BASE_URL
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone

import requests

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("send_newsletter")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
BREVO_FROM_EMAIL = os.environ.get("BREVO_FROM_EMAIL")
BREVO_FROM_NAME = os.environ.get("BREVO_FROM_NAME", "NurEine")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL")

REQUIRED_ENV = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "BREVO_API_KEY",
    "BREVO_FROM_EMAIL",
    "PUBLIC_BASE_URL",
)

# PostgREST headers (Supabase REST API)
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# Brevo API endpoint
BREVO_URL = "https://api.brevo.com/v3/smtp/email"

# ---------------------------------------------------------------------------
# HTML Email Template
# ---------------------------------------------------------------------------

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting" /><!--<![endif]-->
  <style type="text/css">
    /* Force light backgrounds even in Gmail/Outlook dark mode */
    :root {{ color-scheme: light; supported-color-schemes: light; }}
    [data-ogsc] .nur-eine-bg,
    [data-ogsb] .nur-eine-bg {{ background-color: #f5f1ea !important; }}
    [data-ogsc] .nur-eine-card,
    [data-ogsb] .nur-eine-card {{ background-color: #faf6ee !important; }}
    [data-ogsc] .nur-eine-text-primary,
    [data-ogsb] .nur-eine-text-primary {{ color: #1a1815 !important; }}
    [data-ogsc] .nur-eine-text-dek,
    [data-ogsb] .nur-eine-text-dek {{ color: #4a3f35 !important; }}
    [data-ogsc] .nur-eine-text-body,
    [data-ogsb] .nur-eine-text-body {{ color: #3a342c !important; }}
    [data-ogsc] .nur-eine-cta,
    [data-ogsb] .nur-eine-cta {{ background-color: #1a1815 !important; }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background-color:#f5f1ea;" class="nur-eine-bg">
    <tr>
      <td align="center" style="padding:40px 16px 32px;">

        <!-- Brand header -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
          <tr>
            <td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td>
          </tr>
          <tr>
            <td class="nur-eine-text-subtle" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td>
          </tr>
        </table>

        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee" style="max-width:600px;width:100%;background-color:#faf6ee;border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

          <!-- Hero image -->
          {header}

          <!-- Body -->
          <tr>
            <td style="padding:28px 40px 24px;">

              <!-- Category pill -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:{category_color};color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:3px 12px;border-radius:9999px;">
                      {category}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">
                {title}
              </h2>

              <!-- Dek -->
              <p class="nur-eine-text-dek" style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#4a3f35;line-height:1.5;letter-spacing:-0.005em;">
                {dek}
              </p>

              <!-- Summary -->
              <p class="nur-eine-text-body" style="margin:0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">
                {summary}
              </p>
            </td>
          </tr>

          <!-- Meta strip -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding-right:28px;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;">
                      <strong style="font-weight:600;color:#1a1815;">Wirkung</strong> {impact_score}/100
                    </span>
                  </td>
                  <td>
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;">
                      <strong style="font-weight:600;color:#1a1815;">Lesezeit</strong> {reading_minutes} Min.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="nur-eine-cta" style="background-color:#1a1815;border-radius:9999px;text-align:center;">
                    <a href="{story_url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">
                      Geschichte lesen &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px 30px;">
              <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
                Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
                <a href="{unsubscribe_url}" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">
                  Abmelden
                </a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Site footer -->
        <p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">
          NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def slugify(text: str) -> str:
    """Create a URL-safe slug (must match src/lib/server/queries.ts slugify())."""
    import re
    s = text.lower()
    s = s.replace('\xe4', 'ae').replace('\xf6', 'oe').replace('\xfc', 'ue').replace('\xdf', 'ss')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s[:80]


def build_html_body(story: dict, subscriber_email: str, confirmation_token: str) -> str:
    """Render the HTML template with story and subscriber data."""
    raw_title = story.get('title', 'story')
    story_id = str(story.get('id', ''))
    slug = f"{slugify(raw_title)}-{story_id[:8]}"
    story_url = f"{PUBLIC_BASE_URL}/geschichte/{slug}"
    unsubscribe_url = (
        f"{PUBLIC_BASE_URL}/api/unsubscribe"
        f"?token={confirmation_token}&email={subscriber_email}"
    )
    category = story.get("category", "Allgemein")
    # Category -> Tone mapping (matches website toneStyles)
    tone_map = {
        "klima": "sage",
        "gesundheit": "rose",
        "wissenschaft": "sky",
        "gemeinschaft": "amber",
        "tiere": "sage",
        "kultur": "amber",
        "innovation": "sky",
    }
    tone = tone_map.get(category, "amber")
    category_color = {
        "amber": "#c87340",
        "sage": "#5a7a52",
        "rose": "#b87a7a",
        "sky": "#6c8aa8",
    }.get(tone, "#c87340")

    summary = story.get("summary", "")
    image_url = story.get("image_url", "")
    # Build header: use <img> if image_url is set, else sparkle fallback
    if image_url:
        header_html = f'<tr><td style="padding:0;"><img src="{image_url}" alt="" style="display:block;width:100%;height:auto;max-height:320px;object-fit:cover;border-radius:10px 10px 0 0;" /></td></tr>'
    else:
        header_html = '<tr><td style="padding:32px 40px 0;"><div style="font-size:64px;line-height:1;text-align:center;">&#10024;</div></td></tr>'

    return HTML_TEMPLATE.format(
        header=header_html,
        category=category,
        category_color=category_color,
        title=story.get("title", ""),
        dek=story.get("subtitle", ""),
        summary=summary,
        impact_score=story.get("impact_score", "?"),
        reading_minutes=story.get("reading_time_min", "?"),
        story_url=story_url,
        unsubscribe_url=unsubscribe_url,
    )


# ---------------------------------------------------------------------------
# Supabase helpers (PostgREST)
# ---------------------------------------------------------------------------


def supabase_get(endpoint: str, params: dict | None = None) -> list | dict:
    """Perform a GET request against the Supabase PostgREST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint.lstrip('/')}"
    resp = requests.get(url, headers=SUPABASE_HEADERS, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def supabase_post(endpoint: str, data: dict) -> dict:
    """Perform a POST request against the Supabase PostgREST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint.lstrip('/')}"
    resp = requests.post(url, headers=SUPABASE_HEADERS, json=data, timeout=30)
    resp.raise_for_status()
    # 201 Created returns the inserted row(s); 204 means no content returned
    if resp.status_code == 204:
        return {}
    return resp.json()


# ---------------------------------------------------------------------------
# Subscriber queries
# ---------------------------------------------------------------------------


def get_subscribers(tier_filter: str | list[str] | None = None) -> list[dict]:
    """
    Fetch confirmed subscribers from the 'subscribers' table.

    Args:
        tier_filter:
            - None      → all confirmed non-B2B (tier = 'free')
            - string    → single tier value
            - list[str] → multiple tier values via 'in.(...)'
    """
    params = {"confirmed": "eq.true", "select": "id,email,confirmation_token,tier"}

    if tier_filter is None:
        params["tier"] = "eq.free"
    elif isinstance(tier_filter, list):
        tiers = ",".join(tier_filter)
        params["tier"] = f"in.({tiers})"
    else:
        params["tier"] = f"eq.{tier_filter}"

    result = supabase_get("nureine_subscribers", params=params)
    if isinstance(result, dict):
        # Some unexpected shape; treat as empty
        logger.warning("Unexpected subscribers response shape: %s", result)
        return []
    return result  # list


def get_hero_story(is_hero: bool = True, limit: int = 1) -> dict | None:
    """Fetch the hero story (is_hero = true) for the newsletter."""
    params = {
        "is_hero": f"eq.{str(is_hero).lower()}",
        "limit": str(limit),
        "select": "id,title,subtitle,body_markdown,summary,category,image_url,impact_score,reading_time_min",
    }
    results = supabase_get("nureine_stories", params=params)
    if isinstance(results, list) and results:
        return results[0]
    logger.warning("No hero story found (is_hero=%s)", is_hero)
    return None


# ---------------------------------------------------------------------------
# Brevo API
# ---------------------------------------------------------------------------


def send_email(to_email: str, subject: str, html_body: str) -> dict:
    """Send an email via the Brevo API v3."""
    payload = {
        "sender": {"name": BREVO_FROM_NAME, "email": BREVO_FROM_EMAIL},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }
    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    resp = requests.post(BREVO_URL, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------


def log_send(subscriber_id: str, story_id: str, b2b_client_id: str | None = None) -> None:
    """Insert a row into the newsletter_sends table."""
    record = {
        "subscriber_id": subscriber_id,
        "story_id": story_id,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    if b2b_client_id:
        record["b2b_client_id"] = b2b_client_id
    try:
        supabase_post("nureine_newsletter_sends", record)
    except requests.RequestException as exc:
        logger.error("Failed to log send for subscriber %s: %s", subscriber_id, exc)


def log_delivery(b2b_client_id: str, story_id: str, integration_type: str,
                 integration_target: str, status: str = "sent",
                 status_code: int | None = None,
                 error_message: str | None = None) -> None:
    """Insert a row into the delivery_log table for B2B tracking."""
    record = {
        "b2b_client_id": b2b_client_id,
        "story_id": story_id,
        "integration_type": integration_type,
        "integration_target": integration_target,
        "status": status,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    if status_code is not None:
        record["status_code"] = status_code
    if error_message:
        record["error_message"] = error_message
    try:
        supabase_post("nureine_delivery_log", record)
    except requests.RequestException as exc:
        logger.error("Failed to log delivery for client %s: %s", b2b_client_id, exc)


def log_cron_run(newsletter_type: str, total_recipients: int,
                 success_count: int, failure_count: int) -> None:
    """Insert a row into the cron_runs table."""
    record = {
        "type": newsletter_type,
        "stories_found": total_recipients,
        "stories_inserted": success_count,
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }
    if failure_count > 0:
        record["error"] = f"{failure_count} of {total_recipients} sends failed"
    try:
        supabase_post("nureine_cron_runs", record)
    except requests.RequestException as exc:
        logger.error("Failed to log cron run: %s", exc)


# ---------------------------------------------------------------------------
# B2B Client helpers
# ---------------------------------------------------------------------------


def get_b2b_clients() -> list[dict]:
    """Fetch active B2B clients (status = pilot or paid)."""
    params = {
        "status": "in.(pilot,paid)",
        "select": "id,company_name,contact_email,integration_type,integration_target,mrr_value",
    }
    try:
        result = supabase_get("nureine_b2b_clients", params=params)
        if isinstance(result, dict):
            logger.warning("Unexpected b2b_clients response shape: %s", result)
            return []
        return result  # list
    except requests.RequestException as exc:
        logger.error("Failed to fetch B2B clients: %s", exc)
        return []


def build_b2b_html_body(story: dict, company_name: str) -> str:
    """Build a premium HTML email for B2B delivery."""
    story_id = str(story.get("id", ""))
    title = story.get("title", "")
    slug = f"{slugify(title)}-{story_id[:8]}"
    story_url = f"{PUBLIC_BASE_URL}/geschichte/{slug}"

    category = story.get("category", "Allgemein")
    tone_map = {
        "klima": "sage", "gesundheit": "rose", "wissenschaft": "sky",
        "gemeinschaft": "amber", "tiere": "sage", "kultur": "amber",
        "innovation": "sky",
    }
    tone = tone_map.get(category, "amber")
    category_color = {
        "amber": "#c87340", "sage": "#5a7a52",
        "rose": "#b87a7a", "sky": "#6c8aa8",
    }.get(tone, "#c87340")

    summary = story.get("summary", "")
    image_url = story.get("image_url", "")
    if image_url:
        header_html = f'<tr><td style="padding:0;"><img src="{image_url}" alt="" style="display:block;width:100%;height:auto;max-height:320px;object-fit:cover;border-radius:10px 10px 0 0;" /></td></tr>'
    else:
        header_html = '<tr><td style="padding:32px 40px 0;"><div style="font-size:64px;line-height:1;text-align:center;">&#10024;</div></td></tr>'

    # B2B branding line below the brand header
    b2b_header = f'<tr><td style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;color:#b0a79e;text-align:center;text-transform:uppercase;letter-spacing:0.16em;padding-top:2px;">Gute Nachrichten &mdash; powered by {company_name}</td></tr>'

    return f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"/><!--<![endif]-->
<style type="text/css">:root{{color-scheme:light;supported-color-schemes:light;}}[data-ogsc] .nur-eine-bg,[data-ogsb] .nur-eine-bg{{background-color:#f5f1ea!important;}}[data-ogsc] .nur-eine-card,[data-ogsb] .nur-eine-card{{background-color:#faf6ee!important;}}[data-ogsc] .nur-eine-text-primary,[data-ogsb] .nur-eine-text-primary{{color:#1a1815!important;}}[data-ogsc] .nur-eine-text-dek,[data-ogsb] .nur-eine-text-dek{{color:#4a3f35!important;}}[data-ogsc] .nur-eine-text-body,[data-ogsb] .nur-eine-text-body{{color:#3a342c!important;}}[data-ogsc] .nur-eine-cta,[data-ogsb] .nur-eine-cta{{background-color:#1a1815!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background-color:#f5f1ea;" class="nur-eine-bg">
<tr><td align="center" style="padding:40px 16px 32px;">

<!-- Brand header -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td class="nur-eine-text-primary" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
<tr><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
{b2b_header}
</table>

<!-- Main card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee" style="max-width:600px;width:100%;background-color:#faf6ee;border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">
{header_html}
<tr><td style="padding:28px 40px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td>
<span style="display:inline-block;background-color:{category_color};color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;padding:3px 12px;border-radius:9999px;">{category}</span>
</td></tr></table>
<h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">{title}</h2>
<p style="margin:0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">{summary}</p>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 40px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td class="nur-eine-cta" style="background-color:#1a1815;border-radius:9999px;text-align:center;">
<a href="{story_url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Geschichte lesen &rarr;</a>
</td></tr></table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/></td></tr>

<!-- Footer -->
<tr><td style="padding:22px 40px 30px;">
<p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
Bereitgestellt f&uuml;r <strong>{company_name}</strong>.
</p>
</td></tr>
</table>

<!-- Site footer -->
<p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">
NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.
</p>

</td></tr></table></body></html>"""


def build_b2b_webhook_payload(story: dict) -> dict:
    """Build a Slack/Teams compatible JSON payload for webhook delivery."""
    story_id = str(story.get("id", ""))
    title = story.get("title", "")
    slug = f"{slugify(title)}-{story_id[:8]}"
    story_url = f"{PUBLIC_BASE_URL}/geschichte/{slug}"
    summary = story.get("summary", "")
    category = story.get("category", "")
    image_url = story.get("image_url", "")

    return {
        "text": title,
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": title}
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": summary or "(Keine Zusammenfassung)"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Kategorie:* {category}"},
                    {"type": "mrkdwn", "text": f"*Impact:* {story.get('impact_score', '?')}/100"}
                ]
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Geschichte lesen"},
                        "url": story_url,
                        "style": "primary"
                    }
                ]
            }
        ]
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    # ---- Validate arguments -------------------------------------------------
    if len(sys.argv) < 2:
        logger.error("Missing argument. Usage: send_newsletter.py [sunday|daily]")
        sys.exit(1)

    newsletter_type = sys.argv[1].lower()
    if newsletter_type not in ("sunday", "daily"):
        logger.error(
            "Invalid argument '%s'. Must be 'sunday' or 'daily'.", newsletter_type
        )
        sys.exit(1)

    logger.info("Starting newsletter run: %s", newsletter_type)

    # ---- Validate environment -----------------------------------------------
    missing = [var for var in REQUIRED_ENV if not os.environ.get(var)]
    if missing:
        logger.error(
            "Missing required environment variables: %s", ", ".join(missing)
        )
        sys.exit(1)

    # ---- Fetch subscribers --------------------------------------------------
    # Both sunday and daily send to all confirmed non-B2B subscribers
    if newsletter_type == "sunday":
        subject = "NurEine Wochenendausgabe"
    else:
        subject = "NurEine – Gute Nachrichten. Jeden Tag exakt eine."

    tier_filter = None  # free tier (all non-B2B)

    logger.info("Fetching subscribers (filter=%s)", tier_filter or "free")

    try:
        subscribers = get_subscribers(tier_filter=tier_filter)
    except requests.RequestException as exc:
        logger.error("Failed to fetch subscribers: %s", exc)
        sys.exit(1)

    if not subscribers:
        logger.warning("No subscribers found. Exiting.")
        # Still log a cron run so we know it ran
        log_cron_run(newsletter_type, 0, 0, 0)
        sys.exit(0)

    logger.info("Found %d subscriber(s)", len(subscribers))

    # ---- Fetch hero story ---------------------------------------------------
    try:
        story = get_hero_story(is_hero=True, limit=1)
    except requests.RequestException as exc:
        logger.error("Failed to fetch hero story: %s", exc)
        sys.exit(1)

    if not story:
        logger.warning("No hero story found. Exiting.")
        log_cron_run(newsletter_type, len(subscribers), 0, len(subscribers))
        sys.exit(0)

    logger.info(
        "Hero story: '%s' (id=%s)", story.get("title", "?"), story.get("id", "?")
    )

    # ---- Send emails --------------------------------------------------------
    success_count = 0
    failure_count = 0

    for sub in subscribers:
        subscriber_id = sub.get("id")
        email = sub.get("email")
        token = sub.get("confirmation_token", "")
        story_id = str(story.get("id", ""))

        if not email or not subscriber_id:
            logger.warning("Skipping subscriber with missing id/email: %s", sub)
            failure_count += 1
            continue

        try:
            html_body = build_html_body(story, email, token)
            result = send_email(email, subject, html_body)
            logger.info("Email sent to %s (messageId=%s)", email, result.get("messageId"))
            log_send(str(subscriber_id), story_id)
            success_count += 1

        except requests.RequestException as exc:
            logger.error("Failed to send email to %s: %s", email, exc)
            failure_count += 1

        except Exception as exc:
            logger.error("Unexpected error sending to %s: %s", email, exc)
            failure_count += 1

    # ---- Log cron run -------------------------------------------------------
    try:
        log_cron_run(newsletter_type, len(subscribers), success_count, failure_count)
    except Exception as exc:
        logger.error("Failed to log cron run (non-fatal): %s", exc)

    # ---- Deliver to B2B clients (after B2C subscriber loop) -----------------
    b2b_success = 0
    b2b_failure = 0

    try:
        b2b_clients = get_b2b_clients()
    except Exception as exc:
        logger.warning("Could not fetch B2B clients (non-fatal): %s", exc)
        b2b_clients = []

    if b2b_clients:
        logger.info("Delivering to %d B2B client(s)", len(b2b_clients))
        for client in b2b_clients:
            client_id = str(client.get("id", ""))
            company = client.get("company_name", "Unbekannt")
            integration_type = client.get("integration_type", "email")
            target = client.get("integration_target", "")

            if not target:
                logger.warning("B2B client '%s' has no integration_target, skipping", company)
                log_delivery(client_id, story_id, integration_type, target,
                           status="failed", error_message="Missing integration_target")
                b2b_failure += 1
                continue

            try:
                if integration_type == "email":
                    b2b_html = build_b2b_html_body(story, company)
                    result = send_email(target, f"NurEine – {title}", b2b_html)
                    logger.info("B2B email sent to '%s' at %s (messageId=%s)",
                              company, target, result.get("messageId"))
                    log_delivery(client_id, story_id, "email", target, status="sent")

                    # Also log to newsletter_sends for the B2B subscriber account
                    b2b_success += 1

                elif integration_type == "webhook":
                    payload = build_b2b_webhook_payload(story)
                    resp = requests.post(target, json=payload, timeout=15,
                                        headers={"Content-Type": "application/json"})
                    if resp.ok:
                        logger.info("B2B webhook sent to '%s' (status=%d)", company, resp.status_code)
                        log_delivery(client_id, story_id, "webhook", target,
                                   status="sent", status_code=resp.status_code)
                        b2b_success += 1
                    else:
                        logger.error("B2B webhook to '%s' failed (status=%d): %s",
                                   company, resp.status_code, resp.text[:200])
                        log_delivery(client_id, story_id, "webhook", target,
                                   status="failed", status_code=resp.status_code,
                                   error_message=f"HTTP {resp.status_code}: {resp.text[:200]}")
                        b2b_failure += 1

                elif integration_type == "iframe":
                    # iFrame is passive - just log it as pending/delivered
                    logger.info("B2B iFrame client '%s' acknowledged (no push delivery)", company)
                    log_delivery(client_id, story_id, "iframe", target, status="sent")
                    b2b_success += 1

                else:
                    logger.warning("B2B client '%s' has unknown integration_type: %s", company, integration_type)
                    log_delivery(client_id, story_id, integration_type, target,
                               status="failed", error_message=f"Unknown integration_type: {integration_type}")
                    b2b_failure += 1

            except requests.RequestException as exc:
                logger.error("B2B delivery failed for '%s' (%s): %s", company, integration_type, exc)
                log_delivery(client_id, story_id, integration_type, target,
                           status="failed", error_message=str(exc))
                b2b_failure += 1
            except Exception as exc:
                logger.error("Unexpected B2B error for '%s': %s", company, exc)
                log_delivery(client_id, story_id, integration_type, target,
                           status="failed", error_message=str(exc))
                b2b_failure += 1

        logger.info("B2B delivery complete: %d success, %d failure", b2b_success, b2b_failure)

    # ---- Summary ------------------------------------------------------------
    logger.info(
        "Run complete: %s | B2C total=%d success=%d failure=%d | B2B success=%d failure=%d",
        newsletter_type,
        len(subscribers), success_count, failure_count,
        b2b_success, b2b_failure,
    )

    if failure_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
