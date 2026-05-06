import { getAllStories, getLatestFeatured, getStats } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  const [allStories, featured, stats] = await Promise.all([
    getAllStories(),
    getLatestFeatured(),
    getStats()
  ]);
  const hero = featured || allStories[0] || undefined;
  const rest = hero ? allStories.filter((s) => s.slug !== hero.slug).slice(0, 9) : [];

  const totalImpact = allStories.reduce((sum, s) => sum + s.impactScore, 0);
  const avgRead = (allStories.reduce((sum, s) => sum + s.readingMinutes, 0) / allStories.length).toFixed(1);

  return { stories: allStories, featured: hero, rest, stats, totalImpact, avgRead };
}
