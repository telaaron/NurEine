<script lang="ts">
	let { data } = $props();

	// ElevenLabs Free-Tier ≈ 10.000 Zeichen/Monat (gleicher Richtwert wie /admin/audio).
	const ELEVEN_FREE_LIMIT = 10000;
	const elevenUsed = $derived(data.elevenChars ?? 0);
	const elevenPct = $derived(Math.min(100, Math.round((elevenUsed / ELEVEN_FREE_LIMIT) * 100)));

	function money(v: number, currency: string): string {
		try {
			return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);
		} catch {
			return `${v.toFixed(2)} ${currency}`;
		}
	}

	const num = (v: number) => v.toLocaleString('de-DE');

	const falEmpty = $derived(data.fal.configured && data.fal.balance !== null && data.fal.balance <= 0);
	const deepseekEmpty = $derived(data.deepseek.configured && !data.deepseek.error && !data.deepseek.available);
</script>

<p class="text-xs uppercase tracking-[0.18em] mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Cockpit</p>
<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Kosten</h1>
<p class="mt-2 text-sm" style="color: var(--color-muted);">Guthaben aller Dienste live, Nutzung der letzten 30 Tage und was das ungefähr kostet.</p>

<!-- Guthaben-Karten -->
<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<!-- DeepSeek -->
	<div class="paper rounded-[10px] p-5" style="border: 1px solid {deepseekEmpty ? 'var(--color-rose)' : 'var(--color-rule)'};">
		<p class="text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">DeepSeek · Guthaben</p>
		{#if !data.deepseek.configured}
			<p class="mt-3 text-sm" style="color: var(--color-faint);">Key nicht gesetzt.</p>
		{:else if data.deepseek.error}
			<p class="mt-3 text-sm" style="color: var(--color-rose);">Nicht abrufbar (API-Fehler).</p>
		{:else}
			{#each data.deepseek.balances as b}
				<p class="mt-2 display text-2xl" style="color: var(--color-ink); font-weight: 600;">{money(b.total, b.currency)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">davon aufgeladen {money(b.toppedUp, b.currency)} · Geschenk {money(b.granted, b.currency)}</p>
			{:else}
				<p class="mt-3 text-sm" style="color: var(--color-faint);">Kein Guthaben-Eintrag.</p>
			{/each}
			{#if deepseekEmpty}
				<p class="mt-2 text-xs font-medium" style="color: var(--color-rose);">Guthaben erschöpft — Story-Scoring blockiert.</p>
			{/if}
		{/if}
	</div>

	<!-- fal.ai -->
	<div class="paper rounded-[10px] p-5" style="border: 1px solid {falEmpty ? 'var(--color-rose)' : 'var(--color-rule)'};">
		<p class="text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">fal.ai · Guthaben</p>
		{#if !data.fal.configured}
			<p class="mt-3 text-sm" style="color: var(--color-faint);">Key nicht gesetzt.</p>
		{:else if data.fal.error === 'unauthorized'}
			<p class="mt-3 text-sm" style="color: var(--color-muted);">Key hat keine Account-Berechtigung — Guthaben nur im <a href="https://fal.ai/dashboard/billing" target="_blank" class="underline">fal-Dashboard</a> sichtbar.</p>
		{:else if data.fal.error}
			<p class="mt-3 text-sm" style="color: var(--color-rose);">Nicht abrufbar (API-Fehler).</p>
		{:else if data.fal.balance !== null}
			<p class="mt-2 display text-2xl" style="color: var(--color-ink); font-weight: 600;">{money(data.fal.balance, data.fal.currency)}</p>
			{#if falEmpty}
				<p class="mt-2 text-xs font-medium" style="color: var(--color-rose);">Guthaben leer — alle Bild-Generierungen blockiert (Backfill + Fetch-Cron).</p>
			{:else}
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">reicht für ~{num(Math.floor(data.fal.balance / data.est.falPerImage))} Bilder</p>
			{/if}
		{:else}
			<p class="mt-3 text-sm" style="color: var(--color-faint);">Kein Guthaben-Eintrag.</p>
		{/if}
	</div>

	<!-- Brevo -->
	<div class="paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">Brevo · Plan</p>
		{#if !data.brevo.configured}
			<p class="mt-3 text-sm" style="color: var(--color-faint);">Key nicht gesetzt.</p>
		{:else if data.brevo.error}
			<p class="mt-3 text-sm" style="color: var(--color-rose);">Nicht abrufbar (API-Fehler).</p>
		{:else}
			{#each data.brevo.plans as p}
				<p class="mt-2 display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(p.credits)} <span class="text-sm font-normal" style="color: var(--color-muted);">Credits</span></p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">{p.type} · {p.creditsType}</p>
			{:else}
				<p class="mt-3 text-sm" style="color: var(--color-faint);">Kein Plan-Eintrag.</p>
			{/each}
		{/if}
	</div>
</div>

<!-- Geschätzte Ausgaben -->
<div class="mt-6 paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
	<div class="flex items-baseline justify-between mb-3">
		<p class="text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">Geschätzte Ausgaben (30 Tage)</p>
		<span class="display text-xl" style="color: var(--color-ink); font-weight: 600;">≈ {money(data.est.totalUsd, 'USD')}</span>
	</div>
	<div class="flex flex-col divide-y" style="--tw-divide-opacity: 1;">
		<div class="flex items-center justify-between py-2.5" style="border-color: var(--color-rule);">
			<div>
				<p class="text-sm font-medium" style="color: var(--color-ink);">fal.ai — Bilder (FLUX.1 pro)</p>
				<p class="text-xs" style="color: var(--color-faint);">{num(data.usage30d.images)} Bilder × {money(data.est.falPerImage, 'USD')}</p>
			</div>
			<span class="text-sm font-medium" style="color: var(--color-ink);">≈ {money(data.est.falUsd, 'USD')}</span>
		</div>
		<div class="flex items-center justify-between py-2.5 border-t" style="border-color: var(--color-rule);">
			<div>
				<p class="text-sm font-medium" style="color: var(--color-ink);">DeepSeek — Story-Scoring</p>
				<p class="text-xs" style="color: var(--color-faint);">{num(data.usage30d.deepseekCalls)} Calls × {money(data.est.deepseekPerCall, 'USD')} (ohne Backfill-Skripte)</p>
			</div>
			<span class="text-sm font-medium" style="color: var(--color-ink);">≈ {money(data.est.deepseekUsd, 'USD')}</span>
		</div>
		<div class="flex items-center justify-between py-2.5 border-t" style="border-color: var(--color-rule);">
			<div>
				<p class="text-sm font-medium" style="color: var(--color-ink);">ElevenLabs — Vorlesen</p>
				<p class="text-xs" style="color: var(--color-faint);">{num(elevenUsed)} Zeichen · Free-Tier</p>
			</div>
			<span class="text-sm font-medium" style="color: var(--color-ink);">0&nbsp;€</span>
		</div>
		<div class="flex items-center justify-between py-2.5 border-t" style="border-color: var(--color-rule);">
			<div>
				<p class="text-sm font-medium" style="color: var(--color-ink);">Brevo — Newsletter</p>
				<p class="text-xs" style="color: var(--color-faint);">{num(data.brevo.stats?.requests ?? 0)} Mails versendet · Free-Tier</p>
			</div>
			<span class="text-sm font-medium" style="color: var(--color-ink);">0&nbsp;€</span>
		</div>
	</div>
	<p class="mt-3 text-xs" style="color: var(--color-faint);">Schätzwerte aus eigenen Logs × Stückpreis (Stand Juni 2026). Exakte Abrechnung steht im Dashboard des jeweiligen Anbieters.</p>
</div>

<!-- Nutzungs-Details -->
<div class="mt-6 grid gap-4 lg:grid-cols-2">
	<!-- DeepSeek-Pipeline -->
	<div class="paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Pipeline (30 Tage)</p>
		<div class="grid grid-cols-3 gap-3 text-center">
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.usage30d.stories)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">Stories neu</p>
			</div>
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.usage30d.accepted)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">KI angenommen</p>
			</div>
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.usage30d.rejectedAi)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">KI abgelehnt</p>
			</div>
		</div>
		<p class="mt-3 text-xs" style="color: var(--color-faint);">{num(data.usage30d.images)} Stories mit Bild erstellt. Jede KI-Entscheidung = 1 DeepSeek-Call.</p>
	</div>

	<!-- ElevenLabs-Kontingent -->
	<div class="paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
		<div class="flex items-baseline justify-between mb-2">
			<p class="text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">ElevenLabs (30 Tage)</p>
			<span class="text-xs" style="color: var(--color-muted);">{num(elevenUsed)} / ~{num(ELEVEN_FREE_LIMIT)} Zeichen</span>
		</div>
		{#if data.elevenConfigured && data.elevenChars !== null}
			<div class="h-3 rounded-full overflow-hidden" style="background: var(--color-rule);">
				<div class="h-full rounded-full" style="width: {elevenPct}%; background: {elevenPct > 85 ? 'var(--color-rose)' : 'var(--color-amber)'};"></div>
			</div>
			<p class="mt-2 text-xs" style="color: var(--color-faint);">{elevenPct}% des Free-Tier-Richtwerts. Details und Test-Vertonung unter <a href="/admin/audio" class="underline">Vorlesen</a>.</p>
		{:else}
			<p class="text-sm" style="color: var(--color-faint);">{data.elevenConfigured ? 'Nutzung nicht abrufbar.' : 'Key nicht gesetzt.'}</p>
		{/if}
	</div>
</div>

<!-- Brevo-Details -->
{#if data.brevo.stats}
	<div class="mt-4 paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Newsletter-Versand (30 Tage)</p>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.brevo.stats.requests)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">versendet</p>
			</div>
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.brevo.stats.delivered)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">zugestellt</p>
			</div>
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.brevo.stats.uniqueOpens)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">geöffnet (unique)</p>
			</div>
			<div>
				<p class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">{num(data.brevo.stats.hardBounces)}</p>
				<p class="text-xs mt-0.5" style="color: var(--color-faint);">Hard Bounces</p>
			</div>
		</div>
	</div>
{/if}
