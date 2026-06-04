import { json } from '@sveltejs/kit';
import { verifyAdminRequest } from '$lib/server/auth';
import { createB2BClient } from '$lib/server/queries';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!verifyAdminRequest(cookies)) {
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
