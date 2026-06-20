<script lang="ts">
	const url = 'https://nureine.de/impressum';
</script>

<svelte:head>
	<title>Impressum — NurEine</title>
	<meta name="description" content="Impressum und Anbieterkennzeichnung von NurEine." />
	<link rel="canonical" href={url} />
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20 prose-nureine">
	<p class="eyebrow" style="color: var(--color-amber);">Rechtliches</p>
	<h1 class="serif page-h1 mt-3" style="color: var(--color-ink); font-weight: 500;">Impressum</h1>

	<div class="mt-8 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</h2>
		<p class="mt-3">
			Aaron Technologies OÜ (Osaühing, estnische GmbH)<br />
			Sepapaja tn 6<br />
			15551 Tallinn, Harju maakond, Estland<br />
			Registrikood (Handelsregister-Nr.): 17336129<br />
			Eingetragen im estnischen Unternehmensregister am 26.09.2025<br />
			Tätigkeit: Programmierung (EMTAK 62101)
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">Vertreten durch</h2>
		<p class="mt-3">Aaron Julius Weege</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">Kontakt</h2>
		<p class="mt-3">
			E-Mail: <a href="mailto:admin@must-seen.com" style="color: var(--color-amber);">admin@must-seen.com</a>
			<!-- TODO Aaron: ggf. eigene NurEine-Kontaktadresse + Telefon -->
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">Umsatzsteuer-ID</h2>
		<p class="mt-3">
			USt-IdNr. gemäß § 27a UStG: EE102955587
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">Redaktionell verantwortlich (§ 18 Abs. 2 MStV)</h2>
		<p class="mt-3">
			Aaron Julius Weege, Anschrift wie oben.<br />
			NurEine veröffentlicht KI-recherchierte und -verfasste Beiträge; die redaktionelle
			Verantwortung trägt ein Mensch. Mehr dazu unter
			<a href="/methodik" style="color: var(--color-amber);">/methodik</a> und
			<a href="/redaktion" style="color: var(--color-amber);">/redaktion</a>.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">EU-Streitschlichtung</h2>
		<p class="mt-3">
			Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
			<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener" style="color: var(--color-amber);">https://ec.europa.eu/consumers/odr/</a>.
			Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
			Verbraucherschlichtungsstelle teilzunehmen.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">Haftung für Inhalte</h2>
		<p class="mt-3">
			Die Inhalte werden mit größter Sorgfalt erstellt und auf Primärquellen gestützt. Für die
			Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr
			übernehmen. Jede Geschichte verweist auf ihre Originalquelle.
		</p>

		<p class="mt-10 text-sm" style="color: var(--color-muted);">
			Stand: Juni 2026. Hinweis: Dieses Impressum ist ein sorgfältig erstelltes Gerüst, ersetzt
			aber keine individuelle Rechtsberatung.
		</p>
	</div>
</section>
