<script lang="ts">
	import { base } from '$app/paths';
	import { enhance } from '$app/forms';

	let username = $state('');
	let password = $state('');
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		const res = await fetch(base + '/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		if (res.ok) {
			window.location.href = base + '/admin';
		} else {
			const data = await res.json();
			error = data.error || 'Fehler bei der Anmeldung';
		}
	}
</script>

<section class="min-h-screen flex items-center justify-center" style="background: var(--color-canvas);">
	<div class="paper p-10 rounded-[8px] w-full max-w-sm" style="border: 1px solid var(--color-rule);">
		<h1 class="display text-2xl" style="color: var(--color-ink);">Admin Login</h1>
		<form onsubmit={handleSubmit} class="mt-8 space-y-4">
			<label class="block">
				<span class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Benutzername</span>
				<input
					type="text"
					bind:value={username}
					class="w-full mt-1 px-4 py-2.5 rounded-full text-sm bg-transparent"
					style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);"
				/>
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.16em]" style="color: var(--color-faint);">Passwort</span>
				<input
					type="password"
					bind:value={password}
					class="w-full mt-1 px-4 py-2.5 rounded-full text-sm bg-transparent"
					style="border: 1px solid var(--color-rule-strong); color: var(--color-ink);"
				/>
			</label>
			{#if error}
				<p class="text-sm" style="color: var(--color-rose);">{error}</p>
			{/if}
			<button
				type="submit"
				class="w-full px-6 py-2.5 rounded-full text-sm font-medium"
				style="background: var(--color-ink); color: var(--color-paper);"
			>
				Anmelden
			</button>
		</form>
	</div>
</section>
