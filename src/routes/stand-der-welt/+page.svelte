<script lang="ts">
	import { base } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import { ArrowTopRightOnSquareIcon, XMarkIcon } from 'heroicons-svelte/24/outline';
	import ShareBar from '$lib/components/ShareBar.svelte';
	import CountUp from '$lib/components/CountUp.svelte';
	import DrawPath from '$lib/components/DrawPath.svelte';
	import SoundToggle from '$lib/components/SoundToggle.svelte';
	import { chime } from '$lib/sound';

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

	const catOrder = ['ueberleben', 'planet', 'wissen', 'frieden'];
	const grouped = $derived(
		catOrder
			.map((c) => ({ cat: c, items: metrics.filter((m) => m.category === c) }))
			.filter((g) => g.items.length)
	);

	// Detail modal
	let active = $state<Metric | null>(null);

	function openDetail(m: Metric) {
		active = m;
		// Leiser Zwei-Ton beim Öffnen — markiert den Moduswechsel, bevor die
		// Kurve losläuft. chime() ist selbst stumm, wenn Klang aus ist.
		chime();
	}

	// Larger detail chart: real value axis (not flipped), gridlines, year labels.
	function detailPath(m: Metric, w: number, h: number, pad = 4): string {
		const s = m.series;
		if (s.length < 2) return '';
		const xs = s.map((p) => p.year), ys = s.map((p) => p.value);
		const minX = Math.min(...xs), maxX = Math.max(...xs);
		const minY = Math.min(...ys), maxY = Math.max(...ys);
		const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad);
		const sy = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad);
		return s.map((p, i) => `${i ? 'L' : 'M'}${sx(p.year).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ');
	}
</script>

<svelte:head>
	<title>Der Stand der Welt — wo sie besser wird — NurEine</title>
	<!-- description: zentral in +layout.svelte (pathDescriptions) — siehe Kommentar dort -->
</svelte:head>

<section class="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Der Stand der Welt</span>
	<h1 class="display mt-4 text-3xl sm:text-4xl lg:text-5xl leading-[1.04] max-w-[20ch]" style="color: var(--color-ink); font-weight: 600;">
		Wo die Welt besser wird — belegt.
	</h1>

	{#if headline}
		<!-- Die Leitzahl zählt herunter statt einfach dazustehen: der Weg von 1990
		     nach heute IST die Nachricht. Nur diese eine Zahl klingt beim Hochlauf —
		     sie steht allein und ist der Einstieg in die Seite. -->
		<p class="mt-6 text-xl sm:text-2xl lg:text-3xl leading-[1.35] max-w-[24ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Extreme Armut: <span style="color: var(--color-amber);">{fmt(headline.baseline_value, '%')}</span> ({headline.baseline_year})
			→ <CountUp
				value={headline.latest_value}
				format={(v) => fmt(v, '%')}
				duration={1600}
				style="color: var(--color-amber);"
			/> ({headline.latest_year}).
			Dieselbe Welt. Eine andere Geschichte.
		</p>
	{/if}

	<!-- Klang-Schalter direkt unter der Leitzahl: dort passiert der erste Ton,
	     also gehört die Kontrolle auch dorthin. Default aus. -->
	<div class="mt-5">
		<SoundToggle />
	</div>

	<!-- Metric cards, grouped by category -->
	{#each grouped as group (group.cat)}
		<div class="mt-12">
			<h2 class="eyebrow mb-5" style="color: var(--color-amber); font-family: var(--font-mono);">{catLabels[group.cat] ?? group.cat}</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
				{#each group.items as m (m.metric_key)}
					<button type="button" onclick={() => openDetail(m)}
						class="paper rounded-2xl p-6 flex flex-col text-left transition-all hover:-translate-y-0.5"
						style="border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm); cursor: pointer;">
						<div class="flex items-center justify-between gap-2">
							<h3 class="display text-lg" style="color: var(--color-ink); font-weight: 600;">{m.label}</h3>
							{#if improvement(m)}
								<span class="uppercase shrink-0" style="font-family: var(--font-mono); font-size: 0.56rem; letter-spacing: 0.06em; color: var(--color-sage);">↑ {improvement(m)}</span>
							{/if}
						</div>
						<div class="mt-2 flex items-baseline gap-2">
							<!-- Karten-Zahlen laufen hoch, aber STUMM: beim Scrollen werden
							     mehrere gleichzeitig sichtbar — gleichzeitige Tonleitern
							     wären Lärm statt Akzent. -->
							<CountUp
								value={m.latest_value}
								format={(v) => fmt(v, m.unit)}
								sound={false}
								class="display tnum text-3xl"
								style="color: var(--color-ink); font-weight: 600;"
							/>
							<span class="tnum" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-faint);">{m.latest_year}</span>
						</div>
						<svg viewBox="0 0 260 64" class="mt-4 w-full" style="height: 56px;" preserveAspectRatio="none" aria-hidden="true">
							<DrawPath d={sparkline(m)} duration={1200} />
						</svg>
						<span class="mt-3 text-xs" style="font-family: var(--font-mono); color: var(--color-faint);">Details ansehen →</span>
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<p class="mt-12 text-sm" style="color: var(--color-faint); font-family: var(--font-serif);">Daten werden geladen.</p>
	{/each}

	<!-- Detail modal -->
	{#if active}
		{@const m = active}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(22,20,15,0.55); backdrop-filter: blur(3px);" onclick={() => (active = null)}>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="paper rounded-2xl w-full max-w-[640px] p-6 sm:p-8" style="box-shadow: var(--shadow-lg);" onclick={(e) => e.stopPropagation()}>
				<div class="flex items-start justify-between gap-4">
					<div>
						<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">{catLabels[m.category] ?? m.category}</span>
						<h3 class="display text-2xl mt-2" style="color: var(--color-ink); font-weight: 600;">{m.label}</h3>
					</div>
					<button type="button" onclick={() => (active = null)} aria-label="Schließen" class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style="border: 1px solid var(--color-rule);">
						<Icon icon={XMarkIcon} label="Schließen" size="1rem" />
					</button>
				</div>

				<div class="mt-4 flex items-baseline gap-3">
					<!-- Im Detail-Fenster steht die Zahl allein — hier darf sie klingen. -->
					{#key m.metric_key}
						<CountUp
							value={m.latest_value}
							format={(v) => fmt(v, m.unit)}
							duration={1200}
							class="display tnum text-4xl"
							style="color: var(--color-ink); font-weight: 600;"
						/>
					{/key}
					<span class="tnum" style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-faint);">{m.latest_year}</span>
					{#if improvement(m)}<span class="ml-auto uppercase" style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--color-sage);">↑ {improvement(m)}</span>{/if}
				</div>

				<!-- full detail chart -->
				<div class="mt-5 rounded-xl p-4" style="background: var(--color-canvas-soft);">
					<!-- Die große Kurve zeichnet sich MIT Tonleiter: sie steht allein im
					     Fenster, hier kollidiert nichts. {#key} sorgt dafür, dass beim
					     Wechsel auf eine andere Metrik neu gezeichnet wird. -->
					{#key m.metric_key}
						<svg viewBox="0 0 600 220" class="w-full" style="height: 200px;" preserveAspectRatio="none">
							<DrawPath d={detailPath(m, 600, 220)} duration={1600} sound={true} width={2.5} />
						</svg>
					{/key}
					<div class="flex justify-between mt-2 tnum" style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--color-faint);">
						<span>{m.series[0]?.year}: {fmt(m.series[0]?.value, m.unit)}</span>
						<span>{m.series[m.series.length - 1]?.year}: {fmt(m.series[m.series.length - 1]?.value, m.unit)}</span>
					</div>
				</div>

				{#if m.blurb}<p class="mt-5 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{m.blurb}</p>{/if}
				<div class="mt-5 pt-4 flex items-center justify-between" style="border-top: 1px solid var(--color-rule);">
					<span style="font-family: var(--font-mono); font-size: 0.66rem; color: var(--color-faint);">Quelle: {m.source}</span>
					{#if m.source_url}<a href={m.source_url} target="_blank" rel="noreferrer" style="font-family: var(--font-mono); font-size: 0.66rem; color: var(--color-amber);">Methodik <Icon icon={ArrowTopRightOnSquareIcon} size="0.66rem" /></a>{/if}
				</div>
			</div>
		</div>
	{/if}

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
