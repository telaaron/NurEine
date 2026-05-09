<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	// Dynamic canonical URL — pages can override via svelte:head, layout provides fallback
	const pagePath = $derived(page.url.pathname.replace(base, '') || '/');
	const canonicalUrl = $derived(
		`https://nureine.de${pagePath === '/' ? '' : pagePath}`
	);
</script>

<svelte:head>
	<title>NurEine — Gute Nachrichten. Jeden Tag exakt eine.</title>
	<meta
		name="description"
		content="NurEine filtert tausende Quellen mit KI auf das Wesentliche: Geschichten, die zeigen, dass die Welt voranschreitet. Anti-Doomscroll, deutsch und kuratiert."
	/>

	<!-- SEO & Social (fallback, pages override these) -->
	<meta property="og:title" content="NurEine — Gute Nachrichten. Jeden Tag eine." />
	<meta property="og:description" content="Eine Geschichte am Tag. Mehr nicht." />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://nureine.de/NurEine.svg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content="https://nureine.de" />
	<meta property="og:site_name" content="NurEine" />
	<meta property="og:locale" content="de_DE" />
	<meta name="twitter:card" content="summary_large_image" />

	<!-- Canonical (overridden by pages with specific slugs) -->
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
