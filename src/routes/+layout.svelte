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
	<meta property="og:image" content="{imgPath}/logo-360.png" />
	<meta property="og:image:width" content="360" />
	<meta property="og:image:height" content="78" />
	<meta name="twitter:card" content="summary" />

	<!-- Canonical -->
	<link rel="canonical" href="https://nureine.de" />

	<!-- Favicon: modern SVG + legacy ICO + PWA apple-touch-icon -->
	<link rel="icon" type="image/svg+xml" href="{imgPath}/favicon.svg" />
	<link rel="icon" sizes="32x32" href="{imgPath}/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="{imgPath}/favicon-180.png" />

	<!-- Web app capabilities -->
	<meta name="theme-color" content="#f5f1ea" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

<Header />
<main>{@render children?.()}</main>
<Footer />
