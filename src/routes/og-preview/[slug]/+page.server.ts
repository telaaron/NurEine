import { getAllStories, getStoryBySlug } from '$lib/server/queries';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	let story = await getStoryBySlug(slug);

	if (!story) {
		const allStories = await getAllStories();
		story = allStories.find((s) => s.slug.startsWith(slug) || slug.startsWith(s.slug));
	}

	if (!story) {
		throw error(404, 'Story not found');
	}

	// Extract OG image URLs from the og_image_srcset metadata
	// Falls back to og_image_url if srcset metadata is not available
	const ogImageSrcset = story.ogImageSrcset || {
		jpg_1x: story.ogImageUrl,
		jpg_2x: null,
		png_1x: null,
		png_2x: null,
		webp_1x: null,
		webp_2x: null,
		avif_1x: null,
		avif_2x: null
	};

	const og = {
		'1x': {
			jpg: ogImageSrcset.jpg_1x || story.ogImageUrl,
			png: ogImageSrcset.png_1x,
			webp: ogImageSrcset.webp_1x,
			avif: ogImageSrcset.avif_1x
		},
		'2x': {
			jpg: ogImageSrcset.jpg_2x,
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
