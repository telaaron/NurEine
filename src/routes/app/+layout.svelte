<script lang="ts">
	import '../../app.css';
	import '$lib/app-v2/app-v2.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { prefs } from '$lib/app-v2/prefs.svelte';
	import { tick as tickSound } from '$lib/app-v2/audio';
	import Icon from '$lib/components/Icon.svelte';
	import { SpeakerWaveIcon, SpeakerXMarkIcon } from 'heroicons-svelte/24/outline';

	let { children } = $props();

	// data-theme spiegelt die Präferenz auf die Root-Klasse (überschreibt die Media-Query).
	const themeAttr = $derived(prefs.theme === 'system' ? undefined : prefs.theme);

	// Der Klang-Toggle stört beim Onboarding (eigener Flow) — dort ausblenden.
	const path = $derived(page.url.pathname.replace(base, ''));
	const onStart = $derived(path.startsWith('/app/start'));

	onMount(() => {
		prefs.hydrate();
		// Onboarding-Gate: beim ersten Besuch der App zuerst Tag 1 zeigen.
		// /app/start und /app/himmel sind ausgenommen (Start ist der Flow selbst;
		// den Himmel darf man auch ohne Onboarding ansehen).
		if (!prefs.onboarded && !onStart && !path.startsWith('/app/himmel')) {
			goto(base + '/app/start', { replaceState: true });
		}
	});

	function onToggleSound() {
		prefs.toggleSound();
		if (prefs.sound) tickSound(); // kurzes akustisches „an"-Feedback
	}
</script>

<div class="appv2" data-theme={themeAttr}>
	{#if !onStart}
	<button
		class="sound-toggle sf"
		type="button"
		aria-pressed={prefs.sound}
		aria-label={prefs.sound ? 'Klang ausschalten' : 'Klang einschalten'}
		title={prefs.sound ? 'Klang aus' : 'Klang an'}
		onclick={onToggleSound}
	>
		{#if prefs.sound}
			<Icon icon={SpeakerWaveIcon} size="1.125rem" />
		{:else}
			<Icon icon={SpeakerXMarkIcon} size="1.125rem" />
		{/if}
	</button>

	{/if}

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
