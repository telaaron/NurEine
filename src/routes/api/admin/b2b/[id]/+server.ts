import { json } from '@sveltejs/kit';
import { updateB2BClient, deleteB2BClient, getB2BClientById } from '$lib/server/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const client = await getB2BClientById(params.id);
  if (!client) {
    return json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  return json(client);
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await updateB2BClient(params.id, body);
    return json({ success: true });
  } catch (err) {
    return json({ error: String(err) }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated') {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    await deleteB2BClient(params.id);
    return json({ success: true });
  } catch (err) {
    return json({ error: String(err) }, { status: 500 });
  }
};
