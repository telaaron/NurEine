<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { PencilSquareIcon, EyeIcon } from 'heroicons-svelte/24/outline';

	let { data, form } = $props();

	let editing = $state(false);
	// Startwert bewusst einmalig: der Entwurf koppelt sich beim Öffnen des
	// Editors neu an data.content, soll danach aber unabhängig bleiben.
	// svelte-ignore state_referenced_locally
	let draft = $state(data.content);
	let saving = $state(false);

	// Sehr schlanker Markdown-Renderer für die Leseansicht. Bewusst KEINE
	// Bibliothek: das Dokument ist eigener, vertrauenswürdiger Inhalt und wir
	// brauchen nur Überschriften, Listen, Tabellen, Zitate und Code.
	function esc(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function inline(s: string): string {
		return esc(s)
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
	}

	const html = $derived.by(() => {
		const lines = data.content.split('\n');
		const out: string[] = [];
		let inCode = false;
		let listOpen = false;
		let tableRows: string[][] = [];

		const flushList = () => {
			if (listOpen) {
				out.push('</ul>');
				listOpen = false;
			}
		};
		const flushTable = () => {
			if (!tableRows.length) return;
			const [head, ...body] = tableRows.filter((r) => !r.every((c) => /^-+:?$|^:?-+$/.test(c.trim())));
			out.push('<div class="tbl-wrap"><table><thead><tr>');
			for (const c of head) out.push(`<th>${inline(c.trim())}</th>`);
			out.push('</tr></thead><tbody>');
			for (const row of body) {
				out.push('<tr>');
				for (const c of row) out.push(`<td>${inline(c.trim())}</td>`);
				out.push('</tr>');
			}
			out.push('</tbody></table></div>');
			tableRows = [];
		};

		for (const raw of lines) {
			const line = raw;

			if (line.trim().startsWith('```')) {
				flushList();
				flushTable();
				out.push(inCode ? '</code></pre>' : '<pre><code>');
				inCode = !inCode;
				continue;
			}
			if (inCode) {
				out.push(esc(line) + '\n');
				continue;
			}

			// Tabellenzeile
			if (/^\s*\|.*\|\s*$/.test(line)) {
				flushList();
				tableRows.push(line.trim().replace(/^\||\|$/g, '').split('|'));
				continue;
			}
			flushTable();

			const h = line.match(/^(#{1,4})\s+(.*)$/);
			if (h) {
				flushList();
				const lvl = h[1].length;
				out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
				continue;
			}

			if (/^\s*>\s?/.test(line)) {
				flushList();
				out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ''))}</blockquote>`);
				continue;
			}

			const li = line.match(/^\s*[-*]\s+(.*)$/);
			if (li) {
				if (!listOpen) {
					out.push('<ul>');
					listOpen = true;
				}
				out.push(`<li>${inline(li[1])}</li>`);
				continue;
			}
			flushList();

			if (/^\s*---+\s*$/.test(line)) {
				out.push('<hr />');
				continue;
			}
			if (line.trim() === '') continue;
			out.push(`<p>${inline(line)}</p>`);
		}
		flushList();
		flushTable();
		if (inCode) out.push('</code></pre>');
		return out.join('\n');
	});

	function fmtDate(iso: string | null): string {
		if (!iso) return 'unbekannt';
		return new Date(iso).toLocaleString('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head><title>Vision & Roadmap — Admin</title></svelte:head>

<div class="head">
	<div>
		<h1 class="display">Vision & Roadmap</h1>
		<p class="sub">
			Pflichtlektüre für alle Claude-Sessions. Einzige verbindliche Quelle für Zielbild und
			interne Roadmap. Datei: <code>VISION.md</code> · Stand: {fmtDate(data.modifiedAt)}
		</p>
	</div>
	{#if data.readable}
		<button type="button" class="toggle" onclick={() => { editing = !editing; draft = data.content; }}>
			<Icon icon={editing ? EyeIcon : PencilSquareIcon} size="0.95rem" />
			{editing ? 'Lesen' : 'Bearbeiten'}
		</button>
	{/if}
</div>

{#if !data.readable}
	<div class="note err">
		<strong>VISION.md nicht lesbar.</strong> Die Datei liegt im Repo-Wurzelverzeichnis. Auf der
		Live-Umgebung ist sie je nach Bundling nicht unter <code>process.cwd()</code> auffindbar —
		lokal im Dev-Server funktioniert die Ansicht.
	</div>
{:else}
	<div class="note">
		<strong>Bearbeiten funktioniert nur lokal.</strong> Auf Vercel ist das Dateisystem
		schreibgeschützt; dort ist diese Seite nur zum Lesen. Änderungen schreibt der lokale
		Dev-Server direkt in <code>VISION.md</code> — danach committen nicht vergessen.
	</div>
{/if}

{#if form?.error}
	<div class="note err">{form.error}</div>
{:else if form?.saved}
	<div class="note ok">Gespeichert. Nicht vergessen: <code>git commit</code>.</div>
{/if}

{#if editing}
	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
				editing = false;
			};
		}}
	>
		<textarea name="content" bind:value={draft} spellcheck="false"></textarea>
		<div class="actions">
			<button type="submit" class="primary" disabled={saving}>
				{saving ? 'Speichern…' : 'Speichern'}
			</button>
			<button type="button" onclick={() => { editing = false; draft = data.content; }}>Abbrechen</button>
			<span class="count">{draft.length.toLocaleString('de-DE')} Zeichen</span>
		</div>
	</form>
{:else}
	<article class="doc">{@html html}</article>
{/if}

<style>
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	h1 {
		font-size: 1.75rem;
		color: var(--color-ink);
		font-weight: 600;
	}
	.sub {
		margin-top: 0.4rem;
		max-width: 62ch;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-muted);
		font-family: var(--font-serif);
	}
	.toggle,
	.actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		border: 1px solid var(--color-rule);
		background: var(--color-paper);
		color: var(--color-ink-soft);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.toggle:hover,
	.actions button:hover {
		border-color: var(--color-rule-strong);
	}
	.actions .primary {
		background: var(--color-surface-ink);
		color: var(--color-on-ink);
		border-color: transparent;
	}
	.note {
		margin-top: 1.25rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.82rem;
		line-height: 1.5;
		background: var(--color-canvas-soft);
		border-left: 3px solid var(--color-amber);
		color: var(--color-ink-soft);
	}
	.note.err {
		border-left-color: var(--color-rose);
	}
	.note.ok {
		border-left-color: var(--color-sage);
	}
	textarea {
		margin-top: 1.25rem;
		width: 100%;
		min-height: 70vh;
		padding: 1rem;
		border-radius: 10px;
		border: 1px solid var(--color-rule);
		background: var(--color-paper);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: 0.78rem;
		line-height: 1.6;
		resize: vertical;
	}
	.actions {
		margin-top: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.count {
		font-size: 0.72rem;
		color: var(--color-faint);
		font-family: var(--font-mono);
	}

	.doc {
		margin-top: 1.5rem;
		max-width: 78ch;
		color: var(--color-ink-soft);
		font-family: var(--font-serif);
		line-height: 1.65;
	}
	.doc :global(h1),
	.doc :global(h2),
	.doc :global(h3),
	.doc :global(h4) {
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-weight: 600;
		line-height: 1.25;
	}
	.doc :global(h1) {
		font-size: 1.5rem;
		margin: 2rem 0 0.75rem;
	}
	.doc :global(h2) {
		font-size: 1.2rem;
		margin: 2rem 0 0.6rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-rule);
	}
	.doc :global(h3) {
		font-size: 1rem;
		margin: 1.4rem 0 0.4rem;
	}
	.doc :global(h4) {
		font-size: 0.9rem;
		margin: 1.1rem 0 0.3rem;
	}
	.doc :global(p) {
		margin: 0.6rem 0;
	}
	.doc :global(ul) {
		margin: 0.6rem 0;
		padding-left: 1.2rem;
		list-style: disc;
	}
	.doc :global(li) {
		margin: 0.25rem 0;
	}
	.doc :global(blockquote) {
		margin: 0.8rem 0;
		padding: 0.5rem 0 0.5rem 1rem;
		border-left: 3px solid var(--color-amber);
		background: var(--color-canvas-soft);
		color: var(--color-ink);
	}
	.doc :global(code) {
		font-family: var(--font-mono);
		font-size: 0.82em;
		background: var(--color-canvas-soft);
		padding: 0.1em 0.35em;
		border-radius: 4px;
	}
	.doc :global(pre) {
		margin: 0.8rem 0;
		padding: 0.9rem;
		border-radius: 8px;
		background: var(--color-canvas-soft);
		border: 1px solid var(--color-rule);
		overflow-x: auto;
	}
	.doc :global(pre code) {
		background: none;
		padding: 0;
		font-size: 0.75rem;
		line-height: 1.55;
	}
	.doc :global(hr) {
		margin: 1.5rem 0;
		border: 0;
		border-top: 1px solid var(--color-rule);
	}
	.doc :global(a) {
		color: var(--color-amber);
		border-bottom: 1px solid var(--color-rule-strong);
	}
	/* Breite Tabellen scrollen in sich, die Seite nie horizontal. */
	.doc :global(.tbl-wrap) {
		overflow-x: auto;
		margin: 0.9rem 0;
	}
	.doc :global(table) {
		border-collapse: collapse;
		width: 100%;
		font-family: var(--font-sans);
		font-size: 0.8rem;
	}
	.doc :global(th),
	.doc :global(td) {
		text-align: left;
		padding: 0.45rem 0.7rem;
		border-bottom: 1px solid var(--color-rule);
		vertical-align: top;
	}
	.doc :global(th) {
		color: var(--color-ink);
		font-weight: 600;
		white-space: nowrap;
	}
</style>
