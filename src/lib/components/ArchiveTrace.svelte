<script lang="ts">
	import { base } from '$app/paths';
	import { groupByMonth, dayParts, CATEGORY_TONE, type ArchiveStory } from '$lib/archive-timeline';

	let { stories }: { stories: ArchiveStory[] } = $props();
	const months = $derived(groupByMonth(stories));

	// Schwelle für „Meilenstein" = Perle mit Bild auf der Linie. Rest = feiner Strich.
	const MILESTONE = 75;

	const TONE_VAR: Record<string, string> = {
		amber: 'var(--color-amber)', sage: 'var(--color-sage)', rose: 'var(--color-rose)', sky: 'var(--color-sky)'
	};
	function catColor(cat: string): string { return TONE_VAR[CATEGORY_TONE[cat] ?? 'amber']; }
	function href(slug: string) { return `${base}/geschichte/${slug}`; }
	function imgSrc(hero: string, w = 240) {
		return hero && hero.startsWith('http') ? `${base}/img?url=${encodeURIComponent(hero)}&w=${w}` : '';
	}

	// Flache Sequenz: pro Monat eine Marke, dann seine Stories (neueste zuerst),
	// jede als Milestone (Perle) oder Tick.
	type Item =
		| { kind: 'month'; key: string; label: string; count: number; top: number }
		| { kind: 'story'; s: ArchiveStory; milestone: boolean; iso: string };
	const items = $derived.by<Item[]>(() => {
		const out: Item[] = [];
		for (const m of months) {
			out.push({ kind: 'month', key: m.key, label: m.label, count: m.count, top: m.topImpact });
			for (const d of m.days) {
				for (const s of d.stories) {
					out.push({ kind: 'story', s, milestone: (s.impactScore ?? 0) >= MILESTONE, iso: d.iso });
				}
			}
		}
		return out;
	});
</script>

<div class="trace-layout">
	<!-- Sticky-Register -->
	<nav class="register" aria-label="Nach Monat springen">
		{#each months as m (m.key)}
			<a href={'#tm-' + m.key} class="reg">
				<span class="reg-l">{m.label.split(' ')[0]}</span>
				<span class="reg-n">{m.count}</span>
			</a>
		{/each}
	</nav>

	<!-- Die Spur -->
	<div class="trace">
		<div class="line" aria-hidden="true"></div>
		{#each items as it}
			{#if it.kind === 'month'}
				<div class="mmark" id={'tm-' + it.key}>
					<span class="mmark-dot" aria-hidden="true"></span>
					<span class="display mmark-l">{it.label}</span>
					<span class="mmark-c">{it.count} Geschichten · stärkste {it.top}</span>
				</div>
			{:else if it.milestone}
				<a class="pearl" href={href(it.s.slug)} style="--acc: {catColor(it.s.category)}">
					<span class="pearl-dot" style="background: {catColor(it.s.category)}"></span>
					{#if imgSrc(it.s.hero)}
						<div class="pearl-thumb"><img src={imgSrc(it.s.hero)} alt="" loading="lazy" /></div>
					{:else}
						<div class="pearl-thumb noimg" style="--tone: {catColor(it.s.category)}"><span class="display nw">{it.s.category}</span></div>
					{/if}
					<div class="pearl-body">
						<span class="pearl-date">{dayParts(it.iso).weekday} {dayParts(it.iso).day}. {dayParts(it.iso).monthShort} · {it.s.category}</span>
						<h3 class="display pearl-h">{it.s.title}</h3>
						<span class="wirk">Wirkung {it.s.impactScore}/100</span>
					</div>
				</a>
			{:else}
				<a class="tick" href={href(it.s.slug)}>
					<span class="tick-dot" style="background: {catColor(it.s.category)}"></span>
					<span class="tick-date">{dayParts(it.iso).day}.{dayParts(it.iso).monthShort.slice(0,1)}</span>
					<span class="tick-title">{it.s.title}</span>
					<span class="tick-imp">{it.s.impactScore}</span>
				</a>
			{/if}
		{/each}
	</div>
</div>

<style>
	.trace-layout { display: grid; grid-template-columns: 120px 1fr; gap: 2rem; align-items: start; }
	.register { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 0.15rem; }
	.reg { display: flex; align-items: baseline; justify-content: space-between; padding: 0.35rem 0.6rem; border-radius: 8px; text-decoration: none; color: var(--color-muted); transition: background 0.2s, color 0.2s; }
	.reg:hover { background: var(--color-canvas-soft); color: var(--color-ink); }
	.reg-l { font-size: 0.85rem; font-weight: 600; }
	.reg-n { font-size: 0.68rem; color: var(--color-faint); font-variant-numeric: tabular-nums; }

	.trace { position: relative; padding-left: 2rem; }
	.line { position: absolute; left: 7px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(var(--color-rule-strong), var(--color-rule)); }

	.mmark { position: relative; display: flex; align-items: baseline; gap: 0.7rem; margin: 2.4rem 0 1.2rem; }
	.mmark:first-child { margin-top: 0.4rem; }
	.mmark-dot { position: absolute; left: -2rem; top: 4px; width: 16px; height: 16px; border-radius: 16px; background: var(--color-ink); margin-left: 0px; transform: translateX(0); box-shadow: 0 0 0 4px var(--color-canvas); }
	.mmark-l { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; color: var(--color-ink); }
	.mmark-c { font-size: 0.75rem; color: var(--color-muted); }

	.pearl { position: relative; display: grid; grid-template-columns: 96px 1fr; gap: 0.9rem; align-items: center;
		padding: 0.7rem; margin: 0.7rem 0; border: 1px solid var(--color-rule); border-radius: 13px;
		background: var(--color-paper); text-decoration: none; transition: border-color 0.3s, transform 0.3s; }
	.pearl:hover { border-color: var(--acc); transform: translateX(2px); }
	.pearl-dot { position: absolute; left: calc(-2rem - 1px); top: 50%; width: 14px; height: 14px; border-radius: 14px; transform: translateY(-50%); box-shadow: 0 0 0 4px var(--color-canvas); }
	.pearl-thumb { aspect-ratio: 1; border-radius: 9px; overflow: hidden; background: var(--color-canvas-soft); }
	.pearl-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.noimg { display: flex; align-items: center; justify-content: center; background: linear-gradient(150deg, var(--color-paper), color-mix(in srgb, var(--tone) 16%, var(--color-paper))); }
	.nw { font-size: 0.85rem; font-weight: 700; color: var(--tone); opacity: 0.4; text-transform: capitalize; }
	.pearl-body { min-width: 0; }
	.pearl-date { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; color: var(--color-muted); text-transform: capitalize; }
	.pearl-h { font-size: 1.12rem; font-weight: 700; line-height: 1.14; letter-spacing: -0.02em; color: var(--color-ink); margin: 0.2rem 0 0.3rem;
		display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.wirk { font-size: 0.7rem; color: var(--color-muted); }

	.tick { position: relative; display: flex; align-items: center; gap: 0.7rem; padding: 0.28rem 0; text-decoration: none; min-width: 0; }
	.tick-dot { position: absolute; left: calc(-2rem + 2px); width: 8px; height: 8px; border-radius: 8px; box-shadow: 0 0 0 3px var(--color-canvas); }
	.tick-date { font-size: 0.68rem; color: var(--color-faint); width: 34px; flex: none; font-variant-numeric: tabular-nums; }
	.tick-title { font-size: 0.9rem; color: var(--color-ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.tick:hover .tick-title { color: var(--color-ink); text-decoration: underline; text-underline-offset: 2px; }
	.tick-imp { font-size: 0.7rem; color: var(--color-faint); margin-left: auto; flex: none; font-variant-numeric: tabular-nums; }

	@media (max-width: 720px) {
		.trace-layout { grid-template-columns: 1fr; }
		.register { position: static; flex-direction: row; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
		.reg { border: 1px solid var(--color-rule); }
		.pearl { grid-template-columns: 72px 1fr; }
	}
</style>
