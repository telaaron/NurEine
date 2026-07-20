<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';
	import ShareBar from '$lib/components/ShareBar.svelte';

	let { data } = $props();
	const url = 'https://nureine.de/roadmap';

	const CAT_LABEL: Record<string, string> = { feature: 'Neu', fix: 'Verbessert', content: 'Inhalt' };
	const CAT_COLOR: Record<string, string> = { feature: 'var(--color-sage)', fix: 'var(--color-sky)', content: 'var(--color-amber)' };

	function fmt(d: string): string {
		return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	// Feedback-Form
	let kind = $state<'idea' | 'bug' | 'praise' | 'other'>('idea');
	let message = $state('');
	let email = $state('');
	let sending = $state(false);
	let sent = $state(false);
	let errorMsg = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (sending || message.trim().length < 3) return;
		sending = true;
		errorMsg = '';
		try {
			const res = await fetch(`${base}/api/feedback`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: message.trim(), kind, email: email.trim() || undefined })
			});
			const r = await res.json();
			if (res.ok) {
				sent = true;
				message = '';
				email = '';
				track('cta_click', { cta: 'feedback_sent' });
			} else {
				errorMsg = r.error || 'Etwas ging schief.';
			}
		} catch {
			errorMsg = 'Verbindungsfehler.';
		} finally {
			sending = false;
		}
	}

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'NurEine Roadmap & Changelog',
		description: 'Was NurEine neu gebaut hat, woran wir arbeiten und was geplant ist. Mit öffentlichem Feedback.',
		url
	});
</script>

<svelte:head>
	<title>Roadmap & Changelog — NurEine</title>
	<meta name="description" content="Was bei NurEine neu ist, woran wir arbeiten und was geplant ist — transparent. Gib Feedback und gestalte mit." />
	<link rel="canonical" href={url} />
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<section class="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<p class="eyebrow" style="color: var(--color-amber);">Roadmap & Changelog</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink); font-weight: 700;">
		Was wir bauen — offen für alle.
	</h1>
	<p class="mt-6 text-lg leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		NurEine entsteht im Offenen. Hier siehst du, was neu ist, woran wir gerade arbeiten und
		was als Nächstes kommt. Und das Wichtigste: Du kannst mitgestalten.
	</p>

	<!-- Feedback zuerst (Mitmach-Aufforderung) -->
	<div class="mt-10 paper rounded-[12px] p-5 sm:p-7" style="border: 1px solid var(--color-rule);">
		<h2 class="display text-xl" style="color: var(--color-ink); font-weight: 600;">Deine Idee zählt</h2>
		<p class="mt-2 text-sm leading-relaxed" style="color: var(--color-muted); font-family: var(--font-serif);">
			Was fehlt dir? Was stört? Was liebst du? Schreib's uns — ohne Anmeldung.
		</p>
		{#if sent}
			<div class="mt-4 p-4 rounded-[10px] flex items-center gap-3" style="background: var(--color-sage-tint); border: 1px solid var(--color-sage);">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				<span class="text-sm" style="color: var(--color-ink);">Danke! Wir lesen jede Nachricht.</span>
				<button type="button" onclick={() => (sent = false)} class="ml-auto text-xs underline" style="color: var(--color-muted);">Noch eine</button>
			</div>
		{:else}
			<form onsubmit={submit} class="mt-4 flex flex-col gap-3">
				<div class="flex gap-2 flex-wrap">
					{#each [['idea', 'Idee'], ['bug', 'Problem'], ['praise', 'Lob'], ['other', 'Sonstiges']] as [k, label]}
						<button type="button" onclick={() => (kind = k as typeof kind)}
							class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
							style={kind === k ? 'background: var(--color-surface-ink); color: var(--color-on-ink);' : 'background: var(--color-canvas-soft); color: var(--color-ink-soft); border: 1px solid var(--color-rule);'}>
							{label}
						</button>
					{/each}
				</div>
				<textarea bind:value={message} rows="3" maxlength="2000" placeholder="Erzähl uns…"
					class="w-full p-3 rounded-[10px] text-sm" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink); font-family: var(--font-serif);"></textarea>
				<div class="flex gap-3 flex-col sm:flex-row sm:items-center">
					<input type="email" bind:value={email} placeholder="E-Mail (optional, für Rückfragen)"
						class="flex-1 px-3 py-2 rounded-full text-sm" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink);" />
					<button type="submit" disabled={sending || message.trim().length < 3}
						class="px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50" style="background: var(--color-amber); color: var(--color-on-accent);">
						{sending ? 'Sende…' : 'Absenden'}
					</button>
				</div>
				{#if errorMsg}<p class="text-xs" style="color: var(--color-rose);">{errorMsg}</p>{/if}
			</form>
		{/if}
	</div>

	<!-- Timeline -->
	{#snippet entryList(entries: typeof data.shipped, dimmed: boolean)}
		<div class="flex flex-col gap-3">
			{#each entries as e}
				<div class="flex gap-3 p-4 rounded-[10px]" style="background: {dimmed ? 'transparent' : 'var(--color-canvas-soft)'}; border: 1px solid var(--color-rule);">
					{#if e.category}
						<span class="shrink-0 mt-0.5 text-[0.6rem] uppercase tracking-wider px-2 py-1 rounded-full h-fit" style="background: {CAT_COLOR[e.category]}; color: #fff; font-family: var(--font-mono);">{CAT_LABEL[e.category] ?? e.category}</span>
					{/if}
					<div class="min-w-0">
						<div class="flex items-baseline gap-2 flex-wrap">
							<span class="font-semibold text-sm" style="color: var(--color-ink);">{e.title}</span>
							<span class="text-xs" style="color: var(--color-faint); font-family: var(--font-mono);">{fmt(e.released_at)}</span>
						</div>
						{#if e.description}<p class="mt-1 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{e.description}</p>{/if}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}

	{#if data.inProgress.length}
		<div class="mt-12">
			<h2 class="text-xs uppercase tracking-[0.16em] mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">⚡ In Arbeit</h2>
			{@render entryList(data.inProgress, false)}
		</div>
	{/if}

	{#if data.planned.length}
		<div class="mt-10">
			<h2 class="text-xs uppercase tracking-[0.16em] mb-3" style="color: var(--color-faint); font-family: var(--font-mono);">○ Geplant</h2>
			{@render entryList(data.planned, true)}
		</div>
	{/if}

	{#if data.shipped.length}
		<div class="mt-10">
			<h2 class="text-xs uppercase tracking-[0.16em] mb-3" style="color: var(--color-sage); font-family: var(--font-mono);">✓ Veröffentlicht</h2>
			{@render entryList(data.shipped, false)}
		</div>
	{/if}

	<div class="mt-12 pt-8 flex items-center justify-between" style="border-top: 1px solid var(--color-rule);">
		<a href={base + '/werte'} class="text-sm hover:opacity-70" style="color: var(--color-amber);">Unsere Werte →</a>
		<ShareBar {url} title="NurEine Roadmap" text="Was NurEine baut — offen für alle. Gib Feedback." />
	</div>
</section>
