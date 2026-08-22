<script lang="ts">
	let { data } = $props();

	function usd(v: number): string {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: v < 10 ? 2 : 0 }).format(v);
	}
	const s = $derived(data.summary);

	// Dienste nach Gesamtkosten sortiert (größter Posten oben) — das ist der Effizienz-Blick.
	const ranked = $derived([...data.services].sort((a, b) => b.total - a.total));
	const maxTotal = $derived(Math.max(1, ...data.services.map((x) => x.total)));

	const kindColor: Record<string, string> = {
		'Abo (fix)': 'var(--color-rose)',
		'nach Nutzung': 'var(--color-amber)',
		'Free-Tier': 'var(--color-sage)',
		'gratis (lokal)': 'var(--color-sky)'
	};
</script>

<p class="text-xs uppercase tracking-[0.18em] mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Cockpit</p>
<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Kosten</h1>
<p class="mt-2 text-sm" style="color: var(--color-muted);">Wo Geld fließt, wie viel ihr nutzt und was es kostet — seit dem {new Date(data.projectStart).toLocaleDateString('de-DE')} ({data.months} Monate).</p>

<!-- Die zwei großen Zahlen -->
<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
	<div class="hero-stat">
		<span class="hs-label">Bisher reingesteckt</span>
		<span class="hs-val">{usd(s.totalInvested)}</span>
		<span class="hs-sub">seit Projektstart, alle Posten zusammen</span>
	</div>
	<div class="hero-stat">
		<span class="hs-label">Brennrate / Monat</span>
		<span class="hs-val" style="color: var(--color-amber-deep);">{usd(s.monthlyBurn)}</span>
		<span class="hs-sub">was der Betrieb aktuell pro Monat kostet</span>
	</div>
</div>

<!-- Der eine Effizienz-Satz -->
<div class="insight">
	<strong>{s.claudeShare}%</strong> deiner Gesamtausgaben ist das Claude-Abo — ein Fixposten.
	Alles Variable (Bilder, Audio) zusammen ist der kleinere Teil. Der größte Spar-Hebel liegt
	also nicht im Betrieb, sondern in der Frage: Läuft das Abo für genug Projekte?
</div>

<!-- Dienste, nach Kosten sortiert -->
<h2 class="section-h">Wo das Geld fließt</h2>
<div class="services">
	{#each ranked as svc (svc.key)}
		<div class="svc">
			<div class="svc-bar-track"><div class="svc-bar" style="width: {(svc.total / maxTotal) * 100}%; background: {kindColor[svc.kind] || 'var(--color-muted)'}"></div></div>
			<div class="svc-head">
				<span class="svc-name">{svc.name}</span>
				<span class="svc-kind" style="color: {kindColor[svc.kind] || 'var(--color-muted)'}">{svc.kind}</span>
				<span class="svc-total">{svc.total > 0 ? usd(svc.total) : 'gratis'}</span>
			</div>
			<div class="svc-meta">
				<span class="svc-usage">{svc.usage}</span>
				{#if svc.monthly > 0}<span class="svc-mo">· {usd(svc.monthly)}/Mon.</span>{/if}
				{#if svc.live}<span class="svc-live">· {svc.live}</span>{/if}
			</div>
			<p class="svc-note">{svc.note}</p>
		</div>
	{/each}
</div>

<!-- Stückkosten -->
<h2 class="section-h">Was eine Einheit kostet</h2>
<div class="units">
	<div class="unit"><span class="u-val">{usd(data.unit.perStory)}</span><span class="u-label">eine bebilderte Story</span></div>
	<div class="unit"><span class="u-val">{usd(data.unit.perImage)}</span><span class="u-label">ein KI-Bild (fal.ai)</span></div>
	<div class="unit"><span class="u-val">gratis</span><span class="u-label">ein Reel (lokal gerendert)</span></div>
	<div class="unit"><span class="u-val">gratis</span><span class="u-label">1000 Newsletter-Mails</span></div>
</div>

<p class="mt-6 text-xs" style="color: var(--color-faint); line-height: 1.6;">
	Fixkosten (Claude, Domain) sind Aarons Eingabe. Nutzungskosten sind aus der DB gemessen und mit
	Stückpreis-Schätzwerten (fal ~${data.unit.perImage.toFixed(2)}/Bild) hochgerechnet — die echten
	Abrechnungen liegen in den Anbieter-Dashboards. Free-Tier-Dienste (Brevo, Supabase, Vercel) kosten
	0 €, solange die Kontingente reichen; Supabase-Storage ist der einzige reale Engpass.
</p>

<style>
	.hero-stat { background: var(--color-surface-ink); color: var(--color-on-ink); border-radius: 14px; padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
	.hs-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-on-ink); opacity: 0.6; font-family: var(--font-mono); }
	.hs-val { font-family: var(--font-display); font-size: 2.6rem; font-weight: 700; line-height: 1.05; margin: 0.4rem 0 0.3rem; }
	.hs-sub { font-size: 0.8rem; opacity: 0.7; }

	.insight { margin-top: 1rem; background: var(--color-paper); border: 1px solid var(--color-rule); border-left: 3px solid var(--color-amber); border-radius: 0 10px 10px 0; padding: 0.9rem 1.2rem; font-size: 0.9rem; line-height: 1.6; color: var(--color-ink-soft); }
	.insight strong { color: var(--color-amber-deep); font-family: var(--font-display); }

	.section-h { font-family: var(--font-display); font-size: 1.3rem; font-weight: 600; color: var(--color-ink); margin: 2.2rem 0 1rem; }

	.services { display: flex; flex-direction: column; gap: 0.7rem; }
	.svc { position: relative; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 12px; padding: 0.9rem 1.1rem; overflow: hidden; }
	.svc-bar-track { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; }
	.svc-bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: 0.08; }
	.svc-head { position: relative; display: flex; align-items: baseline; gap: 0.7rem; }
	.svc-name { font-weight: 600; color: var(--color-ink); }
	.svc-kind { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--font-mono); }
	.svc-total { margin-left: auto; font-family: var(--font-display); font-weight: 700; color: var(--color-ink); }
	.svc-meta { position: relative; margin-top: 0.3rem; font-size: 0.82rem; color: var(--color-muted); display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.svc-live { color: var(--color-sage); }
	.svc-note { position: relative; margin: 0.5rem 0 0; font-size: 0.82rem; color: var(--color-faint); line-height: 1.5; }

	.units { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7rem; }
	.unit { background: var(--color-canvas-soft); border-radius: 10px; padding: 1rem 1.1rem; display: flex; flex-direction: column; }
	.u-val { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-ink); }
	.u-label { font-size: 0.82rem; color: var(--color-muted); margin-top: 0.2rem; }

	@media (min-width: 640px) { .units { grid-template-columns: repeat(4, 1fr); } }
</style>
