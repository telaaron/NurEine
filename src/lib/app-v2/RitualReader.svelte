<script lang="ts">
	// Das Kern-Ritual — Typ 1 „Die Geschichte" (Bauplan §4).
	// Beats: Aufdecken → Cold-Open-Zahl → Wer&Wo → Mechanismus → Beweis (Stempel) → Abschluss.
	// „Das Ende ist das Produkt": feste Menge → Peak → zelebrierter Schluss, kein Nachschub.
	import type { StoryResult } from '$lib/server/queries';
	import { onDestroy } from 'svelte';
	import { animate, easeOut, prefersReducedMotion, formatDeNumber } from './motion';
	import { whoosh, thud, chime, tick, haptic } from './audio';
	import { accentVar, proxied, impactBars, shortDate } from './story';

	let { story, onDone }: { story: StoryResult; onDone?: () => void } = $props();

	const reduced = prefersReducedMotion();
	const accent = $derived(accentVar(story.category));
	const bars = $derived(impactBars(story));
	const img = $derived(proxied(story.imageUrl, 1080));
	const kidReady = $derived(!!(story.kidExplainer && (story.kidMinAge ?? 0) > 0));

	// Beat-State-Machine: 1 Aufdecken · 2 Cold-Open · 3 Wer&Wo · 4 Mechanismus · 5 Beweis · 6 Abschluss
	let beat = $state(1);
	const TOTAL = 6;

	// Animierte Zahl-Anzeige (Cold-Open: der Wirkungs-Score rastet ein / zählt hoch)
	let shownScore = $state(reduced ? story.impactScore : 0);
	// Balken-Füllung (0..1) für die drei Wirkungs-Balken
	let barFill = $state(reduced ? 1 : 0);
	// Stempel
	let stampGo = $state(false);
	let sealOpening = $state(false);
	let familyOpen = $state(false);

	let cancels: Array<() => void> = [];
	let timers: ReturnType<typeof setTimeout>[] = [];
	function T(fn: () => void, ms: number) {
		timers.push(setTimeout(fn, ms));
	}
	function clearAll() {
		cancels.forEach((c) => c());
		cancels = [];
		timers.forEach(clearTimeout);
		timers = [];
	}
	onDestroy(clearAll);

	function go(n: number) {
		if (n < 1 || n > TOTAL) return;
		beat = n;
		if (n === 2) runColdOpen();
		if (n === 3) runBars();
		if (n === 5) runStamp();
		if (n === 6 && !reduced) T(() => chime(), 400);
	}

	function advance() {
		if (beat === 1) {
			sealOpening = true;
			haptic(10);
			whoosh();
			T(() => go(2), reduced ? 0 : 520);
			return;
		}
		if (beat < TOTAL) {
			haptic(6);
			go(beat + 1);
		}
	}

	function runColdOpen() {
		if (reduced) {
			shownScore = story.impactScore;
			return;
		}
		T(() => whoosh(), 120);
		const c = animate(
			1100,
			(p) => {
				shownScore = Math.round(story.impactScore * easeOut(p, 2));
			},
			() => {
				tick();
			}
		);
		cancels.push(c);
	}

	function runBars() {
		if (reduced) {
			barFill = 1;
			return;
		}
		const c = animate(900, (p) => {
			barFill = easeOut(p, 2);
		});
		cancels.push(c);
	}

	function runStamp() {
		stampGo = false;
		// re-trigger reflow so the animation restarts if replayed
		T(() => whoosh(), 160);
		T(() => {
			stampGo = true;
			thud();
			haptic([8, 40, 22]);
		}, 480);
	}

	function finish() {
		clearAll();
		onDone?.();
	}
</script>

<div
	class="ritual"
	style="--accent:{accent}"
	role="group"
	aria-label="Die heutige Ausgabe"
	onclick={(e) => {
		// Tap-to-advance nur in den Beats 1–5. Der Abschluss (Beat 6) hat eigene
		// Buttons (Teilen, Familien-Zeile, Fertig) — dort NIE versehentlich weiterspringen.
		if (beat >= TOTAL) return;
		const el = e.target as HTMLElement;
		if (el.closest('button, a')) return;
		clearAll();
		advance();
	}}
	onkeydown={(e) => {
		if (beat >= TOTAL) return;
		if (e.key === 'Enter' || e.key === ' ') {
			const el = e.target as HTMLElement;
			if (el.closest('button, a')) return;
			e.preventDefault();
			clearAll();
			advance();
		}
	}}
	tabindex="0"
>
	<!-- Fortschritts-Faden (feste Menge sichtbar — Peak-End) -->
	<div class="thread" aria-hidden="true">
		{#each Array(TOTAL) as _, i}
			<i class:done={i < beat}></i>
		{/each}
	</div>

	<!-- BEAT 1 — Aufdecken -->
	{#if beat === 1}
		<div class="beat cover surface-ink tex" class:opening={sealOpening}>
			<div class="cover-inner">
				<div class="kicker sf">Deine Ausgabe · {shortDate(story.publishedAt)}</div>
				<div class="seal sf" class:opening={sealOpening}>
					<span class="seal-logo">NUREINE</span>
					<span class="seal-tag">Eine Geschichte.<br />Dann bist du fertig.</span>
				</div>
			</div>
			<button class="pill" type="button" onclick={advance}>Ausgabe aufdecken</button>
		</div>
	{/if}

	<!-- BEAT 2 — Cold-Open-Zahl -->
	{#if beat === 2}
		<div class="beat coldopen surface-ink tex">
			<div class="co-lead sf">Ein Beleg von heute</div>
			<div class="co-num num" aria-live="polite">{shownScore}</div>
			<div class="co-scale sf">von 100 Wirkungsindex</div>
			<p class="co-explain">{story.impactExplainer || story.dek}</p>
			<div class="hint sf" aria-hidden="true">Tippen — wer dahintersteckt</div>
		</div>
	{/if}

	<!-- BEAT 3 — Wer & Wo -->
	{#if beat === 3}
		<div class="beat wer surface-ink tex">
			{#if img}
				<div class="wer-img" style="background-image:url('{img}')" role="img" aria-label={story.title}></div>
			{/if}
			<div class="wer-body">
				<div class="wer-meta sf">{story.country}{story.category ? ' · ' + story.category : ''}</div>
				<h1 class="wer-title sf">{story.title}</h1>
				{#if story.dek}<p class="wer-dek nr">{story.dek}</p>{/if}
			</div>
			<div class="hint sf" aria-hidden="true">Tippen — warum es wirkt</div>
		</div>
	{/if}

	<!-- BEAT 4 — Mechanismus (der Aha) -->
	{#if beat === 4}
		<div class="beat mech surface-paper tex">
			<div class="mech-kick sf">Warum das wirkt</div>
			<div class="bars">
				{#each bars as b}
					<div class="bar-row">
						<div class="bar-head">
							<span class="bar-label sf">{b.label}</span>
							<span class="bar-val num">{Math.round(b.value * barFill)}</span>
						</div>
						<div class="bar-track"><div class="bar-fill" style="width:{b.value * barFill}%"></div></div>
					</div>
				{/each}
			</div>
			{#if story.summary}<p class="mech-text">{story.summary}</p>{/if}
			<div class="hint sf dark" aria-hidden="true">Tippen für den Beweis</div>
		</div>
	{/if}

	<!-- BEAT 5 — Beweis (Stempel) -->
	{#if beat === 5}
		<div class="beat beweis surface-paper tex" class:shake={stampGo && !reduced}>
			<span class="stamp" class:go={stampGo}>Belegt.</span>
			<p class="src nr">
				Quelle: {story.source}{#if story.publishedAt} · {shortDate(story.publishedAt)}{/if}
			</p>
			{#if story.sourceUrl}
				<a class="src-link sf" href={story.sourceUrl} target="_blank" rel="noopener noreferrer"
					>Zur Originalquelle ↗</a
				>
			{/if}
			<div class="hint sf dark" aria-hidden="true">Tippen zum Abschluss</div>
		</div>
	{/if}

	<!-- BEAT 6 — Abschluss (Atem, Teilen, Familien-Zeile) -->
	{#if beat === 6}
		<div class="beat close surface-ink tex">
			<div class="breath" aria-hidden="true"></div>
			<div class="close-line sf">Das war deine Ausgabe.</div>
			<div class="close-sub">Morgen die nächste. Belegt.</div>

			{#if story.shareHook}
				<div class="share-card">
					<div class="share-b sf">Schick's jemandem, der eine Pause braucht</div>
					<p>{story.shareHook}</p>
					{#if story.waOpener}
						<a
							class="share-send sf"
							href={'https://wa.me/?text=' + encodeURIComponent(story.waOpener + '\n\n' + story.shareHook + '\n\n' + (story.sourceUrl ?? ''))}
							target="_blank"
							rel="noopener noreferrer">In WhatsApp teilen ↗</a
						>
					{/if}
				</div>
			{/if}

			{#if kidReady}
				<button class="family-toggle sf" type="button" aria-expanded={familyOpen} onclick={() => (familyOpen = !familyOpen)}>
					<span>Für Kinder erklärt (ab {story.kidMinAge})</span>
					<span class="chev" class:open={familyOpen} aria-hidden="true">›</span>
				</button>
				{#if familyOpen}
					<div class="family-body">
						<p>{story.kidExplainer}</p>
						{#if story.conversationStarter}
							<p class="family-starter nr">„{story.conversationStarter}"</p>
						{/if}
					</div>
				{/if}
			{/if}

			<button class="pill" type="button" onclick={finish}>Fertig — in den Himmel</button>
		</div>
	{/if}
</div>

<style>
	.ritual {
		position: relative;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		outline: none;
	}
	.thread {
		position: absolute;
		top: max(14px, env(safe-area-inset-top));
		left: 20px;
		right: 66px; /* Platz für den Klang-Toggle */
		display: flex;
		gap: 5px;
		z-index: 40;
	}
	.thread i {
		flex: 1;
		height: 3px;
		border-radius: 2px;
		background: currentColor;
		opacity: 0.16;
		transition: 0.4s;
	}
	.thread i.done {
		opacity: 0.9;
		background: var(--accent);
	}

	.beat {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 72px 28px 40px;
		min-height: 100dvh;
		animation: beat-in 0.5s cubic-bezier(0.2, 1, 0.3, 1);
	}
	@keyframes beat-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.kicker {
		font-size: 11.5px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.hint {
		position: absolute;
		bottom: 22px;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 10.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.42;
	}
	.hint.dark {
		color: var(--paper-ink);
	}

	.pill {
		width: 100%;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 15px;
		letter-spacing: -0.01em;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 999px;
		padding: 16px;
		cursor: pointer;
		margin-top: 22px;
		transition: transform 0.12s ease;
	}
	.pill:active {
		transform: scale(0.98);
	}

	/* Beat 1 — Aufdecken */
	.cover {
		justify-content: space-between;
	}
	.cover-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 26px;
	}
	.cover .kicker {
		position: absolute;
		top: 68px;
	}
	.seal {
		width: 74%;
		max-width: 300px;
		aspect-ratio: 3 / 4;
		border-radius: 22px;
		background: linear-gradient(165deg, #241f16, #18140e);
		border: 1px solid rgba(244, 239, 230, 0.14);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		box-shadow:
			inset 0 1px 0 rgba(244, 239, 230, 0.06),
			0 20px 40px rgba(0, 0, 0, 0.35);
		animation: appv2-breathe 5.5s ease-in-out infinite;
	}
	.seal.opening {
		animation: seal-open 0.6s cubic-bezier(0.5, 0, 0.2, 1) forwards;
	}
	@keyframes seal-open {
		to {
			transform: translateY(-58%) scale(0.86);
			opacity: 0;
		}
	}
	.seal-logo {
		font-size: 12px;
		letter-spacing: 0.28em;
		color: var(--amber-hi);
	}
	.seal-tag {
		font-size: 20px;
		letter-spacing: -0.02em;
		line-height: 1.24;
		text-align: center;
		padding: 0 16px;
	}

	/* Beat 2 — Cold-Open */
	.coldopen {
		align-items: flex-start;
	}
	.co-lead {
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--amber-hi);
	}
	.co-num {
		font-size: clamp(96px, 30vw, 150px);
		margin-top: 6px;
		color: var(--ink-text);
	}
	.co-scale {
		font-size: 13px;
		color: var(--ink-muted);
		letter-spacing: 0.02em;
		margin-top: 2px;
	}
	.co-explain {
		margin-top: 20px;
		font-size: 17px;
		line-height: 1.5;
		max-width: 32ch;
		color: var(--ink-text);
	}

	/* Beat 3 — Wer & Wo */
	.wer {
		justify-content: flex-end;
		padding-bottom: 56px;
	}
	.wer-img {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		z-index: 0;
	}
	.wer-img::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(20, 17, 13, 0.1) 0%, rgba(20, 17, 13, 0.35) 45%, rgba(20, 17, 13, 0.94) 100%);
	}
	.wer-body {
		position: relative;
		z-index: 2;
	}
	.wer-meta {
		font-size: 11.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--amber-hi);
	}
	.wer-title {
		font-size: clamp(27px, 7vw, 36px);
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 8px 0 0;
		color: var(--ink-text);
		text-wrap: balance;
	}
	.wer-dek {
		font-size: 17px;
		line-height: 1.45;
		margin: 12px 0 0;
		color: #e8e0d2;
	}

	/* Beat 4 — Mechanismus */
	.mech-kick {
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.bars {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.bar-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
	}
	.bar-label {
		font-size: 13.5px;
		color: var(--paper-ink);
	}
	.bar-val {
		font-size: 17px;
		color: var(--accent);
	}
	.bar-track {
		height: 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--paper-ink) 12%, transparent);
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		border-radius: 999px;
		background: var(--accent);
	}
	.mech-text {
		margin-top: 22px;
		font-size: 16px;
		line-height: 1.55;
		color: var(--paper-ink);
	}

	/* Beat 5 — Beweis */
	.beweis {
		align-items: flex-start;
		justify-content: center;
	}
	.src {
		font-size: 15.5px;
		color: var(--paper-muted);
		margin: 22px 0 0;
	}
	.src-link {
		margin-top: 12px;
		font-size: 13.5px;
		color: var(--accent);
		text-decoration: none;
	}

	/* Beat 6 — Abschluss */
	.close {
		justify-content: flex-start;
		padding-top: 92px;
		overflow-y: auto;
	}
	.breath {
		width: 78px;
		height: 78px;
		border-radius: 50%;
		margin: 4px auto 24px;
		background: radial-gradient(circle at 42% 38%, rgba(232, 166, 104, 0.98), rgba(156, 85, 39, 0.9));
		box-shadow: 0 0 50px rgba(208, 128, 72, 0.5);
		animation: breathe-close 12s ease-in-out infinite;
	}
	@keyframes breathe-close {
		0%,
		100% {
			transform: scale(0.92);
		}
		33% {
			transform: scale(1.12);
		}
		50% {
			transform: scale(1.12);
		}
		100% {
			transform: scale(0.92);
		}
	}
	.close-line {
		text-align: center;
		font-size: 25px;
		letter-spacing: -0.02em;
		color: var(--ink-text);
	}
	.close-sub {
		text-align: center;
		font-size: 13.5px;
		color: var(--ink-muted);
		margin-top: 6px;
	}
	.share-card {
		margin-top: 24px;
		background: rgba(244, 239, 230, 0.06);
		border: 1px solid rgba(244, 239, 230, 0.16);
		border-radius: 15px;
		padding: 15px 17px;
	}
	.share-b {
		font-size: 10.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--amber-hi);
		margin-bottom: 7px;
	}
	.share-card p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-text);
	}
	.share-send {
		margin-top: 12px;
		display: inline-block;
		font-size: 13px;
		color: var(--amber-hi);
		text-decoration: none;
	}

	.family-toggle {
		margin-top: 14px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(244, 239, 230, 0.05);
		border: 1px solid rgba(244, 239, 230, 0.16);
		border-radius: 13px;
		padding: 13px 16px;
		color: var(--ink-text);
		font-size: 14px;
		cursor: pointer;
	}
	.chev {
		transition: transform 0.25s ease;
		font-size: 20px;
		opacity: 0.7;
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.family-body {
		margin-top: 10px;
		padding: 0 4px;
		font-size: 14px;
		line-height: 1.55;
		color: #e8e0d2;
	}
	.family-body p {
		margin: 0 0 8px;
	}
	.family-starter {
		color: var(--ink-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.beat {
			animation: none;
		}
		.seal,
		.breath {
			animation: none !important;
		}
		.seal.opening {
			opacity: 0;
		}
	}
</style>
