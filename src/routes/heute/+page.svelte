<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';
	let { data } = $props();

	// WhatsApp-Karte = die share-card (IG-Story-Stil): klare Headline + Subtitle +
	// Wirkung-Badge + CTA, weniger Branding, echter Mehrwert. Der "krass…"-Funke
	// steht als Begleittext darunter (whatsappCaption), NICHT auf dem Bild.
	const storyUrl = $derived(`${base}/api/share-card/${data.slug}`); // IG-Story, 9:16
	const ogUrl = $derived(`${base}/api/og/${data.slug}`);
	const cardUrl = $derived(storyUrl); // WhatsApp + IG nutzen dieselbe inhaltsreiche 9:16-Karte

	// Share-Tracking: welcher Kanal/Format wird wirklich genutzt? Wertvollste Frühdaten.
	function shared(format: 'whatsapp' | 'instagram' | 'og' | 'text', via: string) {
		track('story_shared', { slug: data.slug, format, via });
	}

	let copied = $state('');
	function copy(text: string, key: string, format: 'whatsapp' | 'instagram' | 'text') {
		navigator.clipboard?.writeText(text).then(() => {
			copied = key;
			shared(format, 'copy');
			setTimeout(() => (copied = ''), 1800);
		}).catch(() => {});
	}
	const hashtagStr = $derived(data.hashtags.join(' '));
</script>

<svelte:head>
	<title>Heute teilen — NurEine</title>
	<meta name="description" content="Die Geschichte des Tages — fertige Karten und Texte zum Teilen." />
</svelte:head>

<section class="mx-auto max-w-[680px] px-4 sm:px-6 py-10 sm:py-14">
	<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Heute teilen</span>
	<h1 class="display mt-3 text-2xl sm:text-3xl leading-tight" style="color: var(--color-ink); font-weight: 600;">
		Die Geschichte des Tages — bereit zum Teilen.
	</h1>
	<p class="mt-3 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		Fertige Karten und Texte. Lade dir herunter, was du brauchst — für WhatsApp, Instagram oder einfach zum Weiterschicken.
		Teile nur, wenn dich die Geschichte selbst bewegt.
	</p>

	<!-- Story -->
	<div class="mt-8 paper rounded-xl p-5" style="border:1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
		<div class="text-xs uppercase tracking-wider mb-1.5" style="color: var(--color-amber); font-family: var(--font-mono);">
			{data.category} · Wirkung {data.impactScore}/100
		</div>
		<h2 class="display text-xl leading-tight" style="color: var(--color-ink); font-weight:600;">{data.title}</h2>
		<p class="mt-2 text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{data.dek}</p>
		<a href={base + '/geschichte/' + data.slug} class="mt-3 inline-flex items-center gap-1.5 text-sm" style="color: var(--color-amber);">Ganze Geschichte lesen →</a>
	</div>

	<!-- Karten -->
	<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
		<div>
			<p class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-muted); font-family: var(--font-mono);">WhatsApp / Story (9:16)</p>
			<div class="rounded-xl overflow-hidden" style="box-shadow: var(--shadow-md); border:1px solid var(--color-rule);">
				<img src={cardUrl} alt="Hochformat-Karte" width="100%" loading="eager" style="display:block;width:100%;aspect-ratio:9/16;object-fit:cover;" />
			</div>
			<a href={cardUrl} download={`nureine-${data.slug}-story.jpg`} onclick={() => shared('whatsapp', 'download')} class="mt-2 block text-center px-4 py-2.5 rounded-full text-sm font-medium" style="background: var(--color-surface-ink); color: var(--color-on-ink);">Herunterladen ↓</a>
		</div>
		<div>
			<p class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-muted); font-family: var(--font-mono);">Feed / Link (1.91:1)</p>
			<div class="rounded-xl overflow-hidden" style="box-shadow: var(--shadow-md); border:1px solid var(--color-rule);">
				<img src={ogUrl} alt="Querformat-Karte" width="100%" loading="lazy" style="display:block;width:100%;aspect-ratio:1200/630;object-fit:cover;" />
			</div>
			<a href={ogUrl} download={`nureine-${data.slug}-feed.png`} onclick={() => shared('og', 'download')} class="mt-2 block text-center px-4 py-2.5 rounded-full text-sm font-medium" style="background: var(--color-surface-ink); color: var(--color-on-ink);">Herunterladen ↓</a>
		</div>
	</div>

	<!-- Carousel-Folien (nur wenn Story Instagram-tauglich) -->
	{#if data.slides}
		<div class="mt-10">
			<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Instagram-Carousel · 3 Folien</span>
			<p class="mt-1 text-xs" style="color: var(--color-muted);">Erst der Hook, dann die Auflösung, dann ein ruhiger Schluss. Bauen aufeinander auf.</p>
			<div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
				{#each [
					{ n: '1 · Hook', t: data.slides.hook },
					{ n: '2 · Auflösung', t: data.slides.aufloesung },
					{ n: '3 · Stille', t: data.slides.stille }
				] as s}
					<div class="p-4 rounded-xl text-sm leading-relaxed" style="background: var(--color-paper); border:1px solid var(--color-rule); color: var(--color-ink-soft); font-family: var(--font-serif);">
						<div class="text-xs uppercase tracking-wider mb-1.5" style="color: var(--color-faint); font-family: var(--font-mono);">{s.n}</div>
						{s.t}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Texte -->
	{#each [
		{ key: 'wa', label: 'WhatsApp-Text', text: data.whatsappCaption, fmt: 'whatsapp' as const },
		{ key: 'ig', label: 'Instagram-Caption', text: data.igCaption, fmt: 'instagram' as const },
		{ key: 'tags', label: 'Hashtags', text: hashtagStr, fmt: 'text' as const }
	] as block}
		<div class="mt-8">
			<div class="flex items-center justify-between mb-2">
				<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">{block.label}</span>
				<button type="button" onclick={() => copy(block.text, block.key, block.fmt)} class="text-xs font-medium px-3 py-1.5 rounded-full" style="background: var(--color-amber); color: var(--color-on-accent);">
					{copied === block.key ? 'Kopiert ✓' : 'Kopieren'}
				</button>
			</div>
			<div class="p-4 rounded-xl whitespace-pre-line text-sm leading-relaxed" style="background: var(--color-paper); border:1px solid var(--color-rule); color: var(--color-ink-soft); font-family: {block.key === 'tags' ? 'var(--font-mono)' : 'var(--font-serif)'};">{block.text}</div>
		</div>
	{/each}

	<p class="mt-10 text-xs" style="color: var(--color-faint); font-family: var(--font-mono);">Mach die Texte zu deinen. Authentisch schlägt perfekt.</p>
</section>
