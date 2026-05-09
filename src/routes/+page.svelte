<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate, toneStyles } from '$lib/utils';
	import StoryCard from '$lib/components/StoryCard.svelte';
	import ShareBar from '$lib/components/ShareBar.svelte';

	let { data } = $props();
	const featured = $derived(data.featured);
	const tone = $derived(featured ? toneStyles[featured.tone] : toneStyles['amber']);
	const rest = $derived(data.rest);

	const baseUrl = $derived(data.baseUrl || 'https://nureine.de');
	const featuredUrl = $derived(featured ? `${baseUrl}/geschichte/${featured.slug}` : baseUrl);
	const ogImageUrl = $derived(featured ? `${baseUrl}/api/og/${featured.slug}` : `${baseUrl}/NurEine.svg`);
	const pageTitle = $derived(featured ? `${featured.title} — NurEine` : 'NurEine — Gute Nachrichten. Jeden Tag exakt eine.');
	const pageDesc = $derived(featured ? featured.dek : 'NurEine filtert tausende Quellen mit KI auf das Wesentliche: Geschichten, die zeigen, dass die Welt voranschreitet.');

	const today = new Date();
	const dateLong = today.toLocaleDateString('de-DE', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDesc} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDesc} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:url" content={baseUrl} />
	<link rel="canonical" href={baseUrl} />
</svelte:head>

<!-- Hero — daily story -->
<section class="relative overflow-hidden">
	<div
		class="absolute inset-0 sun-glow pointer-events-none"
		aria-hidden="true"
		style="opacity: 0.7;"
	></div>

	<div class="relative mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-16 pb-14 sm:pb-16 lg:pb-20">
		<div class="flex items-center gap-3 rise">
			<span
				class="inline-block w-6 sm:w-8 h-px"
				style="background: var(--color-amber);"
				aria-hidden="true"
			></span>
			<span class="eyebrow" style="color: var(--color-amber);">
				Eine gute Nachricht heute
			</span>
		</div>

		<p
			class="mt-2 sm:mt-3 text-xs sm:text-sm rise rise-d1"
			style="color: var(--color-muted); font-family: var(--font-serif);"
		>
			{dateLong}
		</p>

		{#if featured}
			<a href={base + '/geschichte/' + featured.slug} class="block mt-4 sm:mt-6 group rise rise-d2">
				<h1
					class="serif tracking-tight leading-[1.04] text-[2.5rem] sm:text-[2.8rem] md:text-[3.6rem] lg:text-[5rem] xl:text-[5.6rem] max-w-[18ch]"
					style="color: var(--color-ink); font-weight: 500;"
				>
					{featured.title}
				</h1>
				<p
					class="page-dek mt-4 sm:mt-6 lg:mt-7 sm:text-lg lg:text-2xl leading-snug max-w-[62ch]"
					style="color: var(--color-ink-soft); font-family: var(--font-serif);"
				>
					{featured.dek}
				</p>
			</a>

			<div class="mt-7 sm:mt-10 space-y-4 rise rise-d3">
				<div class="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
					<a
						href={base + '/geschichte/' + featured.slug}
						class="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all"
						style="background: var(--color-ink); color: var(--color-paper);"
					>
						Geschichte lesen
						<span aria-hidden="true">→</span>
					</a>
					<span class="flex items-center gap-2" style="color: var(--color-muted);">
						<span
							class="inline-block w-1.5 h-1.5 rounded-full"
							aria-hidden="true"
							style="background: {tone.fg};"
						></span>
						{featured.readingMinutes} Min. · Wirkung {featured.impactScore}/100 · {featured.country}
					</span>
				</div>
				<div class="flex items-center">
					<ShareBar url={featuredUrl} title={featured.title} text={featured.dek} showLabel={true} />
				</div>
			</div>
		{:else}
			<p class="mt-6 serif text-xl" style="color: var(--color-muted);">
				Noch keine Geschichten geladen. Bitte versuche es später erneut.
			</p>
		{/if}
	</div>

	<!-- Compass strip — quiet metadata -->
	<div class="border-t border-b" style="border-color: var(--color-rule); background: var(--color-canvas-soft);">
		<div
			class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 py-4 sm:py-5 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 footer-heading"
		>
			<div>
				<p class="uppercase tracking-[0.18em]" style="color: var(--color-faint);">Heute kuratiert</p>
				<p class="mt-1 sm:mt-1.5 serif text-lg sm:text-2xl tnum" style="color: var(--color-ink);">
					{data.stats.storiesCount}
				</p>
			</div>
			<div>
				<p class="uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Quellen geprüft
				</p>
				<p class="mt-1 sm:mt-1.5 serif text-lg sm:text-2xl tnum" style="color: var(--color-ink);">
					{data.stats.sourcesCount}
				</p>
			</div>
			<div>
				<p class="uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Ø Wirkungsindex
				</p>
				<p class="mt-1 sm:mt-1.5 serif text-lg sm:text-2xl tnum" style="color: var(--color-ink);">
					{Math.round(data.totalImpact / data.stats.storiesCount)}<span
						class="text-sm sm:text-base"
						style="color: var(--color-faint);"
					>
						/100</span
					>
				</p>
			</div>
			<div>
				<p class="uppercase tracking-[0.18em]" style="color: var(--color-faint);">Ø Lesezeit</p>
				<p class="mt-1 sm:mt-1.5 serif text-lg sm:text-2xl tnum" style="color: var(--color-ink);">
					{data.avgRead}<span class="text-sm sm:text-base" style="color: var(--color-faint);"> min</span>
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Manifesto strip -->
<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
	<div class="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
		<div class="lg:col-span-4">
			<p class="eyebrow" style="color: var(--color-amber);">
				Warum es uns gibt
			</p>
		</div>
		<div class="lg:col-span-8">
			<p class="serif text-xl sm:text-2xl lg:text-[1.85rem] leading-snug" style="color: var(--color-ink);">
				Die Nachrichtenlage ist nicht die Welt. Sie ist eine Auswahl. Wir filtern dieselben
				tausenden Quellen — aber suchen das, was zeigt, dass Menschen
				<span style="color: var(--color-amber);">vorankommen</span>: bauen, heilen, einigen,
				erfinden, schützen.
			</p>
			<a
				href={base + '/manifest'}
				class="mt-4 sm:mt-6 inline-flex items-center gap-2 text-xs sm:text-sm hover:opacity-70"
				style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);"
			>
				Vollständiges Manifest lesen <span aria-hidden="true">→</span>
			</a>
		</div>
	</div>
</section>

<!-- Story grid -->
<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-14 sm:pb-16 lg:pb-20">
	<div class="flex items-end justify-between mb-7 sm:mb-10">
		<div>
		<p class="eyebrow" style="color: var(--color-amber);">
				Diese Woche
			</p>
			<h2 class="serif text-2xl sm:text-3xl lg:text-4xl mt-1.5 sm:mt-2" style="color: var(--color-ink); font-weight: 500;">
				Geschichten, die weitertragen
			</h2>
		</div>
		<a
			href={base + '/archiv'}
			class="hidden md:inline-flex items-center gap-2 text-sm hover:opacity-70"
			style="color: var(--color-ink-soft);"
		>
			Ganzes Archiv <span aria-hidden="true">→</span>
		</a>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
		{#each rest as story, i (story.slug)}
			<div class="rise" style="animation-delay: {0.1 + i * 0.06}s;">
				<StoryCard {story} />
			</div>
		{/each}
	</div>

	<!-- Mobile archive link -->
	<a
		href={base + '/archiv'}
		class="md:hidden mt-8 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full text-sm transition-all"
		style="background: var(--color-ink); color: var(--color-paper);"
	>
		Ganzes Archiv
		<span aria-hidden="true">→</span>
	</a>
</section>

<!-- Newsletter / quiet CTA -->
<section
	class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16"
	aria-labelledby="newsletter-heading"
>
	<div
		class="paper rounded-[8px] p-6 sm:p-10 lg:p-16 grid lg:grid-cols-12 gap-6 sm:gap-8 items-end"
		style="border: 1px solid var(--color-rule);"
	>
		<div class="lg:col-span-7">
		<p class="eyebrow" style="color: var(--color-amber);">
				Sonntags-Brief
			</p>
			<h2
				id="newsletter-heading"
				class="serif text-2xl sm:text-3xl lg:text-4xl mt-2 sm:mt-3 leading-tight"
				style="color: var(--color-ink); font-weight: 500;"
			>
				Eine ausgewählte Geschichte. Sonntag morgens. Werbefrei.
			</h2>
			<p
				class="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed max-w-[55ch]"
				style="color: var(--color-ink-soft); font-family: var(--font-serif);"
			>
				Kein Daily-Hammering, kein Algorithmus. Nur eine Geschichte pro Woche, die wir tiefer
				erzählt haben — mit Hintergrund, Quellen und einem Brief der Redaktion.
			</p>
		</div>
		<form
			class="lg:col-span-5 flex flex-col sm:flex-row gap-3"
			onsubmit={(e) => e.preventDefault()}
		>
			<label class="flex-1">
				<span class="sr-only">E-Mail-Adresse</span>
				<input
					type="email"
					required
					placeholder="Deine beste E-Mail"
					class="w-full px-4 py-3 rounded-full text-sm bg-transparent transition-all"
					style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);"
				/>
			</label>
			<button
				type="submit"
				class="px-6 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap"
				style="background: var(--color-amber); color: var(--color-paper);"
			>
				Abonnieren
			</button>
		</form>
	</div>
</section>
