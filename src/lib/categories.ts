/**
 * Single source of truth for NurEine story categories.
 * Mirrors the DB CHECK constraint on nureine_stories.category.
 */
export const CATEGORIES = [
	{ slug: 'klima', label: 'Klima', emoji: '🌍' },
	{ slug: 'gesundheit', label: 'Gesundheit', emoji: '🩺' },
	{ slug: 'wissenschaft', label: 'Wissenschaft', emoji: '🔬' },
	{ slug: 'gemeinschaft', label: 'Gemeinschaft', emoji: '🤝' },
	{ slug: 'tiere', label: 'Tiere', emoji: '🦋' },
	{ slug: 'kultur', label: 'Kultur', emoji: '🎭' },
	{ slug: 'innovation', label: 'Innovation', emoji: '💡' }
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

export function isValidCategory(slug: string): boolean {
	return CATEGORY_SLUGS.includes(slug);
}

export function categoryLabel(slug: string): string {
	return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
