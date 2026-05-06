<script lang="ts">
	import { base } from '$app/paths';

	const tiers = [
		{
			name: 'Browser',
			tagline: 'Für den täglichen Blick',
			price: '0',
			cadence: '€ / Monat',
			features: [
				'Tägliche Hauptgeschichte',
				'Zugang zum vollständigen Archiv',
				'Karte der Hoffnung (Basis)',
				'Werbefreies Leseerlebnis'
			],
			transformation: 'Bleib informiert, ohne dich zu belasten.',
			cta: 'Jetzt lesen',
			highlight: false,
			url: base + '/'
		},
		{
			name: 'NurEine Plus',
			tagline: 'Dein tägliches 5-Minuten-Ritual',
			price: '29',
			cadence: '€ / Jahr',
			note: 'nur 2,42 € pro Monat',
			features: [
				'Alles aus dem Browser-Zugang',
				'Tägliche Audio-Variante (5 Min.)',
				'Sonntags-Brief als Newsletter',
				'Wöchentlicher Deep-Dive zu globalen Bewegungen',
				'Karte der Hoffnung in Hi-Res (druckbar)',
				'Frühzugang zu neuen Features'
			],
			transformation: 'Jeden Tag eine gute Nachricht — vertont, kuratiert, in deinem Rhythmus.',
			cta: 'Plus abonnieren',
			highlight: true,
			url: base + '/newsletter'
		},
		{
			name: 'Für Teams',
			tagline: 'Gute Nachrichten als Arbeitsumfeld',
			price: '49',
			cadence: '€ / Monat',
			note: 'pro Standort, Bildungsstätte oder Praxis',
			features: [
				'Alles aus NurEine Plus',
				'Wartezimmer- / Klassenraum-Display-Lizenz',
				'Whitelabel-Newsletter für deine Organisation',
				'API-Zugriff auf alle Inhalte & Wirkungsdaten',
				'Monatliche Auswertung zur Teammoral',
				'Persönlicher Ansprechpartner & Onboarding'
			],
			transformation: 'Schaffe ein Umfeld, das Hoffnung statt Angst verstärkt — für Patienten, Schüler und Teams.',
			cta: 'Beratung anfragen',
			highlight: false,
			url: '#b2b-form'
		}
	];

	const comparisonFeatures = [
		{ name: 'Tägliche Hauptgeschichte', free: true, plus: true, teams: true },
		{ name: 'Vollständiges Archiv', free: true, plus: true, teams: true },
		{ name: 'Karte der Hoffnung', free: 'Basis', plus: 'Hi-Res', teams: 'Hi-Res' },
		{ name: 'Audio-Version (5 Min.)', free: false, plus: true, teams: true },
		{ name: 'Sonntags-Brief (Newsletter)', free: false, plus: true, teams: true },
		{ name: 'Wöchentlicher Deep-Dive', free: false, plus: true, teams: true },
		{ name: 'Wartezimmer- / Display-Lizenz', free: false, plus: false, teams: true },
		{ name: 'Whitelabel-Newsletter', free: false, plus: false, teams: true },
		{ name: 'API-Zugriff', free: false, plus: false, teams: true },
		{ name: 'Persönlicher Support', free: false, plus: false, teams: true }
	];

	function formatCell(val: boolean | string): string {
		if (val === true) return '✓';
		if (val === false) return '—';
		return String(val);
	}

	function isHighlight(val: boolean | string): boolean {
		return val === true;
	}

	const testimonials = [
		{
			quote: 'Ich habe den Newsletter meiner Praxis aufgegeben und ersetze ihn jetzt durch den NurEine-Sonntagsbrief. Die Patienten lieben es.',
			author: 'Dr. Sabine Lorenz',
			role: 'Allgemeinmedizinerin, München'
		},
		{
			quote: 'Die Audio-Version ist mein täglicher Begleiter beim Joggen. 5 Minuten, die meinen Tag verändern. Beste 29 Euro im Jahr.',
			author: 'Markus B.',
			role: 'Abonnent seit Januar 2026'
		}
	];

	let b2bName = $state('');
	let b2bEmail = $state('');
	let b2bOrg = $state('');
	let b2bMsg = $state('');
	let b2bSent = $state(false);

	async function submitB2B(e: Event) {
		e.preventDefault();
		// Placeholder — send to admin for now
		b2bSent = true;
	}
</script>

<svelte:head>
	<title>Preise — NurEine</title>
</svelte:head>

<!-- Hero -->
<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pt-12 lg:pt-16 pb-12">
	<p class="text-[11px] uppercase tracking-[0.22em]" style="color: var(--color-amber); font-weight: 500;">
		Preise
	</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[2.4rem] lg:text-[3.6rem]"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Hoffnung ist kein Luxus.
		<br />
		<span style="color: var(--color-amber);">Sie ist die Basis.</span>
	</h1>
	<p
		class="mt-5 max-w-[55ch] text-lg leading-relaxed"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Wir glauben, dass jeder Zugang zu konstruktiven Nachrichten haben sollte — ob privat, im
		Wartezimmer oder im Klassenzimmer.
	</p>
</section>

<!-- Pricing cards -->
<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-16">
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		{#each tiers as tier}
			<div
				class="p-8 rounded-[8px] flex flex-col"
				style="
          background: {tier.highlight ? 'var(--color-ink)' : 'var(--color-paper)'};
          color: {tier.highlight ? 'var(--color-paper)' : 'var(--color-ink)'};
          border: 1px solid {tier.highlight ? 'var(--color-ink)' : 'var(--color-rule)'};
          {tier.highlight ? 'transform: scale(1.02); position: relative; z-index: 1;' : ''}
        "
			>
				{#if tier.highlight}
					<span
						class="inline-block text-[10px] uppercase tracking-[0.22em] px-3 py-1 rounded-full mb-4"
						style="background: var(--color-amber); color: var(--color-ink); font-weight: 600; width: fit-content;"
					>
						Empfohlen
					</span>
				{/if}
				<p
					class="text-[11px] uppercase tracking-[0.22em]"
					style="color: {tier.highlight ? 'var(--color-amber-soft)' : 'var(--color-amber)'}; font-weight: 500;"
				>
					{tier.name}
				</p>
				<p
					class="mt-1 text-sm"
					style="color: {tier.highlight ? 'rgba(250, 246, 238, 0.65)' : 'var(--color-muted)'};"
				>
					{tier.tagline}
				</p>

				<div class="mt-6 flex items-baseline gap-1">
					<span class="serif text-5xl" style="font-weight: 500;">{tier.price}</span>
					<span
						class="text-sm"
						style="color: {tier.highlight ? 'rgba(250, 246, 238, 0.65)' : 'var(--color-muted)'};"
					>
						{tier.cadence}
					</span>
				</div>
				{#if tier.note}
					<p
						class="mt-1 text-xs"
						style="color: {tier.highlight ? 'rgba(250, 246, 238, 0.5)' : 'var(--color-faint)'};"
					>
						{tier.note}
					</p>
				{/if}

				<p
					class="mt-5 text-sm leading-relaxed italic"
					style="color: {tier.highlight ? 'rgba(250, 246, 238, 0.8)' : 'var(--color-ink-soft)'};"
				>
					{tier.transformation}
				</p>

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

				<a
					href={tier.url}
					class="mt-8 block w-full px-5 py-3 rounded-full text-sm font-medium text-center transition-all"
					style="
            background: {tier.highlight ? 'var(--color-amber)' : 'var(--color-ink)'};
            color: var(--color-paper);
          "
				>
					{tier.cta}
				</a>
			</div>
		{/each}
	</div>
</section>

<!-- Comparison table -->
<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-20">
	<h2
		class="serif text-2xl text-center mb-10"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Was ist in welchem Plan enthalten?
	</h2>
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr style="border-bottom: 1px solid var(--color-rule);">
					<th
						class="py-3 pr-6 text-left text-xs uppercase tracking-[0.16em]"
						style="color: var(--color-faint); font-weight: 500;"
					>
						Feature
					</th>
					<th
						class="py-3 px-4 text-center text-xs uppercase tracking-[0.16em]"
						style="color: var(--color-faint); font-weight: 500;"
					>
						Browser
					</th>
					<th
						class="py-3 px-4 text-center text-xs uppercase tracking-[0.16em] rounded-t-[6px]"
						style="background: var(--color-ink); color: var(--color-paper); font-weight: 600;"
					>
						Plus ⭐
					</th>
					<th
						class="py-3 px-4 text-center text-xs uppercase tracking-[0.16em]"
						style="color: var(--color-faint); font-weight: 500;"
					>
						Teams
					</th>
				</tr>
			</thead>
			<tbody>
				{#each comparisonFeatures as feat, i}
					<tr
						style="border-bottom: 1px solid var(--color-rule);"
						class="hover:opacity-80"
					>
						<td class="py-3 pr-6" style="color: var(--color-ink);">{feat.name}</td>
						<td
							class="py-3 px-4 text-center"
							style="color: {isHighlight(feat.free) ? 'var(--color-amber)' : 'var(--color-faint)'};"
						>
							{formatCell(feat.free)}
						</td>
						<td
							class="py-3 px-4 text-center"
							style="background: rgba(38, 35, 30, 0.03); color: {isHighlight(feat.plus) ? 'var(--color-amber)' : 'var(--color-faint)'};"
						>
							{formatCell(feat.plus)}
						</td>
						<td
							class="py-3 px-4 text-center"
							style="color: {isHighlight(feat.teams) ? 'var(--color-amber)' : 'var(--color-faint)'};"
						>
							{formatCell(feat.teams)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<!-- Testimonials -->
<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-20">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		{#each testimonials as t}
			<div
				class="p-8 rounded-[8px]"
				style="border: 1px solid var(--color-rule); background: var(--color-paper);"
			>
				<blockquote>
					<p
						class="text-base leading-relaxed italic"
						style="color: var(--color-ink); font-family: var(--font-serif);"
					>
						„{t.quote}"
					</p>
				</blockquote>
				<div class="mt-6">
					<p class="text-sm font-medium" style="color: var(--color-ink);">{t.author}</p>
					<p class="text-xs mt-0.5" style="color: var(--color-muted);">{t.role}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- B2B contact -->
<section
	id="b2b-form"
	class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-20 scroll-mt-20"
>
	<div
		class="paper rounded-[8px] p-10 lg:p-16"
		style="border: 1px solid var(--color-rule);"
	>
		<p class="text-[11px] uppercase tracking-[0.22em]" style="color: var(--color-amber); font-weight: 500;">
			Für Teams & Einrichtungen
		</p>
		<h2
			class="serif text-3xl lg:text-4xl mt-3 leading-tight"
			style="color: var(--color-ink); font-weight: 500;"
		>
			Gute Nachrichten als Arbeitsumfeld
		</h2>
		<p
			class="mt-4 text-base leading-relaxed max-w-[55ch]"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			Ob Wartezimmer, Klassenraum oder Teampause — NurEine verwandelt Bildschirme in
			Hoffnungsmomente. Praxen berichten von entspannteren Patienten, Schulen von
			aufmerksameren Schülern. Sprecht mit uns über eine maßgeschneiderte Lösung.
		</p>

		{#if b2bSent}
			<div
				class="mt-8 p-4 rounded-[4px] text-sm"
				style="background: var(--color-sage); color: var(--color-paper);"
			>
				Danke für deine Anfrage. Wir melden uns innerhalb von 48 Stunden.
			</div>
		{:else}
			<form onsubmit={submitB2B} class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
				<div>
					<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">
						Name
					</label>
					<input
						type="text"
						bind:value={b2bName}
						required
						class="w-full px-4 py-2.5 rounded-[6px] text-sm"
						style="border: 1px solid var(--color-rule); background: var(--color-canvas); color: var(--color-ink);"
					/>
				</div>
				<div>
					<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">
						E-Mail
					</label>
					<input
						type="email"
						bind:value={b2bEmail}
						required
						class="w-full px-4 py-2.5 rounded-[6px] text-sm"
						style="border: 1px solid var(--color-rule); background: var(--color-canvas); color: var(--color-ink);"
					/>
				</div>
				<div class="md:col-span-2">
					<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">
						Einrichtung / Organisation
					</label>
					<input
						type="text"
						bind:value={b2bOrg}
						class="w-full px-4 py-2.5 rounded-[6px] text-sm"
						style="border: 1px solid var(--color-rule); background: var(--color-canvas); color: var(--color-ink);"
					/>
				</div>
				<div class="md:col-span-2">
					<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">
						Nachricht (optional)
					</label>
					<textarea
						bind:value={b2bMsg}
						rows="3"
						class="w-full px-4 py-2.5 rounded-[6px] text-sm"
						style="border: 1px solid var(--color-rule); background: var(--color-canvas); color: var(--color-ink);"
						placeholder="Wieviele Standorte? Display-Größe? Wunsch-Features?"
					></textarea>
				</div>
				<div class="md:col-span-2">
					<button
						type="submit"
						class="px-6 py-3 rounded-full text-sm font-medium transition-all"
						style="background: var(--color-ink); color: var(--color-paper);"
					>
						Anfrage senden
					</button>
				</div>
			</form>
		{/if}
	</div>
</section>

<!-- FAQ -->
<section class="mx-auto max-w-[1180px] px-6 lg:px-10 pb-20">
	<h2
		class="serif text-2xl text-center mb-10"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Häufige Fragen
	</h2>
	<div class="max-w-2xl mx-auto space-y-4">
		<details
			class="p-5 rounded-[6px] open:pb-6"
			style="border: 1px solid var(--color-rule); background: var(--color-paper);"
		>
			<summary class="text-sm font-medium cursor-pointer" style="color: var(--color-ink);">
				Kann ich jederzeit kündigen?
			</summary>
			<p class="mt-3 text-sm leading-relaxed" style="color: var(--color-ink-soft);">
				Ja. NurEine Plus ist ein Jahresabo und kann jederzeit zum Ende des Abrechnungszeitraums
				gekündigt werden. Keine Mindestlaufzeit, kein Ärger.
			</p>
		</details>
		<details
			class="p-5 rounded-[6px] open:pb-6"
			style="border: 1px solid var(--color-rule); background: var(--color-paper);"
		>
			<summary class="text-sm font-medium cursor-pointer" style="color: var(--color-ink);">
				Wie unterscheidet sich der kostenlose Zugang vom Plus-Abo?
			</summary>
			<p class="mt-3 text-sm leading-relaxed" style="color: var(--color-ink-soft);">
				Im Browser-Zugang siehst du täglich die aktuelle Hauptgeschichte und kannst im Archiv
				stöbern. Mit Plus bekommst du die tägliche Audio-Version (5 Min.), den Sonntags-Brief
				als Newsletter und exklusive Deep-Dives — plus die Karte der Hoffnung in Druckqualität.
			</p>
		</details>
		<details
			class="p-5 rounded-[6px] open:pb-6"
			style="border: 1px solid var(--color-rule); background: var(--color-paper);"
		>
			<summary class="text-sm font-medium cursor-pointer" style="color: var(--color-ink);">
				Ich bin Lehrerin / Arzt. Welche Lizenz brauche ich?
			</summary>
			<p class="mt-3 text-sm leading-relaxed" style="color: var(--color-ink-soft);">
				Die Team-Lizenz ist genau für euch gemacht. Sie erlaubt die Anzeige auf Bildschirmen im
				Klassenraum oder Wartezimmer, inklusive Whitelabel-Option und monatlicher Auswertung.
				Schreibt uns — wir finden die passende Lösung für eure Einrichtung.
			</p>
		</details>
		<details
			class="p-5 rounded-[6px] open:pb-6"
			style="border: 1px solid var(--color-rule); background: var(--color-paper);"
		>
			<summary class="text-sm font-medium cursor-pointer" style="color: var(--color-ink);">
				Werden meine Daten verkauft?
			</summary>
			<p class="mt-3 text-sm leading-relaxed" style="color: var(--color-ink-soft);">
				Nein. Wir verkaufen keine Daten, platzieren keine Tracking-Pixel und personalisieren keine
				Werbung. Deine E-Mail-Adresse wird ausschließlich für den von dir gewählten Dienst verwendet.
			</p>
		</details>
	</div>
</section>
