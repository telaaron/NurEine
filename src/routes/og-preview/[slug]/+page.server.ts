import { getStoryBySlug } from '$lib/server/queries';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	const story = await getStoryBySlug(slug);

	if (!story) {
		error(404, 'Story not found');
	}

	// Extract OG image URLs from the og_image_srcset metadata
	// Falls back to og_image_url if srcset metadata is not available
	const ogImageSrcset = story.og_image_srcset || {
		png_1x: story.og_image_url,
		png_2x: null,
		webp_1x: null,
		webp_2x: null,
		avif_1x: null,
		avif_2x: null
	};

	const og = {
		'1x': {
			png: ogImageSrcset.png_1x || story.og_image_url,
			webp: ogImageSrcset.webp_1x,
			avif: ogImageSrcset.avif_1x
		},
		'2x': {
			png: ogImageSrcset.png_2x,
			webp: ogImageSrcset.webp_2x,
			avif: ogImageSrcset.avif_2x
		}
	};

	return {
		story,
		og
	};
};
