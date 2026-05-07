<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const { totalStories, categories, subscribers, heroStory } = $derived(data);

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
</script>

<h1 class="serif text-2xl" style="color: var(--color-ink);">Dashboard</h1>
<p class="mt-2 text-sm" style="color: var(--color-muted);">Uebersicht ueber dein NurEine-Archiv.</p>

<div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Stories</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{totalStories}</p>
	</div>
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Subscriber</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{subscribers.total}</p>
		<p class="text-xs mt-1" style="color: var(--color-muted);">{subscribers.confirmed} bestaetigt</p>
	</div>
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Plus</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{subscribers.plus}</p>
	</div>
	<div class="paper p-4 sm:p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">B2B</p>
		<p class="serif text-3xl sm:text-4xl mt-2" style="color: var(--color-ink);">{subscribers.b2b}</p>
	</div>
</div>

<div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Hero Story -->
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<h2 class="serif text-lg" style="color: var(--color-ink);">Heutiger Hero</h2>
		{#if heroStory}
			<p class="mt-2 serif text-base" style="color: var(--color-ink);">{heroStory.title}</p>
			<div class="mt-2 flex gap-3 text-xs" style="color: var(--color-muted);">
				<span>{heroStory.category}</span>
				<span>Impact: {heroStory.impactScore}/100</span>
			</div>
		{:else}
			<p class="mt-2 text-sm" style="color: var(--color-muted);">Keine Hero-Story gesetzt.</p>
		{/if}
	</div>

	<!-- Test Newsletter -->
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<h2 class="serif text-lg" style="color: var(--color-ink);">Test-Newsletter senden</h2>
		<p class="mt-1 text-xs" style="color: var(--color-muted);">Sendet eine Test-E-Mail an die angegebene Adresse – mit der aktuellen Hero-Story.</p>
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

<div class="mt-10">
	<h2 class="serif text-lg" style="color: var(--color-ink);">Subscriber nach Tier</h2>
	<div class="mt-3 grid grid-cols-3 gap-3">
		<div class="paper p-4 rounded-[4px]" style="border: 1px solid var(--color-rule);">
			<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Free</p>
			<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{subscribers.free}</p>
		</div>
		<div class="paper p-4 rounded-[4px]" style="border: 1px solid var(--color-rule);">
			<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Plus</p>
			<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{subscribers.plus}</p>
		</div>
		<div class="paper p-4 rounded-[4px]" style="border: 1px solid var(--color-rule);">
			<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">B2B</p>
			<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{subscribers.b2b}</p>
		</div>
	</div>
</div>

<div class="mt-10">
	<h2 class="serif text-lg" style="color: var(--color-ink);">Kategorien</h2>
	<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
		{#each Object.entries(categories) as [cat, count]}
			<div class="paper p-3 sm:p-4 rounded-[4px]" style="border: 1px solid var(--color-rule);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">{cat}</p>
				<p class="serif text-xl sm:text-2xl mt-1" style="color: var(--color-ink);">{count}</p>
			</div>
		{/each}
	</div>
</div>

<div class="mt-10">
	<a
		href={base + '/admin/stories'}
		class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
		style="background: var(--color-ink); color: var(--color-paper);"
	>
		Stories verwalten →
	</a>
</div>
