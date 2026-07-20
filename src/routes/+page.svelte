<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate, toneStyles } from '$lib/utils';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { track } from '$lib/track';
	import { getRef } from '$lib/referral';
	import StoryCard from '$lib/components/StoryCard.svelte';
	import ShareBar from '$lib/components/ShareBar.svelte';

	let { data } = $props();
	const featured = $derived(data.featured);
	// Ø Wirkungsindex nur zeigen, wenn es überhaupt Stories gibt — sonst wäre es
	// eine Division durch 0 („NaN/100", sah nach Fehler aus).
	const avgImpactLabel = $derived(
		data.stats.storiesCount > 0 ? String(Math.round(data.totalImpact / data.stats.storiesCount)) : '—'
	);
	const tone = $derived(featured ? toneStyles[featured.tone] : toneStyles['amber']);
	// Tages-Perlen der letzten Woche (jede mit Datum), statt der letzten N Stories.
	const days = $derived(data.days ?? []);
	// Datum in Wochentag / Tag / Monat zerlegen — für den Kalender-Anker.
	// Heute/Gestern werden statt des Wochentags gezeigt.
	function dayParts(iso: string): { weekday: string; day: string; month: string } {
		const d = new Date(iso + 'T12:00:00');
		const today = new Date(); today.setHours(12, 0, 0, 0);
		const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
		const weekday =
			diff === 0 ? 'Heute'
			: diff === 1 ? 'Gestern'
			: new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(d).replace('.', '');
		return {
			weekday,
			day: new Intl.DateTimeFormat('de-DE', { day: 'numeric' }).format(d),
			month: new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(d).replace('.', '')
		};
	}
	const CAT_COLOR: Record<string, string> = {
		klima: '#56764e', gesundheit: '#b06f6f', wissenschaft: '#5d7e9c',
		gemeinschaft: '#bd6a35', tiere: '#56764e', kultur: '#bd6a35', innovation: '#5d7e9c'
	};
	const catColor = (c: string) => CAT_COLOR[c?.toLowerCase()] ?? '#bd6a35';

	// Standfirst unter der Headline: der menschliche Funke (share_hook) führt, nicht
	// der Institutions-Dek. Genau diese erste Zeile entscheidet beim Erstbesucher in
	// zwei Sekunden, ob Hoffnung ankommt — der dröge Titel allein tut das nicht.
	// Fallback auf den faktischen Dek, falls kein Hook generiert wurde.
	const heroLead = $derived(featured?.shareHook?.trim() || featured?.dek || '');

	// Fluid hero headline: scale the type DOWN as the title gets longer, so a long
	// title doesn't blow the hero into too many lines / too much height. Tiers by
	// character count (incl. spaces). Short punchy title → huge; long title → calmer.
	const heroSizeClass = $derived.by(() => {
		const n = (featured?.title || '').length;
		if (n <= 22) return 'text-[2.6rem] sm:text-[3.6rem] md:text-[4.6rem] lg:text-[5.4rem] xl:text-[6rem]';
		if (n <= 38) return 'text-[2.4rem] sm:text-[3.2rem] md:text-[4rem] lg:text-[4.6rem] xl:text-[5.1rem]';
		if (n <= 54) return 'text-[2.15rem] sm:text-[2.8rem] md:text-[3.4rem] lg:text-[3.9rem] xl:text-[4.3rem]';
		return 'text-[1.95rem] sm:text-[2.45rem] md:text-[2.9rem] lg:text-[3.3rem] xl:text-[3.7rem]';
	});

	// Hero illustration: prefer the story's real image (via WebP-Proxy), else category.
	const featuredImg = $derived(
		featured
			? featured.hero && featured.hero.startsWith('http')
				? `${base}/img?url=${encodeURIComponent(featured.hero)}&w=900`
				: getStoryHeroImageSrc(featured.category, base)
			: ''
	);

	const baseUrl = $derived(data.baseUrl || 'https://nureine.de');
	const featuredUrl = $derived(featured ? `${baseUrl}/geschichte/${featured.slug}` : baseUrl);

	const today = new Date();
	const dateLong = today.toLocaleDateString('de-DE', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});

	// Newsletter form state
	let newsletterEmail = $state('');
	let newsletterStatus = $state('');
	let newsletterLoading = $state(false);
	let newsletterSuccess = $state(false);

	async function handleNewsletterSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (newsletterLoading) return;
		if (!newsletterEmail.trim()) {
			newsletterStatus = 'Bitte gib eine E-Mail-Adresse ein.';
			return;
		}
		newsletterLoading = true;
		newsletterStatus = '';
		track('newsletter_signup_attempt', { source: 'homepage' });
		try {
			const res = await fetch(`${base}/api/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: newsletterEmail.trim(), tier: 'free', ref: getRef() })
			});
			const result = await res.json();
			if (res.ok) {
				track('newsletter_signup', { source: 'homepage' });
				newsletterSuccess = true;
				newsletterStatus = result.message || '';
				newsletterEmail = '';
			} else {
				newsletterSuccess = false;
				newsletterStatus = result.error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
			}
		} catch {
			newsletterSuccess = false;
			newsletterStatus = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
		} finally {
			newsletterLoading = false;
		}
	}
</script>

<!-- Hero — daily story -->
<section class="relative overflow-hidden">
	<div
		class="absolute inset-0 sun-glow pointer-events-none"
		aria-hidden="true"
		style="opacity: 0.7;"
	></div>

	<div class="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12 lg:pt-20 pb-12 sm:pb-14 lg:pb-16">
		<div class="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-8 lg:gap-14 items-center">
			<!-- Left: editorial text column -->
			<div class="min-w-0">
				<div class="flex items-center gap-3 rise">
					<span
						class="inline-block w-7 sm:w-8 h-px"
						style="background: var(--color-amber);"
						aria-hidden="true"
					></span>
					<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-display); font-weight: 600;">
						Ehrlicher Fortschritt · heute
					</span>
				</div>

				<p
					class="mt-3 sm:mt-4 text-sm sm:text-base italic rise rise-d1"
					style="color: var(--color-muted); font-family: var(--font-serif);"
				>
					{dateLong}
				</p>

				{#if featured}
					<a href={base + '/geschichte/' + featured.slug} class="block mt-4 sm:mt-5 group rise rise-d2">
						<h1
							class="display leading-[0.95] sm:leading-[0.93] {heroSizeClass} max-w-[15ch] hyphens-auto break-words"
							style="color: var(--color-ink); font-weight: 700; letter-spacing: -0.045em;"
							lang="de"
						>
							{featured.title}
						</h1>

						<!-- Mobile-only hero image (desktop uses the floating side card) -->
						{#if featuredImg}
							<div class="lg:hidden relative mt-5 aspect-[16/10] rounded-2xl overflow-hidden" style="border: 1px solid var(--color-rule); box-shadow: var(--shadow-md);">
								<img src={featuredImg} alt="" class="absolute inset-0 h-full w-full object-cover" loading="eager" />
								<span class="absolute top-3 left-3 badge px-2.5 py-1 rounded-full backdrop-blur-sm" style="background: rgba(251,248,241,0.85); color: {tone.fg}; border: 1px solid {tone.ring}; font-family: var(--font-mono);">{featured.category}</span>
								<div class="absolute bottom-3 right-3 text-center rounded-lg px-3 py-1.5" style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);">
									<span class="display tnum text-base" style="color: var(--color-ink); font-weight: 600;">{featured.impactScore}</span>
									<span class="uppercase ml-1" style="font-family: var(--font-mono); font-size: 0.5rem; letter-spacing: 0.12em; color: var(--color-faint);">Wirkung</span>
								</div>
							</div>
						{/if}

						<p
							class="mt-5 sm:mt-6 text-base sm:text-xl lg:text-2xl leading-[1.5] sm:leading-[1.45] max-w-[46ch]"
							style="color: var(--color-ink-soft); font-family: var(--font-serif);"
						>
							{heroLead}
						</p>
					</a>

					<div class="mt-7 sm:mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 rise rise-d3">
						<a
							href={base + '/geschichte/' + featured.slug}
							onclick={() => track('cta_click', { cta: 'hero_read', slug: featured.slug })}
							class="group inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
							style="background: var(--color-surface-ink); color: var(--color-on-ink); box-shadow: var(--shadow-sm);"
						>
							Geschichte lesen
							<span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
						</a>
						<span class="flex items-center gap-2 text-xs sm:text-sm" style="color: var(--color-muted); font-family: var(--font-mono);">
							<span
								class="inline-block w-1.5 h-1.5 rounded-full"
								aria-hidden="true"
								style="background: {tone.fg};"
							></span>
							{featured.readingMinutes} Min · Wirkung {featured.impactScore} · {featured.country}
						</span>
						<ShareBar url={featuredUrl} title={featured.title} text={featured.dek} showLabel={false} />
					</div>
				{:else}
					<!-- Leerlauf-Zustand: ehrlich statt „irgendwas ist kaputt". Trägt auch
					     die Wartungs-Info vom Juli 2026 (Kontingent gerissen, zurück am 20.). -->
					<h1
						class="display mt-4 sm:mt-5 leading-[0.95] text-4xl sm:text-5xl max-w-[16ch] rise rise-d2"
						style="color: var(--color-ink); font-weight: 700; letter-spacing: -0.045em;"
					>
						Heute bleibt es hier still.
					</h1>
					<p class="mt-5 serif text-lg sm:text-xl max-w-[46ch] leading-relaxed rise rise-d2" style="color: var(--color-ink-soft);">
						Wir haben unser Speicher-Kontingent überschritten — deshalb können wir die
						Geschichten gerade nicht ausliefern. Kein Datenverlust, nichts kaputt:
						am <strong style="color: var(--color-ink);">20. Juli</strong> sind wir automatisch
						wieder da.
					</p>
					<p class="mt-4 serif text-base max-w-[46ch] leading-relaxed rise rise-d2" style="color: var(--color-muted);">
						Wir schreiben das lieber hin, als so zu tun, als wäre nichts. Ehrlicher
						Fortschritt heißt auch, Rückschritte zu benennen. Danke für deine Geduld.
					</p>
					<div class="mt-7 rise rise-d2">
						<a
							href={base + '/newsletter'}
							class="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-transform hover:-translate-y-0.5"
							style="background: var(--color-surface-ink); color: var(--color-on-ink);"
						>
							Newsletter abonnieren — wir melden uns, wenn's weitergeht →
						</a>
					</div>
				{/if}
			</div>

			<!-- Right: floating story-art card with impact chip -->
			{#if featured}
				<a
					href={base + '/geschichte/' + featured.slug}
					class="relative hidden lg:block group rise rise-d2"
					aria-label={featured.title}
				>
					<!-- amber tab peeking below the panel (ref: framed magazine card) -->
					<div class="absolute left-4 right-4 -bottom-2 h-6 rounded-b-2xl" style="background: var(--color-amber); opacity: 0.9;" aria-hidden="true"></div>

					<!-- paper frame around the image -->
					<div class="relative rounded-[20px] p-3.5" style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-lg);">
						<!-- bookmark ribbon -->
						<div class="absolute -top-0.5 right-8 w-6 h-12 rounded-b-md" style="background: var(--color-amber); box-shadow: var(--shadow-sm);" aria-hidden="true"></div>

						<div class="relative aspect-[16/10] rounded-xl overflow-hidden" style="background: var(--color-canvas-soft);">
							{#if featuredImg}
								<img
									src={featuredImg}
									alt=""
									class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
									loading="eager"
								/>
							{/if}
							<span
								class="absolute top-3 left-3 badge px-2.5 py-1 rounded-full backdrop-blur-sm"
								style="background: rgba(251,248,241,0.85); color: {tone.fg}; border: 1px solid {tone.ring}; font-family: var(--font-mono);"
							>
								{featured.category}
							</span>
						</div>

						<!-- panel caption: eyebrow + impact -->
						<div class="flex items-center justify-between px-1 pt-3 pb-1">
							<span class="eyebrow" style="color: var(--color-muted); font-family: var(--font-display); font-weight: 600;">Titelgeschichte</span>
							<span class="display tnum" style="color: var(--color-amber-deep); font-weight: 700;">
								{featured.impactScore}<span class="uppercase ml-1" style="font-family: var(--font-mono); font-size: 0.5rem; letter-spacing: 0.14em; color: var(--color-faint); font-weight: 400;">Wirkung</span>
							</span>
						</div>
					</div>
				</a>
			{/if}
		</div>
	</div>

	<!-- Compass strip — quiet metadata, hairline grid -->
	<div class="border-t border-b" style="border-color: var(--color-rule); background: var(--color-canvas-soft);">
		<div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
			<div class="grid grid-cols-2 md:grid-cols-4" style="gap: 1px; background: var(--color-rule);">
				{#each [
					{ l: 'Heute kuratiert', v: String(data.stats.storiesCount), s: '' },
					{ l: 'Quellen geprüft', v: String(data.stats.sourcesCount), s: '' },
					// Division durch 0 (keine Stories) ergab „NaN/100" — das sah kaputt aus.
					// Ohne Datenbasis lieber ein ehrliches „—" als eine Fantasie-Zahl.
					{ l: 'Ø Wirkungsindex', v: avgImpactLabel, s: avgImpactLabel === '—' ? '' : '/100' },
					{ l: 'Ø Lesezeit', v: data.stats.storiesCount > 0 ? String(data.avgRead) : '—', s: data.stats.storiesCount > 0 ? ' min' : '' }
				] as stat}
					<div class="py-5 sm:py-6 px-1 sm:px-4" style="background: var(--color-canvas-soft);">
						<p class="uppercase" style="font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.16em; color: var(--color-faint);">{stat.l}</p>
						<p class="display tnum mt-2 text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
							{stat.v}<span class="text-sm" style="color: var(--color-faint); font-family: var(--font-sans); font-weight: 400;">{stat.s}</span>
						</p>
					</div>
				{/each}
			</div>
			<!-- Vertrauens-Byline: das menschliche Gesicht hinter der autonomen Redaktion. -->
			<p class="py-3 text-xs text-center" style="color: var(--color-muted); border-top: 1px solid var(--color-rule);">
				Autonome Redaktion, von einem Menschen verantwortet —
				<a href="/redaktion" class="no-underline hover:opacity-70" style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);">so arbeiten wir</a>
			</p>
		</div>
	</div>
</section>

<!-- Manifesto strip -->
<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
	<div class="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
		<div class="lg:col-span-4">
			<p class="eyebrow" style="color: var(--color-amber);">
				Warum es uns gibt
			</p>
		</div>
		<div class="lg:col-span-8">
			<p class="serif text-xl sm:text-2xl lg:text-[1.85rem] leading-snug" style="color: var(--color-ink);">
				Wir behaupten nicht, die Welt sei gut. Wir zeigen, <span style="color: var(--color-amber);">wo
				sie besser wird</span> — belegt, in zwei Minuten. Kein Feed, kein Algorithmus, kein Sog.
				Eine Geschichte. Für das Gespräch heute.
			</p>
			<a
				href={base + '/manifest'}
				class="mt-4 sm:mt-6 inline-flex items-center gap-2 text-xs sm:text-sm hover:opacity-70"
				style="color: var(--color-ink-soft); border-bottom: 1px solid var(--color-rule-strong);"
			>
				Vollständiges Manifest lesen <span aria-hidden="true">→</span>
			</a>
		</div>
	</div>
</section>

<!-- Story grid -->
<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-14 sm:pb-16 lg:pb-20">
	<div class="flex items-end justify-between mb-7 sm:mb-10">
		<div>
		<p class="eyebrow" style="color: var(--color-amber);">
				Diese Woche
			</p>
			<h2 class="display text-2xl sm:text-3xl lg:text-4xl mt-1.5 sm:mt-2" style="color: var(--color-ink); font-weight: 600;">
				Die Geschichte jedes Tages
			</h2>
		</div>
		<a
			href={base + '/archiv'}
			class="hidden md:inline-flex items-center gap-2 text-sm hover:opacity-70"
			style="color: var(--color-ink-soft);"
		>
			Ganzes Archiv <span aria-hidden="true">→</span>
		</a>
	</div>

	<!-- Kalender-Timeline: je Tag eine kompakte Zeile — Datum-Anker links,
	     kleine Story-Karte rechts. Dynamisch, nicht wie ein endloser Feed. -->
	<div class="cal">
		{#each days as { day, story }, i (story.slug)}
			{@const parts = dayParts(day)}
			<a
				href={base + '/geschichte/' + story.slug}
				class="cal-row rise group"
				style="animation-delay: {0.06 + i * 0.05}s;"
			>
				<!-- Datum-Anker -->
				<div class="cal-date">
					<span class="cal-weekday">{parts.weekday}</span>
					<span class="cal-daynum">{parts.day}</span>
					<span class="cal-month">{parts.month}</span>
				</div>
				<!-- Timeline-Punkt + Linie -->
				<div class="cal-track" aria-hidden="true">
					<span class="cal-dot" style="background: {catColor(story.category)};"></span>
				</div>
				<!-- Story-Karte (kompakt, horizontal) -->
				<div class="cal-card">
					<div class="cal-thumb">
						<img
							src={story.hero && story.hero.startsWith('http')
								? `${base}/img?url=${encodeURIComponent(story.hero)}&w=200`
								: getStoryHeroImageSrc(story.category, base)}
							alt=""
							loading="lazy"
						/>
					</div>
					<div class="cal-body">
						<div class="cal-meta">
							<span class="cal-cat" style="color: {catColor(story.category)};">{story.category}</span>
							{#if story.impactScore}<span class="cal-impact">Wirkung {story.impactScore}</span>{/if}
						</div>
						<h3 class="cal-title">{story.title}</h3>
						{#if story.dek}<p class="cal-dek">{story.dek}</p>{/if}
					</div>
					<span class="cal-arrow" aria-hidden="true">→</span>
				</div>
			</a>
		{/each}
	</div>

	<!-- Mobile archive link -->
	<a
		href={base + '/archiv'}
		class="md:hidden mt-8 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full text-sm transition-all"
		style="background: var(--color-surface-ink); color: var(--color-on-ink);"
	>
		Ganzes Archiv
		<span aria-hidden="true">→</span>
	</a>
</section>

<!-- Newsletter / quiet CTA -->
<section
	class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16"
	aria-labelledby="newsletter-heading"
>
	<div
		class="relative overflow-hidden rounded-[20px] p-7 sm:p-10 lg:p-16 grid lg:grid-cols-12 gap-7 sm:gap-8 items-center"
		style="background: var(--color-surface-ink); box-shadow: var(--shadow-lg);"
	>
		<!-- amber radial glow -->
		<div
			class="absolute inset-0 pointer-events-none"
			aria-hidden="true"
			style="background: radial-gradient(ellipse 55% 80% at 92% 50%, rgba(200,115,64,0.34), transparent 60%);"
		></div>

		<div class="relative lg:col-span-7">
			<div class="flex items-center gap-3">
				<span class="inline-block w-7 h-px" style="background: var(--color-amber-soft);" aria-hidden="true"></span>
				<span class="eyebrow" style="color: var(--color-amber-soft); font-family: var(--font-mono);">
					Der tägliche Lichtblick
				</span>
			</div>
			<h2
				id="newsletter-heading"
				class="display text-2xl sm:text-3xl lg:text-[2.6rem] mt-3 leading-[1.1]"
				style="color: var(--color-on-ink); font-weight: 600;"
			>
				Eine gute Nachricht. Jeden Morgen. Werbefrei.
			</h2>
			<p
				class="mt-4 text-sm sm:text-base leading-relaxed max-w-[48ch]"
				style="color: rgba(251,248,241,0.72); font-family: var(--font-serif);"
			>
				Kein Doomscrolling, kein Algorithmus. Eine kuratierte Geschichte pro Tag — mit
				Hintergrund, Quellen und gemessenem Wirkungsindex.
			</p>
		</div>
		{#if newsletterSuccess}
			<!-- Idiotensicherer Erfolgs-Block: großer, klarer nächster Schritt statt Mini-Text. -->
			<div class="relative lg:col-span-5 flex flex-col items-center text-center gap-4 rounded-2xl p-7 sm:p-9"
				style="background: rgba(189,106,53,0.14); border: 1px solid rgba(189,106,53,0.4);">
				<div class="flex items-center justify-center w-16 h-16 rounded-full" style="background: var(--color-amber);">
					<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
						<polyline points="22,6 12,13 2,6"></polyline>
					</svg>
				</div>
				<div>
					<p class="display text-xl sm:text-2xl" style="color: var(--color-on-ink); font-weight: 600;">Fast geschafft!</p>
					<p class="mt-2 text-sm sm:text-base leading-relaxed" style="color: rgba(251,248,241,0.88); font-family: var(--font-serif);">
						Wir haben dir eine <strong>Bestätigungs-Mail</strong> geschickt.<br />
						Öffne dein Postfach und klick auf den Link darin — dann bist du dabei.
					</p>
				</div>
				<p class="text-xs" style="color: rgba(251,248,241,0.55); font-family: var(--font-mono);">
					Nichts gekommen? Schau im Spam-Ordner.
				</p>
				<button type="button" onclick={() => { newsletterSuccess = false; newsletterStatus = ''; }}
					class="text-xs underline underline-offset-2 hover:opacity-80" style="color: var(--color-amber);">
					Andere E-Mail eintragen
				</button>
			</div>
		{:else}
		<form
			class="relative lg:col-span-5 flex flex-col gap-3"
			onsubmit={handleNewsletterSubmit}
		>
			<div class="flex flex-col sm:flex-row gap-3">
				<label class="flex-1">
					<span class="sr-only">E-Mail-Adresse</span>
					<input
						type="email"
						required
						placeholder="Deine beste E-Mail"
						bind:value={newsletterEmail}
						disabled={newsletterLoading}
						class="w-full px-4 py-3 rounded-full text-sm transition-all"
						style="background: rgba(251,248,241,0.06); border: 1px solid rgba(251,248,241,0.22); color: var(--color-on-ink);"
					/>
				</label>
				<button
					type="submit"
					disabled={newsletterLoading}
					class="px-6 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap disabled:opacity-60 active:scale-[0.97]"
					style="background: var(--color-amber); color: var(--color-on-accent); box-shadow: var(--shadow-sm);"
				>
					{newsletterLoading ? 'Wird gesendet...' : 'Abonnieren'}
				</button>
			</div>
			{#if newsletterStatus}
				<p class="text-sm" style="color: rgba(251,248,241,0.8); font-family: var(--font-serif);">
					{newsletterStatus}
				</p>
			{:else}
				<p style="font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.04em; color: rgba(251,248,241,0.45);">
					Jederzeit abbestellbar · Kein Spam
				</p>
			{/if}
			<!-- Geschickt: Newsletter-Skeptiker zu IG abholen, statt sie ganz zu verlieren. -->
			<p class="mt-1 text-xs" style="color: rgba(251,248,241,0.6); font-family: var(--font-serif);">
				Lieber im Feed? Folg uns auf
				<a
					href="https://instagram.com/nureine.de"
					target="_blank"
					rel="noreferrer noopener"
					onclick={() => track('cta_click', { cta: 'instagram_main' })}
					class="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:opacity-80"
					style="color: var(--color-amber);"
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
						<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
						<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
					</svg>
					@nureine.de
				</a>
				— eine Geschichte, jeden Morgen.
			</p>
		</form>
		{/if}
	</div>
</section>

<!-- Dezenter Mitmach-Hinweis: NurEine entsteht offen. Kein Lärm, eine Zeile. -->
<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-2">
	<p class="text-center text-sm" style="color: var(--color-muted); font-family: var(--font-serif);">
		NurEine entsteht im Offenen.
		<a href={base + '/roadmap'} class="underline decoration-dotted underline-offset-2 hover:opacity-70" style="color: var(--color-amber);">Sieh unsere Roadmap &amp; gib Feedback →</a>
	</p>
</section>

<style>
	/* Kalender-Timeline — kompakte Tagesansicht statt großer Karten. */
	.cal {
		display: flex;
		flex-direction: column;
	}
	.cal-row {
		display: grid;
		grid-template-columns: 68px 20px 1fr;
		align-items: stretch;
		text-decoration: none;
		color: inherit;
	}
	.cal-date {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		padding: 0.9rem 0.75rem 0.9rem 0;
		text-align: right;
		line-height: 1.05;
	}
	.cal-weekday {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-amber);
	}
	.cal-daynum {
		font-family: var(--font-display, inherit);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-ink);
	}
	.cal-month {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-faint);
	}
	.cal-track {
		position: relative;
		display: flex;
		justify-content: center;
	}
	/* durchgehende vertikale Linie */
	.cal-track::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--color-rule);
	}
	.cal-dot {
		position: relative;
		margin-top: 1.5rem;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		box-shadow: 0 0 0 4px var(--color-canvas, #f4efe6);
	}
	.cal-card {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin: 0.5rem 0;
		padding: 0.6rem 0.9rem 0.6rem 0.6rem;
		border-radius: 14px;
		border: 1px solid transparent;
		transition: border-color 0.15s, background 0.15s, transform 0.15s;
	}
	.cal-row:hover .cal-card {
		border-color: var(--color-rule);
		background: var(--color-paper, #fbf8f1);
		transform: translateX(2px);
	}
	.cal-thumb {
		flex-shrink: 0;
		width: 84px;
		height: 84px;
		border-radius: 10px;
		overflow: hidden;
		background: var(--color-canvas-soft, #ece5d8);
	}
	.cal-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.cal-body {
		flex: 1;
		min-width: 0;
	}
	.cal-meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.2rem;
	}
	.cal-cat {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.cal-impact {
		font-size: 0.62rem;
		color: var(--color-faint);
		font-family: var(--font-mono, monospace);
	}
	.cal-title {
		font-family: var(--font-display, inherit);
		font-size: 1.02rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--color-ink);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.cal-dek {
		margin-top: 0.2rem;
		font-size: 0.82rem;
		line-height: 1.35;
		color: var(--color-muted);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.cal-arrow {
		flex-shrink: 0;
		color: var(--color-faint);
		opacity: 0;
		transition: opacity 0.15s, transform 0.15s;
	}
	.cal-row:hover .cal-arrow {
		opacity: 1;
		transform: translateX(3px);
		color: var(--color-amber);
	}
	@media (max-width: 640px) {
		.cal-row { grid-template-columns: 52px 16px 1fr; }
		.cal-daynum { font-size: 1.25rem; }
		.cal-thumb { width: 64px; height: 64px; }
		.cal-dek { display: none; }
		.cal-title { font-size: 0.95rem; }
	}
</style>
