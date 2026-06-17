<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fetchStory, publicStoryUrl } from '$lib/app/api';
	import { shareStory, tapLight } from '$lib/app/native';
	import { getStoryHeroImageSrc } from '$lib/story-images';
	import { categoryLabel } from '$lib/categories';
	import { toneStyles, paragraphs } from '$lib/utils';
	import { track } from '$lib/track';
	import type { StoryResult } from '$lib/server/queries';

	let story = $state<StoryResult | null>(null);
	let loading = $state(true);
	let errored = $state(false);

	// Audio
	let audioEl = $state<HTMLAudioElement | null>(null);
	let playing = $state(false);
	let progress = $state(0);

	const id = $derived(page.params.id);

	function heroImg(s: StoryResult): string {
		if (s.imageUrl && s.imageUrl.startsWith('http')) return s.imageUrl;
		return getStoryHeroImageSrc(s.category, base);
	}

	async function load() {
		loading = true;
		errored = false;
		try {
			story = await fetchStory(id);
		} catch {
			errored = true;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (id) load();
	});

	const axes = $derived(
		story
			? [
					{ label: 'Reichweite', value: story.impactReach },
					{ label: 'Dauerhaftigkeit', value: story.impactDurability },
					{ label: 'Belegbarkeit', value: story.impactEvidence }
				].filter((a) => typeof a.value === 'number')
			: []
	);
	const secs = $derived(story ? paragraphs(story.body) : []);

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
	const beatLabel = $derived(story?.beat ? (BEAT_LABELS[story.beat] ?? null) : null);
	const sourceTypeLabel = $derived(story?.sourceType ? (SOURCE_TYPE_LABELS[story.sourceType] ?? null) : null);

	function doShare() {
		if (!story) return;
		tapLight();
		shareStory({
			title: story.title,
			text: story.shareHook || story.dek || '',
			url: publicStoryUrl(story.slug)
		});
	}

	function toggleAudio() {
		if (!audioEl) return;
		tapLight();
		if (playing) {
			audioEl.pause();
		} else {
			audioEl.play();
			track('audio_play', { slug: story?.slug });
		}
	}
	function onTime() {
		if (audioEl && audioEl.duration) progress = (audioEl.currentTime / audioEl.duration) * 100;
	}
	function back() {
		if (history.length > 1) history.back();
		else goto(base + '/app');
	}
</script>

<div class="detail">
	<header class="d-top">
		<button class="d-back" onclick={back} aria-label="Zurück">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
		</button>
		{#if story}
			<button class="d-share" onclick={doShare} aria-label="Teilen">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
			</button>
		{/if}
	</header>

	{#if loading}
		<div class="state">Lädt …</div>
	{:else if errored || !story}
		<div class="state"><p>Geschichte nicht gefunden.</p><button onclick={load}>Erneut versuchen</button></div>
	{:else}
		{@const tone = toneStyles[story.tone]}
		<div class="d-img"><img src={heroImg(story)} alt="" /></div>
		<div class="d-body" class:has-audio={!!story.audioUrl}>
			<span class="d-tag" style="color:{tone.fg};background:{tone.bg};">{categoryLabel(story.category)} · {story.country}</span>
			<h1 class="display">{story.title}</h1>
			<p class="d-meta">{story.readingMinutes} Min · Quelle: {story.source}</p>

			{#if story.dek}<p class="d-dek serif">{story.dek}</p>{/if}

			{#each secs as sec}<p class="d-p serif">{sec}</p>{/each}

			{#if axes.length}
				<div class="d-card">
					<div class="d-card-head">
						<span>Wirkungsindex</span>
						<span class="display d-impact-n">{story.impactScore}<small>/100</small></span>
					</div>
					{#each axes as a}
						<div class="d-axis">
							<div class="d-axis-l"><span>{a.label}</span><span class="display">{a.value}</span></div>
							<div class="d-bar"><span style="width:{a.value}%;background:{tone.fg};"></span></div>
						</div>
					{/each}
					{#if story.impactExplainer}<p class="d-expl serif">{story.impactExplainer}</p>{/if}
				</div>
			{/if}

			{#if beatLabel || sourceTypeLabel}
				<div class="d-trust">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
					<span>
						{#if beatLabel}Gefunden vom Beat <strong>{beatLabel}</strong>{/if}{#if beatLabel && sourceTypeLabel} · {/if}{#if sourceTypeLabel}<strong>{sourceTypeLabel}</strong>{/if}
					</span>
				</div>
			{/if}

			<button class="d-sharebtn" onclick={doShare}>
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
				Diese Geschichte teilen
			</button>
		</div>

		{#if story.audioUrl}
			<audio bind:this={audioEl} src={story.audioUrl} onplay={() => (playing = true)} onpause={() => (playing = false)} onended={() => (playing = false)} ontimeupdate={onTime}></audio>
			<div class="player">
				<button class="player-btn" onclick={toggleAudio} aria-label={playing ? 'Pause' : 'Vorlesen'}>
					{#if playing}
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
					{:else}
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
					{/if}
				</button>
				<div class="player-mid">
					<span>Vorlesen</span>
					<div class="player-bar"><span style="width:{progress}%;"></span></div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.detail { padding-bottom: 24px; }
	.d-top { position: sticky; top: 0; z-index: 6; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: color-mix(in srgb, var(--color-canvas) 80%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
	.d-back, .d-share { width: 38px; height: 38px; border-radius: 50%; border: none; background: var(--color-paper); color: var(--color-ink); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); }
	.d-back:active, .d-share:active { transform: scale(0.92); }

	.d-img { aspect-ratio: 16 / 9; background: var(--color-canvas-soft); }
	.d-img img { width: 100%; height: 100%; object-fit: cover; }
	.d-body { padding: 16px 20px 0; }
	.d-body.has-audio { padding-bottom: 72px; }
	.d-tag { display: inline-block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; }
	.d-body h1 { font-size: 24px; font-weight: 600; line-height: 1.1; color: var(--color-ink); margin-top: 10px; }
	.d-meta { font-family: var(--font-mono); font-size: 11px; color: var(--color-faint); margin-top: 8px; }
	.d-dek { font-size: 16px; line-height: 1.6; color: var(--color-ink-soft); margin-top: 14px; font-style: italic; }
	.d-p { font-size: 15px; line-height: 1.7; color: var(--color-ink-soft); margin-top: 14px; }

	.d-card { margin-top: 20px; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 14px; padding: 14px 15px; }
	.d-card-head { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-muted); }
	.d-impact-n { font-size: 22px; font-weight: 600; color: var(--color-amber-deep); }
	.d-impact-n small { font-size: 11px; color: var(--color-faint); }
	.d-axis { margin-top: 12px; }
	.d-axis-l { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-muted); margin-bottom: 4px; }
	.d-bar { height: 6px; border-radius: 3px; background: var(--color-rule); overflow: hidden; }
	.d-bar span { display: block; height: 100%; border-radius: 3px; }
	.d-expl { font-size: 13px; line-height: 1.55; color: var(--color-muted); margin-top: 12px; }

	.d-trust { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; font-size: 12px; line-height: 1.5; color: var(--color-muted); }
	.d-trust svg { flex: 0 0 auto; margin-top: 2px; color: var(--color-sage); }
	.d-trust strong { color: var(--color-ink-soft); font-weight: 500; }

	.d-sharebtn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 22px; padding: 13px; border: none; border-radius: 999px; background: var(--color-ink); color: var(--color-paper); font-size: 14px; font-weight: 500; }
	.d-sharebtn:active { transform: scale(0.98); }

	.player { position: fixed; left: 0; right: 0; bottom: calc(58px + env(safe-area-inset-bottom, 0px)); display: flex; align-items: center; gap: 12px; background: var(--color-ink); padding: 11px 18px; z-index: 30; }
	.player-btn { width: 38px; height: 38px; border-radius: 50%; border: none; background: var(--color-amber); color: var(--color-paper); display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
	.player-mid { flex: 1; }
	.player-mid span { font-size: 12px; color: var(--color-paper); font-weight: 500; }
	.player-bar { height: 3px; background: rgba(251,248,241,0.2); border-radius: 2px; margin-top: 5px; }
	.player-bar span { display: block; height: 100%; background: var(--color-amber); border-radius: 2px; }

	.state { text-align: center; padding: 48px 24px; color: var(--color-muted); font-family: var(--font-serif); }
	.state button { margin-top: 14px; background: var(--color-ink); color: var(--color-paper); border: none; border-radius: 999px; padding: 11px 22px; }
</style>
