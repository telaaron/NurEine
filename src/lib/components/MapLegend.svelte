<script lang="ts">
	import { toneColors, toneLabels } from '$lib/tone-constants';

	const toneEntries = $derived(Object.entries(toneColors));
</script>

<div class="flex flex-wrap items-center gap-3 mt-3 text-xs" style="color: var(--color-muted);">
	<span class="font-medium" style="color: var(--color-ink-soft);">Wirkung:</span>
	{#each toneEntries as [key, color]}
		<span class="flex items-center gap-1.5">
			<span
				class="inline-block w-3 h-3 rounded-full"
				style="background: {color};"
			></span>
			{toneLabels[key] ?? key}
		</span>
	{/each}
	<span class="meta text-xs" style="color: var(--color-muted);">
		&middot; Gr&ouml;ßere Kreise = h&ouml;here Wirkung
	</span>
</div>
