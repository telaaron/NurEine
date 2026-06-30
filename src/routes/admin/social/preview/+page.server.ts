import { selectInstagramStory, selectWeeklyDigestStories, getStoryBySlug } from '$lib/server/queries';
import { slidePlanForWeekday } from '$lib/server/social/schedule';
import { digestSlideCount } from '$lib/server/og/digest';
import { reelTypeForHook } from '$lib/server/og/reel-frames';

/**
 * Dev-Preview für das Social-System (Idee #1/#6/#9/#10). Zeigt alle Carousel-
 * Folien + den Wochen-Digest als BILDER — postet NICHTS. Reine Sichtprüfung,
 * bevor irgendwas live geht.
 *
 * ?slug=… überschreibt die Test-Story (Default: heutige IG-Auswahl).
 */
export async function load({ url }) {
	const slugParam = url.searchParams.get('slug');
	const story = slugParam ? await getStoryBySlug(slugParam) : await selectInstagramStory();

	const weekday = new Date().getUTCDay();
	const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	const plan = story ? slidePlanForWeekday(weekday, story.igHookType) : null;

	// Digest: wie viele Folien hat er diese Woche?
	const digestStories = await selectWeeklyDigestStories(5);
	const digestCount = digestStories.length >= 3 ? digestSlideCount(digestStories.length) : 0;

	return {
		story: story
			? {
					slug: story.slug,
					title: story.title,
					hookType: story.igHookType,
					igOk: story.igOk,
					hasSlides: !!story.slides,
					impactScore: story.impactScore,
					shareHook: story.shareHook,
					reelType: reelTypeForHook(story.igHookType)
				}
			: null,
		weekdayName: dayNames[weekday],
		plan, // { kinds, label } — die heutige Carousel-Form
		// Alle verfügbaren Einzel-Stile zum Durchsehen (nicht nur die heutigen).
		allKinds: ['hook', 'aufloesung', 'stille', 'beleg', 'methodik', 'endcard'],
		digestCount,
		digestStoryTitles: digestStories.map((s) => s.title)
	};
}
