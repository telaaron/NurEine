<script lang="ts">
	import StoryCard from '$lib/components/StoryCard.svelte';

	let { data } = $props();
	const stories = $derived(data.stories);

	const cats = ['Alle', 'Klima', 'Gesundheit', 'Wissenschaft', 'Gemeinschaft', 'Tiere', 'Kultur', 'Innovation'] as const;
	let active = $state<(typeof cats)[number]>('Alle');
	let sortBy = $state<'date' | 'impact'>('date');
	let filterOpen = $state(false);

	const filtered = $derived(
		(active === 'Alle' ? stories : stories.filter((s) => s.category.toLowerCase() === active.toLowerCase())).slice().sort((a, b) => {
			if (sortBy === 'impact') return b.impactScore - a.impactScore;
			return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
		})
	);

	function pick(cat: (typeof cats)[number]) {
		active = cat;
		filterOpen = false;
	}
</script>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-16 pb-10 sm:pb-12">
	<p class="eyebrow rise" style="color: var(--color-amber);">
		Archiv
	</p>
	<h1
		class="serif page-h1 mt-3 rise rise-d1"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Jede Geschichte, geordnet zum Wiederlesen.
	</h1>
	<p
		class="page-dek mt-5 max-w-none sm:max-w-[55ch] leading-relaxed rise rise-d2"
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
	<div class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center gap-4">
		<!-- Category dropdown -->
		<div class="relative">
			<button
				type="button"
				onclick={() => (filterOpen = !filterOpen)}
				class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
				style="border: 1px solid var(--color-rule); color: var(--color-ink);"
			>
				{active}
				<svg class="w-3 h-3 transition-transform" style="transform: {filterOpen ? 'rotate(180deg)' : 'rotate(0)'};" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m1 1 4 4 4-4"/></svg>
			</button>
			{#if filterOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="fixed inset-0 z-10"
					onclick={() => (filterOpen = false)}
					role="button"
					aria-label="Filter schließen"
				></div>
				<div class="absolute top-full left-0 mt-1 z-20 min-w-[180px] paper border rounded-xl shadow-lg overflow-hidden" style="border-color: var(--color-rule);">
					{#each cats as cat}
						<button
							type="button"
							onclick={() => pick(cat)}
							class="w-full text-left px-4 py-2.5 text-sm transition-colors"
							style="background: {active === cat ? 'var(--color-canvas-soft)' : 'transparent'};
								color: {active === cat ? 'var(--color-ink)' : 'var(--color-ink-soft)'};
								font-weight: {active === cat ? '500' : '400'};"
						>
							{cat}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Sort toggles -->
		<div class="flex items-center gap-2 text-xs ml-auto lg:ml-0" style="color: var(--color-muted);">
			<span class="hidden sm:inline uppercase tracking-[0.16em]">Sortierung</span>
			<div class="flex items-center rounded-full p-0.5" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
				<button
					type="button"
					onclick={() => (sortBy = 'date')}
					class="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all"
					style="background: {sortBy === 'date' ? 'var(--color-ink)' : 'transparent'};
						color: {sortBy === 'date' ? 'var(--color-paper)' : 'var(--color-muted)'};"
				>
					Datum
				</button>
				<button
					type="button"
					onclick={() => (sortBy = 'impact')}
					class="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all"
					style="background: {sortBy === 'impact' ? 'var(--color-ink)' : 'transparent'};
						color: {sortBy === 'impact' ? 'var(--color-paper)' : 'var(--color-muted)'};"
				>
					Wirkung
				</button>
			</div>
		</div>
	</div>
</section>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
	<p class="text-xs sm:text-sm mb-6 sm:mb-8" style="color: var(--color-muted);">
		{filtered.length} {filtered.length === 1 ? 'Geschichte' : 'Geschichten'}
	</p>
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
		{#each filtered as story, i (story.slug)}
			<div class="rise" style="animation-delay: {Math.min(i * 0.04, 0.6)}s;">
				<StoryCard {story} />
			</div>
		{/each}
	</div>
</section>
