import { error } from '@sveltejs/kit';
import { getMarkersByCategory } from '$lib/server/queries';

export const prerender = false;

const VALID = ['klima', 'gesundheit', 'wissenschaft', 'gemeinschaft', 'tiere', 'kultur', 'innovation'];

const LABELS: Record<string, string> = {
	klima: 'Klima',
	gesundheit: 'Gesundheit',
	wissenschaft: 'Wissenschaft',
	gemeinschaft: 'Gemeinschaft',
	tiere: 'Tiere',
	kultur: 'Kultur',
	innovation: 'Innovation'
};

const INTROS: Record<string, string> = {
	klima: 'Wo der Planet aufatmet — belegte Fortschritte für Klima und Umwelt.',
	gesundheit: 'Durchbrüche, die Leben verbessern — von Medizin bis öffentliche Gesundheit.',
	wissenschaft: 'Echte Erkenntnisse, kein Hype — Forschung, die etwas bewegt.',
	gemeinschaft: 'Menschen, die zusammen Probleme lösen. Leise, aber wirksam.',
	tiere: 'Wo Arten zurückkommen und Lebensräume geschützt werden.',
	kultur: 'Bildung, Gesellschaft, Wandel — Fortschritt jenseits der Technik.',
	innovation: 'Technik, die der Welt nützt — nicht nur dem nächsten Quartal.'
};

export async function load({ params }) {
	const cat = params.kategorie.toLowerCase();
	if (!VALID.includes(cat)) throw error(404, 'Kategorie nicht gefunden');

	// Category is stored lowercase in the DB and matches the slug 1:1, so we filter
	// server-side on the indexed column — ~100 rows instead of all 700 + a JS filter.
	const stories = await getMarkersByCategory(cat);

	return {
		kategorie: cat,
		label: LABELS[cat],
		intro: INTROS[cat],
		stories
	};
}
