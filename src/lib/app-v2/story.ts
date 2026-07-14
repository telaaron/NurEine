// Story-Helfer für die App v2 — Ableitungen aus der StoryResult-API-Shape.

import type { StoryResult } from '$lib/server/queries';

/** Kategorie → Akzentfarbe (ein Akzent pro Screen, DNA-Regel). */
export function accentVar(category: string): string {
	switch (category) {
		case 'klima':
		case 'tiere':
			return 'var(--sage)';
		case 'gesundheit':
			return 'var(--rose)';
		case 'wissenschaft':
		case 'innovation':
			return 'var(--blue)';
		default: // gemeinschaft, kultur
			return 'var(--amber)';
	}
}

/** Bild-Proxy der Website (PNG→WebP, Größe begrenzen). */
export function proxied(url: string | null | undefined, width = 1080): string | null {
	if (!url) return null;
	return `/img?url=${encodeURIComponent(url)}&w=${width}`;
}

/** Menschlicher Wirkungs-Balken-Wert (0–100), sicher. */
export function clamp01to100(n: number | null | undefined): number {
	if (n == null || Number.isNaN(n)) return 0;
	return Math.max(0, Math.min(100, Math.round(n)));
}

/** Die drei erklärten Wirkungs-Balken (nie nackte Zahl, immer erklärt). */
export function impactBars(story: Pick<StoryResult, 'impactReach' | 'impactDurability' | 'impactEvidence'>) {
	return [
		{ label: 'Reichweite', value: clamp01to100(story.impactReach) },
		{ label: 'Dauerhaftigkeit', value: clamp01to100(story.impactDurability) },
		{ label: 'Belege', value: clamp01to100(story.impactEvidence) }
	];
}

/** Datum menschlich (z. B. „Montag, 14. Juli"). */
export function humanDate(iso: string | null | undefined): string {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	} catch {
		return '';
	}
}

/** Kurzdatum (z. B. „14. Juli"). */
export function shortDate(iso: string | null | undefined): string {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
	} catch {
		return '';
	}
}
