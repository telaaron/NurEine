<script lang="ts">
	// Screen 5 — Stand der Welt. Die Wand der Langzeit-Trends (Konzept C, ruhiger Teil).
	// Jede Metrik: Baseline → heute + Mini-Sparkline. Gruppiert nach Rubrik.
	import { base } from '$app/paths';
	import { formatDeNumber } from '$lib/app-v2/motion';
	import type { PageData } from './$types';
	import type { WorldMetric } from '$lib/server/queries';

	let { data }: { data: PageData } = $props();

	const RUBRIK: Record<string, string> = {
		ueberleben: 'Überleben',
		planet: 'Planet',
		wissen: 'Wissen',
		frieden: 'Frieden'
	};

	// Nach Rubrik gruppieren, Reihenfolge stabil
	const groups = $derived.by(() => {
		const order = ['ueberleben', 'planet', 'wissen', 'frieden'];
		const by = new Map<string, WorldMetric[]>();
		for (const m of data.metrics) {
			const k = m.category ?? 'sonst';
			if (!by.has(k)) by.set(k, []);
			by.get(k)!.push(m);
		}
		return order.filter((k) => by.has(k)).map((k) => ({ key: k, label: RUBRIK[k] ?? k, metrics: by.get(k)! }));
	});

	function accentFor(cat: string): string {
		switch (cat) {
			case 'ueberleben': return 'var(--rose)';
			case 'planet': return 'var(--sage)';
			case 'wissen': return 'var(--blue)';
			default: return 'var(--amber)';
		}
	}

	// Mini-Sparkline-Pfad (0..100 x 0..30)
	function spark(m: WorldMetric): string {
		const pts = [...(m.series ?? [])].filter((p) => typeof p?.value === 'number').sort((a, b) => a.year - b.year);
		if (pts.length < 2) return '';
		const years = pts.map((p) => p.year);
		const vals = pts.map((p) => p.value);
		const yMin = Math.min(...years), yMax = Math.max(...years);
		const vMin = Math.min(...vals), vMax = Math.max(...vals);
		const vSpan = vMax - vMin || 1;
		return pts
			.map((p, i) => {
				const x = ((p.year - yMin) / (yMax - yMin || 1)) * 100;
				const y = 3 + (1 - (p.value - vMin) / vSpan) * 24;
				return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
			})
			.join(' ');
	}

	function fmt(v: number): string {
		return formatDeNumber(v, Math.abs(v) >= 100 ? 0 : 1);
	}
</script>

<svelte:head>
	<title>Stand der Welt · NurEine</title>
	<meta name="theme-color" content="#f6f1e7" />
</svelte:head>

<div class="welt surface-paper tex">
	<header class="welt-head">
		<div class="welt-kick sf">Stand der Welt</div>
		<h1 class="welt-title sf">Was sich über Jahrzehnte bewegt.</h1>
		<p class="welt-sub">Kein Tagesrauschen — die langen Linien. Monatlich aktualisiert, aus offiziellen Quellen.</p>
	</header>

	{#if data.metrics.length === 0}
		<div class="welt-empty">
			<p>Die Weltdaten werden gerade aktualisiert.<br />Schau bald wieder rein.</p>
		</div>
	{:else}
		{#each groups as g}
			<section class="rubrik" style="--accent:{accentFor(g.key)}">
				<h2 class="rubrik-title sf">{g.label}</h2>
				<div class="cards">
					{#each g.metrics as m}
						{@const better = (m.direction === 'down' ? m.latest_value < m.baseline_value : m.latest_value > m.baseline_value)}
						<div class="card">
							<div class="card-top">
								<span class="card-label sf">{m.label}</span>
								<span class="card-dir sf" class:good={better}>{m.direction === 'down' ? '↓' : '↑'}</span>
							</div>
							<div class="card-nums">
								<span class="card-was num">{fmt(m.baseline_value)}</span>
								<span class="card-arrow">→</span>
								<span class="card-now num">{fmt(m.latest_value)}<span class="card-unit">{m.unit}</span></span>
							</div>
							<div class="card-years sf">{m.baseline_year} → {m.latest_year}</div>
							<svg class="card-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
								<path d={spark(m)} fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
							</svg>
							{#if m.blurb}<p class="card-blurb">{m.blurb}</p>{/if}
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}

	<div class="welt-foot">
		<a class="pill" href={base + '/app'}>Zur heutigen Ausgabe</a>
	</div>
</div>

<style>
	.welt {
		min-height: 100dvh;
		padding: max(56px, calc(env(safe-area-inset-top) + 30px)) 20px max(40px, env(safe-area-inset-bottom));
	}
	.welt-head { margin-bottom: 28px; }
	.welt-kick { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--amber); }
	.welt-title { font-size: clamp(24px, 6vw, 30px); letter-spacing: -0.02em; line-height: 1.14; margin: 8px 0 8px; color: var(--paper-ink); text-wrap: balance; }
	.welt-sub { font-size: 14px; color: var(--paper-muted); max-width: 42ch; line-height: 1.5; margin: 0; }

	.welt-empty { padding: 60px 0; text-align: center; color: var(--paper-muted); font-size: 15px; line-height: 1.6; }

	.rubrik { margin-bottom: 30px; }
	.rubrik-title { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin: 0 0 14px; }
	.cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
	@media (min-width: 560px) { .cards { grid-template-columns: 1fr 1fr; } }

	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 15px;
		padding: 15px 16px;
	}
	.card-top { display: flex; justify-content: space-between; align-items: baseline; }
	.card-label { font-size: 14px; color: var(--paper-ink); letter-spacing: -0.01em; }
	.card-dir { font-size: 16px; color: var(--paper-faint); }
	.card-dir.good { color: var(--accent); }
	.card-nums { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; }
	.card-was { font-size: 18px; color: var(--paper-faint); }
	.card-arrow { color: var(--paper-faint); font-size: 13px; }
	.card-now { font-size: 30px; color: var(--paper-ink); }
	.card-unit { font-size: 0.45em; color: var(--paper-muted); margin-left: 3px; letter-spacing: 0; }
	.card-years { font-size: 11px; color: var(--paper-faint); font-variant-numeric: tabular-nums; margin-top: 4px; letter-spacing: 0.04em; }
	.card-spark { width: 100%; height: 30px; margin-top: 12px; display: block; }
	.card-blurb { font-size: 12px; color: var(--paper-muted); line-height: 1.45; margin: 10px 0 0; }

	.welt-foot { margin-top: 8px; }
	.pill {
		display: block;
		width: 100%;
		text-align: center;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 15px;
		background: var(--amber);
		color: #fff;
		border: none;
		border-radius: 999px;
		padding: 16px;
		text-decoration: none;
	}
</style>
