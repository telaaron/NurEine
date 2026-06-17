<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { fetchStory } from '$lib/app/api';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { categoryLabel } from '$lib/categories';
	import { toneStyles, paragraphs } from '$lib/utils';
	import type { StoryResult } from '$lib/server/queries';

	let story = $state<StoryResult | null>(null);
	let loading = $state(true);
	let errored = $state(false);

	const id = $derived(page.params.id);

	function heroImg(s: StoryResult): string {
		if (s.imageUrl && s.imageUrl.startsWith('http')) return s.imageUrl;
		return getStoryHeroImageSrc(s.category, base);
	}

	async function load() {
		loading = true;
		errored = false;
		try {
			story = await fetchStory(id);
		} catch {
			errored = true;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (id) load();
	});

	const axes = $derived(
		story
			? [
					{ label: 'Reichweite', value: story.impactReach },
					{ label: 'Dauerhaftigkeit', value: story.impactDurability },
					{ label: 'Belegbarkeit', value: story.impactEvidence }
				].filter((a) => typeof a.value === 'number')
			: []
	);
	const secs = $derived(story ? paragraphs(story.body) : []);
</script>

<div class="detail">
	<a class="back" href={base + '/app'} aria-label="Zurück">← Heute</a>

	{#if loading}
		<div class="state">Lädt …</div>
	{:else if errored || !story}
		<div class="state">
			<p>Geschichte nicht gefunden.</p>
			<button onclick={load}>Erneut versuchen</button>
		</div>
	{:else}
		{@const tone = toneStyles[story.tone]}
		<div class="d-img"><img src={heroImg(story)} alt="" /></div>
		<div class="d-body">
			<span class="d-tag" style="color:{tone.fg};background:{tone.bg};">{categoryLabel(story.category)} · {story.country}</span>
			<h1 class="display">{story.title}</h1>
			<p class="d-meta">{story.readingMinutes} Min · Quelle: {story.source}</p>

			{#if story.dek}<p class="d-dek serif">{story.dek}</p>{/if}

			{#each secs as sec}
				<p class="d-p serif">{sec}</p>
			{/each}

			{#if axes.length}
				<div class="d-impact">
					<div class="d-impact-head">
						<span>Wirkungsindex</span>
						<span class="display d-impact-n">{story.impactScore}<small>/100</small></span>
					</div>
					{#each axes as a}
						<div class="d-axis">
							<div class="d-axis-l"><span>{a.label}</span><span class="display">{a.value}</span></div>
							<div class="d-bar"><span style="width:{a.value}%;background:{tone.fg};"></span></div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail { padding-bottom: 24px; }
	.back { display: inline-block; padding: 14px 20px 6px; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); text-decoration: none; }
	.d-img { aspect-ratio: 16 / 9; background: var(--color-canvas-soft); }
	.d-img img { width: 100%; height: 100%; object-fit: cover; }
	.d-body { padding: 16px 20px 0; }
	.d-tag { display: inline-block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; }
	.d-body h1 { font-size: 24px; font-weight: 600; line-height: 1.1; color: var(--color-ink); margin-top: 10px; }
	.d-meta { font-family: var(--font-mono); font-size: 11px; color: var(--color-faint); margin-top: 8px; }
	.d-dek { font-size: 16px; line-height: 1.6; color: var(--color-ink-soft); margin-top: 14px; font-style: italic; }
	.d-p { font-size: 15px; line-height: 1.7; color: var(--color-ink-soft); margin-top: 14px; }
	.d-impact { margin-top: 20px; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 14px; padding: 14px 15px; }
	.d-impact-head { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-muted); }
	.d-impact-n { font-size: 22px; font-weight: 600; color: var(--color-amber-deep); }
	.d-impact-n small { font-size: 11px; color: var(--color-faint); }
	.d-axis { margin-top: 12px; }
	.d-axis-l { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-muted); margin-bottom: 4px; }
	.d-bar { height: 6px; border-radius: 3px; background: var(--color-rule); overflow: hidden; }
	.d-bar span { display: block; height: 100%; border-radius: 3px; }
	.state { text-align: center; padding: 48px 24px; color: var(--color-muted); font-family: var(--font-serif); }
	.state button { margin-top: 14px; background: var(--color-ink); color: var(--color-paper); border: none; border-radius: 999px; padding: 11px 22px; }
</style>
