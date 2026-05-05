import { getAllStories } from '$lib/server/queries';

export function load() {
  return { stories: getAllStories() };
}
