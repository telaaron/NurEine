<script lang="ts">
	import { base } from '$app/paths';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { toneStyles } from '$lib/utils';
	import { track } from '$lib/track';

	let { data } = $props();
	const featured = $derived(data.featured);
	const tone = $derived(featured ? toneStyles[featured.tone] : toneStyles['amber']);
	const featuredImg = $derived(
		featured
			? featured.hero && featured.hero.startsWith('http')
				? featured.hero
				: getStoryHeroImageSrc(featured.category, base)
			: ''
	);

	// Newsletter capture
	let email = $state('');
	let status = $state('');
	let loading = $state(false);
	let done = $state(false);

	async function subscribe(e: SubmitEvent) {
		e.preventDefault();
		if (loading || !email.trim()) return;
		loading = true;
		status = '';
		track('newsletter_signup_attempt', { source: 'landing' });
		try {
			const res = await fetch(`${base}/api/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), tier: 'free', source: 'landing' })
			});
			const result = await res.json();
			if (res.ok) {
				track('newsletter_signup', { source: 'landing' });
				done = true;
				status = result.message || 'Fast geschafft! Bitte überprüfe dein Postfach.';
				email = '';
			} else {
				status = result.error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
			}
		} catch {
			status = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
		} finally {
			loading = false;
		}
	}

	const steps = [
		{
			n: '01',
			t: 'Wir filtern, was du nicht siehst',
			d: 'Jeden Tag durchsuchen wir tausende Quellen weltweit — Reuters, Nature, WHO, lokale Redaktionen. Nicht nach dem Lautesten. Nach dem, was zeigt, dass Menschen vorankommen.'
		},
		{
			n: '02',
			t: 'KI misst die echte Wirkung',
			d: 'Jede Geschichte bekommt einen Wirkungsindex: Wie viele Menschen profitieren? Ist es belegt? Ist es nachhaltig? Kein Clickbait — gemessene Substanz.'
		},
		{
			n: '03',
			t: 'Du bekommst genau eine',
			d: 'Die stärkste Geschichte des Tages. In deinem Postfach oder auf der Seite. In zwei Minuten gelesen. Kein Feed, kein Scrollen, kein Sog.'
		}
	];
</script>

<svelte:head>
	<title>Warum NurEine — Schluss mit Doomscrolling</title>
	<meta
		name="description"
		content="Die Nachrichtenlage ist nicht die Welt. NurEine filtert tausende Quellen und liefert dir täglich eine belegte gute Nachricht — werbefrei, ohne Algorithmus."
	/>
</svelte:head>

<!-- ─── HERO ─── -->
<section class="relative overflow-hidden">
	<div
		class="absolute inset-0 pointer-events-none"
		aria-hidden="true"
		style="background: radial-gradient(ellipse 70% 55% at 50% 0%, rgba(200,115,64,0.16), transparent 60%);"
	></div>
	<div class="relative mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10 pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 text-center">
		<span class="eyebrow rise" style="color: var(--color-amber); font-family: var(--font-mono);">
			Warum es uns gibt
		</span>
		<h1
			class="display mx-auto mt-5 leading-[0.98] text-[2.6rem] sm:text-[3.6rem] lg:text-[5rem] max-w-[18ch] rise rise-d1"
			style="color: var(--color-ink); font-weight: 600;"
		>
			Die Welt ist besser, als deine Nachrichten dir sagen.
		</h1>
		<p
			class="mx-auto mt-6 sm:mt-8 text-lg sm:text-xl lg:text-2xl leading-[1.5] max-w-[52ch] rise rise-d2"
			style="color: var(--color-ink-soft); font-family: var(--font-serif);"
		>
			Die Nachrichtenlage ist nicht die Welt — sie ist eine Auswahl. Wir treffen eine andere:
			täglich <span style="color: var(--color-amber);">eine</span> belegte gute Nachricht. Werbefrei,
			ohne Algorithmus, ohne Sog.
		</p>
		<div class="mt-9 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 rise rise-d3">
			<a
				href="#newsletter"
				class="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all active:scale-[0.97] w-full sm:w-auto justify-center"
				style="background: var(--color-amber); color: var(--color-paper); box-shadow: var(--shadow-md);"
			>
				Täglich eine gute Nachricht
				<span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
			</a>
			<a
				href={base + '/'}
				onclick={() => track('cta_click', { cta: 'landing_open_feed' })}
				class="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all active:scale-[0.97] w-full sm:w-auto justify-center"
				style="background: transparent; color: var(--color-ink); border: 1px solid var(--color-rule-strong);"
			>
				Heutige Geschichte ansehen
			</a>
		</div>
	</div>
</section>

<!-- ─── PROBLEM ─── -->
<section class="border-t" style="border-color: var(--color-rule); background: var(--color-canvas-soft);">
	<div class="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Das Problem</span>
		<h2 class="display mt-4 text-2xl sm:text-3xl lg:text-[2.6rem] leading-[1.1] max-w-[20ch]" style="color: var(--color-ink); font-weight: 600;">
			Schlechte Nachrichten verkaufen sich besser.
		</h2>
		<div class="mt-8 grid sm:grid-cols-3 gap-px" style="background: var(--color-rule);">
			{#each [
				{ k: '−27 %', l: 'Lebenszufriedenheit bei intensiven Nachrichten-Nutzern (Studienlage)' },
				{ k: '4 ×', l: 'mehr Reichweite für negative Schlagzeilen als für positive' },
				{ k: '2,5 Std', l: 'durchschnittliche tägliche Doomscroll-Zeit' }
			] as item}
				<div class="p-6 sm:p-7" style="background: var(--color-canvas-soft);">
					<div class="display text-3xl sm:text-4xl tnum" style="color: var(--color-amber); font-weight: 600;">{item.k}</div>
					<p class="mt-3 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{item.l}</p>
				</div>
			{/each}
		</div>
		<p class="mt-8 text-base sm:text-lg leading-[1.6] max-w-[58ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Der Feed ist darauf gebaut, dich zu halten — nicht, dich zu informieren. Angst und Empörung
			binden Aufmerksamkeit. Das Ergebnis: Du weißt mehr über jede Katastrophe als über jeden
			Fortschritt. Und fühlst dich machtloser, je mehr du liest.
		</p>
	</div>
</section>

<!-- ─── LÖSUNG (3 steps) ─── -->
<section class="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
	<div class="text-center">
		<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Die Lösung</span>
		<h2 class="display mt-4 mx-auto text-2xl sm:text-3xl lg:text-[2.6rem] leading-[1.1] max-w-[22ch]" style="color: var(--color-ink); font-weight: 600;">
			Dieselben Quellen. Eine andere Auswahl.
		</h2>
	</div>
	<div class="mt-12 sm:mt-16 space-y-px" style="background: var(--color-rule);">
		{#each steps as step}
			<div class="grid sm:grid-cols-[120px_minmax(0,1fr)] gap-4 sm:gap-8 p-6 sm:p-8 items-start" style="background: var(--color-canvas);">
				<div class="display text-4xl sm:text-5xl tnum" style="color: var(--color-amber-soft); font-weight: 600;">{step.n}</div>
				<div>
					<h3 class="display text-xl sm:text-2xl" style="color: var(--color-ink); font-weight: 600;">{step.t}</h3>
					<p class="mt-3 text-base leading-[1.6] max-w-[56ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{step.d}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ─── VALUE EQUATION / PROOF ─── -->
<section class="border-t border-b" style="border-color: var(--color-rule); background: var(--color-canvas-soft);">
	<div class="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
		<div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
			<div>
				<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Die Rechnung</span>
				<h2 class="display mt-4 text-2xl sm:text-3xl lg:text-[2.4rem] leading-[1.12] max-w-[16ch]" style="color: var(--color-ink); font-weight: 600;">
					45 Minuten scrollen. Oder 2 Minuten lesen.
				</h2>
				<ul class="mt-8 space-y-4">
					{#each [
						'Informiert sein, ohne in Zynismus zu versinken',
						'Eine Geschichte — sofort konsumierbar, kein Feed',
						'Belegt, mit Quellen und gemessenem Wirkungsindex',
						'Werbefrei. Kein Algorithmus, der dich länger hält.'
					] as point}
						<li class="flex items-start gap-3">
							<span class="mt-1.5 inline-flex w-5 h-5 rounded-full items-center justify-center shrink-0" style="background: var(--color-amber-tint);">
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
							</span>
							<span class="text-base leading-snug" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{point}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="grid grid-cols-2 gap-px rounded-2xl overflow-hidden" style="background: var(--color-rule); box-shadow: var(--shadow-md);">
				{#each [
					{ n: String(data.stats.storiesCount), l: 'Geschichten kuratiert' },
					{ n: data.stats.sourcesCount, l: 'Quellen geprüft' },
					{ n: data.avgImpact + '/100', l: 'Ø Wirkungsindex' },
					{ n: '2 Min', l: 'Ø Lesezeit pro Tag' }
				] as s}
					<div class="p-6 sm:p-8" style="background: var(--color-paper);">
						<div class="display tnum text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 600;">{s.n}</div>
						<div class="mt-2 uppercase" style="font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.14em; color: var(--color-faint);">{s.l}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ─── TODAY'S STORY PREVIEW ─── -->
{#if featured}
	<section class="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
		<div class="text-center mb-10">
			<span class="eyebrow" style="color: var(--color-amber); font-family: var(--font-mono);">Heute schon erschienen</span>
			<h2 class="display mt-4 text-2xl sm:text-3xl" style="color: var(--color-ink); font-weight: 600;">So sieht eine NurEine-Geschichte aus</h2>
		</div>
		<a
			href={base + '/geschichte/' + featured.slug}
			class="group grid sm:grid-cols-[minmax(0,1fr)_300px] gap-6 sm:gap-10 items-center p-5 sm:p-7 rounded-2xl"
			style="background: var(--color-paper); border: 1px solid var(--color-rule); box-shadow: var(--shadow-sm);"
		>
			<div>
				<span class="badge px-2.5 py-1 rounded-full" style="background: {tone.bg}; color: {tone.fg}; font-family: var(--font-mono);">{featured.category}</span>
				<h3 class="display mt-4 text-2xl sm:text-3xl leading-[1.08]" style="color: var(--color-ink); font-weight: 600;">{featured.title}</h3>
				<p class="mt-3 text-base leading-[1.5] max-w-[48ch]" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{featured.dek}</p>
				<span class="mt-5 inline-flex items-center gap-2 text-xs" style="color: var(--color-muted); font-family: var(--font-mono);">
					<span class="w-1.5 h-1.5 rounded-full" style="background: {tone.fg};"></span>
					{featured.readingMinutes} Min · Wirkung {featured.impactScore} · {featured.country}
				</span>
			</div>
			<div class="relative aspect-[4/3] rounded-xl overflow-hidden" style="border: 1px solid var(--color-rule);">
				{#if featuredImg}
					<img src={featuredImg} alt="" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
				{/if}
			</div>
		</a>
	</section>
{/if}

<!-- ─── CTA CLOSE ─── -->
<section id="newsletter" class="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10 pb-20 sm:pb-28 scroll-mt-24">
	<div
		class="relative overflow-hidden rounded-[20px] p-8 sm:p-12 lg:p-16 text-center"
		style="background: var(--color-ink); box-shadow: var(--shadow-lg);"
	>
		<div class="absolute inset-0 pointer-events-none" aria-hidden="true" style="background: radial-gradient(ellipse 60% 90% at 50% 0%, rgba(200,115,64,0.32), transparent 62%);"></div>
		<div class="relative">
			<span class="eyebrow" style="color: var(--color-amber-soft); font-family: var(--font-mono);">Der tägliche Lichtblick</span>
			<h2 class="display mt-4 mx-auto text-2xl sm:text-3xl lg:text-[2.8rem] leading-[1.08] max-w-[20ch]" style="color: var(--color-paper); font-weight: 600;">
				Starte morgen mit einer guten Nachricht.
			</h2>
			<p class="mt-4 mx-auto text-base sm:text-lg leading-relaxed max-w-[46ch]" style="color: rgba(251,248,241,0.72); font-family: var(--font-serif);">
				Eine kuratierte Geschichte pro Tag. Werbefrei, jederzeit abbestellbar.
			</p>
			{#if done}
				<p class="mt-8 mx-auto max-w-[40ch] text-base" style="color: var(--color-amber-soft); font-family: var(--font-serif);">{status}</p>
			{:else}
				<form class="mt-8 mx-auto max-w-[460px] flex flex-col sm:flex-row gap-3" onsubmit={subscribe}>
					<label class="flex-1">
						<span class="sr-only">E-Mail-Adresse</span>
						<input
							type="email"
							required
							placeholder="Deine beste E-Mail"
							bind:value={email}
							disabled={loading}
							class="w-full px-5 py-3.5 rounded-full text-sm transition-all"
							style="background: rgba(251,248,241,0.06); border: 1px solid rgba(251,248,241,0.22); color: var(--color-paper);"
						/>
					</label>
					<button
						type="submit"
						disabled={loading}
						class="px-7 py-3.5 rounded-full text-sm font-medium transition-all whitespace-nowrap disabled:opacity-60 active:scale-[0.97]"
						style="background: var(--color-amber); color: var(--color-paper);"
					>
						{loading ? 'Wird gesendet...' : 'Kostenlos abonnieren'}
					</button>
				</form>
				{#if status}
					<p class="mt-4 text-sm" style="color: rgba(251,248,241,0.8); font-family: var(--font-serif);">{status}</p>
				{:else}
					<p class="mt-4" style="font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.04em; color: rgba(251,248,241,0.45);">
						Schließe dich Menschen an, die anders informiert sein wollen.
					</p>
				{/if}
			{/if}
		</div>
	</div>
</section>
