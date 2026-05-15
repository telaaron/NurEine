import { json } from '@sveltejs/kit';
import { getB2BClientById } from '$lib/server/queries';
import { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

function buildWelcomeEmail(client: {
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  integration_type: string;
  integration_target: string;
  mrr_value: number;
  pilot_ends_at: string | null;
}) {
  const name = client.contact_name || client.company_name;
  const greeting = name.split(' ')[0];

  const pilotDate = client.pilot_ends_at
    ? `<tr><td style="padding:6px 0;"><strong style="color:#1a1815;">Pilotphase:</strong> bis ${new Date(client.pilot_ends_at).toLocaleDateString('de-DE')}</td></tr>`
    : '';

  const price = client.status === 'pilot'
    ? `<tr><td style="padding:6px 0;"><strong style="color:#1a1815;">Nach dem Pilot:</strong> ${client.mrr_value} €/Monat (jederzeit kündbar)</td></tr>`
    : `<tr><td style="padding:6px 0;"><strong style="color:#1a1815;">Preis:</strong> ${client.mrr_value} €/Monat</td></tr>`;

  const deliveryInfo = client.integration_type === 'email'
    ? `Die tägliche Geschichte kommt als Premium-E-Mail an <strong>${client.integration_target}</strong>.`
    : client.integration_type === 'webhook'
      ? `Die tägliche Geschichte wird automatisch per Webhook an <strong>${client.integration_target}</strong> gepostet.`
      : `Die Geschichte wird in eure Website eingebettet.`;

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"/><!--<![endif]--></head>
<body style="margin:0;padding:0;background-color:#f5f1ea;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ea;">
<tr><td align="center" style="padding:40px 16px 32px;">

<!-- Brand header -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-bottom:20px;">
<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1815;text-align:center;letter-spacing:0.02em;padding-bottom:8px;">NurEine</td></tr>
<tr><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9a9087;text-align:center;">Eine Geschichte am Tag. Mehr nicht.</td></tr>
</table>

<!-- Main card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#faf6ee;border-radius:10px;overflow:hidden;border:1px solid rgba(26,24,21,0.10);box-shadow:0 1px 3px rgba(26,24,21,0.04);">

<!-- Body -->
<tr><td style="padding:36px 40px 28px;">

<h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1a1815;line-height:1.22;letter-spacing:-0.01em;">
Willkommen bei NurEine,<br/>${name}!
</h2>

<p style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;">
Hallo ${greeting},
</p>
<p style="margin:0 0 24px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a342c;">
wir freuen uns sehr, <strong style="color:#1a1815;">${client.company_name}</strong> an Bord zu haben! Ab sofort bekommt ihr jeden Tag eine positive Nachricht &mdash; kein doomscrolling, kein Clickbait, kein L&auml;rm. Nur eine Geschichte, die wirklich Hoffnung macht.
</p>

<!-- Eckdaten Box -->
<div style="background-color:#ffffff;border-radius:8px;border:1px solid rgba(26,24,21,0.08);padding:24px;margin:24px 0;">
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#1a1815;">Deine Eckdaten</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a342c;line-height:1.7;">
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">Unternehmen:</strong> ${client.company_name}</td></tr>
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">Status:</strong> ${client.status === 'pilot' ? '30-Tage-Pilot (kostenlos)' : 'Aktiver Kunde'}</td></tr>
${pilotDate}
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">Auslieferung:</strong> ${deliveryInfo}</td></tr>
${price}
</table>
</div>

<h2 style="margin:28px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#1a1815;">So l&auml;uft es ab</h2>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a342c;line-height:1.8;">
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">1. Jeden Morgen um 06:30 Uhr</strong> &mdash; Eine neue Geschichte erscheint auf <a href="${PUBLIC_BASE_URL}" style="color:#c87340;">nureine.de</a>.</td></tr>
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">2. Automatische Auslieferung</strong> &mdash; Zur gleichen Zeit bekommt ${client.company_name} die Geschichte in euren gew&auml;hlten Kanal.</td></tr>
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">3. Euer Branding</strong> &mdash; In jeder Mail steht &raquo;Gute Nachrichten &ndash; powered by ${client.company_name}&laquo;.</td></tr>
<tr><td style="padding:6px 0;"><strong style="font-weight:600;color:#1a1815;">4. Keine Arbeit f&uuml;r euch</strong> &mdash; Das System l&auml;uft vollautomatisch. Ihr m&uuml;sst nichts konfigurieren, nichts kuratieren.</td></tr>
</table>

<h2 style="margin:28px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#1a1815;">Fragen?</h2>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a342c;line-height:1.7;">
Antworte einfach auf diese Mail &mdash; Aaron ist pers&ouml;nlich f&uuml;r dich da.
</p>

</td></tr>

<!-- CTA -->
<tr><td style="padding:0 40px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="background-color:#1a1815;border-radius:9999px;text-align:center;">
<a href="${PUBLIC_BASE_URL}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#faf6ee;text-decoration:none;border-radius:9999px;">Zu NurEine &rarr;</a>
</td></tr></table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid rgba(26,24,21,0.10);margin:0;"/></td></tr>

<!-- Footer -->
<tr><td style="padding:22px 40px 30px;">
<p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9a9087;line-height:1.6;">
NurEine &mdash; Eine Geschichte am Tag. Mehr nicht.<br/>
Teltow, Brandenburg. Gegr&uuml;ndet 2026.<br/>
<a href="mailto:${BREVO_FROM_EMAIL}" style="color:#9a9087;">${BREVO_FROM_EMAIL}</a>
</p>
</td></tr>

</table>

<!-- Site footer -->
<p style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#b0a79e;">
NurEine &mdash; Teltow, Brandenburg. Gegr&uuml;ndet 2026.
</p>

</td></tr></table></body></html>`;
}

export const POST: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const client = await getB2BClientById(params.id);
  if (!client) {
    return json({ error: 'B2B-Kunde nicht gefunden' }, { status: 404 });
  }

  const recipient = client.contact_email || client.integration_target;
  if (!recipient || !recipient.includes('@')) {
    return json({
      error: 'Keine gültige E-Mail-Adresse für diesen Kunden. Bitte zuerst contact_email setzen.'
    }, { status: 400 });
  }

  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    return json({ error: 'Brevo nicht konfiguriert' }, { status: 500 });
  }

  const html = buildWelcomeEmail(client);

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
        to: [{ email: recipient }],
        subject: `Willkommen bei NurEine, ${client.company_name}!`,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return json({ error: `Brevo-Fehler: ${errText}` }, { status: 500 });
    }

    const result = await response.json();
    return json({ success: true, messageId: result.messageId, recipient });
  } catch (err) {
    return json({ error: String(err) }, { status: 500 });
  }
};
