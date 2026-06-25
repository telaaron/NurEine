import { getStoryList } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  const stories = await getStoryList();
  return { stories };
}
