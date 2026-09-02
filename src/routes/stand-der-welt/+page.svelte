<script lang="ts">
	import { base } from '$app/paths';
	import ShareBar from '$lib/components/ShareBar.svelte';

	type Bereich = { label: string; werte: number[] };
	type Indikator = {
		id: string; label: string; bereich: string; einheit: string; code: string;
		satz: string; nachkomma: number; teiler: number;
		wert: number; wert_start: number; jahr: number; jahr_start: number;
		besser: boolean; norm: number[];
	};
	type IndexData = {
		spec_version: string; fenster: number[]; jahre: number[];
		index: number[]; kernreihe: number[];
		bereiche: Record<string, Bereich>; indikatoren: Indikator[];
		pflicht_hinweis: string | null; kipppunkt: number | null;
		gleichgewicht: number; robustheitsquote: number; quellen: string[];
	};

	let { data } = $props();
	const D = data.index as IndexData;

	const jahre = D.jahre;
	const startJahr = jahre[0];
	const endJahr = jahre[jahre.length - 1];
	const wert = D.index[D.index.length - 1];
	const wertStart = D.index[0];
	const delta = wert - wertStart;

	// Deutsche Zahlen — nie mit Punkt als Dezimaltrenner.
	const de = (n: number, k = 1) =>
		n.toLocaleString('de-DE', { minimumFractionDigits: k, maximumFractionDigits: k });

	// Bereiche nach Veraenderung sortiert: was am staerksten steigt zuerst,
	// was faellt zuletzt. Kein Wegsortieren des Unangenehmen — es steht in
	// derselben Liste, nur am Ende.
	const bereiche = Object.entries(D.bereiche)
		.map(([key, b]) => ({
			key,
			label: b.label,
			wert: b.werte[b.werte.length - 1],
			start: b.werte[0],
			delta: b.werte[b.werte.length - 1] - b.werte[0],
			werte: b.werte
		}))
		.sort((a, b) => b.delta - a.delta);

	const steigend = bereiche.filter((b) => b.delta > 0).length;
	const fallend = bereiche.length - steigend;
	const best = bereiche[0];
	const worst = bereiche[bereiche.length - 1];

	const proIndikator = (key: string) => D.indikatoren.filter((i) => i.bereich === key);

	function klartext(i: Indikator): string {
		const v = i.wert / (i.teiler ?? 1);
		return i.satz.replace('{v}', de(v, i.nachkomma));
	}

	/** SVG-Pfad. WICHTIG: nicht gespiegelt — hoch ist immer besser, auch wenn
	 *  ein Bereich dadurch sichtbar faellt. Die alte Fassung spiegelte fallende
	 *  Reihen, sodass Oekologie nicht fallend aussehen konnte. */
	function pfad(werte: number[], w: number, h: number, pad = 2): string {
		if (werte.length < 2) return '';
		const min = Math.min(...werte), max = Math.max(...werte), spanne = max - min || 1;
		return werte
			.map((v, i) => {
				const x = pad + (i / (werte.length - 1)) * (w - 2 * pad);
				const y = h - pad - ((v - min) / spanne) * (h - 2 * pad);
				return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}
	function flaeche(werte: number[], w: number, h: number, pad = 2): string {
		const p = pfad(werte, w, h, pad);
		return p ? `${p} L${w - pad},${h} L${pad},${h} Z` : '';
	}

	const kipppunktProzent = D.kipppunkt ? Math.round(D.kipppunkt * 100) : null;
	const gleichProzent = Math.round(D.gleichgewicht * 100);
</script>

<svelte:head>
	<title>Der Stand der Welt — {de(wert)} von 100 — NurEine</title>
	<!-- description: zentral in +layout.svelte (pathDescriptions) -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: 'Der Langzeitindex — Stand der Welt',
		description: `Ein Index aus ${D.indikatoren.length} Messreihen in ${bereiche.length} Bereichen, ${startJahr}–${endJahr}. Misst den Abstand zu Zielmarken, die Staaten und Wissenschaft gesetzt haben.`,
		temporalCoverage: `${startJahr}/${endJahr}`,
		license: 'https://nureine.de/methodik',
		creator: { '@type': 'Organization', name: 'NurEine' },
		isBasedOn: D.quellen
	})}<\/script>`}
</svelte:head>

<section class="mx-auto max-w-[940px] px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
	<!-- ══ Die Zahl ══ -->
	<header class="text-center">
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);"
			>Der Stand der Welt</span
		>
		<div class="big-number" aria-label="Langzeitindex: {de(wert)} von 100">{de(wert)}</div>
		<div class="of">von 100 · Datenstand {endJahr}</div>
		<p class="claim">
			Wie weit die Welt auf dem Weg zu Zielen ist, die Staaten und Wissenschaft gesetzt haben —
			nicht zu unseren.
		</p>

		<!-- Skala: gibt der Zahl Kontext, ohne einen Satz zu brauchen -->
		<div class="scale">
			<div class="scale-bar">
				<div class="scale-fill" style="width: {wert}%"></div>
			</div>
			<div class="scale-pins">
				<div class="pin edge-left" style="left: 0%">
					<i></i><b>0</b><span>nichts erreicht</span>
				</div>
				<!-- Start und Heute liegen dicht beieinander (die Zahl bewegt sich langsam).
				     Deshalb sitzt der Startwert tiefer, sonst überlappen die Beschriftungen. -->
				<div class="pin past" style="left: {wertStart}%">
					<i></i><b>{de(wertStart, 0)}</b><span>{startJahr}</span>
				</div>
				<div class="pin now" style="left: {wert}%">
					<i></i><b>{de(wert)}</b><span>heute</span>
				</div>
				<div class="pin edge-right" style="left: 100%">
					<i></i><b>100</b><span>Ziele erreicht</span>
				</div>
			</div>
		</div>

		<!-- Verlauf -->
		<div class="trend">
			<svg viewBox="0 0 620 88" preserveAspectRatio="none"
				aria-label="Verlauf des Index von {startJahr} bis {endJahr}">
				<defs>
					<linearGradient id="verlauf" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="var(--color-amber)" stop-opacity="0.2" />
						<stop offset="100%" stop-color="var(--color-amber)" stop-opacity="0" />
					</linearGradient>
				</defs>
				<path d={flaeche(D.index, 620, 88, 6)} fill="url(#verlauf)" />
				<path d={pfad(D.index, 620, 88, 6)} fill="none" stroke="var(--color-amber)"
					stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
					vector-effect="non-scaling-stroke" />
			</svg>
			<div class="trend-labels">
				<span>{startJahr}</span><span>{jahre[Math.floor(jahre.length / 2)]}</span><span>{endJahr}</span>
			</div>
		</div>
	</header>

	<!-- ══ Woraus die Zahl besteht ══ -->
	<section class="stack">
		<h2 class="section-head">Woraus die Zahl besteht</h2>
		<div class="bars">
			{#each bereiche as b (b.key)}
				<div class="bar-row">
					<span class="bar-name">{b.label}</span>
					<div class="bar-track">
						<div class="bar-fill"
							style="width: {b.wert}%;
								background: {b.delta >= 0 ? 'var(--color-sage-tint)' : 'var(--color-rose-tint)'};
								border-right: 2px solid {b.delta >= 0 ? 'var(--color-sage)' : 'var(--color-rose)'}"
						></div>
						<div class="bar-mark" style="left: {b.start}%" title="Stand {startJahr}"></div>
					</div>
					<span class="bar-value">{de(b.wert, 0)}</span>
				</div>
			{/each}
		</div>
		<div class="legend">
			<span><i style="background: var(--color-sage)"></i>besser als {startJahr}</span>
			<span><i style="background: var(--color-rose)"></i>schlechter als {startJahr}</span>
			<span><i class="tick"></i>Stand {startJahr}</span>
		</div>
	</section>

	<!-- ══ Der Kipppunkt — Pflichtangabe, nie ohne die Zahl ══ -->
	{#if D.pflicht_hinweis && kipppunktProzent}
		<aside class="kipppunkt">
			<span class="eyebrow" style="font-family: var(--font-mono); color: var(--color-muted);"
				>Was diese Zahl nicht trägt</span
			>
			<p>
				Ab <strong>{kipppunktProzent} % Gewicht auf Ökologie</strong> fällt diese Zahl, statt zu
				steigen. Wir gewichten jeden der {bereiche.length} Bereiche mit {gleichProzent} %.
				Belastbar ist deshalb nur: <em>Bei Gleichgewichtung steigt sie.</em>
				<a href="{base}/methodik">Wie wir rechnen</a>
			</p>
		</aside>
	{/if}

	<!-- ══ Schlagzeile aus den Daten ══ -->
	<section class="lead">
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);"
			>Was die Zahl erzählt</span
		>
		<h1>
			{steigend} Bereiche steigen.
			{fallend === 1 ? 'Einer fällt.' : `${fallend} fallen.`}
		</h1>
		<p>
			Seit {startJahr} ist die Zahl um {de(Math.abs(delta))} Punkte
			{delta >= 0 ? 'gestiegen' : 'gefallen'}. Am stärksten verbessert hat sich
			{best.label} ({de(best.delta)} Punkte).
			{worst.label} ist im selben Zeitraum um {de(Math.abs(worst.delta))} Punkte
			{worst.delta < 0 ? 'gefallen' : 'gestiegen'} und dämpft die Gesamtzahl — beim geometrischen
			Mittel lässt sich ein einbrechender Bereich nicht wegrechnen.
		</p>
	</section>

	<!-- ══ Die Bereiche ══ -->
	<section style="margin-top: 2.75rem">
		<h2 class="section-head">Die {bereiche.length} Bereiche</h2>
		<div class="grid">
			{#each bereiche as b (b.key)}
				{@const auf = b.delta >= 0}
				<article class="card" class:up={auf} class:down={!auf}>
					<div class="card-head">
						<div>
							<div class="card-name">{b.label}</div>
							<div class="card-delta">
								{auf ? '▲' : '▼'}
								{de(Math.abs(b.delta))} seit {startJahr}
							</div>
						</div>
						<div class="card-score">{de(b.wert)}</div>
					</div>
					<svg class="card-spark" viewBox="0 0 240 38" preserveAspectRatio="none" aria-hidden="true">
						<path d={flaeche(b.werte, 240, 38)}
							fill={auf ? 'var(--color-sage)' : 'var(--color-rose)'} opacity="0.12" />
						<path d={pfad(b.werte, 240, 38)} fill="none"
							stroke={auf ? 'var(--color-sage)' : 'var(--color-rose)'}
							stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
							vector-effect="non-scaling-stroke" />
					</svg>
					<ul class="facts">
						{#each proIndikator(b.key) as ind (ind.id)}
							<li class="fact" class:good={ind.besser} class:bad={!ind.besser}>
								<span class="dot"></span><span>{klartext(ind)}</span>
							</li>
						{/each}
					</ul>
					<div class="card-foot">
						{proIndikator(b.key).length} Messreihen · Stand {endJahr}
					</div>
				</article>
			{/each}
		</div>
	</section>

	<!-- ══ Alle Reihen ══ -->
	<section style="margin-top: 2.75rem">
		<h2 class="section-head">Alle {D.indikatoren.length} Messreihen</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Messreihe</th><th>Bereich</th>
						<th style="text-align:right">{endJahr}</th>
						<th style="text-align:right">{startJahr}</th>
						<th>Verlauf</th><th>Richtung</th>
					</tr>
				</thead>
				<tbody>
					{#each D.indikatoren as ind (ind.id)}
						{@const t = ind.teiler ?? 1}
						<tr>
							<td>
								{ind.label}
								<div class="unit">{ind.einheit}</div>
							</td>
							<td class="dim">{D.bereiche[ind.bereich].label}</td>
							<td class="num">{de(ind.wert / t, ind.nachkomma)}</td>
							<td class="num dim">{de(ind.wert_start / t, ind.nachkomma)}</td>
							<td style="width:110px">
								<svg viewBox="0 0 110 26" preserveAspectRatio="none" aria-hidden="true"
									style="width:110px;height:26px;display:block">
									<path d={pfad(ind.norm, 110, 26)} fill="none"
										stroke={ind.besser ? 'var(--color-sage)' : 'var(--color-rose)'}
										stroke-width="1.6" stroke-linecap="round"
										vector-effect="non-scaling-stroke" />
								</svg>
							</td>
							<td>
								<span class="pill" class:good={ind.besser} class:bad={!ind.besser}>
									{ind.besser ? 'besser' : 'schlechter'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- ══ Was die Zahl nicht kann ══ -->
	<section class="grenzen">
		<h2 class="section-head">Was diese Zahl nicht kann</h2>
		<ul>
			<li>
				<strong>Sie kann steigen, während es der Mehrheit schlechter geht.</strong>
				Ein Weltwert ist ein Mittelwert. Die Armut fiel weltweit um 29 Punkte — in Ostasien um
				54, in Subsahara-Afrika um 19. Der Weltwert beschreibt keine einzige Region.
			</li>
			<li>
				<strong>Wir haben ein Interesse daran, dass sie steigt.</strong>
				Deshalb liegt die Methode offen, sind die Anker von außen gesetzt, und steht der
				Kipppunkt neben der Zahl.
			</li>
			<li>
				<strong>Sie beschreibt nicht heute.</strong>
				Der Datenstand ist {endJahr}. Und der Verzug ist nicht zufällig verteilt: Fragile Staaten
				melden am spätesten — die Zahl ist dadurch eher zu gut als zu schlecht.
			</li>
		</ul>
		<p class="quellen">
			Quellen: {D.quellen.join(' · ')} · {D.indikatoren.length} Reihen, {startJahr}–{endJahr} ·
			<a href="{base}/methodik">Methodik und Grenzen</a>
		</p>
	</section>

	<ShareBar
		url="https://nureine.de/stand-der-welt"
		title="Der Stand der Welt — {de(wert)} von 100"
		text="{steigend} von {bereiche.length} Bereichen verbessern sich seit {startJahr}, {worst.label} fällt. Eine Zahl aus {D.indikatoren.length} Messreihen — mit offener Methodik."
	/>
</section>

<style>
	.eyebrow {
		font-size: 0.62rem;
		letter-spacing: 0.11em;
		text-transform: uppercase;
	}

	/* ══ Zahl ══ */
	.big-number {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: clamp(5rem, 18vw, 10rem);
		line-height: 0.86;
		letter-spacing: -0.05em;
		color: var(--color-ink);
		font-variant-numeric: tabular-nums;
		margin-top: 0.75rem;
	}
	.of {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-faint);
		margin-top: 0.85rem;
	}
	.claim {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		line-height: 1.5;
		color: var(--color-ink-soft);
		max-width: 34ch;
		margin: 1.25rem auto 0;
	}

	/* ══ Skala ══ */
	.scale {
		max-width: 620px;
		margin: 2.5rem auto 0;
	}
	.scale-bar {
		position: relative;
		height: 9px;
		border-radius: 99px;
		overflow: hidden;
		background: linear-gradient(
			90deg,
			var(--color-rose-tint),
			var(--color-amber-tint),
			var(--color-sage-tint)
		);
	}
	.scale-fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--color-amber);
		opacity: 0.3;
		border-radius: 99px;
	}
	.scale-pins {
		position: relative;
		height: 92px;
		margin-top: -4px;
	}
	/* Randmarken nach innen ausrichten — sonst ragen sie auf schmalen
	   Bildschirmen über den Rand und erzeugen horizontales Scrollen. */
	.pin.edge-left {
		transform: none;
		text-align: left;
	}
	.pin.edge-left i {
		margin-left: 0;
	}
	.pin.edge-right {
		transform: translateX(-100%);
		text-align: right;
	}
	.pin.edge-right i {
		margin-right: 0;
	}
	/* Startwert eine Etage tiefer, mit längerem Strich zur Linie */
	.pin.past {
		top: 34px;
	}
	.pin.past i {
		height: 44px;
		margin-top: -44px;
		opacity: 0.5;
	}
	.pin {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		text-align: center;
		white-space: nowrap;
	}
	.pin i {
		display: block;
		width: 2px;
		height: 13px;
		margin: 0 auto 5px;
		background: var(--color-rule-strong);
		border-radius: 2px;
	}
	.pin.now i {
		background: var(--color-amber);
		width: 3px;
		height: 17px;
		margin-top: -4px;
	}
	.pin b {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--color-muted);
	}
	.pin.now b {
		color: var(--color-amber);
		font-size: 1rem;
	}
	.pin span {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-faint);
	}

	/* ══ Verlauf ══ */
	.trend {
		max-width: 620px;
		margin: 0.5rem auto 0;
	}
	.trend svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.trend-labels {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-faint);
		margin-top: 0.25rem;
	}

	/* ══ Überschriften ══ */
	.section-head {
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-muted);
		margin: 0 0 0.9rem;
	}

	/* ══ Bausteine ══ */
	.stack {
		max-width: 620px;
		margin: 2.75rem auto 0;
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.bar-row {
		display: grid;
		grid-template-columns: 112px 1fr 46px;
		align-items: center;
		gap: 0.75rem;
	}
	.bar-name {
		font-family: var(--font-serif);
		font-size: 0.86rem;
		color: var(--color-ink-soft);
		text-align: right;
		line-height: 1.25;
	}
	.bar-track {
		position: relative;
		height: 22px;
		background: var(--color-paper);
		border: 1px solid var(--color-rule);
		border-radius: 6px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		border-radius: 5px 0 0 5px;
	}
	.bar-mark {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		background: var(--color-ink);
		opacity: 0.28;
	}
	.bar-value {
		font-family: var(--font-mono);
		font-size: 0.84rem;
		color: var(--color-ink);
		font-variant-numeric: tabular-nums;
	}
	.legend {
		display: flex;
		gap: 1.1rem;
		justify-content: center;
		margin-top: 1.1rem;
		flex-wrap: wrap;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-muted);
	}
	.legend i {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		vertical-align: -1px;
		margin-right: 5px;
	}
	.legend i.tick {
		width: 2px;
		height: 12px;
		background: var(--color-ink);
		opacity: 0.28;
		vertical-align: -2px;
	}

	/* ══ Kipppunkt ══ */
	.kipppunkt {
		max-width: 620px;
		margin: 2.5rem auto 0;
		padding: 1.05rem 1.25rem;
		background: var(--color-paper);
		border: 1px solid var(--color-rule);
		border-left: 3px solid var(--color-amber);
		border-radius: 12px;
	}
	.kipppunkt p {
		margin: 0.4rem 0 0;
		font-family: var(--font-serif);
		font-size: 0.94rem;
		line-height: 1.55;
		color: var(--color-ink-soft);
	}
	.kipppunkt strong {
		color: var(--color-ink);
		font-weight: 600;
	}
	.kipppunkt em {
		font-style: normal;
		color: var(--color-ink);
	}
	.kipppunkt a {
		color: var(--color-amber-deep);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* ══ Schlagzeile ══ */
	.lead {
		max-width: 620px;
		margin: 3rem auto 0;
		padding-top: 2.25rem;
		border-top: 1px solid var(--color-rule);
	}
	.lead h1 {
		font-family: var(--font-serif);
		font-weight: 600;
		font-size: clamp(1.65rem, 5vw, 2.4rem);
		line-height: 1.14;
		letter-spacing: -0.015em;
		margin: 0.6rem 0 0.85rem;
		color: var(--color-ink);
		text-wrap: balance;
	}
	.lead p {
		font-family: var(--font-serif);
		font-size: 1.04rem;
		line-height: 1.6;
		color: var(--color-ink-soft);
		margin: 0;
		max-width: 52ch;
	}

	/* ══ Kacheln ══ */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
		gap: 0.9rem;
		margin-top: 1.4rem;
	}
	.card {
		position: relative;
		overflow: hidden;
		background: var(--color-paper);
		border: 1px solid var(--color-rule);
		border-radius: 15px;
		padding: 1.15rem 1.2rem;
		box-shadow: var(--shadow-sm);
	}
	.card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
	}
	.card.up::before {
		background: var(--color-sage);
	}
	.card.down::before {
		background: var(--color-rose);
	}
	.card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.65rem;
	}
	.card-name {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.98rem;
		color: var(--color-ink);
	}
	.card-delta {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		margin-top: 0.2rem;
	}
	.card-score {
		font-family: var(--font-mono);
		font-size: 1.42rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.card.up .card-score,
	.card.up .card-delta {
		color: var(--color-sage);
	}
	.card.down .card-score,
	.card.down .card-delta {
		color: var(--color-rose);
	}
	.card-spark {
		width: 100%;
		height: 38px;
		display: block;
		margin: 0.8rem 0 0.75rem;
	}
	.facts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.fact {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-family: var(--font-serif);
		font-size: 0.84rem;
		line-height: 1.35;
		color: var(--color-ink-soft);
	}
	.fact .dot {
		flex-shrink: 0;
		width: 6px;
		height: 6px;
		border-radius: 99px;
		margin-top: 0.36rem;
	}
	.fact.good .dot {
		background: var(--color-sage);
	}
	.fact.bad .dot {
		background: var(--color-rose);
	}
	.card-foot {
		margin-top: 0.8rem;
		padding-top: 0.65rem;
		border-top: 1px solid var(--color-rule);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-faint);
	}

	/* ══ Tabelle ══ */
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--color-rule);
		border-radius: 14px;
		background: var(--color-paper);
	}
	table {
		border-collapse: collapse;
		width: 100%;
		min-width: 560px;
	}
	th {
		font-family: var(--font-mono);
		font-size: 0.57rem;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--color-faint);
		text-align: left;
		padding: 0.75rem 0.9rem;
		border-bottom: 1px solid var(--color-rule);
		font-weight: 400;
	}
	td {
		padding: 0.7rem 0.9rem;
		border-bottom: 1px solid var(--color-rule);
		font-family: var(--font-serif);
		font-size: 0.88rem;
		color: var(--color-ink);
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tbody tr:hover {
		background: var(--color-amber-tint);
	}
	td.num {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		text-align: right;
		white-space: nowrap;
	}
	td.dim {
		color: var(--color-muted);
	}
	.unit {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--color-muted);
		margin-top: 0.1rem;
	}
	.pill {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		padding: 0.18rem 0.55rem;
		border-radius: 99px;
		white-space: nowrap;
	}
	.pill.good {
		background: var(--color-sage-tint);
		color: var(--color-sage);
	}
	.pill.bad {
		background: var(--color-rose-tint);
		color: var(--color-rose);
	}

	/* ══ Grenzen ══ */
	.grenzen {
		max-width: 620px;
		margin: 3rem auto 0;
		padding-top: 2rem;
		border-top: 1px solid var(--color-rule);
	}
	.grenzen ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.grenzen li {
		font-family: var(--font-serif);
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-ink-soft);
		padding-left: 0.9rem;
		border-left: 2px solid var(--color-rule-strong);
	}
	.grenzen strong {
		display: block;
		color: var(--color-ink);
		font-weight: 600;
		margin-bottom: 0.15rem;
	}
	.quellen {
		margin-top: 1.6rem;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		line-height: 1.8;
		color: var(--color-faint);
	}
	.quellen a {
		color: var(--color-amber-deep);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (max-width: 560px) {
		.bar-row {
			grid-template-columns: 92px 1fr 40px;
			gap: 0.5rem;
		}
		.bar-name {
			font-size: 0.78rem;
		}
		.pin b {
			font-size: 0.72rem;
		}
		.pin.now b {
			font-size: 0.88rem;
		}
	}
</style>
