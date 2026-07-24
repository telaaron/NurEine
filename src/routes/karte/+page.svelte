<script lang="ts">
	import { page } from '$app/stores';
	import VariantClassic from './VariantClassic.svelte';
	import VariantPlanetarium from './VariantPlanetarium.svelte';
	import VariantAtlas from './VariantAtlas.svelte';
	import VariantLiveFeed from './VariantLiveFeed.svelte';

	let { data } = $props();
	const stories = $derived(data.stories ?? []);

	// ?v=1|2|3 picks a variant; default (no param / 0) = current live design.
	const v = $derived($page.url.searchParams.get('v') ?? '0');

	const variants = [
		{ id: '0', label: 'Aktuell' },
		{ id: '1', label: 'Planetarium' },
		{ id: '2', label: 'Atlas' },
		{ id: '3', label: 'Live-Feed' }
	];
</script>

<svelte:head><title>Karte der Hoffnung — Varianten</title></svelte:head>

{#key v}
	{#if v === '1'}
		<VariantPlanetarium {stories} />
	{:else if v === '2'}
		<VariantAtlas {stories} />
	{:else if v === '3'}
		<VariantLiveFeed {stories} />
	{:else}
		<VariantClassic {stories} />
	{/if}
{/key}

<!-- Floating variant picker (dev/review only) -->
<div class="vpicker">
	<span class="vp-label">Variante</span>
	{#each variants as opt}
		<a class="vp-btn" class:active={v === opt.id} href={'?v=' + opt.id}>{opt.label}</a>
	{/each}
</div>

<style>
	.vpicker {
		position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); z-index: 9000;
		display: flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.5rem 0.4rem 0.85rem;
		border-radius: 999px; background: color-mix(in srgb, var(--color-paper) 88%, transparent);
		backdrop-filter: blur(16px) saturate(1.4); -webkit-backdrop-filter: blur(16px) saturate(1.4);
		border: 1px solid var(--color-rule-strong); box-shadow: 0 12px 40px -12px rgba(0,0,0,0.5);
		font-size: 0.8rem;
	}
	.vp-label { color: var(--color-muted); font-family: var(--font-mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; margin-right: 0.25rem; }
	.vp-btn { padding: 0.35rem 0.75rem; border-radius: 999px; text-decoration: none; color: var(--color-ink-soft); transition: all 0.15s; white-space: nowrap; }
	.vp-btn:hover { background: var(--color-canvas-soft); }
	.vp-btn.active { background: var(--color-surface-ink); color: var(--color-on-ink); }
	@media (max-width: 560px) { .vpicker { font-size: 0.72rem; padding: 0.35rem 0.4rem; gap: 0.2rem; } .vp-label { display: none; } }
</style>
