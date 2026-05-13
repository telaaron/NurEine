import { supabaseAdmin } from '$lib/server/supabase/client';

// GET /api/unsubscribe?token=xxx&email=yyy
// 1. Look up subscriber by email (and optionally verify token)
// 2. Delete the subscriber or set confirmed=false
// 3. Return a simple HTML page saying "Du wurdest erfolgreich abgemeldet."

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
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background-color: #faf6ee;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(26,24,21,0.08);
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 {
      font-family: 'Fraunces', 'Georgia', serif;
      font-size: 24px;
      font-weight: 600;
      color: #1a1815;
      margin-bottom: 12px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4a4845;
      margin-bottom: 24px;
    }
    a {
      display: inline-block;
      background-color: ${accentColor};
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    a:hover { opacity: 0.9; }
    .footer {
      margin-top: 32px;
      font-size: 13px;
      color: #9a9895;
    }
    .footer a { all: revert; background: none; color: #e67e22; padding: 0; font-size: 13px; text-decoration: underline; display: inline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/newsletter">Zur\u00fcck zum Newsletter</a>
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

	// 3. Delete the subscriber
	const { error: deleteError } = await supabaseAdmin
		.from('nureine_subscribers')
		.delete()
		.eq('id', subscriber.id);

	if (deleteError) {
		console.error('Supabase delete error:', deleteError);
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
