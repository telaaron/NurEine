<script lang="ts">
	// Klang-Schalter der Website. Bewusst unauffällig und NICHT fixiert:
	// die Website ist zum Lesen da, ein schwebender Button über dem Text wäre
	// aufdringlich. Er sitzt dort, wo Klang tatsächlich vorkommt (z. B. Karte).
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { SpeakerWaveIcon, SpeakerXMarkIcon } from 'heroicons-svelte/24/outline';
	import { soundPrefs, tick } from '$lib/sound';

	let { label = true }: { label?: boolean } = $props();

	onMount(() => soundPrefs.hydrate());

	function onToggle() {
		soundPrefs.toggle();
		// Kurzes akustisches „an"-Feedback. Muss NACH dem Umschalten kommen —
		// die Engine ist vorher noch stumm und der AudioContext ggf. suspended.
		if (soundPrefs.on) tick();
	}
</script>

<button
	type="button"
	class="sound-toggle"
	aria-pressed={soundPrefs.on}
	aria-label={soundPrefs.on ? 'Klang ausschalten' : 'Klang einschalten'}
	title={soundPrefs.on ? 'Klang aus' : 'Klang an'}
	onclick={onToggle}
>
	{#if soundPrefs.on}
		<Icon icon={SpeakerWaveIcon} size="1rem" />
	{:else}
		<Icon icon={SpeakerXMarkIcon} size="1rem" />
	{/if}
	{#if label}<span>Klang</span>{/if}
</button>

<style>
	.sound-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.85rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-family: var(--font-mono);
		border: 1px solid var(--color-rule);
		background: transparent;
		color: var(--color-muted);
		cursor: pointer;
		transition: all 0.15s;
	}
	.sound-toggle:hover {
		border-color: var(--color-rule-strong);
		color: var(--color-ink-soft);
	}
	.sound-toggle[aria-pressed='true'] {
		border-color: var(--color-amber);
		color: var(--color-ink);
		background: var(--color-amber-tint);
	}
	.sound-toggle:active {
		transform: scale(0.97);
	}
</style>
