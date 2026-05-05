import { getAllStories, getLocalStories } from '$lib/server/queries';

export const prerender = true;

export function load() {
  const allStories = getAllStories();
  const local = getLocalStories().map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  return { stories: allStories, local };
}
