<script lang="ts">
	import { base } from '$app/paths';
	import ShareBar from '$lib/components/ShareBar.svelte';

	type Metric = {
		metric_key: string;
		label: string;
		category: string;
		unit: string | null;
		latest_value: number;
		latest_year: number;
		baseline_value: number;
		baseline_year: number;
		direction: 'up' | 'down';
		blurb: string | null;
		series: { year: number; value: number }[];
		source: string | null;
		source_url: string | null;
	};

	let { data } = $props();
	const metrics = $derived((data.metrics as Metric[]) ?? []);

	const catLabels: Record<string, string> = {
		ueberleben: 'Überleben',
		planet: 'Planet',
		wissen: 'Wissen',
		frieden: 'Frieden'
	};

	function fmt(n: number, unit: string | null): string {
		const v = Number.isInteger(n) ? n.toString() : n.toFixed(1).replace('.', ',');
		return unit === '%' ? `${v} %` : unit === 'Jahre' ? `${v} Jahre` : unit === '/1000' ? v : v;
	}

	// "um X % verbessert" relative to baseline, respecting direction.
	function improvement(m: Metric): string {
		if (!m.baseline_value) return '';
		const change = ((m.latest_value - m.baseline_value) / m.baseline_value) * 100;
		const better = m.direction === 'up' ? change > 0 : change < 0;
		const pct = Math.abs(Math.round(change));
		if (!better || pct === 0) return '';
		return `${pct} % besser seit ${m.baseline_year}`;
	}

	// SVG sparkline path from series, normalized; flips so "better" always trends up visually.
	function sparkline(m: Metric, w = 260, h = 64): string {
		const s = m.series;
		if (s.length < 2) return '';
		const xs = s.map((p) => p.year);
		const ys = s.map((p) => (m.direction === 'down' ? -p.value : p.value));
		const minX = Math.min(...xs), maxX = Math.max(...xs);
		const minY = Math.min(...ys), maxY = Math.max(...ys);
		const sx = (x: number) => ((x - minX) / (maxX - minX || 1)) * w;
		const sy = (y: number) => h - ((y - minY) / (maxY - minY || 1)) * h;
		return s.map((p, i) => `${i ? 'L' : 'M'}${sx(p.year).toFixed(1)},${sy(m.direction === 'down' ? -p.value : p.value).toFixed(1)}`).join(' ');
	}

	const headline = $derived(metrics.find((m) => m.metric_key === 'extreme_poverty'));
</script>

<svelte:head>
	<title>Der Stand der Welt — wo sie besser wird — NurEine</title>
	<meta
		name="description"
		content="Auf den Metriken, die wirklich zählen, bewegt sich die Welt in die richtige Richtung. Kuratierte Langzeit-Daten — und ehrlich, was wir nicht zeigen."
	/>
</svelte:head>

<section class="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Der Stand der Welt</span>
	<h1 class="display mt-4 text-3xl sm:text-4xl lg:text-5xl leading-[1.04] max-w-[20ch]" style="color: var(--color-ink); font-weight: 600;">
		Wo die Welt besser wird — belegt.
	</h1>

	{#if headline}
		<p class="mt-6 text-xl sm:text-2xl lg:text-3xl leading-[1.35] max-w-[24ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Extreme Armut: <span style="color: var(--color-amber);">{fmt(headline.baseline_value, '%')}</span> ({headline.baseline_year})
			→ <span style="color: var(--color-amber);">{fmt(headline.latest_value, '%')}</span> ({headline.latest_year}).
			Dieselbe Welt. Eine andere Geschichte.
		</p>
	{/if}

	<!-- Metric cards -->
	<div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
		{#each metrics as m (m.metric_key)}
			<div class="paper rounded-2xl p-6 flex flex-col" style="border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
				<div class="flex items-center justify-between">
					<span class="uppercase" style="font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.14em; color: var(--color-faint);">{catLabels[m.category] ?? m.category}</span>
					{#if improvement(m)}
						<span class="uppercase" style="font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.08em; color: var(--color-sage);">↑ {improvement(m)}</span>
					{/if}
				</div>
				<h2 class="display text-lg mt-3" style="color: var(--color-ink); font-weight: 600;">{m.label}</h2>
				<div class="mt-2 flex items-baseline gap-2">
					<span class="display tnum text-3xl" style="color: var(--color-ink); font-weight: 600;">{fmt(m.latest_value, m.unit)}</span>
					<span class="tnum" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-faint);">{m.latest_year}</span>
				</div>
				<!-- sparkline -->
				<svg viewBox="0 0 260 64" class="mt-4 w-full" style="height: 56px;" preserveAspectRatio="none" aria-hidden="true">
					<path d={sparkline(m)} fill="none" stroke="var(--color-amber)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
				</svg>
				{#if m.blurb}<p class="mt-3 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{m.blurb}</p>{/if}
				<div class="mt-auto pt-3 flex items-center justify-between" style="border-top: 1px solid var(--color-rule);">
					<span style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--color-faint);">{m.source}</span>
					{#if m.source_url}<a href={m.source_url} target="_blank" rel="noreferrer" style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--color-amber);">Quelle ↗</a>{/if}
				</div>
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-faint); font-family: var(--font-serif);">Daten werden geladen.</p>
		{/each}
	</div>

	<!-- Honesty layer -->
	<div class="mt-12 p-6 sm:p-8 rounded-2xl" style="background: var(--color-canvas-soft); border-left: 3px solid var(--color-amber);">
		<h2 class="display text-xl sm:text-2xl" style="color: var(--color-ink); font-weight: 600;">Was wir nicht zeigen</h2>
		<p class="mt-3 text-base leading-relaxed max-w-[64ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Es gibt Metriken, die sich verschlechtern — CO₂-Konzentration, Artenvielfalt, Ungleichheit.
			Wir zeigen sie hier nicht, weil NurEine <strong>Fortschritt dokumentiert, nicht die Gesamtlage</strong>.
			Das ist keine Schönfärberei: Es ist eine bewusste Auswahl, und wir legen sie offen. Für das
			vollständige Bild — auch das Schwierige — empfehlen wir
			<a href="https://ourworldindata.org" target="_blank" rel="noreferrer" style="color: var(--color-amber); border-bottom: 1px solid var(--color-rule-strong);">Our World in Data</a>.
		</p>
		<p class="mt-4 text-sm" style="color: var(--color-muted); font-family: var(--font-mono);">
			Daten monatlich aktualisiert · nicht tagesaktuell (die meisten Indikatoren ändern sich jährlich).
		</p>
	</div>

	<div class="mt-10 text-center">
		<p class="serif text-sm sm:text-base italic" style="color: var(--color-muted);">Den Stand der Welt teilen</p>
		<div class="mt-3 flex items-center justify-center">
			<ShareBar url="https://nureine.de/stand-der-welt" title="Der Stand der Welt — NurEine" text="Auf den Metriken, die wirklich zählen, wird die Welt besser. Belegt." size={20} />
		</div>
	</div>

	<a href={base + '/'} class="mt-10 inline-flex items-center gap-2 text-sm hover:opacity-70" style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);">
		<span aria-hidden="true">←</span> Zur heutigen Geschichte
	</a>
</section>
