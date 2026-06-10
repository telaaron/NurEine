<script lang="ts">
	import { base } from '$app/paths';
	import ShareBar from '$lib/components/ShareBar.svelte';

	const url = 'https://nureine.de/werte';

	// Die sieben universellen Fortschritts-Bereiche (Human-Flourishing-Fundament).
	const areas = [
		{ name: 'Gesundheit', what: 'Weniger Krankheit, längeres gutes Leben.', why: 'Kein Mensch will krank sein.' },
		{ name: 'Bildung', what: 'Mehr Menschen mit Zugang zu Wissen & Fähigkeiten.', why: 'Wissen ist keine Ideologie.' },
		{ name: 'Ökologie', what: 'Intakte natürliche Lebensgrundlagen — Luft, Wasser, Boden, Arten.', why: 'Saubere Umwelt betrifft jeden.' },
		{ name: 'Sicherheit', what: 'Weniger Gewalt, Hunger, Armut, Gefahr.', why: 'Niemand will in Gefahr leben.' },
		{ name: 'Gemeinschaft', what: 'Stärkerer Zusammenhalt, Vertrauen, weniger Einsamkeit.', why: 'Einsamkeit schadet allen.' },
		{ name: 'Innovation', what: 'Lösungen, die das Leben leichter und besser machen.', why: 'Fortschritt ist parteilos.' },
		{ name: 'Selbstbestimmung', what: 'Mehr Menschen können ihr Leben selbst gestalten.', why: 'Freiheit ist kein linkes oder rechtes Konzept.' }
	];

	// FAQ — auch als JSON-LD (FAQPage) für Suchmaschinen + KI-Antworten.
	const faqs = [
		{
			q: 'Ist NurEine politisch neutral?',
			a: 'Nein — „neutral" wäre eine Illusion, denn jede Auswahl ist eine Wertentscheidung. NurEine hat eine klare, transparente Position: Fortschritt heißt, dass Menschen gesünder, sicherer, freier und verbundener leben. Das ist keine links/rechts-Frage, sondern ein Ziel, dem alle zustimmen können.'
		},
		{
			q: 'Woran misst NurEine, ob etwas „gute Nachricht" ist?',
			a: 'An sieben universellen Bereichen menschlichen Aufblühens: Gesundheit, Bildung, Ökologie, Sicherheit, Gemeinschaft, Innovation und Selbstbestimmung. Eine Story ist für uns gut, wenn sie in einem dieser Bereiche echten Fortschritt zeigt. Diese Bereiche stammen aus der internationalen Human-Flourishing-Forschung (u. a. OECD Better Life Index).'
		},
		{
			q: 'Bevorzugt NurEine eine politische Partei oder Regierung?',
			a: 'Nein. Wir urteilen nicht über die Mittel — ob ein Fortschritt durch staatliche oder private Initiative entstand, ist nicht unsere Frage. Wir schreiben nie „Regierung X hat…", sondern „In Y ist Folgendes passiert…". Stories, die primär eine politische Seite gut oder schlecht aussehen lassen, nehmen wir nicht auf.'
		},
		{
			q: 'Ist NurEine Aktivismus?',
			a: 'Nein. Wir berichten über Fortschritt, wir fordern ihn nicht. Keine Appelle, keine Imperative. Wir zeigen, was sich zum Besseren verändert hat — die Schlüsse zieht jede Leserin selbst.'
		},
		{
			q: 'Wie entscheidet NurEine, welche Geschichten wichtig sind?',
			a: 'Über den Wirkungsindex (0–100): Er misst, wie sehr eine Nachricht konkret das Leben verbessert — gewichtet nach Reichweite (wie viele Menschen betroffen sind), Dauerhaftigkeit (ob die Wirkung anhält) und Belegbarkeit (wie hart die Daten sind). Reine Kuriositäten ohne Lebenswirkung werden niedrig bewertet, auch wenn sie gut belegt sind.'
		},
		{
			q: 'Woher kommen die Nachrichten?',
			a: 'NurEine monitort Primärquellen direkt — offizielle Statistiken, Forschungspublikationen, Register, Fachquellen — statt nur den Medien-Lärm zu wiederholen. Jede Geschichte zeigt transparent, welcher thematische Beat sie gefunden hat und welcher Quellentyp sie belegt.'
		}
	];

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a }
		}))
	});
</script>

<svelte:head>
	<title>Unsere Werte — Woran NurEine Fortschritt misst</title>
	<meta name="description" content="NurEine misst Fortschritt daran, ob Menschen gesünder, sicherer, freier und verbundener leben. Sieben universelle Bereiche, kein Partei-Framing, kein Aktivismus — transparent offengelegt." />
	<link rel="canonical" href={url} />
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<section class="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<p class="eyebrow" style="color: var(--color-amber);">Unsere Werte</p>
	<h1 class="serif page-h1 mt-3" style="color: var(--color-ink); font-weight: 500;">
		Woran wir Fortschritt messen.
	</h1>

	<p class="mt-6 text-lg sm:text-xl leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		„NurEine misst Fortschritt daran, ob Menschen gesünder, sicherer, freier und verbundener
		leben. Das ist keine politische Position — das ist das Ziel, auf das sich alle einigen können."
	</p>

	<!-- Das Fundament -->
	<div class="mt-12">
		<h2 class="serif text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
			Sieben Bereiche menschlichen Aufblühens
		</h2>
		<p class="mt-4 leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			„Politisch neutral" ist eine Illusion — jede Auswahl ist eine Wertentscheidung. Statt so zu
			tun, als hätten wir keine Position, legen wir sie offen. Wir bewerten jede Geschichte durch
			die Linse von sieben Bereichen, in denen Fortschritt universell erkennbar ist. Sie stammen
			aus der internationalen Forschung zu menschlichem Aufblühen (u. a. OECD Better Life Index,
			Gross National Happiness). Ein Konservativer bejaht Gemeinschaft, Sicherheit, Tradition. Ein
			Progressiver bejaht Gleichstellung, Ökologie, Teilhabe. Beide wollen, dass Menschen gut leben.
		</p>

		<div class="mt-8 flex flex-col gap-3">
			{#each areas as a, i}
				<div class="flex gap-4 p-4 sm:p-5 rounded-[10px]" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
					<div class="serif tnum text-xl shrink-0" style="color: var(--color-amber); width: 1.6rem;">{i + 1}</div>
					<div>
						<h3 class="font-semibold" style="color: var(--color-ink);">{a.name}</h3>
						<p class="mt-1 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{a.what}</p>
						<p class="mt-1 text-xs" style="color: var(--color-muted);">Überparteilich, weil: {a.why}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Was wir NICHT tun -->
	<div class="mt-14">
		<h2 class="serif text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
			Was wir bewusst nicht tun
		</h2>
		<ul class="mt-5 flex flex-col gap-3">
			{#each [
				['Kein Urteil über die Mittel', 'Ob ein Fortschritt staatlich oder privat entstand, ist nicht unsere Frage.'],
				['Kein Partei-Framing', 'Nie „Regierung X hat…", sondern „In Y ist Folgendes passiert…".'],
				['Kein Aktivismus', 'Wir berichten über Fortschritt, wir fordern ihn nicht.'],
				['Keine falsche Ausgewogenheit', 'Wenn die Faktenlage klar ist, ist künstliches „andererseits" keine Tugend.']
			] as [title, body]}
				<li class="flex gap-3">
					<span class="shrink-0 mt-1" style="color: var(--color-amber);">—</span>
					<span><strong style="color: var(--color-ink);">{title}.</strong> <span style="color: var(--color-ink-soft);">{body}</span></span>
				</li>
			{/each}
		</ul>
	</div>

	<!-- FAQ (auch JSON-LD) -->
	<div class="mt-14">
		<h2 class="serif text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
			Häufige Fragen
		</h2>
		<div class="mt-6 flex flex-col gap-6">
			{#each faqs as f}
				<div>
					<h3 class="font-semibold" style="color: var(--color-ink);">{f.q}</h3>
					<p class="mt-2 leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{f.a}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-14 pt-8 flex items-center justify-between" style="border-top: 1px solid var(--color-rule);">
		<div class="flex gap-4 text-sm">
			<a href={base + '/methodik'} class="hover:opacity-70" style="color: var(--color-amber);">Methodik →</a>
			<a href={base + '/manifest'} class="hover:opacity-70" style="color: var(--color-amber);">Manifest →</a>
		</div>
		<ShareBar {url} title="Woran NurEine Fortschritt misst" text="Sieben Bereiche menschlichen Aufblühens — kein Partei-Framing, kein Aktivismus." />
	</div>
</section>
