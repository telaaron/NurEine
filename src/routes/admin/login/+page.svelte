<script lang="ts">
	import { base } from '$app/paths';
	import { startAuthentication } from '@simplewebauthn/browser';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let passkeyLoading = $state(false);
	let showPassword = $state(false); // Passwort ist der Rückfall, standardmäßig eingeklappt.

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

	// Face ID / Touch ID: Challenge holen → Gerät entsperren → verifizieren.
	async function handlePasskey() {
		if (passkeyLoading) return;
		passkeyLoading = true;
		error = '';
		try {
			const begin = await fetch(base + '/api/auth/passkey/auth-begin', { method: 'POST' });
			if (!begin.ok) throw new Error('begin');
			const { challengeId, options } = await begin.json();

			const response = await startAuthentication({ optionsJSON: options });

			const finish = await fetch(base + '/api/auth/passkey/auth-finish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ challengeId, response })
			});
			if (finish.ok) {
				window.location.href = base + '/admin';
			} else {
				const data = await finish.json().catch(() => ({}));
				error = data.error || 'Anmeldung mit Face ID fehlgeschlagen.';
			}
		} catch (e) {
			// Abbruch durch den Nutzer ist kein Fehler, den man anzeigen muss.
			const name = e instanceof Error ? e.name : '';
			if (name !== 'NotAllowedError' && name !== 'AbortError') {
				error = 'Face ID nicht verfügbar. Bitte mit Passwort anmelden.';
			}
		} finally {
			passkeyLoading = false;
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

		<!-- Hauptweg: Face ID / Touch ID -->
		<button type="button" class="passkey" onclick={handlePasskey} disabled={passkeyLoading}>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" />
				<path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2-2v-2" />
				<path d="M9 10a3 3 0 0 1 6 0" /><path d="M12 13v2" />
				<path d="M8.5 16.5a5 5 0 0 0 7 0" />
			</svg>
			{passkeyLoading ? 'Warte auf Face ID …' : 'Mit Face ID anmelden'}
		</button>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<!-- Rückfall: Passwort (eingeklappt, bis man es braucht) -->
		{#if !showPassword}
			<button type="button" class="fallback-toggle" onclick={() => (showPassword = true)}>
				Mit Passwort anmelden
			</button>
		{:else}
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

				<button type="submit" class="submit" disabled={loading}>
					{loading ? 'Anmelden …' : 'Anmelden'}
				</button>
			</form>
		{/if}
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
	/* Hauptweg: Face ID — dunkler, primärer Button ganz oben. */
	.passkey {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		width: 100%;
		font-size: 15px;
		font-weight: 600;
		font-family: var(--font-sans);
		padding: 0.85rem;
		border: none;
		border-radius: 10px;
		background: var(--color-ink);
		color: var(--color-paper);
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}
	.passkey:hover { opacity: 0.9; }
	.passkey:active { transform: scale(0.99); }
	.passkey:disabled { opacity: 0.6; cursor: default; }

	/* Rückfall-Link: dezent, textartig. */
	.fallback-toggle {
		width: 100%;
		margin-top: 0.9rem;
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--color-muted);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.fallback-toggle:hover { color: var(--color-ink); }

	.error { font-size: 0.85rem; color: var(--color-rose); margin: 0.9rem 0 0; }
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
