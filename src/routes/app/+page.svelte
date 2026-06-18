<script lang="ts">
	import { base } from '$app/paths';
	import { fetchStories, fetchToday } from '$lib/app/api';
	import { cacheGet, cacheSet, tapLight } from '$lib/app/native';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { categoryLabel } from '$lib/categories';
	import { toneStyles } from '$lib/utils';
	import type { StoryResult } from '$lib/server/queries';

	const CACHE_KEY = 'today_v1';

	let hero = $state<StoryResult | null>(null);
	let week = $state<StoryResult[]>([]);
	let loading = $state(true);
	let errored = $state(false);
	let fromCache = $state(false);

	// Pull-to-refresh
	let pullY = $state(0);
	let refreshing = $state(false);
	let startY = 0;
	let pulling = false;

	const today = new Date().toLocaleDateString('de-DE', {
		weekday: 'long',
		day: '2-digit',
		month: 'long'
	});

	function heroImg(s: StoryResult): string {
		if (s.imageUrl && s.imageUrl.startsWith('http')) return s.imageUrl;
		return getStoryHeroImageSrc(s.category, base);
	}

	async function load(opts: { silent?: boolean } = {}) {
		if (!opts.silent) loading = true;
		errored = false;
		try {
			const all = await fetchStories({ limit: 8 });
			const top = [...all].sort((a, b) => b.impactScore - a.impactScore)[0] ?? null;
			hero = top;
			week = all.filter((s) => s.slug !== top?.slug).slice(0, 4);
			fromCache = false;
			cacheSet(CACHE_KEY, { hero, week });
		} catch {
			// Offline / API down: fall back to the last cached morning.
			const cached = await cacheGet<{ hero: StoryResult | null; week: StoryResult[] }>(CACHE_KEY);
			if (cached?.hero) {
				hero = cached.hero;
				week = cached.week ?? [];
				fromCache = true;
			} else {
				errored = true;
			}
		} finally {
			loading = false;
		}
	}

	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		tapLight();
		await load({ silent: true });
		refreshing = false;
		pullY = 0;
	}

	// Scroll lives on the .app-main container now (not window).
	function scrollTop(el: EventTarget | null): number {
		const main = (el as HTMLElement | null)?.closest('.app-main');
		return main ? main.scrollTop : 0;
	}
	function onTouchStart(e: TouchEvent) {
		if (scrollTop(e.currentTarget) <= 0) {
			startY = e.touches[0].clientY;
			pulling = true;
		}
	}
	function onTouchMove(e: TouchEvent) {
		if (!pulling || refreshing) return;
		const dy = e.touches[0].clientY - startY;
		if (dy > 0 && scrollTop(e.currentTarget) <= 0) pullY = Math.min(dy * 0.5, 80);
	}
	function onTouchEnd() {
		pulling = false;
		if (pullY > 56) refresh();
		else pullY = 0;
	}

	$effect(() => {
		load();
	});
</script>

<div class="ptr" style="height:{pullY}px;" aria-hidden={pullY === 0}>
	<span class="ptr-spin" class:go={refreshing || pullY > 56}>
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></svg>
	</span>
</div>

<div class="today" ontouchstart={onTouchStart} ontouchmove={onTouchMove} ontouchend={onTouchEnd} style="transform:translateY({pullY}px);">
	<header class="today-head">
		<p class="today-date">{today}</p>
		<h1 class="today-title display">Heute</h1>
		<div class="today-eyebrow">
			<span class="rule"></span>
			<span class="eyebrow">Ehrlicher Fortschritt · heute</span>
		</div>
		{#if fromCache}
			<p class="offline-note">Offline — zuletzt geladene Geschichte.</p>
		{/if}
	</header>

	{#if loading}
		<div class="hero-card skeleton" aria-hidden="true">
			<div class="sk-img"></div>
			<div class="sk-body"><div class="sk-line w70"></div><div class="sk-line w90"></div></div>
		</div>
	{:else if errored}
		<div class="state">
			<p>Verbindung verloren.</p>
			<button onclick={load}>Erneut versuchen</button>
		</div>
	{:else if !hero}
		<div class="state">
			<p>Heute noch keine Geschichte. Schau gleich nochmal vorbei.</p>
		</div>
	{:else}
		{@const tone = toneStyles[hero.tone]}
		<a class="hero-card" href={base + '/app/geschichte/' + hero.id}>
			<div class="hero-img">
				<img src={heroImg(hero)} alt="" loading="eager" />
				<span class="hero-tag" style="color:{tone.fg};border-color:{tone.ring};">{categoryLabel(hero.category)}</span>
				<div class="hero-impact">
					<div class="impact-n display">{hero.impactScore}</div>
					<div class="impact-l">WIRKUNG</div>
				</div>
			</div>
			<div class="hero-body">
				<h2 class="display">{hero.title}</h2>
				<p class="serif">{hero.dek}</p>
				<div class="hero-meta">
					<span class="dot" style="background:{tone.fg};"></span>
					{hero.readingMinutes} Min · {hero.country}
				</div>
			</div>
		</a>

		{#if week.length}
			<p class="section-label eyebrow">Diese Woche</p>
			<div class="week">
				{#each week as s (s.slug)}
					{@const t = toneStyles[s.tone]}
					<a class="week-row" href={base + '/app/geschichte/' + s.id}>
						<div class="week-thumb"><img src={heroImg(s)} alt="" loading="lazy" /></div>
						<div class="week-text">
							<span class="week-tag" style="color:{t.fg};">{categoryLabel(s.category)}</span>
							<div class="week-title display">{s.title}</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.ptr { display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
	.ptr-spin { color: var(--color-faint); padding-bottom: 10px; transition: color 0.15s; }
	.ptr-spin.go { color: var(--color-amber-deep); }
	.ptr-spin.go svg { animation: spin 0.9s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	.today { padding: 14px 20px 0; }
	.offline-note { margin-top: 8px; font-family: var(--font-mono); font-size: 11px; color: var(--color-amber-deep); }
	.today-date { font-family: var(--font-mono); font-size: 13px; color: var(--color-faint); letter-spacing: 0.04em; }
	.today-title { font-size: 34px; font-weight: 600; color: var(--color-ink); margin-top: 2px; }
	.today-eyebrow { display: flex; align-items: center; gap: 8px; margin-top: 12px; margin-bottom: 12px; }
	.today-eyebrow .rule { width: 22px; height: 1px; background: var(--color-amber); }
	.today-eyebrow .eyebrow { color: var(--color-amber-deep); font-family: var(--font-mono); }

	.hero-card { display: block; border: 1px solid var(--color-rule); border-radius: 18px; overflow: hidden; background: var(--color-paper); box-shadow: var(--shadow-md); text-decoration: none; color: inherit; }
	.hero-card:active { transform: scale(0.985); }
	.hero-img { position: relative; aspect-ratio: 16 / 10; background: var(--color-canvas-soft); }
	.hero-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
	.hero-tag { position: absolute; top: 11px; left: 11px; background: color-mix(in srgb, var(--color-paper) 88%, transparent); border: 1px solid; border-radius: 999px; padding: 3px 9px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; }
	.hero-impact { position: absolute; bottom: -1px; right: 11px; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 11px; padding: 7px 11px; text-align: center; }
	.impact-n { font-size: 22px; font-weight: 600; line-height: 1; color: var(--color-ink); }
	.impact-l { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.16em; color: var(--color-faint); margin-top: 2px; }
	.hero-body { padding: 15px 16px 17px; }
	.hero-body h2 { font-size: 22px; font-weight: 600; line-height: 1.12; color: var(--color-ink); }
	.hero-body p { font-size: 14px; line-height: 1.55; color: var(--color-ink-soft); margin-top: 9px; }
	.hero-meta { display: flex; align-items: center; gap: 6px; margin-top: 13px; font-family: var(--font-mono); font-size: 11px; color: var(--color-muted); }
	.hero-meta .dot { width: 6px; height: 6px; border-radius: 50%; }

	.section-label { color: var(--color-amber-deep); font-family: var(--font-mono); margin: 22px 2px 10px; }
	.week { display: flex; flex-direction: column; gap: 11px; }
	.week-row { display: flex; gap: 11px; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 13px; padding: 10px; text-decoration: none; color: inherit; }
	.week-row:active { transform: scale(0.985); }
	.week-thumb { width: 62px; height: 62px; border-radius: 10px; overflow: hidden; flex: 0 0 auto; background: var(--color-canvas-soft); }
	.week-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.week-text { min-width: 0; }
	.week-tag { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; }
	.week-title { font-size: 14px; font-weight: 500; line-height: 1.18; color: var(--color-ink); margin-top: 5px; }

	.state { text-align: center; padding: 48px 24px; color: var(--color-muted); font-family: var(--font-serif); }
	.state button { margin-top: 14px; background: var(--color-ink); color: var(--color-paper); border: none; border-radius: 999px; padding: 11px 22px; font-size: 14px; }

	.skeleton .sk-img { aspect-ratio: 16 / 10; background: var(--color-canvas-soft); }
	.skeleton .sk-body { padding: 16px; }
	.sk-line { height: 14px; border-radius: 6px; background: var(--color-canvas-soft); margin-bottom: 10px; }
	.sk-line.w70 { width: 70%; } .sk-line.w90 { width: 90%; }
	.skeleton { border: 1px solid var(--color-rule); border-radius: 18px; overflow: hidden; }
	@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
	.skeleton .sk-img, .sk-line { animation: pulse 1.4s ease-in-out infinite; }
</style>
