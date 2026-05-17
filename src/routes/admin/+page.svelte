<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate, relTime } from '$lib/utils';

	let { data } = $props();
	const { totalStories, categories, subscribers, heroStory, b2bStats, deliveryLog } = $derived(data);

	let testEmail = $state('');
	let testStatus = $state('');
	let testLoading = $state(false);

	async function sendTestNewsletter() {
		const email = testEmail.trim();
		if (!email) {
			testStatus = 'Bitte gib eine E-Mail-Adresse ein.';
			return;
		}
		testLoading = true;
		testStatus = '';
		try {
			const res = await fetch('/api/newsletter/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const result = await res.json();
			if (result.error) {
				testStatus = result.error;
			} else if (result.success) {
				testStatus = `Test-Newsletter gesendet! (messageId: ${result.messageId})`;
				testEmail = '';
			} else {
				testStatus = `Fehler: ${result.errors?.[0]?.error || 'Unbekannter Fehler'}`;
			}
		} catch {
			testStatus = 'Ein Fehler ist aufgetreten.';
		} finally {
			testLoading = false;
		}
	}

	function statusBadgeColor(status: string): string {
		switch (status) {
			case 'sent': return 'var(--color-sage)';
			case 'failed': return 'var(--color-rose)';
			default: return 'var(--color-muted)';
		}
	}
</script>

<!-- ===== MODUL 1: HUD (Heads Up Display) ===== -->
<h1 class="serif text-2xl" style="color: var(--color-ink);">Command Center</h1>
<p class="mt-1 text-sm" style="color: var(--color-muted);">Der Puls deines Business auf einen Blick.</p>

<div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
	<!-- MRR Card -->
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-sage);">MRR</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">
			{b2bStats.mrr.toLocaleString('de-DE')} €
		</p>
		<p class="text-xs mt-1" style="color: var(--color-muted);">
			{b2bStats.payingCount} Kunde{b2bStats.payingCount !== 1 ? 'n' : ''}
		</p>
	</div>

	<!-- Aktive Piloten -->
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-amber);">Aktive Piloten</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{b2bStats.pilotCount}</p>
		{#if b2bStats.pilotsExpiringSoon > 0}
			<p class="text-xs mt-1 font-medium" style="color: var(--color-rose);">
				{b2bStats.pilotsExpiringSoon} läuft in &lt;3 Tagen ab!
			</p>
		{:else}
			<p class="text-xs mt-1" style="color: var(--color-muted);">Keine akuten Abläufe</p>
		{/if}
	</div>

	<!-- Abonnenten -->
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-sky);">Abonnenten</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{subscribers.total}</p>
		<p class="text-xs mt-1" style="color: var(--color-muted);">{subscribers.confirmed} bestätigt</p>
	</div>

	<!-- B2B Total -->
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-ink-soft);">B2B Clients</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{b2bStats.activeClients}</p>
		<p class="text-xs mt-1" style="color: var(--color-muted);">
			{b2bStats.pilotCount} Pilot · {b2bStats.payingCount} Paid
		</p>
	</div>
</div>

<!-- ===== Nächste Hero-Story Preview ===== -->
<div class="mt-10">
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div class="flex-1 min-w-0">
				<h2 class="serif text-lg" style="color: var(--color-ink);">Nächste Hero-Story</h2>
				{#if heroStory}
					<div class="mt-3 flex items-start gap-4">
						{#if heroStory.imageUrl}
							<img
								src={heroStory.imageUrl}
								alt=""
								class="w-16 h-16 rounded-[6px] object-cover shrink-0"
								style="border: 1px solid var(--color-rule);"
							/>
						{/if}
						<div class="min-w-0">
							<p class="serif text-base" style="color: var(--color-ink);">{heroStory.title}</p>
							<p class="text-xs mt-1" style="color: var(--color-muted);">
								{heroStory.category} · Impact {heroStory.impactScore}/100
							</p>
							<a href={base + '/geschichte/' + heroStory.slug} target="_blank" class="text-xs hover:opacity-70" style="color: var(--color-ink-soft);">
								Vorschau →
							</a>
						</div>
					</div>
				{:else}
					<p class="mt-2 text-sm" style="color: var(--color-muted);">Keine Hero-Story gesetzt.</p>
				{/if}
			</div>
			{#if heroStory}
				<div class="flex gap-2 shrink-0">
					<button
						type="button"
						class="px-4 py-2 rounded-full text-xs font-medium"
						style="background: var(--color-sage); color: var(--color-paper);"
					>
						Approve
					</button>
					<button
						type="button"
						class="px-4 py-2 rounded-full text-xs font-medium"
						style="background: var(--color-rose); color: var(--color-paper);"
					>
						Reject
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- ===== MODUL 2 + 4: B2B Pipeline & Delivery Log Mini ===== -->
<div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- B2B Pipeline Vorschau -->
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<div class="flex items-center justify-between">
			<h2 class="serif text-lg" style="color: var(--color-ink);">B2B Pipeline</h2>
			<a
				href={base + '/admin/b2b'}
				class="text-xs px-3 py-1 rounded-full"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Verwalten →
			</a>
		</div>
		<div class="mt-4 flex gap-4 text-sm">
			<div class="flex-1 text-center paper p-3 rounded-[4px]" style="border: 1px solid var(--color-rule);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Lead</p>
				<p class="serif text-2xl mt-1" style="color: var(--color-ink);">
					{b2bStats.activeClients - b2bStats.pilotCount - b2bStats.payingCount}
				</p>
			</div>
			<div class="flex-1 text-center paper p-3 rounded-[4px]" style="border: 1px solid var(--color-amber);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-amber);">Pilot</p>
				<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{b2bStats.pilotCount}</p>
			</div>
			<div class="flex-1 text-center paper p-3 rounded-[4px]" style="border: 1px solid var(--color-sage);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-sage);">Paid</p>
				<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{b2bStats.payingCount}</p>
			</div>
			<div class="flex-1 text-center paper p-3 rounded-[4px]" style="border: 1px solid var(--color-muted);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Churned</p>
				<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{b2bStats.churnedCount}</p>
			</div>
		</div>
	</div>

	<!-- Delivery Log Mini -->
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<div class="flex items-center justify-between">
			<h2 class="serif text-lg" style="color: var(--color-ink);">Letzte Auslieferungen</h2>
			<a
				href={base + '/admin/delivery'}
				class="text-xs px-3 py-1 rounded-full"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Alle →
			</a>
		</div>
		{#if deliveryLog && deliveryLog.length > 0}
			<div class="mt-4 space-y-2">
				{#each deliveryLog as entry}
					<div class="flex items-center justify-between text-xs py-1.5 border-b" style="border-color: var(--color-rule);">
						<div class="flex-1 min-w-0">
							<span class="font-medium" style="color: var(--color-ink);">{entry.company_name || entry.integration_target}</span>
							<span class="mx-2" style="color: var(--color-faint);">·</span>
							<span style="color: var(--color-muted);">{entry.story_title || '–'}</span>
						</div>
						<span
							class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
							style="color: var(--color-paper); background: {statusBadgeColor(entry.status)};"
						>
							{entry.status === 'sent' ? 'OK' : entry.status === 'failed' ? 'FEHLER' : entry.status}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="mt-4 text-sm" style="color: var(--color-muted);">Noch keine Auslieferungen.</p>
		{/if}
	</div>
</div>

<!-- ===== MODUL 3: Audience Mini ===== -->
<div class="mt-10">
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<div class="flex items-center justify-between">
			<h2 class="serif text-lg" style="color: var(--color-ink);">Audience</h2>
			<a
				href={base + '/admin/audience'}
				class="text-xs px-3 py-1 rounded-full"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				CSV Export →
			</a>
		</div>
		<div class="mt-4 grid grid-cols-3 gap-3">
			<div class="paper p-3 rounded-[4px] text-center" style="border: 1px solid var(--color-rule);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Total</p>
				<p class="serif text-xl mt-1" style="color: var(--color-ink);">{subscribers.total}</p>
			</div>
			<div class="paper p-3 rounded-[4px] text-center" style="border: 1px solid var(--color-rule);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Bestätigt</p>
				<p class="serif text-xl mt-1" style="color: var(--color-ink);">{subscribers.confirmed}</p>
			</div>
			<div class="paper p-3 rounded-[4px] text-center" style="border: 1px solid var(--color-rule);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">B2B</p>
				<p class="serif text-xl mt-1" style="color: var(--color-ink);">{subscribers.b2b}</p>
			</div>
		</div>
	</div>
</div>

<!-- ===== Kategorien & Test-Newsletter ===== -->
<div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Kategorien -->
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<h2 class="serif text-lg" style="color: var(--color-ink);">Kategorien</h2>
		<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
			{#each Object.entries(categories) as [cat, count]}
				<div class="paper p-3 rounded-[4px] text-center" style="border: 1px solid var(--color-rule);">
					<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">{cat}</p>
					<p class="serif text-xl mt-1" style="color: var(--color-ink);">{count}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Test-Newsletter -->
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<h2 class="serif text-lg" style="color: var(--color-ink);">Test-Newsletter senden</h2>
		<p class="mt-1 text-xs" style="color: var(--color-muted);">Sendet eine Test-E-Mail mit der aktuellen Hero-Story.</p>
		<form
			onsubmit={(e) => { e.preventDefault(); sendTestNewsletter(); }}
			class="mt-4 flex flex-col gap-3"
		>
			<input
				type="email"
				bind:value={testEmail}
				placeholder="test@nureine.de"
				required
				autocomplete="email"
				class="w-full px-4 py-2.5 rounded-[4px] text-sm border outline-none"
				style="background: var(--color-paper); border-color: var(--color-rule); color: var(--color-ink);"
				oninput={() => { if (testStatus) testStatus = ''; }}
			/>
			<button
				type="submit"
				disabled={testLoading}
				class="w-full px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-60"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				{#if testLoading}
					<span class="inline-flex items-center gap-2">
						<span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
						Sendet ...
					</span>
				{:else}
					Test-Newsletter senden
				{/if}
			</button>
			{#if testStatus}
				<p
					class="text-xs leading-relaxed"
					style="color: {testStatus.includes('gesendet') ? 'var(--color-sage)' : 'var(--color-rose)'};"
				>
					{testStatus}
				</p>
			{/if}
		</form>
	</div>
</div>

<div class="mt-8 pb-8">
	<a
		href={base + '/admin/stories'}
		class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
		style="background: var(--color-ink); color: var(--color-paper);"
	>
		Stories verwalten →
	</a>
</div>
