import { error } from '@sveltejs/kit';
import { getStoryById } from '$lib/server/queries';

export async function load({ params }) {
  const story = await getStoryById(params.id);
  if (!story) {
    throw error(404, 'Story nicht gefunden');
  }
  return { story };
}
