<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const { subscribers, stats } = $derived(data);

	let search = $state('');

	let filtered = $derived(
		subscribers.filter(s =>
			!search || s.email.toLowerCase().includes(search.toLowerCase())
		)
	);

	function csvExport() {
		const header = 'email,tier,confirmed,region,created_at\n';
		const rows = subscribers
			.filter(s => search ? s.email.toLowerCase().includes(search.toLowerCase()) : true)
			.map(s =>
				`"${s.email}","${s.tier}","${s.confirmed ? 'ja' : 'nein'}","${s.region || ''}","${s.created_at}"`
			)
			.join('\n');
		const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `nureine_subscriber_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<h1 class="serif text-2xl" style="color: var(--color-ink);">Audience Panel</h1>
<p class="mt-1 text-sm" style="color: var(--color-muted);">Einfache Listenansicht aller Abonnenten. Ideal als Lookalike Audience Export.</p>

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
			<span class="paper px-3 py-1 rounded-full text-xs" style="border: 1px solid var(--color-rule); color: var(--color-ink);">
				Total: {stats.total}
			</span>
			<span class="paper px-3 py-1 rounded-full text-xs" style="border: 1px solid var(--color-rule); color: var(--color-ink);">
				Bestaetigt: {stats.confirmed}
			</span>
			<span class="paper px-3 py-1 rounded-full text-xs" style="border: 1px solid var(--color-rule); color: var(--color-ink);">
				B2B: {stats.b2b}
			</span>
		</div>
	</div>
	<div class="flex gap-3">
		<input
			type="text"
			bind:value={search}
			placeholder="E-Mail suchen ..."
			class="px-4 py-2 rounded-[4px] text-sm border outline-none"
			style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
		/>
		<button
			type="button"
			onclick={csvExport}
			class="px-5 py-2 rounded-full text-sm font-medium"
			style="background: var(--color-ink); color: var(--color-paper);"
		>
			CSV Export ({filtered.length})
		</button>
	</div>
</div>

<div class="mt-6 paper rounded-[6px] overflow-hidden" style="border: 1px solid var(--color-rule);">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr style="border-bottom: 1px solid var(--color-rule);">
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">E-Mail</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Tier</th>
					<th class="text-center p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Bestätigt</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Region</th>
					<th class="text-right p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Angemeldet am</th>
				</tr>
			</thead>
			<tbody>
				{#if filtered.length === 0}
					<tr>
						<td colspan="5" class="p-6 text-center text-sm" style="color: var(--color-muted);">
							{search ? 'Keine Treffer.' : 'Noch keine Abonnenten.'}
						</td>
					</tr>
				{/if}
				{#each filtered as sub}
					<tr class="border-t hover:opacity-70 transition-opacity" style="border-color: var(--color-rule);">
						<td class="p-3" style="color: var(--color-ink);">{sub.email}</td>
						<td class="p-3">
							<span class="text-xs px-2 py-0.5 rounded-full" style="
								background: {sub.tier === 'b2b' ? 'var(--color-sky)' : 'var(--color-muted)'};
								color: var(--color-paper);
							">
								{sub.tier}
							</span>
						</td>
						<td class="p-3 text-center">
							<span style="color: {sub.confirmed ? 'var(--color-sage)' : 'var(--color-muted)'};">
								{sub.confirmed ? '✓' : '–'}
							</span>
						</td>
						<td class="p-3 text-xs" style="color: var(--color-muted);">{sub.region || '–'}</td>
						<td class="p-3 text-right text-xs" style="color: var(--color-muted);">
							{new Date(sub.created_at).toLocaleDateString('de-DE')}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
