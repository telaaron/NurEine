<script lang="ts">
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<div class="min-h-screen flex" style="background: var(--color-canvas);">
	<nav class="w-56 shrink-0 paper p-6 border-r flex flex-col gap-6" style="border-color: var(--color-rule); min-height: 100vh;">
		<a href={base + '/admin'} class="serif text-xl" style="color: var(--color-ink); font-weight: 500;">
			Lichtblick
		</a>
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
	<main class="flex-1 p-8">
		{@render children()}
	</main>
</div>
