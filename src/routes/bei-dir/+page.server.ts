import { getAllStories } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  const stories = await getAllStories();
  return { stories };
}
