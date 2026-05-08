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

<header
	class="border-b sticky top-0 z-30 backdrop-blur-[12px]"
	style="
		border-color: var(--color-rule);
		background: rgba(245, 241, 234, 0.85);
	"
>
	<div class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10">
		<div class="flex items-center justify-between py-2.5 sm:py-3 lg:py-4">
			<!-- Logo + Brand -->
			<a href={base + '/'} class="flex items-center gap-2.5 sm:gap-3 group shrink-0" aria-label="NurEine — Startseite">
				<!-- Inline SVG logo — crisp at any size -->
				<svg
					class="h-7 sm:h-8 lg:h-[34px] w-auto"
					viewBox="0 580 2048 1210"
					fill="none"
					aria-hidden="true"
				>
					<g fill="#272626">
						<path d="M995 1714 c-89.80 -7.60 -173.60 -47.40 -242 -115 -58.40 -57.60 -98.80 -124.40 -126 -208.20 -12.60 -39 -23 -99.60 -23 -135 l0 -17.80 213 0 213 0 0 239 0 239 -8.40 -0.20 c-4.80 -0.20 -16.60 -1 -26.60 -1.80z"/>
						<path d="M606.20 1181.60 c1.40 -2.60 20.20 -37 41.80 -76.60 21.80 -39.60 58.60 -107 82 -150 23.40 -42.80 47.60 -87.40 54 -99 6.40 -11.60 17 -30.80 23.40 -43 6.60 -12 33.40 -61.20 59.60 -109 26.20 -47.80 70.80 -130.20 99.20 -183 28.40 -52.80 52.60 -97.20 53.80 -98.60 1.40 -1.40 3.80 -2.40 5.60 -2 3.20 0.60 3.40 18.80 4.40 233.60 0.80 170.60 0.40 233.40 -1.20 234.40 -1.20 0.80 -3.40 4.40 -5 8 -1.40 3.60 -20.60 40.80 -42.60 82.60 -21.80 41.80 -51.40 98 -65.60 125 -14.20 27 -29.60 56.40 -34.20 65.60 l-8.20 16.40 -134.80 0 -134.60 0 2.40 -4.40z"/>
					</g>
					<g fill="#171616">
						<path d="M1021.60 1713.40 c1.80 -2.20 2.40 -55.40 2 -239.20 l-0.60 -236.20 210.80 0 210.80 0 -1.20 28.60 c-5.20 124.80 -62.80 252.20 -152.60 337.20 -72.20 68.40 -154.20 104.60 -251.80 111.20 -17.40 1.20 -19.60 1 -17.40 -1.60z"/>
						<path d="M1166 1168.40 c-9 -18 -40.40 -77.80 -94.40 -180.40 -47.20 -89.40 -53.20 -102 -49.60 -104.40 2.60 -1.80 3 -29.40 2.40 -231.80 -0.40 -172.20 -1 -229.60 -2.80 -228.60 -1.40 0.80 -1.60 0.60 -0.80 -0.80 3.40 -5.60 7.60 -0.80 20.40 23.20 25.80 49 147.40 272 361.80 664.40 19 34.60 36 66 37.80 69.60 l3.40 6.40 -134.60 0 -134.60 0 -9 -17.60z"/>
					</g>
					<g fill="#e7632c">
						<path d="M864 1185.40 c0 -0.40 5.80 -11.40 12.60 -24.60 7 -13 24 -45.40 37.80 -71.80 13.80 -26.40 42.20 -80.40 63 -120 20.80 -39.60 39 -75 40.40 -78.40 2.80 -7 8.80 -8.80 11 -3.40 0.60 1.80 1.20 69.60 1.20 151 l0 147.80 -83 0 c-45.60 0 -83 -0.20 -83 -0.60z"/>
					</g>
					<g fill="#af3e1d">
						<path d="M1024 1038 c0 -81.40 -0.80 -148 -1.60 -148 -0.80 0 -2.80 1.20 -4.20 2.60 -1.60 1.40 -1.40 0 0.60 -4.20 1.80 -3.40 4.20 -6.40 5.20 -6.40 1 0 7.40 10.60 13.80 23.60 6.60 13 24.60 48 40.20 77.60 52.40 99 67.40 127.60 85 161.80 9.60 18.80 18.40 34.80 19.20 36 1 1 1.80 2.60 1.80 3.40 0 0.80 -36 1.60 -80 1.60 l-80 0 0 -148z"/>
					</g>
				</svg>
				<span
					class="text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.2em] leading-tight"
					style="color: var(--color-faint);"
				>
					tägliche Dosis<br class="sm:hidden" />Hoffnung
				</span>
			</a>

			<!-- Desktop nav -->
			<nav class="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] lg:text-sm">
				{#each nav as item}
					<a
						href={base + item.href}
						class="transition-colors hover:opacity-100 pb-0.5"
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

			<!-- Desktop CTA + mobile nav trigger -->
			<div class="flex items-center gap-2 sm:gap-3">
				<a
					href={base + '/newsletter'}
					class="hidden sm:inline-flex items-center gap-1.5 px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium transition-all active:scale-[0.97]"
					style="background: var(--color-ink); color: var(--color-paper);"
				>
					Newsletter
					<span aria-hidden="true" class="hidden lg:inline">→</span>
				</a>

				<!-- Mobile/Tablet hamburger -->
				<button
					type="button"
					onclick={() => (menuOpen = !menuOpen)}
					class="lg:hidden flex items-center justify-center w-10 h-10 rounded-md -mr-1"
					aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
					aria-expanded={menuOpen}
				>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" stroke-width="2" stroke-linecap="round">
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
	</div>
</header>

<!-- Mobile/Tablet drawer overlay -->
{#if menuOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="lg:hidden fixed inset-0 z-40"
		style="background: rgba(26, 24, 21, 0.35);"
		onclick={closeMenu}
		role="button"
		aria-label="Menü schließen"
	></div>

	<div
		class="lg:hidden fixed top-0 right-0 z-50 w-72 max-w-[82vw] h-full flex flex-col paper shadow-2xl animate-slide-in"
	>
		<!-- Drawer header -->
		<div class="flex items-center justify-between p-4 border-b" style="border-color: var(--color-rule);">
			<div class="flex items-center gap-2">
				<svg class="h-5 w-auto" viewBox="0 580 2048 1210" fill="none" aria-hidden="true">
					<g fill="#272626">
						<path d="M995 1714 c-89.80 -7.60 -173.60 -47.40 -242 -115 -58.40 -57.60 -98.80 -124.40 -126 -208.20 -12.60 -39 -23 -99.60 -23 -135 l0 -17.80 213 0 213 0 0 239 0 239 -8.40 -0.20 c-4.80 -0.20 -16.60 -1 -26.60 -1.80z"/>
						<path d="M606.20 1181.60 c1.40 -2.60 20.20 -37 41.80 -76.60 21.80 -39.60 58.60 -107 82 -150 23.40 -42.80 47.60 -87.40 54 -99 6.40 -11.60 17 -30.80 23.40 -43 6.60 -12 33.40 -61.20 59.60 -109 26.20 -47.80 70.80 -130.20 99.20 -183 28.40 -52.80 52.60 -97.20 53.80 -98.60 1.40 -1.40 3.80 -2.40 5.60 -2 3.20 0.60 3.40 18.80 4.40 233.60 0.80 170.60 0.40 233.40 -1.20 234.40 -1.20 0.80 -3.40 4.40 -5 8 -1.40 3.60 -20.60 40.80 -42.60 82.60 -21.80 41.80 -51.40 98 -65.60 125 -14.20 27 -29.60 56.40 -34.20 65.60 l-8.20 16.40 -134.80 0 -134.60 0 2.40 -4.40z"/>
					</g>
					<g fill="#1a1815">
						<path d="M1021.60 1713.40 c1.80 -2.20 2.40 -55.40 2 -239.20 l-0.60 -236.20 210.80 0 210.80 0 -1.20 28.60 c-5.20 124.80 -62.80 252.20 -152.60 337.20 -72.20 68.40 -154.20 104.60 -251.80 111.20 -17.40 1.20 -19.60 1 -17.40 -1.60z"/>
						<path d="M1166 1168.40 c-9 -18 -40.40 -77.80 -94.40 -180.40 -47.20 -89.40 -53.20 -102 -49.60 -104.40 2.60 -1.80 3 -29.40 2.40 -231.80 -0.40 -172.20 -1 -229.60 -2.80 -228.60 -1.40 0.80 -1.60 0.60 -0.80 -0.80 3.40 -5.60 7.60 -0.80 20.40 23.20 25.80 49 147.40 272 361.80 664.40 19 34.60 36 66 37.80 69.60 l3.40 6.40 -134.60 0 -134.60 0 -9 -17.60z"/>
					</g>
					<g fill="#c87340">
						<path d="M864 1185.40 c0 -0.40 5.80 -11.40 12.60 -24.60 7 -13 24 -45.40 37.80 -71.80 13.80 -26.40 42.20 -80.40 63 -120 20.80 -39.60 39 -75 40.40 -78.40 2.80 -7 8.80 -8.80 11 -3.40 0.60 1.80 1.20 69.60 1.20 151 l0 147.80 -83 0 c-45.60 0 -83 -0.20 -83 -0.60z"/>
					</g>
					<g fill="#a04020">
						<path d="M1024 1038 c0 -81.40 -0.80 -148 -1.60 -148 -0.80 0 -2.80 1.20 -4.20 2.60 -1.60 1.40 -1.40 0 0.60 -4.20 1.80 -3.40 4.20 -6.40 5.20 -6.40 1 0 7.40 10.60 13.80 23.60 6.60 13 24.60 48 40.20 77.60 52.40 99 67.40 127.60 85 161.80 9.60 18.80 18.40 34.80 19.20 36 1 1 1.80 2.60 1.80 3.40 0 0.80 -36 1.60 -80 1.60 l-80 0 0 -148z"/>
					</g>
				</svg>
			</div>
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
