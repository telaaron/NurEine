<script lang="ts">
	// Screen 3 — Der Himmel. Das Zuhause (Konzept B): die stille Sammlung.
	// Client-seitig (localStorage). Nach dem Lesen ist DAS das Zuhause, in das das
	// neue Licht geflogen ist (Home-Logik aus dem Bauplan).
	import { onMount } from 'svelte';
	import SkyView from '$lib/app-v2/SkyView.svelte';
	import { collection } from '$lib/app-v2/collection.svelte';
	import { base } from '$app/paths';

	let ready = $state(false);

	onMount(() => {
		collection.hydrate();
		ready = true;
	});
</script>

<svelte:head>
	<title>Dein Himmel · NurEine</title>
	<meta name="theme-color" content="#0e0d12" />
</svelte:head>

{#if ready}
	<div class="himmel-wrap">
		<SkyView lights={collection.all} total={collection.total} sinceDay={collection.since} />
		<div class="himmel-foot">
			{#if collection.earned === 0}
				<p class="himmel-note">
					Noch kein eigenes Licht. Deine erste Ausgabe wartet — die drei Lichter oben hast du
					geschenkt bekommen: Fortschritt, der schon läuft.
				</p>
			{/if}
			<a class="pill" href={base + '/app'}>Zur heutigen Ausgabe</a>
		</div>
	</div>
{:else}
	<div class="himmel-boot"></div>
{/if}

<style>
	.himmel-wrap {
		position: relative;
		min-height: 100dvh;
	}
	.himmel-boot {
		min-height: 100dvh;
		background: linear-gradient(180deg, #0e0d12 0%, #16140f 42%, #241a10 72%, #3a2413 88%, #4d2e15 100%);
	}
	.himmel-foot {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 6;
		padding: 0 26px max(34px, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.himmel-note {
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--ink-muted);
		text-align: center;
		max-width: 34ch;
		margin: 0 auto;
	}
	.pill {
		width: 100%;
		text-align: center;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 15px;
		background: var(--amber-hi);
		color: #fff;
		border: none;
		border-radius: 999px;
		padding: 16px;
		text-decoration: none;
	}
</style>
