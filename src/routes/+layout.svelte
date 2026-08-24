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
                '/archiv': 'Archiv',
                '/preise': 'Preise',
                '/manifest': 'Manifest',
                '/methodik': 'Methodik',
                '/stand-der-welt': 'Der Stand der Welt',
                '/warum': 'Warum NurEine',
                '/einreichen': 'Geschichte einreichen',
                '/karte': 'Karte',
                '/newsletter': 'Newsletter',
                '/bei-dir': 'Bei dir',
                '/ueber-uns': 'Was ist NurEine?',
                '/archiv/alle': 'Alle Geschichten'
        };

        const seoTitle = $derived(
                isStory ? `${page.data.story.title} — NurEine` : 
                (pathTitles[pagePath] ? `${pathTitles[pagePath]} — NurEine` : 'NurEine — Ehrlicher Fortschritt, täglich')
        );

        // ALLE seitenspezifischen Descriptions stehen hier — bewusst zentral.
        //
        // Grund: <svelte:head> dedupliziert NICHT über die Layout-/Seiten-Grenze
        // hinweg (per SSR-Test 2026-07-26 verifiziert; auch ein gemeinsames `id`
        // hilft nicht). Setzt eine Seite zusätzlich ihre eigene Description, stehen
        // ZWEI Tags im HTML — das generische Layout-Tag zuerst, und genau das wertet
        // Google. Die sorgfältig geschriebene Beschreibung der Seite verpufft.
        //
        // Darum gilt: das description-Tag wird NUR hier gerendert. Eine neue Seite
        // trägt ihren Text in pathDescriptions ein statt ein eigenes <meta> zu setzen.
        const pathDescriptions: Record<string, string> = {
                '/ueber-uns':
                        'NurEine ist eine deutschsprachige Good-News-Plattform aus Teltow (Brandenburg), gegründet 2026: eine belegte gute Nachricht pro Tag mit transparentem Wirkungsindex. Nicht zu verwechseln mit dem Film „Nur eine Frau“ (2019) oder der Chemikalie „neurine“.',
                '/bei-dir':
                        'Gute Nachrichten aus deiner Nähe — jede Geschichte nach Entfernung zu dir sortiert, auf einer Karte mit dir im Mittelpunkt. Belegter Fortschritt vor deiner Haustür, in deiner Region und darüber hinaus.',
                '/datenschutz':
                        'Wie NurEine personenbezogene Daten verarbeitet — DSGVO-konform, transparent.',
                '/einreichen':
                        'Kennst du eine gute Nachricht, die mehr Menschen sehen sollten? Reiche sie bei NurEine ein — wir prüfen jede Einsendung.',
                '/fuer-unternehmen':
                        'Täglich eine belegte gute Nachricht für eure Office-Screens, euren Newsletter und euer Intranet. 30 Tage kostenlos testen.',
                '/gute-nachrichten-app':
                        'NurEine ist die App für gute Nachrichten ohne Algorithmus: eine belegte Geschichte pro Tag mit messbarem Wirkungsindex. Kein Feed, werbefrei. Als Website, Newsletter und iOS-App.',
                '/heute':
                        'Die Geschichte des Tages — fertige Karten und Texte zum Teilen.',
                '/impressum':
                        'Impressum und Anbieterkennzeichnung von NurEine.',
                '/lichtblick':
                        'Lies die gute Nachricht von heute — und bekomm jeden Morgen eine. Belegt, werbefrei, in zwei Minuten.',
                '/methodik':
                        'Vollständig offengelegt: Quellen, Gewichtungen und Grenzen des NurEine-Wirkungsindex. Keine Blackbox. Prüf uns nach.',
                '/nutzungsbedingungen':
                        'Nutzungsbedingungen für das Angebot von NurEine.',
                '/redaktion':
                        'Transparenz statt Blackbox: Welche Primärquellen NurEine pro Themen-Beat beobachtet — und warum wir Daten statt Lärm folgen.',
                '/roadmap':
                        'Was bei NurEine neu ist, woran wir arbeiten und was geplant ist — transparent. Gib Feedback und gestalte mit.',
                '/stand-der-welt':
                        'Auf den Metriken, die wirklich zählen, bewegt sich die Welt in die richtige Richtung. Kuratierte Langzeit-Daten — und ehrlich, was wir nicht zeigen.',
                '/teilen':
                        'Empfiehl NurEine weiter: wähle Plattform und Zielgruppe, bekomme eine fertige Karte und den passenden Text — mit deinem Empfehlungslink.',
                '/unterstuetzer':
                        'Menschen, die NurEine durch Weiterempfehlung mittragen.',
                '/archiv/alle':
                        'Das vollständige Verzeichnis aller Geschichten von NurEine — chronologisch nach Monat, ungefiltert. Jede belegte gute Nachricht seit 2026 auf einen Blick.',
                '/werte':
                        'NurEine misst Fortschritt daran, ob Menschen gesünder, sicherer, freier und verbundener leben. Sieben universelle Bereiche, kein Partei-Framing, kein Aktivismus — transparent offengelegt.'
        };

        // Dynamische Routen: die Seiten leiteten ihre Description aus `data.label`
        // ab. Das ist hier über page.data ohne Änderung an den load-Funktionen
        // rekonstruierbar.
        const dynamicDesc = $derived.by(() => {
                const label = page.data?.label;
                if (!label) return null;
                if (pagePath.startsWith('/gute-nachrichten/land/'))
                        return `Belegte gute Nachrichten aus ${label}: positive Entwicklungen mit messbarem Wirkungsindex, kuratiert von NurEine. Kein Algorithmus, werbefrei.`;
                if (pagePath.startsWith('/gute-nachrichten/'))
                        return `Belegte gute Nachrichten zum Thema ${label}: kuratiert, mit messbarem Wirkungsindex, eine pro Tag. Kein Algorithmus, werbefrei — von NurEine.`;
                if (pagePath.startsWith('/archiv/')) return page.data?.intro ?? null;
                return null;
        });

        // Reihenfolge: eine explizit eingetragene Description gewinnt IMMER — auch
        // gegen den Story-Fallback. Sonst überschreibt z. B. /lichtblick (lädt eine
        // Story in page.data, ist aber eine Landingpage) seinen eigenen Text mit dem
        // Story-Dek.
        const seoDesc = $derived(
                pathDescriptions[pagePath] ??
                dynamicDesc ??
                (isStory
                        ? `${page.data.story.dek} · Eine gute Nachricht am Tag — ehrlicher Fortschritt, belegt. Kostenlos auf nureine.de`
                        : 'Wir berichten nicht, dass die Welt gut ist — wir zeigen, wo sie besser wird. Täglich eine belegte Geschichte über echten Fortschritt, in zwei Minuten. Kein Feed, kein Algorithmus.')
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
                                alternateName: ['NurEine.de', 'Nur Eine', 'NurEine Good News'],
                                // Entity-Disambiguierung: Google AI Overview und Perplexity lösten
                                // „nureine" auf FREMDE Entitäten auf (Kinofilm „Nur eine Frau" 2019
                                // / Chemikalie „neurine"). disambiguatingDescription ist das
                                // Schema.org-Feld genau für „nicht zu verwechseln mit".
                                disambiguatingDescription: 'NurEine ist ein 2026 gegründeter deutschsprachiger Good-News-Nachrichtendienst aus Teltow, Brandenburg. Nicht zu verwechseln mit dem Kinofilm „Nur eine Frau" (2019) von Sherry Hormann und nicht mit der chemischen Verbindung Neurin (englisch neurine).',
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
