import { getAllStories, getLocalStories } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  const [allStories, local] = await Promise.all([
    getAllStories(),
    getLocalStories()
  ]);
  const localWithCoords = local.map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  return { stories: allStories, local: localWithCoords };
}
