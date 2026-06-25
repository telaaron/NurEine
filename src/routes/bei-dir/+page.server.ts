import { getMapMarkers } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  // Client-side Haversine ranks all stories by distance to the visitor, so all rows
  // ship — but the page only reads marker fields (coords, title, slug, impact, …),
  // never bodies or summaries. Light markers cover it.
  const stories = await getMapMarkers();
  return { stories };
}
