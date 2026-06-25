import { getStoryList } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  const allStories = await getStoryList();
  const stories = allStories.map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  return { stories };
}
