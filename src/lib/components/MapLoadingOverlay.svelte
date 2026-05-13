<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Karte wird geladen...' }: Props = $props();
</script>

<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
	style="background: var(--color-canvas);"
>
	<div
		class="h-7 w-7 rounded-full border-2 animate-spin"
		style="border-color: var(--color-rule); border-top-color: var(--color-amber);"
	></div>
	<p class="text-sm" style="color: var(--color-muted);">{message}</p>
</div>
