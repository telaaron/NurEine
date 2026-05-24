import { json } from '@sveltejs/kit';
import { deleteSubscriber, deleteSubscribers } from '$lib/server/queries';

export async function POST({ request }) {
  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return json({ ok: false, error: 'Keine IDs angegeben.' }, { status: 400 });
  }

  let ok: boolean;
  if (ids.length === 1) {
    ok = await deleteSubscriber(ids[0]);
  } else {
    ok = await deleteSubscribers(ids);
  }

  if (!ok) {
    return json({ ok: false, error: 'Löschen fehlgeschlagen.' }, { status: 500 });
  }

  return json({ ok: true, deleted: ids.length });
}
