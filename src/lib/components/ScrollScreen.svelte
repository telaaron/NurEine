<script lang="ts">
	// 3D-Scroll-Kipp-Effekt für den B2B-Hero-Mock — nativ in Svelte nachgebaut
	// (Idee: 21st.dev / Aceternity "ContainerScroll", dort React+framer-motion).
	// Beim Hereinscrollen kippt die Karte aus der Perspektive nach vorn (rotateX
	// groß → 0) und skaliert leicht hoch. Kein framer-motion — reine CSS-3D +
	// Sveltes Scroll-Reaktivität. Respektiert prefers-reduced-motion.
	import { onMount } from 'svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	let wrap = $state<HTMLDivElement>();
	let progress = $state(0); // 0 = weit unten (stark gekippt), 1 = zentriert (flach)
	let reduce = $state(false);

	function update() {
		if (!wrap) return;
		const r = wrap.getBoundingClientRect();
		const vh = window.innerHeight;
		// Fortschritt: 0 wenn die Sektion gerade von unten reinkommt,
		// 1 wenn ihre Mitte die Bildschirmmitte erreicht (dann steht die Karte flach).
		const centered = r.top + r.height / 2;
		const p = 1 - (centered - vh * 0.4) / (vh * 0.7);
		progress = Math.max(0, Math.min(1, p));
	}

	onMount(() => {
		reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});

	// Ableitungen: gekippt (18°) → flach (0°); Skala 0.94 → 1; leichtes Anheben.
	const rotate = $derived(reduce ? 0 : (1 - progress) * 18);
	const scale = $derived(reduce ? 1 : 0.94 + progress * 0.06);
	const lift = $derived(reduce ? 0 : (1 - progress) * 40);
</script>

<div class="scene" bind:this={wrap}>
	<div
		class="card"
		style="transform: perspective(1200px) rotateX({rotate}deg) scale({scale}) translateY({lift}px);"
	>
		<div class="bezel">
			<div class="inner">
				{@render children()}
			</div>
		</div>
	</div>
</div>

<style>
	.scene {
		display: flex;
		justify-content: center;
		padding: 1rem 0 2rem;
	}
	.card {
		width: 100%;
		max-width: 620px;
		transform-origin: center 70%;
		will-change: transform;
		transition: transform 0.1s linear;
	}
	/* Monitor-Rahmen — hochwertiger als der alte flache Mock */
	.bezel {
		background: linear-gradient(160deg, #2a2a2d, #161618);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 16px;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			0 12px 24px rgba(0, 0, 0, 0.28),
			0 40px 60px rgba(40, 25, 15, 0.22),
			0 90px 90px rgba(0, 0, 0, 0.12);
	}
	.inner {
		border-radius: 10px;
		overflow: hidden;
		background: #faf6ee;
	}
	@media (max-width: 640px) {
		.bezel { padding: 10px; border-radius: 14px; }
	}
</style>
