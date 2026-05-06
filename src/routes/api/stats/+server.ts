import { json } from '@sveltejs/kit';
import { getStats } from '$lib/server/queries';

export async function GET() {
  return json(await getStats());
}
