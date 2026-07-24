<script lang="ts">
	import { TIERS, STEPS, PILOT_LINE } from '$lib/b2b-content';
	import B2BForm from '$lib/components/B2BForm.svelte';
</script>

<svelte:head><title>NurEine für Unternehmen — Variante A</title></svelte:head>

<div class="wrap">
	<!-- HERO: nüchtern, Nutzen zuerst -->
	<header class="hero">
		<span class="eyebrow">Für Unternehmen</span>
		<h1>Guter Content für eure Kanäle.<br />Jeden Tag. <em>Ohne eine Minute Aufwand.</em></h1>
		<p class="lead">
			NurEine liefert täglich eine belegte gute Nachricht — für eure Office-Screens, euren
			internen Newsletter, euer Intranet. Recherchiert, geschrieben, geprüft. Ihr müsst nichts tun
			außer sie zeigen.
		</p>
		<div class="cta-row">
			<a href="#pilot" class="btn-primary">30 Tage kostenlos testen</a>
			<a href="#preise" class="btn-ghost">Preise ansehen</a>
		</div>
	</header>

	<!-- 3 SCHRITTE -->
	<section class="steps">
		{#each STEPS as s}
			<div class="step">
				<span class="step-n">{s.n}</span>
				<h3>{s.t}</h3>
				<p>{s.d}</p>
			</div>
		{/each}
	</section>

	<!-- USP -->
	<section class="usp">
		<h2>Gute Nachrichten — aber keine erfundenen.</h2>
		<p>
			Jede Geschichte trägt einen Wirkungsindex von 0 bis 100 und eine offene Quelle. Wir erfinden
			nie eine Zahl. Das unterscheidet uns von Wohlfühl-Kacheln — und macht den Content
			glaubwürdig genug, um ihn im Unternehmen zu zeigen.
		</p>
	</section>

	<!-- PREISE -->
	<section id="preise" class="preise">
		<h2>Ein Preis, den man versteht.</h2>
		<div class="tiers">
			{#each TIERS as t}
				<div class="tier" class:featured={t.featured}>
					{#if t.featured}<span class="badge">Beliebt</span>{/if}
					<h3>{t.name}</h3>
					<div class="price"><span class="euro">€</span>{t.price}<span class="mo">/Monat</span></div>
					<p class="tier-tag">{t.tagline}</p>
					<ul>
						{#each t.features as f}<li>{f}</li>{/each}
					</ul>
					<a href="#pilot" class="tier-cta">Testen</a>
				</div>
			{/each}
		</div>
		<p class="preis-fine">Alle Tarife starten mit 30 Tagen kostenlos. Kein Vertrag, keine Kündigungsfrist im Pilot.</p>
	</section>

	<!-- PILOT-GARANTIE -->
	<section class="garantie">
		<p class="quote">„{PILOT_LINE}"</p>
		<p class="sub">Keine Kreditkarte. Kein Automatik-Abo. Echte Menschen als Ansprechpartner.</p>
	</section>

	<!-- GRÜNDUNGSPHASE -->
	<section class="gruendung">
		<h2>Wir suchen unsere ersten drei Pilotpartner.</h2>
		<p>
			NurEine ist jung. Statt geliehener Logos bieten wir den ersten drei Unternehmen etwas Echtes:
			Frühzugang, Mitgestaltung des Produkts und dauerhafte Sonderkonditionen. Wer jetzt einsteigt,
			prägt mit, wie belegte gute Nachrichten in Unternehmen aussehen.
		</p>
	</section>

	<!-- FORMULAR -->
	<section id="pilot" class="pilot">
		<h2>Lasst uns 30 Tage testen.</h2>
		<B2BForm />
	</section>

	<footer class="foot">NurEine gibt's auch kostenlos für alle → <a href="/">nureine.de</a></footer>
</div>

<style>
	.wrap { max-width: 960px; margin: 0 auto; padding: 4rem 1.5rem 6rem; font-family: var(--font-sans); color: var(--color-ink); }
	.hero { text-align: center; padding: 2rem 0 4rem; }
	.eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-amber); }
	h1 { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 700; line-height: 1.08; letter-spacing: -0.03em; margin: 1rem 0 1.5rem; }
	h1 em { font-family: var(--font-serif); font-style: italic; font-weight: 500; color: var(--color-amber-deep); }
	.lead { font-size: 1.2rem; line-height: 1.6; color: var(--color-ink-soft); max-width: 640px; margin: 0 auto 2rem; }
	.cta-row { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
	.btn-primary { background: var(--color-amber); color: #fff; padding: 0.9rem 2rem; border-radius: 100px; font-weight: 700; text-decoration: none; }
	.btn-ghost { border: 1px solid var(--color-rule); color: var(--color-ink); padding: 0.9rem 2rem; border-radius: 100px; font-weight: 600; text-decoration: none; }

	.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 3rem 0; }
	.step-n { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-amber); }
	.step h3 { font-size: 1.15rem; margin: 0.6rem 0; }
	.step p { color: var(--color-muted); line-height: 1.6; font-size: 0.95rem; }

	.usp { text-align: center; padding: 3rem 0; border-top: 1px solid var(--color-rule); border-bottom: 1px solid var(--color-rule); margin: 3rem 0; }
	.usp h2 { font-family: var(--font-display); font-size: 1.8rem; margin: 0 0 1rem; }
	.usp p { max-width: 640px; margin: 0 auto; color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }

	.preise { margin: 4rem 0; }
	.preise h2, .gruendung h2, .pilot h2 { font-family: var(--font-display); font-size: 2rem; text-align: center; margin: 0 0 2rem; letter-spacing: -0.02em; }
	.tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
	.tier { position: relative; border: 1px solid var(--color-rule); border-radius: 16px; padding: 1.8rem 1.5rem; background: var(--color-paper); }
	.tier.featured { border: 2px solid var(--color-amber); }
	.badge { position: absolute; top: -12px; left: 1.5rem; background: var(--color-amber); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
	.tier h3 { font-size: 1.1rem; margin: 0 0 0.5rem; }
	.price { font-family: var(--font-display); font-size: 2.6rem; font-weight: 700; letter-spacing: -0.03em; }
	.euro { font-size: 1.3rem; vertical-align: super; margin-right: 2px; }
	.mo { font-size: 0.9rem; font-weight: 400; color: var(--color-muted); }
	.tier-tag { color: var(--color-muted); font-size: 0.9rem; margin: 0.3rem 0 1.2rem; }
	.tier ul { list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
	.tier li { padding-left: 1.4rem; position: relative; font-size: 0.9rem; color: var(--color-ink-soft); line-height: 1.4; }
	.tier li::before { content: '✓'; position: absolute; left: 0; color: var(--color-sage); font-weight: 700; }
	.tier-cta { display: block; text-align: center; padding: 0.7rem; border-radius: 10px; background: var(--color-canvas-soft); color: var(--color-ink); font-weight: 700; text-decoration: none; }
	.preis-fine { text-align: center; color: var(--color-muted); margin-top: 1.5rem; font-size: 0.9rem; }

	.garantie { text-align: center; background: var(--color-surface-ink); color: var(--color-on-ink); border-radius: 20px; padding: 3rem 2rem; margin: 4rem 0; }
	.garantie .quote { font-family: var(--font-serif); font-style: italic; font-size: 1.6rem; line-height: 1.4; max-width: 720px; margin: 0 auto; }
	.garantie .sub { color: var(--color-faint); margin-top: 1.2rem; font-size: 0.95rem; }

	.gruendung { text-align: center; max-width: 680px; margin: 4rem auto; }
	.gruendung p { color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }

	.pilot { max-width: 640px; margin: 4rem auto; }
	.foot { text-align: center; color: var(--color-muted); margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-rule); }
	.foot a { color: var(--color-amber-deep); }
	@media (max-width: 720px) { .steps, .tiers { grid-template-columns: 1fr; } }
</style>
