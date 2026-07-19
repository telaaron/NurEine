import { getWorldMetrics } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

// Screen 5 — Stand der Welt. Die Wand der Langzeit-Trends. Monatliches Update
// (bewusst nicht live). Server-load via Service-Client.
export const load: PageServerLoad = async () => {
	const metrics = await getWorldMetrics();
	return { metrics };
};
