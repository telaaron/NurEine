<script lang="ts">
	import { base } from '$app/paths';
	import ShareBar from '$lib/components/ShareBar.svelte';

	const url = 'https://nureine.de/methodik';

	const factors = [
		{
			w: '40 %',
			name: 'Reichweite',
			q: 'Wie viele Menschen werden messbar positiv beeinflusst?',
			detail:
				'Geschätzte direkt betroffene Personen — belegt durch offizielle Quellen, NGO-Reports oder peer-reviewte Studien. Eine Therapie für 100.000 wiegt schwerer als ein lokaler Einzelfall.'
		},
		{
			w: '35 %',
			name: 'Dauerhaftigkeit',
			q: 'Hält die positive Wirkung an?',
			detail:
				'Strukturelle Veränderung (Gesetz, Infrastruktur, Heilung) zählt mehr als ein einmaliges Ereignis. Wir fragen: wirkt es noch in einem Jahr?'
		},
		{
			w: '25 %',
			name: 'Belegbarkeit',
			q: 'Wie hart sind die Daten?',
			detail:
				'Datenqualität der Quelle. Peer-reviewt = 100, etablierte Redaktion = 75, lokale Berichterstattung = 50. Niedrige Belegbarkeit deckelt den Gesamtwert.'
		}
	];
</script>

<svelte:head>
	<title>Methodik — Wie der Wirkungsindex funktioniert — NurEine</title>
	<meta
		name="description"
		content="Vollständig offengelegt: Quellen, Gewichtungen und Grenzen des NurEine-Wirkungsindex. Keine Blackbox. Prüf uns nach."
	/>
</svelte:head>

<section class="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Methodik · offengelegt</span>
	<h1 class="display mt-4 text-3xl sm:text-4xl lg:text-5xl leading-[1.02]" style="color: var(--color-ink); font-weight: 600;">
		Keine Blackbox. Prüf uns nach.
	</h1>
	<p class="mt-5 text-lg leading-[1.5] max-w-[52ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		Jede Geschichte bei NurEine bekommt einen <strong>Wirkungsindex</strong> zwischen 1 und 100.
		Hier steht vollständig, wie er zustande kommt — Quellen, Gewichtungen und wo er an Grenzen
		stößt. Wenn du skeptisch bist: gut. Lies weiter.
	</p>

	<!-- Formula -->
	<div class="mt-10 p-6 sm:p-8 rounded-2xl text-center" style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
		<p style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--color-ink-soft); line-height: 1.8;">
			Wirkung = <span style="color: var(--color-amber);">0,40</span>·Reichweite
			+ <span style="color: var(--color-amber);">0,35</span>·Dauerhaftigkeit
			+ <span style="color: var(--color-amber);">0,25</span>·Belegbarkeit
		</p>
	</div>

	<!-- Factors -->
	<div class="mt-10 space-y-px" style="background: var(--color-rule);">
		{#each factors as f}
			<div class="grid sm:grid-cols-[90px_minmax(0,1fr)] gap-3 sm:gap-6 p-6 sm:p-7" style="background: var(--color-canvas);">
				<div class="display text-2xl sm:text-3xl tnum" style="color: var(--color-amber); font-weight: 600;">{f.w}</div>
				<div>
					<h2 class="display text-lg sm:text-xl" style="color: var(--color-ink); font-weight: 600;">{f.name}</h2>
					<p class="mt-1 text-sm italic" style="color: var(--color-muted); font-family: var(--font-serif);">{f.q}</p>
					<p class="mt-2 text-base leading-relaxed max-w-[56ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{f.detail}</p>
				</div>
			</div>
		{/each}
	</div>

	<!-- Sources -->
	<div class="mt-12">
		<h2 class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">Woher wir filtern</h2>
		<p class="mt-3 text-base leading-relaxed max-w-[58ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Wir durchsuchen täglich tausende RSS-Quellen — darunter Reuters, Nature, WHO, Mongabay,
			Good News Network, Positive.News und lokale Redaktionen. Eine KI (DeepSeek) hilft beim
			Vor-Sortieren nach Substanz statt Sentiment. Die finale Bewertung folgt der obigen Formel.
			Jede veröffentlichte Geschichte verlinkt auf ihre Originalquelle.
		</p>
	</div>

	<!-- Honesty layer -->
	<div class="mt-12 p-6 sm:p-8 rounded-2xl" style="background: var(--color-canvas-soft); border-left: 3px solid var(--color-amber);">
		<h2 class="display text-xl sm:text-2xl" style="color: var(--color-ink); font-weight: 600;">Wo der Index an Grenzen stößt</h2>
		<ul class="mt-4 space-y-3 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			<li>· <strong>Schätzungen bleiben Schätzungen.</strong> „Reichweite" ist oft eine Bandbreite, kein exakter Wert.</li>
			<li>· <strong>Positiv ≠ unkritisch.</strong> Wir zeigen Fortschritt, nicht die Gesamtlage. Manche Metriken verschlechtern sich — CO₂, Artenvielfalt, Ungleichheit. Für das vollständige Bild empfehlen wir <a href="https://ourworldindata.org" target="_blank" rel="noreferrer" style="color: var(--color-amber); border-bottom: 1px solid var(--color-rule-strong);">Our World in Data</a>.</li>
			<li>· <strong>KI kann irren.</strong> Wo wir KI nutzen, sagen wir es. Wo wir uns irren, korrigieren wir öffentlich.</li>
			<li>· <strong>Auswahl ist Haltung.</strong> Welche Quellen, welche Gewichtung — das ist eine redaktionelle Entscheidung, keine objektive Wahrheit. Wir legen sie offen, damit du sie beurteilen kannst.</li>
		</ul>
	</div>

	<div class="mt-10 text-center">
		<p class="serif text-sm sm:text-base italic" style="color: var(--color-muted);">Transparenz teilen</p>
		<div class="mt-3 flex items-center justify-center">
			<ShareBar {url} title="Methodik — NurEine Wirkungsindex" text="Quellen, Gewichtungen, Grenzen — vollständig offengelegt. Keine Blackbox." size={20} />
		</div>
	</div>

	<a href={base + '/'} class="mt-10 inline-flex items-center gap-2 text-sm hover:opacity-70" style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);">
		<span aria-hidden="true">←</span> Zur heutigen Geschichte
	</a>
</section>
