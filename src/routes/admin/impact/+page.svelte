<script lang="ts">
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import type { ImpactRun } from './+page.server';
	let { data } = $props();

	const runs = $derived(data.runs as ImpactRun[]); // neueste zuerst
	// Aktiver Lauf (PR offen / blockiert) steht prominent oben; abgehakte in History.
	const latest = $derived((data.active as ImpactRun | null) ?? null);
	const prev = $derived(runs.find((r) => r !== latest) ?? null);

	// Kurations-Queue (Freigabe für morgen) — nach Datum gruppiert, neueste Vorschläge zuerst.
	const curation = $derived((data.curation ?? []) as Array<import('./+page.server').CurationItem>);
	const curationDates = $derived([...new Set(curation.map((c) => c.for_date))].sort());
	const channelLabel: Record<string, string> = { hero: 'Hero (Feed + Mail)', instagram: 'Instagram', email: 'E-Mail' };
	const channelOrder: Record<string, number> = { hero: 0, instagram: 1, email: 2 };
	function itemsForDate(d: string) {
		return curation.filter((c) => c.for_date === d).sort((a, b) => channelOrder[a.channel] - channelOrder[b.channel]);
	}

	let deciding = $state(0);
	async function decideCuration(id: number, approve: boolean) {
		deciding = id;
		await fetch(base + '/api/admin/impact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: approve ? 'curation-approve' : 'curation-reject', id })
		});
		deciding = 0;
		await invalidateAll();
	}

	let marking = $state(false);
	async function markMerged() {
		if (!latest) return;
		marking = true;
		await fetch(base + '/api/admin/impact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'mark-merged', id: latest.id })
		});
		marking = false;
		await invalidateAll();
	}

	// Trend: chronologisch (älteste zuerst), nur Läufe mit Gesamt-Score.
	const series = $derived(
		[...runs]
			.filter((r) => typeof r.scores?.gesamt === 'number')
			.sort((a, b) => a.run_date.localeCompare(b.run_date))
	);
	const latestGesamt = $derived(typeof latest?.scores?.gesamt === 'number' ? latest.scores.gesamt : null);
	const prevGesamt = $derived(typeof prev?.scores?.gesamt === 'number' ? prev.scores.gesamt : null);
	const delta = $derived(
		latestGesamt !== null && prevGesamt !== null ? Math.round((latestGesamt - prevGesamt) * 10) / 10 : null
	);

	const axisLabels: Record<string, string> = { Z: 'Zyniker', S: 'Scroller', E: 'Erschöpfter', D: 'Design' };

	// Letzte Achsen-Scores = Mittel über die Kanäle (feed/instagram/email) des neuesten Laufs.
	function avgAxis(run: ImpactRun | null, ax: 'Z' | 'S' | 'E' | 'D'): number | null {
		if (!run?.scores) return null;
		const vals = Object.entries(run.scores)
			.filter(([k]) => k !== 'gesamt')
			.map(([, v]) => (v && typeof v === 'object' ? (v as Record<string, number>)[ax] : undefined))
			.filter((n): n is number => typeof n === 'number');
		if (vals.length === 0) return null;
		return Math.round((vals.reduce((s, n) => s + n, 0) / vals.length) * 10) / 10;
	}

	// Sparkline für Gesamt-Trend.
	const W = 640, H = 140, PAD = 8;
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
	const trendPath = $derived(pathFor(series.map((r) => r.scores.gesamt as number)));

	const verdictStyle: Record<string, { bg: string; fg: string; label: string }> = {
		confirmed: { bg: '#1f9d63', fg: '#fff', label: 'bestätigt ✓' },
		rejected: { bg: 'var(--color-rose)', fg: '#fff', label: 'verworfen → revertet ✕' },
		pending: { bg: 'var(--color-amber)', fg: '#fff', label: 'wird gemessen' }
	};
	const prStyle: Record<string, { bg: string; fg: string; label: string }> = {
		open: { bg: 'var(--color-amber)', fg: '#fff', label: 'PR offen — wartet auf dich' },
		merged: { bg: '#1f9d63', fg: '#fff', label: 'gemerged — live' },
		closed: { bg: 'var(--color-canvas-soft)', fg: 'var(--color-ink-soft)', label: 'geschlossen' }
	};
</script>

<div class="mb-8">
	<div class="flex items-center justify-between gap-4 flex-wrap mb-1">
		<h1 class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">Impact</h1>
		{#if data.doneCount > 0}
			<a href={base + '/admin/impact/history'} class="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors" style="color: var(--color-ink-soft); border: 1px solid var(--color-rule);">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
				History ({data.doneCount})
			</a>
		{/if}
	</div>
	<p class="text-sm" style="color: var(--color-ink-soft);">
		Tägliche Hoffnungs-Wirkung über alle Kanäle — bewertet von der Impact-Routine.
		{#if latest}<span style="color: var(--color-faint);">Aktueller Lauf: {latest.run_date}</span>{/if}
	</p>
</div>

<!-- KURATION: Freigabe für morgen (dein täglicher Touchpoint) -->
{#if curationDates.length > 0}
	{#each curationDates as d}
		{@const items = itemsForDate(d)}
		{@const hero = items.find((i) => i.channel === 'hero')}
		<div class="rounded-xl p-5 mb-6" style="background: var(--color-paper); border: 2px solid var(--color-amber);">
			<div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
				<div class="text-sm font-semibold" style="color: var(--color-ink);">
					Vorschlag für {d}
					{#if hero?.below_bar}<span class="text-[0.65rem] ml-2 rounded-full px-2 py-0.5" style="background: var(--color-rose); color:#fff;">unter Schwelle — Archiv-Perle</span>
					{:else if hero?.is_pearl}<span class="text-[0.65rem] ml-2 rounded-full px-2 py-0.5" style="background: var(--color-canvas-soft); color: var(--color-ink-soft);">Archiv-Perle</span>{/if}
				</div>
				{#if hero?.resonance_score != null}
					<span class="text-sm" style="color: var(--color-ink-soft);">Resonanz <strong style="color: var(--color-ink);">{hero.resonance_score}/10</strong></span>
				{/if}
			</div>

			{#if hero?.story_title}
				<div class="mb-1 text-base" style="color: var(--color-ink); font-weight: 600;">{hero.story_title}</div>
				{#if hero.story_summary}<div class="text-sm mb-2" style="color: var(--color-ink-soft);">{hero.story_summary}</div>{/if}
			{/if}
			{#if hero?.rationale}<div class="text-sm mb-3 italic" style="color: var(--color-ink-soft);">„{hero.rationale}"</div>{/if}

			<!-- pro Kanal: Status + Freigabe -->
			<div class="flex flex-col gap-2">
				{#each items as it}
					<div class="flex items-center gap-3 px-3 py-2 rounded-lg flex-wrap" style="background: var(--color-canvas-soft);">
						<span class="text-sm font-medium" style="color: var(--color-ink); min-width: 130px;">{channelLabel[it.channel]}</span>
						{#if it.draft && (it.draft.caption || it.draft.subject)}
							<span class="text-xs flex-1 truncate" style="color: var(--color-ink-soft);">{it.draft.subject ?? it.draft.caption}</span>
						{:else}
							<span class="text-xs flex-1" style="color: var(--color-faint);">dieselbe Hero-Story</span>
						{/if}
						{#if it.status === 'approved'}
							<span class="text-[0.6rem] font-bold uppercase rounded-full px-2 py-0.5" style="background:#1f9d63;color:#fff;">freigegeben ✓</span>
						{:else}
							<button type="button" onclick={() => decideCuration(it.id, true)} disabled={deciding === it.id}
								class="text-xs font-medium px-3 py-1.5 rounded-lg" style="background:#1f9d63;color:#fff;opacity:{deciding === it.id ? '0.6' : '1'};">Freigeben</button>
							<button type="button" onclick={() => decideCuration(it.id, false)} disabled={deciding === it.id}
								class="text-xs font-medium px-3 py-1.5 rounded-lg" style="background:transparent;color:var(--color-rose);border:1px solid var(--color-rose);">Ablehnen</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}
{/if}

{#if latest?.status === 'blocked'}
	<div class="rounded-xl p-4 mb-6 flex items-start gap-3" style="background: var(--color-rose-tint); border: 1px solid var(--color-rose);">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-rose)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
		<div>
			<div class="text-sm font-semibold" style="color: var(--color-rose);">Letzter Lauf blockiert — {latest.run_date}</div>
			{#if latest.blocked_reason}<div class="text-sm mt-0.5" style="color: var(--color-ink-soft);">{latest.blocked_reason}</div>{/if}
		</div>
	</div>
{/if}

{#if !data.ok || !latest}
	<div class="rounded-xl p-8 text-center" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
		<p style="color: var(--color-ink-soft);">
			{#if runs.length > 0}
				Alles abgehakt — kein offener Vorschlag. Vergangene Läufe findest du in der
				<a href={base + '/admin/impact/history'} style="color: var(--color-amber);">History</a>.
				Der nächste Morgen-Lauf legt hier ein neues Finding ab.
			{:else}
				Noch kein Impact-Lauf. Sobald die Morgen-Routine läuft und in
				<code>nureine_impact_runs</code> schreibt, erscheinen hier Trend, Finding und der PR-Link.
			{/if}
		</p>
	</div>
{:else}
	<!-- Score-Kacheln -->
	{#if latestGesamt !== null}
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
			<div class="rounded-xl p-4" style="background: var(--color-ink); color: var(--color-paper);">
				<div class="text-[0.6rem] uppercase tracking-[0.16em] opacity-70" style="font-family: var(--font-mono);">Gesamt</div>
				<div class="display text-3xl mt-1" style="font-weight: 600;">{latestGesamt}<span class="text-lg opacity-50">/10</span></div>
				{#if delta !== null}
					<div class="text-xs mt-1" style="color: {delta >= 0 ? '#7fe0a8' : '#ffb4a8'};">{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} ggü. Vortag</div>
				{/if}
			</div>
			{#each ['Z', 'S', 'E', 'D'] as ax}
				{@const v = avgAxis(latest, ax as 'Z')}
				<div class="rounded-xl p-4" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
					<div class="text-[0.6rem] uppercase tracking-[0.16em]" style="color: var(--color-faint); font-family: var(--font-mono);">{axisLabels[ax]}</div>
					<div class="display text-2xl mt-1" style="color: var(--color-ink); font-weight: 600;">{v ?? '–'}<span class="text-base" style="color: var(--color-faint);">/10</span></div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Trend -->
	{#if series.length > 0}
		<div class="rounded-xl p-5 mb-6" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
			<div class="text-sm font-medium mb-3" style="color: var(--color-ink);">Gesamt-Impact über Zeit</div>
			<svg viewBox="0 0 {W} {H}" class="w-full" style="height: 140px;" preserveAspectRatio="none">
				{#each [2.5, 5, 7.5] as gl}
					<line x1={PAD} x2={W - PAD} y1={H - PAD - (gl / 10) * (H - 2 * PAD)} y2={H - PAD - (gl / 10) * (H - 2 * PAD)} stroke="var(--color-rule)" stroke-width="1" stroke-dasharray="2 4" />
				{/each}
				<path d={trendPath} fill="none" stroke="var(--color-amber)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
				{#each series as r, i}
					{@const step = series.length > 1 ? (W - 2 * PAD) / (series.length - 1) : 0}
					{@const x = series.length > 1 ? PAD + i * step : W / 2}
					{@const y = H - PAD - ((r.scores.gesamt as number) / 10) * (H - 2 * PAD)}
					<circle cx={x} cy={y} r="3" fill="var(--color-amber)" />
				{/each}
			</svg>
			<div class="flex justify-between text-[0.65rem] mt-1" style="color: var(--color-faint); font-family: var(--font-mono);">
				<span>{series[0]?.run_date}</span><span>{series.at(-1)?.run_date}</span>
			</div>
		</div>
	{/if}

	<!-- Heutiges Finding + PR -->
	{#if latest && latest.root_cause}
		<div class="rounded-xl p-5 mb-6" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
			<div class="flex items-center gap-2 mb-2 flex-wrap">
				<div class="text-sm font-medium" style="color: var(--color-ink);">Heutiges Finding</div>
				{#if latest.channel}<span class="text-[0.6rem] uppercase tracking-wide rounded px-1.5 py-0.5" style="background: var(--color-canvas-soft); color: var(--color-ink-soft); font-family: var(--font-mono);">{latest.channel}</span>{/if}
			</div>
			<div class="text-sm" style="color: var(--color-ink);"><strong>Ursache (nicht Symptom):</strong> {latest.root_cause}</div>
			{#if latest.change_summary}<div class="text-sm mt-1.5" style="color: var(--color-ink-soft);"><strong>Änderung:</strong> {latest.change_summary}</div>{/if}
			{#if latest.change_file}<div class="text-xs mt-1" style="color: var(--color-faint); font-family: var(--font-mono);">{latest.change_file}</div>{/if}
			{#if latest.predicts}<div class="text-xs mt-1" style="color: var(--color-faint);">Vorhersage: {latest.predicts}</div>{/if}

			{#if latest.pr_url}
				{@const ps = prStyle[latest.pr_state ?? 'open']}
				<div class="mt-4 flex items-center gap-3 flex-wrap">
					<a href={latest.pr_url} target="_blank" rel="noreferrer"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
						style="background: var(--color-ink); color: var(--color-paper);">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
						PR auf GitHub ansehen &amp; mergen{#if latest.pr_number} #{latest.pr_number}{/if}
					</a>
					{#if latest.pr_state === 'open' || !latest.pr_state}
						<button type="button" onclick={markMerged} disabled={marking}
							class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
							style="background: #1f9d63; color: #fff; opacity: {marking ? '0.6' : '1'};">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
							{marking ? 'Speichere…' : 'Als gemerged abhaken'}
						</button>
						<span class="text-xs" style="color: var(--color-faint);">→ wandert in die History</span>
					{:else}
						<span class="text-[0.6rem] font-bold uppercase tracking-wide rounded-full px-2 py-1" style="background: {ps.bg}; color: {ps.fg};">{ps.label}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Vortags-Verifikation -->
	{#if latest?.verdict}
		{@const vs = verdictStyle[latest.verdict] ?? verdictStyle.pending}
		<div class="rounded-xl p-5 mb-6" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
			<div class="flex items-center gap-2 mb-1.5 flex-wrap">
				<div class="text-sm font-medium" style="color: var(--color-ink);">Vortags-Hypothese</div>
				<span class="text-[0.6rem] font-bold uppercase tracking-wide rounded-full px-2 py-0.5" style="background: {vs.bg}; color: {vs.fg};">{vs.label}</span>
				{#if latest.verdict_source}<span class="text-[0.6rem] rounded px-1.5 py-0.5" style="background: var(--color-canvas-soft); color: var(--color-ink-soft);">Signal: {latest.verdict_source}</span>{/if}
				{#if latest.verify_of_date}<span class="text-[0.6rem]" style="color: var(--color-faint); font-family: var(--font-mono);">vom {latest.verify_of_date}</span>{/if}
			</div>
			{#if latest.verdict_note}<div class="text-sm" style="color: var(--color-ink-soft);">{latest.verdict_note}</div>{/if}
		</div>
	{/if}

	<!-- Tages-Log (optional) -->
	{#if latest?.log_markdown}
		<details class="rounded-xl p-5" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
			<summary class="text-sm font-medium cursor-pointer" style="color: var(--color-ink);">Vollständiger Tages-Report</summary>
			<pre class="text-xs mt-3 whitespace-pre-wrap" style="color: var(--color-ink-soft); font-family: var(--font-mono);">{latest.log_markdown}</pre>
		</details>
	{/if}
{/if}
