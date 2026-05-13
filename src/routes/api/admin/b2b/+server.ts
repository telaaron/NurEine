import { json } from '@sveltejs/kit';
import { createB2BClient } from '$lib/server/queries';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = await createB2BClient(body);
    return json({ id });
  } catch (err) {
    return json({ error: String(err) }, { status: 500 });
  }
};
