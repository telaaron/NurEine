import { getMapMarkers } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  // Light markers only — the map renders ~700 dots + a sidebar card, none of which
  // need full story bodies or the ~25 unused StoryResult fields.
  const markers = await getMapMarkers();
  const stories = markers.map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  return { stories };
}
