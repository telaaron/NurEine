<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';

	type TickerStory = { title: string; slug: string; category: string } | null;
	let { story }: { story: TickerStory } = $props();

	// Dismiss state persisted per-story so a new daily story re-shows the ticker.
	let dismissed = $state(true); // hidden until we confirm it should show (avoids flash)

	$effect(() => {
		if (!story) return;
		try {
			const key = localStorage.getItem('nureine_ticker_dismissed');
			dismissed = key === story.slug;
		} catch {
			dismissed = false;
		}
	});

	function dismiss() {
		dismissed = true;
		try {
			if (story) localStorage.setItem('nureine_ticker_dismissed', story.slug);
		} catch {
			/* ignore */
		}
	}
</script>

{#if story && !dismissed}
	<div
		class="relative w-full"
		style="background: var(--color-amber); color: var(--color-on-accent);"
	>
		<div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
			<div class="flex items-center gap-3 h-9 sm:h-10 text-xs sm:text-sm">
				<span
					class="hidden sm:inline-flex items-center gap-1.5 shrink-0 uppercase"
					style="font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.16em;"
				>
					<span class="relative flex h-1.5 w-1.5">
						<span class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style="background: var(--color-paper);"></span>
						<span class="relative inline-flex rounded-full h-1.5 w-1.5" style="background: var(--color-paper);"></span>
					</span>
					Heute neu
				</span>
				<a
					href={base + '/geschichte/' + story.slug}
					onclick={() => track('ticker_click', { slug: story.slug })}
					class="flex-1 min-w-0 flex items-center gap-2 group"
				>
					<span class="truncate" style="font-family: var(--font-serif);">{story.title}</span>
					<span class="shrink-0 underline underline-offset-2 decoration-1 hidden sm:inline transition-transform group-hover:translate-x-0.5" aria-hidden="true">lesen →</span>
				</a>
				<button
					type="button"
					onclick={dismiss}
					class="shrink-0 -mr-1 w-7 h-7 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
					aria-label="Hinweis schließen"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
				</button>
			</div>
		</div>
	</div>
{/if}
