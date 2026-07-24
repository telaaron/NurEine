<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors, toneLabels } from '$lib/tone-constants';
	import { createGlowMarker, highlightGlow } from '$lib/map/glow-marker';
	import GlobeHero from '$lib/map/GlobeHero.svelte';

	let { stories = [] }: { stories?: any[] } = $props();
	const storyCount = $derived(stories.length);

	let activeSlug = $state<string | null>(null);
	let mapContainer = $state<HTMLDivElement | null>(null);
	const activeStory = $derived(activeSlug ? stories.find((s) => s.slug === activeSlug) ?? null : null);

	let map: any = null;
	let markerBySlug = new Map<string, any>();
	let _init = false;
	let mapReady = $state(false);

	const globePoints = $derived(
		stories.map((s) => ({ lat: s.coordsX, lng: s.coordsY, tone: s.tone }))
	);

	$effect(() => {
		const el = mapContainer;
		if (!browser || !el || _init) return;
		_init = true;
		import('leaflet').then((L) => {
			if (!mapContainer) return;
			const m = L.map(el, { center: [30, 5], zoom: 2, zoomControl: true, scrollWheelZoom: true, attributionControl: false, worldCopyJump: true });
			(window as any).L = L;
			// Theme-aware tiles: dark basemap in dark scheme, light voyager otherwise.
			const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const url = dark
				? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
				: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';
			L.tileLayer(url, { maxZoom: 19 }).addTo(m);
			for (const s of stories) {
				const mk = createGlowMarker(s, m, (slug) => (activeSlug = slug));
				if (mk) markerBySlug.set(s.slug, mk);
			}
			requestAnimationFrame(() => m.invalidateSize());
			map = m;
			mapReady = true;
		});
		return () => { map?.remove(); map = null; markerBySlug.clear(); _init = false; mapReady = false; };
	});

	$effect(() => {
		const slug = activeSlug;
		if (!map || !slug) return;
		const mk = markerBySlug.get(slug);
		if (!mk) return;
		highlightGlow(mk, true);
		for (const [o, om] of markerBySlug) if (o !== slug) highlightGlow(om, false);
		map.flyTo(mk.getLatLng(), Math.max(map.getZoom(), 4), { duration: 0.7 });
		return () => { for (const s of stories) { const m2 = markerBySlug.get(s.slug); if (m2) highlightGlow(m2, false); } };
	});
</script>

<section class="planetarium">
	<!-- HERO -->
	<div class="hero">
		<div class="hero-globe">
			{#if browser}<GlobeHero points={globePoints} height={320} />{/if}
		</div>
		<div class="hero-text">
			<p class="eyebrow" style="color: var(--color-amber);">Karte der Hoffnung</p>
			<h1 class="display hero-title">Wo auf der Welt<br />Gutes passiert.</h1>
			<p class="hero-dek">
				{storyCount} Geschichten, verteilt über den ganzen Planeten. Dreh den Globus,
				zoom in die Karte, klick auf ein Licht.
			</p>
			<div class="legend">
				{#each Object.entries(toneColors) as [key, color]}
					<span class="legend-item"><span class="dot" style="background:{color}"></span>{toneLabels[key] ?? key}</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- MAP -->
	<div class="map-wrap">
		<div class="map-frame" bind:this={mapContainer}>
			{#if !mapReady}
				<div class="loading"><div class="spinner"></div><span>Karte wird geladen…</span></div>
			{/if}
		</div>

		<!-- Floating glass card -->
		{#if activeStory}
			{@const hex = toneColors[activeStory.tone] ?? '#c87340'}
			<div class="glass-card" style="--accent:{hex}">
				<button class="close" onclick={() => (activeSlug = null)} aria-label="Schließen">×</button>
				<div class="gc-top">
					<span class="gc-badge">{activeStory.category}</span>
					<span class="gc-country">{activeStory.country}</span>
				</div>
				<h2 class="gc-title display">{activeStory.title}</h2>
				<p class="gc-dek">{activeStory.dek}</p>
				<div class="gc-meta">
					<span class="gc-impact">{activeStory.impactScore}/100 Wirkung</span>
					<span>· {activeStory.readingMinutes} Min.</span>
				</div>
				<a class="gc-btn" href={base + '/geschichte/' + activeStory.slug}>Geschichte lesen →</a>
			</div>
		{:else}
			<div class="hint">Klick auf ein Licht auf der Karte</div>
		{/if}
	</div>
</section>

<style>
	.planetarium { max-width: 1400px; margin: 0 auto; padding: 1rem 1rem 4rem; }
	@media (min-width: 1024px) { .planetarium { padding: 1.5rem 2.5rem 5rem; } }

	.hero { display: grid; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
	@media (min-width: 900px) { .hero { grid-template-columns: 340px 1fr; gap: 2.5rem; } }
	.hero-globe { display: flex; justify-content: center; }
	.hero-title { color: var(--color-ink); font-weight: 600; line-height: 1.05; font-size: clamp(1.8rem, 4vw, 3.4rem); margin-top: 0.5rem; }
	.hero-dek { color: var(--color-ink-soft); font-family: var(--font-serif); font-size: 1.05rem; line-height: 1.6; margin-top: 1rem; max-width: 44ch; }
	.legend { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 1.25rem; font-size: 0.8rem; color: var(--color-muted); }
	.legend-item { display: inline-flex; align-items: center; gap: 0.4rem; }
	.dot { width: 0.65rem; height: 0.65rem; border-radius: 999px; }

	.map-wrap { position: relative; }
	.map-frame { position: relative; width: 100%; height: 68vh; min-height: 420px; border-radius: 14px; overflow: hidden; border: 1px solid var(--color-rule); box-shadow: 0 20px 60px -30px rgba(0,0,0,0.5); }
	.loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--color-canvas); z-index: 10; color: var(--color-muted); font-size: 0.9rem; }
	.spinner { width: 1.75rem; height: 1.75rem; border: 2px solid var(--color-rule); border-top-color: var(--color-amber); border-radius: 999px; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	.glass-card {
		position: absolute; z-index: 500; bottom: 1.25rem; left: 1.25rem; width: min(380px, calc(100% - 2.5rem));
		padding: 1.4rem 1.5rem 1.5rem; border-radius: 14px; overflow: hidden;
		background: color-mix(in srgb, var(--color-paper) 82%, transparent);
		backdrop-filter: blur(16px) saturate(1.3); -webkit-backdrop-filter: blur(16px) saturate(1.3);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--color-rule));
		box-shadow: 0 24px 60px -24px rgba(0,0,0,0.55);
		animation: cardin 0.35s cubic-bezier(0.2,0.7,0.2,1) both;
	}
	@keyframes cardin { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
	.glass-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); }
	.close { position: absolute; top: 0.6rem; right: 0.75rem; border: none; background: none; font-size: 1.5rem; line-height: 1; color: var(--color-muted); cursor: pointer; }
	.gc-top { display: flex; align-items: center; gap: 0.6rem; font-size: 0.72rem; }
	.gc-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 600; background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
	.gc-country { color: var(--color-muted); }
	.gc-title { margin-top: 0.75rem; color: var(--color-ink); font-weight: 600; font-size: 1.3rem; line-height: 1.25; }
	.gc-dek { margin-top: 0.6rem; color: var(--color-ink-soft); font-family: var(--font-serif); line-height: 1.55; font-size: 0.95rem; }
	.gc-meta { margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center; font-size: 0.75rem; color: var(--color-muted); }
	.gc-impact { color: var(--accent); font-weight: 600; }
	.gc-btn { margin-top: 1rem; display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 0.65rem 1rem; border-radius: 999px; font-size: 0.88rem; background: var(--color-surface-ink); color: var(--color-on-ink); text-decoration: none; transition: transform 0.15s; }
	.gc-btn:hover { transform: translateY(-1px); }

	.hint { position: absolute; z-index: 500; bottom: 1.25rem; left: 50%; transform: translateX(-50%); padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.8rem; color: var(--color-muted); background: color-mix(in srgb, var(--color-paper) 75%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--color-rule); pointer-events: none; }
	@media (max-width: 640px) { .glass-card { left: 0.75rem; right: 0.75rem; width: auto; bottom: 0.75rem; } }
</style>
