<script lang="ts">
	import '../../app.css';
	import './app-shell.css';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { loadPrefs } from '$lib/app/prefs';
	import { registerPushListeners, setupStatusBar } from '$lib/app/native';

	let { children } = $props();

	// First-launch gate + push wiring. Runs once on the client.
	$effect(() => {
		setupStatusBar();
		registerPushListeners((storyId) => goto(base + '/app/geschichte/' + storyId));
		const path = page.url.pathname.replace(base, '');
		if (path.startsWith('/app/onboarding')) return;
		loadPrefs().then((p) => {
			if (!p.onboarded) goto(base + '/app/onboarding', { replaceState: true });
		});
	});

	const onOnboarding = $derived((page.url.pathname.replace(base, '') || '').startsWith('/app/onboarding'));

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
	<main class="app-main" class:no-tabbar={onOnboarding}>
		{@render children?.()}
	</main>

	{#if !onOnboarding}
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
	{/if}
</div>
