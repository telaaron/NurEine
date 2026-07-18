import { getStoryById } from '$lib/server/queries';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Reader per Story-ID. Stellt den Push-Deep-Link /app/geschichte/{id} wieder her
// (native.ts + Push-Cron zeigen hierher). SSR: volle Story via getStoryById (select *).
export const load: PageServerLoad = async ({ params }) => {
	const story = await getStoryById(params.id);
	if (!story) throw error(404, 'Diese Geschichte gibt es nicht (mehr).');
	return { story };
};
