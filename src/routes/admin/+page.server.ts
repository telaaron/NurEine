import { getAllStories, getSubscriberStats, getLatestFeatured, getB2BDashboardStats, getDeliveryLog } from '$lib/server/queries';

export async function load() {
  const [stories, subscribers, heroStory, b2bStats, deliveryLog] = await Promise.all([
    getAllStories(),
    getSubscriberStats(),
    getLatestFeatured(),
    getB2BDashboardStats(),
    getDeliveryLog(5) // last 5 entries for HUD preview
  ]);

  const categoryCount: Record<string, number> = {};
  for (const s of stories) {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
  }

  return {
    totalStories: stories.length,
    categories: categoryCount,
    subscribers,
    b2bStats,
    deliveryLog,
    heroStory: heroStory ? {
      id: heroStory.id,
      title: heroStory.title,
      slug: heroStory.slug,
      impactScore: heroStory.impactScore,
      category: heroStory.category,
      imageUrl: heroStory.imageUrl,
      dek: heroStory.dek
    } : null
  };
}
