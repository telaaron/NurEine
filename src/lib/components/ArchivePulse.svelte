<script lang="ts">
	import { base } from '$app/paths';
	import { groupByMonth, dayParts, CATEGORY_TONE, type ArchiveStory, type MonthGroup } from '$lib/archive-timeline';

	let { stories }: { stories: ArchiveStory[] } = $props();
	const months = $derived(groupByMonth(stories));

	const TONE_VAR: Record<string, string> = {
		amber: 'var(--color-amber)', sage: 'var(--color-sage)', rose: 'var(--color-rose)', sky: 'var(--color-sky)'
	};
	function catColor(cat: string): string {
		return TONE_VAR[CATEGORY_TONE[cat] ?? 'amber'];
	}
	function href(slug: string) { return `${base}/geschichte/${slug}`; }
	function imgSrc(hero: string, w = 200) {
		return hero && hero.startsWith('http') ? `${base}/img?url=${encodeURIComponent(hero)}&w=${w}` : '';
	}
	// Wie viele Tage pro Monat ausklappen (Rest hinter „mehr").
	let expanded = $state<Record<string, boolean>>({});
</script>

<div class="pulse-wrap">
	{#each months as m (m.key)}
		<section class="month" id={'m-' + m.key}>
			<!-- Kapitelkopf -->
			<header class="mhead">
				<div class="mtitle">
					<span class="display mlabel">{m.label}</span>
					<span class="mmeta">{m.count} {m.count === 1 ? 'gute Nachricht' : 'gute Nachrichten'}</span>
				</div>
				<!-- PULS: ein Segment pro Kategorie-Anteil des Monats -->
				<div class="pulse" role="img" aria-label={'Kategorie-Verteilung ' + m.label}>
					{#each m.categoryShare as c}
						<span class="seg" style="flex: {c.count}; background: {catColor(c.category)};" title={c.category + ' · ' + c.count}></span>
					{/each}
				</div>
				<div class="legend">
					{#each m.categoryShare.slice(0, 4) as c}
						<span class="lg"><span class="dot" style="background: {catColor(c.category)}"></span>{c.category} {Math.round(c.pct * 100)}%</span>
					{/each}
				</div>
			</header>

			<!-- Monats-Höhepunkt -->
			{#if m.topStory}
				<a class="hero-row" href={href(m.topStory.slug)} style="--acc: {catColor(m.topStory.category)}">
					{#if imgSrc(m.topStory.hero, 400)}
						<div class="hero-thumb"><img src={imgSrc(m.topStory.hero, 400)} alt="" loading="lazy" /></div>
					{:else}
						<div class="hero-thumb noimg" style="--tone: {catColor(m.topStory.category)}">
							<span class="display noimg-word">{m.topStory.category}</span>
						</div>
					{/if}
					<div class="hero-body">
						<span class="kicker" style="color: {catColor(m.topStory.category)}">Höhepunkt · {m.topStory.category}</span>
						<h3 class="display hero-h">{m.topStory.title}</h3>
						<p class="hero-dek">{m.topStory.dek}</p>
						<span class="wirk">Wirkung {m.topStory.impactScore}/100</span>
					</div>
				</a>
			{/if}

			<!-- Tage als kompakte Zeilen -->
			<div class="days">
				{#each (expanded[m.key] ? m.days : m.days.slice(0, 6)) as d (d.iso)}
					{@const p = dayParts(d.iso)}
					<div class="day">
						<div class="date">
							<span class="wd">{p.weekday}</span>
							<span class="dn">{p.day}. {p.monthShort}</span>
						</div>
						<span class="pip" style="background: {catColor(d.topCategory)}"></span>
						<div class="dstories">
							{#each d.stories as s (s.slug)}
								<a class="srow" href={href(s.slug)}>
									<span class="cdot" style="background: {catColor(s.category)}"></span>
									<span class="stitle">{s.title}</span>
									<span class="simp">{s.impactScore}</span>
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			{#if m.days.length > 6}
				<button class="more" onclick={() => (expanded[m.key] = !expanded[m.key])}>
					{expanded[m.key] ? 'weniger' : `alle ${m.days.length} Tage im ${m.label.split(' ')[0]}`}
				</button>
			{/if}
		</section>
	{/each}
</div>

<style>
	.pulse-wrap { display: flex; flex-direction: column; gap: 3.5rem; }
	.month { }
	.mhead { border-bottom: 1px solid var(--color-rule); padding-bottom: 1rem; margin-bottom: 1.5rem; }
	.mtitle { display: flex; align-items: baseline; gap: 0.9rem; flex-wrap: wrap; }
	.mlabel { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.03em; color: var(--color-ink); }
	.mmeta { font-size: 0.85rem; color: var(--color-muted); }
	.pulse { display: flex; height: 12px; border-radius: 8px; overflow: hidden; margin-top: 0.9rem; gap: 2px; }
	.seg { min-width: 3px; opacity: 0.9; }
	.legend { display: flex; flex-wrap: wrap; gap: 0.75rem 1.1rem; margin-top: 0.7rem; }
	.lg { font-size: 0.72rem; color: var(--color-muted); text-transform: capitalize; display: inline-flex; align-items: center; gap: 0.35rem; letter-spacing: 0.02em; }
	.dot { width: 8px; height: 8px; border-radius: 8px; display: inline-block; }

	.hero-row {
		display: grid; grid-template-columns: 128px 1fr; gap: 1.1rem; align-items: stretch;
		padding: 0.9rem; border: 1px solid var(--color-rule); border-radius: 14px;
		background: var(--color-paper); text-decoration: none; margin-bottom: 1.6rem;
		transition: border-color 0.3s, transform 0.3s;
	}
	.hero-row:hover { border-color: var(--acc); transform: translateY(-1px); }
	.hero-thumb { border-radius: 10px; overflow: hidden; aspect-ratio: 1; background: var(--color-canvas-soft); }
	.hero-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.noimg { display: flex; align-items: center; justify-content: center;
		background: linear-gradient(150deg, var(--color-paper), color-mix(in srgb, var(--tone) 16%, var(--color-paper))); }
	.noimg-word { font-size: 1rem; font-weight: 700; color: var(--tone); opacity: 0.4; text-transform: capitalize; }
	.hero-body { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
	.kicker { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
	.hero-h { font-size: 1.3rem; font-weight: 700; line-height: 1.12; letter-spacing: -0.02em; color: var(--color-ink); margin: 0.3rem 0; }
	.hero-dek { font-family: var(--font-serif); font-size: 0.92rem; color: var(--color-ink-soft); line-height: 1.4;
		display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.wirk { font-size: 0.72rem; color: var(--color-muted); margin-top: 0.4rem; }

	.days { display: flex; flex-direction: column; }
	.day { display: grid; grid-template-columns: 68px 14px 1fr; gap: 0.5rem; padding: 0.55rem 0; border-top: 1px solid var(--color-rule); align-items: start; }
	.date { display: flex; flex-direction: column; line-height: 1.1; }
	.wd { font-size: 0.72rem; font-weight: 700; color: var(--color-ink); }
	.dn { font-size: 0.68rem; color: var(--color-faint); }
	.pip { width: 9px; height: 9px; border-radius: 9px; margin-top: 5px; }
	.dstories { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
	.srow { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; padding: 0.12rem 0; min-width: 0; }
	.cdot { width: 6px; height: 6px; border-radius: 6px; flex: none; }
	.stitle { font-size: 0.9rem; color: var(--color-ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.srow:hover .stitle { color: var(--color-ink); text-decoration: underline; text-underline-offset: 2px; }
	.simp { font-size: 0.7rem; color: var(--color-faint); margin-left: auto; flex: none; font-variant-numeric: tabular-nums; }
	.more { margin-top: 0.8rem; font-size: 0.8rem; color: var(--color-muted); background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
	.more:hover { color: var(--color-ink); }

	@media (max-width: 640px) {
		.hero-row { grid-template-columns: 88px 1fr; }
		.hero-h { font-size: 1.1rem; }
	}
</style>
