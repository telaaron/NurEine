<script lang="ts">
	// Der Kurven-Tag als Route. Curve-Ritual → Kurven-Licht fliegt in den Himmel.
	import { onMount } from 'svelte';
	import CurveReader from '$lib/app-v2/CurveReader.svelte';
	import SkyView from '$lib/app-v2/SkyView.svelte';
	import { collection } from '$lib/app-v2/collection.svelte';
	import { track } from '$lib/track';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let phase = $state<'curve' | 'sky'>('curve');
	let hydrated = $state(false);
	let alreadyRead = $state(false);

	const collectionId = $derived('curve:' + data.metric.metric_key);

	onMount(() => {
		collection.hydrate();
		hydrated = true;
		if (collection.has(collectionId)) {
			alreadyRead = true;
			phase = 'sky';
		}
	});

	function onDone() {
		collection.add(
			{ id: collectionId, title: data.metric.label, category: data.metric.category },
			'curve',
			new Date().toISOString(),
			String(data.metric.latest_year) + '-01-01'
		);
		track('story_read', { surface: 'app', kind: 'curve', metric: data.metric.metric_key });
		phase = 'sky';
	}
</script>

<svelte:head>
	<title>{data.metric.label} · NurEine</title>
	<meta name="theme-color" content={phase === 'sky' ? '#0e0d12' : '#14110d'} />
</svelte:head>

{#if phase === 'sky' && hydrated}
	<div class="sky-screen">
		<SkyView lights={collection.all} total={collection.total} sinceDay={collection.since} flyIn={!alreadyRead} flyKind="curve" />
		<div class="sky-foot">
			<a class="pill ghost" href={base + '/app/welt'}>Zur Kurven-Wand</a>
			<a class="pill solid" href={base + '/app'}>Zur heutigen Ausgabe</a>
		</div>
	</div>
{:else}
	{#key data.metric.metric_key}
		<CurveReader metric={data.metric} {onDone} />
	{/key}
{/if}

<style>
	.sky-screen { position: relative; min-height: 100dvh; }
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
	.pill.ghost { background: none; border: 1px solid rgba(244, 239, 230, 0.28); color: var(--ink-text); }
	.pill.solid { background: var(--amber-hi); border: none; color: #fff; font-size: 15px; }
</style>
