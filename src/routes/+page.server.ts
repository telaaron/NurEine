import { getDailyMainStories, getLatestFeatured, getStats, getStoryAggregates } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

// NOTE: excluded from the Capacitor app build (see scripts/app-prebuild.mjs).
export async function load() {
  // Homepage: EIN Hero + darunter die MAIN-Story je Tag der letzten Woche
  // (nicht mehr die 10 neuesten — die enthielten irrelevante Stories, Aaron
  // 2026-07-09) + drei Aggregat-Zahlen.
  const [daily, featured, stats, agg] = await Promise.all([
    getDailyMainStories(8),
    getLatestFeatured(),
    getStats(),
    getStoryAggregates()
  ]);

  const hero = featured || daily[0]?.story || undefined;
  // Tages-Perlen ohne die Hero-Story, jede mit ihrem Datum.
  const days = hero ? daily.filter((d) => d.story.slug !== hero.slug) : daily;

  const baseUrl = PUBLIC_BASE_URL || 'https://nureine.de';

  return {
    featured: hero,
    days,
    stats: { ...stats, storiesCount: agg.count || stats.storiesCount },
    totalImpact: agg.avgImpact * (agg.count || 1),
    avgRead: agg.avgReadingMin.toFixed(1),
    baseUrl
  };
}
