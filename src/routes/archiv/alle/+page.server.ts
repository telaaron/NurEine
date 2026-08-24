import { getStoryIndex } from '$lib/server/queries';

export const prerender = false;

/**
 * Vollstaendiges Verzeichnis aller Geschichten — der Crawl-Einstieg.
 *
 * Existiert, weil /archiv die Liste vorher inline mitgeliefert hat: alle ~1300
 * Titel steckten im HTML jeder Archiv-Ansicht (1,7 MB, ~3 s). Hier ausgelagert
 * bleibt /archiv schlank, und Crawler bekommen trotzdem JEDE Geschichte ueber
 * genau einen Klick.
 */
export async function load() {
  const stories = await getStoryIndex();
  return { stories };
}
