<script lang="ts">
	import { base } from '$app/paths';
	import type { ImpactRun } from '../+page.server';
	let { data } = $props();
	const runs = $derived(data.runs as ImpactRun[]);

	function gesamt(r: ImpactRun): string {
		return typeof r.scores?.gesamt === 'number' ? `${r.scores.gesamt}/10` : '–';
	}
	const verdictLabel: Record<string, string> = {
		confirmed: 'bestätigt ✓',
		rejected: 'verworfen ✕',
		pending: 'gemessen'
	};
	const prLabel: Record<string, string> = { merged: 'gemerged', closed: 'verworfen' };
</script>

<div class="mb-8">
	<a href={base + '/admin/impact'} class="text-sm inline-flex items-center gap-1.5 mb-3" style="color: var(--color-ink-soft);">
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
		Zurück zum aktuellen Lauf
	</a>
	<h1 class="display text-2xl mb-1" style="color: var(--color-ink); font-weight: 600;">Impact — History</h1>
	<p class="text-sm" style="color: var(--color-ink-soft);">Abgehakte Läufe (PR gemerged oder verworfen), neueste zuerst.</p>
</div>

{#if runs.length === 0}
	<div class="rounded-xl p-8 text-center" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
		<p style="color: var(--color-ink-soft);">Noch nichts abgehakt. Sobald du auf der Hauptseite einen PR als gemerged markierst, erscheint er hier.</p>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		{#each runs as r}
			<details class="rounded-lg" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
				<summary class="flex items-center gap-3 px-4 py-3 cursor-pointer flex-wrap">
					<span class="text-sm font-mono" style="color: var(--color-faint); font-family: var(--font-mono);">{r.run_date}</span>
					<span class="text-sm font-semibold" style="color: var(--color-ink);">{gesamt(r)}</span>
					{#if r.channel}<span class="text-[0.6rem] uppercase tracking-wide rounded px-1.5 py-0.5" style="background: var(--color-canvas-soft); color: var(--color-ink-soft); font-family: var(--font-mono);">{r.channel}</span>{/if}
					<span class="text-sm flex-1 truncate" style="color: var(--color-ink-soft);">{r.change_summary ?? r.root_cause ?? ''}</span>
					{#if r.pr_state}
						<span class="text-[0.6rem] font-bold uppercase tracking-wide rounded-full px-2 py-0.5" style="background: {r.pr_state === 'merged' ? '#1f9d63' : 'var(--color-canvas-soft)'}; color: {r.pr_state === 'merged' ? '#fff' : 'var(--color-ink-soft)'};">{prLabel[r.pr_state] ?? r.pr_state}</span>
					{/if}
				</summary>
				<div class="px-4 pb-4 pt-1 flex flex-col gap-1.5 border-t" style="border-color: var(--color-rule);">
					{#if r.root_cause}<div class="text-sm mt-2" style="color: var(--color-ink);"><strong>Ursache:</strong> {r.root_cause}</div>{/if}
					{#if r.change_summary}<div class="text-sm" style="color: var(--color-ink-soft);"><strong>Änderung:</strong> {r.change_summary}</div>{/if}
					{#if r.change_file}<div class="text-xs" style="color: var(--color-faint); font-family: var(--font-mono);">{r.change_file}</div>{/if}
					{#if r.verdict}<div class="text-xs" style="color: var(--color-ink-soft);">Wirkung: {verdictLabel[r.verdict] ?? r.verdict}{#if r.verdict_note} — {r.verdict_note}{/if}</div>{/if}
					{#if r.pr_url}<a href={r.pr_url} target="_blank" rel="noreferrer" class="text-xs mt-1" style="color: var(--color-amber); font-family: var(--font-mono);">PR ansehen →</a>{/if}
				</div>
			</details>
		{/each}
	</div>
{/if}
