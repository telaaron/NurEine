<script lang="ts">
	import { base } from '$app/paths';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (loading) return;
		loading = true;
		error = '';
		try {
			const res = await fetch(base + '/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			if (res.ok) {
				window.location.href = base + '/admin';
			} else {
				const data = await res.json().catch(() => ({}));
				error = data.error || 'Fehler bei der Anmeldung';
			}
		} catch {
			error = 'Verbindungsfehler. Bitte erneut versuchen.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<!-- KEIN Auto-Zoom auf iOS beim Fokus: Inputs sind 16px (siehe CSS) + dieser
	     Viewport verhindert das Reinzoomen; maximum-scale erlaubt aber Pinch. -->
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<title>Admin · NurEine</title>
</svelte:head>

<div class="login-wrap">
	<div class="card">
		<div class="brand">
			<img src="{base}/NurEine-mark.png" alt="" class="mark" aria-hidden="true" />
			<span class="brand-name">NurEine</span>
			<span class="brand-sub">Cockpit</span>
		</div>

		<form onsubmit={handleSubmit} class="form" autocomplete="on">
			<label class="field">
				<span class="label">Benutzername</span>
				<input
					type="text"
					name="username"
					autocomplete="username"
					autocapitalize="none"
					autocorrect="off"
					spellcheck="false"
					bind:value={username}
					required
				/>
			</label>
			<label class="field">
				<span class="label">Passwort</span>
				<input
					type="password"
					name="password"
					autocomplete="current-password"
					bind:value={password}
					required
				/>
			</label>

			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}

			<button type="submit" class="submit" disabled={loading}>
				{loading ? 'Anmelden …' : 'Anmelden'}
			</button>
		</form>
	</div>
</div>

<style>
	/* Fester, nicht überscrollbarer Vollbild-Hintergrund. min-height:100dvh nutzt
	   die ECHTE sichtbare Höhe (dynamic viewport) — löst das Rauf/Runter-Scrollen
	   mit iOS-Adressleiste. overflow:hidden am Wrapper verhindert Gummiband. */
	.login-wrap {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--color-canvas);
		overflow: hidden;
	}
	.card {
		width: 100%;
		max-width: 380px;
		background: var(--color-paper);
		border: 1px solid var(--color-rule);
		border-radius: 18px;
		padding: 2.4rem 2rem;
		box-shadow: 0 1px 3px rgba(26, 24, 21, 0.04), 0 12px 40px rgba(26, 24, 21, 0.06);
	}
	.brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 2rem; }
	.mark { height: 30px; width: auto; }
	.brand-name { font-family: var(--font-display); font-weight: 600; font-size: 1.3rem; color: var(--color-ink); }
	.brand-sub { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-amber); margin-top: 4px; }

	.form { display: flex; flex-direction: column; gap: 1rem; }
	.field { display: flex; flex-direction: column; gap: 0.4rem; }
	.label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-muted); font-family: var(--font-mono); }
	/* font-size:16px ist NICHT optional — darunter zoomt iOS beim Fokus rein. */
	input {
		width: 100%;
		font-size: 16px;
		font-family: var(--font-sans);
		padding: 0.75rem 0.95rem;
		border: 1px solid var(--color-rule-strong);
		border-radius: 10px;
		background: var(--color-elevated);
		color: var(--color-ink);
		transition: border-color 0.15s, box-shadow 0.15s;
		-webkit-appearance: none;
		appearance: none;
	}
	input:focus {
		outline: none;
		border-color: var(--color-amber);
		box-shadow: 0 0 0 3px var(--color-amber-soft);
	}
	.error { font-size: 0.85rem; color: var(--color-rose); margin: 0; }
	.submit {
		margin-top: 0.4rem;
		width: 100%;
		font-size: 15px;
		font-weight: 600;
		font-family: var(--font-sans);
		padding: 0.8rem;
		border: none;
		border-radius: 10px;
		background: var(--color-ink);
		color: var(--color-paper);
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}
	.submit:hover { opacity: 0.9; }
	.submit:active { transform: scale(0.99); }
	.submit:disabled { opacity: 0.6; cursor: default; }
</style>
