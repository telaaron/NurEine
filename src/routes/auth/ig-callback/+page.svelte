<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { CheckIcon } from 'heroicons-svelte/24/outline';

	let token = $state('');
	let longToken = $state('');
	let expiresIn = $state('');
	let raw = $state('');
	let copied = $state(false);

	onMount(() => {
		// Meta liefert die Token im URL-Fragment (#...), nicht in der Query.
		const frag = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
		raw = frag;
		const p = new URLSearchParams(frag);
		token = p.get('access_token') || '';
		longToken = p.get('long_lived_token') || '';
		expiresIn = p.get('expires_in') || '';
	});

	function copy(t: string) {
		navigator.clipboard?.writeText(t).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>

<section style="max-width:760px;margin:40px auto;padding:0 20px;font-family:system-ui;">
	<h1 style="font-size:22px;">Instagram-Token erfasst</h1>
	{#if longToken || token}
		<p style="color:#16a34a;">Token empfangen. Kopier den Long-Lived-Token und gib ihn an Claude.</p>

		{#if longToken}
			<h3 style="margin-top:24px;">Long-Lived Token (60 Tage) — diesen brauchen wir</h3>
			<textarea readonly rows="4" style="width:100%;font-family:monospace;font-size:12px;padding:10px;">{longToken}</textarea>
			<button onclick={() => copy(longToken)} style="margin-top:8px;padding:10px 18px;background:#16140f;color:#fff;border:none;border-radius:8px;">
				{#if copied}
					Kopiert <Icon icon={CheckIcon} />
				{:else}
					Long-Lived Token kopieren
				{/if}
			</button>
		{/if}

		<h3 style="margin-top:24px;">Short-Lived Token (Fallback)</h3>
		<textarea readonly rows="3" style="width:100%;font-family:monospace;font-size:12px;padding:10px;">{token}</textarea>

		{#if expiresIn}<p style="color:#6b6359;font-size:13px;">Short-Token läuft in {expiresIn}s ab.</p>{/if}
	{:else}
		<p style="color:#dc2626;">Kein Token im URL-Fragment gefunden. Hast du den OAuth-Flow vollständig durchlaufen?</p>
		<p style="font-size:13px;color:#6b6359;">Roh-Fragment: <code>{raw || '(leer)'}</code></p>
	{/if}
</section>
