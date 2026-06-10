<script lang="ts">
	import StoryCard from '$lib/components/StoryCard.svelte';

	let { data } = $props();
	const stories = $derived(data.stories);

	const cats = ['Alle', 'Klima', 'Gesundheit', 'Wissenschaft', 'Gemeinschaft', 'Tiere', 'Kultur', 'Innovation'] as const;
	let active = $state<(typeof cats)[number]>('Alle');
	// Default: stärkste Wirkung zuerst (kuratiertes Gefühl). Manuell auf Datum wechselbar.
	let sortBy = $state<'date' | 'impact'>('impact');
	let filterOpen = $state(false);
	let query = $state('');

	// Volltext-Suche: findet über Titel, Untertitel, Fließtext, Kategorie UND Region —
	// nicht nur Titel. Mehrere Wörter = UND-Verknüpfung (jedes Wort muss vorkommen).
	function matches(s: (typeof stories)[number], terms: string[]): boolean {
		const hay = `${s.title} ${s.dek} ${s.body} ${s.category} ${s.country}`.toLowerCase();
		return terms.every((t) => hay.includes(t));
	}

	const filtered = $derived.by(() => {
		const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
		let list = active === 'Alle' ? stories : stories.filter((s) => s.category.toLowerCase() === active.toLowerCase());
		if (terms.length) list = list.filter((s) => matches(s, terms));
		return list.slice().sort((a, b) => {
			if (sortBy === 'impact') return b.impactScore - a.impactScore;
			return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
		});
	});

	// Progressive Anzeige: nur die ersten N rendern (sonst hunderte img-Tags → riesiges DOM/HTML).
	const PAGE = 24;
	let shown = $state(PAGE);
	$effect(() => { void active; void sortBy; void query; shown = PAGE; }); // Filter/Sort/Such-Wechsel → reset
	const visible = $derived(filtered.slice(0, shown));

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

		<!-- Volltext-Suche -->
		<div class="relative flex-1 min-w-0 max-w-[340px]">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-faint);">
				<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
			<!-- type=text statt search: 'search' rendert ein zweites natives Clear-X
			     zusätzlich zu unserem → Doppel-Button. -->
			<input
				type="text"
				bind:value={query}
				placeholder="Suchen — Thema, Ort, Stichwort…"
				class="w-full pl-9 pr-8 py-1.5 rounded-full text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
			/>
			{#if query}
				<button type="button" onclick={() => (query = '')} aria-label="Suche löschen"
					class="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-70" style="color: var(--color-muted);">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
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
		{filtered.length} {filtered.length === 1 ? 'Geschichte' : 'Geschichten'}{#if query}{' '}für „{query}"{/if}
	</p>
	{#if filtered.length === 0}
		<div class="py-16 text-center">
			<p class="serif text-lg" style="color: var(--color-ink-soft);">Nichts gefunden{#if query}{' '}für „{query}"{/if}.</p>
			<p class="mt-2 text-sm" style="color: var(--color-muted);">Versuch ein anderes Stichwort, einen Ort oder eine Kategorie.</p>
			{#if query}
				<button type="button" onclick={() => (query = '')} class="mt-4 px-4 py-2 rounded-full text-sm font-medium" style="background: var(--color-ink); color: var(--color-paper);">Suche zurücksetzen</button>
			{/if}
		</div>
	{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
		{#each visible as story, i (story.slug)}
			<div class="rise" style="animation-delay: {Math.min(i * 0.04, 0.6)}s;">
				<StoryCard {story} />
			</div>
		{/each}
	</div>
	{/if}
	{#if shown < filtered.length}
		<div class="mt-10 flex justify-center">
			<button type="button" onclick={() => (shown += PAGE)} class="px-6 py-3 rounded-full text-sm font-medium" style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);">
				Mehr laden ({filtered.length - shown})
			</button>
		</div>
	{/if}
</section>
