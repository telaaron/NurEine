<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();
	let items = $state(data.submissions);

	async function moderate(id: number, status: 'approved' | 'rejected') {
		const res = await fetch(`${base}/api/admin/submissions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, status })
		});
		const r = await res.json().catch(() => ({}));
		if (res.ok) items = items.map((s) => (s.id === id ? { ...s, status, storyId: r.storyId ?? null } : s));
	}

	function badgeColor(s: string) {
		return s === 'approved' ? 'var(--color-sage)' : s === 'rejected' ? 'var(--color-rose)' : 'var(--color-amber)';
	}
</script>

<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Einsendungen</h1>
<p class="mt-1 text-sm" style="color: var(--color-muted);">Community-eingereichte Geschichten. Genehmigte manuell als Story anlegen.</p>

<div class="mt-6 flex flex-col gap-3">
	{#each items as s (s.id)}
		<div class="paper rounded-[10px] p-5" style="border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
			<div class="flex items-start justify-between gap-4 flex-wrap">
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2 mb-1.5" style="font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase;">
						<span style="color: {badgeColor(s.status)};">● {s.status}</span>
						{#if s.category}<span style="color: var(--color-faint);">· {s.category}</span>{/if}
						{#if s.region}<span style="color: var(--color-faint);">· {s.region}</span>{/if}
					</div>
					<h3 class="display text-lg leading-tight" style="color: var(--color-ink); font-weight: 600;">{s.title}</h3>
					{#if s.reason}<p class="mt-1.5 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{s.reason}</p>{/if}
					<div class="mt-2 flex flex-wrap gap-3 text-xs" style="color: var(--color-muted);">
						<a href={s.source_url} target="_blank" rel="noreferrer" class="underline">Quelle ↗</a>
						{#if s.submitter_email}<span>{s.submitter_email}</span>{/if}
						<span>{new Date(s.created_at).toLocaleDateString('de-DE')}</span>
					</div>
				</div>
				{#if s.status === 'pending'}
					<div class="flex gap-2 shrink-0">
						<button type="button" onclick={() => moderate(s.id, 'approved')} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: var(--color-sage); color: var(--color-paper);">Genehmigen</button>
						<button type="button" onclick={() => moderate(s.id, 'rejected')} class="px-3 py-1.5 rounded-full text-xs font-medium" style="background: transparent; color: var(--color-rose); border: 1px solid var(--color-rose);">Ablehnen</button>
					</div>
				{:else if s.status === 'approved' && s.storyId}
					<a href={base + '/admin/stories/' + s.storyId + '/edit'} class="px-3 py-1.5 rounded-full text-xs font-medium shrink-0" style="background: var(--color-ink); color: var(--color-paper);">Story bearbeiten →</a>
				{/if}
			</div>
		</div>
	{:else}
		<p class="text-sm" style="color: var(--color-faint); font-family: var(--font-serif);">Noch keine Einsendungen.</p>
	{/each}
</div>
