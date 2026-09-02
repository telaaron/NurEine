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
 *
 * Kacheln: Esri „World Gray Canvas" (Base + Reference), KEYFREI. Früher Carto
 * (basemaps.cartocdn.com) — die blenden seit 2026 ohne API-Key ein „API KEY
 * REQUIRED"-Wasserzeichen ein und werden zudem abgekündigt. Esri liefert einen
 * ebenso ruhigen, edlen Grau-/Dunkel-Look und trennt Basis + Labels genauso.
 * Achtung URL-Schema: Esri nutzt /tile/{z}/{y}/{x} (y VOR x), ohne {s}/{r}.
 * Nutzung erfordert die Esri-Attribution (s. addBaseTiles).
 */

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';

const BASE = {
	dark: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
	light: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`
} as const;

const LABELS = {
	dark: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
	light: `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`
} as const;

// Esri verlangt eine Attribution für die kostenlosen Canvas-Basemaps.
const ESRI_ATTR = 'Tiles &copy; Esri';

export function prefersDark(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Basis-Kacheln. Direkt nach dem Anlegen der Karte aufrufen. */
export function addBaseTiles(mapInstance: L.Map, dark = prefersDark()): void {
	const L = (window as any).L;
	if (!L || !mapInstance) return;
	// maxNativeZoom: Esri-Canvas hat Kacheln bis z16; darüber upscalen statt 404.
	L.tileLayer(dark ? BASE.dark : BASE.light, {
		maxZoom: 19,
		maxNativeZoom: 16,
		attribution: ESRI_ATTR
	}).addTo(mapInstance);
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
		maxNativeZoom: 16,
		zIndex: 650, // über dem overlayPane, in dem die circleMarker liegen
		interactive: false,
		className: 'label-overlay'
	}).addTo(mapInstance);
}
