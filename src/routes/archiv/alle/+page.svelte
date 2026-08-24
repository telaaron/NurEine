<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();

	const MONATE = [
		'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
		'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
	];

	// Nach Monat gruppiert — macht die Liste auch fuer Menschen navigierbar
	// statt als 1300-Zeilen-Wand. Reihenfolge kommt schon sortiert aus der DB
	// (published_at DESC), also reicht ein einfaches Durchlaufen.
	const gruppen = $derived.by(() => {
		const out: { key: string; label: string; stories: typeof data.stories }[] = [];
		for (const s of data.stories) {
			const d = (s.publishedAt || '').slice(0, 7); // YYYY-MM
			const letzte = out[out.length - 1];
			if (letzte && letzte.key === d) {
				letzte.stories.push(s);
			} else {
				const [j, m] = d.split('-');
				const label = j && m ? `${MONATE[Number(m) - 1]} ${j}` : 'Ohne Datum';
				out.push({ key: d, label, stories: [s] });
			}
		}
		return out;
	});
</script>

<svelte:head>
	<!-- Title + description kommen aus +layout.svelte (pathTitles / pathDescriptions) -->
	<link rel="canonical" href="https://nureine.de/archiv/alle" />
</svelte:head>

<section class="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
	<a href={base + '/archiv'} class="text-sm" style="color: var(--color-muted);">← Zum Archiv</a>

	<p class="eyebrow mt-4" style="color: var(--color-amber);">Verzeichnis</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink); font-weight: 700;">
		Alle Geschichten
	</h1>
	<p
		class="mt-4 text-base sm:text-lg leading-relaxed"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Jede Geschichte, die NurEine je veröffentlicht hat — chronologisch, ungefiltert.
		Für das Stöbern nach Thema, Wirkung oder Ort ist
		<a href={base + '/archiv'} style="color: var(--color-amber);">das Archiv</a> der bessere Ort.
	</p>
	<p class="mt-2 text-sm tnum" style="color: var(--color-faint); font-family: var(--font-mono);">
		{data.stories.length} Geschichten
	</p>

	<div class="mt-10 flex flex-col gap-8">
		{#each gruppen as gruppe (gruppe.key)}
			<div>
				<h2
					class="serif text-lg sm:text-xl pb-2"
					style="color: var(--color-ink); font-weight: 500; border-bottom: 1px solid var(--color-rule);"
				>
					{gruppe.label}
					<span class="text-sm tnum" style="color: var(--color-faint); font-family: var(--font-mono);">
						· {gruppe.stories.length}
					</span>
				</h2>
				<ul class="mt-3 flex flex-col gap-1.5">
					{#each gruppe.stories as story (story.slug)}
						<li class="text-sm sm:text-base leading-snug">
							<a
								href={base + '/geschichte/' + story.slug}
								class="hover:opacity-70"
								style="color: var(--color-ink-soft);"
							>
								{story.title}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</section>
