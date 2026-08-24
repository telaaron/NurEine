<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors, toneLabels } from '$lib/tone-constants';
	import { createGlowMarker, highlightGlow, setFresh, popMarker, setTimeState } from '$lib/map/glow-marker';
	import { addBaseTiles, addLabelTiles } from '$lib/map/basemap';

	let { stories = [] }: { stories?: any[] } = $props();
	const storyCount = $derived(stories.length);

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
	let playing = $state(false);
	// cursor = 0..1 Position im Zeitfenster (1 = heute/alle sichtbar).
	let cursor = $state(1);
	const PLAY_MS = 32_000; // Dauer eines vollen Durchlaufs
	const WINDOW_DAYS = 5; // Breite des „aktiven" Fensters im Zeitraffer

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
			const m = L.map(el, { center: [35, 10], zoom: 2, zoomControl: true, scrollWheelZoom: true, attributionControl: false, worldCopyJump: true });
			(window as any).L = L;
			addBaseTiles(m);
			for (const s of stories) {
				const mk = createGlowMarker(s, m, (slug) => (activeSlug = slug));
				if (mk) {
					markerBySlug.set(s.slug, mk);
					markerTime.set(s.slug, storyTime(s));
				}
			}
			addLabelTiles(m);
			requestAnimationFrame(() => {
				m.invalidateSize();
				applyLivePulse();
			});
			map = m;
			mapReady = true;
		});
		return () => { map?.remove(); map = null; markerBySlug.clear(); markerTime.clear(); _init = false; mapReady = false; };
	});

	// --- Idle: jüngste Geschichten pulsieren dauerhaft ---------------------
	function applyLivePulse() {
		if (!map) return;
		for (const [slug, mk] of markerBySlug) {
			const fresh = (markerTime.get(slug) ?? 0) >= freshFrom;
			setFresh(mk, fresh);
			setTimeState(mk, 'active');
		}
	}

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
			stop();
			return;
		}
		raf = requestAnimationFrame(tick);
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
				}
			}
		}
	}

	function play() {
		if (!map || playing) return;
		// Bei Start vom Ende: von vorne beginnen.
		if (cursor >= 1) cursor = 0;
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

	function togglePlay() {
		if (playing) stop();
		else play();
	}

	// Scrubben: Cursor manuell setzen (stoppt das Abspielen).
	function scrubTo(value: number) {
		stop();
		cursor = value;
		popped.clear();
		// Alles bis zum Cursor als sichtbar markieren (kein Aufblitzen beim Scrub).
		if (map) {
			const ct = cursorTime;
			const windowStart = ct - WINDOW_DAYS * DAY;
			for (const [slug, mk] of markerBySlug) {
				const t = markerTime.get(slug) ?? 0;
				popped.add(slug);
				if (t > ct) setTimeState(mk, 'hidden');
				else if (t < windowStart) setTimeState(mk, 'ghost');
				else setTimeState(mk, 'active');
				setFresh(mk, false);
			}
		}
	}

	// Zurück in den „Live"-Zustand: alles sichtbar, jüngste pulsieren.
	function resetToLive() {
		stop();
		cursor = 1;
		popped.clear();
		applyLivePulse();
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

	<!-- tone filters -->
	<div class="filters">
		<button class="chip" class:active={filterTone === null} onclick={() => (filterTone = null)}>Alle</button>
		{#each Object.entries(toneColors) as [key, color]}
			<button class="chip" class:active={filterTone === key} style="--c:{color}" onclick={() => (filterTone = filterTone === key ? null : key)}>
				<span class="chip-dot" style="background:{color}"></span>{toneLabels[key] ?? key}
			</button>
		{/each}
	</div>

	<div class="grid">
		<!-- MAP + TIMELINE -->
		<div class="map-col">
			<div class="map-frame" bind:this={mapContainer}>
				{#if !mapReady}
					<div class="loading"><div class="spinner"></div><span>Karte wird geladen…</span></div>
				{/if}
			</div>

			<!-- Zeitleiste / Zeitraffer -->
			<div class="timeline" class:playing>
				<button class="play" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Zeitreise abspielen'}>
					{#if playing}
						<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>
					{:else}
						<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4 2.5v11a1 1 0 0 0 1.5.87l9-5.5a1 1 0 0 0 0-1.74l-9-5.5A1 1 0 0 0 4 2.5Z"/></svg>
					{/if}
				</button>

				<div class="track-wrap">
					<div class="track">
						<div class="track-fill" style="width:{cursor * 100}%"></div>
						<div class="track-head" style="left:{cursor * 100}%"></div>
					</div>
					<input
						class="scrub"
						type="range"
						min="0"
						max="1"
						step="0.001"
						value={cursor}
						oninput={(e) => scrubTo(+e.currentTarget.value)}
						aria-label="Zeitpunkt wählen"
					/>
				</div>

				<div class="tl-meta">
					<span class="tl-date">{cursorDate || 'heute'}</span>
					{#if playing || cursor < 1}
						<button class="tl-live" onclick={resetToLive}>Zurück ins Jetzt →</button>
					{:else}
						<span class="tl-hint">Play = Hoffnung im Zeitraffer</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- FEED -->
		<div class="feed">
			<div class="feed-head">
				<div class="feed-toggle">
					<button class:on={feedSort === 'time'} onclick={() => (feedSort = 'time')}>Nach Zeit</button>
					<button class:on={feedSort === 'impact'} onclick={() => (feedSort = 'impact')}>Nach Wirkung</button>
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
						onclick={() => (activeSlug = s.slug)}
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

	.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.25rem 0; }
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

	/* --- Zeitleiste --- */
	.timeline { display: flex; align-items: center; gap: 0.9rem; padding: 0.6rem 0.85rem; border-radius: 999px; border: 1px solid var(--color-rule); background: var(--color-paper); }
	.timeline.playing { border-color: color-mix(in srgb, var(--color-amber) 45%, var(--color-rule)); }
	.play { flex-shrink: 0; width: 2.3rem; height: 2.3rem; border-radius: 999px; border: none; display: grid; place-items: center; cursor: pointer; background: var(--color-surface-ink); color: var(--color-on-ink); transition: transform 0.15s; }
	.play:hover { transform: scale(1.06); }

	.track-wrap { position: relative; flex: 1; height: 1.6rem; display: flex; align-items: center; }
	.track { position: absolute; left: 0; right: 0; height: 4px; border-radius: 999px; background: var(--color-rule); overflow: visible; }
	.track-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, color-mix(in srgb, var(--color-amber) 55%, transparent), var(--color-amber)); }
	.track-head { position: absolute; top: 50%; width: 12px; height: 12px; border-radius: 999px; background: var(--color-amber); transform: translate(-50%, -50%); box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-amber) 22%, transparent); pointer-events: none; }
	.scrub { position: absolute; left: 0; right: 0; width: 100%; margin: 0; opacity: 0; height: 1.6rem; cursor: pointer; }

	.tl-meta { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem; min-width: 8.5rem; }
	.tl-date { font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-ink); font-weight: 600; white-space: nowrap; }
	.tl-hint { font-size: 0.66rem; color: var(--color-faint); white-space: nowrap; }
	.tl-live { font-size: 0.68rem; color: var(--color-amber); background: none; border: none; cursor: pointer; padding: 0; white-space: nowrap; }
	.tl-live:hover { text-decoration: underline; }
	@media (max-width: 560px) {
		.timeline { flex-wrap: wrap; border-radius: 16px; }
		.tl-meta { min-width: 0; align-items: flex-start; width: 100%; flex-direction: row; justify-content: space-between; }
	}

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
