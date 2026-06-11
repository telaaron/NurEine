<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	let { children } = $props();

	const navGroups = [
		{
			title: 'Überblick',
			items: [{ href: '/admin', label: 'Dashboard', icon: 'grid' }]
		},
		{
			title: 'Inhalt',
			items: [
				{ href: '/admin/stories', label: 'Stories', icon: 'doc' },
				{ href: '/admin/redaktion', label: 'Redaktion', icon: 'search' },
				{ href: '/admin/submissions', label: 'Einsendungen', icon: 'inbox' },
				{ href: '/admin/social', label: 'Social', icon: 'share' }
			]
		},
		{
			title: 'Wachstum',
			items: [
				{ href: '/admin/audience', label: 'Audience', icon: 'users' },
				{ href: '/admin/b2b', label: 'B2B Pipeline', icon: 'briefcase' },
				{ href: '/admin/delivery', label: 'Delivery', icon: 'send' }
			]
		}
	];

	function isActive(path: string) {
		return $page.url.pathname === path;
	}

	let mobileOpen = $state(false);
</script>

{#snippet icon(name: string)}
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
		{#if name === 'grid'}<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
		{:else if name === 'doc'}<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
		{:else if name === 'search'}<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
		{:else if name === 'inbox'}<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
		{:else if name === 'share'}<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
		{:else if name === 'users'}<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
		{:else if name === 'briefcase'}<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
		{:else if name === 'send'}<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
		{/if}
	</svg>
{/snippet}

{#snippet navContent()}
	<!-- Brand -->
	<div class="px-5 py-5 border-b" style="border-color: var(--color-rule);">
		<a href={base + '/admin'} class="flex items-center gap-2.5 group" aria-label="NurEine Admin">
			<img src="{base}/NurEine.svg" alt="" class="h-7 w-auto" aria-hidden="true" />
			<div class="leading-none">
				<div class="display text-lg" style="color: var(--color-ink); font-weight: 600;">NurEine</div>
				<div class="text-[0.6rem] uppercase tracking-[0.18em] mt-0.5" style="color: var(--color-amber); font-family: var(--font-mono);">Cockpit</div>
			</div>
		</a>
	</div>

	<!-- Nav (gruppiert) -->
	<nav class="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
		{#each navGroups as group}
			<div>
				<div class="px-3 mb-1.5 text-[0.6rem] uppercase tracking-[0.16em]" style="color: var(--color-faint); font-family: var(--font-mono);">{group.title}</div>
				<div class="flex flex-col gap-0.5">
					{#each group.items as item}
						<a
							href={base + item.href}
							onclick={() => (mobileOpen = false)}
							class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
							style={isActive(item.href)
								? 'background: var(--color-ink); color: var(--color-paper); box-shadow: var(--shadow-sm);'
								: 'color: var(--color-ink-soft);'}
							onmouseenter={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = 'var(--color-canvas-soft)'; }}
							onmouseleave={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = 'transparent'; }}
						>
							<span style="opacity: {isActive(item.href) ? '1' : '0.6'};">{@render icon(item.icon)}</span>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</nav>

	<!-- Bottom -->
	<div class="px-3 py-4 border-t flex flex-col gap-1" style="border-color: var(--color-rule);">
		<a href={base + '/'} class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors" style="color: var(--color-ink-soft);"
			onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-canvas-soft)'; }}
			onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
			Zur Website
		</a>
		<button type="button"
			onclick={async () => { await fetch(base + '/api/auth/logout', { method: 'POST' }); window.location.href = base + '/admin/login'; }}
			class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors" style="color: var(--color-rose);"
			onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-rose-tint)'; }}
			onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
			Abmelden
		</button>
	</div>
{/snippet}

<div class="min-h-screen flex" style="background: var(--color-canvas);">
	<!-- Sidebar (Desktop) -->
	<aside class="hidden lg:flex flex-col w-60 shrink-0 border-r sticky top-0 h-screen" style="background: var(--color-paper); border-color: var(--color-rule);">
		{@render navContent()}
	</aside>

	<!-- Mobile drawer -->
	{#if mobileOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="lg:hidden fixed inset-0 z-40" style="background: rgba(22,20,15,0.4);" onclick={() => (mobileOpen = false)}></div>
		<aside class="lg:hidden fixed left-0 top-0 z-50 flex flex-col w-64 h-screen border-r" style="background: var(--color-paper); border-color: var(--color-rule);">
			{@render navContent()}
		</aside>
	{/if}

	<div class="flex-1 min-w-0 flex flex-col">
		<!-- Mobile top bar -->
		<div class="lg:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-30" style="background: var(--color-paper); border-color: var(--color-rule);">
			<button type="button" onclick={() => (mobileOpen = true)} aria-label="Menü" style="color: var(--color-ink);">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
			</button>
			<span class="display text-base" style="color: var(--color-ink); font-weight: 600;">NurEine Cockpit</span>
		</div>

		<main class="flex-1 p-4 sm:p-6 lg:p-10 min-w-0 overflow-auto" style="background: var(--color-canvas);">
			<div class="mx-auto max-w-[1180px]">
				{@render children()}
			</div>
		</main>
	</div>
</div>
