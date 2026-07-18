import { getDailyMainStories, getStoryById } from '$lib/server/queries';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Reader per Datum (YYYY-MM-DD) — die Tages-Ausgabe eines bestimmten Tages.
// getDailyMainStories liefert je Tag die stärkste Story (nur Listen-Spalten),
// deshalb per ID nachladen für die vollen Ritual-Felder (body, shareHook, kid_*).
export const load: PageServerLoad = async ({ params }) => {
	const datum = params.datum;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw error(404, 'Kein gültiges Datum.');

	// Genug Tage zurück, damit das gewünschte Datum enthalten ist.
	const daysBack = Math.max(7, Math.ceil((Date.now() - Date.parse(datum)) / 86400000) + 1);
	const days = await getDailyMainStories(Math.min(daysBack, 400));
	const match = days.find((d) => d.day === datum);
	if (!match) throw error(404, 'Für diesen Tag gibt es keine Ausgabe.');

	const story = await getStoryById(match.story.id);
	if (!story) throw error(404, 'Diese Ausgabe gibt es nicht mehr.');
	return { story, datum };
};
