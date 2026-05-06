#!/usr/bin/env python3
"""
NurEine Newsletter Sender

Called from GitHub Actions with one argument:
  sunday       — send to all confirmed subscribers (free + plus tiers)
  daily_plus   — send to confirmed 'plus' tier subscribers only

Requires the following environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  RESEND_API_KEY
  RESEND_FROM_EMAIL
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
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL")

REQUIRED_ENV = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "PUBLIC_BASE_URL",
)

# PostgREST headers (Supabase REST API)
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# Resend API endpoint
RESEND_URL = "https://api.resend.com/emails"

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
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Main container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;">
          <!-- Header bar -->
          <tr>
            <td style="background-color:#C4622D;padding:28px 36px 24px;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">
                NurEine
              </h1>
              <p style="margin:4px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#F5E6D8;font-style:italic;">
                Die gute Nachricht des Tages
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <!-- Hero emoji -->
              <div style="font-size:48px;line-height:1;margin-bottom:16px;">{emoji}</div>

              <!-- Category label -->
              <span style="display:inline-block;background-color:{category_color};color:#FFFFFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:4px 10px;border-radius:4px;margin-bottom:12px;">
                {category}
              </span>

              <!-- Title -->
              <h2 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#1A1815;line-height:1.3;">
                {title}
              </h2>

              <!-- Subtitle / Dek -->
              <p style="margin:0 0 16px;font-size:16px;color:#4A4540;line-height:1.5;">
                {dek}
              </p>

              <!-- Summary -->
              <p style="margin:0 0 20px;font-size:15px;color:#5C5650;line-height:1.6;">
                {summary}
              </p>

              <!-- Meta row: impact + reading time -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding-right:20px;">
                    <span style="font-size:13px;color:#6B6560;">
                      <strong>Impact:</strong> {impact_score}/100
                    </span>
                  </td>
                  <td>
                    <span style="font-size:13px;color:#6B6560;">
                      <strong>Lesezeit:</strong> {reading_minutes} Min.
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#C4622D;border-radius:6px;text-align:center;">
                    <a href="{story_url}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:6px;">
                      Weiterlesen
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <hr style="border:none;border-top:1px solid #E0D8CE;margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px 32px;">
              <p style="margin:0 0 8px;font-size:12px;color:#8A8480;line-height:1.5;">
                Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.
              </p>
              <p style="margin:0;font-size:12px;color:#8A8480;line-height:1.5;">
                <a href="{unsubscribe_url}" target="_blank" style="color:#C4622D;text-decoration:underline;">
                  Hier kannst du dich abmelden
                </a>
              </p>
            </td>
          </tr>
        </table>
        <!-- Imprint -->
        <p style="margin:16px 0 0;font-size:11px;color:#A09890;">
          NurEine &mdash; Gute Nachrichten. Jeden Tag exakt eine.
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
    category_color = {
        "klima": "#5A8F6F",
        "gesundheit": "#C96A7B",
        "wissenschaft": "#5A8FA0",
        "gemeinschaft": "#5A8FA0",
        "tiere": "#8A7FB0",
        "kultur": "#C4995A",
        "innovation": "#5A8FA0",
    }.get(category, "#C4622D")

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
# Resend API
# ---------------------------------------------------------------------------


def send_email(to_email: str, subject: str, html_body: str) -> dict:
    """Send an email via the Resend API."""
    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    resp = requests.post(RESEND_URL, headers=headers, json=payload, timeout=30)
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
            logger.info("Email sent to %s (resend_id=%s)", email, result.get("id"))
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
