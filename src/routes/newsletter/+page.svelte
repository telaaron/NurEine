<script lang="ts">
	const tiers = [
		{
			name: 'Sonntags-Brief',
			price: 'kostenlos',
			cadence: 'wöchentlich',
			features: [
				'Eine kuratierte Geschichte pro Woche',
				'Hintergrund + Quellen',
				'Ein Brief der Redaktion',
				'Werbefrei, jederzeit kündbar'
			],
			cta: 'Abonnieren',
			highlight: false
		},
		{
			name: 'Lichtblick Plus',
			price: '5 €',
			cadence: 'pro Monat',
			features: [
				'Alles aus dem Sonntags-Brief',
				'Tägliche Audio-Variante (5 Min.)',
				'Wöchentlicher Deep-Dive zu globalen Bewegungen',
				'Zugang zur Karte der Hoffnung in Hi-Res',
				'Frühzugang neue Features'
			],
			cta: 'Plus abonnieren',
			highlight: true
		},
		{
			name: 'Redaktionen & Schulen',
			price: 'auf Anfrage',
			cadence: 'B2B-Lizenz',
			features: [
				'API-Zugriff zu Wirkungsindex-Daten',
				'Wartezimmer- und Klassenraum-Display-Lizenz',
				'Whitelabel-Newsletter',
				'Persönlicher Ansprechpartner'
			],
			cta: 'Kontakt aufnehmen',
			highlight: false
		}
	];
</script>

<svelte:head>
	<title>Newsletter — Lichtblick</title>
</svelte:head>

<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pt-12 lg:pt-16 pb-12">
	<p class="text-[11px] uppercase tracking-[0.22em]" style="color: var(--color-amber); font-weight: 500;">
		Newsletter
	</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[2.4rem] lg:text-[3.6rem] max-w-[18ch]"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Eine Geschichte. Sonntag morgens. Mehr nicht.
	</h1>
	<p
		class="mt-5 max-w-[55ch] text-lg leading-relaxed"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Wir verschicken keine Push-Nachrichten, keine Daily-Mails, keine "Breaking News". Nur einen
		Brief pro Woche, kuratiert und tief.
	</p>
</section>

<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-20">
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		{#each tiers as tier}
			<div
				class="p-8 rounded-[8px] flex flex-col"
				style="
          background: {tier.highlight ? 'var(--color-ink)' : 'var(--color-paper)'};
          color: {tier.highlight ? 'var(--color-paper)' : 'var(--color-ink)'};
          border: 1px solid {tier.highlight ? 'var(--color-ink)' : 'var(--color-rule)'};
        "
			>
				<p
					class="text-[11px] uppercase tracking-[0.22em]"
					style="color: {tier.highlight ? 'var(--color-amber-soft)' : 'var(--color-amber)'}; font-weight: 500;"
				>
					{tier.name}
				</p>
				<div class="mt-4 flex items-baseline gap-2">
					<span class="serif text-4xl" style="font-weight: 500;">{tier.price}</span>
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
				<button
					type="button"
					class="mt-8 px-5 py-3 rounded-full text-sm font-medium transition-all"
					style="
            background: {tier.highlight ? 'var(--color-amber)' : 'var(--color-ink)'};
            color: var(--color-paper);
          "
				>
					{tier.cta}
				</button>
			</div>
		{/each}
	</div>

	<p class="mt-10 text-xs text-center" style="color: var(--color-muted);">
		Wir senden ausschließlich, was du angefordert hast. Kein Tracking-Pixel, kein Verkauf von
		E-Mail-Adressen.
	</p>
</section>
