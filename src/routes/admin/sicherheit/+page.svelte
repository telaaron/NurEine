<script lang="ts">
	import { base } from '$app/paths';
	import { startRegistration } from '@simplewebauthn/browser';

	let busy = $state(false);
	let msg = $state('');
	let ok = $state(false);

	async function addPasskey() {
		if (busy) return;
		busy = true;
		msg = '';
		ok = false;
		try {
			const begin = await fetch(base + '/api/auth/passkey/register-begin', { method: 'POST' });
			if (!begin.ok) throw new Error('begin');
			const { challengeId, options } = await begin.json();

			const response = await startRegistration({ optionsJSON: options });

			const label = `${navigator.platform || 'Gerät'} · ${new Date().toLocaleDateString('de-DE')}`;
			const finish = await fetch(base + '/api/auth/passkey/register-finish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ challengeId, response, deviceLabel: label })
			});
			if (finish.ok) {
				ok = true;
				msg = 'Passkey gespeichert. Du kannst dich ab jetzt mit Face ID anmelden.';
			} else {
				const data = await finish.json().catch(() => ({}));
				msg = data.error || 'Konnte den Passkey nicht speichern.';
			}
		} catch (e) {
			const name = e instanceof Error ? e.name : '';
			if (name === 'NotAllowedError' || name === 'AbortError') {
				msg = 'Abgebrochen.';
			} else {
				msg = 'Face ID / Passkey wird auf diesem Gerät nicht unterstützt.';
			}
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Sicherheit · NurEine Cockpit</title></svelte:head>

<div class="wrap">
	<h1 class="display">Sicherheit</h1>
	<p class="lede">
		Melde dich künftig mit <strong>Face ID</strong> oder <strong>Touch ID</strong> an, statt ein
		Passwort zu tippen. Der Schlüssel bleibt sicher auf deinem Gerät (Secure Enclave) und wird über
		den iCloud-Schlüsselbund zwischen iPhone und Mac synchronisiert.
	</p>

	<div class="card">
		<div class="row">
			<div>
				<div class="row-title">Passkey für dieses Gerät anlegen</div>
				<div class="row-sub">Einmalig pro Gerät. Danach reicht ein Blick oder Fingerabdruck.</div>
			</div>
			<button class="btn" onclick={addPasskey} disabled={busy}>
				{busy ? 'Warte …' : 'Passkey anlegen'}
			</button>
		</div>
		{#if msg}
			<p class="msg" class:ok role="status">{msg}</p>
		{/if}
	</div>

	<p class="hint">
		Das Passwort bleibt als Rückfall bestehen — falls du dich mal auf einem fremden Gerät anmelden
		musst.
	</p>
</div>

<style>
	.wrap { max-width: 640px; }
	.display { font-size: 1.9rem; color: var(--color-ink); margin: 0 0 0.5rem; }
	.lede { color: var(--color-ink-soft); line-height: 1.6; margin: 0 0 1.6rem; }
	.card {
		background: var(--color-paper);
		border: 1px solid var(--color-rule);
		border-radius: 14px;
		padding: 1.4rem 1.5rem;
	}
	.row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	.row-title { font-weight: 600; color: var(--color-ink); }
	.row-sub { font-size: 0.85rem; color: var(--color-muted); margin-top: 0.2rem; }
	.btn {
		flex-shrink: 0;
		font-size: 14px;
		font-weight: 600;
		font-family: var(--font-sans);
		padding: 0.65rem 1.1rem;
		border: none;
		border-radius: 10px;
		background: var(--color-ink);
		color: var(--color-paper);
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.btn:hover { opacity: 0.9; }
	.btn:disabled { opacity: 0.6; cursor: default; }
	.msg { margin: 1rem 0 0; font-size: 0.9rem; color: var(--color-rose); }
	.msg.ok { color: var(--color-ink-soft); }
	.hint { margin-top: 1.2rem; font-size: 0.85rem; color: var(--color-muted); line-height: 1.5; }
</style>
