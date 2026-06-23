<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();

	const title = $derived(`Gute Nachrichten über ${data.label} — NurEine`);
	const desc = $derived(
		`Belegte gute Nachrichten zum Thema ${data.label}: kuratiert, mit messbarem Wirkungsindex, eine pro Tag. Kein Algorithmus, werbefrei — von NurEine.`
	);
	const canonical = $derived(`https://nureine.de/gute-nachrichten/${data.thema}`);

	// ItemList JSON-LD so search + AI engines see the story collection cleanly.
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: `Gute Nachrichten über ${data.label}`,
			description: desc,
			url: canonical,
			isPartOf: { '@type': 'WebSite', name: 'NurEine', url: 'https://nureine.de' },
			mainEntity: {
				'@type': 'ItemList',
				numberOfItems: data.stories.length,
				itemListElement: data.stories.slice(0, 10).map((s, i) => ({
					'@type': 'ListItem',
					position: i + 1,
					url: `https://nureine.de/geschichte/${s.slug}`,
					name: s.title
				}))
			}
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href={canonical} />
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<article class="mx-auto max-w-[820px] px-5 sm:px-6 py-12 sm:py-16">
	<p class="eyebrow" style="color: var(--color-amber);">Gute Nachrichten · {data.label}</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink);">Gute Nachrichten über {data.label}</h1>
	<p class="page-dek serif mt-5" style="color: var(--color-ink-soft);">
		Belegte, positive Entwicklungen rund um {data.label} — bei <strong>NurEine</strong> kuratiert und
		mit einem messbaren <strong>Wirkungsindex</strong> versehen. Hier die {data.total} wirkungsstärksten
		Geschichten.
	</p>

	<div class="mt-10 space-y-3">
		{#each data.stories as s}
			<a
				href="{base}/geschichte/{s.slug}"
				class="flex items-center gap-4 rounded-2xl p-4 transition-colors"
				style="background: var(--color-paper); border: 1px solid var(--color-rule);"
			>
				<span class="display tnum text-xl shrink-0 w-12 text-center" style="color: var(--color-amber-deep); font-weight:600;">
					{s.impactScore}
				</span>
				<span class="min-w-0">
					<span class="display block" style="color: var(--color-ink); font-weight:500;">{s.title}</span>
					<span class="block text-sm mt-0.5" style="color: var(--color-muted);">{s.dek}</span>
				</span>
			</a>
		{/each}
	</div>

	<nav class="mt-12">
		<p class="eyebrow" style="color: var(--color-amber);">Weitere Themen</p>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each data.otherThemes as t}
				<a
					href="{base}/gute-nachrichten/{t.slug}"
					class="px-4 py-2 rounded-full text-sm"
					style="background: var(--color-canvas-soft); color: var(--color-ink-soft);"
				>
					{t.emoji} {t.label}
				</a>
			{/each}
		</div>
	</nav>

	<p class="mt-10 text-sm" style="color: var(--color-muted);">
		Jeden Morgen eine gute Nachricht?
		<a href="{base}/newsletter" class="underline" style="color: var(--color-amber-deep);">Newsletter abonnieren</a>
		· <a href="{base}/methodik" class="underline" style="color: var(--color-amber-deep);">unsere Methodik</a>
	</p>
</article>
