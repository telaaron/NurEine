<script lang="ts">
	// Screen 1 — Aufdecken/Heute. Öffnet morgens direkt ins Ritual (Habit-Forschung,
	// Aarons bestätigter Default). Nach dem Lesen fliegt das Licht in den Himmel (Schritt 3).
	import RitualReader from '$lib/app-v2/RitualReader.svelte';
	import { track } from '$lib/track';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let finished = $state(false);

	function onRitualDone() {
		finished = true;
		// First-Party-Event (owned funnel): eine Ausgabe zu Ende gelesen.
		track('story_read', { surface: 'app', storyId: data.story?.id });
	}
</script>

<svelte:head>
	<title>Heute · NurEine</title>
	<meta name="theme-color" content="#14110d" />
</svelte:head>

{#if !data.story}
	<div class="empty surface-ink tex">
		<div class="empty-inner">
			<div class="empty-glyph sf">NUREINE</div>
			<p>Die heutige Ausgabe wird gerade vorbereitet.<br />Schau in ein paar Minuten wieder rein.</p>
		</div>
	</div>
{:else if finished}
	<!-- Übergangs-Platzhalter bis Screen 3 (Himmel) gebaut ist -->
	<div class="done surface-ink tex">
		<div class="done-inner">
			<div class="done-check" aria-hidden="true">✓</div>
			<div class="done-line sf">Gelesen.</div>
			<div class="done-sub">Dein Licht ist geflogen. (Der Himmel entsteht im nächsten Schritt.)</div>
			<button class="pill" type="button" onclick={() => (finished = false)}>Nochmal ansehen</button>
		</div>
	</div>
{:else}
	{#key data.story.id}
		<RitualReader story={data.story} onDone={onRitualDone} />
	{/key}
{/if}

<style>
	.empty,
	.done {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		text-align: center;
	}
	.empty-inner,
	.done-inner {
		max-width: 30ch;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	.empty-glyph,
	.done-line {
		color: var(--ink-text);
	}
	.empty-glyph {
		font-size: 13px;
		letter-spacing: 0.28em;
		color: var(--amber-hi);
	}
	.empty p,
	.done-sub {
		color: var(--ink-muted);
		font-size: 15px;
		line-height: 1.55;
		margin: 0;
	}
	.done-check {
		width: 76px;
		height: 76px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 38px;
		color: #fff;
		background: radial-gradient(circle at 42% 38%, rgba(232, 166, 104, 0.98), rgba(156, 85, 39, 0.9));
		box-shadow: 0 0 44px rgba(208, 128, 72, 0.5);
	}
	.done-line {
		font-size: 25px;
		letter-spacing: -0.02em;
	}
	.pill {
		margin-top: 8px;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 14px;
		background: none;
		border: 1px solid rgba(244, 239, 230, 0.28);
		color: var(--ink-text);
		border-radius: 999px;
		padding: 12px 22px;
		cursor: pointer;
	}
</style>
