import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getStoryList } from '$lib/server/queries';

export const prerender = false;

// Country pSEO hubs: keyword-targeted "gute Nachrichten aus {Land}" pages.
// Each slug maps to one or more country labels in the data (aliases unify
// dupes like USA / Vereinigte Staaten). Only countries with enough stories
// are exposed, so pages aren't thin.
const COUNTRIES: Record<string, { label: string; match: string[] }> = {
	deutschland: { label: 'Deutschland', match: ['Deutschland'] },
	usa: { label: 'den USA', match: ['USA', 'Vereinigte Staaten'] },
	grossbritannien: { label: 'Großbritannien', match: ['Vereinigtes Königreich', 'Großbritannien'] },
	australien: { label: 'Australien', match: ['Australien'] },
	china: { label: 'China', match: ['China'] },
	frankreich: { label: 'Frankreich', match: ['Frankreich'] },
	indonesien: { label: 'Indonesien', match: ['Indonesien'] },
	kongo: { label: 'der DR Kongo', match: ['Demokratische Republik Kongo'] },
	brasilien: { label: 'Brasilien', match: ['Brasilien'] },
	kanada: { label: 'Kanada', match: ['Kanada'] },
	japan: { label: 'Japan', match: ['Japan'] },
	kenia: { label: 'Kenia', match: ['Kenia'] },
	indien: { label: 'Indien', match: ['Indien'] },
	mexiko: { label: 'Mexiko', match: ['Mexiko'] }
};

export const load: PageServerLoad = async ({ params }) => {
	const conf = COUNTRIES[params.land];
	if (!conf) throw error(404, 'Land nicht gefunden');

	const all = await getStoryList();
	const stories = all
		.filter((s) => conf.match.includes(s.country))
		.sort((a, b) => b.impactScore - a.impactScore)
		.slice(0, 40);

	if (stories.length < 3) throw error(404, 'Zu wenige Geschichten');

	const others = Object.entries(COUNTRIES)
		.filter(([slug]) => slug !== params.land)
		.map(([slug, c]) => ({ slug, label: c.label }));

	return { land: params.land, label: conf.label, stories, others, total: stories.length };
};
