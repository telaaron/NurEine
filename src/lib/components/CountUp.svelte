<script lang="ts">
	// Hochdrehende Zahl mit Klang-Begleitung.
	//
	// Läuft erst los, wenn die Zahl SICHTBAR wird (IntersectionObserver) — eine
	// Zahl, die weit unterhalb des Viewports still hochzählt, wäre verschenkt
	// (und der Klang käme aus dem Nichts).
	//
	// Respektiert prefers-reduced-motion: dann steht der Zielwert sofort da.
	import { onMount } from 'svelte';
	import { animate, easeOut, prefersReducedMotion } from '$lib/app-v2/motion';
	import { countUpSound } from '$lib/sound';

	let {
		value,
		format = (v: number) => String(Math.round(v)),
		duration = 1100,
		sound = true,
		class: klass = '',
		style = ''
	}: {
		value: number;
		format?: (v: number) => string;
		duration?: number;
		sound?: boolean;
		class?: string;
		style?: string;
	} = $props();

	const reduced = prefersReducedMotion();
	// Startwert bewusst nur einmal gelesen: die Zahl ist ein Animations-Ziel,
	// kein reaktiver Wert — sie ändert sich nach dem Mount nicht mehr.
	// svelte-ignore state_referenced_locally
	let shown = $state(reduced ? value : 0);
	let el: HTMLElement | null = $state(null);
	let ran = false;

	function run() {
		if (ran) return;
		ran = true;
		if (reduced) {
			shown = value;
			return;
		}
		const sfx = sound ? countUpSound() : null;
		animate(
			duration,
			(p) => {
				shown = value * easeOut(p, 2);
				sfx?.(p);
			},
			() => {
				shown = value; // exakt landen, nie bei 99,7 % stehenbleiben
				sfx?.done();
			}
		);
	}

	onMount(() => {
		if (reduced || typeof IntersectionObserver === 'undefined') {
			run();
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						run();
						io.disconnect();
					}
				}
			},
			{ threshold: 0.6 }
		);
		if (el) io.observe(el);

		// Sicherheitsnetz: In Containern ohne Höhe (Headless-Rendering, ein noch
		// eingeklapptes Panel, ein Tab im Hintergrund) meldet der Observer NIE
		// eine Sichtbarkeit — die Zahl bliebe für immer auf 0 stehen. Nach 1,2 s
		// starten wir daher ungefragt: eine sichtbare Zahl ist immer besser als
		// eine hängende Null.
		const fallback = setTimeout(run, 1200);
		return () => {
			clearTimeout(fallback);
			io.disconnect();
		};
	});
</script>

<span bind:this={el} class={klass} {style}>{format(shown)}</span>
