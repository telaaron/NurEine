<script lang="ts">
	// Wiederverwendbarer Ritual→Himmel-Bildschirm. Genutzt von /app (heutige Ausgabe)
	// und /app/geschichte/[id] (Reader per Deep-Link). Kapselt die Home-Logik:
	// Ritual lesen → Licht fliegt in den Himmel → der Himmel ist dann das Zuhause.
	import { onMount } from 'svelte';
	import RitualReader from './RitualReader.svelte';
	import SkyView from './SkyView.svelte';
	import { collection, type LightKind } from './collection.svelte';
	import { track } from '$lib/track';
	import { base } from '$app/paths';
	import type { StoryResult } from '$lib/server/queries';

	let { story, kind = 'story' }: { story: StoryResult; kind?: LightKind } = $props();

	let phase = $state<'ritual' | 'sky'>('ritual');
	let hydrated = $state(false);
	let alreadyRead = $state(false);

	onMount(() => {
		collection.hydrate();
		hydrated = true;
		if (collection.has(story.id)) {
			alreadyRead = true;
			phase = 'sky';
		}
	});

	function dayOf(s: StoryResult): string {
		const d = s.publishedAt ? new Date(s.publishedAt) : new Date();
		return d.toISOString().slice(0, 10);
	}

	function onDone() {
		collection.add({ id: story.id, title: story.title, category: story.category }, kind, new Date().toISOString(), dayOf(story));
		track('story_read', { surface: 'app', storyId: story.id });
		phase = 'sky';
	}
</script>

<svelte:head>
	<meta name="theme-color" content={phase === 'sky' ? '#0e0d12' : '#14110d'} />
</svelte:head>

{#if phase === 'sky' && hydrated}
	<div class="sky-screen">
		<SkyView lights={collection.all} total={collection.total} sinceDay={collection.since} flyIn={!alreadyRead} flyKind={kind} />
		<div class="sky-foot">
			<a class="pill ghost" href={base + '/app/himmel'}>Ganzen Himmel ansehen</a>
			<a class="pill solid" href={base + '/app'}>Zur heutigen Ausgabe</a>
		</div>
	</div>
{:else}
	{#key story.id}
		<RitualReader {story} {onDone} />
	{/key}
{/if}

<style>
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
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.pill {
		display: block;
		width: 100%;
		text-align: center;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 14px;
		border-radius: 999px;
		padding: 14px;
		text-decoration: none;
	}
	.pill.ghost {
		background: none;
		border: 1px solid rgba(244, 239, 230, 0.28);
		color: var(--ink-text);
	}
	.pill.solid {
		background: var(--amber-hi);
		border: none;
		color: #fff;
		font-size: 15px;
	}
</style>
