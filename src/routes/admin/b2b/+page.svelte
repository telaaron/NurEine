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

	// ---- Multi-Email Tag State ----
	let contactEmailTags = $state<string[]>([]);
	let integrationEmailTags = $state<string[]>([]);
	let contactEmailInput = $state('');
	let integrationEmailInput = $state('');

	// ---- Email Helpers ----
	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
	}

	function parseEmails(raw: string | null | undefined): string[] {
		if (!raw) return [];
		return raw
			.split(/[,;\n]+/)
			.map(e => e.trim())
			.filter(e => e && isValidEmail(e));
	}

	function addContactEmail() {
		const v = contactEmailInput.trim();
		if (v && isValidEmail(v) && !contactEmailTags.includes(v)) {
			contactEmailTags = [...contactEmailTags, v];
		}
		contactEmailInput = '';
	}

	function removeContactEmail(idx: number) {
		contactEmailTags = contactEmailTags.filter((_, i) => i !== idx);
	}

	function handleContactKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
			e.preventDefault();
			addContactEmail();
		} else if (e.key === 'Backspace' && contactEmailInput === '' && contactEmailTags.length > 0) {
			contactEmailTags = contactEmailTags.slice(0, -1);
		}
	}

	function addIntegrationEmail() {
		const v = integrationEmailInput.trim();
		if (v && isValidEmail(v) && !integrationEmailTags.includes(v)) {
			integrationEmailTags = [...integrationEmailTags, v];
		}
		integrationEmailInput = '';
	}

	function removeIntegrationEmail(idx: number) {
		integrationEmailTags = integrationEmailTags.filter((_, i) => i !== idx);
	}

	function handleIntegrationKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
			e.preventDefault();
			addIntegrationEmail();
		} else if (e.key === 'Backspace' && integrationEmailInput === '' && integrationEmailTags.length > 0) {
			integrationEmailTags = integrationEmailTags.slice(0, -1);
		}
	}

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

	let sendingTest = $state<string | null>(null);

	async function sendTestEmail(client: any) {
		sendingTest = client.id;
		try {
			const res = await fetch(`/api/admin/b2b/${client.id}/welcome?test=true`, { method: 'POST' });
			const result = await res.json();
			if (result.success) {
				alert(`Test-Mail gesendet an aaronpfuetzner@gmail.com`);
			} else {
				alert(result.error || 'Unbekannter Fehler');
			}
		} catch (err) {
			alert('Fehler: ' + String(err));
		} finally {
			sendingTest = null;
		}
	}

	type BrandingConfig = { show_logo: boolean; show_branding: boolean; branding_text: string };
	let brandingConfig = $state<BrandingConfig>({ show_logo: true, show_branding: true, branding_text: '' });

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
		contactEmailTags = [];
		integrationEmailTags = [];
		contactEmailInput = '';
		integrationEmailInput = '';
		brandingConfig = { show_logo: true, show_branding: true, branding_text: '' };
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
		contactEmailTags = parseEmails(client.contact_email);
		contactEmailInput = '';
		integrationEmailTags = client.integration_type === 'email'
			? parseEmails(client.integration_target)
			: [];
		integrationEmailInput = '';
		const bc = client.branding_config;
		brandingConfig = {
			show_logo: bc?.show_logo ?? true,
			show_branding: bc?.show_branding ?? true,
			branding_text: bc?.branding_text ?? ''
		};
		editId = client.id;
		showForm = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		saving = true;
		try {
			const submitData = { ...form, branding_config: brandingConfig };
			// Join tag arrays back to comma-separated strings
			submitData.contact_email = contactEmailTags.join(', ');
			if (form.integration_type === 'email') {
				submitData.integration_target = integrationEmailTags.join(', ');
			}
			const url = editId ? `/api/admin/b2b/${editId}` : '/api/admin/b2b';
			const method = editId ? 'PUT' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(submitData)
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
			case 'free': return 'color: var(--color-sage); font-weight: 700;';
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

<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">B2B Pipeline</h1>
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
	<div class="mt-6 paper p-6 rounded-[10px]" style="border: 1px solid var(--color-rule);">
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

			<!-- Multi-Email: Kontakt-E-Mail(s) -->
			<div class="md:col-span-2">
				<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">
					Kontakt-E-Mail(s)
				</label>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="w-full px-3 py-2 rounded-[4px] border cursor-text min-h-[42px] flex flex-wrap items-center gap-1.5"
					style="background: var(--color-paper); border-color: var(--color-rule);"
					onclick={() => {
						// focus the hidden input when clicking the wrapper
						const inp = document.getElementById('contact-email-input') as HTMLInputElement;
						inp?.focus();
					}}
					role="button"
					tabindex="-1"
				>
					{#each contactEmailTags as email, idx (idx)}
						<span
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
							style="background: var(--color-ink-soft); color: var(--color-ink);"
						>
							{email}
							<button
								type="button"
								class="ml-0.5 inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] leading-none"
								style="background: var(--color-muted); color: var(--color-paper);"
								onclick={(e: MouseEvent) => { e.stopPropagation(); removeContactEmail(idx); }}
								aria-label="{email} entfernen"
							>
								×
							</button>
						</span>
					{/each}
					<input
						id="contact-email-input"
						type="text"
						bind:value={contactEmailInput}
						onkeydown={handleContactKeydown}
						onblur={addContactEmail}
						placeholder={contactEmailTags.length === 0 ? 'anna@dueppel.de' : 'weitere E-Mail ...'}
						class="flex-1 min-w-[140px] outline-none border-none bg-transparent text-sm"
						style="color: var(--color-ink);"
					/>
				</div>
				<p class="mt-1 text-[11px]" style="color: var(--color-faint);">
					Mehrere E-Mails mit <strong>Enter</strong>, <strong>Komma</strong> oder <strong>Tab</strong> hinzufügen. Doppelte werden ignoriert.
				</p>
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
					<option value="free">Free (kostenlos)</option>
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
					onchange={() => { integrationEmailTags = []; integrationEmailInput = ''; }}
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

				{#if form.integration_type === 'email'}
					<!-- Multi-Email Tag Input for Integration Target -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="w-full px-3 py-2 rounded-[4px] border cursor-text min-h-[42px] flex flex-wrap items-center gap-1.5"
						style="background: var(--color-paper); border-color: var(--color-rule);"
						onclick={() => {
							const inp = document.getElementById('integration-email-input') as HTMLInputElement;
							inp?.focus();
						}}
						role="button"
						tabindex="-1"
					>
						{#each integrationEmailTags as email, idx (idx)}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
								style="background: var(--color-ink-soft); color: var(--color-ink);"
							>
								{email}
								<button
									type="button"
									class="ml-0.5 inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] leading-none"
									style="background: var(--color-muted); color: var(--color-paper);"
									onclick={(e: MouseEvent) => { e.stopPropagation(); removeIntegrationEmail(idx); }}
									aria-label="{email} entfernen"
								>
									×
								</button>
							</span>
						{/each}
						<input
							id="integration-email-input"
							type="text"
							bind:value={integrationEmailInput}
							onkeydown={handleIntegrationKeydown}
							onblur={addIntegrationEmail}
							placeholder={integrationEmailTags.length === 0 ? 'team@dueppel.de' : 'weitere E-Mail ...'}
							class="flex-1 min-w-[140px] outline-none border-none bg-transparent text-sm"
							style="color: var(--color-ink);"
						/>
					</div>
					<p class="mt-1 text-[11px]" style="color: var(--color-faint);">
						Mehrere E-Mails mit <strong>Enter</strong>, <strong>Komma</strong> oder <strong>Tab</strong> hinzufügen. Doppelte werden ignoriert.
					</p>
				{:else}
					<input type="text" bind:value={form.integration_target} required
						placeholder="https://hooks.slack.com/..."
						class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
						style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
					/>
				{/if}
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
			<!-- Branding / White-Label Einstellungen -->
			<div class="md:col-span-2 pt-4 border-t" style="border-color: var(--color-rule);">
				<h3 class="serif text-base mb-3" style="color: var(--color-ink);">Branding</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="flex items-center gap-3">
						<label class="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" bind:checked={brandingConfig.show_logo} class="sr-only peer" />
							<div
								class="w-9 h-5 rounded-full peer-checked:bg-[#1a1815] transition-colors"
								style="background: var(--color-rule);"
							></div>
							<div
								class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150"
								class:translate-x-4={brandingConfig.show_logo}
							></div>
						</label>
						<div>
							<p class="text-sm" style="color: var(--color-ink);">Logo in der Mail</p>
							<p class="text-[11px]" style="color: var(--color-faint);">Firmenlogo unter dem NurEine-Schriftzug</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<label class="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" bind:checked={brandingConfig.show_branding} class="sr-only peer" />
							<div
								class="w-9 h-5 rounded-full peer-checked:bg-[#1a1815] transition-colors"
								style="background: var(--color-rule);"
							></div>
							<div
								class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150"
								class:translate-x-4={brandingConfig.show_branding}
							></div>
						</label>
						<div>
							<p class="text-sm" style="color: var(--color-ink);">Branding-Footer</p>
							<p class="text-[11px]" style="color: var(--color-faint);">»Ermöglicht durch [Firma]« unter der Story</p>
						</div>
					</div>
				</div>
				<div class="mt-4">
					<label class="block text-xs uppercase tracking-[0.16em] mb-1" style="color: var(--color-faint);">
						Branding-Text
						<span style="color: var(--color-faint); font-weight: 400; text-transform: none; letter-spacing: 0;">(leer = Standard: »Ermöglicht durch [Firmenname]«)</span>
					</label>
					<input
						type="text"
						bind:value={brandingConfig.branding_text}
						placeholder="Museumsdorf Düppel"
						class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
						style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
					/>
					<p class="mt-1 text-[11px]" style="color: var(--color-faint);">
						Erscheint im Footer anstelle des Firmennamens. Nützlich wenn euer Kunde eine Sub-Marke ist.
					</p>
				</div>
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
<div class="mt-8 paper rounded-[10px] overflow-hidden" style="border: 1px solid var(--color-rule);">
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
					{@const contactEmails = parseEmails(client.contact_email)}
					{@const integrationEmails = client.integration_type === 'email'
						? parseEmails(client.integration_target)
						: []
					}
					<tr class="border-t" style="border-color: var(--color-rule);">
						<td class="p-3">
							<span style="color: var(--color-ink); font-weight: 500;">{client.company_name}</span>
						</td>
						<td class="p-3 text-xs" style="color: var(--color-muted);">
							<span style="color: var(--color-ink);">{client.contact_name || '–'}</span>
							{#if contactEmails.length > 0}
								<div class="flex flex-wrap gap-1 mt-1">
									{#each contactEmails as email}
										<span
											class="inline-block px-1.5 py-0.5 rounded-full"
											style="background: var(--color-rule); font-size: 10px; color: var(--color-muted);"
										>
											{email}
										</span>
									{/each}
								</div>
							{:else}
								<br/><span style="color: var(--color-faint);">–</span>
							{/if}
						</td>
						<td class="p-3">
							<span class="text-xs font-medium" style={statusStyle(client.status)}>
								{client.status === 'lead' ? 'Lead' : client.status === 'pilot' ? 'Pilot' : client.status === 'paid' ? 'Paying' : client.status === 'free' ? 'Free' : 'Churned'}
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
							<span style="font-weight: 500; color: var(--color-ink);">
								{client.integration_type === 'email' ? 'E-Mail' : client.integration_type === 'webhook' ? 'Webhook' : 'iFrame'}
							</span>
							{#if integrationEmails.length > 0}
								<div class="flex flex-wrap gap-1 mt-1">
									{#each integrationEmails as email}
										<span
											class="inline-block px-1.5 py-0.5 rounded-full"
											style="background: var(--color-rule); font-size: 10px; color: var(--color-muted);"
										>
											{email}
										</span>
									{/each}
								</div>
							{:else if client.integration_target}
								<br/><span style="font-size: 10px;">{client.integration_target.slice(0, 40)}{client.integration_target.length > 40 ? '...' : ''}</span>
							{/if}
						</td>
						<td class="p-3 text-right">
							<div class="flex justify-end gap-2 flex-wrap">
								<button type="button" onclick={() => sendWelcomeEmail(client)}
									disabled={sendingWelcome === client.id}
									class="text-xs px-2 py-1 rounded-[4px] hover:opacity-70 disabled:opacity-40"
									style="color: var(--color-sage); border: 1px solid var(--color-sage);"
									title="Willkommens-Mail an {contactEmails.join(', ') || client.integration_target}"
								>
									{sendingWelcome === client.id ? '...' : 'Willkommensmail'}
								</button>
								<button type="button" onclick={() => sendTestEmail(client)}
									disabled={sendingTest === client.id}
									class="text-xs px-2 py-1 rounded-[4px] hover:opacity-70 disabled:opacity-40"
									style="color: var(--color-amber); border: 1px solid var(--color-amber);"
									title="Test-Mail an aronpfuetzner@gmail.com"
								>
									{sendingTest === client.id ? '...' : 'Test'}
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
