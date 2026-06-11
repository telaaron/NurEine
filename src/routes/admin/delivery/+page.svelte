<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const { log } = $derived(data);

	let filter = $state('all'); // all | sent | failed | pending

	let filtered = $derived(
		filter === 'all' ? log : log.filter(e => e.status === filter)
	);

	function statusBadgeColor(status: string): string {
		switch (status) {
			case 'sent': return 'var(--color-sage)';
			case 'failed': return 'var(--color-rose)';
			default: return 'var(--color-muted)';
		}
	}
</script>

<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Delivery Log</h1>
<p class="mt-1 text-sm" style="color: var(--color-muted);">Cronjob-Historie und B2B-Auslieferungen. Fehler erkennen, bevor der Kunde anruft.</p>

<div class="mt-6 flex flex-wrap gap-3 items-center justify-between">
	<div class="flex gap-3 items-center">
		<a
			href={base + '/admin'}
			class="px-4 py-2 rounded-full text-sm"
			style="color: var(--color-muted);"
		>
			← Dashboard
		</a>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => filter = 'all'}
				class="px-3 py-1 rounded-full text-xs font-medium transition-all"
				style="background: {filter === 'all' ? 'var(--color-ink)' : 'var(--color-canvas)'}; color: {filter === 'all' ? 'var(--color-paper)' : 'var(--color-muted)'}; border: 1px solid var(--color-rule);"
			>
				Alle ({log.length})
			</button>
			<button
				type="button"
				onclick={() => filter = 'sent'}
				class="px-3 py-1 rounded-full text-xs font-medium transition-all"
				style="background: {filter === 'sent' ? 'var(--color-sage)' : 'var(--color-canvas)'}; color: {filter === 'sent' ? 'var(--color-paper)' : 'var(--color-muted)'}; border: 1px solid var(--color-rule);"
			>
				OK ({log.filter(e => e.status === 'sent').length})
			</button>
			<button
				type="button"
				onclick={() => filter = 'failed'}
				class="px-3 py-1 rounded-full text-xs font-medium transition-all"
				style="background: {filter === 'failed' ? 'var(--color-rose)' : 'var(--color-canvas)'}; color: {filter === 'failed' ? 'var(--color-paper)' : 'var(--color-muted)'}; border: 1px solid var(--color-rule);"
			>
				Fehler ({log.filter(e => e.status === 'failed').length})
			</button>
			<button
				type="button"
				onclick={() => filter = 'pending'}
				class="px-3 py-1 rounded-full text-xs font-medium transition-all"
				style="background: {filter === 'pending' ? 'var(--color-amber)' : 'var(--color-canvas)'}; color: {filter === 'pending' ? 'var(--color-paper)' : 'var(--color-muted)'}; border: 1px solid var(--color-rule);"
			>
				Pending ({log.filter(e => e.status === 'pending').length})
			</button>
		</div>
	</div>
</div>

<div class="mt-6 paper rounded-[10px] overflow-hidden" style="border: 1px solid var(--color-rule);">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr style="border-bottom: 1px solid var(--color-rule);">
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Zeit</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Unternehmen</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Story</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Typ</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Ziel</th>
					<th class="text-center p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Status</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Fehler</th>
				</tr>
			</thead>
			<tbody>
				{#if filtered.length === 0}
					<tr>
						<td colspan="7" class="p-6 text-center text-sm" style="color: var(--color-muted);">
							Keine Einträge {filter !== 'all' ? 'mit Status "' + filter + '"' : ''}.
						</td>
					</tr>
				{/if}
				{#each filtered as entry}
					<tr class="border-t hover:opacity-70 transition-opacity" style="border-color: var(--color-rule);">
						<td class="p-3 text-xs" style="color: var(--color-muted);">
							{new Date(entry.sent_at).toLocaleString('de-DE', {
								day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
							})}
						</td>
						<td class="p-3" style="color: var(--color-ink); font-weight: 500;">
							{entry.company_name || '–'}
						</td>
						<td class="p-3 text-xs max-w-[200px] truncate" style="color: var(--color-muted);" title={entry.story_title || undefined}>
							{entry.story_title || '–'}
						</td>
						<td class="p-3 text-xs" style="color: var(--color-muted);">
							{#if entry.integration_type === 'email'}
								E-Mail
							{:else if entry.integration_type === 'webhook'}
								Webhook
							{:else}
								{entry.integration_type}
							{/if}
						</td>
						<td class="p-3 text-xs max-w-[150px] truncate" style="color: var(--color-muted);" title={entry.integration_target}>
							{entry.integration_target}
						</td>
						<td class="p-3 text-center">
							<span
								class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
								style="color: var(--color-paper); background: {statusBadgeColor(entry.status)};"
							>
								{entry.status === 'sent' ? '200 OK' : entry.status === 'failed' ? 'Fehler' + (entry.status_code ? ' ' + entry.status_code : '') : entry.status}
							</span>
						</td>
						<td class="p-3 text-xs" style="color: var(--color-rose);">
							{entry.error_message || '–'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
