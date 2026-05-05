import { getAllStories, getLatestFeatured, getStats } from '$lib/server/queries';

export const prerender = true;

export function load() {
  const allStories = getAllStories();
  const featured = getLatestFeatured() || allStories[0];
  const stats = getStats();
  const rest = allStories.filter((s) => s.slug !== featured.slug).slice(0, 9);

  const totalImpact = allStories.reduce((sum, s) => sum + s.impactScore, 0);
  const avgRead = (allStories.reduce((sum, s) => sum + s.readingMinutes, 0) / allStories.length).toFixed(1);

  return { stories: allStories, featured, rest, stats, totalImpact, avgRead };
}
