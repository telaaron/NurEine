<script lang="ts">
	import StoryCard from '$lib/components/StoryCard.svelte';

	let { data } = $props();
	const local = $derived(data.local);
</script>

<svelte:head>
	<title>Lokal — NurEine</title>
</svelte:head>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-16 pb-10 sm:pb-12">
	<p
		class="text-[11px] uppercase tracking-[0.22em] rise"
		style="color: var(--color-amber); font-weight: 500;"
	>
		Bei dir um die Ecke
	</p>
	<h1
		class="serif mt-3 leading-tight tracking-tight text-[1.8rem] sm:text-[2.4rem] lg:text-[3.6rem] rise rise-d1"
		style="color: var(--color-ink); font-weight: 500;"
	>
		Gute Nachrichten aus deiner Region.
	</h1>
	<p
		class="mt-5 max-w-[55ch] text-[15px] sm:text-lg leading-relaxed rise rise-d2"
		style="color: var(--color-ink-soft); font-family: var(--font-serif);"
	>
		Hyperlokal aus Berlin, Brandenburg und ganz Deutschland. Wir arbeiten mit kleinen Redaktionen, Vereinen und
		Stadtteilinitiativen zusammen. Wenn du selbst eine Geschichte einreichen willst,
		<a class="underline" style="color: var(--color-amber);" href="#einreichen">schreib uns hier</a>.
	</p>
</section>

<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16">
	{#if local.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
			{#each local as story (story.slug)}
				<StoryCard {story} />
			{/each}
		</div>
	{:else}
		<div class="paper rounded-[8px] p-8 sm:p-10 text-center" style="border: 1px solid var(--color-rule);">
			<p class="serif text-xl" style="color: var(--color-ink-soft);">
				Aktuell gibt es noch keine lokalen Geschichten. Kennst du eine? Schreib uns!
			</p>
		</div>
	{/if}

	<div
		id="einreichen"
		class="mt-14 sm:mt-20 paper rounded-[8px] p-6 sm:p-10 lg:p-14"
		style="border: 1px solid var(--color-rule);"
	>
		<div class="grid lg:grid-cols-12 gap-8">
			<div class="lg:col-span-5">
				<p
					class="text-[11px] uppercase tracking-[0.22em]"
					style="color: var(--color-amber); font-weight: 500;"
				>
					Story einreichen
				</p>
				<h2
					class="serif text-2xl sm:text-3xl lg:text-4xl mt-3 leading-tight"
					style="color: var(--color-ink); font-weight: 500;"
				>
					Du kennst eine Geschichte, die wir kennen sollten?
				</h2>
				<p
					class="mt-4 text-base leading-relaxed"
					style="color: var(--color-ink-soft); font-family: var(--font-serif);"
				>
					Initiativen, Personen, kleine Durchbrüche aus deinem Stadtteil. Wir prüfen jede
					Einsendung redaktionell.
				</p>
			</div>
			<form class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3" onsubmit={(e) => e.preventDefault()}>
				<label class="block">
					<span class="sr-only">Name</span>
					<input
						type="text"
						placeholder="Dein Name"
						class="w-full px-4 py-3 rounded-full text-sm bg-transparent"
						style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);"
					/>
				</label>
				<label class="block">
					<span class="sr-only">E-Mail</span>
					<input
						type="email"
						placeholder="E-Mail-Adresse"
						class="w-full px-4 py-3 rounded-full text-sm bg-transparent"
						style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);"
					/>
				</label>
				<label class="block sm:col-span-2">
					<span class="sr-only">Geschichte</span>
					<textarea
						rows="4"
						placeholder="Erzähl uns kurz, worum es geht — Stadt, Personen, Quelle wenn möglich."
						class="w-full px-4 py-3 rounded-[8px] text-sm bg-transparent resize-none"
						style="border: 1px solid var(--color-rule-strong); color: var(--color-ink); font-family: var(--font-serif);"
					></textarea>
				</label>
				<button
					type="submit"
					class="sm:col-span-2 px-6 py-3 rounded-full text-sm font-medium justify-self-start"
					style="background: var(--color-amber); color: var(--color-paper);"
				>
					Einsenden
				</button>
			</form>
		</div>
	</div>
</section>
