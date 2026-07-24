<script lang="ts">
	import { TIERS, STEPS, PILOT_LINE } from '$lib/b2b-content';
	import B2BForm from '$lib/components/B2BForm.svelte';
</script>

<svelte:head><title>NurEine für Unternehmen — Variante B</title></svelte:head>

<!-- HERO: dunkel, Problem zuerst -->
<header class="hero-dark">
	<div class="hero-inner">
		<span class="eyebrow">Für Unternehmen</span>
		<h1>Nachrichten laugen aus.<br /><em>Den ganzen Tag.</em></h1>
		<p class="lead">
			Eure Leute scrollen den ganzen Tag durch schlechte Nachrichten. Das senkt Stimmung und Fokus
			— und trifft genau die Bildschirme in Kantine, Wartebereich und Intranet, an denen sie
			täglich vorbeigehen.
		</p>
		<a href="#loesung" class="scroll-hint">Es geht auch anders ↓</a>
	</div>
</header>

<div class="wrap">
	<!-- LÖSUNG -->
	<section id="loesung" class="loesung">
		<h2>Ein täglicher Lichtblick — statt Krisenticker.</h2>
		<p class="loesung-lead">
			NurEine liefert jeden Tag eine belegte gute Nachricht für eure Kanäle. Recherchiert,
			geschrieben und geprüft. Ihr müsst nichts tun außer sie zeigen.
		</p>
		<div class="steps">
			{#each STEPS as s}
				<div class="step">
					<span class="step-n">{s.n}</span>
					<h3>{s.t}</h3>
					<p>{s.d}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- USP -->
	<section class="usp">
		<div class="usp-mark">✓ belegt</div>
		<h2>Gute Nachrichten — aber keine erfundenen.</h2>
		<p>
			Jede Geschichte trägt einen Wirkungsindex und eine offene Quelle. Wir erfinden nie eine Zahl.
			So könnt ihr den Content zeigen, ohne eure Glaubwürdigkeit zu riskieren.
		</p>
	</section>

	<!-- PILOT-GARANTIE (früh, weil emotional) -->
	<section class="garantie">
		<p class="quote">„{PILOT_LINE}"</p>
		<p class="sub">Keine Kreditkarte. Kein Automatik-Abo. Echte Menschen als Ansprechpartner.</p>
		<a href="#pilot" class="btn-primary">Jetzt Pilot anfragen</a>
	</section>

	<!-- PREISE -->
	<section id="preise" class="preise">
		<h2>Transparente Preise.</h2>
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
				</div>
			{/each}
		</div>
		<p class="preis-fine">Alle Tarife starten mit 30 Tagen kostenlos.</p>
	</section>

	<!-- GRÜNDUNGSPHASE -->
	<section class="gruendung">
		<h2>Wir suchen unsere ersten drei Pilotpartner.</h2>
		<p>
			NurEine ist jung. Statt geliehener Logos bieten wir den ersten drei Unternehmen etwas Echtes:
			Frühzugang, Mitgestaltung und dauerhafte Sonderkonditionen. Wer jetzt einsteigt, prägt mit.
		</p>
	</section>

	<!-- FORMULAR -->
	<section id="pilot" class="pilot">
		<h2>Lasst uns 30 Tage testen.</h2>
		<B2BForm accent="var(--color-sage)" />
	</section>

	<footer class="foot">NurEine gibt's auch kostenlos für alle → <a href="/">nureine.de</a></footer>
</div>

<style>
	.hero-dark { background: var(--color-surface-ink); color: var(--color-on-ink); padding: 6rem 1.5rem; text-align: center; }
	.hero-inner { max-width: 760px; margin: 0 auto; }
	.eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-amber-soft); }
	.hero-dark h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.03em; margin: 1.2rem 0 1.5rem; }
	.hero-dark h1 em { font-family: var(--font-serif); font-style: italic; font-weight: 500; color: var(--color-amber-soft); }
	.hero-dark .lead { font-size: 1.2rem; line-height: 1.6; color: var(--color-on-ink); opacity: 0.85; max-width: 600px; margin: 0 auto 2rem; }
	.scroll-hint { color: var(--color-amber-soft); font-weight: 600; text-decoration: none; font-size: 1.05rem; }

	.wrap { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 6rem; font-family: var(--font-sans); color: var(--color-ink); }
	.loesung { text-align: center; padding: 5rem 0 3rem; }
	.loesung h2 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.8rem); letter-spacing: -0.02em; margin: 0 0 1rem; }
	.loesung-lead { font-size: 1.15rem; color: var(--color-ink-soft); line-height: 1.6; max-width: 620px; margin: 0 auto 3rem; }
	.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; text-align: left; }
	.step-n { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-sage); }
	.step h3 { font-size: 1.15rem; margin: 0.6rem 0; }
	.step p { color: var(--color-muted); line-height: 1.6; font-size: 0.95rem; }

	.usp { text-align: center; padding: 3rem 0; margin: 2rem 0; }
	.usp-mark { display: inline-block; background: var(--color-sage-soft); color: var(--color-sage); font-weight: 700; font-size: 0.85rem; padding: 5px 14px; border-radius: 100px; margin-bottom: 1rem; }
	.usp h2 { font-family: var(--font-display); font-size: 1.8rem; margin: 0 0 1rem; }
	.usp p { max-width: 620px; margin: 0 auto; color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }

	.garantie { text-align: center; background: linear-gradient(150deg, var(--color-paper), var(--color-amber-soft)); border-radius: 24px; padding: 3.5rem 2rem; margin: 3rem 0; }
	.garantie .quote { font-family: var(--font-serif); font-style: italic; font-size: 1.7rem; line-height: 1.4; max-width: 720px; margin: 0 auto; color: var(--color-ink); }
	.garantie .sub { color: var(--color-ink-soft); margin: 1.2rem 0 1.8rem; font-size: 0.95rem; }
	.btn-primary { background: #18181a; color: #f2f1ef; padding: 0.9rem 2.2rem; border-radius: 100px; font-weight: 700; text-decoration: none; display: inline-block; }

	.preise { margin: 4rem 0; }
	.preise h2, .gruendung h2, .pilot h2 { font-family: var(--font-display); font-size: 2rem; text-align: center; margin: 0 0 2rem; letter-spacing: -0.02em; }
	.tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
	.tier { position: relative; border: 1px solid var(--color-rule); border-radius: 16px; padding: 1.8rem 1.5rem; background: var(--color-paper); }
	.tier.featured { border: 2px solid var(--color-sage); }
	.badge { position: absolute; top: -12px; left: 1.5rem; background: var(--color-sage); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
	.tier h3 { font-size: 1.1rem; margin: 0 0 0.5rem; }
	.price { font-family: var(--font-display); font-size: 2.6rem; font-weight: 700; letter-spacing: -0.03em; }
	.euro { font-size: 1.3rem; vertical-align: super; margin-right: 2px; }
	.mo { font-size: 0.9rem; font-weight: 400; color: var(--color-muted); }
	.tier-tag { color: var(--color-muted); font-size: 0.9rem; margin: 0.3rem 0 1.2rem; }
	.tier ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; }
	.tier li { padding-left: 1.4rem; position: relative; font-size: 0.9rem; color: var(--color-ink-soft); line-height: 1.4; }
	.tier li::before { content: '✓'; position: absolute; left: 0; color: var(--color-sage); font-weight: 700; }
	.preis-fine { text-align: center; color: var(--color-muted); margin-top: 1.5rem; font-size: 0.9rem; }

	.gruendung { text-align: center; max-width: 680px; margin: 4rem auto; }
	.gruendung p { color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }
	.pilot { max-width: 640px; margin: 4rem auto; }
	.foot { text-align: center; color: var(--color-muted); margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-rule); }
	.foot a { color: var(--color-amber-deep); }
	@media (max-width: 720px) { .steps, .tiers { grid-template-columns: 1fr; } }
</style>
