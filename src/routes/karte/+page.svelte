<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import type * as LeafletModule from 'leaflet';
	import { formatDate } from '$lib/utils';

	let { data } = $props();

	interface StoryResult {
		id: string;
		slug: string;
		title: string;
		dek: string;
		body: string;
		category: string;
		region: string;
		country: string;
		coords: [number, number];
		coordsX: number;
		coordsY: number;
		source: string;
		source_url: string;
		publishedAt: string;
		readingMinutes: number;
		impactScore: number;
		impactNote: string;
		tone: 'amber' | 'sage' | 'rose' | 'sky';
		hero: string;
		pinned: number;
		local: number;
		featuredDate: string | null;
		createdAt: string;
		updatedAt: string;
	}

	const stories = $derived(data.stories as StoryResult[]);
	const storyCount = $derived(stories.length);

	let activeSlug = $state<string | null>(null);
	let mapContainer = $state<HTMLDivElement | null>(null);

	const activeStory = $derived(
		activeSlug ? stories.find((s) => s.slug === activeSlug) ?? null : null
	);

	const toneColors: Record<string, string> = {
		amber: '#c87340',
		sage: '#5a7a52',
		rose: '#b87a7a',
		sky: '#6c8aa8'
	};

	const toneLabels: Record<string, string> = {
		amber: 'Hoffnungsvoll',
		sage: 'Umwelt',
		rose: 'Menschlich',
		sky: 'Wissenschaft'
	};

	// --- Map state (not reactive — managed imperatively) ---
	let map: LeafletModule.Map | null = null;
	let markerBySlug = new Map<string, any>();
	let _initialized = false;
	let mapReady = $state(false);

	$effect(() => {
		const el = mapContainer;
		if (!browser || !el || _initialized) return;
		_initialized = true;

		import('leaflet').then((L) => {
			if (!mapContainer) return; // component may have unmounted

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

			// Create a marker for each story
			for (const s of stories) {
				const impact = s.impactScore ?? 50;
				const lightness = Math.min(88, Math.max(35, 40 + impact / 2));
				const radius = Math.max(5, Math.min(14, 6 + impact / 20));

				const marker = L.circleMarker([s.coords[0], s.coords[1]], {
					radius,
					color: `hsl(30, 80%, ${lightness}%)`,
					fillColor: toneColors[s.tone] ?? '#c87340',
					fillOpacity: 0.7,
					weight: 2,
					opacity: 0.9
				});

				marker.bindTooltip(
					`<span style="font-weight:600;">${s.title}</span><br><span style="opacity:0.7;font-size:11px;">${s.country} &middot; Wirkung ${impact}/100</span>`,
					{
						direction: 'top',
						offset: [0, -radius - 4],
						className: 'story-tooltip'
					}
				);

				marker.on('click', () => {
					activeSlug = s.slug;
				});

				marker.addTo(leafletMap);
				markerBySlug.set(s.slug, marker);
			}

			// Fit bounds to show all markers with padding
			if (stories.length > 0) {
				const group = L.featureGroup(Array.from(markerBySlug.values()));
				const bounds = group.getBounds();
				if (bounds.isValid()) {
					leafletMap.fitBounds(bounds.pad(0.2), { maxZoom: 6 });
				}
			} else {
				leafletMap.setView([50, 10], 3);
			}

			// Invalidate after a tick so the container is laid out
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

		const marker = markerBySlug.get(slug);
		if (!marker) return;

		// Highlight active marker
		const baseRadius = marker.getRadius() as number;
		marker.setStyle({
			radius: baseRadius * 1.6,
			fillOpacity: 0.95,
			weight: 3,
			opacity: 1
		});

		// Dim others
		for (const [otherSlug, otherMarker] of markerBySlug) {
			if (otherSlug !== slug) {
				otherMarker.setStyle({
					fillOpacity: 0.3,
					opacity: 0.45
				});
			}
		}

		// Smooth pan to marker
		map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });

		// Cleanup — reset all markers to default
		return () => {
			for (const s of stories) {
				const m = markerBySlug.get(s.slug);
				if (!m) continue;
				const imp = s.impactScore ?? 50;
				const light = Math.min(88, Math.max(35, 40 + imp / 2));
				m.setStyle({
					radius: Math.max(5, Math.min(14, 6 + imp / 20)),
					fillOpacity: 0.7,
					opacity: 0.9,
					color: `hsl(30, 80%, ${light}%)`,
					weight: 2
				});
			}
		};
	});

	function clearActive() {
		activeSlug = null;
	}
</script>

<svelte:head>
	<title>Karte — NurEine</title>
</svelte:head>

<!-- ===== HEADER ===== -->
<section class="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10 lg:pt-14 pb-6 lg:pb-8">
	<p
		class="text-[11px] uppercase tracking-[0.22em]"
		style="color: var(--color-amber); font-weight: 500;"
	>
		Karte der Hoffnung
	</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[2.2rem] lg:text-[3.2rem]"
		style="color: var(--color-ink); font-weight: 500; max-width: 14ch;"
	>
		Wo auf der Welt Gutes passiert.
	</h1>
	<div class="mt-4 flex flex-wrap items-center gap-4">
		<p
			class="text-[15px] leading-relaxed"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			{storyCount} Geschichten aus aller Welt. Klick auf einen Punkt — helle Farbe bedeutet
			h&ouml;here Wirkung.
		</p>
		<span
			class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.16em]"
			style="background: var(--color-amber-tint); color: var(--color-amber);"
		>
			<span class="tnum font-semibold">{storyCount}</span>
			Geschichten
		</span>
	</div>
</section>

<!-- ===== MAP + SIDEBAR ===== -->
<div class="mx-auto max-w-[1400px] px-6 lg:px-10 pb-12 lg:pb-16">
	<div class="flex flex-col lg:flex-row gap-6 lg:gap-10">
		<!-- Map area -->
		<div class="flex-1 min-h-0">
			<div
				class="paper relative w-full rounded-[8px] overflow-hidden"
				style="border: 1px solid var(--color-rule); height: 55vh; min-height: 380px;"
				bind:this={mapContainer}
			>
				{#if !mapReady}
					<div
						class="absolute inset-0 z-[1000] flex items-center justify-center"
						style="background: var(--color-paper);"
					>
						<div class="flex flex-col items-center gap-3">
							<div class="h-7 w-7 rounded-full border-2 animate-spin"
								style="border-color: var(--color-rule); border-top-color: var(--color-amber);"
							></div>
							<p class="text-sm" style="color: var(--color-muted);">Karte wird geladen...</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Legend (below map) -->
			<div
				class="mt-4 flex flex-wrap items-center gap-5 text-xs"
				style="color: var(--color-muted);"
			>
				<span class="uppercase tracking-[0.14em]">Legende:</span>
				{#each Object.entries(toneColors) as [tone, hex]}
					<span class="flex items-center gap-1.5">
						<span
							class="inline-block w-2.5 h-2.5 rounded-full"
							style="background: {hex};"
						></span>
						{toneLabels[tone]}
					</span>
				{/each}
				<span class="flex items-center gap-1.5">
					<span
						class="inline-block w-2.5 h-2.5 rounded-full"
						style="background: hsl(30, 80%, 65%);"
					></span>
					Wirkung &uparrow;
				</span>
			</div>
		</div>

		<!-- ===== DESKTOP SIDEBAR (lg+) ===== -->
		<aside class="hidden lg:block lg:w-96 xl:w-[420px] flex-shrink-0">
			{#if activeStory}
				{@const t = activeStory.tone}
				{@const hex = toneColors[t]}
				<div
					class="paper rounded-[8px] overflow-hidden sticky top-6"
					style="border: 1px solid color-mix(in srgb, {hex} 30%, transparent);"
				>
					<!-- Tone header bar -->
					<div class="h-1.5" style="background: {hex};"></div>

					<div class="p-6 lg:p-7">
						<!-- Meta row -->
						<div class="flex items-center gap-2.5 text-xs" style="color: var(--color-muted);">
							<span
								class="px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] rounded-full"
								style="background: color-mix(in srgb, {hex} 12%, transparent); color: {hex}; font-weight: 600;"
							>
								{activeStory.category}
							</span>
							<span>&middot;</span>
							<span>{activeStory.country}</span>
						</div>

						<!-- Emoji + Title -->
						<div class="mt-5 flex items-start gap-3">
							<span class="text-2xl flex-shrink-0 mt-0.5">{activeStory.hero || '📰'}</span>
							<h2
								class="serif leading-snug text-[1.35rem] lg:text-[1.5rem]"
								style="color: var(--color-ink); font-weight: 500;"
							>
								{activeStory.title}
							</h2>
						</div>

						<!-- Dek -->
						<p
							class="mt-4 text-[14px] leading-relaxed"
							style="color: var(--color-ink-soft); font-family: var(--font-serif);"
						>
							{activeStory.dek}
						</p>

						<!-- Stats bar -->
						<div
							class="mt-6 pt-4 flex items-center justify-between text-xs"
							style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
						>
							<div class="flex items-center gap-1.5">
								<span
									class="tnum font-semibold"
									style="color: {hex};"
								>
									{activeStory.impactScore}/100
								</span>
								<span>Wirkung</span>
							</div>
							<span>{formatDate(activeStory.publishedAt, 'short')}</span>
							<span>&middot; {activeStory.readingMinutes} Min.</span>
						</div>

						<!-- CTA -->
						<a
							href={base + '/geschichte/' + activeStory.slug}
							class="mt-5 group flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all duration-200 hover:gap-3"
							style="background: var(--color-ink); color: var(--color-paper);"
						>
							Geschichte lesen
							<svg
								class="w-3.5 h-3.5 transition-transform duration-200"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
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
					<span class="text-3xl">🌍</span>
					<p class="text-sm leading-relaxed" style="color: var(--color-muted); max-width: 26ch;">
						W&auml;hle einen Punkt auf der Karte, um eine Geschichte zu entdecken.
					</p>
					<p class="text-[11px]" style="color: var(--color-faint);">
						{storyCount} Geschichten geladen
					</p>
				</div>
			{/if}
		</aside>
	</div>
</div>

<!-- ===== MOBILE BOTTOM SHEET (<lg) ===== -->
{#if activeStory}
	{@const t = activeStory.tone}
	{@const hex = toneColors[t]}
	<!-- Backdrop -->
	<div
		class="lg:hidden fixed inset-0 z-40 transition-opacity duration-300"
		style="background: rgba(26, 24, 21, 0.25);"
		onclick={clearActive}
		role="presentation"
	></div>

	<!-- Sheet -->
	<div
		class="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-rise-up rounded-t-[12px] overflow-hidden shadow-2xl"
		style="background: var(--color-paper); max-height: 60vh;"
	>
		<!-- Handle bar -->
		<div class="flex justify-center pt-3 pb-1">
			<div
				class="w-10 h-1 rounded-full"
				style="background: var(--color-rule-strong);"
			></div>
		</div>

		<!-- Tone bar -->
		<div class="h-1" style="background: {hex};"></div>

		<!-- Scrollable content -->
		<div class="overflow-y-auto px-6 pb-8 pt-4" style="max-height: calc(60vh - 32px);">
			<!-- Close button -->
			<div class="flex justify-end mb-2">
				<button
					type="button"
					onclick={clearActive}
					class="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
					style="color: var(--color-muted);"
					aria-label="Schließen"
				>
					<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M4 4l8 8M12 4l-8 8" />
					</svg>
				</button>
			</div>

			<!-- Meta row -->
			<div class="flex items-center gap-2.5 text-xs" style="color: var(--color-muted);">
				<span
					class="px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] rounded-full"
					style="background: color-mix(in srgb, {hex} 12%, transparent); color: {hex}; font-weight: 600;"
				>
					{activeStory.category}
				</span>
				<span>&middot;</span>
				<span>{activeStory.country}</span>
			</div>

			<!-- Emoji + Title -->
			<div class="mt-3 flex items-start gap-3">
				<span class="text-2xl flex-shrink-0 mt-0.5">{activeStory.hero || '📰'}</span>
				<h2
					class="serif leading-snug text-[1.3rem]"
					style="color: var(--color-ink); font-weight: 500;"
				>
					{activeStory.title}
				</h2>
			</div>

			<!-- Dek -->
			<p
				class="mt-3 text-[14px] leading-relaxed"
				style="color: var(--color-ink-soft); font-family: var(--font-serif);"
			>
				{activeStory.dek}
			</p>

			<!-- Stats -->
			<div
				class="mt-4 pt-3 flex items-center justify-between text-xs"
				style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
			>
				<div class="flex items-center gap-1.5">
					<span class="tnum font-semibold" style="color: {hex};">{activeStory.impactScore}/100</span>
					<span>Wirkung</span>
				</div>
				<span>{formatDate(activeStory.publishedAt, 'short')}</span>
			</div>

			<!-- CTA -->
			<a
				href={base + '/geschichte/' + activeStory.slug}
				class="mt-5 block text-center px-4 py-3 rounded-full text-sm transition-all duration-200 active:scale-[0.97]"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Geschichte lesen
			</a>
		</div>
	</div>
{/if}

<!-- ===== STYLES ===== -->
<style>
	:global(.story-tooltip) {
		background: var(--color-ink) !important;
		color: var(--color-paper) !important;
		border: none !important;
		border-radius: 8px !important;
		padding: 10px 14px !important;
		font-family: var(--font-sans) !important;
		font-size: 13px !important;
		line-height: 1.4 !important;
		box-shadow: 0 4px 20px rgba(26, 24, 21, 0.2) !important;
		max-width: 260px !important;
	}
	:global(.story-tooltip::before) {
		border-top-color: var(--color-ink) !important;
	}
	:global(.leaflet-container) {
		background: var(--color-canvas-soft) !important;
		font-family: var(--font-sans) !important;
	}
	:global(.leaflet-control-zoom a) {
		color: var(--color-ink) !important;
		background: var(--color-paper) !important;
		border-color: var(--color-rule) !important;
	}
	:global(.leaflet-control-zoom a:hover) {
		background: var(--color-elevated) !important;
	}
	:global(.leaflet-control-attribution) {
		font-size: 10px !important;
		color: var(--color-faint) !important;
		background: rgba(250, 246, 238, 0.85) !important;
	}

	@keyframes rise-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	:global(.animate-rise-up) {
		animation: rise-up 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
</style>
