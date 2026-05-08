<script lang="ts">
	import { base } from '$app/paths';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { formatDate, toneStyles } from '$lib/utils';

	type StoryCardData = {
		slug: string;
		title: string;
		dek: string;
		category: string;
		country: string;
		publishedAt: string;
		readingMinutes: number;
		impactScore: number;
		impactNote: string;
		tone: 'amber' | 'sage' | 'rose' | 'sky';
		hero: string;
	};

	type Props = { story: StoryCardData; size?: 'sm' | 'md' | 'lg' };
	let { story, size = 'md' }: Props = $props();

	const t = $derived(toneStyles[story.tone]);
	const staticImageSrc = $derived(getStoryHeroImageSrc(story.title, base));
	const heroImageSrc = $derived(
		story.hero && story.hero.startsWith('http') ? story.hero : staticImageSrc
	);
</script>

<a
	href={base + '/geschichte/' + story.slug}
		class="group block paper rounded-md overflow-hidden transition-all duration-500 active:scale-[0.985]"
	style="border: 1px solid var(--color-rule); will-change: transform;"
	onmouseenter={(e) => (e.currentTarget.style.borderColor = t.ring)}
	onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--color-rule)')}
>
	<div class="relative {size === 'lg' ? 'aspect-16/10' : 'aspect-5/3'} overflow-hidden">
		<div
			class="absolute inset-0 transition-transform duration-[900ms] group-hover:scale-[1.04]"
			style="background:
        radial-gradient(circle at 30% 30%, {t.fg}30 0%, transparent 50%),
        radial-gradient(circle at 75% 70%, {t.fg}1f 0%, transparent 55%),
        linear-gradient(160deg, {t.bg}, var(--color-paper));"
		></div>
		{#if heroImageSrc}
			<img
				src={heroImageSrc}
				alt=""
				class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
				loading="lazy"
				decoding="async"
			/>
			<div
				class="absolute inset-0"
				style="background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(245,241,234,0.2));"
			></div>
		{:else}
			<div
				class="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl lg:text-7xl"
				style="filter: saturate(0.85);"
			>
				{story.hero || '✨'}
			</div>
		{/if}
		<div class="absolute top-3 left-3 flex gap-2">
			<span
				class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] rounded-full backdrop-blur-sm"
				style="background: rgba(255, 252, 245, 0.75); color: {t.fg}; border: 1px solid {t.ring};"
			>
				{story.category}
			</span>
		</div>
	</div>
	<div class="p-4 sm:p-5 lg:p-6">
		<div class="flex items-center gap-2 text-[11px] sm:text-xs" style="color: var(--color-faint);">
			<span>{story.country}</span>
			<span>·</span>
			<span>{formatDate(story.publishedAt, 'short')}</span>
			<span>·</span>
			<span>{story.readingMinutes} Min. Lesezeit</span>
		</div>
		<h3
			class="serif mt-2 sm:mt-3 leading-[1.18] tracking-tight {size === 'lg'
				? 'text-xl sm:text-2xl lg:text-3xl'
				: 'text-[1.2rem] sm:text-[1.28rem] lg:text-[1.35rem]'}"
			style="color: var(--color-ink); font-weight: 500;"
		>
			{story.title}
		</h3>
		<p
			class="mt-2 sm:mt-3 text-[13px] sm:text-[14px] lg:text-[15px] leading-relaxed line-clamp-3"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			{story.dek}
		</p>
		<div
			class="mt-4 sm:mt-5 pt-3 sm:pt-4 flex items-center justify-between text-[11px] sm:text-xs"
			style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
		>
			<span class="flex items-center gap-2">
				<span
					class="inline-block w-1.5 h-1.5 rounded-full"
					style="background: {t.fg};"
					aria-hidden="true"
				></span>
				Wirkung {story.impactScore}/100
			</span>
			<span class="tnum">{story.impactNote}</span>
		</div>
	</div>
</a>
