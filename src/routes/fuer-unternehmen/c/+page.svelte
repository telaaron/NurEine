<script lang="ts">
	import { TIERS, STEPS, PILOT_LINE } from '$lib/b2b-content';
	import B2BForm from '$lib/components/B2BForm.svelte';
</script>

<svelte:head><title>NurEine für Unternehmen — Variante C</title></svelte:head>

<div class="wrap">
	<!-- HERO: Split — Text links, Screen-Demo rechts -->
	<header class="hero">
		<div class="hero-text">
			<span class="eyebrow">Für Unternehmen</span>
			<h1>So sieht ein guter Morgen<br />auf euren Screens aus.</h1>
			<p class="lead">
				Täglich eine belegte gute Nachricht — fertig für Kantine, Empfang, Intranet und euren
				Newsletter. Kein Redaktionsaufwand. Ihr zeigt sie nur.
			</p>
			<a href="#pilot" class="btn-primary">30 Tage kostenlos testen</a>
		</div>
		<!-- Simulierter Office-Screen -->
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

	<!-- FORMATE (was C einzigartig macht: zeigt die Ausspielwege) -->
	<section class="formate">
		<h2>Ein Feed, überall wo eure Leute hinschauen.</h2>
		<div class="format-grid">
			<div class="format"><span class="f-icon">▢</span><h4>Office-Screens</h4><p>Kantine, Empfang, Flur.</p></div>
			<div class="format"><span class="f-icon">✉</span><h4>Newsletter</h4><p>Als Baustein in eurem internen Brief.</p></div>
			<div class="format"><span class="f-icon">⌂</span><h4>Intranet</h4><p>Widget auf der Startseite.</p></div>
			<div class="format"><span class="f-icon">◈</span><h4>Whitelabel</h4><p>Euer Branding, eure Farben.</p></div>
		</div>
	</section>

	<!-- USP -->
	<section class="usp">
		<h2>Gute Nachrichten — aber keine erfundenen.</h2>
		<p>
			Jede Geschichte trägt einen Wirkungsindex und eine offene Quelle. Wir erfinden nie eine Zahl —
			deshalb könnt ihr den Content zeigen, ohne eure Glaubwürdigkeit zu riskieren.
		</p>
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
					<a href="#pilot" class="tier-cta">Testen</a>
				</div>
			{/each}
		</div>
		<p class="preis-fine">Alle Tarife starten mit 30 Tagen kostenlos. Kein Vertrag im Pilot.</p>
	</section>

	<!-- PILOT + GRÜNDUNG -->
	<section class="garantie">
		<p class="quote">„{PILOT_LINE}"</p>
		<p class="sub">Wir suchen unsere ersten drei Pilotpartner — mit Frühzugang, Mitgestaltung und dauerhaften Sonderkonditionen.</p>
	</section>

	<!-- FORMULAR -->
	<section id="pilot" class="pilot">
		<h2>Lasst uns 30 Tage testen.</h2>
		<B2BForm accent="var(--color-sky)" />
	</section>

	<footer class="foot">NurEine gibt's auch kostenlos für alle → <a href="/">nureine.de</a></footer>
</div>

<style>
	.wrap { max-width: 1040px; margin: 0 auto; padding: 4rem 1.5rem 6rem; font-family: var(--font-sans); color: var(--color-ink); }
	.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; padding: 2rem 0 4rem; }
	.eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-sky); }
	h1 { font-family: var(--font-display); font-size: clamp(1.9rem, 3.5vw, 2.9rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; margin: 1rem 0 1.2rem; }
	.lead { font-size: 1.1rem; line-height: 1.6; color: var(--color-ink-soft); margin: 0 0 2rem; }
	.btn-primary { background: #18181a; color: #f2f1ef; padding: 0.9rem 2rem; border-radius: 100px; font-weight: 700; text-decoration: none; display: inline-block; }

	/* Screen-Mock */
	.screen { display: flex; flex-direction: column; align-items: center; }
	.screen-bezel { width: 100%; max-width: 440px; background: #1a1a1c; border-radius: 14px; padding: 14px; box-shadow: 0 24px 60px rgba(40,25,15,0.22); }
	.screen-content { background: var(--color-canvas); border-radius: 6px; padding: 1.8rem; aspect-ratio: 16/10; display: flex; flex-direction: column; justify-content: center; }
	.s-cat { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-amber); margin-bottom: 0.8rem; }
	.s-head { font-family: var(--font-display); font-size: 1.4rem; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 0.8rem; color: var(--color-ink); }
	.s-dek { font-family: var(--font-serif); font-size: 0.95rem; line-height: 1.45; color: var(--color-ink-soft); margin: 0; }
	.s-foot { display: flex; justify-content: space-between; margin-top: auto; padding-top: 1.2rem; font-size: 0.75rem; color: var(--color-faint); }
	.s-brand { font-family: var(--font-display); font-weight: 700; color: var(--color-ink); }
	.screen-stand { width: 90px; height: 40px; background: linear-gradient(#2a2a2c, #1a1a1c); clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%); margin-top: -2px; }

	.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 3rem 0; }
	.step-n { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-sky); }
	.step h3 { font-size: 1.15rem; margin: 0.6rem 0; }
	.step p { color: var(--color-muted); line-height: 1.6; font-size: 0.95rem; }

	.formate { text-align: center; padding: 3rem 0; border-top: 1px solid var(--color-rule); margin: 2rem 0; }
	.formate h2 { font-family: var(--font-display); font-size: 1.8rem; margin: 0 0 2rem; }
	.format-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; }
	.format { background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 14px; padding: 1.5rem 1rem; }
	.f-icon { font-size: 1.6rem; color: var(--color-sky); }
	.format h4 { margin: 0.6rem 0 0.3rem; font-size: 1rem; }
	.format p { margin: 0; font-size: 0.85rem; color: var(--color-muted); }

	.usp { text-align: center; padding: 3rem 0; margin: 2rem 0; }
	.usp h2 { font-family: var(--font-display); font-size: 1.8rem; margin: 0 0 1rem; }
	.usp p { max-width: 620px; margin: 0 auto; color: var(--color-ink-soft); line-height: 1.7; font-size: 1.05rem; }

	.preise { margin: 4rem 0; }
	.preise h2, .pilot h2 { font-family: var(--font-display); font-size: 2rem; text-align: center; margin: 0 0 2rem; letter-spacing: -0.02em; }
	.tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
	.tier { position: relative; border: 1px solid var(--color-rule); border-radius: 16px; padding: 1.8rem 1.5rem; background: var(--color-paper); }
	.tier.featured { border: 2px solid var(--color-sky); }
	.badge { position: absolute; top: -12px; left: 1.5rem; background: var(--color-sky); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
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
	.garantie .sub { color: var(--color-faint); margin-top: 1.2rem; font-size: 0.95rem; max-width: 620px; margin-left: auto; margin-right: auto; }

	.pilot { max-width: 640px; margin: 4rem auto; }
	.foot { text-align: center; color: var(--color-muted); margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-rule); }
	.foot a { color: var(--color-amber-deep); }
	@media (max-width: 860px) { .hero { grid-template-columns: 1fr; } .format-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 720px) { .steps, .tiers { grid-template-columns: 1fr; } }
</style>
