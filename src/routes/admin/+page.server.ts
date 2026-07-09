import { getAllStories, getSubscriberStats, getLatestFeatured, getB2BDashboardStats, getDeliveryLog, getFunnelStats, getStats } from '$lib/server/queries';
import { supabaseAdmin } from '$lib/server/supabase/client';

export async function load() {
  const [stories, storyStats, subscribers, heroStory, b2bStats, deliveryLog, funnel, openCuration] = await Promise.all([
    getAllStories(),
    getStats(), // echter exact-count (stories.length ist auf 1000 gedeckelt)
    getSubscriberStats(),
    getLatestFeatured(),
    getB2BDashboardStats(),
    getDeliveryLog(5), // last 5 entries for HUD preview
    getFunnelStats(),
    // Offene Hero-Vorschläge (noch nicht entschieden) für den Impact-Teaser.
    supabaseAdmin
      .from('nureine_curation_queue')
      .select('for_date', { count: 'exact' })
      .eq('channel', 'hero')
      .eq('status', 'proposed')
  ]);

  const categoryCount: Record<string, number> = {};
  for (const s of stories) {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
  }

  return {
    totalStories: storyStats.storiesCount,
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
    } : null,
    pendingCuration: openCuration.count ?? 0
  };
}
