<script lang="ts">
	let { data } = $props();
	const s = $derived(data.summary);
	const num = (v: number) => v.toLocaleString('de-DE');
	function dayLabel(iso: string): string {
		return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', {
			weekday: 'short', day: '2-digit', month: '2-digit'
		});
	}
	// Farbskala für die Rate-Balken (relativ zum jeweils besten Tag).
	const maxOpen = $derived(Math.max(1, ...data.rows.map((r) => r.openRate)));
	const maxClick = $derived(Math.max(1, ...data.rows.map((r) => r.clickRate)));
</script>

<p class="text-xs uppercase tracking-[0.18em] mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Cockpit</p>
<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Newsletter</h1>
<p class="mt-2 text-sm" style="color: var(--color-muted);">Öffnungen &amp; Klicks der letzten {s.days || 30} Tage. Wie viele öffnen die Mail — und wie viele klicken zur Story.</p>

<!-- Kennzahlen -->
<div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
	<div class="stat">
		<span class="stat-label">Öffnungsrate</span>
		<span class="stat-val">{s.openRate}<span class="stat-unit">%</span></span>
		<span class="stat-sub">{num(s.opened)} von {num(s.sent)} geöffnet</span>
	</div>
	<div class="stat">
		<span class="stat-label">Klickrate</span>
		<span class="stat-val" style="color: var(--color-amber-deep);">{s.clickRate}<span class="stat-unit">%</span></span>
		<span class="stat-sub">{num(s.clicked)} klickten zur Story</span>
	</div>
	<div class="stat">
		<span class="stat-label">Versendet</span>
		<span class="stat-val">{num(s.sent)}</span>
		<span class="stat-sub">B2C, ohne B2B</span>
	</div>
	<div class="stat">
		<span class="stat-label">Klicks je Öffnung</span>
		<span class="stat-val">{s.opened ? Math.round((s.clicked / s.opened) * 100) : 0}<span class="stat-unit">%</span></span>
		<span class="stat-sub">wie viele Öffner klicken</span>
	</div>
</div>

<!-- Tagestabelle -->
{#if data.rows.length === 0}
	<p class="mt-8 text-sm" style="color: var(--color-muted);">Noch keine Versanddaten in den letzten 30 Tagen.</p>
{:else}
	<div class="mt-8 tbl">
		<div class="row head">
			<span>Tag</span><span class="r">Versendet</span><span class="r">Öffnungen</span><span class="r">Klicks</span>
		</div>
		{#each data.rows as r (r.day)}
			<div class="row">
				<span class="day">{dayLabel(r.day)}</span>
				<span class="r muted">{num(r.sent)}</span>
				<span class="r">
					<span class="bar-wrap"><span class="bar open" style="width: {(r.openRate / maxOpen) * 100}%"></span></span>
					<strong>{r.openRate}%</strong> <span class="muted small">({num(r.opened)})</span>
				</span>
				<span class="r">
					<span class="bar-wrap"><span class="bar click" style="width: {(r.clickRate / maxClick) * 100}%"></span></span>
					<strong>{r.clickRate}%</strong> <span class="muted small">({num(r.clicked)})</span>
				</span>
			</div>
		{/each}
	</div>
	<p class="mt-4 text-xs" style="color: var(--color-faint);">
		Öffnungsrate = geöffnet ÷ versendet (Brevo, „opened"). Klickrate = Story-Klicks ÷ versendet (getrackter /r-Link).
		Klick-Tracking läuft seit 25.07.
	</p>
{/if}

<style>
	.stat { background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 12px; padding: 1rem 1.1rem; display: flex; flex-direction: column; }
	.stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-muted); font-family: var(--font-mono); }
	.stat-val { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-ink); line-height: 1.1; margin: 0.3rem 0 0.2rem; }
	.stat-unit { font-size: 1rem; font-weight: 400; color: var(--color-muted); margin-left: 2px; }
	.stat-sub { font-size: 0.78rem; color: var(--color-faint); }

	.tbl { border: 1px solid var(--color-rule); border-radius: 12px; overflow: hidden; }
	.row { display: grid; grid-template-columns: 1.2fr 1fr 1.8fr 1.8fr; align-items: center; gap: 0.8rem; padding: 0.7rem 1rem; border-top: 1px solid var(--color-rule); font-size: 0.9rem; color: var(--color-ink); }
	.row:first-child { border-top: none; }
	.row.head { background: var(--color-canvas-soft); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); font-family: var(--font-mono); }
	.day { font-weight: 600; }
	.r { text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; }
	.head .r { justify-content: flex-end; }
	.muted { color: var(--color-muted); }
	.small { font-size: 0.78rem; }
	.bar-wrap { flex: 1; height: 6px; background: var(--color-canvas-soft); border-radius: 6px; overflow: hidden; max-width: 90px; }
	.bar { display: block; height: 100%; border-radius: 6px; }
	.bar.open { background: var(--color-sage); }
	.bar.click { background: var(--color-amber); }
	@media (max-width: 640px) {
		.row { grid-template-columns: 1fr 1fr; row-gap: 0.3rem; }
		.bar-wrap { display: none; }
	}
</style>
