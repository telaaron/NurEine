<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import '$lib/styles/leaflet-shared.css';
	import { toneColors, toneLabels } from '$lib/tone-constants';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { formatDate, toneStyles } from '$lib/utils';
	import MapLoadingOverlay from '$lib/components/MapLoadingOverlay.svelte';
	import MobileStorySheet from '$lib/components/MobileStorySheet.svelte';

	// ---- Types ----

	interface StoryResult {
		id: string; slug: string; title: string; dek: string; body: string;
		category: string; region: string; country: string;
		coords: [number, number]; coordsX: number; coordsY: number;
		source: string; source_url: string; publishedAt: string;
		readingMinutes: number; impactScore: number; impactNote: string;
		tone: 'amber' | 'sage' | 'rose' | 'sky'; hero: string;
		pinned: number; local: number;
		featuredDate: string | null; createdAt: string; updatedAt: string;
	}

	interface GeoState {
		status: 'loading' | 'success' | 'fallback' | 'error' | 'denied';
		lat: number; lng: number;
		city: string; region: string; countryCode: string;
	}

	interface NearbyStory extends StoryResult {
		distance: number;
	}

	// ---- Props ----

	let { data } = $props();
	const allStories = $derived(data.stories as StoryResult[]);

	// ---- State ----

	const STORAGE_KEY = 'nureine_geolocation';

	const geo = $state<GeoState>({
		status: 'loading', lat: 0, lng: 0, city: '', region: '', countryCode: ''
	});

	let geoErrorMessage = $state('');
	let geoAttempted = $state(false);

	// ---- Haversine ----

	function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
		const R = 6371;
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLng = ((lng2 - lng1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	function isDefaultCoord(lat: number, lng: number): boolean {
		return Math.abs(lat - 50) < 1 && Math.abs(lng - 10) < 1;
	}

	function isEuropean(lat: number, lng: number): boolean {
		return lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40;
	}

	// ---- Geolocation ----

	function loadCachedGeo(): GeoState | null {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			const cached = JSON.parse(raw) as GeoState;
			if (cached.lat && cached.lng) return cached;
			return null;
		} catch { return null; }
	}

	function saveGeo(state: GeoState): void {
		try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* unavailable */ }
	}

	function fallbackToIP(): void {
		fetch('https://ip-api.com/json/?fields=lat,lon,country,countryCode,regionName,city')
			.then((res) => {
				if (!res.ok) throw new Error('IP-API antwortete nicht');
				return res.json();
			})
			.then((ip: { lat: number; lon: number; country: string; countryCode: string; regionName: string; city: string }) => {
				if (!ip.lat || !ip.lon) throw new Error('Ungültige IP-Geo-Daten');
				const state: GeoState = {
					status: 'fallback', lat: ip.lat, lng: ip.lon,
					city: ip.city || '', region: ip.regionName || '', countryCode: ip.countryCode || ''
				};
				saveGeo(state);
				geo.status = state.status; geo.lat = state.lat; geo.lng = state.lng;
				geo.city = state.city; geo.region = state.region; geo.countryCode = state.countryCode;
				geoAttempted = true;
			})
			.catch((err) => {
				geo.status = 'error';
				geoErrorMessage = err.message || 'IP-Geolokalisierung fehlgeschlagen';
				geoAttempted = true;
			});
	}

	function detectLocation(): void {
		const cached = loadCachedGeo();
		if (cached) {
			geo.status = cached.status; geo.lat = cached.lat; geo.lng = cached.lng;
			geo.city = cached.city; geo.region = cached.region; geo.countryCode = cached.countryCode;
			geoAttempted = true;
			return;
		}

		if (!navigator.geolocation) { fallbackToIP(); return; }

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const state: GeoState = {
					status: 'success', lat: position.coords.latitude, lng: position.coords.longitude,
					city: '', region: '', countryCode: ''
				};
				fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${state.lat}&lon=${state.lng}&addressdetails=1&accept-language=de`,
					{ headers: { 'User-Agent': 'NurEine/1.0' } }
				)
					.then((r) => r.json())
					.then((addr) => {
						const a = addr.address || {};
						state.city = a.city || a.town || a.village || a.municipality || '';
						state.region = a.state || a.region || '';
						state.countryCode = (a.country_code || '').toUpperCase();
						saveGeo(state);
						geo.status = state.status; geo.lat = state.lat; geo.lng = state.lng;
						geo.city = state.city; geo.region = state.region; geo.countryCode = state.countryCode;
						geoAttempted = true;
					})
					.catch(() => {
						saveGeo(state);
						geo.status = state.status; geo.lat = state.lat; geo.lng = state.lng;
						geoAttempted = true;
					});
			},
			(err) => {
				if (err.code === err.PERMISSION_DENIED) geo.status = 'denied';
				fallbackToIP();
			},
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
		);
	}

	// ---- Derived story lists ----

	const nearbyStories = $derived.by<NearbyStory[]>(() => {
		if (!geoAttempted || geo.status === 'error') return [];
		const lat = geo.lat, lng = geo.lng;
		if (!lat || !lng) return [];
		const MAX_DISTANCE = 1000;
		const withDistance: NearbyStory[] = [];
		for (const s of allStories) {
			const sLat = s.coordsX, sLng = s.coordsY;
			if (!sLat || !sLng || isDefaultCoord(sLat, sLng)) continue;
			const dist = haversineDistance(lat, lng, sLat, sLng);
			if (dist <= MAX_DISTANCE) withDistance.push({ ...s, distance: Math.round(dist) });
		}
		return withDistance.sort((a, b) => a.distance - b.distance);
	});

	const europeFallback = $derived.by<StoryResult[]>(() => {
		return allStories.filter((s) => {
			const sLat = s.coordsX, sLng = s.coordsY;
			if (!sLat || !sLng || isDefaultCoord(sLat, sLng)) return false;
			return isEuropean(sLat, sLng);
		});
	});

	const displayStories = $derived.by<NearbyStory[]>(() => {
		if (nearbyStories.length > 0) return nearbyStories;
		return europeFallback.map((s) => ({ ...s, distance: -1 }));
	});

	const locationLabel = $derived.by<string>(() => {
		const parts: string[] = [];
		if (geo.city) parts.push(geo.city);
		if (geo.region) parts.push(geo.region);
		return parts.join(', ') || 'unbekannter Ort';
	});

	// ---- Leaflet map ----

	let mapContainer = $state<HTMLDivElement | null>(null);
	let map: any = null;
	let userMarker: any = null;
	let storyMarkers = new Map<string, any>();
	let _mapInitialized = false;
	let mapReady = $state(false);
	let activeSlug = $state<string | null>(null);

	const activeStory = $derived(
		activeSlug ? displayStories.find((s) => s.slug === activeSlug) ?? null : null
	);

	$effect(() => {
		const el = mapContainer;
		const lat = geo.lat, lng = geo.lng;
		if (!browser || !el || !lat || !lng || !geoAttempted || _mapInitialized) return;
		if (geo.status === 'error') return;
		_mapInitialized = true;

		import('leaflet').then((L) => {
			if (!mapContainer) return;

			const leafletMap = L.map(el, {
				center: [lat, lng], zoom: 5,
				zoomControl: true, scrollWheelZoom: true, attributionControl: false
			});

			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &mdash; <a href="https://carto.com/">CARTO</a>'
			}).addTo(leafletMap);

			// User marker
			const userIcon = L.divIcon({
				className: 'user-location-marker',
				html: `<div class="user-dot-pulse"><div class="user-dot-core"></div></div>`,
				iconSize: [24, 24], iconAnchor: [12, 12]
			});
			userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(leafletMap);
			userMarker.bindTooltip(
				`<span style="font-weight:600;">Dein Standort</span><br><span style="opacity:0.7;font-size:11px;">${locationLabel}</span>`,
				{ direction: 'top', offset: [0, -16], className: 'user-tooltip' }
			);

			// Story markers using shared helper
			(window as any).L = L;
			const storyLayerGroup: any[] = [];
			for (const s of displayStories) {
				const marker = L.circleMarker([s.coordsX, s.coordsY], {
					radius: Math.max(5, Math.min(14, 6 + (s.impactScore ?? 50) / 20)),
					color: `hsl(30, 80%, ${Math.min(88, Math.max(35, 40 + (s.impactScore ?? 50) / 2))}%)`,
					fillColor: toneColors[s.tone] ?? '#c87340',
					fillOpacity: 0.7, weight: 2, opacity: 0.9
				});
				marker.bindTooltip(
					`<span style="font-weight:600;">${s.title}</span><br><span style="opacity:0.7;font-size:11px;">${s.country} &middot; Wirkung ${s.impactScore ?? 50}/100</span>`,
					{ direction: 'top', offset: [0, -(Math.max(5, Math.min(14, 6 + (s.impactScore ?? 50) / 20))) - 4], className: 'story-tooltip' }
				);
				marker.on('click', () => { activeSlug = s.slug; });
				marker.addTo(leafletMap);
				storyMarkers.set(s.slug, marker);
				storyLayerGroup.push(marker);
			}

			const allMarkers = [userMarker, ...storyLayerGroup].filter(Boolean) as any[];
			if (allMarkers.length > 0) {
				const group = L.featureGroup(allMarkers);
				const bounds = group.getBounds();
				if (bounds.isValid()) leafletMap.fitBounds(bounds.pad(0.3), { maxZoom: 8 });
			}

			requestAnimationFrame(() => { leafletMap.invalidateSize(); });
			map = leafletMap;
			mapReady = true;
		});

		return () => {
			map?.remove(); map = null; userMarker = null;
			storyMarkers.clear(); _mapInitialized = false; mapReady = false;
		};
	});

	// ---- Active story highlight ----

	$effect(() => {
		const slug = activeSlug;
		if (!map || !slug) return;
		const marker = storyMarkers.get(slug);
		if (!marker) return;

		const baseRadius = marker.getRadius() as number;
		marker.setStyle({ radius: baseRadius * 1.6, fillOpacity: 0.95, weight: 3, opacity: 1 });

		for (const [otherSlug, otherMarker] of storyMarkers) {
			if (otherSlug !== slug) otherMarker.setStyle({ fillOpacity: 0.3, opacity: 0.45 });
		}

		map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });

		return () => {
			for (const s of displayStories) {
				const m = storyMarkers.get(s.slug);
				if (!m) continue;
				const imp = s.impactScore ?? 50;
				m.setStyle({
					radius: Math.max(5, Math.min(14, 6 + imp / 20)),
					fillOpacity: 0.7, opacity: 0.9,
					color: `hsl(30, 80%, ${Math.min(88, Math.max(35, 40 + imp / 2))}%)`,
					weight: 2
				});
			}
		};
	});

	function clearActive() { activeSlug = null; }

	// ---- Init geolocation ----

	$effect(() => {
		if (browser && !geoAttempted) detectLocation();
	});
</script>

<!-- ===== HEADER ===== -->
<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-16 pb-4 sm:pb-6 lg:pb-8">
	{#if geo.status === 'loading'}
		<div class="flex flex-col gap-3 rise">
			<p class="eyebrow" style="color: var(--color-amber);">Standort wird ermittelt</p>
			<h1 class="serif leading-tight tracking-tight text-[1.6rem] sm:text-[2rem] lg:text-[3rem]" style="color: var(--color-ink); font-weight: 500;">
				Gute Nachrichten aus deiner Region.
			</h1>
			<div class="mt-2 flex items-center gap-3">
				<div class="h-4 w-4 rounded-full border-2 animate-spin" style="border-color: var(--color-rule); border-top-color: var(--color-amber);"></div>
				<p style="color: var(--color-muted); font-family: var(--font-serif);" class="text-base animate-pulse">Ermittle deinen Standort&thinsp;&hellip;</p>
			</div>
		</div>
	{:else if geo.status === 'error'}
		<p class="eyebrow rise" style="color: var(--color-amber);">Bei dir</p>
		<h1 class="serif mt-3 leading-tight tracking-tight text-[1.6rem] sm:text-[2rem] lg:text-[3rem] rise rise-d1" style="color: var(--color-ink); font-weight: 500;">
			Ort konnte nicht ermittelt werden.
		</h1>
		<div class="mt-5 max-w-[55ch] text-base leading-relaxed rise rise-d2" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			<p>Dein Standort konnte weder &uuml;ber den Browser noch &uuml;ber deine IP-Adresse bestimmt werden.</p>
			<p class="mt-4">Versuche:</p>
			<ul class="mt-2 list-disc list-inside space-y-1">
				<li>Standortzugriff in den Browser-Einstellungen zu erlauben</li>
				<li>Eine stabile Internetverbindung sicherzustellen</li>
				<li>Sp&auml;ter erneut zu laden</li>
			</ul>
			<button type="button"
				onclick={() => { geoAttempted = false; _mapInitialized = false; detectLocation(); }}
				class="mt-6 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-85 active:scale-[0.97]"
				style="background: var(--color-amber); color: var(--color-paper);">
				Erneut versuchen
			</button>
		</div>
	{:else}
		<p class="eyebrow rise" style="color: var(--color-amber);">Bei dir</p>
		<h1 class="serif mt-3 leading-tight tracking-tight text-[1.6rem] sm:text-[2rem] lg:text-[3rem] rise rise-d1" style="color: var(--color-ink); font-weight: 500;">
			Gute Nachrichten
			{#if geo.city || geo.region}
				aus <span style="color: var(--color-amber);">{locationLabel}</span>
			{:else}
				aus deiner Region
			{/if}
		</h1>
		{#if geo.status === 'fallback'}
			<p class="mt-3 text-sm rise rise-d2" style="color: var(--color-muted); font-family: var(--font-serif);">
				Basierend auf deiner IP-Adresse: {geo.city}{geo.city && geo.region ? ', ' : ''}{geo.region}{geo.countryCode ? ` (${geo.countryCode})` : ''}
			</p>
		{/if}
		<p class="mt-3 max-w-[55ch] text-base leading-relaxed rise rise-d2" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
			Gute Nachrichten in deiner N&auml;he &mdash; sortiert nach Entfernung.
		</p>
	{/if}
</section>

<!-- ===== MAP ===== -->
{#if geo.status !== 'loading' && geo.status !== 'error'}
	<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
		<div class="flex flex-col gap-4">
			<div class="paper relative w-full rounded-[8px] overflow-hidden"
				style="border: 1px solid var(--color-rule); height: 340px; min-height: 260px;"
				bind:this={mapContainer}>
				{#if !mapReady}
					<MapLoadingOverlay />
				{/if}
			</div>

			<!-- Legend with user marker -->
			<div class="flex flex-wrap items-center gap-3 sm:gap-4 text-xs" style="color: var(--color-muted);">
				<span class="uppercase tracking-[0.14em]">Legende:</span>
				<span class="flex items-center gap-1.5">
					<span class="inline-block w-2.5 h-2.5 rounded-full" style="background: var(--color-amber);"></span>
					Dein Standort
				</span>
				{#each Object.entries(toneColors) as [tone, hex]}
					<span class="flex items-center gap-1.5">
						<span class="inline-block w-2.5 h-2.5 rounded-full" style="background: {hex};"></span>
						{toneLabels[tone] ?? tone}
					</span>
				{/each}
				<span class="flex items-center gap-1.5">
					<span class="inline-block w-2.5 h-2.5 rounded-full" style="background: hsl(30, 80%, 65%);"></span>
					Wirkung &uparrow;
				</span>
			</div>
		</div>
	</section>
{/if}

<!-- ===== STORIES ===== -->
{#if geo.status !== 'loading' && geo.status !== 'error'}
	<section class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16">
		{#if displayStories.length === 0}
			<div class="paper rounded-[8px] p-6 sm:p-10 lg:p-14 text-center" style="border: 1px solid var(--color-rule);">
				<span class="text-5xl block mb-4">&#x1F50D;</span>
				<h2 class="serif text-xl sm:text-2xl lg:text-3xl leading-tight" style="color: var(--color-ink); font-weight: 500;">
					Noch keine lokalen Nachrichten in deiner N&auml;he
				</h2>
				<p class="mt-4 max-w-[50ch] mx-auto text-base leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
					Wir arbeiten daran, unser Netzwerk auszubauen. Bald gibt es hoffentlich auch in deiner Region gute Nachrichten zu entdecken.
				</p>
				<div class="mt-8">
					<a href={base + '/archiv'} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:gap-3" style="background: var(--color-ink); color: var(--color-paper);">
						Alle Geschichten entdecken
						<svg class="w-3.5 h-3.5 transition-transform duration-200" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M6 3l5 5-5 5" />
						</svg>
					</a>
				</div>
			</div>
		{:else}
			{#if nearbyStories.length === 0}
				<div class="mb-8 paper rounded-[8px] p-4 sm:p-6 lg:p-8 flex items-start gap-4" style="border: 1px solid var(--color-rule);">
					<span class="text-2xl flex-shrink-0 mt-0.5">&#x1F30D;</span>
					<div>
						<h3 class="serif text-lg leading-snug" style="color: var(--color-ink); font-weight: 500;">Europ&auml;ische Nachrichten</h3>
						<p class="mt-1 text-sm leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
							In deiner unmittelbaren N&auml;he haben wir noch keine Geschichten. Hier sind Geschichten aus ganz Europa.
						</p>
					</div>
				</div>
			{/if}

			<div class="mb-6 flex items-center gap-2">
				<span class="eyebrow inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style="background: var(--color-amber-tint); color: var(--color-amber);">
					<span class="tnum font-semibold">{displayStories.length}</span>
					{displayStories.length === 1 ? 'Geschichte' : 'Geschichten'}
				</span>
				{#if nearbyStories.length > 0}
					<span class="text-xs" style="color: var(--color-muted);">im Umkreis von 1.000 km</span>
				{/if}
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
				{#each displayStories as story (story.slug)}
					{@const t = toneStyles[story.tone]}
					{@const heroImageSrc = story.hero && story.hero.startsWith('http') ? story.hero : getStoryHeroImageSrc(story.category, base)}
					<a href={base + '/geschichte/' + story.slug}
						class="group block paper rounded-[6px] overflow-hidden transition-all duration-500"
						style="border: 1px solid var(--color-rule); will-change: transform;"
						onmouseenter={(e) => (e.currentTarget.style.borderColor = t.ring)}
						onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--color-rule)')}>
						<div class="relative aspect-[4/3] overflow-hidden" style="background: var(--color-paper);">
							{#if heroImageSrc}
								<img src={heroImageSrc} alt="" class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]" loading="lazy" decoding="async" />
							{:else}
								<div class="absolute inset-0 flex items-center justify-center text-7xl" style="filter: saturate(0.85);">{story.hero}</div>
							{/if}
							<div class="absolute top-3 left-3 flex gap-2">
								<span class="badge px-2.5 py-1 rounded-full backdrop-blur-sm" style="background: rgba(255, 252, 245, 0.75); color: {t.fg}; border: 1px solid {t.ring};">
									{story.category}
								</span>
							</div>
							{#if story.distance > 0}
								<div class="absolute top-3 right-3">
									<span class="badge px-2.5 py-1 rounded-full backdrop-blur-sm tnum" style="background: rgba(26, 24, 21, 0.7); color: var(--color-paper);">
										{story.distance}&thinsp;km
									</span>
								</div>
							{/if}
						</div>
						<div class="p-4 sm:p-5 lg:p-6">
							<div class="flex items-center gap-2 text-xs" style="color: var(--color-faint);">
								<span>{story.country}</span>
								<span>&middot;</span>
								<span>{formatDate(story.publishedAt, 'short')}</span>
								<span>&middot;</span>
								<span>{story.readingMinutes} Min. Lesezeit</span>
							</div>
							<h3 class="serif mt-3 leading-[1.18] tracking-tight text-[1.2rem] sm:text-[1.28rem] lg:text-[1.35rem]" style="color: var(--color-ink); font-weight: 500;">{story.title}</h3>
							<p class="card-dek mt-3 leading-relaxed line-clamp-3" style="color: var(--color-ink-soft); font-family: var(--font-serif);">{story.dek}</p>
							<div class="mt-5 pt-4 flex items-center justify-between text-xs" style="border-top: 1px solid var(--color-rule); color: var(--color-muted);">
								<span class="flex items-center gap-2">
									<span class="inline-block w-1.5 h-1.5 rounded-full" style="background: {t.fg};" aria-hidden="true"></span>
									Wirkung {story.impactScore}/100
								</span>
								<span class="tnum">{story.impactNote}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<!-- ===== MOBILE BOTTOM SHEET ===== -->
<MobileStorySheet story={activeStory} onClose={clearActive} />

<!-- ===== STYLES ===== -->
<style>
	:global(.user-tooltip) {
		background: var(--color-amber) !important;
		color: var(--color-paper) !important;
		border: none !important;
		border-radius: 8px !important;
		padding: 8px 12px !important;
		font-family: var(--font-sans) !important;
		font-size: 12px !important;
		line-height: 1.4 !important;
		box-shadow: 0 4px 20px rgba(26, 24, 21, 0.25) !important;
	}
	:global(.user-tooltip::before) {
		border-top-color: var(--color-amber) !important;
	}

	:global(.user-location-marker) {
		background: none !important;
		border: none !important;
	}
	:global(.user-dot-pulse) {
		width: 24px; height: 24px; border-radius: 50%;
		background: rgba(200, 115, 64, 0.2);
		display: flex; align-items: center; justify-content: center;
		animation: pulse-ring 2s cubic-bezier(0.2, 0.7, 0.2, 1) infinite;
	}
	:global(.user-dot-core) {
		width: 12px; height: 12px; border-radius: 50%;
		background: var(--color-amber);
		border: 2px solid var(--color-paper);
		box-shadow: 0 1px 4px rgba(26, 24, 21, 0.3);
	}

	@keyframes pulse-ring {
		0% { transform: scale(0.8); opacity: 0.6; }
		50% { transform: scale(1.2); opacity: 1; }
		100% { transform: scale(0.8); opacity: 0.6; }
	}
</style>
