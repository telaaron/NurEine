/**
 * Geo-Helfer für /bei-dir: Distanzrechnung, Ortsauflösung, Ortssuche.
 *
 * Bewusst frei von Svelte-State — die Seite hält den State, hier steht nur
 * Logik, die sich einzeln nachvollziehen (und notfalls testen) lässt.
 */

export interface GeoPlace {
	lat: number;
	lng: number;
	city: string;
	region: string;
	countryCode: string;
}

export type GeoSource = 'gps' | 'ip' | 'manual';

/** Entfernung in km zwischen zwei Punkten (Haversine). */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Stories ohne echte Koordinate landen in der DB auf ~50/10 (Mitte Deutschland).
 * Die würden sonst als „ganz nah" ganz oben stehen und die Liste vergiften.
 */
export function isDefaultCoord(lat: number, lng: number): boolean {
	return Math.abs(lat - 50) < 1 && Math.abs(lng - 10) < 1;
}

/** Entfernung so schreiben, wie Menschen sie sagen. */
export function formatDistance(km: number): string {
	if (km < 1) return 'weniger als 1 km';
	if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
	if (km < 1000) return `${Math.round(km)} km`;
	return `${(km / 1000).toFixed(1).replace('.', ',')} Tsd. km`;
}

/**
 * Distanz-Bänder — das Rückgrat des Radars. Jedes Band bekommt in der Liste
 * eine eigene Überschrift, damit „Nähe" als Struktur sichtbar wird statt nur
 * als Zahl im Badge.
 */
export interface DistanceBand {
	key: string;
	label: string;
	blurb: string;
	maxKm: number;
}

export const DISTANCE_BANDS: DistanceBand[] = [
	{ key: 'vor-ort', label: 'Vor deiner Haustür', blurb: 'bis 50 km', maxKm: 50 },
	{ key: 'region', label: 'In deiner Region', blurb: '50 – 200 km', maxKm: 200 },
	{ key: 'land', label: 'Ein paar Stunden entfernt', blurb: '200 – 1.000 km', maxKm: 1000 },
	{ key: 'ferne', label: 'Weiter weg, trotzdem deins', blurb: 'über 1.000 km', maxKm: Infinity }
];

export function bandForDistance(km: number): DistanceBand {
	return DISTANCE_BANDS.find((b) => km <= b.maxKm) ?? DISTANCE_BANDS[DISTANCE_BANDS.length - 1];
}

/** Ort aus Koordinaten (Nominatim Reverse). Wirft nicht — liefert bei Fehlern Leerfelder. */
export async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoPlace>> {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=de`
		);
		if (!res.ok) return {};
		const addr = await res.json();
		const a = addr.address ?? {};
		return {
			city: a.city || a.town || a.village || a.municipality || a.county || '',
			region: a.state || a.region || '',
			countryCode: (a.country_code || '').toUpperCase()
		};
	} catch {
		return {};
	}
}

export interface PlaceSuggestion extends GeoPlace {
	displayName: string;
}

/** Ortssuche (Nominatim Forward) für den „anderen Ort ansehen"-Modus. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
	const q = query.trim();
	if (q.length < 3) return [];
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&accept-language=de`,
			{ signal }
		);
		if (!res.ok) return [];
		const rows = (await res.json()) as any[];
		return rows.map((r) => {
			const a = r.address ?? {};
			return {
				lat: Number(r.lat),
				lng: Number(r.lon),
				city: a.city || a.town || a.village || a.municipality || a.county || r.name || '',
				region: a.state || a.region || '',
				countryCode: (a.country_code || '').toUpperCase(),
				displayName: r.display_name as string
			};
		});
	} catch {
		return [];
	}
}

/** „Teltow, Brandenburg" — leere Teile fallen raus. */
export function placeLabel(place: Pick<GeoPlace, 'city' | 'region'>): string {
	return [place.city, place.region].filter(Boolean).join(', ');
}
