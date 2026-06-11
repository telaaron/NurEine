<script lang="ts">
	let { data } = $props();

	const BEAT_LABELS: Record<string, string> = {
		'klima-energie': 'Klima & Energie',
		'gesundheit-forschung': 'Gesundheit & Forschung',
		'gesellschaft-bildung': 'Gesellschaft & Bildung',
		'innovation-wirtschaft': 'Innovation & Wirtschaft',
		'staedte-kommunen': 'Städte & Kommunen',
		allgemein: 'Allgemeiner Pool'
	};
	const beatLabel = (b: string) => BEAT_LABELS[b] ?? b;

	const TYPE_LABELS: Record<string, string> = {
		peer_review: 'Peer-Review', official_stats: 'Offizielle Statistik', registry: 'Register',
		open_data: 'Open Data', gov: 'Behörde', ngo: 'NGO', media: 'Fachquelle'
	};

	const total = $derived(data.decisions.accepted + data.decisions.rejected_ai + data.decisions.rejected_prefilter);
	const acceptRate = $derived(total > 0 ? Math.round((data.decisions.accepted / total) * 100) : 0);
	const maxScore = $derived(Math.max(1, ...Object.values(data.scoreBuckets)));

	function decisionColor(d: string) {
		return d === 'accepted' ? 'var(--color-sage)' : d === 'rejected_ai' ? 'var(--color-rose)' : 'var(--color-muted)';
	}
	function decisionLabel(d: string) {
		return d === 'accepted' ? 'aufgenommen' : d === 'rejected_ai' ? 'KI-abgelehnt' : 'vorgefiltert';
	}
</script>

<div>
	<h1 class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">Redaktion — Reporter-Monitor</h1>
	<p class="mt-1 text-sm" style="color: var(--color-muted);">
		Welche Quellen wir beobachten, was durchkommt und was wir ablehnen — die letzten 7 Tage.
		{data.activeSources}/{data.totalSources} Quellen aktiv.
	</p>
</div>

<!-- Entscheidungs-Übersicht -->
<div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-sage);">{data.decisions.accepted}</div>
		<div class="text-xs" style="color: var(--color-muted);">aufgenommen</div>
	</div>
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-rose);">{data.decisions.rejected_ai}</div>
		<div class="text-xs" style="color: var(--color-muted);">KI-abgelehnt</div>
	</div>
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-ink-soft);">{data.decisions.rejected_prefilter}</div>
		<div class="text-xs" style="color: var(--color-muted);">vorgefiltert</div>
	</div>
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<div class="text-2xl font-semibold" style="color: var(--color-amber);">{acceptRate}%</div>
		<div class="text-xs" style="color: var(--color-muted);">Aufnahmequote</div>
	</div>
</div>

<div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Ablehnungsgründe -->
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Ablehnungsgründe (7 Tage)</p>
		{#each data.reasons as r}
			<div class="flex justify-between text-sm py-1" style="border-bottom:1px solid var(--color-rule);">
				<span style="color: var(--color-ink-soft);">{r.reason}</span>
				<span style="font-weight:600;">{r.n}</span>
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-faint);">Noch keine Daten — läuft beim nächsten Fetch voll.</p>
		{/each}
	</div>

	<!-- Score-Verteilung -->
	<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Wirkungsindex der Aufgenommenen</p>
		{#each Object.entries(data.scoreBuckets) as [bucket, n]}
			<div class="flex items-center gap-3 py-1">
				<span class="text-xs tnum w-12" style="color: var(--color-muted);">{bucket}</span>
				<div class="flex-1 h-3 rounded-full overflow-hidden" style="background: var(--color-rule);">
					<div class="h-full rounded-full" style="width: {(n / maxScore) * 100}%; background: var(--color-amber);"></div>
				</div>
				<span class="text-xs tnum w-8 text-right" style="color: var(--color-ink-soft);">{n}</span>
			</div>
		{/each}
	</div>
</div>

<!-- Quellen je Beat -->
<div class="mt-6">
	<h2 class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Quellen je Beat</h2>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each data.sourcesByBeat as group}
			{@const beatStats = data.byBeat.find((b) => b.beat === group.beat)}
			<div class="paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
				<div class="flex items-center justify-between mb-2">
					<span class="font-semibold text-sm" style="color: var(--color-ink);">{beatLabel(group.beat)}</span>
					{#if beatStats}<span class="text-xs" style="color: var(--color-muted);">{beatStats.accepted} auf · {beatStats.rejected} ab</span>{/if}
				</div>
				<div class="flex flex-col gap-1">
					{#each group.sources as s}
						<div class="flex items-center gap-2 text-xs">
							<span style="width:7px;height:7px;border-radius:7px;background:{s.active ? 'var(--color-sage)' : 'var(--color-faint)'};"></span>
							<span style="color: var(--color-ink-soft);">{s.name}</span>
							{#if s.source_type}<span style="color: var(--color-faint);">· {TYPE_LABELS[s.source_type] ?? s.source_type}</span>{/if}
							{#if s.is_primary}<span style="color: var(--color-amber);">· Primär</span>{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Letzte Entscheidungen -->
<div class="mt-6 paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
	<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Letzte Entscheidungen</p>
	<div class="flex flex-col gap-1.5">
		{#each data.recent as r}
			<div class="flex items-start gap-3 text-sm py-1" style="border-bottom:1px solid var(--color-rule);">
				<span style="color: {decisionColor(r.decision)}; font-family: var(--font-mono); font-size:0.65rem; width:90px; flex-shrink:0; text-transform:uppercase;">{decisionLabel(r.decision)}</span>
				<span class="flex-1 min-w-0" style="color: var(--color-ink-soft);">{r.title}</span>
				<span style="color: var(--color-faint); font-size:0.7rem; flex-shrink:0;">
					{#if r.impact_score != null}{r.impact_score} · {/if}{r.reason || ''}{#if r.source_name} · {r.source_name}{/if}
				</span>
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-faint);">Noch keine Einträge. Erscheint nach dem nächsten Fetch-Lauf.</p>
		{/each}
	</div>
</div>

<!-- Nutzer-Feedback (von /roadmap) -->
<div class="mt-6 paper rounded-[10px] p-4" style="border:1px solid var(--color-rule);">
	<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Nutzer-Feedback ({data.feedback.length})</p>
	<div class="flex flex-col gap-2">
		{#each data.feedback as f}
			{@const kindColor = f.kind === 'bug' ? 'var(--color-rose)' : f.kind === 'praise' ? 'var(--color-sage)' : 'var(--color-amber)'}
			<div class="text-sm p-3 rounded" style="background: var(--color-paper); border:1px solid var(--color-rule);">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full" style="background: {kindColor}; color:#fff; font-family: var(--font-mono);">{f.kind}</span>
					<span class="text-xs" style="color: var(--color-faint);">{new Date(f.created_at).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
					{#if f.email}<span class="text-xs" style="color: var(--color-muted);">· {f.email}</span>{/if}
				</div>
				<p style="color: var(--color-ink-soft);">{f.message}</p>
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-faint);">Noch kein Feedback eingegangen.</p>
		{/each}
	</div>
</div>
