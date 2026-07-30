<script lang="ts">
	import { base } from '$app/paths';
	import { storyImageSrc } from '$lib/story-images';
	import { toneStyles } from '$lib/utils';
	import { showSensitive } from '$lib/sensitive';
	import Icon from '$lib/components/Icon.svelte';
	import { EyeSlashIcon } from 'heroicons-svelte/24/outline';

	/**
	 * Die Bildfläche einer Story-Karte — inklusive der beiden Fälle, die man
	 * leicht übersieht: KEIN Bild (Stufe ②, impact 55–74) und sensibler Inhalt.
	 *
	 * Herausgelöst aus StoryCard.svelte, damit /bei-dir und das Archiv dieselbe
	 * redaktionelle Fläche zeigen statt zweier auseinanderdriftender Varianten.
	 */

	interface Props {
		story: {
			title: string;
			category: string;
			tone: 'amber' | 'sage' | 'rose' | 'sky';
			hero: string;
			sensitive?: boolean;
		};
		/** Angezeigte Breite in CSS-Pixeln × 2 (Retina) — steuert den /img-Proxy. */
		width?: number;
		/** Große Fläche (Feature-Karte) bekommt ein größeres Typo-Motiv. */
		large?: boolean;
		/**
		 * Verhüllung sensibler Inhalte hier rendern. Aus, wenn die aufrufende
		 * Karte bereits eine eigene Verhüllung zeichnet (StoryCard) — sonst
		 * lägen zwei Overlays übereinander.
		 */
		veil?: boolean;
	}

	let { story, width = 760, large = false, veil = true }: Props = $props();

	const t = $derived(toneStyles[story.tone] ?? toneStyles.amber);

	// storyImageSrc gibt '' zurück, wenn hero kein echtes Remote-Bild ist —
	// dann NIE ein <img> mit leerem src rendern, sondern die Rubrik-Fläche.
	const img = $derived(storyImageSrc(story.hero, base, width));

	let revealedLocal = $state(false);
	const veiled = $derived(veil && !!story.sensitive && !$showSensitive && !revealedLocal);

	function reveal(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		revealedLocal = true;
	}
</script>

{#if img}
	<img
		src={img}
		alt=""
		class="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
		style={veiled ? 'filter: blur(22px); transform: scale(1.1);' : ''}
		loading="lazy"
		decoding="async"
	/>
{:else}
	<!-- KEIN echtes Bild: bewusste, redaktionelle Kategorie-Fläche statt
	     Stockfoto/Emoji. Die Headline steht schon im Karten-Body → hier NICHT
	     wiederholen. Stattdessen der Kategoriename als großes Typo-Motiv
	     (Magazin-Rubrik-Look) auf Kategorie-Ton. Gleiche Sprache wie im Archiv. -->
	<div
		class="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 overflow-hidden"
		style="background:
			radial-gradient(130% 100% at 100% 0%, {t.bg} 0%, transparent 60%),
			linear-gradient(158deg, var(--color-paper) 0%, {t.bg} 100%);"
	>
		<div class="flex items-center gap-1.5 relative" style="color:{t.fg};z-index:1;">
			<span style="width:7px;height:7px;border-radius:7px;background:{t.fg};display:inline-block;"></span>
			<span class="badge" style="letter-spacing:0.14em;text-transform:uppercase;">{story.category}</span>
		</div>
		<div
			class="display font-bold leading-[0.92] {large ? 'text-6xl lg:text-8xl' : 'text-5xl sm:text-6xl'}"
			style="color:{t.fg};opacity:0.16;letter-spacing:-0.04em;text-transform:capitalize;position:relative;z-index:0;"
		>
			{story.category}
		</div>
		<div class="flex items-center justify-between relative" style="z-index:1;">
			<div style="width:44px;height:4px;border-radius:4px;background:{t.fg};opacity:0.85;"></div>
			<span class="badge" style="color:{t.fg};opacity:0.6;letter-spacing:0.1em;">NurEine</span>
		</div>
	</div>
{/if}

{#if veiled}
	<!-- Jugendschutz: heikle Stories bleiben verhüllt, bis der Nutzer aufdeckt.
	     Ohne echtes Bild gibt es nichts zu blurren — der Hinweis muss trotzdem
	     stehen, sonst wäre die Kennzeichnung an genau den Karten weg, die keine
	     Bebilderung haben. -->
	<div
		class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4"
		style="background: rgba(22,20,15,0.34); backdrop-filter: blur(2px);"
	>
		<Icon icon={EyeSlashIcon} size="1.625rem" style="color: #fff; opacity: 0.92;" />
		<span class="text-xs font-medium" style="color: #fff; opacity: 0.95;">Sensibler Inhalt</span>
		<button
			type="button"
			onclick={reveal}
			class="px-3 py-1.5 rounded-full text-xs font-medium"
			style="background: rgba(255,252,245,0.92); color: var(--color-ink);"
		>
			Trotzdem ansehen
		</button>
	</div>
{/if}
