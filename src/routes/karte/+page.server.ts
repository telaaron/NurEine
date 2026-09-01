import { getMapMarkers, getWorldMetrics } from '$lib/server/queries';
import { categoryTrends } from '$lib/world-index';

export const prerender = false;

// Welt-Teilindizes für die "Puls der Welt"-Trendzeile. Eigene Kategorien-Ebene
// (Weltdaten), UNABHÄNGIG von den 4 Story-Farbtönen. Reihenfolge = Anzeige.
const TREND_CATEGORIES = ['ueberleben', 'planet', 'wissen', 'frieden'] as const;

export async function load() {
  // Light markers only — the map renders ~700 dots + a sidebar card, none of which
  // need full story bodies or the ~25 unused StoryResult fields.
  const [markers, metrics] = await Promise.all([getMapMarkers(), getWorldMetrics()]);

  const stories = markers.map((s) => ({
    ...s,
    coords: [s.coordsX, s.coordsY] as [number, number]
  }));

  // Aus den ECHTEN World-Bank-Metriken je Kategorie einen normalisierten,
  // richtungsbewussten Teilindex-Trend bilden (steigt = Welt wird besser).
  const trends = categoryTrends(metrics, [...TREND_CATEGORIES]);

  return { stories, trends };
}
