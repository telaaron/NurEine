<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();
	// UI-Felder (_dirty, _hashtagsStr) sind clientseitig — erweiterter Typ.
	type UiPost = Omit<(typeof data.posts)[number], 'status'> & { status: string; _dirty?: boolean; _hashtagsStr?: string };
	let items = $state<UiPost[]>(data.posts);
	let analytics = $state(data.analytics);
	let busy = $state<number | null>(null);
	let genMsg = $state('');
	let autopilot = $state(data.autopilot);
	let postingAll = $state(false);

	async function toggleAutopilot() {
		const { ok, data: r } = await api({ action: 'toggle-autopilot' });
		if (ok) autopilot = r.autopilot;
	}

	async function postAll() {
		if (!confirm('ALLE freigegebenen + Entwurf-Posts JETZT auf Instagram veröffentlichen? (kann IG-Rate-Limit treffen)')) return;
		postingAll = true;
		const { ok, data: r } = await api({ action: 'post-all' });
		postingAll = false;
		if (ok) {
			alert(`${r.posted}/${r.total} gepostet.` + (r.errors?.length ? '\nFehler:\n' + r.errors.join('\n') : ''));
			location.reload();
		} else alert('Fehlgeschlagen.');
	}

	// IG-Feed-Vorschau = Carousel-Folie 1 (4:5), mit A/B-Stil. Aus og_url abgeleitet.
	function slideUrl(p: any, n: number): string {
		const m = (p.og_url || '').match(/^(.*)\/api\/og\/(.+)$/);
		if (!m) return p.card_url || '';
		const style = p.hook_style === 'number' ? 'number' : 'image';
		return n === 1 ? `${m[1]}/api/carousel/${m[2]}/1?style=${style}` : `${m[1]}/api/carousel/${m[2]}/${n}`;
	}

	async function api(body: Record<string, unknown>) {
		const res = await fetch(`${base}/api/admin/social`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		return { ok: res.ok, data: await res.json().catch(() => ({})) };
	}

	let replies = $state(data.replies);

	async function replyAction(id: number, action: 'reply-approve' | 'reply-reject') {
		busy = id;
		const { ok, data: r } = await api({ action, id });
		if (ok) {
			replies = replies.map((x) => (x.id === id ? { ...x, status: action === 'reply-approve' ? 'posted' : 'rejected' } : x));
		} else alert('Fehlgeschlagen: ' + (r.error || 'unbekannt'));
		busy = null;
	}

	async function setStatus(id: number, status: string) {
		busy = id;
		const { ok } = await api({ action: 'update', id, patch: { status } });
		if (ok) items = items.map((p) => (p.id === id ? { ...p, status } : p));
		busy = null;
	}

	async function postNow(p: any) {
		if (!confirm('Diesen Post JETZT auf Instagram veröffentlichen?')) return;
		busy = p.id;
		// Ungespeicherte Caption/Hashtag-Änderungen ZUERST speichern, sonst geht der alte Text live.
		if (p._dirty) {
			const hashtags = (p._hashtagsStr ?? p.hashtags.join(' '))
				.split(/\s+/).map((t: string) => t.trim()).filter(Boolean);
			const r = await api({ action: 'update', id: p.id, patch: { caption: p.caption, hashtags } });
			if (!r.ok) { alert('Speichern fehlgeschlagen — nicht gepostet.'); busy = null; return; }
			items = items.map((x) => (x.id === p.id ? { ...x, hashtags, _dirty: false } : x));
		}
		const { ok, data } = await api({ action: 'post-now', id: p.id });
		if (ok) items = items.map((x) => (x.id === p.id ? { ...x, status: 'posted' } : x));
		else alert('Posten fehlgeschlagen: ' + (data.error || 'unbekannt'));
		busy = null;
	}

	async function saveEdits(p: any) {
		busy = p.id;
		const hashtags = (p._hashtagsStr ?? p.hashtags.join(' '))
			.split(/\s+/).map((t: string) => t.trim()).filter(Boolean);
		const { ok } = await api({ action: 'update', id: p.id, patch: { caption: p.caption, hashtags } });
		if (ok) items = items.map((x) => (x.id === p.id ? { ...x, hashtags, _dirty: false } : x));
		busy = null;
	}

	async function saveSaves(p: any) {
		busy = p.id;
		await api({ action: 'update', id: p.id, patch: { saves: Number(p.saves) || 0, reach: Number(p.reach) || 0 } });
		busy = null;
	}

	async function generateNow() {
		genMsg = '…';
		const { ok, data: r } = await api({ action: 'generate' });
		genMsg = ok ? (r.created ? 'Entwurf erstellt — neu laden' : r.reason) : 'Fehler';
	}

	function statusColor(s: string) {
		return s === 'posted' ? 'var(--color-sage)'
			: s === 'approved' ? 'var(--color-sky)'
			: s === 'failed' ? 'var(--color-rose)'
			: s === 'skipped' ? 'var(--color-faint)'
			: 'var(--color-amber)';
	}
</script>

<div class="flex items-center justify-between gap-4 flex-wrap">
	<div>
		<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Social — Instagram-Queue</h1>
		<p class="mt-1 text-sm" style="color: var(--color-muted);">Trockenlauf: Entwürfe prüfen, editieren, freigeben. Nichts geht ohne dein OK raus.</p>
	</div>
	<div class="flex items-center gap-3 flex-wrap">
		{#if genMsg}<span class="text-xs" style="color: var(--color-muted); font-family: var(--font-mono);">{genMsg}</span>{/if}
		<!-- Autopilot-Toggle -->
		<button type="button" onclick={toggleAutopilot} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: {autopilot ? 'var(--color-sage)' : 'transparent'}; color: {autopilot ? 'var(--color-paper)' : 'var(--color-muted)'}; border: 1px solid {autopilot ? 'var(--color-sage)' : 'var(--color-rule-strong)'};">
			Autopilot: {autopilot ? 'AN' : 'aus'}
		</button>
		<button type="button" disabled={postingAll} onclick={postAll} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: var(--color-amber); color: var(--color-paper);">{postingAll ? 'poste…' : 'Alle posten ↗'}</button>
		<button type="button" onclick={generateNow} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: var(--color-ink); color: var(--color-paper);">Heute-Entwurf erzeugen</button>
	</div>
</div>

<!-- A/B-Auswertung -->
{#if analytics.byHook.length || analytics.byCategory.length || analytics.byStyle?.length}
	<div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="paper rounded-[10px] p-4" style="border: 1px solid var(--color-rule);">
			<p class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Ø Saves nach Folie-1-Stil</p>
			{#each analytics.byStyle ?? [] as s}
				<div class="flex justify-between text-sm py-0.5"><span style="color: var(--color-ink-soft);">{s.hook_style} <span style="color: var(--color-faint);">({s.posts})</span></span><span style="font-weight:600;">{s.avgSaves}</span></div>
			{:else}
				<div class="text-sm" style="color: var(--color-faint);">noch keine Daten</div>
			{/each}
		</div>
		<div class="paper rounded-[10px] p-4" style="border: 1px solid var(--color-rule);">
			<p class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Ø Saves nach Hook</p>
			{#each analytics.byHook as h}
				<div class="flex justify-between text-sm py-0.5"><span style="color: var(--color-ink-soft);">{h.hook_type} <span style="color: var(--color-faint);">({h.posts})</span></span><span style="font-weight:600;">{h.avgSaves}</span></div>
			{/each}
		</div>
		<div class="paper rounded-[10px] p-4" style="border: 1px solid var(--color-rule);">
			<p class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-amber); font-family: var(--font-mono);">Ø Saves nach Kategorie</p>
			{#each analytics.byCategory as c}
				<div class="flex justify-between text-sm py-0.5"><span style="color: var(--color-ink-soft);">{c.category} <span style="color: var(--color-faint);">({c.posts})</span></span><span style="font-weight:600;">{c.avgSaves}</span></div>
			{/each}
		</div>
	</div>
{/if}

<!-- IG-Stories: automatisch, kurze Eilmeldung (1 Bild, keine Slides, kein Approval) -->
<div class="mt-6 paper rounded-[10px] p-4" style="border: 1px solid var(--color-rule);">
	<p class="text-xs uppercase tracking-wider mb-1" style="color: var(--color-amber); font-family: var(--font-mono);">📱 IG-Stories — automatisch</p>
	<p class="text-xs mb-3" style="color: var(--color-muted);">Jede frische Story läuft über den Tag verteilt als 9:16-Story (1 Bild, kurze Zusammenfassung). Keine Slides, kein Freigeben nötig.</p>
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
		<div><div class="text-2xl font-semibold" style="color: var(--color-ink);">{data.storyStats.today}</div><div class="text-xs" style="color: var(--color-muted);">heute gepostet</div></div>
		<div><div class="text-2xl font-semibold" style="color: var(--color-ink);">{data.storyStats.total}</div><div class="text-xs" style="color: var(--color-muted);">gesamt (40 letzte)</div></div>
		<div><div class="text-2xl font-semibold" style="color: var(--color-ink);">{data.storyStats.totalReach}</div><div class="text-xs" style="color: var(--color-muted);">Reach gesamt</div></div>
		<div><div class="text-2xl font-semibold" style="color: var(--color-ink);">{data.storyStats.totalSaves}</div><div class="text-xs" style="color: var(--color-muted);">Saves gesamt</div></div>
	</div>
	{#if data.recentStories.length}
		<div class="flex gap-2 overflow-x-auto pb-1">
			{#each data.recentStories as s}
				<div class="shrink-0 text-center">
					<img src={s.card_url} alt="Story" width="90" height="160" loading="lazy" style="width:90px;height:160px;object-fit:cover;border-radius:6px;border:1px solid var(--color-rule);" />
					<div class="mt-1 text-xs" style="color: var(--color-faint); font-family: var(--font-mono);">{new Date(s.posted_at).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' })}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- KI-Kommentar-Antworten — Freigabe-Queue (KI entwirft, Mensch gibt frei) -->
<div class="mt-6 paper rounded-[10px] p-4" style="border: 1px solid var(--color-rule);">
	<p class="text-xs uppercase tracking-wider mb-1" style="color: var(--color-amber); font-family: var(--font-mono);">KI-Kommentar-Antworten — Freigabe-Queue</p>
	<p class="text-xs mb-3" style="color: var(--color-muted);">KI entwirft Antworten auf positive/Frage-Kommentare — gepostet wird erst nach deiner Freigabe. Troll/Spam/Hass werden still übersprungen.</p>
	{#if replies.length}
		<div class="flex flex-col gap-2">
			{#each replies as rep (rep.id)}
				<div class="text-sm p-3 rounded" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
					<div style="color: var(--color-ink-soft);">💬 {rep.comment_text}</div>
					{#if rep.reply_text}
						<div class="mt-1" style="color: var(--color-sage);">↳ {rep.reply_text}</div>
						{#if rep.status === 'pending'}
							<div class="mt-2 flex gap-2">
								<button class="px-3 py-1 rounded text-xs" style="background: var(--color-ink); color: var(--color-canvas);"
									disabled={busy === rep.id} onclick={() => replyAction(rep.id, 'reply-approve')}>Antworten</button>
								<button class="px-3 py-1 rounded text-xs" style="border: 1px solid var(--color-rule); color: var(--color-muted);"
									disabled={busy === rep.id} onclick={() => replyAction(rep.id, 'reply-reject')}>Verwerfen</button>
							</div>
						{:else}
							<div class="mt-1 text-xs" style="color: var(--color-faint);">{rep.status === 'posted' ? '✓ gepostet' : rep.status === 'rejected' ? 'verworfen' : rep.status}</div>
						{/if}
					{:else}
						<div class="mt-1" style="color: var(--color-faint);">↳ übersprungen: {rep.skipped_reason}</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm" style="color: var(--color-faint);">Noch keine Kommentare in der Queue.</p>
	{/if}
</div>

<h2 class="mt-8 text-xs uppercase tracking-wider" style="color: var(--color-amber); font-family: var(--font-mono);">📷 Feed-Posts (Carousel) — Freigabe-Queue</h2>
<div class="mt-3 flex flex-col gap-4">
	{#each items as p (p.id)}
		<div class="paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
			<div class="flex gap-5 flex-col sm:flex-row">
				<!-- IG-Vorschau: Folie 1 (4:5, der Daumen-Stopper) -->
				<div class="shrink-0">
					<img src={slideUrl(p, 1)} alt="Folie 1" width="180" height="225" loading="lazy" style="width:180px;height:225px;object-fit:cover;border-radius:8px;border:1px solid var(--color-rule);" />
					<div class="mt-1 text-center text-xs" style="color: var(--color-faint); font-family: var(--font-mono);">4:5 · {p.hook_style}</div>
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2 mb-2" style="font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase;">
						<span style="color: {statusColor(p.status)};">● {p.status}</span>
						<span style="color: var(--color-faint);">· {p.hook_type}</span>
						{#if p.category}<span style="color: var(--color-faint);">· {p.category}</span>{/if}
						{#if p.scheduled_for}<span style="color: var(--color-faint);">· {new Date(p.scheduled_for).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>{/if}
					</div>

					<textarea bind:value={p.caption} oninput={() => (p._dirty = true)} rows="5"
						class="w-full text-sm leading-relaxed p-2 rounded"
						style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink-soft); font-family: var(--font-serif); white-space: pre-wrap;"></textarea>

					<input type="text" value={p.hashtags.join(' ')} oninput={(e) => { p._hashtagsStr = e.currentTarget.value; p._dirty = true; }}
						class="w-full mt-2 text-xs p-2 rounded" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-amber); font-family: var(--font-mono);" />

					<div class="mt-3 flex items-center gap-2 flex-wrap">
						{#if p._dirty}
							<button type="button" disabled={busy === p.id} onclick={() => saveEdits(p)} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: var(--color-ink); color: var(--color-paper);">Speichern</button>
						{/if}
						{#if p.status === 'draft' || p.status === 'skipped'}
							<button type="button" disabled={busy === p.id} onclick={() => setStatus(p.id, 'approved')} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: var(--color-sage); color: var(--color-paper);">Freigeben</button>
						{/if}
						{#if p.status !== 'posted'}
							<button type="button" disabled={busy === p.id} onclick={() => postNow(p)} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: var(--color-amber); color: var(--color-paper);">Jetzt posten ↗</button>
						{/if}
						{#if p.status === 'draft' || p.status === 'approved'}
							<button type="button" disabled={busy === p.id} onclick={() => setStatus(p.id, 'skipped')} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: transparent; color: var(--color-rose); border: 1px solid var(--color-rose);">Verwerfen</button>
						{/if}
						{#if p.status === 'approved'}
							<button type="button" disabled={busy === p.id} onclick={() => setStatus(p.id, 'draft')} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: transparent; color: var(--color-muted); border: 1px solid var(--color-rule-strong);">Zurück zu Entwurf</button>
						{/if}
						<a href={slideUrl(p, 1)} target="_blank" rel="noreferrer" class="text-xs underline" style="color: var(--color-muted);">Folie 1 ↗</a>
						<a href={slideUrl(p, 2)} target="_blank" rel="noreferrer" class="text-xs underline" style="color: var(--color-muted);">2 ↗</a>
						<a href={slideUrl(p, 3)} target="_blank" rel="noreferrer" class="text-xs underline" style="color: var(--color-muted);">3 ↗</a>
						{#if p.card_url}<a href={p.card_url} target="_blank" rel="noreferrer" class="text-xs underline" style="color: var(--color-faint);">WA-Karte ↗</a>{/if}
					</div>

					{#if p.status === 'posted'}
						<div class="mt-3 flex items-center gap-2 text-xs" style="color: var(--color-muted);">
							<span>Saves</span>
							<input type="number" bind:value={p.saves} class="w-16 px-2 py-1 rounded" style="border:1px solid var(--color-rule);" />
							<span>Reach</span>
							<input type="number" bind:value={p.reach} class="w-20 px-2 py-1 rounded" style="border:1px solid var(--color-rule);" />
							<button type="button" onclick={() => saveSaves(p)} class="px-2 py-1 rounded-full" style="background: var(--color-amber); color: var(--color-paper);">OK</button>
						</div>
					{/if}
					{#if p.error}<p class="mt-2 text-xs" style="color: var(--color-rose);">{p.error}</p>{/if}
				</div>
			</div>
		</div>
	{:else}
		<p class="text-sm" style="color: var(--color-faint); font-family: var(--font-serif);">Noch keine Entwürfe. Klick „Heute-Entwurf erzeugen" oder warte auf den Cron.</p>
	{/each}
</div>
