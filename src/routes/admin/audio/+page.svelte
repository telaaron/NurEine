<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();

	// ElevenLabs Free-Tier ≈ 10.000 Zeichen/Monat (Richtwert für die Anzeige).
	const FREE_LIMIT = 10000;
	const used = $derived(data.usage?.totalChars ?? 0);
	const pct = $derived(Math.min(100, Math.round((used / FREE_LIMIT) * 100)));

	let voiced = $state(data.voiced);

	// Test-Vertonung
	let selectedId = $state(data.candidates[0]?.id ?? '');
	let mode = $state<'summary' | 'full'>('summary');
	let busy = $state(false);
	let status = $state('');
	let lastUrl = $state('');
	let lastInfo = $state<{ emotion: string | null; chars: number; model: string } | null>(null);

	async function generate() {
		if (!selectedId || busy) return;
		busy = true; status = 'Generiere Audio…'; lastUrl = '';
		try {
			const res = await fetch(`${base}/api/admin/stories/${selectedId}/generate-audio?mode=${mode}`, { method: 'POST' });
			const r = await res.json();
			if (res.ok && r.audio_url) {
				lastUrl = r.audio_url + '?t=' + Date.now();
				lastInfo = { emotion: r.emotion, chars: r.chars, model: r.model };
				status = `Fertig (${r.provider}, ${r.chars} Zeichen, Emotion: ${r.emotion ?? '—'}).`;
			} else {
				status = r.error || r.message || 'Fehlgeschlagen.';
			}
		} catch {
			status = 'Verbindungsfehler.';
		} finally {
			busy = false;
		}
	}

	// Auto-Vertonung (Pipeline Stage 8) scharf stellen / pausieren.
	let autopilot = $state(data.autopilot);
	let toggling = $state(false);
	async function toggleAutopilot() {
		if (toggling) return;
		toggling = true;
		try {
			const res = await fetch(`${base}/api/admin/audio`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggle-autopilot' })
			});
			const r = await res.json();
			if (res.ok) autopilot = r.autopilot;
		} finally {
			toggling = false;
		}
	}

	// Verwaltung: Suche über alle Stories — nachträglich vertonen / löschen.
	let rows = $state(data.search);
	$effect(() => {
		rows = data.search;
	});
	let rowBusy = $state('');
	async function generateRow(id: string, mode: 'summary' | 'full') {
		if (rowBusy) return;
		rowBusy = id;
		try {
			const res = await fetch(`${base}/api/admin/stories/${id}/generate-audio?mode=${mode}`, { method: 'POST' });
			const r = await res.json();
			if (res.ok && r.audio_url) {
				rows = rows.map((s) => (s.id === id ? { ...s, audio_url: r.audio_url + '?t=' + Date.now() } : s));
			} else {
				alert(r.error || r.message || 'Vertonen fehlgeschlagen.');
			}
		} catch {
			alert('Verbindungsfehler.');
		} finally {
			rowBusy = '';
		}
	}
	async function deleteRow(id: string, title: string) {
		if (!confirm(`Vertonung von „${title}" wirklich löschen? Der Player verschwindet aus dem Artikel.`)) return;
		rowBusy = id;
		try {
			const res = await fetch(`${base}/api/admin/stories/${id}/generate-audio`, { method: 'DELETE' });
			if (res.ok) {
				rows = rows.map((s) => (s.id === id ? { ...s, audio_url: null } : s));
				voiced = voiced.filter((v) => v.id !== id);
			} else {
				alert('Löschen fehlgeschlagen.');
			}
		} catch {
			alert('Verbindungsfehler.');
		} finally {
			rowBusy = '';
		}
	}

	let deleting = $state('');
	async function remove(id: string, title: string) {
		if (!confirm(`Vertonung von „${title}" wirklich löschen? Der Player verschwindet aus dem Artikel.`)) return;
		deleting = id;
		try {
			const res = await fetch(`${base}/api/admin/stories/${id}/generate-audio`, { method: 'DELETE' });
			if (res.ok) voiced = voiced.filter((v) => v.id !== id);
			else alert('Löschen fehlgeschlagen.');
		} catch {
			alert('Verbindungsfehler.');
		} finally {
			deleting = '';
		}
	}

	function slugify(t: string, id: string) {
		return t.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) + '-' + id.slice(0,8);
	}
</script>

<p class="text-xs uppercase tracking-[0.18em] mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Cockpit</p>
<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Vorlesen — Audio</h1>
<p class="mt-2 text-sm" style="color: var(--color-muted);">Vertonungen testen, verwalten und das ElevenLabs-Kontingent im Blick behalten.</p>

{#if !data.audioConfigured}
	<div class="mt-6 p-4 rounded-[10px]" style="background: var(--color-rose-tint); border: 1px solid var(--color-rose);">
		<p class="text-sm" style="color: var(--color-ink);">ELEVENLABS_API_KEY ist in dieser Umgebung nicht gesetzt. Vertonen funktioniert erst nach Setzen des Keys.</p>
	</div>
{/if}

<!-- Kontingent -->
<div class="mt-6 paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
	<div class="flex items-baseline justify-between mb-2">
		<p class="text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">Kontingent (30 Tage)</p>
		<span class="text-xs" style="color: var(--color-muted);">{used.toLocaleString('de-DE')} / ~{FREE_LIMIT.toLocaleString('de-DE')} Zeichen</span>
	</div>
	<div class="h-3 rounded-full overflow-hidden" style="background: var(--color-rule);">
		<div class="h-full rounded-full" style="width: {pct}%; background: {pct > 85 ? 'var(--color-rose)' : 'var(--color-amber)'};"></div>
	</div>
	<p class="mt-2 text-xs" style="color: var(--color-faint);">
		{#if data.usage}{pct}% des Free-Tier-Richtwerts genutzt. Bei ~400 Zeichen/Story reicht das für ~{Math.max(0, Math.floor((FREE_LIMIT - used) / 400))} weitere Vertonungen.{:else}Nutzung nicht abrufbar (Key fehlt oder API nicht erreichbar).{/if}
	</p>
</div>

<!-- Auto-Vertonung scharf stellen -->
<div class="mt-6 paper rounded-[10px] p-5" style="border: 1px solid {autopilot ? 'var(--color-sage)' : 'var(--color-rule)'};">
	<div class="flex items-center justify-between gap-3 flex-wrap">
		<div>
			<h2 class="display text-lg" style="color: var(--color-ink);">Auto-Vertonung</h2>
			<p class="mt-1 text-xs" style="color: var(--color-muted);">
				Scharf = Pipeline vertont nach jedem Fetch-Run automatisch die stärkste unvertonte Story
				(nur Zusammenfassung, v3 + Emotions-Tags, max. 1/Run → bis 4/Tag).
			</p>
		</div>
		<button type="button" disabled={toggling} onclick={toggleAutopilot}
			class="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
			style={autopilot
				? 'background: var(--color-sage); color: var(--color-paper);'
				: 'background: transparent; color: var(--color-muted); border: 1px solid var(--color-rule-strong);'}>
			{toggling ? '…' : autopilot ? 'SCHARF — klick zum Pausieren' : 'aus — klick zum Scharfstellen'}
		</button>
	</div>
</div>

<!-- Test-Vertonung -->
<div class="mt-6 paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
	<h2 class="display text-lg" style="color: var(--color-ink);">Test-Vertonung</h2>
	<p class="mt-1 text-xs" style="color: var(--color-muted);">Mit v3-Modell + Audio-Tags passend zur Story-Emotion. Nur auf Klick — kein Auto-Verbrauch.</p>
	<div class="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
		<select bind:value={selectedId} class="flex-1 px-3 py-2 rounded-[10px] text-sm" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink);">
			{#each data.candidates as c}
				<option value={c.id}>{c.title} · {c.impact_score} · {c.emotion ?? '—'}</option>
			{/each}
		</select>
		<div class="flex items-center gap-2">
			<button type="button" onclick={() => (mode = 'summary')} class="px-3 py-1.5 rounded-full text-xs font-medium" style={mode==='summary' ? 'background: var(--color-ink); color: var(--color-paper);' : 'background: var(--color-canvas-soft); color: var(--color-ink-soft); border: 1px solid var(--color-rule);'}>Zusammenfassung</button>
			<button type="button" onclick={() => (mode = 'full')} class="px-3 py-1.5 rounded-full text-xs font-medium" style={mode==='full' ? 'background: var(--color-ink); color: var(--color-paper);' : 'background: var(--color-canvas-soft); color: var(--color-ink-soft); border: 1px solid var(--color-rule);'}>Ganzer Artikel</button>
		</div>
		<button type="button" disabled={busy || !selectedId} onclick={generate} class="px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50" style="background: var(--color-amber); color: var(--color-paper);">{busy ? 'Generiere…' : '🔊 Vertonen'}</button>
	</div>
	{#if status}<p class="mt-3 text-xs" style="color: var(--color-muted);">{status}</p>{/if}
	{#if lastUrl}
		<!-- svelte-ignore a11y_media_has_caption -->
		<audio controls src={lastUrl} class="mt-3 w-full" style="height:40px;"></audio>
	{/if}
</div>

<!-- Alle Geschichten verwalten -->
<div class="mt-6 paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
	<h2 class="display text-lg" style="color: var(--color-ink);">Alle Geschichten</h2>
	<p class="mt-1 text-xs" style="color: var(--color-muted);">Jede Story durchsuchen, nachträglich vertonen oder die Vertonung spurlos entfernen.</p>
	<form method="GET" class="mt-3 flex gap-2">
		<input type="text" name="q" value={data.q} placeholder="Titel oder Kategorie suchen…"
			class="flex-1 px-3 py-2 rounded-[10px] text-sm"
			style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink);" />
		<button type="submit" class="px-4 py-2 rounded-full text-sm font-medium" style="background: var(--color-ink); color: var(--color-paper);">Suchen</button>
		{#if data.q}
			<a href="?" class="px-4 py-2 rounded-full text-sm font-medium" style="color: var(--color-muted); border: 1px solid var(--color-rule);">Zurücksetzen</a>
		{/if}
	</form>
	<div class="mt-4 flex flex-col gap-2">
		{#each rows as s (s.id)}
			<div class="p-3 rounded-[10px]" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<div class="min-w-0">
						<a href={base + '/geschichte/' + slugify(s.title, s.id)} target="_blank" class="font-medium text-sm hover:opacity-70" style="color: var(--color-ink);">{s.title}</a>
						<div class="text-xs mt-0.5" style="color: var(--color-faint);">
							{s.category} · Wirkung {s.impact_score} · {s.emotion ?? '—'} · {new Date(s.created_at).toLocaleDateString('de-DE')}
							{#if s.audio_url}<span style="color: var(--color-sage);"> · vertont</span>{/if}
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if s.audio_url}
							<button type="button" disabled={rowBusy === s.id} onclick={() => deleteRow(s.id, s.title)}
								class="px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50"
								style="background: transparent; color: var(--color-rose); border: 1px solid var(--color-rose);">
								{rowBusy === s.id ? '…' : 'Löschen'}
							</button>
						{:else}
							<button type="button" disabled={rowBusy === s.id} onclick={() => generateRow(s.id, 'summary')}
								class="px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50"
								style="background: var(--color-amber); color: var(--color-paper);">
								{rowBusy === s.id ? 'Generiere…' : '🔊 Zusammenfassung'}
							</button>
							<button type="button" disabled={rowBusy === s.id} onclick={() => generateRow(s.id, 'full')}
								class="px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50"
								style="background: transparent; color: var(--color-ink-soft); border: 1px solid var(--color-rule-strong);">
								Ganzer Artikel
							</button>
						{/if}
					</div>
				</div>
				{#if s.audio_url}
					<!-- svelte-ignore a11y_media_has_caption -->
					<audio controls preload="none" src={s.audio_url} class="mt-2 w-full" style="height:34px;"></audio>
				{/if}
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-faint);">Keine Treffer{data.q ? ` für „${data.q}"` : ''}.</p>
		{/each}
	</div>
</div>

<!-- Vertonte Stories -->
<div class="mt-6 paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule);">
	<p class="text-xs uppercase tracking-wider mb-3" style="color: var(--color-amber); font-family: var(--font-mono);">Vertonte Geschichten ({voiced.length})</p>
	<div class="flex flex-col gap-2">
		{#each voiced as v}
			<div class="p-3 rounded-[10px]" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<div class="min-w-0">
						<a href={base + '/geschichte/' + slugify(v.title, v.id)} target="_blank" class="font-medium text-sm hover:opacity-70" style="color: var(--color-ink);">{v.title}</a>
						<div class="text-xs mt-0.5" style="color: var(--color-faint);">{v.category} · Wirkung {v.impact_score} · {v.emotion ?? '—'}</div>
					</div>
					<button type="button" disabled={deleting === v.id} onclick={() => remove(v.id, v.title)} class="px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50" style="background: transparent; color: var(--color-rose); border: 1px solid var(--color-rose);">
						{deleting === v.id ? '…' : 'Löschen'}
					</button>
				</div>
				<!-- svelte-ignore a11y_media_has_caption -->
				<audio controls preload="none" src={v.audio_url} class="mt-2 w-full" style="height:34px;"></audio>
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-faint);">Noch keine Vertonungen.</p>
		{/each}
	</div>
</div>
