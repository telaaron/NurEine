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
