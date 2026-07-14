<script lang="ts">
	import '../../app.css';
	import '$lib/app-v2/app-v2.css';
	import { onMount } from 'svelte';
	import { prefs } from '$lib/app-v2/prefs.svelte';
	import { tick as tickSound } from '$lib/app-v2/audio';

	let { children } = $props();

	// data-theme spiegelt die Präferenz auf die Root-Klasse (überschreibt die Media-Query).
	const themeAttr = $derived(prefs.theme === 'system' ? undefined : prefs.theme);

	onMount(() => {
		prefs.hydrate();
	});

	function onToggleSound() {
		prefs.toggleSound();
		if (prefs.sound) tickSound(); // kurzes akustisches „an"-Feedback
	}
</script>

<div class="appv2" data-theme={themeAttr}>
	<button
		class="sound-toggle sf"
		type="button"
		aria-pressed={prefs.sound}
		aria-label={prefs.sound ? 'Klang ausschalten' : 'Klang einschalten'}
		title={prefs.sound ? 'Klang aus' : 'Klang an'}
		onclick={onToggleSound}
	>
		{#if prefs.sound}
			<!-- Lautsprecher an -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" />
			</svg>
		{:else}
			<!-- Lautsprecher aus -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m22 9-6 6M16 9l6 6" />
			</svg>
		{/if}
	</button>

	{@render children?.()}
</div>

<style>
	.sound-toggle {
		position: fixed;
		top: max(14px, env(safe-area-inset-top));
		right: 16px;
		z-index: 90;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--ink) 62%, transparent);
		border: 1px solid var(--line);
		color: var(--ink-text);
		cursor: pointer;
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		transition: transform 0.12s ease;
	}
	.sound-toggle:active {
		transform: scale(0.94);
	}
	@media (prefers-color-scheme: dark) {
		.sound-toggle {
			background: color-mix(in srgb, var(--ink-text) 14%, transparent);
			color: var(--ink-text);
		}
	}
</style>
