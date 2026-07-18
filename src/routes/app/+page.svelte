<script lang="ts">
	// Screen 1 — Aufdecken/Heute. Öffnet morgens direkt ins Ritual (Habit-Forschung,
	// Aarons bestätigter Default). Nach dem Lesen fliegt das Licht in den Himmel —
	// und DER Himmel ist dann das Zuhause (Home-Logik, Konzept B). Logik in RitualScreen.
	import RitualScreen from '$lib/app-v2/RitualScreen.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Heute · NurEine</title>
</svelte:head>

{#if !data.story}
	<div class="empty surface-ink tex">
		<div class="empty-inner">
			<div class="empty-glyph sf">NUREINE</div>
			<p>Die heutige Ausgabe wird gerade vorbereitet.<br />Schau in ein paar Minuten wieder rein.</p>
		</div>
	</div>
{:else}
	<RitualScreen story={data.story} kind="story" />
{/if}

<style>
	.empty {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		text-align: center;
	}
	.empty-inner {
		max-width: 30ch;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	.empty-glyph {
		font-size: 13px;
		letter-spacing: 0.28em;
		color: var(--amber-hi);
	}
	.empty p {
		color: var(--ink-muted);
		font-size: 15px;
		line-height: 1.55;
		margin: 0;
	}
</style>
