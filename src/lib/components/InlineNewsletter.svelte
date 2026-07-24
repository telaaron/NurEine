<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';
	import { getRef } from '$lib/referral';
	import Icon from '$lib/components/Icon.svelte';
	import { CheckIcon } from 'heroicons-svelte/24/outline';

	let { source = 'inline', compact = false }: { source?: string; compact?: boolean } = $props();

	let email = $state('');
	let loading = $state(false);
	let done = $state(false);
	let msg = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (loading || !email.trim()) return;
		loading = true;
		msg = '';
		track('newsletter_signup_attempt', { source });
		try {
			const res = await fetch(`${base}/api/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), tier: 'free', source, ref: getRef() })
			});
			const result = await res.json();
			if (res.ok) {
				track('newsletter_signup', { source });
				done = true;
				msg = result.message || 'Fast geschafft! Bitte überprüfe dein Postfach.';
				email = '';
			} else {
				msg = result.error || 'Ein Fehler ist aufgetreten.';
			}
		} catch {
			msg = 'Ein Fehler ist aufgetreten.';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="relative overflow-hidden rounded-[16px] {compact ? 'p-6 sm:p-7' : 'p-7 sm:p-10'}"
	style="background: var(--color-surface-ink); box-shadow: var(--shadow-md);"
>
	<div class="absolute inset-0 pointer-events-none" aria-hidden="true" style="background: radial-gradient(ellipse 60% 90% at 100% 0%, rgba(200,115,64,0.30), transparent 60%);"></div>
	<div class="relative">
		<span class="eyebrow" style="color: var(--color-amber-soft); font-family: var(--font-mono);">Der tägliche Lichtblick</span>
		<h3 class="display mt-3 {compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} leading-[1.12]" style="color: var(--color-on-ink); font-weight: 600;">
			Magst du solche Geschichten?
		</h3>
		<p class="mt-3 text-sm sm:text-base leading-relaxed max-w-[44ch]" style="color: rgba(251,248,241,0.72); font-family: var(--font-serif);">
			Hol dir jeden Morgen eine — kuratiert, belegt, werbefrei. Kein Doomscrolling.
		</p>
		{#if done}
			<div
				class="mt-6 rounded-[14px] p-5 sm:p-6 flex items-start gap-4"
				style="background: rgba(251,248,241,0.07); border: 1px solid rgba(200,115,64,0.45);"
			>
				<div
					class="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
					style="background: var(--color-amber);"
					aria-hidden="true"
				>
					<Icon icon={CheckIcon} size="1.5rem" />
				</div>
				<div>
					<p class="text-base sm:text-lg font-semibold" style="color: var(--color-on-ink);">
						Fast geschafft — jetzt nur noch bestätigen.
					</p>
					<p class="mt-1.5 text-sm leading-relaxed" style="color: rgba(251,248,241,0.78); font-family: var(--font-serif);">
						Wir haben dir gerade eine E-Mail geschickt. <strong style="color: var(--color-amber-soft);">Öffne sie und klick auf den Bestätigungs-Link</strong> — danach bist du dabei. (Schau auch im Spam-Ordner nach, falls nichts ankommt.)
					</p>
				</div>
			</div>
		{:else}
			<form class="mt-5 flex flex-col sm:flex-row gap-3 max-w-[440px]" onsubmit={submit}>
				<label class="flex-1">
					<span class="sr-only">E-Mail-Adresse</span>
					<input
						type="email"
						required
						placeholder="Deine beste E-Mail"
						bind:value={email}
						disabled={loading}
						class="w-full px-4 py-3 rounded-full text-sm transition-all"
						style="background: rgba(251,248,241,0.06); border: 1px solid rgba(251,248,241,0.22); color: var(--color-on-ink);"
					/>
				</label>
				<button
					type="submit"
					disabled={loading}
					class="px-6 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap disabled:opacity-60 active:scale-[0.97]"
					style="background: var(--color-amber); color: var(--color-on-accent);"
				>
					{loading ? '…' : 'Abonnieren'}
				</button>
			</form>
			{#if msg}<p class="mt-3 text-sm" style="color: rgba(251,248,241,0.8); font-family: var(--font-serif);">{msg}</p>{/if}
		{/if}
	</div>
</div>
