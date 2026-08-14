import { getAllStories } from '$lib/server/queries';

export async function load() {
  // Redaktion muss auch Stories unter dem Impact-Gate sehen/bearbeiten können.
  return { stories: await getAllStories(true) };
}
