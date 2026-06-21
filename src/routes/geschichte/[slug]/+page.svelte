<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate, inline, sections, toneStyles } from '$lib/utils';
	import { track } from '$lib/track';
	import { recordRead, weekStats, type WeekStats } from '$lib/readingStreak';
	import StoryCard from '$lib/components/StoryCard.svelte';
	import ShareBar from '$lib/components/ShareBar.svelte';
	import InlineNewsletter from '$lib/components/InlineNewsletter.svelte';

	let { data } = $props();
	const story = $derived(data.story);
	const tone = $derived(toneStyles[story.tone]);
	const secs = $derived(sections(story.body));

	// Wirkungsindex-Aufschlüsselung: die drei Achsen als Balken.
	const axes = $derived([
		{ label: 'Reichweite', value: story.impactReach, q: 'Wie viele Menschen betrifft es?' },
		{ label: 'Dauerhaftigkeit', value: story.impactDurability, q: 'Bleibt die Wirkung länger als kurz?' },
		{ label: 'Belegbarkeit', value: story.impactEvidence, q: 'Wie hart sind die Daten?' }
	].filter((a) => typeof a.value === 'number'));
	let methodOpen = $state(false);

	// Reporter-Beat-Transparenz: welcher Beat hat sie gefunden, welcher Quellentyp.
	const BEAT_LABELS: Record<string, string> = {
		'klima-energie': 'Klima & Energie',
		'gesundheit-forschung': 'Gesundheit & Forschung',
		'gesellschaft-bildung': 'Gesellschaft & Bildung',
		'innovation-wirtschaft': 'Innovation & Wirtschaft',
		'staedte-kommunen': 'Städte & Kommunen'
	};
	const SOURCE_TYPE_LABELS: Record<string, string> = {
		peer_review: 'Peer-Review',
		official_stats: 'Offizielle Statistik',
		registry: 'Register',
		open_data: 'Open Data',
		gov: 'Behörde',
		ngo: 'NGO',
		media: 'Fachquelle'
	};
	const beatLabel = $derived(story.beat ? BEAT_LABELS[story.beat] ?? null : null);
	const sourceTypeLabel = $derived(story.sourceType ? SOURCE_TYPE_LABELS[story.sourceType] ?? null : null);

	// "Weitersagen"-Satz: gecachter share_hook, sonst Subtitle als Fallback.
	const shareLine = $derived(story.shareHook || story.dek || story.title);
	let shareCopied = $state(false);

	const baseUrl = $derived(data.baseUrl || 'https://nureine.de');
	const storyUrl = $derived(`${baseUrl}/geschichte/${story.slug}`);

	// Der entscheidende Loop-Fix: der kopierte Text nimmt den LINK mit (sonst
	// landet kein Empfänger bei uns) — und, wenn der Leser einen eigenen
	// Referral-Code hat (in localStorage gespeichert auf /einstellungen), wird
	// dieser angehängt, damit die Weiterempfehlung ihm gutgeschrieben wird.
	function ownRefCode(): string | null {
		try {
			return localStorage.getItem('nureine_my_ref');
		} catch {
			return null;
		}
	}
	function shareTextWithLink(): string {
		const code = ownRefCode();
		const url = code ? `${storyUrl}?ref=${code}` : storyUrl;
		return `${shareLine}\n\n${url}`;
	}
	function copyShareLine() {
		navigator.clipboard?.writeText(shareTextWithLink()).then(() => {
			shareCopied = true;
			setTimeout(() => (shareCopied = false), 1800);
			track('story_shared', { slug: story.slug, via: 'share_hook' });
		}).catch(() => {});
	}

	// Nativer Teilen-Dialog (Handy) — höchste Conversion, ein Tap.
	function nativeShare() {
		const text = shareTextWithLink();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const nav = navigator as any;
		if (nav.share) {
			nav.share({ title: 'NurEine', text: shareLine, url: text.split('\n\n')[1] })
				.then(() => track('story_shared', { slug: story.slug, via: 'native_share' }))
				.catch(() => {});
		} else {
			copyShareLine();
		}
	}

	// Article structured data for Google rich results.
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'NewsArticle',
			headline: story.title,
			description: story.dek,
			// Google News / Discover strongly prefer an image. Fall back through
			// the OG image to the site default so an article is never image-less.
			image: [story.imageUrl || story.ogImageUrl || `${baseUrl}/og-default.jpeg`],
			datePublished: story.publishedAt,
			dateModified: story.publishedAt,
			author: { '@type': 'Organization', name: 'NurEine', url: baseUrl },
			publisher: {
				'@type': 'Organization',
				name: 'NurEine',
				logo: { '@type': 'ImageObject', url: `${baseUrl}/NurEine.svg` }
			},
			mainEntityOfPage: { '@type': 'WebPage', '@id': storyUrl },
			articleSection: story.category,
			inLanguage: 'de-DE',
			isAccessibleForFree: true,
			// Voice assistants (Google Assistant) may read the headline + summary.
			speakable: {
				'@type': 'SpeakableSpecification',
				cssSelector: ['h1', '.story-dek']
			}
		})
	);

	// Fire one story_read per slug view + lokale Lese-Bilanz verbuchen.
	$effect(() => {
		if (story?.slug) {
			track('story_read', { slug: story.slug, category: story.category });
			recordRead();
			week = weekStats();
		}
	});

	let week = $state<WeekStats>({ count: 0, activeDays: 0 });
	let weekShareCopied = $state(false);
	function shareWeek() {
		const txt = `Ich starte den Tag mit Fortschritt statt Doomscrolling: ${week.count} gute, belegte Nachrichten diese Woche. ${baseUrl}`;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const nav = navigator as any;
		if (nav.share) {
			nav.share({ text: txt }).then(() => track('story_shared', { via: 'week_recap' })).catch(() => {});
		} else {
			navigator.clipboard?.writeText(txt).then(() => {
				weekShareCopied = true;
				setTimeout(() => (weekShareCopied = false), 1800);
				track('story_shared', { via: 'week_recap' });
			}).catch(() => {});
		}
	}
	</script>

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<!-- Hero -->
<article>
	<header class="relative">
		<div
			class="absolute inset-0 pointer-events-none"
			aria-hidden="true"
			style="background:
        radial-gradient(ellipse 60% 80% at 30% 0%, {tone.bg}, transparent 60%),
        radial-gradient(ellipse 50% 60% at 80% 30%, {tone.bg}, transparent 70%);
        opacity: 0.8;"
		></div>

		<div class="relative mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-12 lg:pt-20 pb-8 sm:pb-10">
			<a
				href={base + '/'}
				class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] hover:opacity-70 rise"
				style="color: var(--color-muted);"
			>
				<span aria-hidden="true">←</span> Zurück zur Übersicht
			</a>

			<div class="mt-10 flex items-center gap-3 rise rise-d1">
				<span
					class="badge px-3 py-1 rounded-full"
					style="background: {tone.bg}; color: {tone.fg}; border: 1px solid {tone.ring};"
				>
					{story.category}
				</span>
				<span class="text-xs" style="color: var(--color-muted);">
					{story.country}{story.region && story.region !== story.country ? ` · ${story.region}` : ''}
				</span>
			</div>

			<h1
				class="display mt-6 leading-[1.02] text-[1.8rem] sm:text-[2.4rem] lg:text-[4rem] rise rise-d2"
				style="color: var(--color-ink); font-weight: 600;"
			>
				{story.title}
			</h1>

			<p
				class="story-dek mt-6 text-base sm:text-xl lg:text-2xl leading-snug max-w-[55ch] rise rise-d3"
				style="color: var(--color-ink-soft); font-family: var(--font-serif); font-style: italic;"
			>
				{story.dek}
			</p>

			{#if beatLabel}
				<!-- Reporter-Transparenz: welcher Beat hat die Story gefunden + Quellentyp. -->
				<div class="mt-5 inline-flex items-center gap-2 rise rise-d3 px-3 py-1.5 rounded-full text-xs"
					style="background: {tone.bg}; color: {tone.fg}; border: 1px solid {tone.ring};">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<span style="font-weight: 600;">Beat: {beatLabel}</span>
					{#if sourceTypeLabel}<span style="opacity: 0.7;">· {sourceTypeLabel}</span>{/if}
				</div>
			{/if}

			{#if story.imageUrl}
				<div class="mt-8 rise rise-d4">
					<div class="aspect-[4/3] rounded-[6px] overflow-hidden" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
						<img src={story.imageUrl.startsWith('http') ? `${base}/img?url=${encodeURIComponent(story.imageUrl)}&w=900` : story.imageUrl} alt="" class="w-full h-full object-cover" loading="eager" />
					</div>
				</div>
			{/if}

			<div
				class="mt-8 sm:mt-10 pt-4 sm:pt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-xs rise rise-d4"
				style="border-top: 1px solid var(--color-rule); color: var(--color-muted);"
			>
				<span>{formatDate(story.publishedAt)}</span>
				<span>{story.readingMinutes} Min. Lesezeit</span>
				<!-- KI-Transparenz proaktiv: als Stärke gerahmt, nicht als Kleingedrucktes. -->
				<a href="/methodik" class="hover:opacity-70 no-underline" style="color: var(--color-ink-soft);">
					<span style="border-bottom: 1px solid var(--color-rule-strong);">KI-recherchiert · von Menschen verantwortet</span>
				</a>
				<a
					href={story.sourceUrl}
					rel="noopener noreferrer"
					target="_blank"
					class="hover:opacity-70 no-underline"
					style="color: var(--color-ink-soft);"
				>
					<span style="border-bottom: 1px solid var(--color-rule-strong);">Quelle: {story.source}</span>
				</a>
				<span class="hidden sm:inline" style="color: var(--color-rule-strong);" aria-hidden="true">|</span>
				<ShareBar url={storyUrl} title={story.title} text={story.dek} showLabel={true} />
			</div>

			{#if story.audioUrl}
				<!-- Vorlesen: dezenter Player, nur für die wenigen vertonten Top-Stories. -->
				<div class="mt-6 rise rise-d4 flex flex-col gap-2 p-4 rounded-[8px]" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
					<div class="flex items-center gap-2 text-xs" style="color: var(--color-muted);">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
						</svg>
						<span style="font-family: var(--font-mono); letter-spacing: 0.04em;">Lieber hören? Diese Geschichte vorgelesen.</span>
					</div>
					<!-- svelte-ignore a11y_media_has_caption -->
					<audio
						controls
						preload="none"
						src={story.audioUrl}
						class="w-full"
						style="height: 38px;"
						onplay={() => track('audio_play', { slug: story.slug })}
					></audio>
				</div>
			{/if}
		</div>
	</header>

	<!-- Body -->
	<div class="relative mx-auto max-w-[680px] px-4 sm:px-6 lg:px-0 prose-nureine">
		{#each secs as section, si (si)}
			{#if section.heading}
				<h2 class="section-h2">{section.heading}</h2>
			{/if}
			{#each section.paras as para, pi (pi)}
				{@const isFirstPara = si === 0 && pi === 0}
				{@const isLead = pi === 0 && section.paras.length > 0}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<p
					class:dropcap={isFirstPara}
					class:lead-p={isLead && !isFirstPara}
				>
					{@html inline(para)}
				</p>
			{/each}
		{/each}

		<!-- Impact callout -->
		<aside
			class="not-prose my-8 sm:my-12 p-6 sm:p-8 rounded-[6px]"
			style="background: var(--color-canvas-soft); border-left: 3px solid {tone.fg};"
		>
			<p class="eyebrow" style="color: {tone.fg};">
				Wirkungsindex
			</p>
			<div class="mt-3 flex items-baseline gap-3">
				<span
					class="serif tnum text-4xl sm:text-5xl"
					style="color: var(--color-ink); font-weight: 500;"
				>
					{story.impactScore}
				</span>
				<span class="text-base" style="color: var(--color-muted);">/ 100</span>
				{#if data.impactPercentile != null && data.impactPercentile <= 25}
					<span class="ml-auto text-xs px-2.5 py-1 rounded-full" style="background: {tone.bg}; color: {tone.fg}; font-weight: 600;">
						Top {data.impactPercentile}% aller Geschichten
					</span>
				{/if}
			</div>

			<!-- Die drei Achsen als Balken — macht die Zahl nachvollziehbar. -->
			{#if axes.length === 3}
				<div class="mt-5 flex flex-col gap-3">
					{#each axes as a}
						<div>
							<div class="flex items-baseline justify-between gap-3">
								<span class="text-xs font-medium" style="color: var(--color-ink-soft);">{a.label}</span>
								<span class="tnum text-xs" style="color: var(--color-muted);">{a.value}</span>
							</div>
							<div class="mt-1 h-2 rounded-full overflow-hidden" style="background: var(--color-rule);">
								<div class="h-full rounded-full" style="width: {a.value}%; background: {tone.fg};"></div>
							</div>
							<p class="mt-1 text-[0.68rem]" style="color: var(--color-faint);">{a.q}</p>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Relevanz-Satz: übersetzt, warum es zählt (nicht Methodik). -->
			<p
				class="mt-5 text-sm leading-relaxed"
				style="color: var(--color-ink-soft); font-family: var(--font-serif);"
			>
				{story.impactExplainer || story.impactNote}
			</p>

			<!-- Aufklapp-Methodik für Neugierige. -->
			<button type="button" onclick={() => (methodOpen = !methodOpen)}
				class="mt-4 inline-flex items-center gap-1.5 text-xs hover:opacity-70"
				style="color: var(--color-muted);">
				<span style="transform: rotate({methodOpen ? 90 : 0}deg); transition: transform 0.2s;">▸</span>
				Wie wird der Index berechnet?
			</button>
			{#if methodOpen}
				<div class="mt-3 text-xs leading-relaxed flex flex-col gap-1.5" style="color: var(--color-muted);">
					<p>Der Wirkungsindex misst eine Sache: <strong style="color: var(--color-ink-soft);">Wie sehr verbessert diese Nachricht konkret Leben?</strong> Drei Achsen fließen ein:</p>
					<p><strong style="color: var(--color-ink-soft);">Reichweite</strong> — wie viele Menschen betrifft es direkt.</p>
					<p><strong style="color: var(--color-ink-soft);">Dauerhaftigkeit</strong> — hält die Wirkung an oder ist sie ein Einzelmoment.</p>
					<p><strong style="color: var(--color-ink-soft);">Belegbarkeit</strong> — wie hart sind die Daten (Peer-Review, etablierte Quelle).</p>
					<p class="mt-1">Reine Erkenntnisse ohne Lebenswirkung werden bewusst niedrig bewertet, auch wenn sie gut belegt sind. <a class="underline" href={base + '/methodik'} style="color: var(--color-ink-soft);">Volle Methodik →</a></p>
				</div>
			{/if}
		</aside>
	</div>

	<!-- Share CTA — editorial closer + fertiger Weitersagen-Satz (Reflex: kopieren & senden) -->
	<div class="relative mx-auto max-w-[680px] px-4 sm:px-6 lg:px-0 mt-10 sm:mt-14">
		<p class="serif text-sm sm:text-base leading-relaxed text-center" style="color: var(--color-muted); font-style: italic;">
			Diese Geschichte ist zu gut, um sie für sich zu behalten.
		</p>

		<!-- So erzählst du es weiter: EINE fertige Version, ein Tap zum Kopieren. -->
		<div class="mt-5 p-5 sm:p-6 rounded-[10px]" style="background: var(--color-canvas-soft); border: 1px solid var(--color-rule);">
			<p class="eyebrow mb-3" style="color: {tone.fg};">So erzählst du es weiter</p>
			<p class="serif text-base sm:text-lg leading-relaxed" style="color: var(--color-ink);">
				„{shareLine}"
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<button type="button" onclick={nativeShare}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
					style="background: var(--color-amber); color: var(--color-paper);">
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
					Weitergeben
				</button>
				<button type="button" onclick={copyShareLine}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
					style="background: {shareCopied ? 'var(--color-sage)' : 'var(--color-ink)'}; color: var(--color-paper);">
					{#if shareCopied}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
						Kopiert!
					{:else}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
						Satz + Link kopieren
					{/if}
				</button>
			</div>
		</div>

		<div class="mt-5 flex items-center justify-center">
			<ShareBar url={storyUrl} title={story.title} text={story.dek} size={20} />
		</div>

		<!-- Wochenbilanz: ruhiger Identitäts-Hebel, erst ab 3 gelesenen Stories -->
		{#if week.count >= 3}
			<div class="mt-5 p-5 rounded-[10px] text-center" style="background: var(--color-paper); border: 1px solid var(--color-rule);">
				<p class="serif text-base sm:text-lg leading-relaxed" style="color: var(--color-ink);">
					Diese Woche schon <strong style="color: {tone.fg};">{week.count}</strong> gute Nachrichten gelesen{week.activeDays >= 3 ? `, an ${week.activeDays} Tagen` : ''}.
				</p>
				<p class="mt-1 text-sm" style="color: var(--color-muted); font-family: var(--font-serif); font-style: italic;">
					Du startest den Tag mit Fortschritt statt Doomscrolling.
				</p>
				<button type="button" onclick={shareWeek}
					class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
					style="background: {weekShareCopied ? 'var(--color-sage)' : 'var(--color-ink)'}; color: var(--color-paper);">
					{weekShareCopied ? 'Kopiert!' : 'Das teile ich'}
				</button>
			</div>
		{/if}
	</div>

	<!-- Inline newsletter capture at peak intent (just finished reading) -->
	<div class="relative mx-auto max-w-[680px] px-4 sm:px-6 lg:px-0 mt-12 sm:mt-16">
		<InlineNewsletter source="story_end" />
	</div>

	<!-- Nav prev/next -->
	<nav
		class="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10 mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
		aria-label="Weitere Geschichten"
	>
		{#if data.prev}
			<a
				href={base + '/geschichte/' + data.prev.slug}
				class="paper p-4 sm:p-6 rounded-[6px] block hover:opacity-90"
				style="border: 1px solid var(--color-rule);"
			>
				<p class="footer-heading" style="color: var(--color-faint);">
					Vorherige
				</p>
				<p class="serif mt-2 leading-snug" style="color: var(--color-ink);">{data.prev.title}</p>
			</a>
		{:else}
			<div></div>
		{/if}
		{#if data.next}
			<a
				href={base + '/geschichte/' + data.next.slug}
				class="paper p-4 sm:p-6 rounded-[6px] block hover:opacity-90 text-right"
				style="border: 1px solid var(--color-rule);"
			>
				<p class="footer-heading" style="color: var(--color-faint);">
					N&auml;chste
				</p>
				<p class="serif mt-2 leading-snug" style="color: var(--color-ink);">{data.next.title}</p>
			</a>
		{:else}
			<div></div>
		{/if}
	</nav>

	<!-- Related -->
	{#if data.related.length}
		<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 mt-14 sm:mt-24">
			<h2
				class="display text-xl sm:text-2xl mb-6 sm:mb-8"
				style="color: var(--color-ink); font-weight: 600;"
			>
				Weiteres aus {story.category}
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
				{#each data.related as r (r.slug)}
					<StoryCard story={r} />
				{/each}
			</div>
		</section>
	{/if}
</article>
