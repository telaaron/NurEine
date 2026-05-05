<script lang="ts">
	import StoryCard from '$lib/components/StoryCard.svelte';

	let { data } = $props();
	const stories = $derived(data.stories);

	const cats = ['Alle', 'Klima', 'Gesundheit', 'Wissenschaft', 'Gemeinschaft', 'Tiere', 'Kultur', 'Innovation'] as const;
	let active = $state<(typeof cats)[number]>('Alle');
	let sortBy = $state<'date' | 'impact'>('date');

	const filtered = $derived(
		(active === 'Alle' ? stories : stories.filter((s) => s.category === active)).slice().sort((a, b) => {
			if (sortBy === 'impact') return b.impactScore - a.impactScore;
			return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
		})
	);
</script>

<svelte:head>
	<title>Archiv — Lichtblick</title>
</svelte:head>

<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pt-12 lg:pt-16 pb-12">
	<p class="text-[11px] uppercase tracking-[0.22em] rise" style="color: var(--color-amber); font-weight: 500;">
		Archiv
	</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[2.4rem] lg:text-[3.6rem] rise rise-d1"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Jede Geschichte, geordnet zum Wiederlesen.
	</h1>
	<p
		class="mt-5 max-w-[55ch] text-lg leading-relaxed rise rise-d2"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Wir veröffentlichen täglich eine Hauptgeschichte und kuratieren wöchentlich. Hier findest du
		alles, sortiert nach Datum oder nach gemessener Wirkung.
	</p>
</section>

<!-- Filter strip -->
<section
	class="border-t border-b sticky top-0 z-10 backdrop-blur-md"
	style="border-color: var(--color-rule); background: rgba(245, 241, 234, 0.85);"
>
	<div class="mx-auto max-w-[1180px] px-6 lg:px-10 py-4 flex flex-wrap items-center gap-4">
		<div class="flex flex-wrap items-center gap-2 flex-1">
			{#each cats as cat}
				<button
					type="button"
					onclick={() => (active = cat)}
					class="px-3 py-1.5 text-sm rounded-full transition-all"
					style="border: 1px solid {active === cat ? 'var(--color-ink)' : 'var(--color-rule)'};
            background: {active === cat ? 'var(--color-ink)' : 'transparent'};
            color: {active === cat ? 'var(--color-paper)' : 'var(--color-ink-soft)'};"
				>
					{cat}
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-2 text-xs" style="color: var(--color-muted);">
			<span class="uppercase tracking-[0.16em]">Sortierung</span>
			<button
				type="button"
				onclick={() => (sortBy = 'date')}
				class="px-2 py-1 rounded"
				style="color: {sortBy === 'date' ? 'var(--color-ink)' : 'var(--color-muted)'};
          border-bottom: 1px solid {sortBy === 'date' ? 'var(--color-amber)' : 'transparent'};"
			>
				Datum
			</button>
			<button
				type="button"
				onclick={() => (sortBy = 'impact')}
				class="px-2 py-1 rounded"
				style="color: {sortBy === 'impact' ? 'var(--color-ink)' : 'var(--color-muted)'};
          border-bottom: 1px solid {sortBy === 'impact' ? 'var(--color-amber)' : 'transparent'};"
			>
				Wirkung
			</button>
		</div>
	</div>
</section>

<section class="mx-auto max-w-[1180px] px-6 lg:px-10 py-14">
	<p class="text-sm mb-8" style="color: var(--color-muted);">
		{filtered.length} {filtered.length === 1 ? 'Geschichte' : 'Geschichten'}
	</p>
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
		{#each filtered as story, i (story.slug)}
			<div class="rise" style="animation-delay: {Math.min(i * 0.04, 0.6)}s;">
				<StoryCard {story} />
			</div>
		{/each}
	</div>
</section>
