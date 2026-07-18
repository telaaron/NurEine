<script lang="ts">
	// Screen 1 — Aufdecken/Heute. Öffnet morgens direkt ins Ritual (Habit-Forschung,
	// Aarons bestätigter Default). Nach dem Lesen fliegt das Licht in den Himmel —
	// und DER Himmel ist dann das Zuhause (Home-Logik aus dem Bauplan, Konzept B).
	import { onMount } from 'svelte';
	import RitualReader from '$lib/app-v2/RitualReader.svelte';
	import SkyView from '$lib/app-v2/SkyView.svelte';
	import { collection } from '$lib/app-v2/collection.svelte';
	import { track } from '$lib/track';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// „sky“ = Ritual dieser Ausgabe abgeschlossen → Himmel-Ansicht mit Fly-In.
	let phase = $state<'ritual' | 'sky'>('ritual');
	let hydrated = $state(false);
	let alreadyRead = $state(false);

	onMount(() => {
		collection.hydrate();
		hydrated = true;
		// Schon heute gelesen? Dann direkt in den Himmel (kein zweites Ritual erzwingen).
		if (data.story && collection.has(data.story.id)) {
			alreadyRead = true;
			phase = 'sky';
		}
	});

	function nowIso(): string {
		return new Date().toISOString();
	}
	function todayDay(story: { publishedAt?: string }): string {
		const d = story.publishedAt ? new Date(story.publishedAt) : new Date();
		return d.toISOString().slice(0, 10);
	}

	function onRitualDone() {
		if (data.story) {
			collection.add(
				{ id: data.story.id, title: data.story.title, category: data.story.category },
				'story',
				nowIso(),
				todayDay(data.story)
			);
			track('story_read', { surface: 'app', storyId: data.story.id });
		}
		phase = 'sky';
	}
</script>

<svelte:head>
	<title>Heute · NurEine</title>
	<meta name="theme-color" content={phase === 'sky' ? '#0e0d12' : '#14110d'} />
</svelte:head>

{#if !data.story}
	<div class="empty surface-ink tex">
		<div class="empty-inner">
			<div class="empty-glyph sf">NUREINE</div>
			<p>Die heutige Ausgabe wird gerade vorbereitet.<br />Schau in ein paar Minuten wieder rein.</p>
		</div>
	</div>
{:else if phase === 'sky' && hydrated}
	<div class="sky-screen">
		<SkyView
			lights={collection.all}
			total={collection.total}
			sinceDay={collection.since}
			flyIn={!alreadyRead}
			flyKind="story"
		/>
		<div class="sky-foot">
			<a class="pill ghost" href={base + '/app/himmel'}>Ganzen Himmel ansehen</a>
		</div>
	</div>
{:else}
	{#key data.story.id}
		<RitualReader story={data.story} onDone={onRitualDone} />
	{/key}
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

	.sky-screen {
		position: relative;
		min-height: 100dvh;
	}
	.sky-foot {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 6;
		padding: 0 26px max(34px, env(safe-area-inset-bottom));
	}
	.pill.ghost {
		display: block;
		width: 100%;
		text-align: center;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 14px;
		background: none;
		border: 1px solid rgba(244, 239, 230, 0.28);
		color: var(--ink-text);
		border-radius: 999px;
		padding: 14px;
		text-decoration: none;
	}
</style>
