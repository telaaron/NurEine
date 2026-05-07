#!/usr/bin/env python3
"""
NurEine Newsletter Sender

Called from GitHub Actions with one argument:
  sunday       — send to all confirmed subscribers (free + plus tiers)
  daily_plus   — send to confirmed 'plus' tier subscribers only

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
  <title>NurEine</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ea;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#faf6ee;border-radius:8px;overflow:hidden;border:1px solid rgba(26,24,21,0.12);">
          <!-- Image header -->
          <tr>
            <td style="padding:0;">
              <!--[if mso]><div style="display:none;"><![endif]-->
              <div style="margin:0;font-size:72px;line-height:1;text-align:center;padding:32px 36px 0;filter:saturate(0.85);">{emoji}</div>
              <!--[if mso]></div><![endif]-->
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:20px 36px 28px;">
              <!-- Category + date row -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:{category_color};color:#faf6ee;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.16em;padding:3px 10px;border-radius:9999px;">
                      {category}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h2 style="margin:0 0 12px;font-family:'Fraunces','Cambria',Georgia,serif;font-size:26px;font-weight:500;color:#1a1815;line-height:1.18;letter-spacing:-0.01em;">
                {title}
              </h2>

              <!-- Dek -->
              <p style="margin:0 0 20px;font-family:'Fraunces','Cambria',Georgia,serif;font-size:17px;color:#3a342c;line-height:1.45;">
                {dek}
              </p>

              <!-- Summary -->
              <p style="margin:0 0 24px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.65;">
                {summary}
              </p>
            </td>
          </tr>
          <!-- Meta strip -->
          <tr>
            <td style="padding:0 36px 0;">
              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding-right:24px;">
                    <span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;">
                      <strong style="color:#1a1815;">Wirkung</strong> {impact_score}/100
                    </span>
                  </td>
                  <td>
                    <span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6359;">
                      <strong style="color:#1a1815;">Lesezeit</strong> {reading_minutes} Min.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1a1815;border-radius:9999px;text-align:center;">
                    <a href="{story_url}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:500;color:#faf6ee;text-decoration:none;border-radius:9999px;">
                      Geschichte lesen &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px 32px;">
              <p style="margin:0 0 8px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.5;">
                Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.
              </p>
              <p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.5;">
                <a href="{unsubscribe_url}" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">
                  Abmelden
                </a>
              </p>
            </td>
          </tr>
        </table>
        <!-- Site footer -->
        <p style="margin:16px 0 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;">
          NurEine &mdash; Eine Geschichte am Tag. Mehr nicht.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_html_body(story: dict, subscriber_email: str, confirmation_token: str) -> str:
    """Render the HTML template with story and subscriber data."""
    slug = f"{story.get('title', 'story')}-{story.get('id', '')[:8]}"
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

    return HTML_TEMPLATE.format(
        emoji=story.get("emoji", ""),
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
            - None      → all confirmed (tier = 'free' or 'plus')
            - "plus"    → only confirmed 'plus' tier
            - string    → single tier value
            - list[str] → multiple tier values via 'in.(...)'
    """
    params = {"confirmed": "eq.true", "select": "id,email,confirmation_token,tier"}

    if tier_filter is None:
        params["tier"] = "in.(free,plus)"
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
        "select": "id,title,subtitle,body_markdown,summary,category,emoji,impact_score,reading_time_min",
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


def log_send(subscriber_id: str, story_id: str) -> None:
    """Insert a row into the newsletter_sends table."""
    record = {
        "subscriber_id": subscriber_id,
        "story_id": story_id,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase_post("nureine_newsletter_sends", record)
    except requests.RequestException as exc:
        logger.error("Failed to log send for subscriber %s: %s", subscriber_id, exc)


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
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    # ---- Validate arguments -------------------------------------------------
    if len(sys.argv) < 2:
        logger.error("Missing argument. Usage: send_newsletter.py [sunday|daily_plus]")
        sys.exit(1)

    newsletter_type = sys.argv[1].lower()
    if newsletter_type not in ("sunday", "daily_plus"):
        logger.error(
            "Invalid argument '%s'. Must be 'sunday' or 'daily_plus'.", newsletter_type
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
    if newsletter_type == "sunday":
        tier_filter = None  # free + plus
        subject = "NurEine Wochenendausgabe"
    else:
        tier_filter = "plus"
        subject = "NurEine Plus – Gute Nachrichten. Jeden Tag exakt eine."

    logger.info("Fetching subscribers (filter=%s)", tier_filter or "free+plus")

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

    # ---- Summary ------------------------------------------------------------
    logger.info(
        "Run complete: %s | total=%d  success=%d  failure=%d",
        newsletter_type,
        len(subscribers),
        success_count,
        failure_count,
    )

    if failure_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
