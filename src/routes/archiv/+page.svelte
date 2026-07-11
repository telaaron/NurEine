<script lang="ts">
	import ArchivePulse from '$lib/components/ArchivePulse.svelte';
	import ArchiveTrace from '$lib/components/ArchiveTrace.svelte';
	import ArchiveLogbook from '$lib/components/ArchiveLogbook.svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	let { data } = $props();
	const stories = $derived(data.stories);

	// Drei Archiv-Ansichten (Aaron testet, entscheidet). Standard: Puls.
	type ViewMode = 'pulse' | 'trace' | 'logbook';
	const VIEWS: { id: ViewMode; label: string }[] = [
		{ id: 'pulse', label: 'Puls' },
		{ id: 'trace', label: 'Spur' },
		{ id: 'logbook', label: 'Logbuch' }
	];
	let view = $state<ViewMode>((($page.url.searchParams.get('v') as ViewMode) ?? 'pulse'));

	const cats = ['Alle', 'Klima', 'Gesundheit', 'Wissenschaft', 'Gemeinschaft', 'Tiere', 'Kultur', 'Innovation'] as const;
	let active = $state<(typeof cats)[number]>('Alle');
	// Standard-Qualitätsfilter (Aaron 2026-07-09): nur Stories mit Wirkung ≥65 zeigen
	// — so wirkt das Archiv durchgängig stark & bebildert. Auf 0 umschaltbar („alle").
	const MIN_IMPACT_DEFAULT = 65;
	let minImpact = $state(MIN_IMPACT_DEFAULT);
	let filterOpen = $state(false);
	// Suchbegriff aus ?q= übernehmen (Sitelinks-Searchbox / Deep-Links).
	let query = $state($page.url.searchParams.get('q') ?? '');

	// Suche: über Titel, Untertitel, Zusammenfassung, Kategorie UND Region. Wir nutzen
	// die KI-Zusammenfassung (summary) statt des vollen Fließtexts — die Listen-Query
	// lädt body_markdown bewusst nicht (700+ Stories × 2 kB). Mehrere Wörter = UND.
	function matches(s: (typeof stories)[number], terms: string[]): boolean {
		const hay = `${s.title} ${s.dek} ${s.summary} ${s.category} ${s.country}`.toLowerCase();
		return terms.every((t) => hay.includes(t));
	}

	// Die Zeitreise-Ansichten ordnen selbst nach Datum/Monat — hier nur FILTERN,
	// nicht sortieren.
	const filtered = $derived.by(() => {
		const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
		let list = active === 'Alle' ? stories : stories.filter((s) => s.category.toLowerCase() === active.toLowerCase());
		if (minImpact > 0) list = list.filter((s) => (s.impactScore ?? 0) >= minImpact);
		if (terms.length) list = list.filter((s) => matches(s, terms));
		return list;
	});

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
		class="page-h1 mt-3 rise rise-d1"
		style="color: var(--color-ink); font-weight: 700;"
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

		<!-- Ansicht-Umschalter: Puls / Spur / Logbuch -->
		<div class="flex items-center gap-2 text-xs ml-auto lg:ml-0" style="color: var(--color-muted);">
			<span class="hidden sm:inline uppercase tracking-[0.16em]">Ansicht</span>
			<div class="flex items-center rounded-full p-0.5" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
				{#each VIEWS as v}
					<button
						type="button"
						onclick={() => (view = v.id)}
						class="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all"
						style="background: {view === v.id ? 'var(--color-ink)' : 'transparent'};
							color: {view === v.id ? 'var(--color-paper)' : 'var(--color-muted)'};"
					>
						{v.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Qualitaets-Filter: nur starke Stories (Wirkung >=65) oder alle -->
		<div class="flex items-center gap-2 text-xs mt-3 lg:mt-0" style="color: var(--color-muted);">
			<div class="flex items-center rounded-full p-0.5" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
				<button type="button" onclick={() => (minImpact = MIN_IMPACT_DEFAULT)} class="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all" style="background: {minImpact > 0 ? 'var(--color-ink)' : 'transparent'}; color: {minImpact > 0 ? 'var(--color-paper)' : 'var(--color-muted)'};">Nur starke</button>
				<button type="button" onclick={() => (minImpact = 0)} class="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all" style="background: {minImpact === 0 ? 'var(--color-ink)' : 'transparent'}; color: {minImpact === 0 ? 'var(--color-paper)' : 'var(--color-muted)'};">Alle</button>
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
	{:else if view === 'trace'}
		<ArchiveTrace stories={filtered} />
	{:else if view === 'logbook'}
		<ArchiveLogbook stories={filtered} />
	{:else}
		<ArchivePulse stories={filtered} />
	{/if}

	<!--
		Crawl-only Linkliste: nur 24 Karten werden visuell gerendert (DOM-Größe),
		aber Googlebot soll JEDE Geschichte über das Archiv erreichen — sonst
		hängen hunderte Stories hinter einem JS-„Mehr laden"-Klick. Reiner Text,
		keine Bilder → vernachlässigbares DOM-Gewicht. Visuell versteckt, Links folgbar.
	-->
	<nav aria-label="Alle Geschichten im Archiv" class="archive-crawl-index">
		<ul>
			{#each filtered as story (story.slug)}
				<li><a href={base + '/geschichte/' + story.slug}>{story.title}</a></li>
			{/each}
		</ul>
	</nav>
</section>

<style>
	/* Sichtbar für Crawler, unsichtbar für Menschen (kein display:none — sonst
	   würden manche Bots die Links ignorieren). Klassisches sr-only-Muster. */
	.archive-crawl-index {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
