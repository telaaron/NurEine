import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import crypto from 'node:crypto';

// POST /api/subscribe
// Body: { email: string, name?: string, tier?: 'free' | 'b2b', lat?: number, lng?: number, region?: string, region_code?: string }
//
// 1. Validate email format
// 2. Check if email already exists in subscribers table
// 3. If not, insert with confirmed=false, confirmation_token=crypto.randomUUID()
// 4. Send confirmation email via Brevo API
// 5. Return success

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

// 1x1 pixel PNG data URIs — Gmail never inverts actual images, making this bulletproof against dark mode
const PNG_CANVAS = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+vEVAAWvAtF1qGwPAAAAAElFTkSuQmCC';
const PNG_CARD   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP49e0dAAXMAt9NjFIKAAAAAElFTkSuQmCC';
const PNG_INK    = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkhAFAACXAEiRX1b9AAAAAElFTkSuQmCC';

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildConfirmationEmailHtml(token: string): string {
	const confirmUrl = `${BASE_URL}/api/confirm?token=${token}`;

	return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"/><!--<![endif]--></head>
<body style="margin:0;padding:0;background:#f5f1ea url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" class="nur-eine-bg">
<style type="text/css">
:root{color-scheme:light;supported-color-schemes:light;}
[data-ogsc] .nur-eine-bg,[data-ogsb] .nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
[data-ogsc] .nur-eine-card,[data-ogsb] .nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
[data-ogsc] .nur-eine-cta,[data-ogsb] .nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
[data-ogsc] .nur-eine-text-primary,[data-ogsb] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsc] .nur-eine-text-body,[data-ogsb] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsc] .nur-eine-text-muted,[data-ogsb] .nur-eine-text-muted{color:#6b6359!important;}
[data-ogsc] .nur-eine-text-faint,[data-ogsb] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsc] .nur-eine-text-sitefooter,[data-ogsb] .nur-eine-text-sitefooter{color:#b0a79e!important;}
[data-ogsc] .nur-eine-link,[data-ogsb] .nur-eine-link{color:#c87340!important;}
@media (prefers-color-scheme:dark){
.nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
.nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
.nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
.nur-eine-text-primary{color:#1a1815!important;}
.nur-eine-text-body{color:#3a342c!important;}
.nur-eine-text-muted{color:#6b6359!important;}
.nur-eine-text-faint{color:#9a9087!important;}
.nur-eine-text-sitefooter{color:#b0a79e!important;}
.nur-eine-link{color:#c87340!important;}
}
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f1ea" style="background:#f5f1ea url('${PNG_CANVAS}');" class="nur-eine-bg">
<tr><td align="center" style="padding:40px 16px 32px;">

<!-- Brand header -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;" class="nur-eine-text-primary">NurEine</td></tr>
<tr><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;" class="nur-eine-text-faint">Eine Geschichte am Tag. Mehr nicht.</td></tr>
</table>

<!-- Main card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf6ee url('${PNG_CARD}');border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);" class="nur-eine-card">

<!-- Body -->
<tr><td style="padding:36px 40px 28px;">

<h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;" class="nur-eine-text-primary">
Fast geschafft!
</h2>

<p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;" class="nur-eine-text-body">
Danke f&uuml;r deine Anmeldung zum NurEine-Newsletter. Wir freuen uns, dass du dabei bist!
</p>

<p style="margin:0 0 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;" class="nur-eine-text-body">
Bitte best&auml;tige deine E-Mail-Adresse, damit wir dir ab sofort gute Nachrichten schicken k&ouml;nnen.
</p>

<!-- CTA Button -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
<tr>
<td style="background:#1a1815 url('${PNG_INK}');border-radius:9999px;text-align:center;" class="nur-eine-cta">
<a href="${confirmUrl}" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">E-Mail best&auml;tigen &rarr;</a>
</td>
</tr>
</table>

<!-- Fallback link -->
<p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6b6359;" class="nur-eine-text-muted">
Falls der Button nicht funktioniert, kopiere bitte diesen Link in deinen Browser:
</p>
<p style="margin:0 0 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6359;word-break:break-all;background-color:#f5f1ea;padding:12px 16px;border-radius:6px;border:1px solid rgba(26,24,21,0.08);" class="nur-eine-text-muted">
<a href="${confirmUrl}" style="color:#c87340;text-decoration:none;border-bottom:1px solid rgba(200,115,64,0.3);" class="nur-eine-link">${confirmUrl}</a>
</p>

</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/></td></tr>

<!-- Footer -->
<tr><td style="padding:22px 40px 30px;">
<p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;" class="nur-eine-text-faint">
Du hast dich nicht angemeldet? Ignoriere einfach diese E-Mail. Deine Adresse wird automatisch gel&ouml;scht, falls du nicht best&auml;tigst.
</p>
</td></tr>
</table>

<!-- Site footer -->
<p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;" class="nur-eine-text-sitefooter">
NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.
</p>

</td></tr></table></body></html>`;
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
		const { email, name, tier, lat, lng, region, region_code } = await request.json();

		// 1. Validate email format
		if (!email || typeof email !== 'string') {
			return json({ error: 'Bitte gib eine E-Mail-Adresse ein.' }, { status: 400 });
		}

		if (!isValidEmail(email)) {
			return json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, { status: 400 });
		}

		// Validate tier if provided — B2C is always free
		const validTiers = ['free', 'b2b'];
		const subscriberTier = tier && validTiers.includes(tier) ? tier : 'free';

		// Sanitize name
		const subscriberName = name && typeof name === 'string' ? name.trim().slice(0, 100) || null : null;

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
					name: subscriberName,
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
