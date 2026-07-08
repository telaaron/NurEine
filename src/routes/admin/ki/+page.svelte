<script lang="ts">
	let { data } = $props();

	const AGENT_LABELS: Record<string, string> = {
		chefredakteur: 'Chefredakteur',
		veredler: 'Story-Veredler',
		'bild-regie': 'Bild-Regie',
		analyst: 'Analyst',
		'reel-regie': 'Reel-Regie',
		verbesserer: 'Verbesserer'
	};
	const agentLabel = (a: string) => AGENT_LABELS[a] ?? a;

	function statusColor(s: string) {
		return s === 'ok' ? 'var(--color-sage)'
			: s === 'running' ? 'var(--color-amber)'
			: s === 'partial' ? 'var(--color-amber)'
			: s === 'failed' ? 'var(--color-rose)'
			: 'var(--color-muted)';
	}
	function outcomeColor(o: string | null) {
		return o === 'improved' ? 'var(--color-sage)' : o === 'worse' ? 'var(--color-rose)' : 'var(--color-muted)';
	}
	function fmtTime(t: string | null) {
		if (!t) return '—';
		const d = new Date(t);
		return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
	}
	function dur(a: string | null, b: string | null) {
		if (!a || !b) return '';
		const ms = new Date(b).getTime() - new Date(a).getTime();
		return ms > 0 ? `${Math.round(ms / 1000)}s` : '';
	}

	const q = $derived(data.quality);
	const maxRes = $derived(Math.max(1, ...Object.values(q.resBuckets)));
	const openIdeas = $derived(data.improvements.filter((i: any) => i.status === 'proposed'));
	const doneIdeas = $derived(data.improvements.filter((i: any) => i.status !== 'proposed'));
	const CHANNEL_LABEL: Record<string, string> = { hero: 'Newsletter-Aufmacher', instagram: 'Instagram', email: 'Newsletter' };
</script>

<div>
	<h1 class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">KI-Cockpit</h1>
	<p class="mt-1 text-sm" style="color: var(--color-muted);">
		Was die Agenten nachts tun, was das System lernt, wie gut die Storys sind. Der Rest läuft autonom.
	</p>
</div>

<!-- Kennzahlen -->
<div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-amber);">{q.avgResonance}</div>
		<div class="text-xs" style="color: var(--color-muted);">Ø Resonanz (14 T.)</div>
	</div>
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-sage);">{q.pearls14d}</div>
		<div class="text-xs" style="color: var(--color-muted);">Perlen (Resonanz 80+)</div>
	</div>
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-ink);">{data.improvementStats.proposed}</div>
		<div class="text-xs" style="color: var(--color-muted);">offene Ideen</div>
	</div>
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-sage);">{data.improvedCount}</div>
		<div class="text-xs" style="color: var(--color-muted);">bestätigt wirksam</div>
	</div>
</div>

<!-- Agenten-Status: letzter Lauf je Agent -->
<div class="mt-8">
	<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-ink-soft);">Agenten — letzter Lauf</h2>
	<div class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
		{#each data.lastByAgent as r}
			<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
				<div class="flex items-center justify-between">
					<span class="font-semibold text-sm" style="color: var(--color-ink);">{agentLabel(r.agent)}</span>
					<span class="text-xs px-2 py-0.5 rounded-full" style="background: {statusColor(r.status)}22; color: {statusColor(r.status)};">{r.status}</span>
				</div>
				<div class="mt-1 text-xs" style="color: var(--color-muted);">
					{r.layer === 'local' ? '🖥 lokal' : '☁ cloud'} · {fmtTime(r.started_at)} {dur(r.started_at, r.finished_at)}
				</div>
				{#if r.summary}<div class="mt-2 text-xs leading-snug" style="color: var(--color-ink-soft);">{r.summary}</div>{/if}
				{#if r.error}<div class="mt-2 text-xs" style="color: var(--color-rose);">{r.error}</div>{/if}
			</div>
		{:else}
			<div class="text-sm" style="color: var(--color-muted);">Noch keine Agentenläufe. Die Nacht-Routinen füllen das hier.</div>
		{/each}
	</div>
</div>

<div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Selbstlernen: offene Ideen -->
	<div>
		<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-ink-soft);">Selbstlernen — offene Ideen</h2>
		<div class="mt-3 flex flex-col gap-2">
			{#each openIdeas as i}
				<div class="paper rounded-[10px] p-3" style="border:1px solid var(--color-rule);">
					<div class="flex items-start justify-between gap-2">
						<span class="text-sm font-medium" style="color: var(--color-ink);">{i.title}</span>
						<span class="text-xs shrink-0 px-1.5 py-0.5 rounded" style="background: var(--color-rule); color: var(--color-muted);">P{i.priority} · {i.kind}</span>
					</div>
					<div class="mt-1 text-xs leading-snug" style="color: var(--color-muted);">{i.rationale}</div>
					<div class="mt-1 text-xs" style="color: var(--color-ink-soft);">von {i.proposed_by}{#if i.metric} · misst: {i.metric}{/if}</div>
				</div>
			{:else}
				<div class="text-sm" style="color: var(--color-muted);">Keine offenen Ideen.</div>
			{/each}
		</div>
	</div>

	<!-- Selbstlernen: umgesetzt + Wirkung -->
	<div>
		<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-ink-soft);">Umgesetzt & Wirkung</h2>
		<div class="mt-3 flex flex-col gap-2">
			{#each doneIdeas as i}
				<div class="paper rounded-[10px] p-3" style="border:1px solid var(--color-rule);">
					<div class="flex items-start justify-between gap-2">
						<span class="text-sm font-medium" style="color: var(--color-ink);">{i.title}</span>
						<span class="text-xs shrink-0 px-1.5 py-0.5 rounded" style="background: {outcomeColor(i.outcome)}22; color: {outcomeColor(i.outcome)};">{i.outcome ?? i.status}</span>
					</div>
					{#if i.baseline != null && i.result != null}
						<div class="mt-1 text-xs" style="color: var(--color-ink-soft);">{i.metric}: {i.baseline} → {i.result}</div>
					{/if}
				</div>
			{:else}
				<div class="text-sm" style="color: var(--color-muted);">Noch nichts umgesetzt.</div>
			{/each}
		</div>
	</div>
</div>

<div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Story-Qualität: Resonanz-Verteilung -->
	<div>
		<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-ink-soft);">Story-Qualität (14 Tage, {q.total14d} Storys)</h2>
		<div class="mt-3 paper rounded-[10px] p-4 flex flex-col gap-2" style="border:1px solid var(--color-rule);">
			{#each Object.entries(q.resBuckets) as [label, count]}
				<div class="flex items-center gap-3">
					<span class="text-xs w-20 shrink-0" style="color: var(--color-muted);">{label}</span>
					<div class="flex-1 h-4 rounded" style="background: var(--color-rule);">
						<div class="h-4 rounded" style="width: {Math.round((count / maxRes) * 100)}%; background: {label === '80+' ? 'var(--color-sage)' : label === 'unbewertet' ? 'var(--color-muted)' : 'var(--color-amber)'};"></div>
					</div>
					<span class="text-xs w-8 text-right" style="color: var(--color-ink-soft);">{count}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Heutige Perlen -->
	<div>
		<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-ink-soft);">Kuratierte Perlen</h2>
		<div class="mt-3 flex flex-col gap-2">
			{#each data.curation as c}
				<div class="paper rounded-[10px] p-3 flex items-center justify-between gap-2" style="border:1px solid var(--color-rule);">
					<div>
						<div class="text-xs font-medium" style="color: var(--color-amber);">{CHANNEL_LABEL[c.channel] ?? c.channel} · {c.for_date}</div>
						<div class="text-xs mt-0.5 leading-snug" style="color: var(--color-ink-soft);">{c.rationale ?? '—'}</div>
					</div>
					<span class="text-sm font-semibold shrink-0" style="color: var(--color-sage);">{Math.round(Number(c.resonance_score) <= 10 ? Number(c.resonance_score) * 10 : Number(c.resonance_score))}</span>
				</div>
			{:else}
				<div class="text-sm" style="color: var(--color-muted);">Keine Perlen kuratiert.</div>
			{/each}
		</div>
	</div>
</div>

<!-- Quellen-Qualität -->
<div class="mt-8">
	<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-ink-soft);">Quellen — Perlenrate</h2>
	<div class="mt-3 paper rounded-[10px] overflow-hidden" style="border:1px solid var(--color-rule);">
		<table class="w-full text-sm">
			<thead>
				<tr style="border-bottom:1px solid var(--color-rule); color: var(--color-muted);" class="text-xs">
					<th class="text-left px-4 py-2">Quelle</th>
					<th class="text-right px-3 py-2">Storys</th>
					<th class="text-right px-3 py-2">Ø Impact</th>
					<th class="text-right px-3 py-2">% stark</th>
					<th class="text-right px-4 py-2">Perlen</th>
				</tr>
			</thead>
			<tbody>
				{#each data.sources as s}
					<tr style="border-bottom:1px solid var(--color-rule);">
						<td class="px-4 py-2" style="color: var(--color-ink);">{s.source_name}</td>
						<td class="px-3 py-2 text-right" style="color: var(--color-ink-soft);">{s.stories}</td>
						<td class="px-3 py-2 text-right" style="color: var(--color-ink-soft);">{s.avg_impact ? Math.round(Number(s.avg_impact)) : '—'}</td>
						<td class="px-3 py-2 text-right" style="color: {Number(s.pct_stark) >= 20 ? 'var(--color-sage)' : Number(s.pct_stark) < 8 ? 'var(--color-rose)' : 'var(--color-ink-soft)'};">{s.pct_stark ? Math.round(Number(s.pct_stark)) + '%' : '—'}</td>
						<td class="px-4 py-2 text-right" style="color: var(--color-ink-soft);">{s.perlen_75plus ?? 0}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
