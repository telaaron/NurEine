import { getWorldMetric } from '$lib/server/queries';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Der Kurven-Tag (Typ 2) — eine Langzeit-Metrik als Tages-Ausgabe.
export const load: PageServerLoad = async ({ params }) => {
	const metric = await getWorldMetric(params.key);
	if (!metric || !metric.series || metric.series.length < 2) {
		throw error(404, 'Diese Kurve gibt es nicht.');
	}
	return { metric };
};
