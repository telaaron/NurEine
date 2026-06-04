<script lang="ts">
        import '../app.css';
        import Header from '$lib/components/Header.svelte';
        import Footer from '$lib/components/Footer.svelte';
        import Ticker from '$lib/components/Ticker.svelte';
        import { dev } from '$app/environment';
        import { base } from '$app/paths';
        import { page } from '$app/state';
        import { injectAnalytics } from '@vercel/analytics/sveltekit';
        import { afterNavigate } from '$app/navigation';
        import { track } from '$lib/track';
        import { captureRef } from '$lib/referral';

        let { children, data } = $props();

        // Vercel Web Analytics (cookieless pageviews)
        injectAnalytics({ mode: dev ? 'development' : 'production' });

        // First-party pageview events (owned funnel data) + referral capture
        afterNavigate(() => { track('pageview'); captureRef(); });

        const pagePath = $derived(page.url.pathname.replace(base, '') || '/');
        const canonicalUrl = $derived(
                `https://nureine.de${pagePath === '/' ? '' : pagePath}`
        );

        const isStory = $derived(!!page?.data?.story);
        const isIndex = $derived(pagePath === '/');
        // Admin has its own chrome — skip the public Header/Ticker/Footer there.
        const isAdmin = $derived(pagePath.startsWith('/admin'));

        const pathTitles: Record<string, string> = {
                '/lokal': 'Lokal',
                '/archiv': 'Archiv',
                '/preise': 'Preise',
                '/manifest': 'Manifest',
                '/methodik': 'Methodik',
                '/warum': 'Warum NurEine',
                '/einreichen': 'Geschichte einreichen',
                '/karte': 'Karte',
                '/newsletter': 'Newsletter',
                '/bei-dir': 'Bei dir'
        };

        const seoTitle = $derived(
                isStory ? `${page.data.story.title} — NurEine` : 
                (pathTitles[pagePath] ? `${pathTitles[pagePath]} — NurEine` : 'NurEine — Ehrlicher Fortschritt, täglich')
        );

        const seoDesc = $derived(
                isStory ? page.data.story.dek : 
                'Wir berichten nicht, dass die Welt gut ist — wir zeigen, wo sie besser wird. Täglich eine belegte Geschichte über echten Fortschritt, in zwei Minuten. Kein Feed, kein Algorithmus.'
        );

        // JPEG for og:image — universally supported by WhatsApp, iMessage, Facebook, Twitter
        // (JPEG stays well under WhatsApp's 600 KB limit; PNG also available via srcset)
        const seoImage = $derived(
                isStory
                        ? (page.data.story.ogImageUrl || `https://nureine.de/api/og/${page.data.story.slug}`)
                        : 'https://nureine.de/og-default.jpeg'
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
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={seoTitle} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="NurEine" />
        <meta property="og:locale" content="de_DE" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={seoImage} />
        <meta name="twitter:image:alt" content={seoTitle} />

        <link rel="canonical" href={canonicalUrl} />

        <link rel="icon" type="image/svg+xml" href="{base}/NurEine.svg" />
        <link rel="apple-touch-icon" href="{base}/NurEine.svg" />

        <meta name="theme-color" content="#f5f1ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {@html `<script type="application/ld+json">${JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'NurEine',
                url: 'https://nureine.de',
                logo: 'https://nureine.de/NurEine.svg',
                description: 'Eine kuratierte gute Nachricht pro Tag — werbefrei, ohne Algorithmus.'
        })}</scr` + `ipt>`}
</svelte:head>

{#if isAdmin}
        {@render children?.()}
{:else}
        <Ticker story={data?.ticker ?? null} />
        <Header />
        <main>{@render children?.()}</main>
        <Footer />
{/if}
