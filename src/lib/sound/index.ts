// Öffentliche Klang-API von NurEine.
//
// Aufteilung:
//   engine.ts  — die Stimmen (Web-Audio-Synthese, tief)
//   index.ts   — die Gesten (was ein Nutzer erlebt: "Zahl läuft hoch")
//
// Call-Sites importieren NUR von hier. So bleibt die Synthese austauschbar,
// ohne dass 20 Komponenten angefasst werden müssen.

export {
	setSoundEnabled,
	isSoundEnabled,
	haptic,
	whoosh,
	thud,
	chime,
	tick,
	stampSound,
	livePulse,
	countTick,
	countLand,
	PENTATONIC
} from './engine';

import { countTick, countLand } from './engine';

export { soundPrefs } from './prefs.svelte';

/**
 * Klang-Begleitung für eine hochlaufende Zahl.
 *
 * Gibt eine Funktion zurück, die die Zähl-Animation pro Frame mit ihrem
 * Fortschritt (0..1) füttert. Intern wird auf ~12 hörbare Ticks ausgedünnt —
 * 60 Ticks/s wären ein Dauerton, 3 wirkten zufällig.
 *
 * Verwendung mit dem bestehenden animate() aus app-v2/motion.ts:
 *
 *   const sfx = countUpSound();
 *   animate(1100, (p) => { shown = Math.round(ziel * easeOut(p)); sfx(p); }, sfx.done);
 */
export function countUpSound(steps = 12): ((progress: number) => void) & { done: () => void } {
	let last = -1;
	const fn = (progress: number) => {
		const idx = Math.floor(Math.max(0, Math.min(1, progress)) * steps);
		if (idx === last) return;
		last = idx;
		// Der letzte Schritt gehört countLand() — sonst doppelt es sich.
		if (idx < steps) countTick(progress);
	};
	fn.done = () => countLand();
	return fn;
}
