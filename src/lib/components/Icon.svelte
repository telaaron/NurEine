<script lang="ts">
	// Zentrale Icon-Komponente fuers ganze Websitesystem.
	// STANDARD (Aaron, 2026-07-24): Icons kommen AUSSCHLIESSLICH aus Heroicons —
	// keine selbstgemalten Inline-SVGs oder Emoji-als-Icon mehr. Ausnahmen: das
	// Leuchtturm-Markenlogo (Brand-Asset) und Satori-OG/Banner-Renderings.
	//
	// Nutzung:
	//   import { BellIcon } from 'heroicons-svelte/24/outline';
	//   Icon icon={BellIcon}                      -> 1.25rem, currentColor, outline
	//   Icon icon={CheckIcon} size="1rem"
	//   Icon icon={XMarkIcon} label="Schliessen"  -> a11y-Label (sonst aria-hidden)
	//
	// Heroicons erben Farbe ueber currentColor; Groesse setzt der Wrapper.
	import type { Component } from 'svelte';

	interface Props {
		icon: Component;
		size?: string;
		label?: string;
		class?: string;
	}
	let { icon, size = '1.25rem', label = undefined, class: cls = '' }: Props = $props();

	const Ico = $derived(icon);
</script>

<span
	class="ne-icon {cls}"
	style="--icon-size: {size}"
	role={label ? 'img' : 'presentation'}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<Ico />
</span>

<style>
	.ne-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-size);
		height: var(--icon-size);
		flex: none;
		color: inherit;
	}
	.ne-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
