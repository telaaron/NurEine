<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard' },
		{ href: '/admin/audience', label: 'Audience' },
		{ href: '/admin/b2b', label: 'B2B' },
		{ href: '/admin/stories', label: 'Stories' },
		{ href: '/admin/delivery', label: 'Delivery' },
	];

	function isActive(path: string) {
		return $page.url.pathname === path;
	}
</script>

<div class="min-h-screen flex flex-col" style="background: var(--color-bg);">
	<!-- Top nav bar – always visible -->
	<header
		class="flex items-center justify-between px-4 sm:px-6 py-3 border-b"
		style="background: var(--color-card); border-color: var(--color-rule);"
	>
		<div class="flex items-center gap-6">
			<a href={base + '/admin'} class="font-semibold text-sm tracking-wide" style="color: var(--color-ink);">
				NurEine Admin
			</a>
			<nav class="flex items-center gap-1">
				{#each navItems as item}
					<a
						href={base + item.href}
						class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
						class:active={isActive(item.href)}
						style={isActive(item.href)
							? 'background: var(--color-ink); color: var(--color-bg);'
							: 'color: var(--color-dim);'}
						onmouseenter={(e) => {
							if (!isActive(item.href)) e.currentTarget.style.color = 'var(--color-ink)';
						}}
						onmouseleave={(e) => {
							if (!isActive(item.href)) e.currentTarget.style.color = 'var(--color-dim)';
						}}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
		<div class="flex items-center gap-3 text-xs">
			<a href={base + '/'} style="color: var(--color-dim);" class="hover:underline">→ Website</a>
			<button
				type="button"
				onclick={async () => {
					await fetch(base + '/api/auth/logout', { method: 'POST' });
					window.location.href = base + '/admin/login';
				}}
				style="color: #c5221f;"
				class="hover:underline"
			>
				Abmelden
			</button>
		</div>
	</header>

	<main class="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
		{@render children()}
	</main>
</div>
