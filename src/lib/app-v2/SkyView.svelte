<script lang="ts">
	// Der Himmel (Konzept B) — die stille Sammlung als Nachthimmel voller Lichter.
	// Jede gelesene Ausgabe ist ein Licht; nichts verfällt. Die Sonne geht auf (Hoffnung).
	// Übernimmt Sterne-Layout + Kategorie-Farben aus den Prototypen Exp 2/3.
	import { onMount } from 'svelte';
	import type { Light } from './collection.svelte';
	import { shortDate } from './story';
	import { chime } from './audio';
	import { prefersReducedMotion } from './motion';

	let {
		lights,
		total,
		sinceDay = null,
		flyIn = false, // true → ein neues Licht fliegt gerade herein (Ritual-Abschluss)
		flyKind = 'story'
	}: {
		lights: Light[];
		total: number;
		sinceDay?: string | null;
		flyIn?: boolean;
		flyKind?: 'story' | 'curve';
	} = $props();

	const reduced = prefersReducedMotion();

	// Feste Sternfeld-Positionen (Prozent), deterministisch — wie in den Prototypen.
	const SLOTS: Array<[number, number]> = [
		[8, 15], [16, 23], [24, 10], [31, 19], [38, 27], [45, 13], [52, 21], [59, 9],
		[66, 25], [73, 16], [80, 29], [87, 12], [12, 35], [20, 41], [28, 32], [36, 45],
		[44, 37], [52, 47], [60, 34], [68, 43], [76, 38], [84, 48], [10, 53], [22, 57],
		[34, 51], [46, 59], [58, 53], [70, 58], [82, 54], [15, 64], [40, 67], [65, 63], [87, 61]
	];

	// Kategorie → Lichtfarbe (warm, wie die dokumentarischen Bilder).
	function lightColor(category: string): string {
		switch (category) {
			case 'klima':
			case 'tiere':
				return '#cdd8c5';
			case 'gesundheit':
				return '#dcb8b0';
			case 'wissenschaft':
			case 'innovation':
				return '#c5d0dc';
			default:
				return '#e8c9a8';
		}
	}

	let mounted = $state(false);
	let flewIn = $state(false);
	let showCount = $state(total);

	onMount(() => {
		mounted = true;
		if (flyIn && !reduced) {
			showCount = Math.max(0, total - 1); // erst die alte Zahl, dann +1
			setTimeout(() => {
				flewIn = true;
				showCount = total;
				chime();
			}, 700);
		} else {
			flewIn = true;
			showCount = total;
		}
	});

	// Die bereits vorhandenen Lichter (beim Fly-In das neueste noch nicht mitzählen).
	const settled = $derived(flyIn && !flewIn ? lights.slice(0, -1) : lights);
	const flying = $derived(flyIn ? lights[lights.length - 1] : null);
</script>

<div class="sky" class:mounted>
	<div class="sky-grad"></div>
	<div class="sun"></div>

	{#each settled as light, i}
		{@const slot = SLOTS[i % SLOTS.length]}
		<span
			class="star"
			class:gifted={light.gifted}
			style="left:{slot[0]}%; top:{slot[1]}%; background:{light.gifted ? 'transparent' : lightColor(light.category)}; --c:{lightColor(light.category)}; transition-delay:{reduced ? 0 : Math.min(i * 22, 700)}ms"
			title={light.title}
		></span>
	{/each}

	{#if flying}
		<span class="star flyer" class:landed={flewIn} style="--c:{lightColor(flying.category)}"></span>
	{/if}

	<div class="sky-head">
		<div class="sky-kick sf">Dein Himmel</div>
		<div class="sky-count sf">
			<span class="num">{showCount}</span>
			<span class="sky-count-lbl">{showCount === 1 ? 'Licht' : 'Lichter'}{sinceDay ? ' · seit ' + shortDate(sinceDay) : ''}</span>
		</div>
	</div>

	{#if flyIn}
		<div class="sky-toast" class:show={flewIn}>
			<div class="toast-t1 sf">Ein Licht mehr.</div>
			<div class="toast-t2">{flyKind === 'curve' ? 'Als Kurve markiert.' : 'Deine Ausgabe von heute.'}</div>
		</div>
	{/if}
</div>

<style>
	.sky {
		position: relative;
		width: 100%;
		min-height: 100dvh;
		overflow: hidden;
		background: linear-gradient(180deg, #0e0d12 0%, #16140f 42%, #241a10 72%, #3a2413 88%, #4d2e15 100%);
	}
	.sky-grad {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 24%;
		background: linear-gradient(180deg, transparent, rgba(208, 128, 72, 0.26) 62%, rgba(208, 128, 72, 0.46));
	}
	.sun {
		position: absolute;
		left: 50%;
		bottom: calc(24% - 20px);
		width: 64px;
		height: 64px;
		border-radius: 50%;
		transform: translateX(-50%);
		background: radial-gradient(circle at 45% 40%, #e8a668, #bd6a35 72%);
		box-shadow: 0 0 78px 26px rgba(208, 128, 72, 0.4);
	}

	.star {
		position: absolute;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		opacity: 0;
		transform: scale(0.3) translate(-50%, -50%);
		transform-origin: left top;
		box-shadow: 0 0 8px 1px rgba(244, 239, 230, 0.32);
		transition:
			opacity 0.8s ease,
			transform 0.8s cubic-bezier(0.2, 1.4, 0.3, 1);
	}
	.sky.mounted .star {
		opacity: 0.9;
		transform: scale(1) translate(-50%, -50%);
	}
	.star.gifted {
		width: 11px;
		height: 11px;
		border: 2.5px solid var(--c);
		box-shadow: 0 0 20px 5px color-mix(in srgb, var(--c) 55%, transparent);
	}

	.flyer {
		left: 48%;
		top: 62%;
		width: 14px;
		height: 14px;
		border: 2.5px solid var(--c);
		background: transparent;
		box-shadow: 0 0 22px 6px color-mix(in srgb, var(--c) 55%, transparent);
		opacity: 1;
		transform: scale(1) translate(-50%, -50%);
		transition:
			left 1s cubic-bezier(0.3, 1, 0.3, 1),
			top 1s cubic-bezier(0.3, 1, 0.3, 1),
			width 0.6s ease,
			height 0.6s ease;
	}
	.flyer.landed {
		left: 60%;
		top: 22%;
		width: 9px;
		height: 9px;
	}

	.sky-head {
		position: relative;
		z-index: 3;
		padding: max(34px, calc(env(safe-area-inset-top) + 18px)) 28px 0;
	}
	.sky-kick {
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--amber-hi);
	}
	.sky-count {
		margin-top: 8px;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.sky-count .num {
		font-size: 30px;
		color: var(--ink-text);
	}
	.sky-count-lbl {
		font-size: 13px;
		color: var(--ink-muted);
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
	}

	.sky-toast {
		position: absolute;
		left: 50%;
		top: 44%;
		transform: translate(-50%, -50%) scale(0.6);
		z-index: 5;
		text-align: center;
		opacity: 0;
		width: 82%;
		transition:
			opacity 0.6s ease,
			transform 0.6s cubic-bezier(0.2, 1.3, 0.35, 1);
	}
	.sky-toast.show {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
	.toast-t1 {
		font-size: 20px;
		letter-spacing: -0.02em;
		color: var(--ink-text);
	}
	.toast-t2 {
		font-size: 12.5px;
		color: var(--ink-muted);
		margin-top: 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.star,
		.flyer,
		.sky-toast {
			transition: none !important;
		}
	}
</style>
