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

	function active(href: string) {
		const path = page.url.pathname.replace(base, '') || '/';
		if (href === '/') return path === '/' || path === '';
		return path.startsWith(href);
	}
</script>

<header class="border-b" style="border-color: var(--color-rule);">
	<div class="mx-auto max-w-[1180px] px-6 lg:px-10">
		<div class="flex items-center justify-between py-5">
			<a href={base + '/'} class="flex items-baseline gap-3 group">
				<span class="serif text-2xl font-medium tracking-tight" style="color: var(--color-ink);"
					>Lichtblick</span
				>
				<span
					class="hidden md:inline text-[11px] uppercase tracking-[0.18em]"
					style="color: var(--color-faint);"
				>
					tägliche Dosis Hoffnung
				</span>
			</a>

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

			<a
				href={base + '/newsletter'}
				class="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Newsletter
				<span aria-hidden="true">→</span>
			</a>
		</div>
	</div>
</header>
