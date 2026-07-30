import type * as L from 'leaflet';

/**
 * Ego-zentrierte Karten-Bausteine für /bei-dir: der eigene Standort als
 * pulsierender Punkt plus konzentrische Distanzringe.
 *
 * Bewusst getrennt von glow-marker.ts: das dort sind Story-Marker (viele,
 * gleichrangig), hier ist es der eine Bezugspunkt, um den sich alles ordnet.
 * Beide lesen `window.L`, das die Seite nach dem dynamischen Import setzt.
 */

/** Ringe in km — die Sprünge, in denen „nah" für Menschen umschlägt. */
export const DISTANCE_RINGS = [50, 200, 1000] as const;

export function createUserMarker(
	lat: number,
	lng: number,
	mapInstance: L.Map,
	label: string
): L.Marker | undefined {
	const L = (window as any).L;
	if (!L || !mapInstance) return undefined;

	const icon = L.divIcon({
		className: 'user-location-marker',
		html: '<div class="user-dot-pulse"><div class="user-dot-core"></div></div>',
		iconSize: [24, 24],
		iconAnchor: [12, 12]
	});

	const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapInstance);
	marker.bindTooltip(
		`<span style="font-weight:600;">Dein Standort</span><br><span style="opacity:0.7;font-size:11px;">${label}</span>`,
		{ direction: 'top', offset: [0, -16], className: 'user-tooltip' }
	);
	return marker;
}

/**
 * Zeichnet die Distanzringe um den Standort. Gibt die Layer zurück, damit die
 * Seite sie beim Ortswechsel wieder entfernen kann.
 *
 * Der Radius ist in Metern (L.circle rechnet metrisch, nicht in Pixeln) — die
 * Ringe skalieren also beim Zoomen korrekt mit der echten Geografie mit.
 */
export function createDistanceRings(
	lat: number,
	lng: number,
	mapInstance: L.Map,
	ringsKm: readonly number[] = DISTANCE_RINGS
): L.Circle[] {
	const L = (window as any).L;
	if (!L || !mapInstance) return [];

	// Leaflet schreibt `color` in das SVG-Attribut `stroke` — dort löst ein
	// var(--…) NICHT auf. Token einmal auslesen und den echten Wert übergeben.
	const amber =
		getComputedStyle(document.documentElement).getPropertyValue('--color-amber').trim() || '#c87340';

	return ringsKm.map((km, i) => {
		const circle = L.circle([lat, lng], {
			radius: km * 1000,
			color: amber,
			weight: 1,
			// Äußere Ringe blasser: der Blick soll zuerst am nächsten Ring hängen.
			opacity: 0.32 - i * 0.08,
			fill: false,
			dashArray: '3 7',
			interactive: false,
			className: 'distance-ring'
		});
		circle.addTo(mapInstance);
		circle.bringToBack?.();
		return circle;
	});
}
