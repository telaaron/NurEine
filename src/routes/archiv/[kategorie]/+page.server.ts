import { error } from '@sveltejs/kit';
import { getStoryList } from '$lib/server/queries';

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

	const all = await getStoryList();
	const stories = all
		.filter((s) => s.category.toLowerCase() === cat)
		.map((s) => ({ ...s, coords: [s.coordsX, s.coordsY] as [number, number] }));

	return {
		kategorie: cat,
		label: LABELS[cat],
		intro: INTROS[cat],
		stories
	};
}
