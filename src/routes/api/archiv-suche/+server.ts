import { json } from '@sveltejs/kit';
import { searchStorySlugs } from '$lib/server/queries';

/**
 * GET /api/archiv-suche?q=begriff
 *
 * Liefert die Slugs aller Treffer. /archiv blendet damit seine bereits geladenen
 * Karten ein/aus — es muessen keine Story-Daten uebertragen werden.
 *
 * Existiert, damit /archiv die Summaries nicht mehr ausliefern muss: die waren
 * 626 KB von 1,45 MB, wurden nirgends angezeigt und dienten allein der Suche.
 */
export async function GET({ url, setHeaders }) {
  const q = (url.searchParams.get('q') ?? '').slice(0, 120);
  if (!q.trim()) return json({ slugs: [] });

  const slugs = await searchStorySlugs(q);

  // Gleiche Suchbegriffe liefern fuer eine Weile dasselbe — der Bestand aendert
  // sich nur ein paar Mal am Tag.
  setHeaders({ 'Cache-Control': 'public, max-age=300' });
  return json({ slugs });
}
