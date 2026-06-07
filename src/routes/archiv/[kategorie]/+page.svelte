<script lang="ts">
	import StoryCard from '$lib/components/StoryCard.svelte';
	import { base } from '$app/paths';

	let { data } = $props();
	const stories = $derived(
		data.stories.slice().sort((a, b) => b.impactScore - a.impactScore)
	);
</script>

<svelte:head>
	<title>{data.label} — gute Nachrichten | NurEine</title>
	<meta name="description" content={data.intro} />
</svelte:head>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-16 pb-6">
	<a href={base + '/archiv'} class="text-sm" style="color: var(--color-muted);">← Ganzes Archiv</a>
	<p class="eyebrow mt-4" style="color: var(--color-amber);">Kategorie</p>
	<h1 class="serif page-h1 mt-3" style="color: var(--color-ink);">{data.label}</h1>
	<p class="mt-3 text-base sm:text-lg leading-relaxed max-w-[640px]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		{data.intro}
	</p>
	<p class="mt-2 text-sm" style="color: var(--color-faint); font-family: var(--font-mono);">{stories.length} Geschichten</p>
</section>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-16">
	{#if stories.length}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
			{#each stories as story (story.slug)}
				<StoryCard {story} />
			{/each}
		</div>
	{:else}
		<p class="text-sm" style="color: var(--color-faint); font-family: var(--font-serif);">Noch keine Geschichten in dieser Kategorie.</p>
	{/if}
</section>
