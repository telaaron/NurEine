<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate } from '$lib/utils';
	import { getStoryHeroImageSrc } from '$lib/story-images';

	interface Props {
		story: {
			slug: string;
			title: string;
			dek?: string;
			category?: string;
			country?: string;
			region?: string;
			impactScore?: number;
			publishedAt?: string;
			tone?: string;
			imageUrl?: string;
		};
		toneFg?: string;
		mode?: 'sidebar' | 'sheet';
		onClose?: () => void;
	}

	let { story, toneFg = '#c87340', mode = 'sidebar', onClose }: Props = $props();

	const localHeroSrc = $derived(getStoryHeroImageSrc(story.category, base));
	const heroImageSrc = $derived(story.imageUrl?.startsWith('http') ? story.imageUrl : localHeroSrc);
	const storyUrl = $derived(`${base}/geschichte/${story.slug}`);
</script>

<div class="story-detail-card">
	{#if mode === 'sheet'}
		<div
			class="w-10 h-1 rounded-full mx-auto mb-3"
			style="background: var(--color-rule-strong);"
		></div>
	{/if}

	<!-- Tone accent bar -->
	<div class="h-1.5 w-full" style="background: {toneFg};"></div>

	<div class="px-3 sm:px-4 pb-6">
		{#if mode === 'sheet'}
			<div class="flex items-center justify-between mt-3 mb-2">
				<span class="badge" style="background: {toneFg}14; color: {toneFg};">
					{story.category ?? 'Allgemein'}
				</span>
				<button
					onclick={onClose}
					class="w-8 h-8 flex items-center justify-center rounded-full"
					style="color: var(--color-muted);"
					aria-label="Schließen"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/if}

		<div class="flex items-center gap-2.5 mt-3 mb-2">
			{#if mode === 'sidebar'}
				<span class="badge" style="background: {toneFg}14; color: {toneFg};">
					{story.category ?? 'Allgemein'}
				</span>
			{/if}
			<span class="meta" style="color: var(--color-muted);">{story.country ?? story.region ?? ''}</span>
		</div>

		{#if heroImageSrc}
			<div
				class="relative aspect-[4/3] rounded-[6px] overflow-hidden mb-3"
				style="background: var(--color-paper); border: 1px solid var(--color-rule);"
			>
				<img
					src={heroImageSrc}
					alt=""
					class="absolute inset-0 h-full w-full object-cover"
					loading="lazy"
					decoding="async"
				/>
			</div>
		{/if}

		<h3
			class="display font-semibold leading-tight mb-2"
			style="color: var(--color-ink);"
		>
			{story.title}
		</h3>

		{#if story.dek}
			<p
				class="serif leading-relaxed mb-3"
				style="color: var(--color-ink-soft); font-size: 0.92rem;"
			>
				{story.dek}
			</p>
		{/if}

		<div class="flex items-center gap-3 mb-3">
			<span class="meta font-medium" style="color: {toneFg};">
				Wirkung {story.impactScore ?? '?'}/100
			</span>
			{#if story.publishedAt}
				<span class="meta" style="color: var(--color-muted);">
					{formatDate(story.publishedAt, 'short')}
				</span>
			{/if}
		</div>

		<a
			href={storyUrl}
			class="inline-block px-5 py-2.5 rounded-full text-sm font-medium transition-all"
			style="background: var(--color-ink); color: var(--color-paper);"
		>
			Geschichte lesen &rarr;
		</a>
	</div>
</div>
