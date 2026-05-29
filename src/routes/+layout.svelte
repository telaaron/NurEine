<script lang="ts">
        import '../app.css';
        import Header from '$lib/components/Header.svelte';
        import Footer from '$lib/components/Footer.svelte';
        import { base } from '$app/paths';
        import { page } from '$app/state';

        let { children } = $props();

        const pagePath = $derived(page.url.pathname.replace(base, '') || '/');
        const canonicalUrl = $derived(
                `https://nureine.de${pagePath === '/' ? '' : pagePath}`
        );

        const isStory = $derived(!!page?.data?.story);
        const isIndex = $derived(pagePath === '/');

        const pathTitles: Record<string, string> = {
                '/lokal': 'Lokal',
                '/archiv': 'Archiv',
                '/preise': 'Preise',
                '/manifest': 'Manifest',
                '/karte': 'Karte',
                '/newsletter': 'Newsletter',
                '/bei-dir': 'Bei dir'
        };

        const seoTitle = $derived(
                isStory ? `${page.data.story.title} — NurEine` : 
                (pathTitles[pagePath] ? `${pathTitles[pagePath]} — NurEine` : 'NurEine — Dein täglicher Lichtblick')
        );

        const seoDesc = $derived(
                isStory ? page.data.story.dek : 
                'Wir filtern tausende Quellen mit KI auf das Wesentliche. Eine gute Nachricht am Tag gegen die Reizüberflutung. Exklusiv, neutral und kuratiert.'
        );

        const seoImage = $derived(
                isStory 
                        ? (page.data.story.ogImageUrl || `https://nureine.de/api/og/${page.data.story.slug}`) 
                        : 'https://nureine.de/og-default.png'
        );

        const seoType = $derived(isStory ? 'article' : 'website');
</script>

<svelte:head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />

        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:type" content={seoType} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="NurEine" />
        <meta property="og:locale" content="de_DE" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={seoImage} />

        <link rel="canonical" href={canonicalUrl} />

        <link rel="icon" type="image/svg+xml" href="{base}/NurEine.svg" />
        <link rel="apple-touch-icon" href="{base}/NurEine.svg" />

        <meta name="theme-color" content="#f5f1ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

<Header />
<main>{@render children?.()}</main>
<Footer />
