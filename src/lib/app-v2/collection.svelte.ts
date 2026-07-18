// Die stille Sammlung (Konzept B) — jede gelesene Ausgabe wird ein Licht im Himmel.
// v1: komplett lokal (localStorage, KEIN Schema-Touch — Aarons Vorgabe).
// Gentler-Streak-Philosophie: NICHTS verfällt je, kein Verlust möglich, kein Streak-Bruch.
// Endowed Progress: der Himmel startet nie leer — historische Lichter sind schon da.

import type { StoryResult } from '$lib/server/queries';

const LS_KEY = 'nureine.app.collection.v1';

export type LightKind = 'story' | 'curve';

export type Light = {
	id: string; // Story-ID oder synthetischer Key
	title: string;
	category: string;
	kind: LightKind;
	readAt: string; // ISO-Zeitstempel (wann gelesen)
	day: string; // YYYY-MM-DD der Ausgabe (Frische-Anker)
	gifted?: boolean; // geschenktes Licht (Weltgeschichte, Endowed Progress)
};

// Drei geschenkte Lichter der Weltgeschichte — der Himmel war nie leer.
// (Identisch zum Onboarding-Prototyp Exp 3, Beat 5.)
const GIFTED: Light[] = [
	{ id: 'gift-pocken', title: 'Pocken ausgerottet', category: 'gesundheit', kind: 'curve', readAt: '', day: '1980-05-08', gifted: true },
	{ id: 'gift-ozon', title: 'Ozonloch schrumpft', category: 'klima', kind: 'curve', readAt: '', day: '1987-09-16', gifted: true },
	{ id: 'gift-kinder', title: 'Kindersterblichkeit halbiert', category: 'gesundheit', kind: 'curve', readAt: '', day: '1990-01-01', gifted: true }
];

function loadRaw(): Light[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as Light[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

class Collection {
	// Nur die selbst gesammelten Lichter (ohne die geschenkten).
	lights = $state<Light[]>([]);
	private hydrated = false;

	hydrate(): void {
		if (this.hydrated) return;
		this.lights = loadRaw();
		this.hydrated = true;
	}

	private persist(): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(LS_KEY, JSON.stringify(this.lights));
		} catch {
			// Speicher voll/privat — Sammlung bleibt für die Session.
		}
	}

	/** Alle Lichter inkl. der geschenkten (für die Anzeige im Himmel). */
	get all(): Light[] {
		return [...GIFTED, ...this.lights];
	}

	/** Gesamtzahl (geschenkt + gesammelt) — die Zahl im Himmel. */
	get total(): number {
		return GIFTED.length + this.lights.length;
	}

	/** Nur selbst gesammelt (ohne Geschenk). */
	get earned(): number {
		return this.lights.length;
	}

	/** Datum des ersten selbst gesammelten Lichts (für „seit …"). */
	get since(): string | null {
		if (this.lights.length === 0) return null;
		const first = this.lights.reduce((a, b) => (a.readAt < b.readAt ? a : b));
		return first.day;
	}

	has(storyId: string): boolean {
		return this.lights.some((l) => l.id === storyId);
	}

	/** Eine gelesene Ausgabe zur Sammlung hinzufügen. Idempotent (kein Doppel-Licht). */
	add(story: Pick<StoryResult, 'id' | 'title' | 'category'>, kind: LightKind, nowIso: string, day: string): boolean {
		this.hydrate();
		if (this.has(story.id)) return false; // schon gesammelt
		this.lights = [
			...this.lights,
			{ id: story.id, title: story.title, category: story.category, kind, readAt: nowIso, day }
		];
		this.persist();
		return true; // neu → Licht fliegt in den Himmel
	}
}

export const collection = new Collection();
