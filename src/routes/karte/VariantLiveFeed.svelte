<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors, toneLabels } from '$lib/tone-constants';
	import { createGlowMarker, highlightGlow, setFresh, popMarker, setTimeState } from '$lib/map/glow-marker';
	import { addBaseTiles, addLabelTiles } from '$lib/map/basemap';
	import { livePulse } from '$lib/sound';
	import SoundToggle from '$lib/components/SoundToggle.svelte';

	import { sparklinePath, sparklineLast, type CategoryTrend } from '$lib/world-index';

	let { stories = [], trends = [] }: { stories?: any[]; trends?: CategoryTrend[] } = $props();
	const storyCount = $derived(stories.length);

	// --- Puls der Welt: Trendzeile (echte Weltdaten, NICHT NurEine-Storys) ---
	// Labels/Reihenfolge der Welt-Teilindizes (eigene Ebene, unabh. Story-Töne).
	const trendMeta: Record<string, { label: string; blurb: string }> = {
		ueberleben: { label: 'Überleben', blurb: 'Armut, Kindersterblichkeit, Wasser, Strom …' },
		planet: { label: 'Planet', blurb: 'Erneuerbare Energie, Wald …' },
		wissen: { label: 'Wissen', blurb: 'Bildung, Alphabetisierung, Internet …' },
		frieden: { label: 'Frieden', blurb: 'Sicherheit & Konflikte' }
	};
	// Pfeil-Symbol nach Delta-Richtung (steigt = Welt wird besser).
	function trendArrow(delta: number | null): string {
		if (delta == null) return '→';
		if (delta > 0.3) return '↗';
		if (delta < -0.3) return '↘';
		return '→';
	}
	function trendClass(delta: number | null): 'up' | 'down' | 'flat' {
		if (delta == null) return 'flat';
		if (delta > 0.3) return 'up';
		if (delta < -0.3) return 'down';
		return 'flat';
	}
	// Bewusst KEIN wertendes Trendwort und KEIN Pseudo-Score: die naive
	// Kombination mehrerer Indikatoren zu einem „Index" ist noch nicht validiert
	// (Gewichtung, Abdeckung). Die Sparkline + der Pfeil zeigen die tatsächliche
	// Bewegung der Rohdaten; die Beschriftung bleibt rein faktisch (Zeitraum +
	// Datenstand). Die Deutung liefert später der Statistiker-KI-Layer auf
	// /stand-der-welt.
	function fmtDelta(t: CategoryTrend): string {
		if (t.deltaFromYear == null || t.latestYear == null) return '';
		return `${t.deltaFromYear}–${t.latestYear} · ${t.metricCount} Indikator${t.metricCount === 1 ? '' : 'en'}`;
	}

	// --- Zeit-Modell -------------------------------------------------------
	const DAY = 86_400_000;
	// „wann" = Erscheinen bei NurEine (createdAt, sonst publishedAt).
	function storyTime(s: any): number {
		const t = Date.parse(s?.createdAt || s?.publishedAt || '');
		return Number.isFinite(t) ? t : 0;
	}
	// Relative Zeitangabe für den Zeit-Feed („vor 3 Tagen").
	function relTime(s: any): string {
		const t = storyTime(s);
		if (!t) return '';
		const d = Math.floor((tMax - t) / DAY);
		if (d <= 0) return 'neu';
		if (d === 1) return 'gestern';
		if (d < 7) return `vor ${d} T.`;
		const w = Math.floor(d / 7);
		if (w < 5) return `vor ${w} Wo.`;
		return `vor ${Math.floor(d / 30)} Mon.`;
	}
	// Stories chronologisch (alt → neu), nur die mit gültiger Zeit.
	const timed = $derived(
		stories
			.map((s) => ({ s, t: storyTime(s) }))
			.filter((x) => x.t > 0)
			.sort((a, b) => a.t - b.t)
	);
	const tMin = $derived(timed.length ? timed[0].t : 0);
	const tMax = $derived(timed.length ? timed[timed.length - 1].t : 0);
	// „frisch" = letzte 3 Tage vor dem jüngsten Eintrag → Dauer-Puls.
	const freshFrom = $derived(tMax - 3 * DAY);

	let activeSlug = $state<string | null>(null);
	let filterTone = $state<string | null>(null);
	let feedSort = $state<'time' | 'impact'>('time');
	let mapContainer = $state<HTMLDivElement | null>(null);

	// --- Zeitraffer-Zustand ------------------------------------------------
	// Einmaliger Intro-Zeitraffer beim Laden — KEINE Bedienleiste. Der Cursor
	// wandert einmal von „damals" nach „jetzt", dann bleibt es im Live-Zustand.
	let playing = $state(false);
	// cursor = 0..1 Position im Zeitfenster (1 = heute/alle sichtbar).
	let cursor = $state(1);
	let introDone = $state(false); // läuft nur EINMAL pro Mount
	const PLAY_MS = 14_000; // Dauer des Intro-Durchlaufs
	const WINDOW_DAYS = 6; // Breite des „aktiven" Fensters im Zeitraffer

	const cursorTime = $derived(tMin + (tMax - tMin) * cursor);
	const cursorDate = $derived(
		browser && cursorTime
			? new Date(cursorTime).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
			: ''
	);

	const activeStory = $derived(activeSlug ? stories.find((s) => s.slug === activeSlug) ?? null : null);

	// Feed: nach Zeit (neu → alt) oder nach Wirkung. Im Zeitraffer zeigt der
	// Zeit-Feed nur, was bis zum Cursor „passiert" ist (neueste zuerst).
	const feed = $derived.by(() => {
		let list = stories.filter((s) => !filterTone || s.tone === filterTone);
		if (feedSort === 'impact') {
			return [...list].sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
		}
		// Zeit-Sortierung
		let byTime = [...list].sort((a, b) => storyTime(b) - storyTime(a));
		if (playing || cursor < 1) {
			byTime = byTime.filter((s) => storyTime(s) <= cursorTime + 12 * 3600_000);
		}
		return byTime;
	});

	let map: any = null;
	let markerBySlug = new Map<string, any>();
	let markerTime = new Map<string, number>();
	let _init = false;
	let mapReady = $state(false);

	$effect(() => {
		const el = mapContainer;
		if (!browser || !el || _init) return;
		_init = true;
		import('leaflet').then((L) => {
			if (!mapContainer) return;
			// Attribution AN (Esri verlangt sie für die keyfreien Canvas-Kacheln),
			// aber ohne das „Leaflet"-Prefix und dezent gestylt (s. leaflet-shared.css).
			const m = L.map(el, { center: [35, 10], zoom: 2, zoomControl: true, scrollWheelZoom: true, attributionControl: true, worldCopyJump: true });
			m.attributionControl.setPrefix(false);
			(window as any).L = L;
			addBaseTiles(m);
			for (const s of stories) {
				const mk = createGlowMarker(s, m, (slug) => { skipIntro(); activeSlug = slug; });
				if (mk) {
					markerBySlug.set(s.slug, mk);
					markerTime.set(s.slug, storyTime(s));
				}
			}
			addLabelTiles(m);
			requestAnimationFrame(() => {
				m.invalidateSize();
				startIntro();
			});
			map = m;
			mapReady = true;
		});
		return () => { map?.remove(); map = null; markerBySlug.clear(); markerTime.clear(); _init = false; mapReady = false; };
	});

	// --- Idle: jüngste Geschichten pulsieren dauerhaft ---------------------
	function applyLivePulse() {
		if (!map) return;
		const cut = freshFrom;
		for (const [slug, mk] of markerBySlug) {
			const fresh = (markerTime.get(slug) ?? 0) >= cut;
			setFresh(mk, fresh);
			setTimeState(mk, 'active');
		}
	}

	// Sobald die Karte bereit ist (und wir nicht im Zeitraffer sind), den
	// Live-Puls setzen. mapReady ist reaktiv, freshFrom auch — so greift der
	// Puls auch, wenn die Daten erst nach dem Karten-Setup „settlen".
	$effect(() => {
		if (!mapReady || playing || cursor < 1) return;
		freshFrom; // Abhängigkeit registrieren
		applyLivePulse();
	});

	// --- Zeitraffer-Engine (rAF, nur während playing) ----------------------
	let raf = 0;
	let lastTs = 0;
	const popped = new Set<string>();

	function tick(ts: number) {
		if (!playing) return;
		if (!lastTs) lastTs = ts;
		const dt = ts - lastTs;
		lastTs = ts;
		cursor = Math.min(1, cursor + dt / PLAY_MS);
		renderCursor();
		if (cursor >= 1) {
			endIntro();
			return;
		}
		raf = requestAnimationFrame(tick);
	}

	// Klang-Drossel für den Zeitraffer: im Intro poppen an dichten Tagen ein
	// Dutzend Marker gleichzeitig — ungedrosselt wäre das Prasseln statt Puls.
	// Mindestens 90 ms Abstand, damit einzelne Tropfen hörbar bleiben.
	let lastPulseAt = 0;
	function pulseSound() {
		const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
		if (now - lastPulseAt < 90) return;
		lastPulseAt = now;
		livePulse();
	}

	function renderCursor() {
		if (!map) return;
		const ct = cursorTime;
		const windowStart = ct - WINDOW_DAYS * DAY;
		for (const [slug, mk] of markerBySlug) {
			const t = markerTime.get(slug) ?? 0;
			if (t > ct) {
				setTimeState(mk, 'hidden');
				setFresh(mk, false);
			} else if (t < windowStart) {
				setTimeState(mk, 'ghost');
				setFresh(mk, false);
			} else {
				setTimeState(mk, 'active');
				// Beim ersten Überqueren aufblitzen lassen.
				if (!popped.has(slug)) {
					popped.add(slug);
					popMarker(mk);
					pulseSound();
				}
			}
		}
	}

	function prefersReducedMotion(): boolean {
		return browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Einmaliger Intro-Durchlauf beim Laden. Kein Steuerelement — läuft von
	// selbst von „damals" nach „jetzt" und endet im Live-Zustand.
	function startIntro() {
		if (!map || introDone || playing) return;
		if (prefersReducedMotion() || timed.length < 8) {
			// Ohne Animation direkt in den Live-Zustand.
			endIntro();
			return;
		}
		cursor = 0;
		popped.clear();
		playing = true;
		lastTs = 0;
		raf = requestAnimationFrame(tick);
	}

	function stop() {
		playing = false;
		cancelAnimationFrame(raf);
		raf = 0;
		lastTs = 0;
	}

	// Intro beenden → Live-Zustand: alles sichtbar, jüngste pulsieren.
	function endIntro() {
		stop();
		introDone = true;
		cursor = 1;
		popped.clear();
		applyLivePulse();
	}

	// Jede Nutzer-Interaktion überspringt den Intro-Zeitraffer sofort.
	function skipIntro() {
		if (playing || cursor < 1) endIntro();
	}

	onDestroy(() => { if (raf) cancelAnimationFrame(raf); });

	// Highlight active marker + pan
	$effect(() => {
		const slug = activeSlug;
		if (!map || !slug) return;
		const mk = markerBySlug.get(slug);
		if (!mk) return;
		highlightGlow(mk, true);
		for (const [o, om] of markerBySlug) if (o !== slug) highlightGlow(om, false);
		map.flyTo(mk.getLatLng(), Math.max(map.getZoom(), 4), { duration: 0.7 });
		queueMicrotask(() => document.getElementById('feed-' + slug)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
		return () => { for (const s of stories) { const m2 = markerBySlug.get(s.slug); if (m2) highlightGlow(m2, false); } };
	});

	// Tone-Filter dämpft nicht-passende Marker (nur außerhalb des Zeitraffers).
	$effect(() => {
		if (!map || playing || cursor < 1) return;
		for (const [slug, mk] of markerBySlug) {
			const s = stories.find((x) => x.slug === slug);
			const hidden = filterTone && s?.tone !== filterTone;
			mk.setStyle({ opacity: hidden ? 0.08 : 0.85, fillOpacity: hidden ? 0.06 : 0.9 });
			setFresh(mk, !hidden && (markerTime.get(slug) ?? 0) >= freshFrom);
		}
	});
</script>

<section class="feed-page">
	<header class="head">
		<div>
			<p class="eyebrow" style="color: var(--color-amber);">Karte der Hoffnung</p>
			<h1 class="display head-title">Wo auf der Welt Gutes passiert.</h1>
		</div>
		<div class="pulse"><span class="pulse-dot"></span>{storyCount} Geschichten &middot; lebendes Zeitfenster</div>
	</header>

	<!-- ===== PULS DER WELT: Trendzeile (echte Weltdaten, nicht NurEine-Storys) ===== -->
	{#if trends.length}
		<div class="worldpulse">
			<div class="wp-head">
				<span class="wp-title">Puls der Welt <span class="wp-sub">· Langzeit-Weltdaten, nicht diese Geschichten</span></span>
				<a class="wp-more" href={base + '/stand-der-welt'}>Wie steht die Welt? →</a>
			</div>
			<div class="wp-grid">
				{#each trends as t}
					{@const meta = trendMeta[t.category] ?? { label: t.category, blurb: '' }}
					{@const dir = trendClass(t.delta)}
					{@const last = t.status === 'ok' ? sparklineLast(t.series, 100, 26) : null}
					<a class="wp-card" class:pending={t.status === 'pending'} href={base + '/stand-der-welt'} title={meta.blurb}>
						<div class="wp-row">
							<span class="wp-label">{meta.label}</span>
							{#if t.status === 'ok'}
								<span class="wp-arrow {dir}">{trendArrow(t.delta)}</span>
							{/if}
						</div>
						{#if t.status === 'ok' && last}
								<svg class="wp-spark {dir}" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
									<path class="wp-spark-line" d={sparklinePath(t.series, 100, 26)} />
									<circle class="wp-spark-dot" cx={last.x} cy={last.y} r="2" />
								</svg>
							<span class="wp-delta {dir}">{fmtDelta(t)}</span>
						{:else}
							<div class="wp-pending"><span class="wp-pending-line"></span></div>
							<span class="wp-delta flat">Daten folgen</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- tone filters -->
	<div class="filters">
		<button class="chip" class:active={filterTone === null} onclick={() => { skipIntro(); filterTone = null; }}>Alle</button>
		{#each Object.entries(toneColors) as [key, color]}
			<button class="chip" class:active={filterTone === key} style="--c:{color}" onclick={() => { skipIntro(); filterTone = filterTone === key ? null : key; }}>
				<span class="chip-dot" style="background:{color}"></span>{toneLabels[key] ?? key}
			</button>
		{/each}
		<!-- Klang gehört hierher, nicht in die globale Navigation: die Karte ist
		     die einzige Website-Ansicht, die überhaupt klingt. -->
		<SoundToggle />
	</div>

	<div class="grid">
		<!-- MAP -->
		<div class="map-col">
			<div class="map-frame" bind:this={mapContainer}>
				{#if !mapReady}
					<div class="loading"><div class="spinner"></div><span>Karte wird geladen…</span></div>
				{/if}

				<!-- Dezente, schwebende Datumsanzeige NUR während des Intro-Zeitraffers.
				     Kein Steuerelement, keine Leiste — nur ein Hauch von „wann". -->
				{#if playing}
					<div class="ticker" role="status" aria-live="off">
						<span class="ticker-dot"></span>
						<span class="ticker-date">{cursorDate}</span>
						<span class="ticker-bar"><span class="ticker-bar-fill" style="width:{cursor * 100}%"></span></span>
					</div>
				{/if}
			</div>
		</div>

		<!-- FEED -->
		<div class="feed">
			<div class="feed-head">
				<div class="feed-toggle">
					<button class:on={feedSort === 'time'} onclick={() => { skipIntro(); feedSort = 'time'; }}>Nach Zeit</button>
					<button class:on={feedSort === 'impact'} onclick={() => { skipIntro(); feedSort = 'impact'; }}>Nach Wirkung</button>
				</div>
				<span class="feed-count">{feed.length}</span>
			</div>
			<div class="feed-scroll">
				{#each feed as s (s.slug)}
					{@const hex = toneColors[s.tone] ?? '#c87340'}
					<button
						id={'feed-' + s.slug}
						class="feed-item"
						class:active={activeSlug === s.slug}
						style="--accent:{hex}"
						onclick={() => { skipIntro(); activeSlug = s.slug; }}
					>
						<span class="fi-tick" style="background:{hex}"></span>
						<div class="fi-body">
							<div class="fi-top">
								<span class="fi-country">{s.country}</span>
								<span class="fi-meta">{feedSort === 'time' ? relTime(s) : s.impactScore}</span>
							</div>
							<span class="fi-title">{s.title}</span>
						</div>
					</button>
				{/each}
				{#if feed.length === 0}
					<p class="feed-empty">Noch nichts in diesem Zeitfenster.</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- active story detail card -->
	{#if activeStory}
		{@const hex = toneColors[activeStory.tone] ?? '#c87340'}
		{@const hasImg = activeStory.hero?.startsWith('http')}
		<a class="detail" class:with-img={hasImg} style="--accent:{hex}" href={base + '/geschichte/' + activeStory.slug}>
			{#if hasImg}
				<div class="det-media"><img src={`${base}/img?url=${encodeURIComponent(activeStory.hero)}&w=600`} alt="" loading="lazy" /></div>
			{/if}
			<div class="det-content">
				<div class="det-top">
					<span class="det-badge">{activeStory.category}</span>
					<span class="det-country">{activeStory.country}</span>
					<span class="det-impact">{activeStory.impactScore}/100 Wirkung</span>
				</div>
				<h3 class="det-title display">{activeStory.title}</h3>
				<p class="det-dek">{activeStory.dek}</p>
				<span class="det-go">Geschichte lesen<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg></span>
			</div>
		</a>
	{/if}
</section>

<style>
	.feed-page { max-width: 1400px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
	@media (min-width: 1024px) { .feed-page { padding: 2.5rem 2.5rem 4rem; } }

	.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.head-title { color: var(--color-ink); font-weight: 600; line-height: 1.1; font-size: clamp(1.6rem, 3vw, 2.6rem); margin-top: 0.4rem; }
	.pulse { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--color-muted); font-family: var(--font-mono); }
	.pulse-dot { width: 0.6rem; height: 0.6rem; border-radius: 999px; background: var(--color-amber); box-shadow: 0 0 0 0 var(--color-amber); animation: pulse 1.8s infinite; }
	@keyframes pulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-amber) 60%, transparent); } 70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }

	/* ===== Puls der Welt: Trendzeile ===== */
	.worldpulse { margin-top: 1.4rem; }
	.wp-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
	.wp-title { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-muted); }
	.wp-sub { text-transform: none; letter-spacing: 0; color: var(--color-faint); font-size: 0.92em; }
	@media (max-width: 560px) { .wp-sub { display: none; } }
	.wp-more { font-size: 0.75rem; color: var(--color-amber); text-decoration: none; }
	.wp-more:hover { text-decoration: underline; }

	.wp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
	@media (min-width: 720px) { .wp-grid { grid-template-columns: repeat(4, 1fr); } }

	.wp-card { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.7rem 0.85rem; border-radius: 12px; border: 1px solid var(--color-rule); background: var(--color-paper); text-decoration: none; transition: border-color 0.15s, transform 0.15s; }
	.wp-card:hover { border-color: var(--color-rule-strong); transform: translateY(-1px); }
	.wp-card.pending { opacity: 0.72; }

	.wp-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
	.wp-label { font-size: 0.82rem; font-weight: 600; color: var(--color-ink); }
	.wp-arrow { font-family: var(--font-mono); font-size: 0.95rem; font-weight: 700; line-height: 1; }
	.wp-arrow.up { color: var(--color-sage); }
	.wp-arrow.down { color: var(--color-rose); }
	.wp-arrow.flat { color: var(--color-muted); }

	.wp-spark { width: 100%; height: 26px; display: block; overflow: visible; }
	.wp-spark-line { fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
	.wp-spark.up .wp-spark-line { stroke: var(--color-sage); }
	.wp-spark.down .wp-spark-line { stroke: var(--color-rose); }
	.wp-spark.flat .wp-spark-line { stroke: var(--color-muted); }
	.wp-spark-dot { stroke: var(--color-paper); stroke-width: 1.2; }
	.wp-spark.up .wp-spark-dot { fill: var(--color-sage); }
	.wp-spark.down .wp-spark-dot { fill: var(--color-rose); }
	.wp-spark.flat .wp-spark-dot { fill: var(--color-muted); }

	.wp-pending { height: 26px; display: flex; align-items: center; }
	.wp-pending-line { width: 100%; height: 2px; border-radius: 999px; background: repeating-linear-gradient(90deg, var(--color-rule) 0 6px, transparent 6px 12px); }

	.wp-delta { font-size: 0.66rem; color: var(--color-faint); font-family: var(--font-mono); }
	.wp-delta.up { color: color-mix(in srgb, var(--color-sage) 85%, var(--color-muted)); }
	.wp-delta.down { color: color-mix(in srgb, var(--color-rose) 85%, var(--color-muted)); }

	.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.25rem 0; align-items: center; }
	.chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 999px; font-size: 0.8rem; border: 1px solid var(--color-rule); background: transparent; color: var(--color-ink-soft); cursor: pointer; transition: all 0.15s; }
	.chip:hover { border-color: var(--color-rule-strong); }
	.chip.active { background: var(--color-surface-ink); color: var(--color-on-ink); border-color: transparent; }
	.chip-dot { width: 0.6rem; height: 0.6rem; border-radius: 999px; }

	.grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
	@media (min-width: 1024px) { .grid { grid-template-columns: 1fr 360px; align-items: start; } }
	.map-col { display: flex; flex-direction: column; gap: 0.75rem; }

	.map-frame { position: relative; width: 100%; height: 56vh; min-height: 380px; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-rule); box-shadow: 0 16px 50px -30px rgba(0,0,0,0.5); }
	.loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--color-canvas); z-index: 10; color: var(--color-muted); font-size: 0.9rem; }
	.spinner { width: 1.75rem; height: 1.75rem; border: 2px solid var(--color-rule); border-top-color: var(--color-amber); border-radius: 999px; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	/* --- Intro-Ticker: schwebend über der Karte, nur während des Zeitraffers --- */
	.ticker {
		position: absolute; z-index: 500; left: 50%; bottom: 1rem; transform: translateX(-50%);
		display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.9rem;
		border-radius: 999px; pointer-events: none;
		background: color-mix(in srgb, var(--color-paper) 82%, transparent);
		backdrop-filter: blur(12px) saturate(1.3); -webkit-backdrop-filter: blur(12px) saturate(1.3);
		border: 1px solid color-mix(in srgb, var(--color-amber) 30%, var(--color-rule));
		box-shadow: 0 10px 30px -14px rgba(0,0,0,0.55);
		animation: ticker-in 0.4s ease both;
	}
	@keyframes ticker-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
	.ticker-dot { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--color-amber); flex-shrink: 0; box-shadow: 0 0 0 0 var(--color-amber); animation: pulse 1.6s infinite; }
	.ticker-date { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; color: var(--color-ink); white-space: nowrap; }
	.ticker-bar { width: 5rem; height: 3px; border-radius: 999px; background: var(--color-rule); overflow: hidden; flex-shrink: 0; }
	.ticker-bar-fill { display: block; height: 100%; border-radius: 999px; background: var(--color-amber); }

	/* --- Feed --- */
	.feed { border: 1px solid var(--color-rule); border-radius: 12px; overflow: hidden; background: var(--color-paper); }
	.feed-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.6rem 0.7rem; border-bottom: 1px solid var(--color-rule); }
	.feed-toggle { display: inline-flex; background: var(--color-canvas-soft); border-radius: 999px; padding: 2px; }
	.feed-toggle button { border: none; background: none; cursor: pointer; font-size: 0.72rem; padding: 0.3rem 0.7rem; border-radius: 999px; color: var(--color-muted); transition: all 0.15s; }
	.feed-toggle button.on { background: var(--color-surface-ink); color: var(--color-on-ink); }
	.feed-count { font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-faint); }

	.feed-scroll { height: calc(56vh - 3rem); min-height: 340px; overflow-y: auto; padding: 0.5rem; scrollbar-width: thin; }
	.feed-item { display: flex; gap: 0.75rem; width: 100%; text-align: left; padding: 0.6rem; border-radius: 9px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: background 0.15s, border-color 0.15s; align-items: center; }
	.feed-item:hover { background: var(--color-canvas-soft); }
	.feed-item.active { background: color-mix(in srgb, var(--accent) 10%, transparent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
	.fi-tick { width: 3px; align-self: stretch; border-radius: 999px; flex-shrink: 0; opacity: 0.55; transition: opacity 0.15s; }
	.feed-item:hover .fi-tick, .feed-item.active .fi-tick { opacity: 1; }
	.fi-body { min-width: 0; flex: 1; }
	.fi-top { display: flex; justify-content: space-between; align-items: center; font-size: 0.68rem; color: var(--color-muted); gap: 0.5rem; }
	.fi-meta { font-family: var(--font-mono); color: var(--accent); font-weight: 600; white-space: nowrap; }
	.fi-title { display: block; font-size: 0.86rem; color: var(--color-ink); font-weight: 500; line-height: 1.3; margin-top: 0.15rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
	.feed-empty { padding: 2rem 1rem; text-align: center; color: var(--color-faint); font-size: 0.85rem; }

	/* rich, inviting story card at the bottom */
	.detail {
		margin-top: 1.5rem; display: grid; grid-template-columns: 1fr; gap: 0; border-radius: 16px; overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--color-rule));
		background: var(--color-paper); text-decoration: none;
		box-shadow: 0 18px 50px -28px rgba(0,0,0,0.55);
		animation: cardin 0.35s cubic-bezier(0.2,0.7,0.2,1) both; transition: transform 0.2s, box-shadow 0.2s;
	}
	.detail:hover { transform: translateY(-2px); box-shadow: 0 24px 60px -26px rgba(0,0,0,0.6); }
	@keyframes cardin { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
	@media (min-width: 720px) { .detail.with-img { grid-template-columns: 300px 1fr; } }

	.det-media { position: relative; overflow: hidden; background: var(--color-canvas-soft); min-height: 180px; }
	.det-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.det-media::after { content: ''; position: absolute; inset: 0; box-shadow: inset -1px 0 0 var(--color-rule); }

	.det-content { padding: 1.4rem 1.6rem 1.5rem; display: flex; flex-direction: column; }
	.det-top { display: flex; align-items: center; gap: 0.7rem; font-size: 0.72rem; color: var(--color-muted); flex-wrap: wrap; }
	.det-badge { padding: 0.22rem 0.65rem; border-radius: 999px; font-weight: 600; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); text-transform: capitalize; }
	.det-impact { margin-left: auto; font-family: var(--font-mono); color: var(--accent); font-weight: 600; }
	.det-title { margin-top: 0.75rem; color: var(--color-ink); font-weight: 600; font-size: clamp(1.2rem, 2vw, 1.6rem); line-height: 1.2; }
	.det-dek { margin-top: 0.65rem; color: var(--color-ink-soft); font-family: var(--font-serif); font-size: 1rem; line-height: 1.55; }
	.det-go { margin-top: 1.1rem; display: inline-flex; align-items: center; gap: 0.4rem; color: var(--accent); font-weight: 600; font-size: 0.9rem; }
	.detail:hover .det-go { gap: 0.6rem; }
	.det-go svg { transition: transform 0.2s; }
</style>
