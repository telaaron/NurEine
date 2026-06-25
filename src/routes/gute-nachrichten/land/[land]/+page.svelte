<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();

	const title = $derived(`Gute Nachrichten aus ${data.label} — NurEine`);
	const desc = $derived(
		`Belegte gute Nachrichten aus ${data.label}: positive Entwicklungen mit messbarem Wirkungsindex, kuratiert von NurEine. Kein Algorithmus, werbefrei.`
	);
	const canonical = $derived(`https://nureine.de/gute-nachrichten/land/${data.land}`);

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: `Gute Nachrichten aus ${data.label}`,
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
	<h1 class="page-h1 mt-3" style="color: var(--color-ink);">Gute Nachrichten aus {data.label}</h1>
	<p class="page-dek serif mt-5" style="color: var(--color-ink-soft);">
		Positive, belegte Entwicklungen aus {data.label} — bei <strong>NurEine</strong> kuratiert und mit
		einem messbaren <strong>Wirkungsindex</strong> versehen. Die {data.total} wirkungsstärksten Geschichten.
	</p>

	<div class="mt-10 space-y-3">
		{#each data.stories as s}
			<a href="{base}/geschichte/{s.slug}" class="flex items-center gap-4 rounded-2xl p-4" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
				<span class="display tnum text-xl shrink-0 w-12 text-center" style="color: var(--color-amber-deep); font-weight:600;">{s.impactScore}</span>
				<span class="min-w-0">
					<span class="display block" style="color: var(--color-ink); font-weight:500;">{s.title}</span>
					<span class="block text-sm mt-0.5" style="color: var(--color-muted);">{s.dek}</span>
				</span>
			</a>
		{/each}
	</div>

	<nav class="mt-12">
		<p class="eyebrow" style="color: var(--color-amber);">Weitere Länder</p>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each data.others as o}
				<a href="{base}/gute-nachrichten/land/{o.slug}" class="px-4 py-2 rounded-full text-sm" style="background: var(--color-canvas-soft); color: var(--color-ink-soft);">{o.label}</a>
			{/each}
		</div>
	</nav>

	<p class="mt-10 text-sm" style="color: var(--color-muted);">
		<a href="{base}/newsletter" class="underline" style="color: var(--color-amber-deep);">Newsletter</a>
		· <a href="{base}/methodik" class="underline" style="color: var(--color-amber-deep);">Methodik</a>
		· <a href="{base}/gute-nachrichten-app" class="underline" style="color: var(--color-amber-deep);">die App</a>
	</p>
</article>
