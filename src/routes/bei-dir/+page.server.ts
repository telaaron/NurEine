import { getAllStories } from '$lib/server/queries';

export const prerender = true;

export async function load() {
  const stories = await getAllStories();
  return { stories };
}
