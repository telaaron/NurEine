<script lang="ts">
	import { TIERS, STEPS, PILOT_LINE } from '$lib/b2b-content';
	import B2BForm from '$lib/components/B2BForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { ComputerDesktopIcon, EnvelopeIcon, HomeModernIcon, SwatchIcon } from 'heroicons-svelte/24/outline';
</script>

<svelte:head>
	<title>NurEine für Unternehmen — belegte gute Nachrichten für eure Kanäle</title>
	<meta
		name="description"
		content="Täglich eine belegte gute Nachricht für eure Office-Screens, euren Newsletter und euer Intranet. 30 Tage kostenlos testen."
	/>
</svelte:head>

<div class="wrap">
	<!-- HERO: B-Klarheit im hellen A-Design -->
	<header class="hero">
		<span class="eyebrow">Für Unternehmen</span>
		<h1>Nachrichten laugen aus.<br /><em>Das muss nicht sein.</em></h1>
		<p class="lead">
			Eure Leute scrollen den ganzen Tag durch schlechte Nachrichten. NurEine liefert das
			Gegengewicht: täglich eine belegte gute Nachricht für eure Screens, euren Newsletter und euer
			Intranet. Ihr müsst nichts tun außer sie zeigen.
		</p>
		<div class="cta-row">
			<a href="#pilot" class="btn-primary">30 Tage kostenlos testen</a>
			<a href="#preise" class="btn-ghost">Preise ansehen</a>
		</div>
	</header>

	<!-- SCREEN-MOCK (aus C) -->
	<section class="demo">
		<div class="screen">
			<div class="screen-bezel">
				<div class="screen-content">
					<div class="s-cat">Gesundheit · Wirkung 82</div>
					<h3 class="s-head">Speicheltest verkürzt eine Diagnose von neun Jahren auf Stunden</h3>
					<p class="s-dek">
						Was Betroffene früher fast ein Jahrzehnt Ungewissheit kostete, klärt ein einfacher Test
						jetzt am selben Tag.
					</p>
					<div class="s-foot"><span>Quelle: Fachjournal</span><span class="s-brand">NurEine</span></div>
				</div>
			</div>
			<div class="screen-stand"></div>
		</div>
		<p class="demo-cap">So sieht ein guter Morgen auf euren Bildschirmen aus.</p>
	</section>

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

	<!-- FORMATE / GERÄTE (aus C) -->
	<section class="formate">
		<h2>Ein Feed, überall wo eure Leute hinschauen.</h2>
		<div class="format-grid">
			<div class="format"><span class="f-icon"><Icon icon={ComputerDesktopIcon} size="1.6rem" /></span><h4>Office-Screens</h4><p>Kantine, Empfang, Flur.</p></div>
			<div class="format"><span class="f-icon"><Icon icon={EnvelopeIcon} size="1.6rem" /></span><h4>Newsletter</h4><p>Als Baustein in eurem internen Brief.</p></div>
			<div class="format"><span class="f-icon"><Icon icon={HomeModernIcon} size="1.6rem" /></span><h4>Intranet</h4><p>Widget auf der Startseite.</p></div>
			<div class="format"><span class="f-icon"><Icon icon={SwatchIcon} size="1.6rem" /></span><h4>Whitelabel</h4><p>Euer Branding, eure Farben.</p></div>
		</div>
	</section>

	<!-- USP -->
	<section class="usp">
		<h2>Gute Nachrichten — aber keine erfundenen.</h2>
		<p>
			Jede Geschichte trägt einen Wirkungsindex von 0 bis 100 und eine offene Quelle. Wir erfinden
			nie eine Zahl. Das unterscheidet uns von Wohlfühl-Kacheln — und macht den Content glaubwürdig
			genug, um ihn im Unternehmen zu zeigen.
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
	.wrap { max-width: 1040px; margin: 0 auto; padding: 4rem 1.5rem 6rem; font-family: var(--font-sans); color: var(--color-ink); }

	/* HERO — B-Klarheit, A-Design (hell, Amber) */
	.hero { text-align: center; padding: 2rem 0 1rem; }
	.eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-amber); }
	h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 5.5vw, 3.8rem); font-weight: 700; line-height: 1.06; letter-spacing: -0.03em; margin: 1rem 0 1.5rem; }
	h1 em { font-family: var(--font-serif); font-style: italic; font-weight: 500; color: var(--color-amber-deep); }
	.lead { font-size: 1.2rem; line-height: 1.6; color: var(--color-ink-soft); max-width: 660px; margin: 0 auto 2rem; }
	.cta-row { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
	.btn-primary { background: var(--color-amber); color: #fff; padding: 0.9rem 2rem; border-radius: 100px; font-weight: 700; text-decoration: none; }
	.btn-ghost { border: 1px solid var(--color-rule); color: var(--color-ink); padding: 0.9rem 2rem; border-radius: 100px; font-weight: 600; text-decoration: none; }

	/* SCREEN-MOCK */
	.demo { display: flex; flex-direction: column; align-items: center; margin: 1rem 0 4rem; }
	.screen-bezel { width: 100%; max-width: 520px; background: #1a1a1c; border-radius: 16px; padding: 16px; box-shadow: 0 28px 70px rgba(40,25,15,0.2); }
	.screen-content { background: #faf6ee; border-radius: 7px; padding: 2rem; aspect-ratio: 16/10; display: flex; flex-direction: column; justify-content: center; }
	.s-cat { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #c87340; margin-bottom: 0.8rem; }
	.s-head { font-family: var(--font-display); font-size: 1.5rem; line-height: 1.14; letter-spacing: -0.02em; margin: 0 0 0.8rem; color: #1a1815; }
	.s-dek { font-family: var(--font-serif); font-size: 1rem; line-height: 1.45; color: #3a342c; margin: 0; }
	.s-foot { display: flex; justify-content: space-between; margin-top: auto; padding-top: 1.4rem; font-size: 0.78rem; color: #9a9087; }
	.s-brand { font-family: var(--font-display); font-weight: 700; color: #1a1815; }
	.screen-stand { width: 100px; height: 44px; background: linear-gradient(#2a2a2c, #1a1a1c); clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%); margin-top: -2px; }
	.demo-cap { font-family: var(--font-serif); font-style: italic; font-size: 1.15rem; color: var(--color-muted); margin-top: 1.5rem; text-align: center; }

	/* SCHRITTE */
	.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 2rem 0 4rem; }
	.step-n { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-amber); }
	.step h3 { font-size: 1.15rem; margin: 0.6rem 0; }
	.step p { color: var(--color-muted); line-height: 1.6; font-size: 0.95rem; }

	/* FORMATE */
	.formate { text-align: center; padding: 3rem 0; border-top: 1px solid var(--color-rule); margin: 2rem 0; }
	.formate h2 { font-family: var(--font-display); font-size: 1.9rem; margin: 0 0 2rem; letter-spacing: -0.02em; }
	.format-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; }
	.format { background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 14px; padding: 1.5rem 1rem; }
	.f-icon { font-size: 1.6rem; color: var(--color-amber); }
	.format h4 { margin: 0.6rem 0 0.3rem; font-size: 1rem; }
	.format p { margin: 0; font-size: 0.85rem; color: var(--color-muted); }

	/* USP */
	.usp { text-align: center; padding: 3rem 0; border-top: 1px solid var(--color-rule); border-bottom: 1px solid var(--color-rule); margin: 2rem 0; }
	.usp h2 { font-family: var(--font-display); font-size: 1.9rem; margin: 0 0 1rem; letter-spacing: -0.02em; }
	.usp p { max-width: 660px; margin: 0 auto; color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }

	/* PREISE */
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

	/* GARANTIE — dunkler Akzentblock (feste Werte, dark-mode-fest) */
	.garantie { text-align: center; background: #18181a; color: #f2f1ef; border-radius: 20px; padding: 3rem 2rem; margin: 4rem 0; }
	.garantie .quote { font-family: var(--font-serif); font-style: italic; font-size: 1.6rem; line-height: 1.4; max-width: 720px; margin: 0 auto; }
	.garantie .sub { color: rgba(242,241,239,0.6); margin-top: 1.2rem; font-size: 0.95rem; }

	.gruendung { text-align: center; max-width: 680px; margin: 4rem auto; }
	.gruendung p { color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }

	.pilot { max-width: 640px; margin: 4rem auto; }
	.foot { text-align: center; color: var(--color-muted); margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-rule); }
	.foot a { color: var(--color-amber-deep); }

	@media (max-width: 860px) { .format-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 720px) { .steps, .tiers { grid-template-columns: 1fr; } }
</style>
