<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';

	const nav = [
		{ href: '/', label: 'Heute' },
		{ href: '/archiv', label: 'Archiv' },
		{ href: '/karte', label: 'Karte der Hoffnung' },
		{ href: '/bei-dir', label: 'Bei dir' },
		{ href: '/manifest', label: 'Manifest' }
	];

	let menuOpen = $state(false);

	function active(href: string) {
		const path = page.url.pathname.replace(base, '') || '/';
		if (href === '/') return path === '/' || path === '';
		return path.startsWith(href);
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<header class="border-b" style="border-color: var(--color-rule);">
	<div class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10">
		<div class="flex items-center justify-between py-3 sm:py-4 md:py-5">
			<a href={base + '/'} class="flex items-baseline gap-2 sm:gap-3 group">
				<span class="serif text-xl sm:text-2xl font-medium tracking-tight" style="color: var(--color-ink);"
					>NurEine</span
				>
				<span
					class="hidden md:inline text-[10px] sm:text-[11px] uppercase tracking-[0.18em]"
					style="color: var(--color-faint);"
				>
					tägliche Dosis Hoffnung
				</span>
			</a>

			<!-- Desktop nav -->
			<nav class="hidden md:flex items-center gap-7 text-sm">
				{#each nav as item}
					<a
						href={base + item.href}
						class="transition-colors hover:opacity-100"
						style="color: {active(item.href) ? 'var(--color-ink)' : 'var(--color-muted)'}; {active(
							item.href
						)
							? 'border-bottom: 1px solid var(--color-amber);'
							: ''}"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Desktop newsletter CTA -->
			<a
				href={base + '/newsletter'}
				class="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Newsletter
				<span aria-hidden="true">→</span>
			</a>

			<!-- Mobile hamburger -->
			<button
				type="button"
				onclick={() => (menuOpen = !menuOpen)}
				class="md:hidden flex items-center justify-center w-10 h-10 rounded-md -mr-1"
				aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
				aria-expanded={menuOpen}
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" stroke-width="2" stroke-linecap="round">
					{#if menuOpen}
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					{:else}
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="21" y2="18" />
					{/if}
				</svg>
			</button>
		</div>
	</div>
</header>

<!-- Mobile drawer overlay -->
{#if menuOpen}
	<!-- backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="md:hidden fixed inset-0 z-40"
		style="background: rgba(26, 24, 21, 0.35);"
		onclick={closeMenu}
		role="button"
		aria-label="Menü schließen"
	></div>

	<!-- slide-out drawer -->
	<div
		class="md:hidden fixed top-0 right-0 z-50 w-72 max-w-[82vw] h-full flex flex-col paper shadow-2xl animate-slide-in"
	>
		<!-- Drawer header: close button -->
		<div class="flex items-center justify-between p-4 border-b" style="border-color: var(--color-rule);">
			<span class="serif text-lg font-medium" style="color: var(--color-ink);">NurEine</span>
			<button
				type="button"
				onclick={closeMenu}
				class="flex items-center justify-center w-10 h-10 rounded-full"
				aria-label="Menü schließen"
				style="color: var(--color-ink);"
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<!-- Drawer nav links -->
		<nav class="flex-1 overflow-y-auto p-4 space-y-0.5">
			{#each nav as item}
				<a
					href={base + item.href}
					onclick={closeMenu}
					class="block px-4 py-3 rounded-lg text-base transition-colors active:scale-[0.98]"
					style="color: {active(item.href) ? 'var(--color-ink)' : 'var(--color-muted)'};
						background: {active(item.href) ? 'var(--color-canvas-soft)' : 'transparent'};
						font-weight: {active(item.href) ? '500' : '400'};"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Drawer footer: Newsletter CTA -->
		<div class="p-4 border-t" style="border-color: var(--color-rule);">
			<a
				href={base + '/newsletter'}
				onclick={closeMenu}
				class="flex items-center justify-center gap-2 w-full py-3 rounded-full text-[15px] font-medium transition-all active:scale-[0.98]"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Newsletter abonnieren
				<span aria-hidden="true">→</span>
			</a>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-in {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}
	.animate-slide-in {
		animation: slide-in 0.25s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
</style>
