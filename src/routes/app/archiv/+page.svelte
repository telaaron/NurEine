<script lang="ts">
	import { base } from '$app/paths';
	import { fetchStories } from '$lib/app/api';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { CATEGORIES, categoryLabel } from '$lib/categories';
	import { toneStyles } from '$lib/utils';
	import { tapLight } from '$lib/app/native';
	import type { StoryResult } from '$lib/server/queries';

	let all = $state<StoryResult[]>([]);
	let loading = $state(true);
	let errored = $state(false);

	let cat = $state<string>('alle');
	let sort = $state<'datum' | 'wirkung'>('datum');

	function heroImg(s: StoryResult): string {
		if (s.imageUrl && s.imageUrl.startsWith('http')) return s.imageUrl;
		return getStoryHeroImageSrc(s.category, base);
	}

	async function load() {
		loading = true;
		errored = false;
		try {
			all = await fetchStories();
		} catch {
			errored = true;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	const shown = $derived(
		[...(cat === 'alle' ? all : all.filter((s) => s.category === cat))].sort((a, b) =>
			sort === 'wirkung'
				? b.impactScore - a.impactScore
				: new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
		)
	);

	function pickCat(c: string) {
		tapLight();
		cat = c;
	}
	function toggleSort() {
		tapLight();
		sort = sort === 'datum' ? 'wirkung' : 'datum';
	}
</script>

<div class="arch">
	<header class="arch-head">
		<h1 class="display">Archiv</h1>

		<div class="chips" role="tablist" aria-label="Themen">
			<button class="chip" class:on={cat === 'alle'} onclick={() => pickCat('alle')}>Alle</button>
			{#each CATEGORIES as c}
				<button class="chip" class:on={cat === c.slug} onclick={() => pickCat(c.slug)}>{c.label}</button>
			{/each}
		</div>

		<div class="arch-bar">
			<span class="count">{shown.length} Geschichten</span>
			<button class="sort" onclick={toggleSort} aria-label="Sortierung wechseln">
				{sort === 'wirkung' ? 'Wirkung' : 'Neueste'}
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M7 12h10M11 18h2" /></svg>
			</button>
		</div>
	</header>

	{#if loading}
		<div class="list">
			{#each Array(5) as _}
				<div class="row sk" aria-hidden="true"><div class="thumb"></div><div class="txt"><div class="skl w40"></div><div class="skl w80"></div></div></div>
			{/each}
		</div>
	{:else if errored}
		<div class="state"><p>Verbindung verloren.</p><button onclick={load}>Erneut versuchen</button></div>
	{:else if !shown.length}
		<div class="state"><p>Keine Geschichte in diesem Thema.</p></div>
	{:else}
		<div class="list">
			{#each shown as s (s.slug)}
				{@const t = toneStyles[s.tone]}
				<a class="row" href={base + '/app/geschichte/' + s.id}>
					<div class="thumb">
						<img src={heroImg(s)} alt="" loading="lazy" />
						<span class="thumb-n display">{s.impactScore}</span>
					</div>
					<div class="txt">
						<span class="tag" style="color:{t.fg};">{categoryLabel(s.category)}</span>
						<div class="title display">{s.title}</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.arch { padding: 0 20px; }
	.arch-head { position: sticky; top: 0; z-index: 5; background: color-mix(in srgb, var(--color-canvas) 92%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 14px 0 8px; margin: 0 -20px; padding-left: 20px; padding-right: 20px; }
	.arch-head h1 { font-size: 34px; font-weight: 600; color: var(--color-ink); }
	.chips { display: flex; gap: 7px; overflow-x: auto; margin-top: 12px; padding-bottom: 2px; scrollbar-width: none; }
	.chips::-webkit-scrollbar { display: none; }
	.chip { flex: 0 0 auto; border: none; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; padding: 6px 13px; border-radius: 999px; background: var(--color-canvas-soft); color: var(--color-muted); }
	.chip.on { background: var(--color-ink); color: var(--color-paper); }
	.chip:active { transform: scale(0.95); }
	.arch-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
	.count { font-family: var(--font-mono); font-size: 11px; color: var(--color-faint); }
	.sort { display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent; font-family: var(--font-mono); font-size: 11px; color: var(--color-amber-deep); }

	.list { display: flex; flex-direction: column; gap: 11px; padding-top: 13px; padding-bottom: 8px; }
	.row { display: flex; gap: 11px; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 13px; padding: 10px; text-decoration: none; color: inherit; }
	.row:active { transform: scale(0.99); }
	.thumb { position: relative; width: 60px; height: 60px; border-radius: 10px; overflow: hidden; flex: 0 0 auto; background: var(--color-canvas-soft); }
	.thumb img { width: 100%; height: 100%; object-fit: cover; }
	.thumb-n { position: absolute; bottom: 3px; right: 3px; background: var(--color-paper); border-radius: 6px; font-size: 10px; font-weight: 600; padding: 1px 5px; color: var(--color-ink); }
	.txt { min-width: 0; align-self: center; }
	.tag { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; }
	.title { font-size: 14px; font-weight: 500; line-height: 1.2; color: var(--color-ink); margin-top: 5px; }

	.state { text-align: center; padding: 48px 24px; color: var(--color-muted); font-family: var(--font-serif); }
	.state button { margin-top: 14px; background: var(--color-ink); color: var(--color-paper); border: none; border-radius: 999px; padding: 11px 22px; }

	.sk .thumb { background: var(--color-canvas-soft); }
	.skl { height: 13px; border-radius: 6px; background: var(--color-canvas-soft); margin-bottom: 8px; }
	.skl.w40 { width: 40%; } .skl.w80 { width: 80%; }
	@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
	.sk .thumb, .skl { animation: pulse 1.4s ease-in-out infinite; }
</style>
