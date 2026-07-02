<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';

	let emailInput = $state('');
	let status = $state('');
	let loading = $state(false);

	// After the double-opt-in link, /api/confirm redirects here with a query flag.
	// Surface an unmissable banner so the user knows it actually worked.
	const confirmed = $derived(page.url.searchParams.get('confirmed') === 'true');
	const errorCode = $derived(page.url.searchParams.get('error'));
	const errorMessages: Record<string, string> = {
		missing_token: 'Der Bestätigungslink war unvollständig. Bitte melde dich erneut an.',
		invalid_token: 'Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.',
		server_error: 'Da ist etwas schiefgelaufen. Bitte versuche es in ein paar Minuten erneut.'
	};
	const errorMessage = $derived(errorCode ? (errorMessages[errorCode] ?? errorMessages.server_error) : '');

	async function handleSubmit(tier: string) {
		const email = emailInput.trim();
		if (!email) {
			status = 'Bitte gib eine E-Mail-Adresse ein.';
			return;
		}

		loading = true;
		status = '';

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, tier })
			});
			const data = await res.json();

			if (data.error) {
				status = data.error;
			} else {
				status = data.message;
				emailInput = '';
			}
		} catch {
			status = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
		} finally {
			loading = false;
		}
	}

	const tiers = [
		{
			name: 'Täglicher Brief',
			price: 'kostenlos',
			cadence: 'täglich',
			features: [
				'Eine kuratierte Geschichte pro Tag',
				'Hintergrund + Quellen',
				'Ein Brief der Redaktion',
				'Werbefrei, jederzeit kündbar'
			],
			cta: 'Abonnieren',
			highlight: true,
			tier: 'free'
		},
		{
			name: 'Redaktionen & Schulen',
			price: 'ab 49 €',
			cadence: '/ Monat (Team-Lizenz)',
			features: [
				'API-Zugriff zu Wirkungsindex-Daten',
				'Wartezimmer- und Klassenraum-Display-Lizenz',
				'Whitelabel-Newsletter',
				'Monatliche Team-Auswertung',
				'Persönlicher Ansprechpartner'
			],
			cta: 'Mehr erfahren →',
			highlight: false,
			tier: 'b2b'
		}
	];

	function inputBg(highlight: boolean): string {
		return highlight ? 'rgba(250, 246, 238, 0.1)' : 'rgba(255, 255, 255, 0.9)';
	}
	function inputBorder(highlight: boolean): string {
		return highlight ? 'rgba(250, 246, 238, 0.2)' : 'var(--color-rule)';
	}
	function inputColor(highlight: boolean): string {
		return highlight ? 'var(--color-paper)' : 'var(--color-ink)';
	}
	function placeholderColor(highlight: boolean): string {
		return highlight ? 'rgba(250, 246, 238, 0.4)' : 'var(--color-muted)';
	}
</script>

{#if confirmed}
	<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-14">
		<div
			class="rounded-[14px] p-6 sm:p-8 flex items-start gap-4"
			style="background: var(--color-ink); box-shadow: var(--shadow-md);"
		>
			<div
				class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
				style="background: var(--color-amber);"
				aria-hidden="true"
			>
				<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20 6L9 17l-5-5" />
				</svg>
			</div>
			<div>
				<h2 class="display text-xl sm:text-2xl leading-tight" style="color: var(--color-paper); font-weight: 600;">
					Geschafft — du bist dabei! 🎉
				</h2>
				<p class="mt-2 text-sm sm:text-base leading-relaxed max-w-[52ch]" style="color: rgba(251,248,241,0.78); font-family: var(--font-serif);">
					Deine Anmeldung ist bestätigt. Ab morgen früh um 06:30 Uhr bekommst du jeden Tag eine gute Nachricht in dein Postfach. Eine Willkommens-Mail ist schon unterwegs.
				</p>
				<a
					href={base + '/'}
					class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:gap-3"
					style="background: var(--color-amber); color: var(--color-paper);"
				>
					Heutige Geschichte lesen
					<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5" /></svg>
				</a>
			</div>
		</div>
	</section>
{:else if errorMessage}
	<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-14">
		<div
			class="rounded-[14px] p-5 sm:p-6"
			style="background: var(--color-paper); border: 1px solid color-mix(in srgb, var(--color-amber) 45%, transparent);"
		>
			<p class="text-sm sm:text-base leading-relaxed" style="color: var(--color-ink);">
				{errorMessage}
			</p>
		</div>
	</section>
{/if}

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-16 pb-10 sm:pb-12">
	<p class="eyebrow" style="color: var(--color-amber);">
		Newsletter
	</p>
	<h1
		class="page-h1 mt-3 max-w-[18ch]"
		style="color: var(--color-ink); font-weight: 700;"
	>
		Eine Geschichte. Täglich. Mehr nicht.
	</h1>
	<p
		class="page-dek mt-5 max-w-[55ch] leading-relaxed"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Wir verschicken keine Push-Nachrichten, keine "Breaking News", keinen Algorithmus-Feed. Nur
		eine Geschichte pro Tag, kuratiert und tief.
	</p>
</section>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-14 sm:pb-20">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8" style="max-width: 800px; margin: 0 auto;">
		{#each tiers as tier}
			{@const isB2B = tier.name === 'Redaktionen & Schulen'}
			<div
				class="p-6 sm:p-8 rounded-[8px] flex flex-col"
				style="
          background: {tier.highlight ? 'var(--color-ink)' : 'var(--color-paper)'};
          color: {tier.highlight ? 'var(--color-paper)' : 'var(--color-ink)'};
          border: 1px solid {tier.highlight ? 'var(--color-ink)' : 'var(--color-rule)'};
        "
			>
				<p
					class="eyebrow"
					style="color: {tier.highlight ? 'var(--color-amber-soft)' : 'var(--color-amber)'};"
				>
					{tier.name}
				</p>
				<div class="mt-4 flex items-baseline gap-2">
					<span class="serif text-3xl sm:text-4xl" style="font-weight: 500;">{tier.price}</span>
					<span
						class="text-sm"
						style="color: {tier.highlight ? 'rgba(250, 246, 238, 0.65)' : 'var(--color-muted)'};"
					>
						{tier.cadence}
					</span>
				</div>
				<ul class="mt-6 space-y-3 flex-1">
					{#each tier.features as feat}
						<li class="flex items-start gap-3 text-sm leading-relaxed">
							<span
								class="mt-2 inline-block w-1.5 h-1.5 rounded-full shrink-0"
								aria-hidden="true"
								style="background: {tier.highlight
									? 'var(--color-amber-soft)'
									: 'var(--color-amber)'};"
							></span>
							<span
								style="color: {tier.highlight
									? 'rgba(250, 246, 238, 0.85)'
									: 'var(--color-ink-soft)'};"
							>
								{feat}
							</span>
						</li>
					{/each}
				</ul>

				{#if isB2B}
					<a
						href={base + '/preise#b2b-form'}
						class="mt-8 block w-full px-5 py-3 rounded-full text-sm font-medium text-center transition-all"
						style="
              background: {tier.highlight ? 'var(--color-amber)' : 'var(--color-ink)'};
              color: var(--color-paper);
            "
					>
						{tier.cta}
					</a>
				{:else}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit(tier.tier);
						}}
						class="mt-8 flex flex-col gap-3"
					>
						<input
							type="email"
							bind:value={emailInput}
							placeholder="Deine E-Mail-Adresse"
							required
							autocomplete="email"
							class="w-full px-4 py-3 rounded-full text-sm border outline-none transition-colors"
							style="
                background: {inputBg(tier.highlight)};
                border-color: {inputBorder(tier.highlight)};
                color: {inputColor(tier.highlight)};
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              "
							oninput={() => {
								if (status) status = '';
							}}
						/>
						<button
							type="submit"
							disabled={loading}
							class="w-full px-5 py-3 rounded-full text-sm font-medium transition-all disabled:opacity-60"
							style="
                background: {tier.highlight ? 'var(--color-amber)' : 'var(--color-ink)'};
                color: var(--color-paper);
              "
						>
							{#if loading}
								<span class="inline-flex items-center gap-2">
									<span
										class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
									></span>
									Wird gesendet ...
								</span>
							{:else}
								{tier.cta}
							{/if}
						</button>
						{#if status}
							<p
								class="text-xs leading-relaxed text-center"
								style="color: {tier.highlight ? 'var(--color-amber-soft)' : 'var(--color-amber)'};"
							>
								{status}
							</p>
						{/if}
					</form>
				{/if}
			</div>
		{/each}
	</div>

	<p class="mt-8 sm:mt-10 text-xs text-center" style="color: var(--color-muted);">
		Wir senden ausschließlich, was du angefordert hast. Kein Tracking-Pixel, kein Verkauf von
		E-Mail-Adressen.
	</p>
</section>
