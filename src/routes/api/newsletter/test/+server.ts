import { json } from '@sveltejs/kit';
import { sendTestNewsletter } from '$lib/server/queries';

// POST /api/newsletter/test
// Admin-only: sends a test newsletter to a specified email address.
// Requires admin_token cookie.

export async function POST({ request, cookies }) {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
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
