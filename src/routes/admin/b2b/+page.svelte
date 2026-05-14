<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const { clients } = $derived(data);

	// ---- State ----
	let showForm = $state(false);
	let editId = $state<string | null>(null);
	let saving = $state(false);
	let confirmDelete = $state<string | null>(null);
	let sendingWelcome = $state<string | null>(null);
	let welcomeMessage = $state('');

	async function sendWelcomeEmail(client: any) {
		sendingWelcome = client.id;
		welcomeMessage = '';
		try {
			const res = await fetch(`/api/admin/b2b/${client.id}/welcome`, { method: 'POST' });
			const result = await res.json();
			if (result.success) {
				welcomeMessage = `Willkommens-Mail gesendet an ${result.recipient}`;
			} else {
				alert(result.error || 'Unbekannter Fehler');
				welcomeMessage = '';
			}
		} catch (err) {
			alert('Fehler: ' + String(err));
			welcomeMessage = '';
		} finally {
			sendingWelcome = null;
		}
	}

	let form = $state({
		company_name: '',
		contact_name: '',
		contact_email: '',
		contact_phone: '',
		status: 'lead' as string,
		mrr_value: 499,
		integration_type: 'email' as string,
		integration_target: '',
		invoice_status: 'offen' as string,
		notes: ''
	});

	function resetForm() {
		form = {
			company_name: '',
			contact_name: '',
			contact_email: '',
			contact_phone: '',
			status: 'lead',
			mrr_value: 499,
			integration_type: 'email',
			integration_target: '',
			invoice_status: 'offen',
			notes: ''
		};
		editId = null;
	}

	async function openEdit(client: any) {
		form = {
			company_name: client.company_name,
			contact_name: client.contact_name || '',
			contact_email: client.contact_email || '',
			contact_phone: client.contact_phone || '',
			status: client.status,
			mrr_value: client.mrr_value,
			integration_type: client.integration_type,
			integration_target: client.integration_target,
			invoice_status: client.invoice_status,
			notes: client.notes || ''
		};
		editId = client.id;
		showForm = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		saving = true;
		try {
			const url = editId ? `/api/admin/b2b/${editId}` : '/api/admin/b2b';
			const method = editId ? 'PUT' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (!res.ok) {
				const err = await res.json();
				alert('Fehler: ' + (err.error || 'Unbekannt'));
				return;
			}
			window.location.reload();
		} catch (err) {
			alert('Fehler: ' + String(err));
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			const res = await fetch(`/api/admin/b2b/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const err = await res.json();
				alert('Fehler: ' + (err.error || 'Unbekannt'));
				return;
			}
			window.location.reload();
		} catch (err) {
			alert('Fehler: ' + String(err));
		}
	}

	function statusStyle(status: string): string {
		switch (status) {
			case 'lead': return 'color: var(--color-sky);';
			case 'pilot': return 'color: var(--color-amber); font-weight: 700;';
			case 'paid': return 'color: var(--color-sage); font-weight: 700;';
			case 'churned': return 'color: var(--color-rose);';
			default: return '';
		}
	}

	function daysUntil(date: string | null): string {
		if (!date) return '–';
		const end = new Date(date);
		const now = new Date();
		const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return `abgelaufen`;
		if (diff === 0) return 'heute';
		if (diff === 1) return 'morgen';
		return `${diff} Tage`;
	}
</script>

<h1 class="serif text-2xl" style="color: var(--color-ink);">B2B Pipeline</h1>
<p class="mt-1 text-sm" style="color: var(--color-muted);">Unternehmen verwalten – von Lead bis Paying Customer.</p>

<div class="mt-6 flex gap-3">
	<button
		type="button"
		class="px-4 py-2 rounded-full text-sm font-medium"
		style="background: var(--color-ink); color: var(--color-paper);"
		onclick={() => { resetForm(); showForm = !showForm; }}
	>
		{showForm ? 'Abbrechen' : '+ Neuer B2B Kunde'}
	</button>
	<a
		href={base + '/admin'}
		class="px-4 py-2 rounded-full text-sm"
		style="color: var(--color-muted);"
	>
		← Dashboard
	</a>
</div>

<!-- Form -->
{#if showForm}
	<div class="mt-6 paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<h2 class="serif text-base" style="color: var(--color-ink);">
			{editId ? 'Kunde bearbeiten' : 'Neuen B2B Kunden anlegen'}
		</h2>
		<form onsubmit={handleSubmit} class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Firmenname *</label>
				<input type="text" bind:value={form.company_name} required
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Kontaktperson</label>
				<input type="text" bind:value={form.contact_name}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">E-Mail</label>
				<input type="email" bind:value={form.contact_email}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Telefon</label>
				<input type="text" bind:value={form.contact_phone}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Status</label>
				<select bind:value={form.status}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				>
					<option value="lead">Lead</option>
					<option value="pilot">Active Pilot</option>
					<option value="paid">Paying Customer</option>
					<option value="churned">Churned</option>
				</select>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Preis (€/Monat)</label>
				<input type="number" bind:value={form.mrr_value} min="0" step="1"
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Integrations-Art</label>
				<select bind:value={form.integration_type}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				>
					<option value="email">E-Mail-Verteiler</option>
					<option value="webhook">Webhook (Slack/Teams)</option>
					<option value="iframe">iFrame Einbettung</option>
				</select>
			</div>
			<div class="md:col-span-2">
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">
					{#if form.integration_type === 'email'}
						E-Mail-Adresse(n) *
					{:else if form.integration_type === 'webhook'}
						Webhook URL *
					{:else}
						Einbettungs-URL
					{/if}
				</label>
				<input type="text" bind:value={form.integration_target} required
					placeholder={form.integration_type === 'email' ? 'team@dueppel.de' : 'https://hooks.slack.com/...'}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Rechnungsstatus</label>
				<select bind:value={form.invoice_status}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				>
					<option value="offen">Offen</option>
					<option value="bezahlt">Bezahlt</option>
					<option value="storniert">Storniert</option>
				</select>
			</div>
			<div>
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">Notizen</label>
				<input type="text" bind:value={form.notes}
					class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
					style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				/>
			</div>
			<div class="md:col-span-2 flex gap-3 pt-2">
				<button type="submit" disabled={saving}
					class="px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-60"
					style="background: var(--color-ink); color: var(--color-paper);"
				>
					{saving ? 'Speichert ...' : editId ? 'Änderungen speichern' : 'Kunde anlegen'}
				</button>
				<button type="button" onclick={() => { showForm = false; resetForm(); }}
					class="px-5 py-2.5 rounded-full text-sm"
					style="background: var(--color-canvas); color: var(--color-muted);"
				>
					Abbrechen
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Clients table -->
<div class="mt-8 paper rounded-[6px] overflow-hidden" style="border: 1px solid var(--color-rule);">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr style="border-bottom: 1px solid var(--color-rule);">
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Firma</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Kontakt</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Status</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Pilot Ende</th>
					<th class="text-right p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">MRR</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Rechnung</th>
					<th class="text-left p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Integration</th>
					<th class="text-right p-3 text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#if clients.length === 0}
					<tr>
						<td colspan="8" class="p-6 text-center text-sm" style="color: var(--color-muted);">
							Noch keine B2B-Kunden. Leg den ersten an!
						</td>
					</tr>
				{/if}
				{#each clients as client (client.id)}
					<tr class="border-t" style="border-color: var(--color-rule);">
						<td class="p-3">
							<span style="color: var(--color-ink); font-weight: 500;">{client.company_name}</span>
						</td>
						<td class="p-3 text-xs" style="color: var(--color-muted);">
							{client.contact_name || '–'}<br/>
							{#if client.contact_email}
								<a href="mailto:{client.contact_email}" class="hover:opacity-70">{client.contact_email}</a>
							{:else}
								–
							{/if}
						</td>
						<td class="p-3">
							<span class="text-xs font-medium" style={statusStyle(client.status)}>
								{client.status === 'lead' ? 'Lead' : client.status === 'pilot' ? 'Pilot' : client.status === 'paid' ? 'Paying' : 'Churned'}
							</span>
						</td>
						<td class="p-3 text-xs" style="color: {client.status === 'pilot' && client.pilot_ends_at ? 'var(--color-amber)' : 'var(--color-muted)'};">
							{#if client.status === 'pilot' && client.pilot_ends_at}
								<span class={daysUntil(client.pilot_ends_at).includes('abgelaufen') ? 'font-bold' : ''}>
									{daysUntil(client.pilot_ends_at)}
								</span>
							{:else}
								–
							{/if}
						</td>
						<td class="p-3 text-right" style="color: var(--color-ink); font-weight: 500;">
							{client.mrr_value} €
						</td>
						<td class="p-3">
							<span class="text-xs px-2 py-0.5 rounded-full" style="
								background: {client.invoice_status === 'bezahlt' ? 'var(--color-sage)' : client.invoice_status === 'offen' ? 'var(--color-amber)' : 'var(--color-muted)'};
								color: var(--color-paper);
							">
								{client.invoice_status}
							</span>
						</td>
						<td class="p-3 text-xs" style="color: var(--color-muted);">
							{client.integration_type === 'email' ? 'E-Mail' : client.integration_type === 'webhook' ? 'Webhook' : 'iFrame'}
							<br/><span style="font-size: 10px;">{client.integration_target.slice(0, 40)}{client.integration_target.length > 40 ? '...' : ''}</span>
						</td>
						<td class="p-3 text-right">
							<div class="flex justify-end gap-2 flex-wrap">
								<button type="button" onclick={() => sendWelcomeEmail(client)}
									disabled={sendingWelcome === client.id}
									class="text-xs px-2 py-1 rounded-[4px] hover:opacity-70 disabled:opacity-40"
									style="color: var(--color-sage); border: 1px solid var(--color-sage);"
									title="Willkommens-Mail an {client.contact_email || client.integration_target}"
								>
									{sendingWelcome === client.id ? '...' : 'Mail'}
								</button>
								<button type="button" onclick={() => openEdit(client)}
									class="text-xs px-2 py-1 rounded-[4px] hover:opacity-70"
									style="color: var(--color-ink-soft); border: 1px solid var(--color-rule);"
								>
									Edit
								</button>
								{#if confirmDelete === client.id}
									<button type="button" onclick={() => handleDelete(client.id)}
										class="text-xs px-2 py-1 rounded-[4px] font-medium"
										style="background: var(--color-rose); color: var(--color-paper);"
									>
										Sicher?
									</button>
									<button type="button" onclick={() => confirmDelete = null}
										class="text-xs px-2 py-1 rounded-[4px]"
										style="color: var(--color-muted); border: 1px solid var(--color-rule);"
									>
										Nein
									</button>
								{:else}
									<button type="button" onclick={() => confirmDelete = client.id}
										class="text-xs px-2 py-1 rounded-[4px] hover:opacity-70"
										style="color: var(--color-rose); border: 1px solid var(--color-rose);"
									>
										Del
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
