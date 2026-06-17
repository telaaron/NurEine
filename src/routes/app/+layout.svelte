<script lang="ts">
	import '../../app.css';
	import './app-shell.css';
	import { page } from '$app/state';
	import { base } from '$app/paths';

	let { children } = $props();

	const tabs = [
		{ href: '/app', label: 'Heute', icon: 'sun' },
		{ href: '/app/archiv', label: 'Archiv', icon: 'archive' },
		{ href: '/app/karte', label: 'Karte', icon: 'map' },
		{ href: '/app/mehr', label: 'Mehr', icon: 'dots' }
	];

	function active(href: string): boolean {
		const path = page.url.pathname.replace(base, '') || '/app';
		if (href === '/app') return path === '/app' || path === '/app/';
		return path.startsWith(href);
	}
</script>

<div class="app-root">
	<main class="app-main">
		{@render children?.()}
	</main>

	<nav class="app-tabbar" aria-label="Hauptnavigation">
		{#each tabs as tab}
			<a href={base + tab.href} class="app-tab" class:active={active(tab.href)} aria-current={active(tab.href) ? 'page' : undefined}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					{#if tab.icon === 'sun'}
						<circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
					{:else if tab.icon === 'archive'}
						<rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
					{:else if tab.icon === 'map'}
						<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
					{:else}
						<circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" />
					{/if}
				</svg>
				<span>{tab.label}</span>
			</a>
		{/each}
	</nav>
</div>
