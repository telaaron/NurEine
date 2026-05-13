<script lang="ts">
	import StoryDetailCard from './StoryDetailCard.svelte';
	import { toneColors } from '$lib/tone-constants';

	interface Props {
		story: any;
		onClose: () => void;
	}

	let { story, onClose }: Props = $props();

	const toneFg = $derived(toneColors[story?.tone ?? 'amber'] ?? '#c87340');
</script>

{#if story}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="lg:hidden fixed inset-0 z-40"
		style="background: rgba(26, 24, 21, 0.35);"
		onclick={onClose}
		role="button"
	></div>

	<div
		class="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-rise-up rounded-t-[12px] overflow-y-auto max-h-[60vh] pb-8"
		style="background: var(--color-elevated); box-shadow: 0 -4px 20px rgba(0,0,0,0.1);"
	>
		<StoryDetailCard {story} {toneFg} mode="sheet" {onClose} />
	</div>
{/if}
