<script lang="ts">
	import { base } from '$app/paths';
	import { CATEGORIES } from '$lib/categories';
	import { track } from '$lib/track';

	let title = $state('');
	let sourceUrl = $state('');
	let reason = $state('');
	let category = $state('');
	let region = $state('');
	let submitterEmail = $state('');
	let loading = $state(false);
	let done = $state(false);
	let errorMsg = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (loading || !title.trim() || !sourceUrl.trim()) return;
		loading = true;
		errorMsg = '';
		try {
			const res = await fetch(`${base}/api/submit-story`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					source_url: sourceUrl.trim(),
					reason: reason.trim(),
					category: category || undefined,
					region: region.trim() || undefined,
					submitter_email: submitterEmail.trim() || undefined
				})
			});
			const result = await res.json();
			if (res.ok) {
				track('story_submitted', { category: category || null });
				done = true;
			} else {
				errorMsg = result.error || 'Ein Fehler ist aufgetreten.';
			}
		} catch {
			errorMsg = 'Ein Fehler ist aufgetreten.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Geschichte einreichen — NurEine</title>
	<meta
		name="description"
		content="Kennst du eine gute Nachricht, die mehr Menschen sehen sollten? Reiche sie bei NurEine ein — wir prüfen jede Einsendung."
	/>
</svelte:head>

<section class="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Mitmachen</span>
	<h1 class="display mt-4 text-3xl sm:text-4xl lg:text-5xl leading-[1.02]" style="color: var(--color-ink); font-weight: 600;">
		Du kennst eine gute Nachricht?
	</h1>
	<p class="mt-5 text-lg leading-[1.5] max-w-[48ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		Reiche sie ein. Wir prüfen jede Einsendung, bewerten die Wirkung — und die
		stärksten erscheinen auf NurEine. Keine Anmeldung nötig.
	</p>

	{#if done}
		<div class="mt-10 p-7 rounded-2xl" style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
			<h2 class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">Danke! 🌱</h2>
			<p class="mt-3 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
				Deine Geschichte ist bei uns. Wir schauen sie uns an — gute Nachrichten verdienen
				Sorgfalt.
			</p>
			<a href={base + '/'} class="mt-5 inline-flex items-center gap-2 text-sm" style="color: var(--color-ink-soft); border-bottom: 1.5px solid var(--color-rule-strong); padding-bottom: 3px;">
				Zur heutigen Geschichte <span aria-hidden="true">→</span>
			</a>
		</div>
	{:else}
		<form class="mt-10 flex flex-col gap-5" onsubmit={submit}>
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium" style="color: var(--color-ink);">Worum geht es? *</span>
				<input
					type="text" required bind:value={title} maxlength="200"
					placeholder="z.B. Neue Methode reinigt Ozeane von Mikroplastik"
					class="px-4 py-3 rounded-xl text-sm" style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</label>
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium" style="color: var(--color-ink);">Quelle (Link) *</span>
				<input
					type="url" required bind:value={sourceUrl}
					placeholder="https://…"
					class="px-4 py-3 rounded-xl text-sm" style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</label>
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium" style="color: var(--color-ink);">Warum ist das bedeutsam?</span>
				<textarea
					bind:value={reason} rows="3" maxlength="1000"
					placeholder="Was macht diese Nachricht wichtig? Wie viele Menschen profitieren?"
					class="px-4 py-3 rounded-xl text-sm resize-none" style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink); font-family: var(--font-serif);"
				></textarea>
			</label>
			<div class="grid sm:grid-cols-2 gap-5">
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium" style="color: var(--color-ink);">Kategorie</span>
					<select bind:value={category} class="px-4 py-3 rounded-xl text-sm" style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);">
						<option value="">— wählen —</option>
						{#each CATEGORIES as c}<option value={c.slug}>{c.label}</option>{/each}
					</select>
				</label>
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium" style="color: var(--color-ink);">Region (optional)</span>
					<input type="text" bind:value={region} placeholder="z.B. Berlin, Kenia, weltweit" maxlength="120" class="px-4 py-3 rounded-xl text-sm" style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);" />
				</label>
			</div>
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium" style="color: var(--color-ink);">Deine E-Mail (optional)</span>
				<input type="email" bind:value={submitterEmail} placeholder="Falls wir nachfragen möchten" class="px-4 py-3 rounded-xl text-sm" style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);" />
			</label>

			<div class="mt-2 flex items-center gap-4 flex-wrap">
				<button type="submit" disabled={loading} class="px-7 py-3.5 rounded-full text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60" style="background: var(--color-surface-ink); color: var(--color-on-ink); box-shadow: var(--shadow-sm);">
					{loading ? 'Wird gesendet…' : 'Geschichte einreichen'}
				</button>
				{#if errorMsg}<span class="text-sm" style="color: var(--color-rose); font-family: var(--font-serif);">{errorMsg}</span>{/if}
			</div>
		</form>
	{/if}
</section>
