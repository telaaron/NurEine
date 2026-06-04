import { json } from '@sveltejs/kit';
import { sendTestNewsletter, renderTestNewsletterHtml } from '$lib/server/queries';
import { verifyAdminRequest } from '$lib/server/auth';

// GET /api/newsletter/test?email=...  → renders the email HTML (no send).
// Admin-only preview so you can eyeball the real template before sending.
export async function GET({ url, cookies }) {
  if (!verifyAdminRequest(cookies)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const email = (url.searchParams.get('email') || 'preview@nureine.de').trim();
  const rendered = await renderTestNewsletterHtml(email);
  if (!rendered) return new Response('No story to render', { status: 404 });
  return new Response(rendered.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// POST /api/newsletter/test
// Admin-only: sends a test newsletter to a specified email address.
// Requires a valid admin session cookie.

export async function POST({ request, cookies }) {
  if (!verifyAdminRequest(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Bitte gib eine gültige E-Mail-Adresse an.' }, { status: 400 });
  }

  const result = await sendTestNewsletter(email);

  return json(result);
}
