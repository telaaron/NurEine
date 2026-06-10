/**
 * Globaler "Sensible Inhalte ungefiltert anzeigen"-Schalter.
 *
 * Login-frei: lebt in localStorage, nicht am Account. Default AUS (jugendfrei) —
 * heikle Stories sind verhüllt, bis der Nutzer hier bewusst aufdeckt. Jede
 * StoryCard liest diesen Store via revealSensitive-Prop.
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'nureine_show_sensitive';

function read(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(KEY) === 'true';
	} catch {
		return false;
	}
}

export const showSensitive = writable<boolean>(read());

showSensitive.subscribe((v) => {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, v ? 'true' : 'false');
	} catch {
		/* localStorage geblockt → in-memory reicht */
	}
});

export function toggleSensitive(): void {
	showSensitive.update((v) => !v);
}
