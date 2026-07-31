import type * as L from 'leaflet';

/**
 * Der Kartenhintergrund für /karte und /bei-dir — an EINER Stelle, damit beide
 * Seiten dieselbe Karte zeigen.
 *
 * Warum zwei Layer statt eines fertigen Tiles:
 * Die `_nolabels`-Tiles blenden ALLE Ortsnamen aus. Übrig bleiben Flüsse und
 * Küsten — hübsch, aber man erkennt nicht, wo man ist. Die Variante mit Labels
 * im Basis-Tile (`dark_all`) löst das, dann liegen die Story-Marker aber ÜBER
 * den Namen und verdecken ausgerechnet die großen Städte, an denen die Punkte
 * kleben.
 *
 * Darum: neutrale Basis + separates Label-Overlay, das NACH den Markern in den
 * markerPane gehängt wird. Ortsnamen bleiben oben und lesbar, die Marker
 * behalten ihre Fläche.
 */

const BASE = {
	dark: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
	light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
} as const;

const LABELS = {
	dark: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
	light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png'
} as const;

export function prefersDark(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Basis-Kacheln. Direkt nach dem Anlegen der Karte aufrufen. */
export function addBaseTiles(mapInstance: L.Map, dark = prefersDark()): void {
	const L = (window as any).L;
	if (!L || !mapInstance) return;
	L.tileLayer(dark ? BASE.dark : BASE.light, { maxZoom: 19 }).addTo(mapInstance);
}

/**
 * Ortsnamen als eigene Ebene über der Basis.
 *
 * Bewusst im normalen tilePane (kein eigener Pane): Leaflets Zoom-Animation und
 * das Aufräumen alter Kacheln hängen am tile-container des tilePane. In einem
 * selbstgebauten Pane lud der Layer die höhere Zoomstufe nicht nach — die
 * z6-Kacheln blieben liegen und wurden achtfach hochskaliert: ein riesiges,
 * unscharfes „BERLIN" quer über der Karte.
 *
 * Damit die Namen trotzdem über den Story-Punkten stehen, hebt
 * leaflet-shared.css den Container dieses Layers per `.label-overlay` an.
 */
export function addLabelTiles(mapInstance: L.Map, dark = prefersDark()): L.TileLayer | undefined {
	const L = (window as any).L;
	if (!L || !mapInstance) return undefined;

	return L.tileLayer(dark ? LABELS.dark : LABELS.light, {
		maxZoom: 19,
		zIndex: 650, // über dem overlayPane, in dem die circleMarker liegen
		interactive: false,
		className: 'label-overlay'
	}).addTo(mapInstance);
}
