<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors, toneLabels } from '$lib/tone-constants';
	import { createGlowMarker, highlightGlow } from '$lib/map/glow-marker';

	let { stories = [] }: { stories?: any[] } = $props();
	const storyCount = $derived(stories.length);

	let activeSlug = $state<string | null>(null);
	let filterTone = $state<string | null>(null);
	let mapContainer = $state<HTMLDivElement | null>(null);

	const activeStory = $derived(activeSlug ? stories.find((s) => s.slug === activeSlug) ?? null : null);
	// Feed sorted by impact, optionally filtered by tone.
	const feed = $derived(
		[...stories]
			.filter((s) => !filterTone || s.tone === filterTone)
			.sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))
	);

	let map: any = null;
	let markerBySlug = new Map<string, any>();
	let _init = false;
	let mapReady = $state(false);

	$effect(() => {
		const el = mapContainer;
		if (!browser || !el || _init) return;
		_init = true;
		import('leaflet').then((L) => {
			if (!mapContainer) return;
			const m = L.map(el, { center: [35, 10], zoom: 2, zoomControl: true, scrollWheelZoom: true, attributionControl: false, worldCopyJump: true });
			(window as any).L = L;
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

	// Highlight active marker + pan
	$effect(() => {
		const slug = activeSlug;
		if (!map || !slug) return;
		const mk = markerBySlug.get(slug);
		if (!mk) return;
		highlightGlow(mk, true);
		for (const [o, om] of markerBySlug) if (o !== slug) highlightGlow(om, false);
		map.flyTo(mk.getLatLng(), Math.max(map.getZoom(), 4), { duration: 0.7 });
		// scroll feed item into view
		queueMicrotask(() => document.getElementById('feed-' + slug)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
		return () => { for (const s of stories) { const m2 = markerBySlug.get(s.slug); if (m2) highlightGlow(m2, false); } };
	});

	// Dim markers not matching the tone filter.
	$effect(() => {
		if (!map) return;
		for (const [slug, mk] of markerBySlug) {
			const s = stories.find((x) => x.slug === slug);
			const hidden = filterTone && s?.tone !== filterTone;
			mk.setStyle({ opacity: hidden ? 0.08 : 0.7, fillOpacity: hidden ? 0.06 : 0.85 });
		}
	});
</script>

<section class="feed-page">
	<header class="head">
		<div>
			<p class="eyebrow" style="color: var(--color-amber);">Karte der Hoffnung</p>
			<h1 class="display head-title">Wo auf der Welt Gutes passiert.</h1>
		</div>
		<div class="pulse"><span class="pulse-dot"></span>{storyCount} Geschichten live</div>
	</header>

	<!-- tone filters -->
	<div class="filters">
		<button class="chip" class:active={filterTone === null} onclick={() => (filterTone = null)}>Alle</button>
		{#each Object.entries(toneColors) as [key, color]}
			<button class="chip" class:active={filterTone === key} style="--c:{color}" onclick={() => (filterTone = filterTone === key ? null : key)}>
				<span class="chip-dot" style="background:{color}"></span>{toneLabels[key] ?? key}
			</button>
		{/each}
	</div>

	<div class="grid">
		<!-- MAP -->
		<div class="map-frame" bind:this={mapContainer}>
			{#if !mapReady}
				<div class="loading"><div class="spinner"></div><span>Karte wird geladen…</span></div>
			{/if}
		</div>

		<!-- FEED -->
		<div class="feed">
			<div class="feed-scroll">
				{#each feed as s (s.slug)}
					{@const hex = toneColors[s.tone] ?? '#c87340'}
					<button
						id={'feed-' + s.slug}
						class="feed-item"
						class:active={activeSlug === s.slug}
						style="--accent:{hex}"
						onclick={() => (activeSlug = s.slug)}
					>
						{#if s.hero?.startsWith('http')}
							<img class="fi-thumb" src={s.hero} alt="" loading="lazy" />
						{:else}
							<span class="fi-thumb fi-emoji">{s.hero || '📰'}</span>
						{/if}
						<div class="fi-body">
							<div class="fi-top"><span class="fi-country">{s.country}</span><span class="fi-impact">{s.impactScore}</span></div>
							<span class="fi-title">{s.title}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- active story detail bar -->
	{#if activeStory}
		{@const hex = toneColors[activeStory.tone] ?? '#c87340'}
		<a class="detail" style="--accent:{hex}" href={base + '/geschichte/' + activeStory.slug}>
			<span class="det-badge">{activeStory.category}</span>
			<span class="det-title">{activeStory.title}</span>
			<span class="det-dek">{activeStory.dek}</span>
			<span class="det-go">Lesen →</span>
		</a>
	{/if}
</section>

<style>
	.feed-page { max-width: 1400px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
	@media (min-width: 1024px) { .feed-page { padding: 2.5rem 2.5rem 4rem; } }

	.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.head-title { color: var(--color-ink); font-weight: 600; line-height: 1.1; font-size: clamp(1.6rem, 3vw, 2.6rem); margin-top: 0.4rem; }
	.pulse { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--color-muted); font-family: var(--font-mono); }
	.pulse-dot { width: 0.6rem; height: 0.6rem; border-radius: 999px; background: var(--color-amber); box-shadow: 0 0 0 0 var(--color-amber); animation: pulse 1.8s infinite; }
	@keyframes pulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-amber) 60%, transparent); } 70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }

	.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.25rem 0; }
	.chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 999px; font-size: 0.8rem; border: 1px solid var(--color-rule); background: transparent; color: var(--color-ink-soft); cursor: pointer; transition: all 0.15s; }
	.chip:hover { border-color: var(--color-rule-strong); }
	.chip.active { background: var(--color-surface-ink); color: var(--color-on-ink); border-color: transparent; }
	.chip-dot { width: 0.6rem; height: 0.6rem; border-radius: 999px; }

	.grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
	@media (min-width: 1024px) { .grid { grid-template-columns: 1fr 360px; } }

	.map-frame { position: relative; width: 100%; height: 60vh; min-height: 400px; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-rule); box-shadow: 0 16px 50px -30px rgba(0,0,0,0.5); }
	.loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--color-canvas); z-index: 10; color: var(--color-muted); font-size: 0.9rem; }
	.spinner { width: 1.75rem; height: 1.75rem; border: 2px solid var(--color-rule); border-top-color: var(--color-amber); border-radius: 999px; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	.feed { border: 1px solid var(--color-rule); border-radius: 12px; overflow: hidden; background: var(--color-paper); }
	.feed-scroll { height: 60vh; min-height: 400px; overflow-y: auto; padding: 0.5rem; scrollbar-width: thin; }
	.feed-item { display: flex; gap: 0.75rem; width: 100%; text-align: left; padding: 0.6rem; border-radius: 9px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: background 0.15s, border-color 0.15s; align-items: center; }
	.feed-item:hover { background: var(--color-canvas-soft); }
	.feed-item.active { background: color-mix(in srgb, var(--accent) 10%, transparent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
	.fi-thumb { width: 3rem; height: 3rem; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: var(--color-canvas-soft); }
	.fi-emoji { display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
	.fi-body { min-width: 0; flex: 1; }
	.fi-top { display: flex; justify-content: space-between; align-items: center; font-size: 0.68rem; color: var(--color-muted); }
	.fi-impact { font-family: var(--font-mono); color: var(--accent); font-weight: 600; }
	.fi-title { display: block; font-size: 0.86rem; color: var(--color-ink); font-weight: 500; line-height: 1.3; margin-top: 0.15rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

	.detail { margin-top: 1.25rem; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.5rem 1rem; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--color-rule)); background: var(--color-paper); text-decoration: none; animation: cardin 0.3s ease both; }
	@keyframes cardin { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
	.det-badge { grid-row: 1; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }
	.det-title { grid-row: 1; color: var(--color-ink); font-weight: 600; font-size: 1rem; }
	.det-go { grid-row: 1; grid-column: 3; color: var(--accent); font-weight: 600; font-size: 0.85rem; white-space: nowrap; }
	.det-dek { grid-column: 1 / 3; grid-row: 2; color: var(--color-ink-soft); font-family: var(--font-serif); font-size: 0.9rem; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
	@media (max-width: 640px) { .detail { grid-template-columns: 1fr; } .det-go { grid-column: 1; grid-row: 3; } .det-dek { grid-column: 1; } }
</style>
