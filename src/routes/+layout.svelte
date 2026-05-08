<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { base } from '$app/paths';

	let { children } = $props();

	const imgPath = base + '/images';
</script>

<svelte:head>
	<title>NurEine — Gute Nachrichten. Jeden Tag exakt eine.</title>
	<meta
		name="description"
		content="NurEine filtert tausende Quellen mit KI auf das Wesentliche: Geschichten, die zeigen, dass die Welt voranschreitet. Anti-Doomscroll, deutsch und kuratiert."
	/>

	<!-- SEO & Social -->
	<meta property="og:title" content="NurEine — Gute Nachrichten. Jeden Tag eine." />
	<meta property="og:description" content="Eine Geschichte am Tag. Mehr nicht." />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="{base}/NurEine.svg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary" />

	<!-- Canonical -->
	<link rel="canonical" href="https://nureine.de" />

	<!-- Favicon: NurEine SVG logo -->
	<link rel="icon" type="image/svg+xml" href="{base}/NurEine.svg" />
	<link rel="apple-touch-icon" href="{base}/NurEine.svg" />

	<!-- Web app capabilities -->
	<meta name="theme-color" content="#f5f1ea" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

<Header />
<main>{@render children?.()}</main>
<Footer />
