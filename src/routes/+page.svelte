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
	const tone = $derived(featured ? toneStyles[featured.tone] : toneStyles['amber']);
	const rest = $derived(data.rest);

	// Hero illustration: prefer the story's real image (via WebP-Proxy), else category.
	const featuredImg = $derived(
		featured
			? featured.hero && featured.hero.startsWith('http')
				? `${base}/img?url=${encodeURIComponent(featured.hero)}&w=900`
				: getStoryHeroImageSrc(featured.category, base)
			: ''
	);
	// First card in the grid becomes the wide "feature" card
	const feature = $derived(rest[0]);
	const restTail = $derived(rest.slice(1));

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
		<div class="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-16 items-center">
			<!-- Left: editorial text column -->
			<div class="min-w-0">
				<div class="flex items-center gap-3 rise">
					<span
						class="inline-block w-7 sm:w-8 h-px"
						style="background: var(--color-amber);"
						aria-hidden="true"
					></span>
					<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">
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
							class="display leading-[1.0] sm:leading-[0.98] text-[2rem] sm:text-[2.8rem] md:text-[3.6rem] lg:text-[4.4rem] xl:text-[5rem] max-w-[16ch]"
							style="color: var(--color-ink); font-weight: 600;"
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
							{featured.dek}
						</p>
					</a>

					<div class="mt-7 sm:mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 rise rise-d3">
						<a
							href={base + '/geschichte/' + featured.slug}
							onclick={() => track('cta_click', { cta: 'hero_read', slug: featured.slug })}
							class="group inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
							style="background: var(--color-ink); color: var(--color-paper); box-shadow: var(--shadow-sm);"
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
					<p class="mt-6 serif text-xl" style="color: var(--color-muted);">
						Noch keine Geschichten geladen. Bitte versuche es später erneut.
					</p>
				{/if}
			</div>

			<!-- Right: floating story-art card with impact chip -->
			{#if featured}
				<a
					href={base + '/geschichte/' + featured.slug}
					class="relative hidden lg:block group rise rise-d2"
					aria-label={featured.title}
				>
					<div
						class="relative aspect-[3/4] rounded-2xl overflow-hidden"
						style="border: 1px solid var(--color-rule); box-shadow: var(--shadow-lg); background: var(--color-paper);"
					>
						{#if featuredImg}
							<img
								src={featuredImg}
								alt=""
								class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
								loading="eager"
							/>
						{/if}
						<span
							class="absolute top-4 left-4 badge px-2.5 py-1 rounded-full backdrop-blur-sm"
							style="background: rgba(251,248,241,0.85); color: {tone.fg}; border: 1px solid {tone.ring}; font-family: var(--font-mono);"
						>
							{featured.category}
						</span>
					</div>
					<!-- Impact chip overlapping the card edge -->
					<div
						class="absolute -bottom-4 -right-3 text-center rounded-xl px-4 py-3"
						style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-md);"
					>
						<div class="display tnum text-2xl leading-none" style="color: var(--color-ink); font-weight: 600;">
							{featured.impactScore}
						</div>
						<div class="mt-1.5 uppercase" style="font-family: var(--font-mono); font-size: 0.56rem; letter-spacing: 0.16em; color: var(--color-faint);">
							Wirkung
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
					{ l: 'Ø Wirkungsindex', v: String(Math.round(data.totalImpact / data.stats.storiesCount)), s: '/100' },
					{ l: 'Ø Lesezeit', v: String(data.avgRead), s: ' min' }
				] as stat}
					<div class="py-5 sm:py-6 px-1 sm:px-4" style="background: var(--color-canvas-soft);">
						<p class="uppercase" style="font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.16em; color: var(--color-faint);">{stat.l}</p>
						<p class="display tnum mt-2 text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 500;">
							{stat.v}<span class="text-sm" style="color: var(--color-faint); font-family: var(--font-sans); font-weight: 400;">{stat.s}</span>
						</p>
					</div>
				{/each}
			</div>
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
				Geschichten, die weitertragen
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

	{#if feature}
		<div class="rise mb-5 sm:mb-6 lg:mb-8" style="animation-delay: 0.1s;">
			<StoryCard story={feature} size="feature" />
		</div>
	{/if}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
		{#each restTail as story, i (story.slug)}
			<div class="rise" style="animation-delay: {0.16 + i * 0.06}s;">
				<StoryCard {story} />
			</div>
		{/each}
	</div>

	<!-- Mobile archive link -->
	<a
		href={base + '/archiv'}
		class="md:hidden mt-8 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full text-sm transition-all"
		style="background: var(--color-ink); color: var(--color-paper);"
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
		style="background: var(--color-ink); box-shadow: var(--shadow-lg);"
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
				style="color: var(--color-paper); font-weight: 600;"
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
					<p class="display text-xl sm:text-2xl" style="color: var(--color-paper); font-weight: 600;">Fast geschafft!</p>
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
						style="background: rgba(251,248,241,0.06); border: 1px solid rgba(251,248,241,0.22); color: var(--color-paper);"
					/>
				</label>
				<button
					type="submit"
					disabled={newsletterLoading}
					class="px-6 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap disabled:opacity-60 active:scale-[0.97]"
					style="background: var(--color-amber); color: var(--color-paper); box-shadow: var(--shadow-sm);"
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
