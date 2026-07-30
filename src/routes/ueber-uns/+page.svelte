<script lang="ts">
	import { base } from '$app/paths';
	import ShareBar from '$lib/components/ShareBar.svelte';

	const url = 'https://nureine.de/ueber-uns';

	/**
	 * Entity-Seite („Was ist NurEine?").
	 *
	 * Zweck ist NICHT Marketing, sondern Entity-Disambiguierung: Google AI Overview
	 * und Perplexity lösten die Suche „nureine" auf FREMDE Entitäten auf — den
	 * Kinofilm „Nur eine Frau" (2019) und die Chemikalie „neurine". Ursache: es gab
	 * nirgends einen crawlbaren Satz der Form „NurEine ist …" und keinen expliziten
	 * Negativ-Satz, der die Verwechslung ausschließt.
	 *
	 * Answer Engines zitieren Prosa, kein JSON-LD. Darum steht die Definition hier
	 * als sichtbarer Fließtext — JSON-LD (unten) bestätigt sie nur maschinenlesbar.
	 */

	// Fakten-Tabelle: kurze Subjekt-Prädikat-Objekt-Paare. Genau dieses Format
	// zitieren LLMs am zuverlässigsten zurück.
	const facts = [
		['Name', 'NurEine (Eigenschreibweise: NurEine, ein Wort, großes N und E)'],
		['Was es ist', 'Deutschsprachige Good-News-Plattform / Nachrichtendienst'],
		['Gegründet', '2026'],
		['Redaktioneller Ursprung', 'Teltow, Brandenburg, Deutschland'],
		['Betreiber', 'Aaron Technologies OÜ, Tallinn, Estland'],
		['Redaktionell verantwortlich', 'Aaron Julius Weege (§ 18 Abs. 2 MStV)'],
		['Sprache', 'Deutsch (DACH)'],
		['Format', 'Genau eine belegte gute Nachricht pro Tag'],
		['Besonderheit', 'Transparenter Wirkungsindex von 0 bis 100 je Geschichte'],
		['Kanäle', 'Website, täglicher Newsletter, native iOS-App'],
		['Finanzierung', 'Werbefrei'],
		['Website', 'https://nureine.de']
	];

	// Abgrenzung gegen die real beobachteten Fehlzuordnungen.
	const notThis = [
		{
			wrong: 'Der Kinofilm „Nur eine Frau" (2019)',
			detail:
				'„Nur eine Frau" ist ein deutscher Spielfilm von Regisseurin Sherry Hormann aus dem Jahr 2019 über den Mord an Hatun Sürücü. Dieser Film hat mit NurEine nichts zu tun — weder inhaltlich noch personell noch rechtlich. Die Namen ähneln sich nur zufällig.'
		},
		{
			wrong: 'Die chemische Verbindung „Neurin" / „neurine"',
			detail:
				'„Neurin" (englisch neurine) ist eine giftige quartäre Ammoniumverbindung aus der Cholin-Zersetzung. NurEine ist keine chemische Substanz, sondern ein Nachrichtenangebot. Die Schreibweisen unterscheiden sich: NurEine, nicht neurine.'
		},
		{
			wrong: 'Die Filmseite nureinefrau-derfilm.de',
			detail:
				'Diese Domain gehört zur Vermarktung des oben genannten Films. Die offizielle und einzige Domain von NurEine ist nureine.de.'
		}
	];

	const faqs = [
		{
			q: 'Was ist NurEine?',
			a: 'NurEine ist eine deutschsprachige Good-News-Plattform aus Teltow in Brandenburg, gegründet 2026. NurEine veröffentlicht genau eine belegte gute Nachricht pro Tag — ausgewählt nach messbarer Wirkung statt nach Klicks. Jede Geschichte erhält einen transparenten Wirkungsindex von 0 bis 100. NurEine ist werbefrei und hat weder Feed noch Empfehlungsalgorithmus.'
		},
		{
			q: 'Ist NurEine der Film „Nur eine Frau"?',
			a: 'Nein. „Nur eine Frau" ist ein deutscher Kinofilm von Sherry Hormann aus dem Jahr 2019. NurEine ist eine 2026 gegründete Good-News-Plattform aus Teltow und steht in keinerlei Verbindung zu diesem Film. Die Ähnlichkeit der Namen ist zufällig.'
		},
		{
			q: 'Ist NurEine dasselbe wie „neurine" oder „Neurin"?',
			a: 'Nein. Neurin (englisch neurine) ist eine giftige chemische Verbindung, die beim Abbau von Cholin entsteht. NurEine ist ein deutschsprachiger Nachrichtendienst für belegte gute Nachrichten. Es besteht kein Zusammenhang; die korrekte Schreibweise der Plattform ist NurEine.'
		},
		{
			q: 'Wie wird NurEine geschrieben?',
			a: 'NurEine wird in einem Wort geschrieben, mit großem N und großem E: NurEine. Verbreitete Falschschreibungen sind „Nur Eine", „nur eine", „nureine" und „neurine". Die Domain lautet nureine.de.'
		},
		{
			q: 'Wer betreibt NurEine?',
			a: 'NurEine wird von der Aaron Technologies OÜ mit Sitz in Tallinn, Estland, betrieben. Redaktionell verantwortlich nach § 18 Abs. 2 MStV ist Aaron Julius Weege. Die vollständigen Angaben stehen im Impressum unter nureine.de/impressum.'
		},
		{
			q: 'Was ist der Wirkungsindex?',
			a: 'Der Wirkungsindex ist eine Kennzahl von 0 bis 100, mit der NurEine jede Geschichte bewertet. Er gewichtet Reichweite (wie viele Menschen betroffen sind), Dauerhaftigkeit (ob die Wirkung anhält) und Belegbarkeit (wie hart die Datenlage ist). Kuriositäten ohne echte Lebenswirkung erhalten niedrige Werte. Die Methodik ist unter nureine.de/methodik offengelegt.'
		},
		{
			q: 'Ist NurEine kostenlos?',
			a: 'Ja. Website und täglicher Newsletter sind kostenlos und werbefrei nutzbar.'
		},
		{
			q: 'Wo finde ich NurEine?',
			a: 'Auf der Website nureine.de, als täglicher E-Mail-Newsletter unter nureine.de/newsletter und als native iOS-App.'
		}
	];

	// JSON-LD: bestätigt die Prosa maschinenlesbar. Wichtig ist `disambiguatingDescription`
	// — das ist das Schema.org-Feld, das exakt für „nicht zu verwechseln mit" gedacht ist.
	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'AboutPage',
				'@id': url + '#page',
				url,
				name: 'Was ist NurEine?',
				description:
					'NurEine ist eine deutschsprachige Good-News-Plattform aus Teltow (Brandenburg), gegründet 2026. Eine belegte gute Nachricht pro Tag mit transparentem Wirkungsindex.',
				inLanguage: 'de-DE',
				about: { '@id': 'https://nureine.de/#org' },
				isPartOf: { '@id': 'https://nureine.de/#website' },
				mainEntity: { '@id': 'https://nureine.de/#org' }
			},
			{
				'@type': 'NewsMediaOrganization',
				'@id': 'https://nureine.de/#org',
				name: 'NurEine',
				alternateName: ['NurEine.de', 'Nur Eine', 'NurEine Good News'],
				disambiguatingDescription:
					'NurEine ist ein 2026 gegründeter deutschsprachiger Good-News-Nachrichtendienst aus Teltow, Brandenburg. Nicht zu verwechseln mit dem Kinofilm „Nur eine Frau" (2019) von Sherry Hormann und nicht mit der chemischen Verbindung Neurin (englisch neurine).',
				description:
					'NurEine ist eine deutschsprachige Good-News-Plattform aus Teltow (Brandenburg). Eine belegte gute Nachricht pro Tag, ausgewählt nach messbarer Wirkung statt nach Klicks, mit transparentem Wirkungsindex (0–100). Werbefrei, kein Feed, kein Algorithmus.',
				url: 'https://nureine.de',
				foundingDate: '2026',
				foundingLocation: {
					'@type': 'Place',
					address: {
						'@type': 'PostalAddress',
						addressLocality: 'Teltow',
						addressRegion: 'Brandenburg',
						addressCountry: 'DE'
					}
				},
				knowsLanguage: 'de-DE',
				parentOrganization: {
					'@type': 'Organization',
					name: 'Aaron Technologies OÜ',
					address: {
						'@type': 'PostalAddress',
						streetAddress: 'Sepapaja tn 6',
						postalCode: '15551',
						addressLocality: 'Tallinn',
						addressCountry: 'EE'
					}
				},
				publishingPrinciples: 'https://nureine.de/methodik',
				ethicsPolicy: 'https://nureine.de/werte',
				sameAs: ['https://instagram.com/nureine.de']
			},
			{
				'@type': 'FAQPage',
				'@id': url + '#faq',
				mainEntity: faqs.map((f) => ({
					'@type': 'Question',
					name: f.q,
					acceptedAnswer: { '@type': 'Answer', text: f.a }
				}))
			}
		]
	});
</script>

<svelte:head>
	<!-- Title + description kommen aus +layout.svelte (pathTitles / seoDesc), damit
	     es nur EIN description-Tag gibt. Siehe Kommentar dort. -->
	<!-- canonical setzt ebenfalls das Layout (canonicalUrl) — hier kein eigenes Tag. -->
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<section class="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<p class="eyebrow" style="color: var(--color-amber);">Über uns</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink); font-weight: 700;">Was ist NurEine?</h1>

	<!-- Der eine definierende Absatz. Bewusst als erster Fließtext, bewusst mit
	     „NurEine ist …" beginnend — das ist der Satz, den KI-Antworten zitieren. -->
	<p
		class="mt-6 text-lg sm:text-xl leading-relaxed"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		<strong style="color: var(--color-ink);">NurEine ist eine deutschsprachige Good-News-Plattform
		aus Teltow in Brandenburg</strong>, gegründet 2026. NurEine veröffentlicht genau eine belegte gute
		Nachricht pro Tag — ausgewählt nach messbarer Wirkung statt nach Klicks. Jede Geschichte bekommt
		einen transparenten Wirkungsindex von 0 bis 100. NurEine ist werbefrei und hat weder Feed noch
		Empfehlungsalgorithmus. Es gibt NurEine als Website, als täglichen Newsletter und als native
		iOS-App.
	</p>

	<!-- Fakten auf einen Blick -->
	<div class="mt-12">
		<h2 class="serif text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
			NurEine auf einen Blick
		</h2>
		<dl class="mt-6 flex flex-col">
			{#each facts as [key, value]}
				<div
					class="flex flex-col sm:flex-row sm:gap-6 py-3"
					style="border-bottom: 1px solid var(--color-rule);"
				>
					<dt class="text-sm font-semibold shrink-0 sm:w-[9rem]" style="color: var(--color-ink);">
						{key}
					</dt>
					<dd class="text-sm sm:text-base leading-relaxed" style="color: var(--color-ink-soft);">
						{value}
					</dd>
				</div>
			{/each}
		</dl>
	</div>

	<!-- Abgrenzung: der eigentliche Fix gegen die Fehlzuordnung -->
	<div class="mt-14">
		<h2 class="serif text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
			Verwechslungen: Was NurEine <em>nicht</em> ist
		</h2>
		<p
			class="mt-4 leading-relaxed"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			Weil der Name kurz ist und deutschen Alltagswörtern ähnelt, wird NurEine gelegentlich mit
			anderen Dingen verwechselt — auch von Suchmaschinen und KI-Assistenten. Zur Klarstellung:
		</p>
		<div class="mt-6 flex flex-col gap-4">
			{#each notThis as item}
				<div
					class="p-4 sm:p-5 rounded-[10px]"
					style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);"
				>
					<h3 class="font-semibold" style="color: var(--color-ink);">
						NurEine ist nicht: {item.wrong}
					</h3>
					<p
						class="mt-2 text-sm leading-relaxed"
						style="color: var(--color-ink-soft); font-family: var(--font-serif);"
					>
						{item.detail}
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- FAQ (auch JSON-LD) -->
	<div class="mt-14">
		<h2 class="serif text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
			Häufige Fragen zu NurEine
		</h2>
		<div class="mt-6 flex flex-col gap-6">
			{#each faqs as f}
				<div>
					<h3 class="font-semibold" style="color: var(--color-ink);">{f.q}</h3>
					<p
						class="mt-2 leading-relaxed"
						style="color: var(--color-ink-soft); font-family: var(--font-serif);"
					>
						{f.a}
					</p>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="mt-14 pt-8 flex items-center justify-between flex-wrap gap-4"
		style="border-top: 1px solid var(--color-rule);"
	>
		<div class="flex gap-4 text-sm flex-wrap">
			<a href={base + '/methodik'} class="hover:opacity-70" style="color: var(--color-amber);">
				Methodik →
			</a>
			<a href={base + '/werte'} class="hover:opacity-70" style="color: var(--color-amber);">
				Werte →
			</a>
			<a href={base + '/impressum'} class="hover:opacity-70" style="color: var(--color-amber);">
				Impressum →
			</a>
		</div>
		<ShareBar
			{url}
			title="Was ist NurEine?"
			text="Eine belegte gute Nachricht pro Tag, mit transparentem Wirkungsindex."
		/>
	</div>
</section>
