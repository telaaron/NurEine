<script lang="ts">
	// SVG-Pfad, der sich beim Sichtbarwerden selbst zeichnet.
	//
	// Der Klang liegt bewusst NICHT hier: auf /stand-der-welt zeichnen sich beim
	// Scrollen mehrere Kurven fast gleichzeitig — jede mit eigener Tonleiter wäre
	// Kakofonie. Hier klingt nur die große Kurve im Detail-Fenster (sound=true),
	// die immer allein steht.
	import { onMount } from 'svelte';
	import { animate, easeOut, prefersReducedMotion } from '$lib/app-v2/motion';
	import { countUpSound } from '$lib/sound';

	let {
		d,
		duration = 1400,
		sound = false,
		stroke = 'var(--color-amber)',
		width = 2,
		class: klass = ''
	}: {
		d: string;
		duration?: number;
		sound?: boolean;
		stroke?: string;
		width?: number;
		class?: string;
	} = $props();

	const reduced = prefersReducedMotion();
	let pathEl: SVGPathElement | null = $state(null);
	let len = $state(1000);
	let offset = $state(reduced ? 0 : 1);
	let ran = false;

	function run() {
		if (ran || !pathEl) return;
		ran = true;
		len = pathEl.getTotalLength() || 1000;
		if (reduced) {
			offset = 0;
			return;
		}
		const sfx = sound ? countUpSound(16) : null;
		animate(
			duration,
			(p) => {
				const e = easeOut(p, 2);
				offset = 1 - e;
				sfx?.(e);
			},
			() => {
				offset = 0;
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
			{ threshold: 0.4 }
		);
		if (pathEl) io.observe(pathEl);

		// Sicherheitsnetz wie in CountUp: ohne Container-Höhe feuert der Observer
		// nie — die Kurve bliebe unsichtbar (dashoffset = volle Länge). Eine
		// gezeichnete Kurve ist immer besser als eine leere Fläche.
		const fallback = setTimeout(run, 1200);
		return () => {
			clearTimeout(fallback);
			io.disconnect();
		};
	});
</script>

<path
	bind:this={pathEl}
	{d}
	class={klass}
	fill="none"
	{stroke}
	stroke-width={width}
	stroke-linejoin="round"
	stroke-linecap="round"
	style="stroke-dasharray: {len}; stroke-dashoffset: {len * offset};"
/>
