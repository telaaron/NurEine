import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase/client';
import { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

const BASE_URL = PUBLIC_BASE_URL || 'https://nureine.de';

// 1x1 pixel PNG data URIs — Gmail never inverts actual images, making this bulletproof against dark mode
const PNG_CANVAS = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+vEVAAWvAtF1qGwPAAAAAElFTkSuQmCC';
const PNG_CARD   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP49e0dAAXMAt9NjFIKAAAAAElFTkSuQmCC';
const PNG_WHITE  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC';
const PNG_INK    = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkhAFAACXAEiRX1b9AAAAAElFTkSuQmCC';

// GET /api/confirm?token=xxx
// 1. Look up subscriber by confirmation_token
// 2. Set confirmed=true, clear confirmation_token
// 3. Send welcome email via Brevo
// 4. Redirect to /newsletter?confirmed=true

function buildWelcomeEmail(name: string | null, email: string): string {
	const greeting = name ? name.split(' ')[0] : 'Freund:in';
	const displayName = name || email;

	return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"/><!--<![endif]--></head>
<body style="margin:0;padding:0;background:#f5f1ea url('${PNG_CANVAS}');-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" class="nur-eine-bg">
<style type="text/css">
:root{color-scheme:light;supported-color-schemes:light;}
[data-ogsc] .nur-eine-bg,[data-ogsb] .nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
[data-ogsc] .nur-eine-card,[data-ogsb] .nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
[data-ogsc] .nur-eine-box,[data-ogsb] .nur-eine-box{background:#fff url('${PNG_WHITE}')!important;}
[data-ogsc] .nur-eine-cta,[data-ogsb] .nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
[data-ogsc] .nur-eine-text-primary,[data-ogsb] .nur-eine-text-primary{color:#1a1815!important;}
[data-ogsc] .nur-eine-text-body,[data-ogsb] .nur-eine-text-body{color:#3a342c!important;}
[data-ogsc] .nur-eine-text-faint,[data-ogsb] .nur-eine-text-faint{color:#9a9087!important;}
[data-ogsc] .nur-eine-text-sitefooter,[data-ogsb] .nur-eine-text-sitefooter{color:#b0a79e!important;}
[data-ogsc] .nur-eine-link,[data-ogsb] .nur-eine-link{color:#c87340!important;}
@media (prefers-color-scheme:dark){
.nur-eine-bg{background:#f5f1ea url('${PNG_CANVAS}')!important;}
.nur-eine-card{background:#faf6ee url('${PNG_CARD}')!important;}
.nur-eine-box{background:#fff url('${PNG_WHITE}')!important;}
.nur-eine-cta{background:#1a1815 url('${PNG_INK}')!important;}
.nur-eine-text-primary{color:#1a1815!important;}
.nur-eine-text-body{color:#3a342c!important;}
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
Willkommen bei NurEine,<br/>${displayName}!
</h2>

<p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;" class="nur-eine-text-body">
Hallo ${greeting},
</p>
<p style="margin:0 0 24px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;" class="nur-eine-text-body">
deine Anmeldung ist best&auml;tigt &mdash; ab sofort bekommst du jeden Morgen eine gute Nachricht von uns. Kein doomscrolling, kein Clickbait, kein L&auml;rm. Nur eine Geschichte, die wirklich Hoffnung macht.
</p>

<!-- Eckdaten Box -->
<div style="background:#ffffff url('${PNG_WHITE}');border-radius:8px;border:1px solid rgba(26,24,21,0.08);padding:24px;margin:24px 0;" class="nur-eine-box">
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#1a1815;" class="nur-eine-text-primary">Deine Eckdaten</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a342c;line-height:1.7;">
<tr><td style="padding:6px 0;" class="nur-eine-text-body"><strong style="font-weight:600;color:#1a1815;" class="nur-eine-text-primary">E-Mail:</strong> ${email}</td></tr>
<tr><td style="padding:6px 0;" class="nur-eine-text-body"><strong style="font-weight:600;color:#1a1815;" class="nur-eine-text-primary">Status:</strong> Aktiv (kostenlos)</td></tr>
<tr><td style="padding:6px 0;" class="nur-eine-text-body"><strong style="font-weight:600;color:#1a1815;" class="nur-eine-text-primary">Rhythmus:</strong> T&auml;glich um 06:30 Uhr</td></tr>
</table>
</div>

<h2 style="margin:28px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#1a1815;" class="nur-eine-text-primary">So l&auml;uft es ab</h2>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a342c;line-height:1.8;">
<tr><td style="padding:6px 0;" class="nur-eine-text-body"><strong style="font-weight:600;color:#1a1815;" class="nur-eine-text-primary">1. Jeden Morgen um 06:30 Uhr</strong> &mdash; Eine neue Geschichte erscheint auf <a href="${BASE_URL}" style="color:#c87340;" class="nur-eine-link">nureine.de</a>.</td></tr>
<tr><td style="padding:6px 0;" class="nur-eine-text-body"><strong style="font-weight:600;color:#1a1815;" class="nur-eine-text-primary">2. Newsletter im Postfach</strong> &mdash; Zur gleichen Zeit bekommst du die Geschichte direkt in dein E-Mail-Postfach.</td></tr>
<tr><td style="padding:6px 0;" class="nur-eine-text-body"><strong style="font-weight:600;color:#1a1815;" class="nur-eine-text-primary">3. Kein Spam</strong> &mdash; Wir schicken wirklich nur eine E-Mail pro Tag. Mehr nicht.</td></tr>
</table>

<h2 style="margin:28px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#1a1815;" class="nur-eine-text-primary">Fragen?</h2>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a342c;line-height:1.7;" class="nur-eine-text-body">
Antworte einfach auf diese Mail &mdash; Aaron ist pers&ouml;nlich f&uuml;r dich da.
</p>

</td></tr>

<!-- CTA -->
<tr><td style="padding:0 40px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="background:#1a1815 url('${PNG_INK}');border-radius:9999px;text-align:center;" class="nur-eine-cta">
<a href="${BASE_URL}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Zu NurEine &rarr;</a>
</td></tr></table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/></td></tr>

<!-- Footer -->
<tr><td style="padding:22px 40px 30px;">
<p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;" class="nur-eine-text-faint">
NurEine &mdash; Eine Geschichte am Tag. Mehr nicht.<br/>
Teltow, Brandenburg. Gegr&uuml;ndet 2026.<br/>
<a href="mailto:${BREVO_FROM_EMAIL}" style="color:#9a9087;" class="nur-eine-text-faint">${BREVO_FROM_EMAIL}</a>
</p>
</td></tr>

</table>

<!-- Site footer -->
<p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;" class="nur-eine-text-sitefooter">
NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.
</p>

</td></tr></table></body></html>`;
}

async function sendWelcomeEmail(recipientEmail: string, name: string | null): Promise<void> {
	const html = buildWelcomeEmail(name, recipientEmail);

	const response = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'api-key': BREVO_API_KEY,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: JSON.stringify({
			sender: { name: BREVO_FROM_NAME || 'NurEine', email: BREVO_FROM_EMAIL },
			to: [{ email: recipientEmail }],
			subject: 'Willkommen bei NurEine! Deine Anmeldung ist bestätigt.',
			htmlContent: html
		})
	});

	if (!response.ok) {
		const errorBody = await response.text();
		console.error('Brevo welcome email error:', response.status, errorBody);
		throw new Error('Fehler beim Senden der Willkommens-E-Mail');
	}
}

export async function GET({ url }) {
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(303, '/newsletter?error=missing_token');
	}

	// 1. Look up subscriber by confirmation_token
	const { data: subscriber, error: lookupError } = await supabaseAdmin
		.from('nureine_subscribers')
		.select('id, email, name, confirmed')
		.eq('confirmation_token', token)
		.maybeSingle();

	if (lookupError) {
		console.error('Supabase lookup error:', lookupError);
		throw redirect(303, '/newsletter?error=server_error');
	}

	if (!subscriber) {
		throw redirect(303, '/newsletter?error=invalid_token');
	}

	if (subscriber.confirmed) {
		// Already confirmed — send welcome again just in case
		try {
			await sendWelcomeEmail(subscriber.email, subscriber.name);
		} catch (e) {
			console.error('Failed to resend welcome email:', e);
		}
		throw redirect(303, '/newsletter?confirmed=true');
	}

	// 2. Set confirmed=true, clear confirmation_token
	const { error: updateError } = await supabaseAdmin
		.from('nureine_subscribers')
		.update({
			confirmed: true,
			confirmation_token: null
		})
		.eq('id', subscriber.id);

	if (updateError) {
		console.error('Supabase update error:', updateError);
		throw redirect(303, '/newsletter?error=server_error');
	}

	// 3. Send welcome email (fire-and-forget, don't block the redirect)
	try {
		await sendWelcomeEmail(subscriber.email, subscriber.name);
	} catch (e) {
		console.error('Failed to send welcome email:', e);
		// Still redirect with success — the subscription is confirmed
	}

	// 4. Redirect to /newsletter?confirmed=true
	throw redirect(303, '/newsletter?confirmed=true');
}
