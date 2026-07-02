<script lang="ts">
	import { base } from '$app/paths';
	import ShareBar from '$lib/components/ShareBar.svelte';

	let { data } = $props();
	const url = 'https://nureine.de/redaktion';

	const BEAT_LABELS: Record<string, string> = {
		'klima-energie': 'Klima & Energie',
		'gesundheit-forschung': 'Gesundheit & Forschung',
		'gesellschaft-bildung': 'Gesellschaft & Bildung',
		'innovation-wirtschaft': 'Innovation & Wirtschaft',
		'staedte-kommunen': 'Städte & Kommunen'
	};
	const TYPE_LABELS: Record<string, string> = {
		peer_review: 'Peer-Review', official_stats: 'Offizielle Statistik', registry: 'Register',
		open_data: 'Open Data', gov: 'Behörde', ngo: 'NGO', media: 'Fachquelle'
	};
	const beatLabel = (b: string) => BEAT_LABELS[b] ?? b;
</script>

<svelte:head>
	<title>So arbeitet NurEine — Unsere Quellen & Beats</title>
	<meta name="description" content="Transparenz statt Blackbox: Welche Primärquellen NurEine pro Themen-Beat beobachtet — und warum wir Daten statt Lärm folgen." />
	<link rel="canonical" href={url} />
</svelte:head>

<section class="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<p class="eyebrow" style="color: var(--color-amber);">Die Redaktion</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink); font-weight: 700;">
		So finden wir, was zählt.
	</h1>
	<p class="mt-6 text-lg leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		Die meisten Nachrichtenseiten wiederholen denselben Lärm. NurEine geht einen anderen Weg:
		Wir beobachten <strong>Primärquellen direkt</strong> — offizielle Statistiken, Forschungs­publikationen,
		Fachredaktionen — und finden die großen, aber leisen Geschichten, die nie durch die Filter der
		großen Medien kommen. Entschieden wird nach <strong>Wirkung, nicht nach Lautstärke</strong>.
	</p>

	<!-- Kennzahlen -->
	<div class="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
		<div class="paper rounded-[10px] p-5 text-center" style="border:1px solid var(--color-rule);">
			<div class="serif text-3xl" style="color: var(--color-ink);">{data.totalSources}</div>
			<div class="text-xs mt-1" style="color: var(--color-muted);">aktive Quellen</div>
		</div>
		<div class="paper rounded-[10px] p-5 text-center" style="border:1px solid var(--color-rule);">
			<div class="serif text-3xl" style="color: var(--color-ink);">{data.beats.length}</div>
			<div class="text-xs mt-1" style="color: var(--color-muted);">Themen-Beats</div>
		</div>
		<div class="paper rounded-[10px] p-5 text-center" style="border:1px solid var(--color-rule);">
			<div class="serif text-3xl" style="color: var(--color-amber);">{data.primaryStoriesTotal}</div>
			<div class="text-xs mt-1" style="color: var(--color-muted);">aus offiziellen Daten</div>
		</div>
	</div>

	<!-- Beats + Quellen -->
	<div class="mt-12 flex flex-col gap-5">
		{#each data.beats as group}
			<div class="paper rounded-[12px] p-5 sm:p-6" style="border:1px solid var(--color-rule);">
				<div class="flex items-baseline justify-between gap-3 flex-wrap">
					<h2 class="display text-xl" style="color: var(--color-ink); font-weight: 600;">{beatLabel(group.beat)}</h2>
					<span class="text-xs" style="color: var(--color-muted); font-family: var(--font-mono);">{group.finds} Funde · 30 Tage</span>
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each group.sources as s}
						<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style="background: var(--color-canvas-soft); border:1px solid var(--color-rule); color: var(--color-ink-soft);">
							{#if s.primary}<span style="width:6px;height:6px;border-radius:6px;background:var(--color-amber);"></span>{/if}
							{s.name}
							{#if s.type}<span style="color: var(--color-faint);">· {TYPE_LABELS[s.type] ?? s.type}</span>{/if}
						</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<p class="mt-8 text-sm" style="color: var(--color-muted); font-family: var(--font-serif);">
		<span style="display:inline-block;width:6px;height:6px;border-radius:6px;background:var(--color-amber);vertical-align:middle;margin-right:4px;"></span>
		= Primärquelle (offizielle Statistik, Peer-Review, Register). Jede Geschichte zeigt
		ihren Beat und Quellentyp offen an — prüf uns nach.
	</p>

	<!-- Wer dahintersteht: das menschliche Gesicht hinter der autonomen Redaktion. -->
	<div class="mt-16 pt-12" style="border-top:1px solid var(--color-rule);">
		<p class="eyebrow" style="color: var(--color-amber);">Wer dahintersteht</p>
		<div class="mt-6 flex flex-col sm:flex-row gap-8 items-start">
			<img
				src="{base}/images/Aaron.webp"
				alt="Aaron Weege, Gründer von NurEine"
				width="200"
				height="267"
				class="rounded-[12px] w-full sm:w-[200px] shrink-0"
				style="object-fit: cover; border:1px solid var(--color-rule); box-shadow: var(--shadow-md);"
				loading="lazy"
			/>
			<div class="text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
				<p>
					Ich bin <strong>Aaron</strong>, 20, Musiker aus Teltow und ich habe schon früh aufgehört,
					Nachrichten zu schauen. Es blieb dieses Wichtig-Gefühl, aber ohne dass ich je etwas
					verändern konnte: machtlos die negative Energie von Problemen aufsaugen, die nicht
					meine waren. Das fand ich nie logisch.
				</p>
				<p class="mt-4">
					Als ich hautnah erlebte, wie ein Algorithmus die Stimmung eines ganzen Menschen für einen kompletten Tag
					verändert, da wurde mir klar: Die Nachrichtenlage ist nicht
					die Welt. Sie ist eine Auswahl. Und diese Auswahl trifft jemand für dich.
				</p>
				<p class="mt-4">
					NurEine trifft sie anders: eine belegte Geschichte pro Tag, die zeigt, wo es
					wirklich vorangeht. Die Recherche und die Texte übernimmt eine KI-Redaktion,
					transparent und nachprüfbar — verantwortet von einem Menschen. Von mir.
				</p>
				<p class="mt-4 text-sm" style="color: var(--color-muted);">— Aaron Weege, Gründer</p>
			</div>
		</div>
	</div>

	<div class="mt-12 pt-8 flex items-center justify-between" style="border-top:1px solid var(--color-rule);">
		<div class="flex gap-4 text-sm">
			<a href={base + '/werte'} class="hover:opacity-70" style="color: var(--color-amber);">Unsere Werte →</a>
			<a href={base + '/methodik'} class="hover:opacity-70" style="color: var(--color-amber);">Methodik →</a>
		</div>
		<ShareBar {url} title="So arbeitet NurEine" text="Primärquellen statt Lärm — Transparenz statt Blackbox." />
	</div>
</section>
