<script lang="ts">
	let { data } = $props();

	// Chronologisch (älteste zuerst) für den Trend.
	const series = $derived([...data.history].sort((a, b) => a.date.localeCompare(b.date)));
	const latest = $derived(series.at(-1) ?? null);
	const prev = $derived(series.at(-2) ?? null);
	const delta = $derived(
		latest && prev ? Math.round((latest.scores.gesamt - prev.scores.gesamt) * 10) / 10 : null
	);

	const axisLabels: Record<string, string> = {
		Z: 'Zyniker',
		S: 'Scroller',
		E: 'Erschöpfter',
		D: 'Design'
	};

	// Inline-Sparkline für den Gesamt-Trend (kein Chart-Lib — eine SVG-Polyline).
	const W = 640;
	const H = 140;
	const PAD = 8;
	function pathFor(values: number[]): string {
		if (values.length === 0) return '';
		if (values.length === 1) {
			const y = H - PAD - (values[0] / 10) * (H - 2 * PAD);
			return `M ${PAD} ${y} L ${W - PAD} ${y}`;
		}
		const step = (W - 2 * PAD) / (values.length - 1);
		return values
			.map((v, i) => {
				const x = PAD + i * step;
				const y = H - PAD - (v / 10) * (H - 2 * PAD);
				return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
			})
			.join(' ');
	}
	const trendPath = $derived(pathFor(series.map((h) => h.scores.gesamt)));

	const statusStyle: Record<string, { bg: string; fg: string; label: string }> = {
		applied: { bg: 'var(--color-amber)', fg: '#fff', label: 'live — wird gemessen' },
		confirmed: { bg: '#1f9d63', fg: '#fff', label: 'bestätigt ✓' },
		rejected: { bg: 'var(--color-rose)', fg: '#fff', label: 'verworfen → revertet ✕' }
	};
</script>

<div class="mb-8">
	<h1 class="display text-2xl mb-1" style="color: var(--color-ink); font-weight: 600;">Impact</h1>
	<p class="text-sm" style="color: var(--color-ink-soft);">
		Tägliche Hoffnungs-Wirkung über alle Kanäle — bewertet von der Impact-Routine.
		{#if data.lastRun}
			<span style="color: var(--color-faint);">Letzter Lauf: {data.lastRun}</span>
		{/if}
	</p>
</div>

{#if data.lastRunStatus === 'blocked'}
	<div class="rounded-xl p-4 mb-6 flex items-start gap-3" style="background: var(--color-rose-tint); border: 1px solid var(--color-rose);">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-rose)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
		<div>
			<div class="text-sm font-semibold" style="color: var(--color-rose);">Letzter Lauf blockiert{#if data.lastRun} — {data.lastRun}{/if}</div>
			{#if data.blockedReason}
				<div class="text-sm mt-0.5" style="color: var(--color-ink-soft);">{data.blockedReason}</div>
			{/if}
		</div>
	</div>
{/if}

{#if !data.ok || series.length === 0}
	<div class="rounded-xl p-8 text-center" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
		<p style="color: var(--color-ink-soft);">
			Noch kein Impact-Lauf. Sobald die Morgen-Routine zum ersten Mal läuft und
			<code>nureine-impact/state.json</code> committet, erscheinen hier Trend, Hypothesen-Status und die heutige Änderung.
		</p>
	</div>
{:else}
	<!-- Score-Kacheln -->
	{#if latest}
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
			<div class="rounded-xl p-4" style="background: var(--color-ink); color: var(--color-paper);">
				<div class="text-[0.6rem] uppercase tracking-[0.16em] opacity-70" style="font-family: var(--font-mono);">Gesamt</div>
				<div class="display text-3xl mt-1" style="font-weight: 600;">{latest.scores.gesamt}<span class="text-lg opacity-50">/10</span></div>
				{#if delta !== null}
					<div class="text-xs mt-1" style="color: {delta >= 0 ? '#7fe0a8' : '#ffb4a8'};">
						{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} ggü. Vortag
					</div>
				{/if}
			</div>
			{#each ['Z', 'S', 'E', 'D'] as ax}
				<div class="rounded-xl p-4" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
					<div class="text-[0.6rem] uppercase tracking-[0.16em]" style="color: var(--color-faint); font-family: var(--font-mono);">{axisLabels[ax]}</div>
					<div class="display text-2xl mt-1" style="color: var(--color-ink); font-weight: 600;">{latest.scores[ax as 'Z']}<span class="text-base" style="color: var(--color-faint);">/10</span></div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Trend -->
	<div class="rounded-xl p-5 mb-6" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
		<div class="text-sm font-medium mb-3" style="color: var(--color-ink);">Gesamt-Impact über Zeit</div>
		<svg viewBox="0 0 {W} {H}" class="w-full" style="height: 140px;" preserveAspectRatio="none">
			{#each [2.5, 5, 7.5] as gl}
				<line x1={PAD} x2={W - PAD} y1={H - PAD - (gl / 10) * (H - 2 * PAD)} y2={H - PAD - (gl / 10) * (H - 2 * PAD)} stroke="var(--color-rule)" stroke-width="1" stroke-dasharray="2 4" />
			{/each}
			<path d={trendPath} fill="none" stroke="var(--color-amber)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
			{#each series as h, i}
				{@const step = series.length > 1 ? (W - 2 * PAD) / (series.length - 1) : 0}
				{@const x = series.length > 1 ? PAD + i * step : W / 2}
				{@const y = H - PAD - (h.scores.gesamt / 10) * (H - 2 * PAD)}
				<circle cx={x} cy={y} r="3" fill="var(--color-amber)" />
			{/each}
		</svg>
		<div class="flex justify-between text-[0.65rem] mt-1" style="color: var(--color-faint); font-family: var(--font-mono);">
			<span>{series[0]?.date}</span>
			<span>{series.at(-1)?.date}</span>
		</div>
	</div>

	<!-- Hypothesen: Vortag + offen -->
	<div class="rounded-xl p-5 mb-6" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
		<div class="text-sm font-medium mb-3" style="color: var(--color-ink);">Hypothesen (Ursache → Wirkung)</div>
		{#if data.openHypotheses.length === 0}
			<p class="text-sm" style="color: var(--color-faint);">Keine offenen Hypothesen.</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.openHypotheses as h}
					{@const st = statusStyle[h.status] ?? statusStyle.applied}
					<div class="rounded-lg p-3" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
						<div class="flex items-center gap-2 mb-1.5 flex-wrap">
							<span class="text-[0.6rem] font-bold uppercase tracking-wide rounded-full px-2 py-0.5" style="background: {st.bg}; color: {st.fg};">{st.label}</span>
							<span class="text-[0.6rem] uppercase tracking-wide" style="color: var(--color-faint); font-family: var(--font-mono);">{h.channel} · {h.created}</span>
							{#if h.verdict_source}
								<span class="text-[0.6rem] rounded px-1.5 py-0.5" style="background: var(--color-paper); color: var(--color-ink-soft); border: 1px solid var(--color-rule);">Signal: {h.verdict_source}</span>
							{/if}
						</div>
						<div class="text-sm" style="color: var(--color-ink);"><strong>Ursache:</strong> {h.root_cause}</div>
						<div class="text-sm mt-0.5" style="color: var(--color-ink-soft);"><strong>Änderung:</strong> {h.change}</div>
						{#if h.predicts}
							<div class="text-xs mt-1" style="color: var(--color-faint);">Vorhersage: {h.predicts}</div>
						{/if}
						{#if h.verdict_note}
							<div class="text-xs mt-1" style="color: var(--color-ink-soft);">Befund: {h.verdict_note}</div>
						{/if}
						<div class="flex gap-3 mt-2 text-xs">
							{#if h.file}<span style="color: var(--color-faint); font-family: var(--font-mono);">{h.file}</span>{/if}
							{#if h.commit_sha}<a href={`https://github.com/telaaron/NurEine/commit/${h.commit_sha}`} target="_blank" rel="noreferrer" style="color: var(--color-amber); font-family: var(--font-mono);">{h.commit_sha.slice(0, 7)} →</a>{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
