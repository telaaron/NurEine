import { getLocalMarkers } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  // The page only renders local (geo-tagged) stories as StoryCards — light markers
  // carry every field the card reads, at a fraction of the full-story payload.
  const local = await getLocalMarkers();
  const localWithCoords = local.map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  return { local: localWithCoords };
}
