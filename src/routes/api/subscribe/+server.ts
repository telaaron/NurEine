import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import crypto from 'node:crypto';

// POST /api/subscribe
// Body: { email: string, tier?: 'free' | 'plus' | 'b2b', lat?: number, lng?: number, region?: string, region_code?: string }
//
// 1. Validate email format
// 2. Check if email already exists in subscribers table
// 3. If not, insert with confirmed=false, confirmation_token=crypto.randomUUID()
// 4. Send confirmation email via Brevo API
// 5. Return success

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildConfirmationEmailHtml(token: string): string {
	const confirmUrl = `${BASE_URL}/api/confirm?token=${token}`;

	return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best\u00e4tige deine Anmeldung</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ea;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#faf6ee;border-radius:8px;overflow:hidden;border:1px solid rgba(26,24,21,0.12);">
          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 28px;text-align:center;">
              <h1 style="margin:0;font-family:'Fraunces','Cambria',Georgia,serif;font-size:24px;font-weight:500;color:#1a1815;letter-spacing:-0.01em;">
                NurEine
              </h1>
              <p style="margin:4px 0 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-transform:uppercase;letter-spacing:0.18em;">
                t\u00e4gliche Dosis Hoffnung
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0;">
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 12px;font-family:'Fraunces','Cambria',Georgia,serif;font-size:22px;font-weight:500;color:#1a1815;line-height:1.2;">
                Fast geschafft!
              </h2>
              <p style="margin:0 0 16px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:#3a342c;">
                Danke f\u00fcr deine Anmeldung zum NurEine-Newsletter.
                Wir freuen uns, dass du dabei bist!
              </p>
              <p style="margin:0 0 28px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:#3a342c;">
                Bitte best\u00e4tige deine E-Mail-Adresse, damit wir dir ab sofort gute Nachrichten schicken k\u00f6nnen.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#1a1815;border-radius:9999px;padding:14px 36px;">
                    <a href="${confirmUrl}" style="display:inline-block;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:500;color:#faf6ee;text-decoration:none;">
                      E-Mail best\u00e4tigen &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.5;color:#6b6359;">
                Falls der Button nicht funktioniert, kopiere bitte diesen Link in deinen Browser:
              </p>
              <p style="margin:0 0 28px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b6359;word-break:break-all;background-color:#f5f1ea;padding:12px;border-radius:6px;">
                <a href="${confirmUrl}" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">${confirmUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0 0 24px;">

              <p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.55;color:#9a9087;">
                Du hast dich nicht angemeldet? Ignoriere einfach diese E-Mail.
                Deine Adresse wird automatisch gel\u00f6scht, falls du nicht best\u00e4tigst.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(26,24,21,0.12);margin:0;">
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;">
                NurEine &ndash; Eine Geschichte am Tag. Mehr nicht.
              </p>
              <p style="margin:8px 0 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;">
                <a href="${BASE_URL}/newsletter" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Newsletter</a>
                &nbsp;&middot;&nbsp;
                <a href="${BASE_URL}/unsubscribe" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);">Abmelden</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;">
          &copy; ${new Date().getFullYear()} NurEine. Ver\u00f6ffentlicht in Teltow, Brandenburg.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// Helper to send confirmation email via Brevo
async function sendConfirmationEmail(email: string, token: string): Promise<void> {
	const html = buildConfirmationEmailHtml(token);

	const response = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'api-key': BREVO_API_KEY,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: JSON.stringify({
			sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
			to: [{ email }],
			subject: 'Bitte bestätige deine E-Mail-Adresse für den NurEine-Newsletter',
			htmlContent: html
		})
	});

	if (!response.ok) {
		const errorBody = await response.text();
		console.error('Brevo API error:', response.status, errorBody);
		throw new Error('Fehler beim Senden der Bestätigungs-E-Mail');
	}
}

export async function POST({ request }) {
	try {
		const { email, tier, lat, lng, region, region_code } = await request.json();

		// 1. Validate email format
		if (!email || typeof email !== 'string') {
			return json({ error: 'Bitte gib eine E-Mail-Adresse ein.' }, { status: 400 });
		}

		if (!isValidEmail(email)) {
			return json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, { status: 400 });
		}

		// Validate tier if provided
		const validTiers = ['free', 'plus', 'b2b'];
		const subscriberTier = tier && validTiers.includes(tier) ? tier : 'free';

		// 2. Check if email already exists
		const { data: existing, error: lookupError } = await supabaseAdmin
			.from('nureine_subscribers')
			.select('id, email, confirmed')
			.eq('email', email.toLowerCase().trim())
			.maybeSingle();

		if (lookupError) {
			console.error('Supabase lookup error:', lookupError);
			return json({ error: 'Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut.' }, { status: 500 });
		}

		if (existing) {
			if (existing.confirmed) {
				return json({
					message: 'Du bist bereits für den Newsletter angemeldet.',
					alreadySubscribed: true
				});
			}

			// Already exists but not confirmed — resend confirmation
			const newToken = crypto.randomUUID();
			const { error: updateError } = await supabaseAdmin
				.from('nureine_subscribers')
				.update({
					confirmation_token: newToken,
					tier: subscriberTier,
					lat: lat ?? null,
					lng: lng ?? null,
					region: region ?? null,
					region_code: region_code ?? null
				})
				.eq('id', existing.id);

			if (updateError) {
				console.error('Supabase update error:', updateError);
				return json({ error: 'Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut.' }, { status: 500 });
			}

			await sendConfirmationEmail(email.toLowerCase().trim(), newToken);

			return json({
				message: 'Eine neue Bestätigungs-E-Mail wurde gesendet. Bitte überprüfe dein Postfach.'
			});
		}

		// 3. Insert new subscriber
		const confirmationToken = crypto.randomUUID();
		const now = new Date().toISOString();

		const { error: insertError } = await supabaseAdmin
			.from('nureine_subscribers')
			.insert({
				email: email.toLowerCase().trim(),
				tier: subscriberTier,
				confirmed: false,
				confirmation_token: confirmationToken,
				lat: lat ?? null,
				lng: lng ?? null,
				region: region ?? null,
				region_code: region_code ?? null,
				created_at: now
			});

		if (insertError) {
			// Handle unique constraint violation (race condition)
			if (insertError.code === '23505') {
				return json({
					message: 'Du bist bereits für den Newsletter angemeldet.',
					alreadySubscribed: true
				});
			}

			console.error('Supabase insert error:', insertError);
			return json({ error: 'Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut.' }, { status: 500 });
		}

		// 4. Send confirmation email
		try {
			await sendConfirmationEmail(email.toLowerCase().trim(), confirmationToken);
		} catch (emailError) {
			console.error('Failed to send confirmation email:', emailError);
			// Don't fail the request — the subscriber record exists; they can request a new confirmation
			return json({
				message: 'Deine Anmeldung wurde registriert, aber die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut oder kontaktiere uns.',
				emailFailed: true
			}, { status: 500 });
		}

		// 5. Return success
		return json({
			message: 'Fast geschafft! Bitte überprüfe dein E-Mail-Postfach und bestätige deine Anmeldung mit dem Link in unserer E-Mail.'
		});
	} catch (error) {
		console.error('Subscribe error:', error);
		return json({ error: 'Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut.' }, { status: 500 });
	}
}
