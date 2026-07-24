#!/usr/bin/env python3
"""
Einmalige Wiedersehens-Mail an alle bestätigten Abonnenten (Juli 2026).

Hintergrund: Vom 16. bis 21.07. lag die Auslieferung still — das Speicher-
Kontingent bei Supabase war erschöpft, die Website zeigte keine Bilder, der
Newsletter ging nicht raus. Das ist behoben. Diese Mail sagt das ehrlich und
kurz, im Ton und Look des normalen Newsletters (Abmelde-Link inklusive, sonst
ist es Spam).

    python3 scripts/send_comeback_mail.py                      # Trockenlauf
    python3 scripts/send_comeback_mail.py --test DEINE@MAIL    # nur an dich
    python3 scripts/send_comeback_mail.py --apply              # an alle

Braucht: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, BREVO_API_KEY,
BREVO_FROM_EMAIL, BREVO_FROM_NAME (aus .env).
"""
from __future__ import annotations

import os
import sys
import time
from urllib.parse import quote

import requests

BASE_URL = os.environ.get("PUBLIC_BASE_URL", "https://nureine.de").rstrip("/")
SUPABASE_URL = os.environ.get("PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BREVO_KEY = os.environ.get("BREVO_API_KEY", "")
FROM_EMAIL = os.environ.get("BREVO_FROM_EMAIL", "")
FROM_NAME = os.environ.get("BREVO_FROM_NAME", "NurEine")

SUBJECT = "Wir sind wieder da"

# Hintergrund-Texturen: 1x1-PNGs als Data-URI (identisch zum Newsletter-Template
# in src/lib/server/newsletter.ts). Sie erzwingen in Outlook/Gmail-Dark-Mode die
# hellen Flächen — als Datei-URL wären es tote Links.
PNG_CANVAS = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+vEVAAWvAtF1qGwPAAAAAElFTkSuQmCC'
PNG_CARD = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP49e0dAAXMAt9NjFIKAAAAAElFTkSuQmCC'
PNG_INK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkhAFAACXAEiRX1b9AAAAAElFTkSuQmCC'


def build_html(name: str | None, email: str, token: str) -> str:
    anrede = f"Hallo {name}," if name and name.strip() else "Hallo,"
    unsub = f"{BASE_URL}/api/unsubscribe?token={quote(token)}&email={quote(email)}"
    settings = f"{BASE_URL}/einstellungen?token={quote(token)}&email={quote(email)}"

    return f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea"
         style="background-color:#f5f1ea;background-image:url('{PNG_CANVAS}');">
    <tr><td align="center" style="padding:40px 16px 32px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
        <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
        <tr><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#faf6ee"
             style="max-width:600px;width:100%;background-color:#faf6ee;background-image:url('{PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);">

        <tr><td style="padding:36px 40px 8px;">
          <h2 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1815;line-height:1.22;">Wir sind wieder da</h2>

          <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">{anrede}</p>

          <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">
            in den vergangenen Tagen war es hier still. Kein Newsletter, keine gute
            Nachricht am Morgen. Das war keine Absicht &mdash; und wir m&ouml;chten dir
            kurz sagen, was los war.
          </p>

          <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">
            Unser Speicherplatz war voll. Wir sammeln zu jeder Geschichte ein Bild,
            und irgendwann waren es schlicht zu viele. Der Anbieter hat daraufhin den
            Zugriff gesperrt &mdash; von einem Tag auf den anderen konnten wir nichts
            mehr ausliefern.
          </p>

          <p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">
            Das ist behoben. Wir haben gr&uuml;ndlich aufger&auml;umt und dabei etwas
            gelernt, das eigentlich in unserem Namen steckt: Wir m&uuml;ssen nicht alles
            aufheben. Ab jetzt behalten wir das Beste und trennen uns vom Rest &mdash;
            regelm&auml;&szlig;ig, automatisch. Damit uns das nicht wieder passiert.
          </p>

          <p style="margin:0 0 24px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#3a342c;line-height:1.7;">
            Ab morgen fr&uuml;h findest du wie gewohnt wieder eine gute Nachricht in
            deinem Postfach. Danke, dass du geduldig warst.
          </p>
        </td></tr>

        <tr><td style="padding:0 40px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td bgcolor="#1a1815" style="background-color:#1a1815;background-image:url('{PNG_INK}');border-radius:9999px;text-align:center;">
              <a href="{BASE_URL}/" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Zur heutigen Geschichte &rarr;</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;" /></td></tr>

        <tr><td style="padding:22px 40px 30px;">
          <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
            KI-recherchiert &amp; -geschrieben, Quellen offen, von Menschen verantwortet &mdash;
            <a href="{BASE_URL}/methodik" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">so arbeiten wir</a>.
          </p>
          <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
            Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.
          </p>
          <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
            <a href="{settings}" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Themen anpassen</a>
            &nbsp;&middot;&nbsp;
            <a href="{unsub}" target="_blank" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Abmelden</a>
          </p>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.</p>
    </td></tr>
  </table>
</body>
</html>"""


def load_subscribers() -> list[dict]:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/nureine_subscribers"
        "?select=email,name,confirmation_token&confirmed=eq.true",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def send(to_email: str, html: str) -> tuple[bool, str]:
    r = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_KEY, "Content-Type": "application/json"},
        json={
            "sender": {"email": FROM_EMAIL, "name": FROM_NAME},
            "to": [{"email": to_email}],
            "subject": SUBJECT,
            "htmlContent": html,
        },
        timeout=30,
    )
    if r.ok:
        return True, r.json().get("messageId", "ok")
    return False, f"{r.status_code}: {r.text[:200]}"


def main() -> int:
    for var, val in [("PUBLIC_SUPABASE_URL", SUPABASE_URL), ("SUPABASE_SERVICE_KEY", SERVICE_KEY),
                     ("BREVO_API_KEY", BREVO_KEY), ("BREVO_FROM_EMAIL", FROM_EMAIL)]:
        if not val:
            sys.exit(f"FEHLER: {var} fehlt (set -a; source .env; set +a)")

    apply = "--apply" in sys.argv
    test_to = None
    if "--test" in sys.argv:
        i = sys.argv.index("--test")
        test_to = sys.argv[i + 1] if len(sys.argv) > i + 1 else None
        if not test_to:
            sys.exit("--test braucht eine E-Mail-Adresse")

    subs = load_subscribers()
    print(f"Bestätigte Abonnenten: {len(subs)}")
    print(f"Betreff: {SUBJECT}\n")

    if test_to:
        # Testmail mit echten Platzhaltern, aber nur an eine Adresse.
        probe = next((s for s in subs if s["email"] == test_to), None)
        html = build_html(
            probe["name"] if probe else None,
            test_to,
            probe["confirmation_token"] if probe else "test-token",
        )
        ok, info = send(test_to, html)
        print(("✓ Testmail an " if ok else "✗ Fehler bei ") + f"{test_to}: {info}")
        return 0 if ok else 1

    if not apply:
        for s in subs:
            print(f"  → {s['email']}  ({s.get('name') or 'ohne Namen'})")
        print("\nTrockenlauf. Mit --apply wird wirklich versendet.")
        return 0

    ok_n = 0
    for i, s in enumerate(subs, 1):
        good, info = send(s["email"], build_html(s.get("name"), s["email"], s["confirmation_token"]))
        print(("  ✓ " if good else "  ✗ ") + f"{s['email']}  {info if not good else ''}".rstrip())
        ok_n += 1 if good else 0
        if i < len(subs):
            time.sleep(0.4)  # Brevo nicht fluten
    print(f"\nFertig: {ok_n}/{len(subs)} versendet.")
    return 0 if ok_n == len(subs) else 1


if __name__ == "__main__":
    sys.exit(main())
