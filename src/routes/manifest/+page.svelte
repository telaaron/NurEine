<script lang="ts">
	import { base } from '$app/paths';

	const principles = [
		{
			n: '01',
			title: 'Eine Geschichte zählt mehr als zehn',
			body: 'Wir veröffentlichen täglich genau eine Hauptgeschichte. Tief erzählt, mit Quellen, mit Hintergrund. Weniger ist mehr — die Welt braucht keine weitere Schlagzeilen-Maschine.'
		},
		{
			n: '02',
			title: 'Bedeutsam, nicht bloß positiv',
			body: 'Ein Hund rettet seinen Besitzer ist nett. Eine Therapie heilt 100.000 Menschen ist bedeutsam. Unser KI-Filter trennt Sentiment von Substanz — wir suchen das Zweite.'
		},
		{
			n: '03',
			title: 'Wirkungsindex statt Klicks',
			body: 'Jede Geschichte bekommt einen Score zwischen 1 und 100, gewichtet nach: Reichweite (wie viele Menschen betroffen?), Dauerhaftigkeit (wirkt es länger als die Schlagzeile?) und Belegbarkeit (wie hart sind die Daten?).'
		},
		{
			n: '04',
			title: 'Kein Doom-Scrolling, kein Endless-Feed',
			body: 'Du wirst hier nicht stundenlang hängen. Wir bauen kein süchtig machendes Produkt. Lies, was du brauchst, schließ den Tab, leb dein Leben.'
		},
		{
			n: '05',
			title: 'Quellen offen, Auswahl transparent',
			body: 'Jede Geschichte verlinkt zur Originalquelle. Unsere Filterkriterien stehen öffentlich. Wo wir KI nutzen, sagen wir es. Wo wir uns irren, korrigieren wir öffentlich.'
		},
		{
			n: '06',
			title: 'Lokal vor global',
			body: 'Eine Mangrovenpflanzung in Kenia berührt. Eine Saatgutbörse in deinem Stadtteil verändert dein Leben. Wir gewichten Hyperlokales bewusst stärker.'
		}
	];

	const team = [
		{ role: 'Redaktion', n: 3 },
		{ role: 'Quellen-Pipeline', n: '2.847 RSS' },
		{ role: 'Region', n: 'DE / EU / Welt' },
		{ role: 'Sprache', n: 'DE' }
	];
</script>

<svelte:head>
	<title>Manifest — NurEine</title>
</svelte:head>

<section class="relative">
	<div
		class="absolute inset-0 sun-glow pointer-events-none"
		aria-hidden="true"
		style="opacity: 0.5;"
	></div>
	<div class="relative mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 pt-12 sm:pt-16 lg:pt-24 pb-12">
		<p class="text-[11px] uppercase tracking-[0.22em] rise" style="color: var(--color-amber); font-weight: 500;">
			Manifest
		</p>
		<h1
			class="serif mt-4 leading-[1.05] tracking-tight text-[1.9rem] sm:text-[2.6rem] lg:text-[5rem] rise rise-d1"
			style="color: var(--color-ink); font-weight: 500;"
		>
			Sechs Sätze, an denen wir uns messen lassen.
		</h1>
		<p
			class="mt-7 text-base sm:text-xl lg:text-2xl leading-snug max-w-[55ch] rise rise-d2"
			style="color: var(--color-ink-soft); font-family: var(--font-serif); font-style: italic;"
		>
			Nachrichten formen, wie wir die Welt sehen. Wenn ein Großteil der Berichterstattung Schmerz
			zeigt, denken wir, die Welt sei nur Schmerz. Sie ist es nicht.
		</p>
	</div>
</section>

<section class="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 pb-14 sm:pb-20">
	<ol class="space-y-10 sm:space-y-14">
		{#each principles as p, i (p.n)}
			<li class="grid grid-cols-12 gap-6 rise" style="animation-delay: {0.1 + i * 0.06}s;">
				<div class="col-span-3 sm:col-span-2">
					<span
						class="serif text-2xl sm:text-3xl tnum"
						style="color: var(--color-amber); font-weight: 400;"
					>
						{p.n}
					</span>
				</div>
				<div class="col-span-9 sm:col-span-10">
					<h2
						class="serif leading-tight tracking-tight text-xl sm:text-2xl lg:text-[2rem]"
						style="color: var(--color-ink); font-weight: 500;"
					>
						{p.title}
					</h2>
					<p
						class="mt-3 leading-relaxed text-[15px] sm:text-lg"
						style="color: var(--color-ink-soft); font-family: var(--font-serif);"
					>
						{p.body}
					</p>
				</div>
			</li>
		{/each}
	</ol>

	<!-- Methodik anchor -->
	<div
		id="methodik"
		class="mt-14 sm:mt-20 paper rounded-[8px] p-6 sm:p-10 lg:p-14"
		style="border: 1px solid var(--color-rule);"
	>
		<p class="text-[11px] uppercase tracking-[0.22em]" style="color: var(--color-amber); font-weight: 500;">
			Methodik
		</p>
		<h2 class="serif text-2xl sm:text-3xl lg:text-4xl mt-3" style="color: var(--color-ink); font-weight: 500;">
			Wie der Wirkungsindex berechnet wird
		</h2>
		<p
			class="mt-5 leading-relaxed text-base sm:text-lg max-w-[60ch]"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			Drei gewichtete Faktoren, jeweils 0–100, dann gemittelt:
		</p>
		<ul class="mt-6 space-y-4">
			<li class="flex gap-4">
				<span
					class="tnum text-sm w-12 shrink-0 pt-1"
					style="color: var(--color-amber); font-weight: 500;">×0,4</span
				>
				<div>
					<p class="serif text-lg" style="color: var(--color-ink);">Reichweite</p>
					<p class="text-sm leading-relaxed" style="color: var(--color-muted);">
						Geschätzte Anzahl Menschen, die direkt positiv beeinflusst werden — geprüft anhand
						offizieller Quellen, NGO-Reports oder peer-reviewter Studien.
					</p>
				</div>
			</li>
			<li class="flex gap-4">
				<span
					class="tnum text-sm w-12 shrink-0 pt-1"
					style="color: var(--color-amber); font-weight: 500;">×0,35</span
				>
				<div>
					<p class="serif text-lg" style="color: var(--color-ink);">Dauerhaftigkeit</p>
					<p class="text-sm leading-relaxed" style="color: var(--color-muted);">
						Hält die positive Wirkung an? Strukturveränderung wiegt schwerer als Einzelereignis.
					</p>
				</div>
			</li>
			<li class="flex gap-4">
				<span
					class="tnum text-sm w-12 shrink-0 pt-1"
					style="color: var(--color-amber); font-weight: 500;">×0,25</span
				>
				<div>
					<p class="serif text-lg" style="color: var(--color-ink);">Belegbarkeit</p>
					<p class="text-sm leading-relaxed" style="color: var(--color-muted);">
						Datenqualität der Quelle. Peer-reviewt = 100, etablierte Redaktion = 75, lokale
						Berichterstattung = 50.
					</p>
				</div>
			</li>
		</ul>
	</div>

	<div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
		{#each team as t}
			<div
				class="p-5 rounded-[6px]"
				style="border: 1px solid var(--color-rule); background: var(--color-canvas-soft);"
			>
				<p class="uppercase tracking-[0.16em] text-[11px]" style="color: var(--color-faint);">
					{t.role}
				</p>
				<p class="serif text-xl sm:text-2xl tnum mt-2" style="color: var(--color-ink);">
					{t.n}
				</p>
			</div>
		{/each}
	</div>

	<a
		href={base + '/'}
		class="mt-10 sm:mt-14 inline-flex items-center gap-2 text-sm hover:opacity-70"
		style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);"
	>
		<span aria-hidden="true">←</span> Zurück zur heutigen Geschichte
	</a>
</section>
