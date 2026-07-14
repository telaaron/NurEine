// Motion-Helfer für die NurEine-App (Phase 3).
// Die Beweis-Schicht der Marke lebt hier: Zahlen rasten ein, Kurven laufen, Stempel schlagen.
//
// WARUM setInterval statt requestAnimationFrame:
// In gedrosselten/Hintergrund-Tabs (und auf Low-Power-Geräten) feuert rAF unzuverlässig —
// Animationen "frieren ein". `animate()` nutzt setInterval + performance.now und ist robust.
// (In der Verifikations-Umgebung der Prototypen war genau das der Grund; siehe Handover §8.)

export type FrameFn = (progress: number) => void;
export type DoneFn = () => void;

/** Läuft `dur` ms lang, ruft `onFrame(p)` mit p∈[0,1], dann optional `onDone()`. */
export function animate(dur: number, onFrame: FrameFn, onDone?: DoneFn): () => void {
	let raf = 0;
	let iv: ReturnType<typeof setInterval> | null = null;
	const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	let cancelled = false;

	onFrame(0);

	iv = setInterval(() => {
		if (cancelled) return;
		const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
		const p = Math.min(1, (now - start) / dur);
		onFrame(p);
		if (p >= 1) {
			if (iv) clearInterval(iv);
			iv = null;
			if (onDone) onDone();
		}
	}, 1000 / 60);

	return () => {
		cancelled = true;
		if (iv) clearInterval(iv);
		if (raf) cancelAnimationFrame(raf);
	};
}

/** Ease-out (Grad `power`), z. B. für den Kurven-Lauf (Closure im Stillstand). */
export function easeOut(p: number, power = 2): number {
	return 1 - Math.pow(1 - p, power);
}

/** „Einrasten"-Kurve: leichtes Overshoot (Marken-Verb 1). */
export function snap(p: number): number {
	// cubic-bezier-artiges Overshoot, endet exakt auf 1
	const c = 1.70158;
	return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}

/** Respektiert die Barrierefreiheits-Präferenz. */
export function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** Deutsche Zahl mit tabellarischen Nachkommastellen (Vertrauensregel: Bild präzise). */
export function formatDeNumber(value: number, digits = 0): string {
	return value.toLocaleString('de-DE', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}
