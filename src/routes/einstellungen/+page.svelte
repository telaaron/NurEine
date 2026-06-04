<script lang="ts">
	import { base } from '$app/paths';
	import { CATEGORIES } from '$lib/categories';

	let { data } = $props();

	let selected = $state<Set<string>>(new Set(data.ok ? data.categories : []));
	let hasKids = $state<boolean | null>(data.ok ? (data.hasKids ?? null) : null);
	let saving = $state(false);
	let savedMsg = $state('');
	let errorMsg = $state('');

	const refLink = $derived(
		data.ok && data.referralCode ? `https://nureine.de/?ref=${data.referralCode}` : ''
	);
	let refCopied = $state(false);
	function copyRef() {
		if (!refLink) return;
		navigator.clipboard?.writeText(refLink).then(() => {
			refCopied = true;
			setTimeout(() => (refCopied = false), 1800);
		}).catch(() => {});
	}

	function toggle(slug: string) {
		const next = new Set(selected);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		selected = next;
	}

	async function save() {
		if (!data.ok || saving) return;
		saving = true;
		savedMsg = '';
		errorMsg = '';
		try {
			const res = await fetch(`${base}/api/preferences`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: data.email, token: data.token, categories: [...selected], ...(hasKids !== null ? { has_kids: hasKids } : {}) })
			});
			const result = await res.json();
			if (res.ok) {
				savedMsg = selected.size === 0
					? 'Gespeichert — du erhältst Geschichten aus allen Themen.'
					: 'Gespeichert. Dein täglicher Lichtblick ist jetzt auf dich zugeschnitten.';
			} else {
				errorMsg = result.error || 'Speichern fehlgeschlagen.';
			}
		} catch {
			errorMsg = 'Ein Fehler ist aufgetreten.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Deine Einstellungen — NurEine</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="mx-auto max-w-[680px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	{#if !data.ok}
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Einstellungen</span>
		<h1 class="display mt-4 text-3xl sm:text-4xl" style="color: var(--color-ink); font-weight: 600;">Link ungültig</h1>
		<p class="mt-4 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Dieser Einstellungs-Link ist ungültig oder abgelaufen. Bitte nutze den Link aus deiner
			aktuellsten NurEine-E-Mail.
		</p>
		<a href={base + '/'} class="mt-6 inline-flex items-center gap-2 text-sm" style="color: var(--color-ink-soft); border-bottom: 1.5px solid var(--color-rule-strong); padding-bottom: 3px;">
			Zur Startseite <span aria-hidden="true">→</span>
		</a>
	{:else}
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Deine Einstellungen</span>
		<h1 class="display mt-4 text-3xl sm:text-4xl leading-[1.05]" style="color: var(--color-ink); font-weight: 600;">
			Welche guten Nachrichten willst du?
		</h1>
		<p class="mt-4 text-base sm:text-lg leading-[1.5] max-w-[46ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Wähle deine Themen. Wir senden dir täglich die stärkste Geschichte daraus. Keine Auswahl =
			alle Themen.
		</p>

		<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each CATEGORIES as cat}
				{@const on = selected.has(cat.slug)}
				<button
					type="button"
					onclick={() => toggle(cat.slug)}
					class="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-[0.99]"
					style="border: 1px solid {on ? 'var(--color-amber)' : 'var(--color-rule)'};
						background: {on ? 'var(--color-amber-tint)' : 'var(--color-paper)'};
						box-shadow: {on ? 'var(--shadow-sm)' : 'none'};"
					aria-pressed={on}
				>
					<span class="text-xl" aria-hidden="true">{cat.emoji}</span>
					<span class="flex-1 text-base" style="color: var(--color-ink); font-weight: {on ? 600 : 400};">{cat.label}</span>
					<span
						class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
						style="border: 1.5px solid {on ? 'var(--color-amber)' : 'var(--color-rule-strong)'}; background: {on ? 'var(--color-amber)' : 'transparent'};"
					>
						{#if on}
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
						{/if}
					</span>
				</button>
			{/each}
		</div>

		<!-- Family: one optional question -->
		<div class="mt-10 pt-8" style="border-top: 1px solid var(--color-rule);">
			<p class="text-base font-medium" style="color: var(--color-ink);">Hast du Kinder im Haushalt?</p>
			<p class="mt-1 text-sm leading-relaxed max-w-[42ch]" style="color: var(--color-muted); font-family: var(--font-serif);">
				Wenn ja, ergänzen wir passende Geschichten um eine kindgerechte Erklärung und einen Gesprächsstarter — für das Gespräch beim Abendessen.
			</p>
			<div class="mt-3 flex gap-2">
				{#each [{ v: true, l: 'Ja' }, { v: false, l: 'Nein' }] as opt}
					{@const on = hasKids === opt.v}
					<button type="button" onclick={() => (hasKids = on ? null : opt.v)}
						class="px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
						style="border: 1px solid {on ? 'var(--color-amber)' : 'var(--color-rule)'}; background: {on ? 'var(--color-amber-tint)' : 'var(--color-paper)'}; color: var(--color-ink);">
						{opt.l}
					</button>
				{/each}
			</div>
		</div>

		<div class="mt-8 flex items-center gap-4 flex-wrap">
			<button
				type="button"
				onclick={save}
				disabled={saving}
				class="px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60"
				style="background: var(--color-ink); color: var(--color-paper); box-shadow: var(--shadow-sm);"
			>
				{saving ? 'Speichern…' : 'Einstellungen speichern'}
			</button>
			{#if savedMsg}
				<span class="text-sm" style="color: var(--color-sage); font-family: var(--font-serif);">{savedMsg}</span>
			{:else if errorMsg}
				<span class="text-sm" style="color: var(--color-rose); font-family: var(--font-serif);">{errorMsg}</span>
			{/if}
		</div>

		{#if data.ok && data.referralCode}
			<div class="mt-12 pt-8" style="border-top: 1px solid var(--color-rule);">
				<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Weitersagen</span>
				<h2 class="display mt-3 text-xl sm:text-2xl" style="color: var(--color-ink); font-weight: 600;">
					Schenk jemandem den täglichen Lichtblick.
				</h2>
				<p class="mt-2 text-sm leading-relaxed max-w-[46ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
					Teile deinen Link. {#if data.referralCount > 0}Schon <strong>{data.referralCount}</strong> {data.referralCount === 1 ? 'Person hat' : 'Menschen haben'} durch dich angefangen. Danke.{:else}Jede:r, der über dich startet, zählt.{/if}
				</p>
				<div class="mt-4 flex flex-col sm:flex-row gap-3 max-w-[460px]">
					<input
						type="text"
						readonly
						value={refLink}
						class="flex-1 px-4 py-3 rounded-full text-sm"
						style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink-soft);"
					/>
					<button
						type="button"
						onclick={copyRef}
						class="px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-[0.97] whitespace-nowrap"
						style="background: var(--color-amber); color: var(--color-paper);"
					>
						{refCopied ? 'Kopiert ✓' : 'Link kopieren'}
					</button>
				</div>
			</div>
		{/if}

		<p class="mt-10 text-xs" style="color: var(--color-faint); font-family: var(--font-mono); letter-spacing: 0.03em;">
			Angemeldet als {data.email}
		</p>
	{/if}
</section>
