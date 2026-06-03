import { supabaseAdmin } from '$lib/server/supabase/client';

// GET /api/unsubscribe?token=xxx&email=yyy
// 1. Look up subscriber by email and verify token
// 2. Soft-unsubscribe: set confirmed=false, clear confirmation_token
//    (cannot hard-delete — FK constraint from nureine_newsletter_sends)
// 3. Return a simple HTML page

export async function GET({ url }) {
	const email = url.searchParams.get('email');
	const token = url.searchParams.get('token');

	// Build simple HTML response helper
	function htmlResponse(title: string, message: string, isError: boolean = false): Response {
		const accentColor = isError ? '#c0392b' : '#e67e22';
		const icon = isError ? '\u26A0\uFE0F' : '\u2705';

		return new Response(
			`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} &mdash; NurEine</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #f5f1ea;
      font-family: Georgia, 'Times New Roman', serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background-color: #faf6ee;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(26,24,21,0.04);
      border: 1px solid rgba(26,24,21,0.10);
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: 400;
      color: #1a1815;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    p {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: #3a342c;
      margin-bottom: 24px;
    }
    a.button {
      display: inline-block;
      background-color: #1a1815;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 9999px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    a.button:hover { opacity: 0.9; }
    .footer {
      margin-top: 32px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #9a9087;
    }
    .footer a {
      all: revert;
      background: none;
      color: #c87340;
      padding: 0;
      font-size: 12px;
      text-decoration: none;
      display: inline;
      border-bottom: 1px solid rgba(200,115,64,0.3);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="button" href="/newsletter">Zur\u00fcck zum Newsletter</a>
    <p class="footer"><a href="/">NurEine &mdash; Startseite</a></p>
  </div>
</body>
</html>`,
			{
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			}
		);
	}

	if (!email) {
		return htmlResponse(
			'Fehlende Angaben',
			'Es wurde keine E-Mail-Adresse \u00fcbermittelt. Bitte verwende den Abmeldelink aus dem Newsletter.',
			true
		);
	}

	// 1. Look up subscriber by email
	const { data: subscriber, error: lookupError } = await supabaseAdmin
		.from('nureine_subscribers')
		.select('id, email, confirmation_token')
		.eq('email', email.toLowerCase().trim())
		.maybeSingle();

	if (lookupError) {
		console.error('Supabase lookup error:', lookupError);
		return htmlResponse(
			'Fehler',
			'Es ist ein technischer Fehler aufgetreten. Bitte versuche es sp\u00e4ter erneut.',
			true
		);
	}

	if (!subscriber) {
		return htmlResponse(
			'Nicht gefunden',
			'Diese E-Mail-Adresse ist in unserem System nicht als Abonnent registriert.',
			true
		);
	}

	// 2. Verify token matches the subscriber's confirmation_token
	// Prevents unauthorized unsubscribes (anyone could unsubscribe any email otherwise)
	if (!token || token !== subscriber.confirmation_token) {
		return htmlResponse(
			'Abmeldung verweigert',
			'Der Abmeldelink ist ung\u00fcltig oder abgelaufen. Bitte verwende den Abmeldelink aus dem Newsletter.',
			true
		);
	}

	// 3. Soft-unsubscribe: set confirmed=false, clear token.
	//    Hard-delete is blocked by FK constraint from nureine_newsletter_sends.
	const { error: updateError } = await supabaseAdmin
		.from('nureine_subscribers')
		.update({
			confirmed: false,
			confirmation_token: null
		})
		.eq('id', subscriber.id);

	if (updateError) {
		console.error('Supabase update error:', updateError);
		return htmlResponse(
			'Fehler',
			'Es ist ein technischer Fehler aufgetreten. Bitte versuche es sp\u00e4ter erneut.',
			true
		);
	}

	// 4. Return success HTML page
	return htmlResponse(
		'Erfolgreich abgemeldet',
		'Du wurdest erfolgreich vom NurEine-Newsletter abgemeldet. Wir freuen uns, wenn du sp\u00e4ter wieder vorbeischaust!'
	);
}
