import type { RequestHandler } from './$types';
import { getStoryBySlug } from '$lib/server/queries';
import { json } from '@sveltejs/kit';

/**
 * Liefert die Reel-Rohdaten einer Story für den Remotion-Renderer (render.mjs).
 * Reiner Lese-Endpoint, kein Auth nötig (nur öffentliche Story-Felder).
 */
export const GET: RequestHandler = async ({ params }) => {
	const story = await getStoryBySlug(params.slug);
	if (!story) return json({ error: 'not found' }, { status: 404 });

	return json({
		title: story.title,
		hook: story.slides?.hook || story.igHook || story.title,
		aufloesung: story.slides?.aufloesung || story.dek || story.summary || story.title,
		shareHook: story.shareHook || story.slides?.stille || '',
		region: story.region || story.country || null,
		category: story.category || 'gemeinschaft',
		igHookType: story.igHookType,
		image: story.image_url || story.imageUrl || null,
		// Beleg-Szene (USP: Quelle + Wirkungsindex sichtbar im Reel)
		source: story.source || null,
		impactScore: story.impactScore ?? null,
		impactEvidence: story.impactEvidence ?? null
	});
};
