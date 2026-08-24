import type * as L from 'leaflet';
import { toneColors } from '$lib/tone-constants';

interface StoryLike {
	slug: string;
	title: string;
	country?: string;
	impactScore?: number;
	tone?: string;
	coordsX?: number;
	coordsY?: number;
	coords?: [number, number];
}

// A crisper, "premium" marker: solid tone core + soft halo, radius by impact.
// Reads theme colors live so it works in light & dark. No new dependency.
export function createGlowMarker(
	story: StoryLike,
	mapInstance: L.Map,
	onClick: (slug: string) => void
): L.CircleMarker | undefined {
	const L = (window as any).L;
	if (!L || !mapInstance) return undefined;

	const lat = story.coordsX ?? story.coords?.[0] ?? 50;
	const lng = story.coordsY ?? story.coords?.[1] ?? 10;
	const impact = story.impactScore ?? 50;
	const radius = Math.max(4, Math.min(11, 4.5 + impact / 18));
	const fill = toneColors[story.tone ?? 'amber'] ?? '#c87340';

	const marker = L.circleMarker([lat, lng], {
		radius,
		color: '#ffffff',
		fillColor: fill,
		fillOpacity: 0.92,
		weight: 1.25,
		opacity: 0.85,
		className: 'glow-dot'
	});

	marker.bindTooltip(
		`<span style="font-weight:600;">${story.title}</span><br><span style="opacity:0.7;font-size:11px;">${story.country ?? ''} &middot; Wirkung ${impact}/100</span>`,
		{ direction: 'top', offset: [0, -radius - 4], className: 'story-tooltip' }
	);

	marker.on('click', () => onClick(story.slug));
	marker.addTo(mapInstance);
	(marker as any)._baseRadius = radius;
	return marker;
}

export function highlightGlow(marker: L.CircleMarker | undefined, active: boolean): void {
	if (!marker) return;
	const base = (marker as any)._baseRadius ?? 7;
	if (active) {
		marker.setStyle({ radius: base * 1.7, fillOpacity: 1, weight: 2.5, opacity: 1 });
		marker.bringToFront?.();
	} else {
		marker.setStyle({ radius: base, fillOpacity: 0.55, weight: 1, opacity: 0.5 });
	}
}

// --- Lebendes Zeitfenster: Zustand eines Markers steuern ---------------------

// Das SVG-<path> eines circleMarker (existiert erst nach addTo(map)).
function markerPath(marker: any): SVGElement | null {
	return (marker?._path as SVGElement) ?? null;
}

function toggleClass(marker: any, cls: string, on: boolean): void {
	const p = markerPath(marker);
	if (p) p.classList.toggle(cls, on);
}

/** Dauer-Puls für „frische" (jüngste) Geschichten an/aus. */
export function setFresh(marker: L.CircleMarker | undefined, fresh: boolean): void {
	toggleClass(marker, 'is-fresh', fresh);
}

/** Kurzes Aufblitzen beim „Erscheinen" im Zeitraffer. Räumt sich selbst auf. */
export function popMarker(marker: any): void {
	const p = markerPath(marker);
	if (!p) return;
	p.classList.remove('is-popping');
	// Reflow erzwingen, damit die Animation bei erneutem Setzen neu startet.
	void p.getBoundingClientRect();
	p.classList.add('is-popping');
	window.setTimeout(() => p.classList.remove('is-popping'), 950);
}

/**
 * Sichtbarkeit/Dämpfung eines Markers im Zeitfenster.
 *  - state 'hidden'  : noch nicht „passiert" → unsichtbar
 *  - state 'ghost'   : liegt in der Vergangenheit → schwach sichtbar
 *  - state 'active'  : im aktiven Fenster → voll sichtbar
 */
export function setTimeState(
	marker: L.CircleMarker | undefined,
	state: 'hidden' | 'ghost' | 'active'
): void {
	if (!marker) return;
	if (state === 'hidden') {
		marker.setStyle({ opacity: 0, fillOpacity: 0 });
	} else if (state === 'ghost') {
		marker.setStyle({ opacity: 0.28, fillOpacity: 0.14, weight: 1 });
	} else {
		marker.setStyle({ opacity: 0.85, fillOpacity: 0.9, weight: 1.25 });
	}
}
