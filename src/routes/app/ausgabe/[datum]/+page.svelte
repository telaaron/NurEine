<script lang="ts">
	// Reader per Datum. Dieselbe Ritual→Himmel-Erfahrung für eine Tages-Ausgabe.
	import RitualScreen from '$lib/app-v2/RitualScreen.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.story.title} · NurEine</title>
</svelte:head>

<RitualScreen story={data.story} kind="story" />
