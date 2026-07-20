<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';
	import { getRef } from '$lib/referral';

	let { data } = $props();
	const story = $derived(data.story);

	let email = $state('');
	let loading = $state(false);
	let success = $state(false);
	let status = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (loading) return;
		if (!email.trim()) {
			status = 'Bitte gib eine E-Mail-Adresse ein.';
			return;
		}
		loading = true;
		status = '';
		track('newsletter_signup_attempt', { source: 'lichtblick' });
		try {
			const res = await fetch(`${base}/api/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), tier: 'free', ref: getRef() })
			});
			const result = await res.json();
			if (res.ok) {
				track('newsletter_signup', { source: 'lichtblick' });
				success = true;
				status = result.message || '';
				email = '';
			} else {
				status = result.error || 'Etwas ist schiefgelaufen. Versuch es gleich nochmal.';
			}
		} catch {
			status = 'Etwas ist schiefgelaufen. Versuch es gleich nochmal.';
		} finally {
			loading = false;
		}
	}

	const imgSrc = $derived(
		story?.imageUrl
			? story.imageUrl.startsWith('http')
				? `${base}/img?url=${encodeURIComponent(story.imageUrl)}&w=900`
				: story.imageUrl
			: null
	);
</script>

<svelte:head>
	<title>Eine gute Nachricht für dich — NurEine</title>
	<meta name="description" content="Lies die gute Nachricht von heute — und bekomm jeden Morgen eine. Belegt, werbefrei, in zwei Minuten." />
	<link rel="canonical" href="https://nureine.de/lichtblick" />
</svelte:head>

<section class="mx-auto max-w-[600px] px-4 sm:px-6 py-10 sm:py-16">
	<!-- Eröffnung: das Gefühl, nicht das Produkt -->
	<div class="text-center">
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Deine gute Nachricht für heute</span>
		<h1 class="serif mt-4 text-2xl sm:text-3xl leading-tight" style="color: var(--color-ink); font-weight: 500;">
			Während alle über das Schlechte reden — das hier ist heute wirklich passiert.
		</h1>
	</div>

	{#if story}
		<!-- Die Story als Erlebnis, kompakt -->
		<article class="mt-8 rounded-[14px] overflow-hidden" style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-md);">
			{#if imgSrc}
				<div class="aspect-[16/10] overflow-hidden" style="background: var(--color-canvas-soft);">
					<img src={imgSrc} alt="" class="w-full h-full object-cover" loading="eager" />
				</div>
			{/if}
			<div class="p-5 sm:p-7">
				<div class="flex items-center gap-2 text-xs" style="color: var(--color-muted); font-family: var(--font-mono);">
					{#if story.country}<span>{story.country}</span><span>·</span>{/if}
					<span>Wirkung {story.impactScore}/100</span>
				</div>
				<h2 class="serif mt-3 text-xl sm:text-2xl leading-snug" style="color: var(--color-ink); font-weight: 500;">
					{story.title}
				</h2>
				<p class="mt-3 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
					{story.shareHook || story.dek}
				</p>
				<a
					href={base + '/geschichte/' + story.slug}
					onclick={() => track('cta_click', { cta: 'lichtblick_read', slug: story.slug })}
					class="mt-4 inline-flex items-center gap-1.5 text-sm hover:opacity-70"
					style="color: var(--color-amber);"
				>
					Ganze Geschichte lesen
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
				</a>
			</div>
		</article>
	{/if}

	<!-- Der Hook zum Abo — verkauft das Ritual, nicht "Newsletter" -->
	<div class="mt-10 text-center">
		{#if success}
			<div class="p-6 rounded-[14px]" style="background: var(--color-canvas-soft); border: 1px solid var(--color-sage);">
				<p class="serif text-lg" style="color: var(--color-ink);">Fast geschafft. ✨</p>
				<p class="mt-2 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
					Klick auf den Bestätigungslink in deiner E-Mail — dann startet morgen früh dein erster Lichtblick.
				</p>
			</div>
		{:else}
			<h2 class="serif text-xl sm:text-2xl leading-snug" style="color: var(--color-ink); font-weight: 500;">
				So fühlt sich jeder Morgen an, wenn du willst.
			</h2>
			<p class="mt-3 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
				Genau eine solche Geschichte — jeden Morgen, in zwei Minuten. Belegt, werbefrei, kein
				Doomscrolling. Du startest den Tag mit dem Gefühl, dass es vorangeht.
			</p>
			<form onsubmit={submit} class="mt-6 flex flex-col gap-3 max-w-[400px] mx-auto">
				<input
					type="email"
					bind:value={email}
					placeholder="deine@email.de"
					required
					class="px-5 py-3.5 rounded-full text-base text-center"
					style="border: 1px solid var(--color-rule-strong); background: var(--color-paper); color: var(--color-ink);"
				/>
				<button
					type="submit"
					disabled={loading}
					class="px-6 py-3.5 rounded-full text-base font-medium transition-all active:scale-[0.98]"
					style="background: var(--color-amber); color: var(--color-on-accent);"
				>
					{loading ? 'Einen Moment …' : 'Ja, schick mir jeden Morgen einen Lichtblick'}
				</button>
			</form>
			{#if status}
				<p class="mt-3 text-sm" style="color: var(--color-rose); font-family: var(--font-serif);">{status}</p>
			{/if}
			<p class="mt-4 text-xs leading-relaxed" style="color: var(--color-faint);">
				Kostenlos · jederzeit mit einem Klick abbestellbar · keine Werbung, nie.
			</p>
		{/if}
	</div>
</section>
