<script lang="ts">
	import { base } from '$app/paths';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { formatDate, toneStyles } from '$lib/utils';
	import { showSensitive } from '$lib/sensitive';

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
		audioUrl?: string | null;
		sensitive?: boolean;
	};

	type Props = { story: StoryCardData; size?: 'sm' | 'md' | 'lg' | 'feature'; baseUrl?: string; revealSensitive?: boolean };
	let { story, size = 'md', baseUrl = 'https://nureine.de', revealSensitive = false }: Props = $props();

	// Jugendschutz: heikle Stories standardmäßig verhüllt (Bild geblurrt + Hinweis),
	// bis der Nutzer aufdeckt. Aufgedeckt durch: globalen Store (showSensitive),
	// explizite Prop (revealSensitive) ODER lokalen Klick auf diese Karte.
	let revealedLocal = $state(false);
	const veiled = $derived(!!story.sensitive && !$showSensitive && !revealSensitive && !revealedLocal);

	function revealSensitiveCard(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		revealedLocal = true;
	}

	const isFeature = $derived(size === 'feature');
	const t = $derived(toneStyles[story.tone]);
	const staticImageSrc = $derived(getStoryHeroImageSrc(story.category, base));
	// Remote-Bilder (Supabase-PNG ~1 MB) durch den WebP-Proxy → ~60-120 KB.
	const isRemote = $derived(!!story.hero && story.hero.startsWith('http'));
	const proxied = (w: number) => `${base}/img?url=${encodeURIComponent(story.hero || '')}&w=${w}`;
	const heroImageSrc = $derived(isRemote ? proxied(600) : staticImageSrc);
	const heroSrcset = $derived(isRemote ? `${proxied(400)} 400w, ${proxied(600)} 600w, ${proxied(900)} 900w` : undefined);

	const storyUrl = $derived(`${baseUrl}/geschichte/${story.slug}`);

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout>;

	function shareClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (typeof navigator !== 'undefined' && navigator.share) {
			navigator.share({ title: story.title, text: story.dek, url: storyUrl }).catch(() => {});
		} else {
			copyLink(e);
		}
	}

	function copyLink(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		navigator.clipboard.writeText(storyUrl).then(() => {
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => (copied = false), 1800);
		}).catch(() => {});
	}
</script>

<a
	href={base + '/geschichte/' + story.slug}
	class="group h-full paper rounded-md overflow-hidden transition-all duration-500 active:scale-[0.985] flex flex-col {isFeature ? 'lg:flex-row' : ''}"
	style="border: 1px solid var(--color-rule); will-change: transform;"
	onmouseenter={(e) => (e.currentTarget.style.borderColor = t.ring)}
	onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--color-rule)')}
	onclick={(e) => { if (veiled) { e.preventDefault(); revealedLocal = true; } }}
>
	<div class="relative overflow-hidden {isFeature ? 'aspect-[4/3] lg:aspect-auto lg:w-1/2 lg:min-h-[420px]' : 'aspect-[4/3]'}"
		style="background: var(--color-paper);"
	>
		{#if heroImageSrc}
			<img
				src={heroImageSrc}
				srcset={heroSrcset}
				sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
				alt=""
				class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
				style={veiled ? 'filter: blur(22px); transform: scale(1.1);' : ''}
				loading="lazy"
				decoding="async"
			/>
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
				class="badge px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm"
				style="background: rgba(255, 252, 245, 0.75); color: {t.fg}; border: 1px solid {t.ring};"
			>
				{story.category}
			</span>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<button
			type="button"
			onclick={shareClick}
			class="absolute top-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
			style="background: rgba(255, 252, 245, 0.75); color: var(--color-muted); border: 1px solid var(--color-rule);"
			aria-label="Story teilen"
			title="Story teilen"
		>
			{#if copied}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{:else}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
					<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
				</svg>
			{/if}
		</button>

		{#if veiled}
			<!-- Jugendschutz-Verhüllung: dezenter Hinweis + Aufdeck-Button über dem geblurrten Bild -->
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4"
				style="background: rgba(22,20,15,0.34); backdrop-filter: blur(2px);">
				<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.92;">
					<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
					<line x1="1" y1="1" x2="23" y2="23" />
				</svg>
				<span class="text-xs font-medium" style="color: #fff; opacity: 0.95;">Sensibler Inhalt</span>
				<button type="button" onclick={revealSensitiveCard}
					class="px-3 py-1.5 rounded-full text-xs font-medium"
					style="background: rgba(255,252,245,0.92); color: var(--color-ink);">
					Trotzdem ansehen
				</button>
			</div>
		{/if}
	</div>
	<div class="p-4 sm:p-5 lg:p-6 flex flex-col flex-1 {isFeature ? 'lg:w-1/2 lg:justify-center lg:p-8 xl:p-10' : ''}">
		<div class="flex items-center gap-2 meta" style="color: var(--color-faint);">
			<span>{story.country}</span>
			<span>·</span>
			<span>{formatDate(story.publishedAt, 'short')}</span>
			<span>·</span>
			<span>{story.readingMinutes} Min. Lesezeit</span>
		</div>
		<h3
			class="display mt-2 sm:mt-3 leading-[1.15] {isFeature
				? 'text-2xl sm:text-3xl lg:text-[2.4rem] line-clamp-3'
				: size === 'lg'
					? 'text-xl sm:text-2xl lg:text-3xl line-clamp-2'
					: 'card-heading line-clamp-2'}"
			style="color: var(--color-ink); font-weight: 600;"
		>
			{story.title}
		</h3>
		<p
			class="card-dek mt-2 sm:mt-3 leading-relaxed {isFeature ? 'line-clamp-5 lg:text-base' : 'line-clamp-4'}"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			{story.dek}
		</p>
		<div class="mt-auto">
			<div
				class="meta pt-3 sm:pt-4 flex items-center justify-between"
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
	</div>
</a>
