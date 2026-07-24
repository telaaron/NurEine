<script lang="ts">
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { CheckIcon, XMarkIcon } from 'heroicons-svelte/24/outline';

	let { data } = $props();
	const { subscribers, stats } = $derived(data);

	let search = $state('');
	let selected = $state<Set<string>>(new Set());
	let deleting = $state<Set<string>>(new Set());
	let bulkDeleting = $state(false);
	let confirmDelete: 'single' | 'bulk' | null = null;
	let confirmTarget: string | null = null;

	let filtered = $derived(
		subscribers.filter(s =>
			!search || s.email.toLowerCase().includes(search.toLowerCase())
		)
	);

	let allSelected = $derived(
		filtered.length > 0 && filtered.every(s => selected.has(s.id))
	);

	function toggleAll() {
		if (allSelected) {
			selected = new Set();
		} else {
			selected = new Set(filtered.map(s => s.id));
		}
	}

	function toggleOne(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

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

	async function doDelete(ids: string[]) {
		if (ids.length === 1) {
			deleting = new Set([...deleting, ids[0]]);
		} else {
			bulkDeleting = true;
		}

		try {
			const res = await fetch(base + '/api/admin/subscribers/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids })
			});
			const result = await res.json();
			if (result.ok) {
				selected = new Set([...selected].filter(id => !ids.includes(id)));
				await invalidateAll();
			} else {
				alert('Fehler beim Löschen: ' + (result.error || 'Unbekannter Fehler'));
			}
		} catch (e) {
			alert('Netzwerkfehler beim Löschen.');
		} finally {
			if (ids.length === 1) {
				deleting = new Set([...deleting].filter(id => id !== ids[0]));
			} else {
				bulkDeleting = false;
			}
		}
		confirmDelete = null;
		confirmTarget = null;
	}
</script>

<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Audience Panel</h1>
<p class="mt-1 text-sm" style="color: var(--color-muted);">
	Verwalte alle Abonnenten. {selected.size > 0 ? `${selected.size} ausgewählt.` : ''}
</p>

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
				Bestätigt: {stats.confirmed}
			</span>
			<span class="paper px-3 py-1 rounded-full text-xs" style="border: 1px solid var(--color-rule); color: var(--color-ink);">
				B2B: {stats.b2b}
			</span>
		</div>
	</div>
	<div class="flex gap-3 items-center">
		{#if selected.size > 0}
			<button
				type="button"
				onclick={() => { confirmDelete = 'bulk'; }}
				disabled={bulkDeleting}
				class="px-4 py-2 rounded-full text-sm font-medium"
				style="background: #dc2626; color: white; opacity: {bulkDeleting ? 0.6 : 1};"
			>
				{bulkDeleting ? 'Lösche ...' : `${selected.size} löschen`}
			</button>
		{/if}
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

<!-- Bestätigungsdialog -->
{#if confirmDelete}
	<div class="mt-4 p-4 rounded-[10px] text-sm" style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b;">
		<p class="font-medium">
			{confirmDelete === 'bulk'
				? `${selected.size} Abonnent${selected.size === 1 ? '' : 'en'} wirklich löschen?`
				: `"${subscribers.find(s => s.id === confirmTarget)?.email || 'Unbekannt'}" wirklich löschen?`}
		</p>
		<p class="mt-1 text-xs opacity-80">Diese Aktion kann nicht rückgängig gemacht werden.</p>
		<div class="mt-3 flex gap-2">
			<button
				type="button"
				onclick={() => doDelete(confirmDelete === 'bulk' ? [...selected] : [confirmTarget!])}
				class="px-4 py-1.5 rounded-full text-xs font-medium"
				style="background: #dc2626; color: white;"
			>
				Ja, löschen
			</button>
			<button
				type="button"
				onclick={() => { confirmDelete = null; confirmTarget = null; }}
				class="px-4 py-1.5 rounded-full text-xs"
				style="background: var(--color-paper); color: var(--color-ink); border: 1px solid var(--color-rule);"
			>
				Abbrechen
			</button>
		</div>
	</div>
{/if}

<div class="mt-6 paper rounded-[10px] overflow-hidden" style="border: 1px solid var(--color-rule);">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr style="border-bottom: 1px solid var(--color-rule);">
					<th class="p-3 w-10">
						<input
							type="checkbox"
							checked={allSelected}
							onchange={toggleAll}
							style="accent-color: var(--color-ink); cursor: pointer;"
						/>
					</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">E-Mail</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Tier</th>
					<th class="text-center p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Bestätigt</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Region</th>
					<th class="text-right p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Angemeldet am</th>
					<th class="p-3 w-10"></th>
				</tr>
			</thead>
			<tbody>
				{#if filtered.length === 0}
					<tr>
						<td colspan="7" class="p-6 text-center text-sm" style="color: var(--color-muted);">
							{search ? 'Keine Treffer.' : 'Noch keine Abonnenten.'}
						</td>
					</tr>
				{/if}
				{#each filtered as sub}
					<tr class="border-t hover:opacity-70 transition-opacity" style="border-color: var(--color-rule);">
						<td class="p-3">
							<input
								type="checkbox"
								checked={selected.has(sub.id)}
								onchange={() => toggleOne(sub.id)}
								style="accent-color: var(--color-ink); cursor: pointer;"
							/>
						</td>
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
								{#if sub.confirmed}
									<Icon icon={CheckIcon} size="1rem" />
								{:else}
									–
								{/if}
							</span>
						</td>
						<td class="p-3 text-xs" style="color: var(--color-muted);">{sub.region || '–'}</td>
						<td class="p-3 text-right text-xs" style="color: var(--color-muted);">
							{new Date(sub.created_at).toLocaleDateString('de-DE')}
						</td>
						<td class="p-3">
							<button
								type="button"
								onclick={() => { confirmDelete = 'single'; confirmTarget = sub.id; }}
								disabled={deleting.has(sub.id)}
								class="text-xs px-2 py-1 rounded transition-opacity"
								style="color: #dc2626; opacity: {deleting.has(sub.id) ? 0.5 : 0.6};"
								title="Löschen"
							>
								{#if deleting.has(sub.id)}
									…
								{:else}
									<Icon icon={XMarkIcon} size="1rem" />
								{/if}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
