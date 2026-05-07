<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate, paragraphs, inline, toneStyles } from '$lib/utils';
	import StoryCard from '$lib/components/StoryCard.svelte';

	let { data } = $props();
	const story = $derived(data.story);
	const tone = $derived(toneStyles[story.tone]);
	const paras = $derived(paragraphs(story.body));
</script>

<svelte:head>
	<title>{story.title} — NurEine</title>
	<meta name="description" content={story.dek} />
</svelte:head>

<!-- Hero -->
<article>
	<header class="relative">
		<div
			class="absolute inset-0 pointer-events-none"
			aria-hidden="true"
			style="background:
        radial-gradient(ellipse 60% 80% at 30% 0%, {tone.bg}, transparent 60%),
        radial-gradient(ellipse 50% 60% at 80% 30%, {tone.bg}, transparent 70%);
        opacity: 0.8;"
		></div>

		<div class="relative mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-12 lg:pt-20 pb-8 sm:pb-10">
			<a
				href={base + '/'}
				class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] hover:opacity-70 rise"
				style="color: var(--color-muted);"
			>
				<span aria-hidden="true">←</span> Zurück zur Übersicht
			</a>

			<div class="mt-10 flex items-center gap-3 rise rise-d1">
				<span
					class="px-3 py-1 text-[10px] uppercase tracking-[0.18em] rounded-full"
					style="background: {tone.bg}; color: {tone.fg}; border: 1px solid {tone.ring};"
				>
					{story.category}
				</span>
				<span class="text-xs" style="color: var(--color-muted);">
					{story.country} · {story.region}
				</span>
			</div>

			<h1
				class="serif mt-6 leading-[1.05] tracking-tight text-[1.8rem] sm:text-[2.4rem] lg:text-[4.2rem] rise rise-d2"
				style="color: var(--color-ink); font-weight: 500;"
			>
				{story.title}
			</h1>

			<p
				class="mt-6 text-base sm:text-xl lg:text-2xl leading-snug max-w-[55ch] rise rise-d3"
				style="color: var(--color-ink-soft); font-family: var(--font-serif); font-style: italic;"
			>
				{story.dek}
			</p>

			<div
				class="mt-8 sm:mt-10 pt-4 sm:pt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-xs rise rise-d4"
				style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
			>
				<span>{formatDate(story.publishedAt)}</span>
				<span>{story.readingMinutes} Min. Lesezeit</span>
				<a
					href={story.sourceUrl}
					rel="noopener noreferrer"
					target="_blank"
					class="hover:opacity-70"
					style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);"
				>
					Quelle: {story.source}
				</a>
			</div>
		</div>
	</header>

	<!-- Body -->
	<div class="relative mx-auto max-w-[680px] px-4 sm:px-6 lg:px-0 prose-nureine">
		{#each paras as para, i (i)}
			{#if i === 0}
				<p class="dropcap" style="font-size: 1.28rem !important;">
					{@html inline(para)}
				</p>
			{:else}
				<p>{@html inline(para)}</p>
			{/if}
		{/each}

		<!-- Impact callout -->
		<aside
			class="not-prose my-8 sm:my-12 p-6 sm:p-8 rounded-[6px]"
			style="background: var(--color-canvas-soft); border-left: 3px solid {tone.fg};"
		>
			<p
				class="text-[11px] uppercase tracking-[0.22em]"
				style="color: {tone.fg}; font-weight: 500;"
			>
				Wirkungsindex
			</p>
			<div class="mt-3 flex items-baseline gap-3">
				<span
					class="serif tnum text-4xl sm:text-5xl"
					style="color: var(--color-ink); font-weight: 500;"
				>
					{story.impactScore}
				</span>
				<span class="text-base" style="color: var(--color-muted);">/ 100</span>
			</div>
			<p
				class="mt-3 text-sm leading-relaxed"
				style="color: var(--color-ink-soft); font-family: var(--font-serif);"
			>
				{story.impactNote}
			</p>
			<p class="mt-4 text-xs leading-relaxed" style="color: var(--color-muted);">
				Der NurEine-Wirkungsindex bewertet, wie viele Menschen messbar positiv beeinflusst
				werden — gewichtet nach Belegbarkeit, Reichweite und Dauerhaftigkeit. Methodik:
				<a
					class="underline"
					href={base + '/manifest#methodik'}
					style="color: var(--color-ink-soft);"
				>
					Manifest §3
				</a>.
			</p>
		</aside>
	</div>

	<!-- Nav prev/next -->
	<nav
		class="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
		aria-label="Weitere Geschichten"
	>
		{#if data.prev}
			<a
				href={base + '/geschichte/' + data.prev.slug}
				class="paper p-4 sm:p-6 rounded-[6px] block hover:opacity-90"
				style="border: 1px solid var(--color-rule);"
			>
				<p class="text-[11px] uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Vorherige
				</p>
				<p class="serif mt-2 leading-snug" style="color: var(--color-ink);">{data.prev.title}</p>
			</a>
		{:else}
			<div></div>
		{/if}
		{#if data.next}
			<a
				href={base + '/geschichte/' + data.next.slug}
				class="paper p-4 sm:p-6 rounded-[6px] block hover:opacity-90 text-right"
				style="border: 1px solid var(--color-rule);"
			>
				<p class="text-[11px] uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Nächste
				</p>
				<p class="serif mt-2 leading-snug" style="color: var(--color-ink);">{data.next.title}</p>
			</a>
		{:else}
			<div></div>
		{/if}
	</nav>

	<!-- Related -->
	{#if data.related.length}
		<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 mt-14 sm:mt-24">
			<h2
				class="serif text-xl sm:text-2xl mb-6 sm:mb-8"
				style="color: var(--color-ink); font-weight: 500;"
			>
				Weiteres aus {story.category}
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
				{#each data.related as r (r.slug)}
					<StoryCard story={r} />
				{/each}
			</div>
		</section>
	{/if}
</article>
