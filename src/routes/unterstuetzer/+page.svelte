<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();
	const url = 'https://nureine.de/unterstuetzer';
</script>

<svelte:head>
	<title>Mitwirkende — NurEine</title>
	<meta name="description" content="Menschen, die NurEine durch Weiterempfehlung mittragen." />
	<link rel="canonical" href={url} />
</svelte:head>

<section class="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<p class="eyebrow" style="color: var(--color-amber);">Danke</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink); font-weight: 700;">
		Die Mitwirkenden.
	</h1>
	<p class="mt-6 text-lg leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		NurEine wächst nicht durch Werbung, sondern durch Menschen, die eine gute Nachricht
		weitergeben. Wer {data.threshold} Menschen für den täglichen Lichtblick gewinnt, wird hier
		gewürdigt — denn ohne sie gäbe es diese Reichweite nicht.
	</p>

	{#if data.contributors.length}
		<div class="mt-10 flex flex-wrap gap-3">
			{#each data.contributors as name}
				<span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
					style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule); color: var(--color-ink);">
					<span style="width:6px;height:6px;border-radius:6px;background:var(--color-amber);"></span>
					{name}
				</span>
			{/each}
		</div>
	{:else}
		<div class="mt-10 p-6 rounded-[12px] text-center" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
			<p class="serif text-base leading-relaxed" style="color: var(--color-ink-soft);">
				Hier ist noch Platz für den ersten Namen. Wird es deiner?
			</p>
			<a href={base + '/teilen'} class="mt-4 inline-block px-6 py-3 rounded-full text-sm font-medium"
				style="background: var(--color-amber); color: var(--color-paper);">
				NurEine weitergeben
			</a>
		</div>
	{/if}

	<p class="mt-10 text-xs leading-relaxed" style="color: var(--color-faint); font-family: var(--font-serif);">
		Es erscheint nur dein Vorname, und nur wenn du einen Namen hinterlegt hast. Keine
		E-Mail-Adresse, keine Zahlen. Du kannst jederzeit um Entfernung bitten.
	</p>
</section>
