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

export function createStoryMarker(
	story: StoryLike,
	mapInstance: L.Map | null,
	onClick: (slug: string) => void
): L.CircleMarker | undefined {
	const L = (window as any).L;
	if (!L || !mapInstance) return undefined;

	const lat = story.coordsX ?? story.coords?.[0] ?? 50;
	const lng = story.coordsY ?? story.coords?.[1] ?? 10;
	const impact = story.impactScore ?? 50;
	const lightness = Math.min(88, Math.max(35, 40 + impact / 2));
	const radius = Math.max(5, Math.min(14, 6 + impact / 20));

	const marker = L.circleMarker([lat, lng], {
		radius,
		color: `hsl(30, 80%, ${lightness}%)`,
		fillColor: toneColors[story.tone ?? 'amber'] ?? '#c87340',
		fillOpacity: 0.7,
		weight: 2,
		opacity: 0.9
	});

	marker.bindTooltip(
		`<span style="font-weight:600;">${story.title}</span><br><span style="opacity:0.7;font-size:11px;">${story.country ?? ''} &middot; Wirkung ${impact}/100</span>`,
		{
			direction: 'top',
			offset: [0, -radius - 4],
			className: 'story-tooltip'
		}
	);

	marker.on('click', () => {
		onClick(story.slug);
	});

	marker.addTo(mapInstance);
	return marker;
}

export function highlightMarker(
	marker: L.CircleMarker | undefined,
	active: boolean
): void {
	if (!marker) return;
	if (active) {
		marker.setStyle({
			radius: (marker.options.radius ?? 8) * 1.6,
			fillOpacity: 0.95,
			weight: 3,
			opacity: 1
		});
	} else {
		const impact = 50; // neutral reset
		const lightness = Math.min(88, Math.max(35, 40 + impact / 2));
		const radius = Math.max(5, Math.min(14, 6 + impact / 20));
		marker.setStyle({
			radius,
			fillOpacity: 0.3,
			opacity: 0.45,
			weight: 2,
			color: `hsl(30, 80%, ${lightness}%)`
		});
	}
}
