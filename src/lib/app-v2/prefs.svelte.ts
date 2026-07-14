// Lokale App-Präferenzen (v1: alles localStorage, KEIN Schema-Touch — Aarons Vorgabe).
// Svelte-5-Runes-Store, client-seitig. SSR-sicher (Guards auf window/localStorage).

import { setSoundEnabled } from './audio';

const LS_KEY = 'nureine.app.prefs.v1';

type Prefs = {
	sound: boolean; // Klang opt-in (v1-Default: aus)
	theme: 'system' | 'light' | 'dark';
};

const DEFAULTS: Prefs = { sound: false, theme: 'system' };

function load(): Prefs {
	if (typeof localStorage === 'undefined') return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return { ...DEFAULTS };
		return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
	} catch {
		return { ...DEFAULTS };
	}
}

class PrefsStore {
	sound = $state(false);
	theme = $state<'system' | 'light' | 'dark'>('system');
	private hydrated = false;

	/** Aus localStorage laden (im onMount des Layouts aufrufen). */
	hydrate(): void {
		if (this.hydrated) return;
		const p = load();
		this.sound = p.sound;
		this.theme = p.theme;
		this.hydrated = true;
		setSoundEnabled(p.sound);
	}

	private persist(): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(LS_KEY, JSON.stringify({ sound: this.sound, theme: this.theme }));
		} catch {
			// Speicher voll / privat — Präferenz bleibt nur für die Session.
		}
	}

	setSound(on: boolean): void {
		this.sound = on;
		setSoundEnabled(on);
		this.persist();
	}

	toggleSound(): void {
		this.setSound(!this.sound);
	}

	setTheme(t: 'system' | 'light' | 'dark'): void {
		this.theme = t;
		this.persist();
	}
}

export const prefs = new PrefsStore();
