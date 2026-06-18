<script lang="ts">
	import { base } from '$app/paths';
	import 'leaflet/dist/leaflet.css';
	import { fetchStories } from '$lib/app/api';
	import { createStoryMarker } from '$lib/map/story-marker';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { categoryLabel } from '$lib/categories';
	import { toneStyles } from '$lib/utils';
	import { tapLight } from '$lib/app/native';
	import type { StoryResult } from '$lib/server/queries';

	let mapEl = $state<HTMLDivElement | null>(null);
	let loading = $state(true);
	let selected = $state<StoryResult | null>(null);
	let count = $state(0);

	function heroImg(s: StoryResult): string {
		if (s.imageUrl && s.imageUrl.startsWith('http')) return s.imageUrl;
		return getStoryHeroImageSrc(s.category, base);
	}

	$effect(() => {
		let map: any;
		let cancelled = false;

		(async () => {
			let stories: StoryResult[] = [];
			try {
				const all = await fetchStories();
				stories = all.filter((s) => s.coords && s.coords[0] != null && s.coords[1] != null);
			} catch {
				/* show empty map */
			}
			if (cancelled || !mapEl) return;
			count = stories.length;

			const L = (await import('leaflet')).default;
			(window as any).L = L;
			const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

			map = L.map(mapEl, { zoomControl: false, attributionControl: false }).setView([30, 10], 2);
			L.tileLayer(
				dark
					? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
					: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
				{ maxZoom: 18, subdomains: 'abcd' }
			).addTo(map);

			const byId = new Map<string, StoryResult>();
			for (const s of stories) {
				byId.set(s.slug, s);
				createStoryMarker(s as any, map, (slug) => {
					tapLight();
					selected = byId.get(slug) ?? null;
				});
			}
			setTimeout(() => map?.invalidateSize(), 100);
			loading = false;
		})();

		return () => {
			cancelled = true;
			map?.remove();
		};
	});
</script>

<div class="map-wrap">
	<div class="map" bind:this={mapEl}></div>

	{#if loading}
		<div class="map-loading"><span class="spin"></span></div>
	{/if}

	<div class="map-title">
		<span class="display">Karte der Hoffnung</span>
		{#if !loading}<span class="map-count">{count} Geschichten</span>{/if}
	</div>

	{#if selected}
		{@const t = toneStyles[selected.tone]}
		<button class="sheet-scrim" onclick={() => (selected = null)} aria-label="Schließen"></button>
		<div class="sheet">
			<div class="sheet-grab"></div>
			<a class="sheet-card" href={base + '/app/geschichte/' + selected.id}>
				<div class="sheet-thumb"><img src={heroImg(selected)} alt="" /></div>
				<div class="sheet-text">
					<span class="sheet-tag" style="color:{t.fg};">{categoryLabel(selected.category)} · {selected.country}</span>
					<div class="sheet-title display">{selected.title}</div>
					<div class="sheet-meta">{selected.readingMinutes} Min · Wirkung {selected.impactScore}</div>
				</div>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
			</a>
		</div>
	{/if}
</div>

<style>
	.map-wrap { position: relative; height: calc(100dvh - 58px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); }
	.map { position: absolute; inset: 0; background: var(--color-canvas-soft); }

	.map-title { position: absolute; top: 14px; left: 16px; right: 16px; z-index: 5; display: flex; align-items: baseline; gap: 10px; pointer-events: none; }
	.map-title .display { font-size: 18px; font-weight: 600; color: var(--color-ink); background: color-mix(in srgb, var(--color-canvas) 80%, transparent); padding: 5px 10px; border-radius: 8px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
	.map-count { font-family: var(--font-mono); font-size: 11px; color: var(--color-muted); background: color-mix(in srgb, var(--color-canvas) 80%, transparent); padding: 4px 8px; border-radius: 6px; }

	.map-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 6; }
	.spin { width: 26px; height: 26px; border: 2.5px solid var(--color-rule-strong); border-top-color: var(--color-amber); border-radius: 50%; animation: rot 0.8s linear infinite; }
	@keyframes rot { to { transform: rotate(360deg); } }

	.sheet-scrim { position: absolute; inset: 0; z-index: 9; background: rgba(0,0,0,0.18); border: none; }
	.sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 10; background: var(--color-paper); border-radius: 20px 20px 0 0; border-top: 1px solid var(--color-rule); padding: 10px 16px 18px; box-shadow: 0 -8px 24px rgba(60,40,20,0.14); animation: rise-sheet 0.22s cubic-bezier(0.2,0.7,0.2,1); }
	@keyframes rise-sheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
	.sheet-grab { width: 38px; height: 4px; border-radius: 2px; background: var(--color-rule-strong); margin: 0 auto 12px; }
	.sheet-card { display: flex; gap: 11px; align-items: center; text-decoration: none; color: inherit; }
	.sheet-thumb { width: 56px; height: 56px; border-radius: 10px; overflow: hidden; flex: 0 0 auto; background: var(--color-canvas-soft); }
	.sheet-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.sheet-text { min-width: 0; flex: 1; }
	.sheet-tag { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; }
	.sheet-title { font-size: 15px; font-weight: 500; line-height: 1.18; color: var(--color-ink); margin-top: 4px; }
	.sheet-meta { font-family: var(--font-mono); font-size: 11px; color: var(--color-muted); margin-top: 4px; }
</style>
