import { getAllStories, getSubscriberStats, getLatestFeatured, getB2BDashboardStats, getDeliveryLog, getFunnelStats } from '$lib/server/queries';

export async function load() {
  const [stories, subscribers, heroStory, b2bStats, deliveryLog, funnel] = await Promise.all([
    getAllStories(),
    getSubscriberStats(),
    getLatestFeatured(),
    getB2BDashboardStats(),
    getDeliveryLog(5), // last 5 entries for HUD preview
    getFunnelStats()
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
    funnel,
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
