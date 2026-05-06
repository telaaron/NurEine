import { getAllStories } from '$lib/server/queries';

export async function load() {
  const stories = await getAllStories();
  const categoryCount: Record<string, number> = {};
  for (const s of stories) {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
  }
  return { totalStories: stories.length, categories: categoryCount };
}
