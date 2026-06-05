<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard' },
		{ href: '/admin/audience', label: 'Audience' },
		{ href: '/admin/b2b', label: 'B2B Pipeline' },
		{ href: '/admin/stories', label: 'Stories' },
		{ href: '/admin/submissions', label: 'Einsendungen' },
		{ href: '/admin/social', label: 'Social' },
		{ href: '/admin/delivery', label: 'Delivery' },
	];

	function isActive(path: string) {
		return $page.url.pathname === path;
	}
</script>

<div class="min-h-screen flex" style="background: var(--color-canvas);">
	<!-- Sidebar -->
	<aside
		class="flex flex-col w-56 shrink-0 border-r"
		style="background: var(--color-paper); border-color: var(--color-rule); min-height: 100vh;"
	>
		<!-- Brand -->
		<div class="px-5 py-4 border-b" style="border-color: var(--color-rule);">
			<a
				href={base + '/admin'}
				class="text-sm font-semibold tracking-wide"
				style="color: var(--color-ink);"
			>
				NurEine Admin
			</a>
		</div>

		<!-- Nav -->
		<nav class="flex-1 px-3 py-4 flex flex-col gap-0.5">
			{#each navItems as item}
				<a
					href={base + item.href}
					class="flex items-center px-3 py-2 rounded text-sm font-medium transition-colors"
					style={isActive(item.href)
						? 'background: var(--color-ink); color: var(--color-paper);'
						: 'color: var(--color-ink-soft);'}
					onmouseenter={(e) => {
						if (!isActive(item.href)) e.currentTarget.style.background = 'var(--color-canvas)';
					}}
					onmouseleave={(e) => {
						if (!isActive(item.href)) e.currentTarget.style.background = 'transparent';
					}}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Bottom actions -->
		<div class="px-3 py-4 border-t flex flex-col gap-1.5" style="border-color: var(--color-rule);">
			<a
				href={base + '/'}
				class="flex items-center px-3 py-2 rounded text-sm transition-colors"
				style="color: var(--color-ink-soft);"
				onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-canvas)'; }}
				onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
			>
				← Zur Website
			</a>
			<button
				type="button"
				onclick={async () => {
					await fetch(base + '/api/auth/logout', { method: 'POST' });
					window.location.href = base + '/admin/login';
				}}
				class="flex items-center px-3 py-2 rounded text-sm text-left transition-colors"
				style="color: #c5221f;"
				onmouseenter={(e) => { e.currentTarget.style.background = 'rgba(197,34,31,0.08)'; }}
				onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
			>
				Abmelden
			</button>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-auto" style="background: var(--color-canvas);">
		{@render children()}
	</main>
</div>
