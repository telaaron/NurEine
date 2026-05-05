import { getAllStories } from '$lib/server/queries';

export const prerender = true;

export function load() {
  const allStories = getAllStories();
  const stories = allStories.map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  return { stories };
}
