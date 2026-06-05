<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';

	let { data } = $props();
	const cardUrl = $derived(`${base}/api/share-card/${data.slug}`);

	let copied = $state(false);
	function copyCaption() {
		navigator.clipboard?.writeText(data.caption).then(() => {
			copied = true;
			track('story_shared', { slug: data.slug, format: 'whatsapp', via: 'copy' });
			setTimeout(() => (copied = false), 1800);
		}).catch(() => {});
	}
</script>

<svelte:head>
	<title>Teilen — {data.title} — NurEine</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="mx-auto max-w-[640px] px-4 sm:px-6 py-10 sm:py-16">
	<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Teilen</span>
	<h1 class="display mt-3 text-2xl sm:text-3xl leading-tight" style="color: var(--color-ink); font-weight: 600;">
		Highlight des Tages — bereit zum Posten.
	</h1>
	<p class="mt-3 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		Lade die Karte herunter, kopiere den Text und poste ihn in deinen WhatsApp-Status oder als Story.
		Nur wenn dich die Geschichte selbst bewegt — sonst lass es.
	</p>

	<!-- Card preview (9:16) -->
	<div class="mt-8 flex justify-center">
		<div class="rounded-2xl overflow-hidden" style="width: 270px; box-shadow: var(--shadow-lg); border: 1px solid var(--color-rule);">
			<img src={cardUrl} alt="Story-Karte" width="270" height="480" style="display:block;width:270px;height:480px;object-fit:cover;" loading="eager" />
		</div>
	</div>

	<div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
		<a href={cardUrl} download={`nureine-${data.slug}.png`}
			onclick={() => track('story_shared', { slug: data.slug, format: 'whatsapp', via: 'download' })}
			class="px-6 py-3.5 rounded-full text-sm font-medium text-center transition-all active:scale-[0.97]"
			style="background: var(--color-ink); color: var(--color-paper); box-shadow: var(--shadow-sm);">
			Karte herunterladen ↓
		</a>
		<a href={cardUrl} target="_blank" rel="noreferrer"
			class="px-6 py-3.5 rounded-full text-sm font-medium text-center transition-all active:scale-[0.97]"
			style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);">
			In voller Größe öffnen ↗
		</a>
	</div>

	<!-- Caption -->
	<div class="mt-10">
		<div class="flex items-center justify-between mb-2">
			<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Begleittext</span>
			<button type="button" onclick={copyCaption} class="text-xs font-medium px-3 py-1.5 rounded-full" style="background: var(--color-amber); color: var(--color-paper);">
				{copied ? 'Kopiert ✓' : 'Text kopieren'}
			</button>
		</div>
		<div class="p-5 rounded-xl whitespace-pre-line text-base leading-relaxed" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink-soft); font-family: var(--font-serif);">{data.caption}</div>
		<p class="mt-2 text-xs" style="color: var(--color-faint); font-family: var(--font-mono);">Pass ihn an, mach ihn zu deinem. Authentisch schlägt perfekt.</p>
	</div>

	<a href={base + '/geschichte/' + data.slug} class="mt-10 inline-flex items-center gap-2 text-sm hover:opacity-70" style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);">
		Ganze Geschichte lesen <span aria-hidden="true">→</span>
	</a>
</section>
