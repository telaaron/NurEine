import { getStoryCards } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  // Archive search/filter/sort runs client-side (instant, no round-trip), so all
  // stories must ship — but only the card + search fields, not full StoryResult.
  const stories = await getStoryCards();
  return { stories };
}
