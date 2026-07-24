<script lang="ts">
	import VariantLiveFeed from './VariantLiveFeed.svelte';

	let { data } = $props();
	const stories = $derived(data.stories ?? []);
</script>

<svelte:head><title>Karte der Hoffnung — NurEine</title></svelte:head>

<VariantLiveFeed {stories} />
