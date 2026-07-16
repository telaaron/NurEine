<script lang="ts">
	import { base } from '$app/paths';
	import { storyImageSrc } from '$lib/story-images';
	import { groupByMonth, CATEGORY_TONE, type ArchiveStory, type MonthGroup } from '$lib/archive-timeline';

	let { stories }: { stories: ArchiveStory[] } = $props();
	const months = $derived(groupByMonth(stories));

	const TONE_VAR: Record<string, string> = {
		amber: 'var(--color-amber)', sage: 'var(--color-sage)', rose: 'var(--color-rose)', sky: 'var(--color-sky)'
	};
	function catColor(cat: string): string { return TONE_VAR[CATEGORY_TONE[cat] ?? 'amber']; }
	function href(slug: string) { return `${base}/geschichte/${slug}`; }
	// Zentral: NIE eine Supabase-URL direkt einbetten (Egress!) — siehe
	// CLAUDE.md „Bilder & Egress". storyImageSrc leitet über den /img-Proxy.
	function imgSrc(hero: string, w = 500) { return storyImageSrc(hero, base, w); }
	// Highlights je Monat: die stärksten mit Bild bevorzugt, dann Rest — 1 groß + 4 klein.
	function highlights(m: MonthGroup): ArchiveStory[] {
		const all = m.days.flatMap((d) => d.stories);
		const withImg = all.filter((s) => s.hero && s.hero.startsWith('http')).sort((a, b) => b.impactScore - a.impactScore);
		const rest = all.filter((s) => !(s.hero && s.hero.startsWith('http'))).sort((a, b) => b.impactScore - a.impactScore);
		return [...withImg, ...rest].slice(0, 5);
	}
	let expanded = $state<Record<string, boolean>>({});
	function laterStories(m: MonthGroup): ArchiveStory[] {
		const shown = new Set(highlights(m).map((s) => s.slug));
		return m.days.flatMap((d) => d.stories).filter((s) => !shown.has(s.slug));
	}
</script>

<div class="logbook">
	{#each months as m (m.key)}
		{@const hl = highlights(m)}
		{@const big = hl[0]}
		{@const smalls = hl.slice(1, 5)}
		<section class="spread" id={'lb-' + m.key} style="--acc: {catColor(m.dominantCategory)}">
			<!-- COVER (linke Seite) -->
			<aside class="cover" style="background:
				radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--acc) 22%, transparent) 0%, transparent 60%),
				linear-gradient(160deg, var(--color-paper), color-mix(in srgb, var(--acc) 10%, var(--color-paper)));">
				<span class="cover-word display">{m.dominantCategory}</span>
				<div class="cover-content">
					<span class="cover-kicker">Ausgabe</span>
					<h2 class="display cover-title">{m.label}</h2>
					<dl class="stats">
						<div><dt>Geschichten</dt><dd>{m.count}</dd></div>
						<div><dt>Stärkste Wirkung</dt><dd>{m.topImpact}</dd></div>
						<div><dt>Schwerpunkt</dt><dd class="cap">{m.dominantCategory}</dd></div>
					</dl>
					<!-- Mini-Puls -->
					<div class="pulse" role="img" aria-label={'Kategorien ' + m.label}>
						{#each m.categoryShare as c}
							<span style="flex: {c.count}; background: {catColor(c.category)};"></span>
						{/each}
					</div>
				</div>
			</aside>

			<!-- HIGHLIGHTS (rechte Seite) -->
			<div class="highlights">
				{#if big}
					<a class="big" href={href(big.slug)}>
						{#if imgSrc(big.hero, 640)}
							<div class="big-img"><img src={imgSrc(big.hero, 640)} alt="" loading="lazy" /></div>
						{:else}
							<div class="big-img noimg"><span class="display nw">{big.category}</span></div>
						{/if}
						<div class="big-body">
							<span class="kicker" style="color: {catColor(big.category)}">{big.category} · Wirkung {big.impactScore}</span>
							<h3 class="display big-h">{big.title}</h3>
							<p class="big-dek">{big.dek}</p>
						</div>
					</a>
				{/if}
				<div class="small-grid">
					{#each smalls as s (s.slug)}
						<a class="small" href={href(s.slug)}>
							<span class="cdot" style="background: {catColor(s.category)}"></span>
							<h4 class="small-h">{s.title}</h4>
							<span class="small-meta">{s.category} · {s.impactScore}</span>
						</a>
					{/each}
				</div>
				{#if laterStories(m).length}
					<button class="more" onclick={() => (expanded[m.key] = !expanded[m.key])}>
						{expanded[m.key] ? 'weniger zeigen' : `weitere ${laterStories(m).length} aus ${m.label.split(' ')[0]}`}
					</button>
					{#if expanded[m.key]}
						<ul class="rest">
							{#each laterStories(m) as s (s.slug)}
								<li><a href={href(s.slug)}><span class="cdot" style="background: {catColor(s.category)}"></span>{s.title}<span class="ri">{s.impactScore}</span></a></li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>
		</section>
	{/each}
</div>

<style>
	.logbook { display: flex; flex-direction: column; gap: 3rem; }
	.spread { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }

	.cover { position: sticky; top: 80px; border: 1px solid var(--color-rule); border-radius: 16px; overflow: hidden;
		min-height: 340px; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.4rem; }
	.cover-word { position: absolute; top: -0.3rem; right: 0.6rem; font-size: 5rem; font-weight: 800; letter-spacing: -0.05em;
		color: var(--acc); opacity: 0.14; text-transform: capitalize; line-height: 0.8; pointer-events: none; }
	.cover-content { position: relative; }
	.cover-kicker { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--acc); }
	.cover-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.03em; color: var(--color-ink); margin: 0.2rem 0 1rem; }
	.stats { display: flex; flex-direction: column; gap: 0.5rem; margin: 0 0 1rem; }
	.stats div { display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid var(--color-rule); padding-top: 0.4rem; }
	.stats dt { font-size: 0.75rem; color: var(--color-muted); }
	.stats dd { font-size: 1.1rem; font-weight: 700; color: var(--color-ink); font-variant-numeric: tabular-nums; }
	.stats dd.cap { text-transform: capitalize; font-size: 0.95rem; }
	.pulse { display: flex; height: 10px; border-radius: 6px; overflow: hidden; gap: 2px; }

	.highlights { display: flex; flex-direction: column; gap: 1rem; }
	.big { display: grid; grid-template-columns: 220px 1fr; gap: 1.1rem; text-decoration: none;
		border: 1px solid var(--color-rule); border-radius: 14px; overflow: hidden; background: var(--color-paper);
		transition: border-color 0.3s, transform 0.3s; }
	.big:hover { border-color: var(--acc); transform: translateY(-1px); }
	.big-img { aspect-ratio: 1; background: var(--color-canvas-soft); }
	.big-img img { width: 100%; height: 100%; object-fit: cover; }
	.noimg { display: flex; align-items: center; justify-content: center;
		background: linear-gradient(150deg, var(--color-paper), color-mix(in srgb, var(--acc) 16%, var(--color-paper))); }
	.nw { font-size: 1.1rem; font-weight: 700; color: var(--acc); opacity: 0.4; text-transform: capitalize; }
	.big-body { display: flex; flex-direction: column; justify-content: center; padding: 1rem 1rem 1rem 0; min-width: 0; }
	.kicker { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
	.big-h { font-size: 1.35rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: var(--color-ink); margin: 0.35rem 0; }
	.big-dek { font-family: var(--font-serif); font-size: 0.92rem; color: var(--color-ink-soft); line-height: 1.4;
		display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

	.small-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
	.small { display: flex; flex-direction: column; gap: 0.3rem; text-decoration: none; padding: 0.9rem;
		border: 1px solid var(--color-rule); border-radius: 11px; background: var(--color-paper); transition: border-color 0.3s; }
	.small:hover { border-color: var(--acc); }
	.small .cdot { width: 8px; height: 8px; border-radius: 8px; }
	.small-h { font-size: 0.92rem; font-weight: 600; line-height: 1.18; color: var(--color-ink);
		display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
	.small-meta { font-size: 0.7rem; color: var(--color-muted); text-transform: capitalize; margin-top: auto; }

	.more { align-self: flex-start; font-size: 0.8rem; color: var(--color-muted); background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
	.more:hover { color: var(--color-ink); }
	.rest { list-style: none; padding: 0; margin: 0.2rem 0 0; display: flex; flex-direction: column; }
	.rest a { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0; font-size: 0.88rem; color: var(--color-ink-soft); text-decoration: none; border-top: 1px solid var(--color-rule); }
	.rest a:hover { color: var(--color-ink); }
	.rest .cdot { width: 6px; height: 6px; border-radius: 6px; flex: none; }
	.rest .ri { margin-left: auto; font-size: 0.7rem; color: var(--color-faint); font-variant-numeric: tabular-nums; }

	@media (max-width: 860px) {
		.spread { grid-template-columns: 1fr; }
		.cover { position: static; min-height: 0; }
		.cover-word { font-size: 4rem; }
		.big { grid-template-columns: 120px 1fr; }
		.big-body { padding: 0.8rem 0.8rem 0.8rem 0; }
	}
	@media (max-width: 520px) {
		.small-grid { grid-template-columns: 1fr; }
		.big { grid-template-columns: 1fr; }
		.big-img { aspect-ratio: 16/9; }
		.big-body { padding: 0 1rem 1rem; }
	}
</style>
