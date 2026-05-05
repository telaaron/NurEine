<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Lichtblick — Eine Geschichte am Tag, die dich aufrichtet</title>
	<meta
		name="description"
		content="Lichtblick filtert tausende Quellen mit KI auf das Wesentliche: Geschichten, die zeigen, dass die Welt voranschreitet. Anti-Doomscroll, deutsch und kuratiert."
	/>
</svelte:head>

<Header />
<main>{@render children?.()}</main>
<Footer />
