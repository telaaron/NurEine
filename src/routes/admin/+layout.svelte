<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import Icon from '$lib/components/Icon.svelte';
	import {
		ArrowLeftIcon,
		ArrowRightOnRectangleIcon,
		Bars3Icon,
		BriefcaseIcon,
		CurrencyEuroIcon,
		DocumentTextIcon,
		HeartIcon,
		InboxIcon,
		MagnifyingGlassIcon,
		PaperAirplaneIcon,
		ShareIcon,
		SpeakerWaveIcon,
		Squares2x2Icon,
		UsersIcon
	} from 'heroicons-svelte/24/outline';

	let { children, data } = $props();

	// Minimal-Nav (2026-07-08, Aaron: „nur das Nötigste, hauptsächlich autonom").
	// Vorn NUR die 4 Seiten, die man wirklich täglich braucht. Alles andere
	// bedient das autonome System selbst → einklappbar unter „Selten gebraucht".
	let moreOpen = $state(false);
	const navGroups = $derived([
		{
			title: '',
			items: [
				{ href: '/admin', label: 'Übersicht', icon: 'grid', badge: 0 },
				{ href: '/admin/ki', label: 'KI-Cockpit', icon: 'heart', badge: 0 },
				{ href: '/admin/social', label: 'Social', icon: 'share', badge: 0 },
				{ href: '/admin/tiktok', label: 'TikTok', icon: 'send', badge: 0, sub: true },
				{ href: '/admin/kosten', label: 'Kosten', icon: 'coins', badge: 0 }
			]
		}
	]);
	// Selten gebraucht (autonom bedient): nur bei Bedarf ausklappen.
	const moreItems = [
		{ href: '/admin/stories', label: 'Stories', icon: 'doc', badge: 0 },
		{ href: '/admin/redaktion', label: 'Redaktion', icon: 'search', badge: data?.newFeedback ?? 0 },
		{ href: '/admin/impact', label: 'Impact-Läufe', icon: 'heart', badge: 0 },
		{ href: '/admin/audience', label: 'Audience', icon: 'users', badge: 0 },
		{ href: '/admin/submissions', label: 'Einsendungen', icon: 'inbox', badge: 0 },
		{ href: '/admin/audio', label: 'Vorlesen', icon: 'volume', badge: 0 },
		{ href: '/admin/b2b', label: 'B2B', icon: 'briefcase', badge: 0 }
	];

	function isActive(path: string) {
		return $page.url.pathname === path;
	}

	let mobileOpen = $state(false);
</script>

{#snippet icon(name: string)}
	{#if name === 'grid'}
		<Icon icon={Squares2x2Icon} size="1rem" />
	{:else if name === 'doc'}
		<Icon icon={DocumentTextIcon} size="1rem" />
	{:else if name === 'search'}
		<Icon icon={MagnifyingGlassIcon} size="1rem" />
	{:else if name === 'inbox'}
		<Icon icon={InboxIcon} size="1rem" />
	{:else if name === 'share'}
		<Icon icon={ShareIcon} size="1rem" />
	{:else if name === 'users'}
		<Icon icon={UsersIcon} size="1rem" />
	{:else if name === 'briefcase'}
		<Icon icon={BriefcaseIcon} size="1rem" />
	{:else if name === 'send'}
		<Icon icon={PaperAirplaneIcon} size="1rem" />
	{:else if name === 'volume'}
		<Icon icon={SpeakerWaveIcon} size="1rem" />
	{:else if name === 'coins'}
		<Icon icon={CurrencyEuroIcon} size="1rem" />
	{:else if name === 'heart'}
		<Icon icon={HeartIcon} size="1rem" />
	{/if}
{/snippet}

{#snippet navContent()}
	<!-- Brand -->
	<div class="px-5 py-5 border-b" style="border-color: var(--color-rule);">
		<a href={base + '/admin'} class="flex items-center gap-2.5 group" aria-label="NurEine Admin">
			<img src="{base}/NurEine-mark.png" alt="" class="h-7 w-auto" aria-hidden="true" />
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
							class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all {item.sub ? 'ml-4' : ''}"
							style={isActive(item.href)
								? 'background: var(--color-ink); color: var(--color-paper); box-shadow: var(--shadow-sm);'
								: 'color: var(--color-ink-soft);'}
							onmouseenter={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = 'var(--color-canvas-soft)'; }}
							onmouseleave={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = 'transparent'; }}
						>
							<span style="opacity: {isActive(item.href) ? '1' : '0.6'};">{@render icon(item.icon)}</span>
							<span class="flex-1">{item.label}</span>
							{#if item.badge > 0}
								<span class="inline-flex items-center justify-center text-[0.6rem] font-bold rounded-full" style="min-width:18px;height:18px;padding:0 5px;background: var(--color-rose); color:#fff;">{item.badge}</span>
							{/if}
						</a>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Selten gebraucht: einklappbar (das autonome System bedient das selbst) -->
		<div>
			<button
				onclick={() => (moreOpen = !moreOpen)}
				class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
				style="color: var(--color-faint); background: transparent;"
			>
				<span class="text-[0.6rem] uppercase tracking-[0.16em]" style="font-family: var(--font-mono);">Selten gebraucht</span>
				<span class="flex-1"></span>
				<span style="display:inline-block; transition: transform 0.15s; transform: rotate({moreOpen ? 90 : 0}deg);">›</span>
			</button>
			{#if moreOpen}
				<div class="flex flex-col gap-0.5 mt-1">
					{#each moreItems as item}
						<a
							href={base + item.href}
							onclick={() => (mobileOpen = false)}
							class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
							style={isActive(item.href) ? 'background: var(--color-ink); color: var(--color-paper);' : 'color: var(--color-ink-soft);'}
							onmouseenter={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = 'var(--color-canvas-soft)'; }}
							onmouseleave={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = 'transparent'; }}
						>
							<span style="opacity: {isActive(item.href) ? '1' : '0.6'};">{@render icon(item.icon)}</span>
							<span class="flex-1">{item.label}</span>
							{#if item.badge > 0}
								<span class="inline-flex items-center justify-center text-[0.6rem] font-bold rounded-full" style="min-width:18px;height:18px;padding:0 5px;background: var(--color-rose); color:#fff;">{item.badge}</span>
							{/if}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</nav>

	<!-- Bottom -->
	<div class="px-3 py-4 border-t flex flex-col gap-1" style="border-color: var(--color-rule);">
		<a href={base + '/'} class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors" style="color: var(--color-ink-soft);"
			onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-canvas-soft)'; }}
			onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
			<Icon icon={ArrowLeftIcon} size="1rem" />
			Zur Website
		</a>
		<button type="button"
			onclick={async () => { await fetch(base + '/api/auth/logout', { method: 'POST' }); window.location.href = base + '/admin/login'; }}
			class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors" style="color: var(--color-rose);"
			onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-rose-tint)'; }}
			onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
			<Icon icon={ArrowRightOnRectangleIcon} size="1rem" />
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
				<Icon icon={Bars3Icon} size="1.375rem" label="Menü" />
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
