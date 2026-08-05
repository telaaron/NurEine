<script lang="ts">
	import { base } from '$app/paths';
	import { storyImageSrc } from '$lib/story-images';
	import { formatDate } from '$lib/utils';
	import { placeLine, placeDetail, hasRealPlace } from '$lib/place';
	import { formatDistance } from '$lib/geo';
	import { showSensitive } from '$lib/sensitive';
	import Icon from '$lib/components/Icon.svelte';
	import { EyeSlashIcon, ShareIcon, CheckIcon } from 'heroicons-svelte/24/outline';

	interface Props {
		story: any;
		/** 'lead' = Aufmacher (groß, mit Bild), 'column' = Spaltenmeldung. */
		variant?: 'lead' | 'column';
		showShare?: boolean;
	}

	let { story, variant = 'column', showShare = true }: Props = $props();

	const isLead = $derived(variant === 'lead');
	const img = $derived(storyImageSrc(story.hero, base, isLead ? 900 : 520));
	const place = $derived(placeLine(story));
	const detail = $derived(placeDetail(story));
	const local = $derived(hasRealPlace(story));
	const url = $derived(`${base}/geschichte/${story.slug}`);

	let revealed = $state(false);
	const veiled = $derived(!!story.sensitive && !$showSensitive && !revealed);

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	function share(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const full = `https://nureine.de/geschichte/${story.slug}`;
		if (typeof navigator !== 'undefined' && navigator.share) {
			navigator.share({ title: story.title, text: story.dek, url: full }).catch(() => {});
			return;
		}
		navigator.clipboard?.writeText(full).then(() => {
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1800);
		}).catch(() => {});
	}
</script>

<article class="story" class:lead={isLead}>
	<!-- Ortszeile: in einer Zeitung steht der Ort VOR der Meldung, nicht als
	     Etikett auf einem Bild. Ohne echten Ort steht hier das Land — nie ein
	     erfundener Ort. -->
	<div class="dateline">
		<span class="place" class:generic={!local}>{place}</span>
		{#if detail}<span class="detail">{detail}</span>{/if}
		{#if story.distance !== undefined && story.distance >= 0 && local}
			<span class="dist tnum">{formatDistance(story.distance)}</span>
		{/if}
	</div>

	<a href={url} class="headline-link">
		<h3 class="headline">{story.title}</h3>
	</a>

	{#if isLead && img}
		<a href={url} class="media" aria-hidden="true" tabindex="-1">
			<img src={img} alt="" loading="lazy" decoding="async"
				style={veiled ? 'filter: blur(22px); transform: scale(1.05);' : ''} />
			{#if veiled}
				<span class="veil">
					<Icon icon={EyeSlashIcon} size="1.4rem" />
					<span>Sensibler Inhalt</span>
					<button type="button" onclick={(e) => { e.preventDefault(); revealed = true; }}>
						Trotzdem ansehen
					</button>
				</span>
			{/if}
		</a>
	{/if}

	<a href={url} class="body-link">
		<p class="dek">{story.dek}</p>
	</a>

	<div class="foot">
		<span class="cat">{story.category}</span>
		<span class="sep">·</span>
		<span>{formatDate(story.publishedAt, 'short')}</span>
		<span class="sep">·</span>
		<span class="tnum">Wirkung {story.impactScore}/100</span>
		{#if showShare}
			<button type="button" class="share" onclick={share}
				aria-label="Meldung teilen" title="Meldung teilen">
				{#if copied}
					<Icon icon={CheckIcon} size="0.8rem" />
					<span>kopiert</span>
				{:else}
					<Icon icon={ShareIcon} size="0.8rem" />
					<span>teilen</span>
				{/if}
			</button>
		{/if}
	</div>
</article>

<style>
	.story { break-inside: avoid; padding-bottom: 1.1rem; }

	/* ---- Ortszeile ---- */
	.dateline {
		display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.45rem;
		font-family: var(--font-sans); font-size: 0.66rem;
		text-transform: uppercase; letter-spacing: 0.13em;
		margin-bottom: 0.3rem;
	}
	.place { color: var(--color-amber); font-weight: 700; }
	/* Ohne echten Ort: leiser, damit „Deutschland“ nicht wie eine Ortsangabe wirkt. */
	.place.generic { color: var(--color-muted); font-weight: 500; letter-spacing: 0.1em; }
	.detail { color: var(--color-muted); text-transform: none; letter-spacing: 0.02em; font-size: 0.68rem; }
	.dist { margin-left: auto; color: var(--color-muted); letter-spacing: 0.06em; }

	/* ---- Schlagzeile ---- */
	.headline-link, .body-link { text-decoration: none; display: block; }
	.headline {
		font-family: var(--font-serif); font-weight: 700; color: var(--color-ink);
		line-height: 1.14; letter-spacing: -0.015em;
		font-size: 1.02rem;
		text-wrap: balance;
	}
	.lead .headline { font-size: clamp(1.5rem, 3.4vw, 2.5rem); line-height: 1.06; }
	.headline-link:hover .headline { text-decoration: underline; text-underline-offset: 3px; }

	/* ---- Bild (nur im Aufmacher) ---- */
	.media {
		position: relative; display: block; margin: 0.7rem 0 0.6rem;
		aspect-ratio: 16 / 9; overflow: hidden; background: var(--color-canvas-soft);
		border: 1px solid var(--color-rule);
	}
	.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.veil {
		position: absolute; inset: 0; display: flex; flex-direction: column;
		align-items: center; justify-content: center; gap: 0.5rem;
		background: rgba(22,20,15,0.42); color: #fff; font-size: 0.72rem;
	}
	.veil button {
		padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.7rem;
		background: rgba(255,252,245,0.92); color: var(--color-ink); cursor: pointer;
	}

	/* ---- Text ---- */
	.dek {
		font-family: var(--font-serif); color: var(--color-ink-soft);
		font-size: 0.88rem; line-height: 1.5; margin-top: 0.35rem;
		/* Blocksatz + Silbentrennung: der Zeitungs-Look lebt vom bündigen Satz. */
		text-align: justify; hyphens: auto;
		display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
	}
	.lead .dek {
		font-size: 1rem; line-height: 1.58; -webkit-line-clamp: 6;
	}
	/* Initial im Aufmacher — das eine typografische Zitat der Zeitung. */
	.lead .dek::first-letter {
		float: left; font-size: 3.1em; line-height: 0.82;
		padding: 0.06em 0.1em 0 0; font-weight: 700; color: var(--color-ink);
	}

	/* ---- Fußzeile ---- */
	.foot {
		display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem;
		margin-top: 0.5rem; font-family: var(--font-sans);
		font-size: 0.65rem; color: var(--color-muted);
	}
	.cat { text-transform: uppercase; letter-spacing: 0.1em; }
	.sep { opacity: 0.45; }
	.share {
		margin-left: auto; display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.2rem 0.5rem; border-radius: 999px; cursor: pointer;
		border: 1px solid var(--color-rule); background: transparent;
		color: var(--color-muted); font-size: 0.65rem; transition: all 0.15s;
	}
	.share:hover { color: var(--color-ink); border-color: var(--color-rule-strong); }
</style>
