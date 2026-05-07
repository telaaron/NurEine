import { getAllStories, getSubscriberStats, getLatestFeatured } from '$lib/server/queries';

export async function load() {
  const stories = await getAllStories();
  const subscribers = await getSubscriberStats();
  const heroStory = await getLatestFeatured();

  const categoryCount: Record<string, number> = {};
  for (const s of stories) {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
  }

  return {
    totalStories: stories.length,
    categories: categoryCount,
    subscribers,
    heroStory: heroStory ? {
      title: heroStory.title,
      slug: heroStory.slug,
      impactScore: heroStory.impactScore,
      category: heroStory.category
    } : null
  };
}
