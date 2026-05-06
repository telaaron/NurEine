<script lang="ts">
	import { base } from '$app/paths';

	let { children } = $props();
	let sidebarOpen = $state(false);
</script>

<!-- Mobile backdrop -->
{#if sidebarOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-10 lg:hidden"
		style="background: rgba(0,0,0,0.3);"
		role="button"
		onclick={() => (sidebarOpen = false)}
		aria-label="Menü schließen"
	></div>
{/if}

<!-- Mobile header bar -->
<div
	class="lg:hidden flex items-center justify-between p-4 border-b"
	style="background: var(--color-paper); border-color: var(--color-rule);"
>
	<a href={base + '/admin'} class="serif text-lg" style="color: var(--color-ink); font-weight: 500;">
		Lichtblick Admin
	</a>
	<button
		type="button"
		onclick={() => (sidebarOpen = !sidebarOpen)}
		class="p-2 rounded-md"
		style="color: var(--color-ink);"
		aria-label="Menü öffnen"
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			{#if sidebarOpen}
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

<div class="min-h-screen flex" style="background: var(--color-canvas);">
	<!-- Sidebar -->
	<nav
		class="w-56 shrink-0 paper p-6 border-r flex flex-col gap-6 transition-transform duration-200"
		style="border-color: var(--color-rule); min-height: 100vh;
      {sidebarOpen ? '' : 'transform: translateX(-100%);'}
      position: fixed; left: 0; top: 0; z-index: 20;
      "
		class:sidebar-open={sidebarOpen}
	>
		<div class="flex items-center justify-between lg:justify-start">
			<a href={base + '/admin'} class="serif text-xl" style="color: var(--color-ink); font-weight: 500;">
				Lichtblick
			</a>
			<button
				type="button"
				onclick={() => (sidebarOpen = false)}
				class="lg:hidden p-1"
				aria-label="Menü schließen"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>
		<div class="flex flex-col gap-2 text-sm">
			<a href={base + '/admin'} class="px-3 py-2 rounded-[4px] hover:opacity-70" style="color: var(--color-ink-soft);">
				Dashboard
			</a>
			<a href={base + '/admin/stories'} class="px-3 py-2 rounded-[4px] hover:opacity-70" style="color: var(--color-ink-soft);">
				Stories
			</a>
		</div>
		<div class="mt-auto pt-6 border-t text-xs" style="border-color: var(--color-rule);">
			<a href={base + '/'} class="hover:opacity-70" style="color: var(--color-muted);">← Zurück zur Seite</a>
			<button
				type="button"
				onclick={async () => {
					await fetch(base + '/api/auth/logout', { method: 'POST' });
					window.location.href = base + '/admin/login';
				}}
				class="block mt-2 hover:opacity-70"
				style="color: var(--color-rose);"
			>
				Abmelden
			</button>
		</div>
	</nav>

	<!-- Override fixed position on desktop -->
	<style>
		:global(nav) {
			position: fixed;
		}
		@media (min-width: 1024px) {
			:global(nav) {
				position: sticky !important;
				transform: none !important;
			}
		}
	</style>

	<main class="flex-1 p-4 lg:p-8 min-w-0">
		{@render children()}
	</main>
</div>
