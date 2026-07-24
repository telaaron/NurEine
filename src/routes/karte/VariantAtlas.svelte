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

	const globePoints = $derived(stories.map((s) => ({ lat: s.coordsX, lng: s.coordsY, tone: s.tone })));

	$effect(() => {
		const el = mapContainer;
		if (!browser || !el || _init) return;
		_init = true;
		import('leaflet').then((L) => {
			if (!mapContainer) return;
			const m = L.map(el, { center: [40, 10], zoom: 3, zoomControl: true, scrollWheelZoom: true, attributionControl: false, worldCopyJump: true });
			(window as any).L = L;
			const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const url = dark
				? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
				: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
			L.tileLayer(url, { maxZoom: 19 }).addTo(m);
			for (const s of stories) {
				const mk = createGlowMarker(s, m, (slug) => (activeSlug = slug));
				if (mk) markerBySlug.set(s.slug, mk);
			}
			if (stories.length) {
				const g = L.featureGroup(Array.from(markerBySlug.values()));
				const b = g.getBounds();
				if (b.isValid()) m.fitBounds(b.pad(0.15), { maxZoom: 5 });
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
		map.panTo(mk.getLatLng(), { animate: true, duration: 0.5 });
		return () => { for (const s of stories) { const m2 = markerBySlug.get(s.slug); if (m2) highlightGlow(m2, false); } };
	});
</script>

<section class="atlas">
	<!-- HEADER with emblem globe -->
	<header class="head">
		<div class="head-text">
			<p class="eyebrow" style="color: var(--color-amber);">Karte der Hoffnung</p>
			<h1 class="display head-title">Wo auf der Welt Gutes passiert.</h1>
			<p class="head-dek">Ein Atlas guter Nachrichten — {storyCount} Geschichten, kartiert nach Ort und Wirkung.</p>
		</div>
		<div class="emblem">
			{#if browser}<GlobeHero points={globePoints} height={150} interactive={false} />{/if}
			<span class="emblem-label">{storyCount} Orte</span>
		</div>
	</header>

	<!-- ATLAS PLATE: map + sliding card -->
	<div class="plate">
		<div class="map-frame" bind:this={mapContainer}>
			{#if !mapReady}
				<div class="loading"><div class="spinner"></div><span>Karte wird geladen…</span></div>
			{/if}
			<!-- corner legend -->
			<div class="legend">
				{#each Object.entries(toneColors) as [key, color]}
					<span class="li"><span class="d" style="background:{color}"></span>{toneLabels[key] ?? key}</span>
				{/each}
			</div>
		</div>

		<aside class="rail" class:open={!!activeStory}>
			{#if activeStory}
				{@const hex = toneColors[activeStory.tone] ?? '#c87340'}
				<article class="card" style="--accent:{hex}">
					{#if activeStory.hero?.startsWith('http')}
						<div class="card-hero"><img src={activeStory.hero} alt="" loading="lazy" /></div>
					{:else}
						<div class="card-hero placeholder"><span>{activeStory.hero || '📰'}</span></div>
					{/if}
					<div class="card-body">
						<div class="c-top"><span class="c-badge">{activeStory.category}</span><span class="c-country">{activeStory.country}</span></div>
						<h2 class="c-title display">{activeStory.title}</h2>
						<p class="c-dek">{activeStory.dek}</p>
						<div class="c-meta"><span class="c-impact">{activeStory.impactScore}/100</span><span>Wirkung · {activeStory.readingMinutes} Min.</span></div>
						<a class="c-btn" href={base + '/geschichte/' + activeStory.slug}>Geschichte lesen →</a>
					</div>
				</article>
			{:else}
				<div class="empty">
					<div class="empty-globe">{#if browser}<GlobeHero points={globePoints} height={120} interactive={false} />{/if}</div>
					<p>Wähle einen Punkt auf der Karte, um eine Geschichte zu entdecken.</p>
					<span class="empty-count">{storyCount} Geschichten geladen</span>
				</div>
			{/if}
		</aside>
	</div>
</section>

<style>
	.atlas { max-width: 1400px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
	@media (min-width: 1024px) { .atlas { padding: 2.5rem 2.5rem 5rem; } }

	.head { display: flex; align-items: center; justify-content: space-between; gap: 2rem; margin-bottom: 1.75rem; }
	.head-title { color: var(--color-ink); font-weight: 600; line-height: 1.1; font-size: clamp(1.7rem, 3.5vw, 3rem); margin-top: 0.5rem; max-width: 16ch; }
	.head-dek { color: var(--color-ink-soft); font-family: var(--font-serif); font-size: 1.05rem; margin-top: 0.9rem; max-width: 46ch; line-height: 1.55; }
	.emblem { position: relative; flex-shrink: 0; display: none; }
	@media (min-width: 820px) { .emblem { display: block; width: 150px; } }
	.emblem-label { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); font-size: 0.7rem; color: var(--color-muted); font-family: var(--font-mono); }

	.plate { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
	@media (min-width: 1024px) { .plate { grid-template-columns: 1fr 380px; gap: 1.75rem; } }

	.map-frame { position: relative; width: 100%; height: 62vh; min-height: 400px; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-rule-strong); box-shadow: inset 0 0 0 6px color-mix(in srgb, var(--color-paper) 60%, transparent); }
	.loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--color-canvas); z-index: 10; color: var(--color-muted); font-size: 0.9rem; }
	.spinner { width: 1.75rem; height: 1.75rem; border: 2px solid var(--color-rule); border-top-color: var(--color-amber); border-radius: 999px; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.legend { position: absolute; z-index: 500; bottom: 0.9rem; left: 0.9rem; display: flex; flex-wrap: wrap; gap: 0.7rem; padding: 0.5rem 0.8rem; border-radius: 999px; background: color-mix(in srgb, var(--color-paper) 82%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--color-rule); font-size: 0.72rem; color: var(--color-muted); }
	.li { display: inline-flex; align-items: center; gap: 0.35rem; }
	.d { width: 0.6rem; height: 0.6rem; border-radius: 999px; }

	.rail { }
	.card { border-radius: 12px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--color-rule)); background: var(--color-paper); position: sticky; top: 1.5rem; animation: cardin 0.4s cubic-bezier(0.2,0.7,0.2,1) both; }
	@keyframes cardin { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
	.card-hero { aspect-ratio: 16/9; overflow: hidden; background: var(--color-canvas-soft); }
	.card-hero img { width: 100%; height: 100%; object-fit: cover; }
	.card-hero.placeholder { display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
	.card-body { padding: 1.25rem 1.4rem 1.5rem; }
	.c-top { display: flex; align-items: center; gap: 0.6rem; font-size: 0.72rem; }
	.c-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 600; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }
	.c-country { color: var(--color-muted); }
	.c-title { margin-top: 0.7rem; color: var(--color-ink); font-weight: 600; font-size: 1.35rem; line-height: 1.25; }
	.c-dek { margin-top: 0.6rem; color: var(--color-ink-soft); font-family: var(--font-serif); line-height: 1.55; font-size: 0.95rem; }
	.c-meta { margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--color-rule); display: flex; gap: 0.4rem; align-items: baseline; font-size: 0.75rem; color: var(--color-muted); }
	.c-impact { color: var(--accent); font-weight: 600; }
	.c-btn { margin-top: 1.1rem; display: inline-flex; width: 100%; align-items: center; justify-content: center; padding: 0.65rem 1rem; border-radius: 999px; font-size: 0.88rem; background: var(--color-surface-ink); color: var(--color-on-ink); text-decoration: none; transition: transform 0.15s; }
	.c-btn:hover { transform: translateY(-1px); }

	.empty { border: 1px dashed var(--color-rule-strong); border-radius: 12px; padding: 1.5rem; text-align: center; color: var(--color-muted); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: sticky; top: 1.5rem; }
	.empty-globe { width: 120px; margin: 0 auto; opacity: 0.85; }
	.empty p { font-size: 0.9rem; max-width: 26ch; line-height: 1.5; }
	.empty-count { font-size: 0.72rem; color: var(--color-faint); font-family: var(--font-mono); }
</style>
