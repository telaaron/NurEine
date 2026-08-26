// Klang-Präferenz der WEBSITE (die App hat ihre eigene in app-v2/prefs.svelte.ts).
//
// Bewusst getrennt gehalten: die App ist eine eigene Oberfläche mit eigenem
// Onboarding und eigenem Toggle. Ein gemeinsamer Schlüssel würde bedeuten, dass
// ein „Klang an" in der App ungefragt die Website beschallt (und umgekehrt).
// Gemeinsam ist die Engine, nicht die Einwilligung.
//
// Default: AUS. Eine Nachrichten-Seite, die beim ersten Scrollen Töne macht,
// verliert Leser — Klang ist hier eine Zutat, kein Merkmal.

import { setSoundEnabled } from './engine';

const LS_KEY = 'nureine.sound.v1';

function load(): boolean {
	if (typeof localStorage === 'undefined') return false;
	try {
		return localStorage.getItem(LS_KEY) === 'on';
	} catch {
		return false;
	}
}

class SoundPrefs {
	on = $state(false);
	private hydrated = false;

	/** Aus localStorage laden. Im onMount des Layouts aufrufen (SSR hat kein localStorage). */
	hydrate(): void {
		if (this.hydrated) return;
		this.on = load();
		this.hydrated = true;
		// Engine erst hier scharf schalten — vorher gibt es keinen AudioContext.
		setSoundEnabled(this.on);
	}

	set(on: boolean): void {
		this.on = on;
		setSoundEnabled(on);
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(LS_KEY, on ? 'on' : 'off');
		} catch {
			// Privater Modus / Speicher voll — gilt dann nur für diese Sitzung.
		}
	}

	toggle(): void {
		this.set(!this.on);
	}
}

export const soundPrefs = new SoundPrefs();
