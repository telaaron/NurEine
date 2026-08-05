<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors, toneLabels } from '$lib/tone-constants';
	import { storyImageSrc } from '$lib/story-images';
	import { formatDate } from '$lib/utils';
	import Icon from '$lib/components/Icon.svelte';
	import {
		ChevronRightIcon,
		MagnifyingGlassIcon,
		MapPinIcon,
		XMarkIcon,
		ShareIcon,
		CheckIcon
	} from 'heroicons-svelte/24/outline';
	import MapLoadingOverlay from '$lib/components/MapLoadingOverlay.svelte';
	import StoryHeroTile from '$lib/components/StoryHeroTile.svelte';
	import PaperMasthead from '$lib/components/PaperMasthead.svelte';
	import PaperStory from '$lib/components/PaperStory.svelte';
	import { createGlowMarker, highlightGlow } from '$lib/map/glow-marker';
	import { createUserMarker, createDistanceRings, DISTANCE_RINGS } from '$lib/map/user-marker';
	import { addBaseTiles, addLabelTiles } from '$lib/map/basemap';
	import {
		haversineDistance,
		isDefaultCoord,
		formatDistance,
		bandForDistance,
		DISTANCE_BANDS,
		reverseGeocode,
		searchPlaces,
		placeLabel,
		type GeoPlace,
		type GeoSource,
		type PlaceSuggestion
	} from '$lib/geo';
	import { newspaperName, hasRealPlace } from '$lib/place';

	// ---- Types ----

	/** Genau die Felder, die getMapMarkers liefert (MapMarker in queries.ts). */
	interface StoryMarker {
		slug: string; title: string; dek: string;
		category: string; country: string;
		coordsX: number; coordsY: number;
		publishedAt: string; readingMinutes: number;
		impactScore: number; impactNote: string;
		tone: 'amber' | 'sage' | 'rose' | 'sky'; hero: string;
		sensitive: boolean; createdAt: string;
	}

	interface NearbyStory extends StoryMarker {
		distance: number;
	}

	// ---- Props ----

	let { data } = $props();
	const allStories = $derived((data.stories ?? []) as StoryMarker[]);

	// ---- Standort-State ----

	const STORAGE_KEY = 'nureine_geolocation';

	type GeoStatus = 'loading' | 'ready' | 'error';

	let geoStatus = $state<GeoStatus>('loading');
	let geoSource = $state<GeoSource>('gps');
	let place = $state<GeoPlace>({ lat: 0, lng: 0, city: '', region: '', countryCode: '' });
	let geoErrorMessage = $state('');
	/** Merkt sich den per GPS/IP erkannten Ort, damit „zurück zu mir" möglich bleibt. */
	let detectedPlace = $state<GeoPlace | null>(null);

	const locationLabel = $derived(placeLabel(place) || 'unbekannter Ort');
	const isManualPlace = $derived(geoSource === 'manual');

	function applyPlace(next: GeoPlace, source: GeoSource): void {
		place = { ...next };
		geoSource = source;
		geoStatus = 'ready';
		if (source !== 'manual') {
			detectedPlace = { ...next };
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, source }));
			} catch { /* Storage kann blockiert sein — kein Grund zu scheitern */ }
		}
	}

	function loadCachedGeo(): { place: GeoPlace; source: GeoSource } | null {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			const c = JSON.parse(raw);
			if (!c?.lat || !c?.lng) return null;
			return {
				place: {
					lat: c.lat, lng: c.lng,
					city: c.city ?? '', region: c.region ?? '', countryCode: c.countryCode ?? ''
				},
				source: c.source === 'ip' ? 'ip' : 'gps'
			};
		} catch { return null; }
	}

	function fallbackToIP(): void {
		fetch('https://ip-api.com/json/?fields=lat,lon,countryCode,regionName,city')
			.then((res) => { if (!res.ok) throw new Error('IP-API antwortete nicht'); return res.json(); })
			.then((ip) => {
				if (!ip.lat || !ip.lon) throw new Error('Ungültige IP-Geo-Daten');
				applyPlace(
					{ lat: ip.lat, lng: ip.lon, city: ip.city || '', region: ip.regionName || '', countryCode: ip.countryCode || '' },
					'ip'
				);
			})
			.catch((err) => {
				geoStatus = 'error';
				geoErrorMessage = err?.message || 'Standort konnte nicht bestimmt werden';
			});
	}

	function detectLocation(): void {
		geoStatus = 'loading';
		const cached = loadCachedGeo();
		if (cached) { applyPlace(cached.place, cached.source); return; }
		if (!browser || !navigator.geolocation) { fallbackToIP(); return; }

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude: lat, longitude: lng } = position.coords;
				const resolved = await reverseGeocode(lat, lng);
				applyPlace(
					{ lat, lng, city: resolved.city ?? '', region: resolved.region ?? '', countryCode: resolved.countryCode ?? '' },
					'gps'
				);
			},
			() => fallbackToIP(),
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
		);
	}

	/**
	 * Geteilter Link: /bei-dir?ort=Teltow&lat=…&lng=…
	 * Hat Vorrang vor der eigenen Ortung — wer den Link öffnet, soll DIE Ausgabe
	 * sehen, die geteilt wurde, nicht seine eigene. Ohne Koordinaten im Link
	 * wird der Name über Nominatim aufgelöst.
	 */
	async function applySharedPlace(): Promise<boolean> {
		if (!browser) return false;
		const q = new URLSearchParams(window.location.search);
		const ort = q.get('ort')?.trim();
		if (!ort) return false;

		const lat = Number(q.get('lat')), lng = Number(q.get('lng'));
		if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
			const resolved = await reverseGeocode(lat, lng);
			applyPlace(
				{ lat, lng, city: resolved.city || ort, region: resolved.region ?? '', countryCode: resolved.countryCode ?? '' },
				'manual'
			);
			return true;
		}
		const hits = await searchPlaces(ort);
		if (hits.length === 0) return false;
		const p = hits[0];
		applyPlace({ lat: p.lat, lng: p.lng, city: p.city || ort, region: p.region, countryCode: p.countryCode }, 'manual');
		return true;
	}

	let geoStarted = false;
	$effect(() => {
		if (!browser || geoStarted) return;
		geoStarted = true;
		applySharedPlace().then((shared) => { if (!shared) detectLocation(); });
	});

	// ---- Ausgabe teilen ----

	let shareCopied = $state(false);
	let shareTimer: ReturnType<typeof setTimeout>;

	function shareEdition(): void {
		const ort = place.city || place.region;
		if (!ort) return;
		// Koordinaten mitgeben: der Empfänger sieht exakt dieselbe Ausgabe, ohne
		// dass Nominatim den Namen anders auflöst als bei uns.
		const url = `https://nureine.de/bei-dir?ort=${encodeURIComponent(ort)}&lat=${place.lat.toFixed(4)}&lng=${place.lng.toFixed(4)}`;
		const title = newspaperName(ort);
		if (typeof navigator !== 'undefined' && navigator.share) {
			navigator.share({ title, text: `Gute Nachrichten aus ${ort}`, url }).catch(() => {});
			return;
		}
		navigator.clipboard?.writeText(url).then(() => {
			shareCopied = true;
			clearTimeout(shareTimer);
			shareTimer = setTimeout(() => (shareCopied = false), 2000);
		}).catch(() => {});
	}

	// ---- Ortssuche ----

	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<PlaceSuggestion[]>([]);
	let searchBusy = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let searchAbort: AbortController | null = null;
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	function onSearchInput(): void {
		if (searchTimer) clearTimeout(searchTimer);
		searchAbort?.abort();
		const q = searchQuery;
		if (q.trim().length < 3) { searchResults = []; searchBusy = false; return; }
		searchBusy = true;
		// Nominatim bittet um Zurückhaltung — erst tippen lassen, dann fragen.
		searchTimer = setTimeout(async () => {
			searchAbort = new AbortController();
			searchResults = await searchPlaces(q, searchAbort.signal);
			searchBusy = false;
		}, 350);
	}

	function pickPlace(p: PlaceSuggestion): void {
		applyPlace({ lat: p.lat, lng: p.lng, city: p.city, region: p.region, countryCode: p.countryCode }, 'manual');
		searchOpen = false;
		searchQuery = '';
		searchResults = [];
		activeSlug = null;
	}

	function backToMe(): void {
		if (!detectedPlace) { detectLocation(); return; }
		applyPlace(detectedPlace, 'gps');
		activeSlug = null;
	}

	$effect(() => {
		if (searchOpen && searchInput) searchInput.focus();
	});

	// ---- Story-Listen ----

	/** Alle Stories mit echter Koordinate, nach Entfernung sortiert. */
	const ranked = $derived.by<NearbyStory[]>(() => {
		if (geoStatus !== 'ready' || !place.lat || !place.lng) return [];
		const out: NearbyStory[] = [];
		for (const s of allStories) {
			if (!s.coordsX || !s.coordsY || isDefaultCoord(s.coordsX, s.coordsY)) continue;
			out.push({ ...s, distance: haversineDistance(place.lat, place.lng, s.coordsX, s.coordsY) });
		}
		return out.sort((a, b) => a.distance - b.distance);
	});

	let filterTone = $state<string | null>(null);

	const visibleStories = $derived(
		filterTone ? ranked.filter((s) => s.tone === filterTone) : ranked
	);

	/**
	 * Nur so viele Marker auf die Karte wie sinnvoll erfassbar — die nächsten 120.
	 * Alles darüber wäre bei einem Radar um DICH herum ohnehin Rauschen und
	 * kostet nur Renderzeit.
	 */
	const MAP_LIMIT = 120;
	const mapStories = $derived(visibleStories.slice(0, MAP_LIMIT));

	/**
	 * Wie viele Karten das Raster zeigt. Ohne Deckel wären es bei einem gut
	 * gefüllten Archiv 800+ Karten mit je einem Bild — der Browser käme ins
	 * Stocken, und niemand scrollt so weit. Nachladen per Klick.
	 */
	const CARD_STEP = 60;
	let cardLimit = $state(CARD_STEP);

	// Bei Ortswechsel oder Filterwechsel wieder von vorn: sonst stünde man nach
	// einem Filterklick mitten in einer Liste, die es so nicht mehr gibt.
	$effect(() => {
		void place.lat; void place.lng; void filterTone;
		cardLimit = CARD_STEP;
	});

	/**
	 * Der Aufmacher: die nächstgelegene Meldung, die einen ECHTEN Ort hat —
	 * eine Titelseite lebt davon, dass oben ein Ort steht, den man kennt.
	 * Hat keine einen Ort, nimmt sie die nächstgelegene überhaupt.
	 */
	const leadStory = $derived(
		visibleStories.find((s) => hasRealPlace(s)) ?? visibleStories[0] ?? null
	);

	// Der Aufmacher steht oben groß — in den Spalten darunter wäre er doppelt.
	const shownStories = $derived(
		visibleStories.filter((s) => s.slug !== leadStory?.slug).slice(0, cardLimit)
	);
	const moreCount = $derived(Math.max(0, visibleStories.length - cardLimit));

	/** Liste in Distanz-Bänder gruppiert — leere Bänder fallen raus. */
	const bandedStories = $derived.by(() => {
		return DISTANCE_BANDS.map((band) => ({
			band,
			stories: shownStories.filter((s) => bandForDistance(s.distance).key === band.key),
			// Gesamtzahl im Band, nicht nur das schon Geladene — die Überschrift
			// soll sagen, was es gibt, nicht was gerade im DOM steht.
			total: visibleStories.filter((s) => bandForDistance(s.distance).key === band.key).length
		})).filter((g) => g.stories.length > 0);
	});

	const closest = $derived(ranked[0] ?? null);

	/** Wie viele Geschichten je Ring — füttert die Radar-Statistik im Kopf. */
	const ringCounts = $derived(
		DISTANCE_RINGS.map((km) => ({ km, count: ranked.filter((s) => s.distance <= km).length }))
	);

	// ---- Karte ----

	// Karte ist zugeklappt, bis sie gebraucht wird — die Zeitung ist der
	// Hauptinhalt. Leaflet darf NICHT in einem versteckten (0×0) Container
	// starten, sonst rechnet fitBounds gegen ein leeres Viewport.
	let mapOpen = $state(false);
	let mapContainer = $state<HTMLDivElement | null>(null);
	let map: any = null;
	let leaflet: any = null;
	let userMarker: any = null;
	let ringLayers: any[] = [];
	let labelLayer: any = null;
	let markerBySlug = new Map<string, any>();
	// Merkt sich, auf welchen Ort die Karte zuletzt zentriert wurde — damit der
	// Layer-Effect die Ansicht nur beim echten Ortswechsel anfasst.
	let viewCentered = false;
	let viewLat = 0;
	let viewLng = 0;
	let mapReady = $state(false);
	let activeSlug = $state<string | null>(null);

	const activeStory = $derived(
		activeSlug ? visibleStories.find((s) => s.slug === activeSlug) ?? null : null
	);

	function clearMapLayers(): void {
		for (const mk of markerBySlug.values()) mk.remove?.();
		markerBySlug.clear();
		for (const r of ringLayers) r.remove?.();
		ringLayers = [];
		userMarker?.remove?.();
		userMarker = null;
		labelLayer?.remove?.();
		labelLayer = null;
	}

	/**
	 * Karte anlegen, sobald Standort, Container UND aufgeklappter Zustand da
	 * sind. Erst beim Aufklappen zu starten spart obendrein die Tile-Requests
	 * für alle, die die Karte nie öffnen.
	 */
	let mapInitStarted = false;
	$effect(() => {
		const el = mapContainer;
		const ready = geoStatus === 'ready' && !!place.lat && !!place.lng && mapOpen;
		if (!browser || !el || !ready || mapInitStarted) return;
		mapInitStarted = true;

		import('leaflet').then((L) => {
			if (!mapContainer) return;
			(window as any).L = L;
			leaflet = L;

			// Gleich mit der richtigen Ansicht starten. Eine zweite
			// Ansichtsänderung kurz nach dem Anlegen unterbricht Leaflets
			// Kachel-Einblendung — die Kacheln blieben dann auf opacity:0 stehen
			// und die Karte wäre leer.
			const m = L.map(el, {
				center: [place.lat, place.lng],
				zoom: 9, // Stadt + Umland: Orte sind benannt und einordbar
				zoomControl: true,
				scrollWheelZoom: false, // Seite soll beim Scrollen nicht in der Karte hängen bleiben
				attributionControl: false
			});

			// Basis ohne Ortsnamen — die Labels kommen weiter unten ÜBER die Marker.
			addBaseTiles(m);

			map = m;
			// Vor mapReady: der Layer-Effect passt direkt danach die Bounds an und
			// bräuchte dafür die echte Containergröße. Käme invalidateSize erst im
			// nächsten Frame, würde er gegen ein 0×0-Viewport rechnen und auf
			// Weltzoom herausfallen.
			m.invalidateSize();
			mapReady = true;
		});

		return () => {
			clearMapLayers();
			map?.remove(); map = null; leaflet = null;
			mapInitStarted = false; mapReady = false;
		};
	});

	/** Standort + Ringe + Marker neu zeichnen, wenn Ort oder Auswahl sich ändert. */
	$effect(() => {
		// Auf mapReady triggern, nicht auf `map`: `map` ist kein $state (Leaflet-
		// Instanzen gehören nicht in den Proxy), eine Zuweisung im .then() würde
		// diesen Effect also nie aufwecken.
		if (!mapReady || !map || !leaflet || geoStatus !== 'ready') return;
		const lat = place.lat, lng = place.lng;
		const stories = mapStories;

		clearMapLayers();
		userMarker = createUserMarker(lat, lng, map, locationLabel);
		ringLayers = createDistanceRings(lat, lng, map);
		for (const s of stories) {
			const mk = createGlowMarker(s, map, (slug) => (activeSlug = slug));
			if (mk) markerBySlug.set(s.slug, mk);
		}
		// Ortsnamen ZULETZT — so liegen sie über den Markern und bleiben lesbar,
		// gerade an den großen Städten, wo die meisten Punkte kleben.
		labelLayer = addLabelTiles(map);

		// Die Startansicht steht schon beim Anlegen der Karte (Standort + z9) —
		// hier NUR nachziehen, wenn der Nutzer wirklich den Ort gewechselt hat.
		// Ein zusätzliches setView beim ersten Lauf würde Leaflets
		// Kachel-Einblendung unterbrechen und die Karte leer stehen lassen.
		if (viewCentered && (viewLat !== lat || viewLng !== lng)) {
			map.invalidateSize();
			map.setView([lat, lng], Math.min(10, Math.max(8, map.getZoom())));
		}
		viewCentered = true;
		viewLat = lat;
		viewLng = lng;
	});

	/** Aktiven Marker hervorheben und anfliegen. */
	$effect(() => {
		const slug = activeSlug;
		if (!mapReady || !map || !slug) return;
		const mk = markerBySlug.get(slug);
		if (!mk) return;
		highlightGlow(mk, true);
		for (const [other, om] of markerBySlug) if (other !== slug) highlightGlow(om, false);
		map.flyTo(mk.getLatLng(), Math.max(map.getZoom(), 7), { duration: 0.7 });
		queueMicrotask(() =>
			document.getElementById('row-' + slug)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
		);
		return () => {
			for (const om of markerBySlug.values()) highlightGlow(om, false);
		};
	});

	function selectStory(slug: string): void {
		activeSlug = activeSlug === slug ? null : slug;
	}
</script>

<svelte:head>
	<meta name="robots" content="index, follow" />
</svelte:head>

<!-- ===== KOPF ===== -->
<section class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-14 pb-5">
	{#if geoStatus === 'loading'}
		<div class="flex flex-col gap-3 rise">
			<p class="eyebrow" style="color: var(--color-amber);">Standort wird ermittelt</p>
			<h1 class="display leading-tight text-[1.6rem] sm:text-[2rem] lg:text-[3rem]" style="color: var(--color-ink); font-weight: 600;">
				Gute Nachrichten in deiner N&auml;he.
			</h1>
			<div class="mt-2 flex items-center gap-3">
				<div class="h-4 w-4 rounded-full border-2 animate-spin" style="border-color: var(--color-rule); border-top-color: var(--color-amber);"></div>
				<p class="text-base animate-pulse" style="color: var(--color-muted); font-family: var(--font-serif);">
					Ermittle deinen Standort&thinsp;&hellip;
				</p>
			</div>
		</div>
	{:else if geoStatus === 'error'}
		<p class="eyebrow rise" style="color: var(--color-amber);">Bei dir</p>
		<h1 class="display mt-3 leading-tight text-[1.6rem] sm:text-[2rem] lg:text-[3rem] rise rise-d1" style="color: var(--color-ink); font-weight: 600;">
			Ort konnte nicht ermittelt werden.
		</h1>
		<div class="mt-5 max-w-[55ch] text-base leading-relaxed rise rise-d2" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			<p>Weder &uuml;ber den Browser noch &uuml;ber deine IP-Adresse. {geoErrorMessage}</p>
			<p class="mt-4">Du kannst deinen Ort aber auch selbst w&auml;hlen &mdash; oder es noch einmal versuchen.</p>
			<div class="mt-6 flex flex-wrap gap-3">
				<button type="button" onclick={() => { searchOpen = true; geoStatus = 'error'; }}
					class="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-85 active:scale-[0.97]"
					style="background: var(--color-amber); color: var(--color-on-accent);">
					Ort selbst w&auml;hlen
				</button>
				<button type="button" onclick={detectLocation}
					class="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-85 active:scale-[0.97]"
					style="border: 1px solid var(--color-rule); color: var(--color-ink);">
					Erneut versuchen
				</button>
			</div>
		</div>
	{:else}
		<div class="rise">
			<PaperMasthead
				place={place.city || place.region || 'dich'}
				count={ranked.length}
				nearestKm={closest?.distance ?? null}
			/>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-3 pt-3">
			<p class="text-xs" style="color: var(--color-muted); font-family: var(--font-sans);">
				{isManualPlace ? 'Ausgewählter Ort' : 'Zusammengestellt für deinen Standort'}
			</p>

			<!-- Ortswechsel + Teilen -->
			<div class="flex items-center gap-2 rise rise-d2">
				<button type="button" onclick={shareEdition}
					class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
					style="border: 1px solid var(--color-rule); color: var(--color-ink-soft);">
					<Icon icon={shareCopied ? CheckIcon : ShareIcon} size="0.85rem" />
					{shareCopied ? 'Link kopiert' : 'Ausgabe teilen'}
				</button>
				{#if isManualPlace}
					<button type="button" onclick={backToMe}
						class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
						style="border: 1px solid var(--color-rule); color: var(--color-ink-soft);">
						<Icon icon={MapPinIcon} size="0.85rem" />
						Zur&uuml;ck zu mir
					</button>
				{/if}
				<button type="button" onclick={() => (searchOpen = !searchOpen)}
					class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
					style="border: 1px solid var(--color-rule); color: var(--color-ink-soft);">
					<Icon icon={MagnifyingGlassIcon} size="0.85rem" />
					Anderen Ort ansehen
				</button>
			</div>
		</div>

		<!-- Radar-Zahlen: wie viele Geschichten in welchem Ring -->
		{#if ranked.length > 0}
			<div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rise rise-d3">
				{#each ringCounts as r}
					<div class="flex items-baseline gap-1.5">
						<span class="tnum text-lg font-semibold" style="color: var(--color-ink);">{r.count}</span>
						<span class="text-xs" style="color: var(--color-muted);">im Umkreis von {r.km >= 1000 ? '1.000' : r.km}&thinsp;km</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Suchfeld -->
	{#if searchOpen}
		<div class="mt-5 max-w-[520px] rounded-[10px] p-3 animate-rise-up" style="border: 1px solid var(--color-rule); background: var(--color-paper);">
			<div class="flex items-center gap-2">
				<Icon icon={MagnifyingGlassIcon} size="1rem" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:this={searchInput}
					bind:value={searchQuery}
					oninput={onSearchInput}
					type="search"
					placeholder="Stadt, Region oder Land&thinsp;&hellip;"
					class="flex-1 bg-transparent text-sm outline-none"
					style="color: var(--color-ink);"
				/>
				<button type="button" onclick={() => { searchOpen = false; searchQuery = ''; searchResults = []; }}
					class="p-1 rounded-full" style="color: var(--color-muted);" aria-label="Suche schlie&szlig;en">
					<Icon icon={XMarkIcon} size="0.9rem" />
				</button>
			</div>
			{#if searchBusy}
				<p class="mt-2 px-6 text-xs" style="color: var(--color-muted);">Suche&thinsp;&hellip;</p>
			{:else if searchResults.length > 0}
				<ul class="mt-2 flex flex-col">
					{#each searchResults as r}
						<li>
							<button type="button" onclick={() => pickPlace(r)}
								class="w-full text-left px-2 py-2 rounded-[6px] text-sm transition-colors hover:opacity-80"
								style="color: var(--color-ink);">
								<span class="font-medium">{r.city || r.displayName.split(',')[0]}</span>
								<span class="block text-xs truncate" style="color: var(--color-muted);">{r.displayName}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else if searchQuery.trim().length >= 3}
				<p class="mt-2 px-6 text-xs" style="color: var(--color-muted);">Kein Ort gefunden.</p>
			{/if}
		</div>
	{/if}
</section>

<!-- ===== RADAR: Karte + synchronisierte Liste ===== -->
{#if geoStatus === 'ready'}
	<section class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10 pb-8">
		<!-- Ton-Filter -->
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<button class="chip" class:active={filterTone === null} onclick={() => (filterTone = null)}>Alle</button>
			{#each Object.entries(toneColors) as [key, color]}
				<button class="chip" class:active={filterTone === key}
					onclick={() => { filterTone = filterTone === key ? null : key; activeSlug = null; }}>
					<span class="chip-dot" style="background:{color}"></span>{toneLabels[key] ?? key}
				</button>
			{/each}

			<!-- Die Zeitung ist der Hauptinhalt; die Karte ist das Nachschlagewerk
			     dazu. Darum zugeklappt, bis jemand sie wirklich sehen will. -->
			<button class="chip ml-auto" class:active={mapOpen}
				onclick={() => (mapOpen = !mapOpen)} aria-expanded={mapOpen}>
				<Icon icon={MapPinIcon} size="0.8rem" />
				{mapOpen ? 'Karte ausblenden' : 'Auf der Karte zeigen'}
			</button>
		</div>

		<div class="radar-grid" class:hidden={!mapOpen}>
			<!-- Karte -->
			<div class="map-frame" bind:this={mapContainer}>
				{#if !mapReady}
					<MapLoadingOverlay />
				{/if}
				{#if mapReady}
					<div class="ring-legend">
						{#each DISTANCE_RINGS as km}
							<span>{km >= 1000 ? '1.000' : km}&thinsp;km</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Liste, nach Entfernung -->
			<div class="feed">
				<div class="feed-scroll">
					{#if visibleStories.length === 0}
						<p class="p-4 text-sm" style="color: var(--color-muted);">
							Mit diesem Filter liegt nichts in deiner N&auml;he.
						</p>
					{/if}
					{#each visibleStories as s (s.slug)}
						{@const hex = toneColors[s.tone] ?? '#c87340'}
						<button
							id={'row-' + s.slug}
							class="feed-item"
							class:active={activeSlug === s.slug}
							style="--accent:{hex}"
							onclick={() => selectStory(s.slug)}
						>
							<span class="fi-tick" style="background:{hex}"></span>
							<span class="fi-body">
								<span class="fi-top">
									<span class="fi-dist tnum">{formatDistance(s.distance)}</span>
									<span class="fi-impact tnum">{s.impactScore}</span>
								</span>
								<span class="fi-title">{s.title}</span>
								<span class="fi-country">{s.country}</span>
							</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Aktive Geschichte als reiche Karte -->
		{#if activeStory}
			{@const hex = toneColors[activeStory.tone] ?? '#c87340'}
			<!-- Medienfläche steht IMMER: ohne Foto übernimmt die Rubrik-Fläche,
			     damit die Karte ihr zweispaltiges Format behält statt je nach
			     Bebilderung zu springen. -->
			<a class="detail with-img" style="--accent:{hex}"
				href={base + '/geschichte/' + activeStory.slug}>
				<div class="det-media"><StoryHeroTile story={activeStory} width={600} /></div>
				<div class="det-content">
					<div class="det-top">
						<span class="det-badge">{activeStory.category}</span>
						<span>{activeStory.country}</span>
						<span class="det-dist tnum">{formatDistance(activeStory.distance)} entfernt</span>
					</div>
					<h3 class="det-title display">{activeStory.title}</h3>
					<p class="det-dek">{activeStory.dek}</p>
					<div class="det-foot">
						<span class="det-impact tnum">Wirkung {activeStory.impactScore}/100 &middot; {activeStory.impactNote}</span>
						<span class="det-go">
							Geschichte lesen
							<Icon icon={ChevronRightIcon} size="0.85rem" />
						</span>
					</div>
				</div>
			</a>
		{/if}
	</section>

	<!-- ===== NACH ENTFERNUNG GEB&Uuml;NDELT ===== -->
	<section class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10 pb-14 sm:pb-20">
		{#if ranked.length === 0}
			<div class="paper rounded-[8px] p-6 sm:p-10 lg:p-14 text-center" style="border: 1px solid var(--color-rule);">
				<div class="flex justify-center mb-4"><Icon icon={MagnifyingGlassIcon} size="2.5rem" /></div>
				<h2 class="serif text-xl sm:text-2xl lg:text-3xl leading-tight" style="color: var(--color-ink); font-weight: 500;">
					Noch keine verorteten Geschichten
				</h2>
				<p class="mt-4 max-w-[50ch] mx-auto text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
					Wir bauen unser Netz weiter aus. Bis dahin: das ganze Archiv steht dir offen.
				</p>
				<div class="mt-8">
					<a href={base + '/archiv'} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:gap-3"
						style="background: var(--color-surface-ink); color: var(--color-on-ink);">
						Alle Geschichten entdecken
						<Icon icon={ChevronRightIcon} size="0.875rem" />
					</a>
				</div>
			</div>
		{:else}
			<!-- AUFMACHER: die nächste Meldung mit echtem Ort. Fällt auf die
			     nächstgelegene zurück, wenn keine einen Ort hat. -->
			{#if leadStory}
				<div class="lead-slot">
					<div class="ressort">
						<span class="ressort-label">Aufmacher</span>
						<span class="ressort-rule"></span>
					</div>
					<PaperStory story={leadStory} variant="lead" />
				</div>
			{/if}

			{#each bandedStories as group (group.band.key)}
				{#if group.stories.length > 0}
					<section class="band">
						<div class="ressort">
							<span class="ressort-label">{group.band.label}</span>
							<span class="ressort-blurb">{group.band.blurb}</span>
							<span class="ressort-rule"></span>
							<span class="tnum ressort-count">{group.total}</span>
						</div>

						<div class="columns">
							{#each group.stories as story (story.slug)}
								<PaperStory {story} />
							{/each}
						</div>
					</section>
				{/if}
			{/each}

			{#if moreCount > 0}
				<div class="flex justify-center">
					<button type="button" onclick={() => (cardLimit += CARD_STEP)}
						class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:gap-3"
						style="border: 1px solid var(--color-rule); color: var(--color-ink);">
						Weitere {Math.min(moreCount, CARD_STEP)} Geschichten
						<span class="tnum" style="color: var(--color-muted);">(noch {moreCount})</span>
					</button>
				</div>
			{/if}
		{/if}
	</section>
{/if}

<style>
	/* ---- Ton-Filter ---- */
	.chip {
		display: inline-flex; align-items: center; gap: 0.4rem;
		padding: 0.4rem 0.85rem; border-radius: 999px; font-size: 0.8rem;
		border: 1px solid var(--color-rule); background: transparent;
		color: var(--color-ink-soft); cursor: pointer; transition: all 0.15s;
	}
	.chip:hover { border-color: var(--color-rule-strong); }
	.chip.active { background: var(--color-surface-ink); color: var(--color-on-ink); border-color: transparent; }
	.chip-dot { width: 0.6rem; height: 0.6rem; border-radius: 999px; }

	/* ---- Radar-Layout ---- */
	.radar-grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
	/* display:none statt visibility: der Leaflet-Container soll gar nicht erst
	   Platz belegen, solange die Karte zu ist. Die Init wartet ohnehin auf
	   mapOpen, es startet also nichts in einem 0×0-Container. */
	.radar-grid.hidden { display: none; }
	@media (min-width: 1024px) { .radar-grid { grid-template-columns: 1fr 340px; } }

	.map-frame {
		position: relative; width: 100%; height: 58vh; min-height: 380px;
		border-radius: 12px; overflow: hidden; border: 1px solid var(--color-rule);
		box-shadow: 0 16px 50px -30px rgba(0, 0, 0, 0.5);
	}

	/* Ring-Beschriftung als Legende statt Labels im Kartenbild — die Ringe
	   selbst sind gestrichelt und brauchen keine Zahl auf jeder Linie. */
	.ring-legend {
		position: absolute; right: 10px; bottom: 10px; z-index: 3;
		display: flex; gap: 0.5rem; padding: 0.3rem 0.6rem;
		border-radius: 999px; font-size: 0.65rem; font-family: var(--font-mono);
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-paper) 82%, transparent);
		border: 1px solid var(--color-rule);
		backdrop-filter: blur(6px);
	}
	.ring-legend span::before {
		content: '◦ '; color: var(--color-amber);
	}

	/* ---- Liste ---- */
	.feed {
		border: 1px solid var(--color-rule); border-radius: 12px;
		overflow: hidden; background: var(--color-paper);
	}
	.feed-scroll {
		height: 58vh; min-height: 380px; overflow-y: auto;
		padding: 0.5rem; scrollbar-width: thin;
	}
	.feed-item {
		display: flex; gap: 0.75rem; width: 100%; text-align: left;
		padding: 0.6rem; border-radius: 9px; border: 1px solid transparent;
		background: transparent; cursor: pointer; align-items: stretch;
		transition: background 0.15s, border-color 0.15s;
	}
	.feed-item:hover { background: var(--color-canvas-soft); }
	.feed-item.active {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
	}
	.fi-tick { width: 3px; border-radius: 999px; flex-shrink: 0; opacity: 0.55; transition: opacity 0.15s; }
	.feed-item:hover .fi-tick, .feed-item.active .fi-tick { opacity: 1; }
	.fi-body { min-width: 0; flex: 1; display: block; }
	.fi-top { display: flex; justify-content: space-between; align-items: center; font-size: 0.68rem; }
	.fi-dist { color: var(--color-ink-soft); font-weight: 600; }
	.fi-impact { color: var(--accent); font-weight: 600; }
	.fi-title {
		display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
		overflow: hidden; font-size: 0.86rem; color: var(--color-ink);
		font-weight: 500; line-height: 1.3; margin-top: 0.15rem;
	}
	.fi-country { display: block; font-size: 0.68rem; color: var(--color-muted); margin-top: 0.2rem; }

	/* ---- Aktive Geschichte ---- */
	.detail {
		margin-top: 1.25rem; display: grid; grid-template-columns: 1fr; gap: 0;
		border-radius: 16px; overflow: hidden; text-decoration: none;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--color-rule));
		background: var(--color-paper);
		box-shadow: 0 18px 50px -28px rgba(0, 0, 0, 0.55);
		animation: cardin 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.detail:hover { transform: translateY(-2px); box-shadow: 0 24px 60px -26px rgba(0, 0, 0, 0.6); }
	@keyframes cardin { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
	@media (min-width: 720px) { .detail.with-img { grid-template-columns: 300px 1fr; } }

	/* StoryHeroTile positioniert sich absolut (inset-0) — die Fläche braucht
	   daher einen eigenen Positionskontext UND eine Mindesthöhe, sonst hätte
	   sie ohne Foto keine Ausdehnung. */
	.det-media { position: relative; overflow: hidden; background: var(--color-canvas-soft); min-height: 200px; }
	.det-content { padding: 1.4rem 1.6rem 1.5rem; display: flex; flex-direction: column; }
	.det-top { display: flex; align-items: center; gap: 0.7rem; font-size: 0.72rem; color: var(--color-muted); flex-wrap: wrap; }
	.det-badge {
		padding: 0.22rem 0.65rem; border-radius: 999px; font-weight: 600;
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent); text-transform: capitalize;
	}
	.det-dist { margin-left: auto; color: var(--color-ink-soft); font-weight: 600; }
	.det-title {
		margin-top: 0.75rem; color: var(--color-ink); font-weight: 600;
		font-size: clamp(1.2rem, 2vw, 1.6rem); line-height: 1.2;
	}
	.det-dek { margin-top: 0.65rem; color: var(--color-ink-soft); font-family: var(--font-serif); font-size: 1rem; line-height: 1.55; }
	.det-foot {
		margin-top: 1.1rem; display: flex; align-items: center; justify-content: space-between;
		gap: 1rem; flex-wrap: wrap; font-size: 0.8rem; color: var(--color-muted);
	}
	.det-go { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--accent); font-weight: 600; font-size: 0.9rem; }
	.detail:hover .det-go { gap: 0.55rem; }

	/* ---- Zeitungssatz ---- */

	/* Aufmacher: über die volle Breite, klar abgesetzt vom Spaltensatz. */
	.lead-slot { padding-bottom: 1.5rem; margin-bottom: 1.75rem; border-bottom: 3px double var(--color-rule-strong); }
	@media (min-width: 900px) {
		/* Der Aufmachertext liest sich in halber Breite besser als über 1240px. */
		.lead-slot :global(.story.lead .dek) { column-count: 2; column-gap: 2rem; -webkit-line-clamp: unset; }
	}

	/* Ressortzeile: Label, dünne Linie bis zum Rand, Zähler — wie ein Zeitungsressort. */
	.ressort { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.9rem; }
	.ressort-label {
		font-family: var(--font-sans); font-size: 0.68rem; font-weight: 700;
		letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-ink);
		white-space: nowrap;
	}
	.ressort-blurb { font-family: var(--font-sans); font-size: 0.66rem; color: var(--color-muted); white-space: nowrap; }
	.ressort-rule { flex: 1; height: 1px; background: var(--color-rule-strong); }
	.ressort-count { font-family: var(--font-sans); font-size: 0.66rem; color: var(--color-muted); }

	.band { margin-bottom: 2.25rem; }

	/* Der eigentliche Spaltensatz. Spaltenlinie zwischen den Spalten — das ist
	   das Merkmal, das eine Seite sofort wie Zeitung aussehen lässt. */
	.columns {
		column-gap: 2rem;
		column-rule: 1px solid var(--color-rule);
		column-count: 1;
	}
	@media (min-width: 640px) { .columns { column-count: 2; } }
	@media (min-width: 1100px) { .columns { column-count: 3; } }
	/* Meldungen dürfen nicht über den Spaltenumbruch zerrissen werden. */
	.columns :global(.story) {
		break-inside: avoid;
		padding-bottom: 1rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-rule);
	}

	/* ---- Karten-Overlays (global, weil Leaflet sie außerhalb der Komponente einhängt) ---- */
	:global(.user-tooltip) {
		background: var(--color-amber) !important;
		color: var(--color-on-accent) !important;
		border: none !important; border-radius: 8px !important;
		padding: 8px 12px !important;
		font-family: var(--font-sans) !important;
		font-size: 12px !important; line-height: 1.4 !important;
		box-shadow: 0 4px 20px rgba(26, 24, 21, 0.25) !important;
	}
	:global(.user-tooltip::before) { border-top-color: var(--color-amber) !important; }

	:global(.user-location-marker) { background: none !important; border: none !important; }
	:global(.user-dot-pulse) {
		width: 24px; height: 24px; border-radius: 50%;
		background: color-mix(in srgb, var(--color-amber) 22%, transparent);
		display: flex; align-items: center; justify-content: center;
		animation: pulse-ring 2s cubic-bezier(0.2, 0.7, 0.2, 1) infinite;
	}
	:global(.user-dot-core) {
		width: 12px; height: 12px; border-radius: 50%;
		background: var(--color-amber); border: 2px solid var(--color-paper);
		box-shadow: 0 1px 4px rgba(26, 24, 21, 0.3);
	}
	@keyframes pulse-ring {
		0% { transform: scale(0.8); opacity: 0.6; }
		50% { transform: scale(1.2); opacity: 1; }
		100% { transform: scale(0.8); opacity: 0.6; }
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.user-dot-pulse) { animation: none; }
		.detail { animation: none; }
	}
</style>
