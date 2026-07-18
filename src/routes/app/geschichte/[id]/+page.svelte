<script lang="ts">
	// Reader per Story-ID (Push-Deep-Link-Ziel). Dieselbe Ritual→Himmel-Erfahrung
	// wie die heutige Ausgabe, nur für eine bestimmte Geschichte.
	import RitualScreen from '$lib/app-v2/RitualScreen.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.story.title} · NurEine</title>
</svelte:head>

<RitualScreen story={data.story} kind="story" />
