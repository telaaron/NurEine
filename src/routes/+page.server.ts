import { getRecentStories, getLatestFeatured, getStats, getStoryAggregates } from '$lib/server/queries';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const prerender = false;

// NOTE: excluded from the Capacitor app build (see scripts/app-prebuild.mjs).
export async function load() {
  // The homepage shows ONE hero + 9 cards and three aggregate numbers. It used to
  // pull all 700+ rows (~1.3 MB) and serialize the whole array into the page even
  // though the template never reads it. Now: a top-N card fetch + a numeric-only
  // aggregate query, both light.
  const [recent, featured, stats, agg] = await Promise.all([
    getRecentStories(10), // hero might be among these; we filter it out below
    getLatestFeatured(),
    getStats(),
    getStoryAggregates()
  ]);

  const hero = featured || recent[0] || undefined;
  const rest = hero ? recent.filter((s) => s.slug !== hero.slug).slice(0, 9) : recent.slice(0, 9);

  const baseUrl = PUBLIC_BASE_URL || 'https://nureine.de';

  // Kept as totalImpact/storiesCount so the template's `Math.round(totalImpact /
  // storiesCount)` still yields the average impact unchanged.
  return {
    featured: hero,
    rest,
    stats: { ...stats, storiesCount: agg.count || stats.storiesCount },
    totalImpact: agg.avgImpact * (agg.count || 1),
    avgRead: agg.avgReadingMin.toFixed(1),
    baseUrl
  };
}
