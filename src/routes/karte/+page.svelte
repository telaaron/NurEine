<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors } from '$lib/tone-constants';
	import MapLegend from '$lib/components/MapLegend.svelte';
	import MapLoadingOverlay from '$lib/components/MapLoadingOverlay.svelte';
	import MobileStorySheet from '$lib/components/MobileStorySheet.svelte';
	import { createStoryMarker, highlightMarker } from '$lib/map/story-marker';

	interface StoryResult {
		id: string; slug: string; title: string; dek: string; body: string;
		category: string; region: string; country: string;
		coords: [number, number]; coordsX: number; coordsY: number;
		source: string; source_url: string; publishedAt: string;
		readingMinutes: number; impactScore: number; impactNote: string;
		tone: 'amber' | 'sage' | 'rose' | 'sky'; hero: string;
		pinned: number; local: number;
		featuredDate: string | null; createdAt: string; updatedAt: string;
	}

	let { data } = $props();

	const stories = $derived((data.stories ?? []) as StoryResult[]);
	const storyCount = $derived(stories.length);

	let activeSlug = $state<string | null>(null);
	let mapContainer = $state<HTMLDivElement | null>(null);

	const activeStory = $derived(
		activeSlug ? stories.find((s) => s.slug === activeSlug) ?? null : null
	);

	// --- Map state (imperative) ---
	let map: any = null;
	let markerBySlug = new Map<string, any>();
	let _initialized = false;
	let mapReady = $state(false);

	$effect(() => {
		const el = mapContainer;
		if (!browser || !el || _initialized) return;
		_initialized = true;

		import('leaflet').then((L) => {
			if (!mapContainer) return;

			const leafletMap = L.map(el, {
				center: [50, 10],
				zoom: 3,
				zoomControl: true,
				scrollWheelZoom: true,
				attributionControl: false
			});

			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				attribution:
					'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &mdash; <a href="https://carto.com/">CARTO</a>'
			}).addTo(leafletMap);

			// Expose L globally for story-marker helper
			(window as any).L = L;

			for (const s of stories) {
				const marker = createStoryMarker(s, leafletMap, (slug) => {
					activeSlug = slug;
				});
				if (marker) markerBySlug.set(s.slug, marker);
			}

			if (stories.length > 0) {
				const group = L.featureGroup(Array.from(markerBySlug.values()));
				const bounds = group.getBounds();
				if (bounds.isValid()) {
					leafletMap.fitBounds(bounds.pad(0.2), { maxZoom: 6 });
				}
			}

			requestAnimationFrame(() => {
				leafletMap.invalidateSize();
			});

			map = leafletMap;
			mapReady = true;
		});

		return () => {
			map?.remove();
			map = null;
			markerBySlug.clear();
			_initialized = false;
			mapReady = false;
		};
	});

	// --- Highlight active marker & pan ---
	$effect(() => {
		const slug = activeSlug;
		if (!map || !slug) return;

		const activeMarker = markerBySlug.get(slug);
		if (!activeMarker) return;

		highlightMarker(activeMarker, true);

		for (const [otherSlug, otherMarker] of markerBySlug) {
			if (otherSlug !== slug) {
				highlightMarker(otherMarker, false);
			}
		}

		map.panTo(activeMarker.getLatLng(), { animate: true, duration: 0.5 });

		return () => {
			for (const s of stories) {
				const m = markerBySlug.get(s.slug);
				if (m) highlightMarker(m, false);
			}
		};
	});

	function clearActive() {
		activeSlug = null;
	}
</script>

<!-- ===== HEADER ===== -->
<section class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-14 pb-4 sm:pb-6 lg:pb-8">
	<p class="eyebrow" style="color: var(--color-amber);">Karte der Hoffnung</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[1.7rem] sm:text-[2.2rem] lg:text-[3.2rem]"
		style="color: var(--color-ink); font-weight: 500; max-width: 14ch;"
	>
		Wo auf der Welt Gutes passiert.
	</h1>
	<div class="mt-4 flex flex-wrap items-center gap-4">
		<p
			class="page-dek leading-relaxed"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			{storyCount} Geschichten aus aller Welt. Klick auf einen Punkt.
		</p>
		<span
			class="eyebrow inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
			style="background: var(--color-amber-tint); color: var(--color-amber);"
		>
			<span class="tnum font-semibold">{storyCount}</span>
			Geschichten
		</span>
	</div>
</section>

<!-- ===== MAP + SIDEBAR ===== -->
<div class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-10 sm:pb-12 lg:pb-16">
	<div class="flex flex-col lg:flex-row gap-6 lg:gap-10">
		<div class="flex-1 min-h-0">
			<div
				class="paper relative w-full rounded-[8px] overflow-hidden"
				style="border: 1px solid var(--color-rule); height: 55vh; min-height: 280px;"
				bind:this={mapContainer}
			>
				{#if !mapReady}
					<MapLoadingOverlay />
				{/if}
			</div>
			<MapLegend />
		</div>

		<!-- Desktop sidebar -->
		<aside class="hidden lg:block lg:w-96 xl:w-[420px] flex-shrink-0">
			{#if activeStory}
				{@const hex = toneColors[activeStory.tone] ?? '#c87340'}
				<div
					class="paper rounded-[8px] overflow-hidden sticky top-6"
					style="border: 1px solid color-mix(in srgb, {hex} 30%, transparent);"
				>
					<div class="h-1.5" style="background: {hex};"></div>
					<div class="p-5 sm:p-6 lg:p-7">
						<div class="flex items-center gap-2.5 text-xs" style="color: var(--color-muted);">
							<span
								class="badge px-2.5 py-1 rounded-full"
								style="background: color-mix(in srgb, {hex} 12%, transparent); color: {hex}; font-weight: 600;"
							>
								{activeStory.category}
							</span>
							<span>&middot;</span>
							<span>{activeStory.country}</span>
						</div>

						<div class="mt-5 flex items-start gap-3">
							{#if activeStory.hero?.startsWith('http')}
								<div
									class="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden"
									style="border: 1px solid var(--color-rule);"
								>
									<img
										src={activeStory.hero}
										alt=""
										class="w-full h-full object-cover"
										loading="lazy"
									/>
								</div>
							{:else}
								<span class="text-2xl flex-shrink-0 mt-0.5">{activeStory.hero || '&#x1F4F0;'}</span>
							{/if}
							<h2
								class="serif leading-snug text-[1.2rem] sm:text-[1.35rem] lg:text-[1.5rem]"
								style="color: var(--color-ink); font-weight: 500;"
							>
								{activeStory.title}
							</h2>
						</div>

						<p
							class="card-dek mt-4 leading-relaxed"
							style="color: var(--color-ink-soft); font-family: var(--font-serif);"
						>
							{activeStory.dek}
						</p>

						<div
							class="mt-6 pt-4 flex items-center justify-between text-xs"
							style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
						>
							<div class="flex items-center gap-1.5">
								<span class="tnum font-semibold" style="color: {hex};">{activeStory.impactScore}/100</span>
								<span>Wirkung</span>
							</div>
							<span>&middot; {activeStory.readingMinutes} Min.</span>
						</div>

						<a
							href={base + '/geschichte/' + activeStory.slug}
							class="mt-5 group flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all duration-200 hover:gap-3"
							style="background: var(--color-ink); color: var(--color-paper);"
						>
							Geschichte lesen
							<svg class="w-3.5 h-3.5 transition-transform duration-200" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
								<path d="M6 3l5 5-5 5" />
							</svg>
						</a>
					</div>
				</div>
			{:else}
				<div
					class="paper rounded-[8px] p-8 sticky top-6 flex flex-col items-center text-center gap-3"
					style="border: 1px solid var(--color-rule);"
				>
					<span class="text-3xl">&#x1F30D;</span>
					<p class="text-sm leading-relaxed" style="color: var(--color-muted); max-width: 26ch;">
						W&auml;hle einen Punkt auf der Karte, um eine Geschichte zu entdecken.
					</p>
					<p class="meta" style="color: var(--color-faint);">{storyCount} Geschichten geladen</p>
				</div>
			{/if}
		</aside>
	</div>
</div>

<!-- ===== MOBILE BOTTOM SHEET ===== -->
<MobileStorySheet story={activeStory} onClose={clearActive} />

<!-- ===== STYLES ===== -->
<style>
	/* Page-specific: attribution (only on karte, not bei-dir) */
	:global(.leaflet-control-attribution) {
		font-size: 10px !important;
		color: var(--color-faint) !important;
		background: rgba(250, 246, 238, 0.85) !important;
	}
</style>
