import { getAllStories } from '$lib/server/queries';

export async function load() {
  return { stories: await getAllStories() };
}
