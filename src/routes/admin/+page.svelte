<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const { totalStories, categories } = $derived(data);
</script>

<h1 class="serif text-2xl" style="color: var(--color-ink);">Dashboard</h1>
<p class="mt-2 text-sm" style="color: var(--color-muted);">Übersicht über dein NurEine-Archiv.</p>

<div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
	<div class="paper p-6 rounded-[6px]" style="border: 1px solid var(--color-rule);">
		<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Stories</p>
		<p class="serif text-4xl mt-2" style="color: var(--color-ink);">{totalStories}</p>
	</div>
</div>

<div class="mt-10">
	<h2 class="serif text-lg" style="color: var(--color-ink);">Kategorien</h2>
	<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each Object.entries(categories) as [cat, count]}
			<div class="paper p-4 rounded-[4px]" style="border: 1px solid var(--color-rule);">
				<p class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">{cat}</p>
				<p class="serif text-2xl mt-1" style="color: var(--color-ink);">{count}</p>
			</div>
		{/each}
	</div>
</div>

<div class="mt-10">
	<a
		href={base + '/admin/stories'}
		class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
		style="background: var(--color-ink); color: var(--color-paper);"
	>
		Stories verwalten →
	</a>
</div>
