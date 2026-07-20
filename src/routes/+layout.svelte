<script lang="ts">
        import '../app.css';
        import Header from '$lib/components/Header.svelte';
        import Footer from '$lib/components/Footer.svelte';
        import Ticker from '$lib/components/Ticker.svelte';
        import MaintenanceNotice from '$lib/components/MaintenanceNotice.svelte';
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
        // Admin and the native app shell have their own chrome — skip the
        // public Header/Ticker/Footer there.
        const isAdmin = $derived(pagePath.startsWith('/admin'));
        const isApp = $derived(pagePath.startsWith('/app'));
        const isBare = $derived(isAdmin || isApp);

        const pathTitles: Record<string, string> = {
                '/lokal': 'Lokal',
                '/archiv': 'Archiv',
                '/preise': 'Preise',
                '/manifest': 'Manifest',
                '/methodik': 'Methodik',
                '/stand-der-welt': 'Der Stand der Welt',
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
                isStory
                        ? `${page.data.story.dek} · Eine gute Nachricht am Tag — ehrlicher Fortschritt, belegt. Kostenlos auf nureine.de`
                        : 'Wir berichten nicht, dass die Welt gut ist — wir zeigen, wo sie besser wird. Täglich eine belegte Geschichte über echten Fortschritt, in zwei Minuten. Kein Feed, kein Algorithmus.'
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

        <link rel="icon" type="image/png" sizes="32x32" href="{base}/icon-32.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="{base}/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="{base}/icon-180.png" />

        <!-- Browser-Leiste mitfärben: hell = Papier-Creme, dunkel = App-Anthrazit.
             Ohne das bliebe die Leiste am Handy hell über dunkler Seite. -->
        <meta name="theme-color" content="#f5f1ea" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0e0e0f" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {@html `<script type="application/ld+json">${JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                        {
                                // NewsMediaOrganization (nicht nur Organization): signalisiert Google
                                // klar „dies ist ein Nachrichten-Anbieter" → relevanter fürs Knowledge Panel.
                                '@type': 'NewsMediaOrganization',
                                '@id': 'https://nureine.de/#org',
                                name: 'NurEine',
                                alternateName: ['NurEine.de', 'Nur Eine'],
                                url: 'https://nureine.de',
                                logo: {
                                        '@type': 'ImageObject',
                                        url: 'https://nureine.de/icon-512.png',
                                        caption: 'NurEine'
                                },
                                image: 'https://nureine.de/og-default.jpeg',
                                description: 'NurEine ist eine Good-News-Plattform aus Teltow (Brandenburg). Sie misst Fortschritt daran, ob Menschen gesünder, sicherer, freier und verbundener leben — überparteilich, auf Basis der Human-Flourishing-Forschung. Jede Geschichte bekommt einen transparenten Wirkungsindex (0–100).',
                                slogan: 'Eine Geschichte am Tag. Mehr nicht.',
                                foundingDate: '2026',
                                foundingLocation: {
                                        '@type': 'Place',
                                        address: { '@type': 'PostalAddress', addressLocality: 'Teltow', addressRegion: 'Brandenburg', addressCountry: 'DE' }
                                },
                                areaServed: { '@type': 'Place', name: 'Deutschsprachiger Raum (DACH)' },
                                knowsAbout: ['Gesundheit', 'Bildung', 'Ökologie', 'Sicherheit', 'Gemeinschaft', 'Innovation', 'Selbstbestimmung', 'Konstruktiver Journalismus', 'Good News', 'Lösungsjournalismus'],
                                ethicsPolicy: 'https://nureine.de/werte',
                                diversityPolicy: 'https://nureine.de/werte',
                                publishingPrinciples: 'https://nureine.de/methodik',
                                sameAs: ['https://instagram.com/nureine.de']
                        },
                        {
                                '@type': 'WebSite',
                                '@id': 'https://nureine.de/#website',
                                url: 'https://nureine.de',
                                name: 'NurEine',
                                alternateName: 'NurEine — Gute Nachrichten',
                                publisher: { '@id': 'https://nureine.de/#org' },
                                inLanguage: 'de-DE',
                                potentialAction: {
                                        '@type': 'SearchAction',
                                        target: { '@type': 'EntryPoint', urlTemplate: 'https://nureine.de/archiv?q={search_term_string}' },
                                        'query-input': 'required name=search_term_string'
                                }
                        }
                ]
        })}</scr` + `ipt>`}
</svelte:head>

{#if isBare}
        {@render children?.()}
{:else}
        <MaintenanceNotice />
        <Ticker story={data?.ticker ?? null} />
        <Header />
        <main>{@render children?.()}</main>
        <Footer />
{/if}
