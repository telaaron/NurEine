<script lang="ts">
	import { base } from '$app/paths';
	import { toneStyles, formatDate } from '$lib/utils';

	let { data } = $props();
	const stories = $derived(data.stories);

	let active = $state<string | null>(stories.length > 0 ? stories[0].slug : null);
	const activeStory = $derived(stories.find((s) => s.slug === active) ?? (stories.length > 0 ? stories[0] : null));

	const continents = [
		{ name: 'Nordamerika', count: stories.filter((s) => s.region === 'Nordamerika').length },
		{ name: 'Südamerika', count: stories.filter((s) => s.region === 'Südamerika').length },
		{ name: 'Europa', count: stories.filter((s) => s.region === 'Europa' || s.country === 'Deutschland' || s.country === 'Österreich' || s.country === 'Großbritannien').length },
		{ name: 'Afrika', count: stories.filter((s) => s.region === 'Afrika').length },
		{ name: 'Asien', count: stories.filter((s) => s.region === 'Asien').length },
		{ name: 'Ozeanien', count: stories.filter((s) => s.region === 'Ozeanien').length }
	];
</script>

<svelte:head>
	<title>Karte der Hoffnung — Lichtblick</title>
</svelte:head>

<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pt-12 lg:pt-16 pb-8">
	<p class="text-[11px] uppercase tracking-[0.22em]" style="color: var(--color-amber); font-weight: 500;">
		Karte der Hoffnung
	</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[2.4rem] lg:text-[3.6rem]"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Wo überall heute etwas Gutes passiert.
	</h1>
	<p
		class="mt-5 max-w-[55ch] text-lg leading-relaxed"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Klick auf einen Punkt — jeder ist eine Geschichte aus unserem Archiv. Helle Farbe = höhere
		Wirkung.
	</p>
</section>

<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-16">
	<div class="grid lg:grid-cols-12 gap-6 lg:gap-10">
		<!-- Map -->
		<div class="lg:col-span-8">
			<div
				class="paper relative aspect-[16/10] rounded-[6px] overflow-hidden"
				style="border: 1px solid var(--color-rule);"
			>
				<!-- abstract continents svg -->
				<svg
					viewBox="0 0 100 60"
					preserveAspectRatio="none"
					class="absolute inset-0 w-full h-full"
					aria-hidden="true"
				>
					<g fill="var(--color-canvas-soft)" stroke="var(--color-rule)" stroke-width="0.15">
						<!-- North America -->
						<path d="M5,20 Q12,12 20,14 L25,20 L24,30 L18,36 L10,32 Z" />
						<!-- South America -->
						<path d="M22,40 Q26,38 30,44 L29,55 L24,58 L20,50 Z" />
						<!-- Europe -->
						<path d="M44,18 L52,16 L56,22 L52,28 L46,28 L42,24 Z" />
						<!-- Africa -->
						<path d="M46,30 L56,32 L58,46 L52,56 L46,52 L44,40 Z" />
						<!-- Asia -->
						<path d="M56,14 L82,18 L82,30 L74,36 L66,32 L58,26 L56,18 Z" />
						<!-- Australia -->
						<path d="M78,52 L88,50 L90,56 L84,60 L78,58 Z" />
					</g>
				</svg>

				{#each stories as s (s.slug)}
					{@const t = toneStyles[s.tone]}
					{@const isActive = s.slug === active}
					<button
						type="button"
						onclick={() => (active = s.slug)}
						class="absolute group"
						style="left: {s.coords[0]}%; top: {s.coords[1]}%; transform: translate(-50%, -50%);"
						aria-label={s.title}
					>
						<span
							class="block rounded-full transition-all duration-500"
							style="width: {isActive ? 22 : 12}px; height: {isActive ? 22 : 12}px;
                background: {t.fg};
                box-shadow: 0 0 0 {isActive ? 8 : 0}px {t.bg},
                  0 0 0 {isActive ? 16 : 8}px {t.ring};
                opacity: {0.5 + s.impactScore / 200};"
						></span>
						{#if isActive}
							<span
								class="absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
								style="background: var(--color-ink); color: var(--color-paper); top: 100%;"
							>
								{s.country}
							</span>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Continent breakdown -->
			<div class="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs">
				{#each continents as c}
					<div
						class="paper p-3 rounded-[4px]"
						style="border: 1px solid var(--color-rule);"
					>
						<p class="uppercase tracking-[0.14em]" style="color: var(--color-faint);">
							{c.name}
						</p>
						<p class="serif text-2xl tnum mt-1" style="color: var(--color-ink);">
							{c.count}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Selected story -->
		<aside class="lg:col-span-4">
			{#if activeStory}
				{@const t = toneStyles[activeStory.tone]}
				<div
					class="paper rounded-[6px] p-6 sticky top-6"
					style="border: 1px solid {t.ring};"
				>
					<div class="flex items-center gap-2 text-xs" style="color: var(--color-muted);">
						<span
							class="px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] rounded-full"
							style="background: {t.bg}; color: {t.fg};"
						>
							{activeStory.category}
						</span>
						<span>{activeStory.country}</span>
					</div>
					<h2
						class="serif mt-4 leading-snug text-[1.5rem]"
						style="color: var(--color-ink); font-weight: 500;"
					>
						{activeStory.title}
					</h2>
					<p
						class="mt-3 text-[15px] leading-relaxed"
						style="color: var(--color-ink-soft); font-family: var(--font-serif);"
					>
						{activeStory.dek}
					</p>
					<div
						class="mt-5 pt-4 flex items-center justify-between text-xs"
						style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
					>
						<span class="tnum">Wirkung {activeStory.impactScore}/100</span>
						<span>{formatDate(activeStory.publishedAt, 'short')}</span>
					</div>
					<a
						href={base + '/geschichte/' + activeStory.slug}
						class="mt-5 block text-center px-4 py-2.5 rounded-full text-sm transition-all"
						style="background: var(--color-ink); color: var(--color-paper);"
					>
						Geschichte lesen
					</a>
				</div>
			{:else}
				<div
					class="paper rounded-[6px] p-6 sticky top-6"
					style="border: 1px solid var(--color-rule);"
				>
					<p class="text-sm" style="color: var(--color-muted);">
						Wähle einen Punkt auf der Karte, um eine Geschichte zu entdecken.
					</p>
				</div>
			{/if}
		</aside>
	</div>
</section>
