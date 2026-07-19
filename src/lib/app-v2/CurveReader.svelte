<script lang="ts">
	// Der Kurven-Tag — Typ 2 „Die Kurve" (aus Exp 2, verifiziert). Wenn die Nachricht
	// selbst eine Statistik ist: die Kurve läuft Jahrzehnte in Sekunden ab, die Zahl
	// fällt (oder steigt) vor den Augen mit. Dieselbe Marke (Stempel, Himmel-Licht),
	// anderer Körper. Datengetrieben aus nureine_world_metrics.series.
	import { onDestroy } from 'svelte';
	import type { WorldMetric } from '$lib/server/queries';
	import { animate, easeOut, prefersReducedMotion, formatDeNumber } from './motion';
	import { whoosh, thud, chime, tick, haptic } from './audio';

	let { metric, onDone }: { metric: WorldMetric; onDone?: () => void } = $props();

	const reduced = prefersReducedMotion();
	const falling = metric.direction === 'down';

	// Zeitreihe säubern + sortieren
	const pts = $derived(
		[...(metric.series ?? [])].filter((p) => p && typeof p.value === 'number').sort((a, b) => a.year - b.year)
	);
	const first = $derived(pts[0]);
	const last = $derived(pts[pts.length - 1]);

	// SVG-Geometrie (viewBox 0..320 x 0..150). Kurve normalisiert.
	const W = 320,
		H = 150,
		PAD_T = 12,
		PAD_B = 26;
	const geom = $derived.by(() => {
		if (pts.length < 2) return { d: '', dFill: '', xy: (_: number) => ({ x: 10, y: 20 }) };
		const years = pts.map((p) => p.year);
		const vals = pts.map((p) => p.value);
		const yMin = Math.min(...years),
			yMax = Math.max(...years);
		const vMin = Math.min(...vals),
			vMax = Math.max(...vals);
		const vSpan = vMax - vMin || 1;
		const x = (yr: number) => ((yr - yMin) / (yMax - yMin || 1)) * W;
		// Höherer Wert = weiter oben (kleineres y)
		const y = (v: number) => PAD_T + (1 - (v - vMin) / vSpan) * (H - PAD_T - PAD_B);
		const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + x(p.year).toFixed(1) + ',' + y(p.value).toFixed(1)).join(' ');
		const dFill = d + ` L${W},${H - PAD_B} L0,${H - PAD_B} Z`;
		return { d, dFill, x, y, yMin, yMax };
	});

	// Beat-State: 1 Aufdecken · 2 Anker · 3 Lauf · 4 Warum · 5 Beweis
	let beat = $state(1);
	const TOTAL = 5;

	let sealOpening = $state(false);
	// Lauf-Anzeige
	let runVal = $state(0);
	let runYear = $state(0);
	let dashOffset = $state(1);
	let dotXY = $state({ x: 0, y: 0 });
	let verdictOn = $state(false);
	let runNextReady = $state(false);
	let stampGo = $state(false);
	let pathLen = $state(1000);
	let pathEl: SVGPathElement | null = $state(null);

	let timers: ReturnType<typeof setTimeout>[] = [];
	let cancels: Array<() => void> = [];
	function T(fn: () => void, ms: number) {
		timers.push(setTimeout(fn, ms));
	}
	function clearAll() {
		timers.forEach(clearTimeout);
		timers = [];
		cancels.forEach((c) => c());
		cancels = [];
	}
	onDestroy(clearAll);

	function fmt(v: number): string {
		// Sinnvolle Nachkommastellen je nach Größenordnung
		const digits = Math.abs(v) >= 100 ? 0 : 1;
		return formatDeNumber(v, digits);
	}

	function go(n: number) {
		beat = n;
		if (n === 3) T(runCurve, 350);
		if (n === 4) T(() => tick(), 300); // audio.ts no-op't selbst, wenn Klang aus ist
		if (n === 5) runStamp();
	}

	function runCurve() {
		if (pathEl) pathLen = pathEl.getTotalLength();
		verdictOn = false;
		runNextReady = false;
		whoosh();
		if (reduced) {
			dashOffset = 0;
			runVal = last.value;
			runYear = last.year;
			if (geom.x && geom.y) dotXY = { x: geom.x(last.year), y: geom.y(last.value) };
			verdictOn = true;
			runNextReady = true;
			return;
		}
		const c = animate(
			2600,
			(p) => {
				const e = 1 - Math.pow(1 - p, 2.2);
				dashOffset = 1 - e;
				// Wert + Jahr interpolieren entlang der realen Endpunkte
				runVal = first.value + (last.value - first.value) * e;
				runYear = Math.round(first.year + (last.year - first.year) * e);
				if (pathEl) {
					const pt = pathEl.getPointAtLength(pathLen * e);
					dotXY = { x: pt.x, y: pt.y };
				}
			},
			() => {
				verdictOn = true;
				runNextReady = true;
				chime();
			}
		);
		cancels.push(c);
	}

	function runStamp() {
		stampGo = false;
		T(() => whoosh(), 160);
		T(() => {
			stampGo = true;
			thud();
			haptic([8, 40, 22]);
		}, 480);
	}

	function advance() {
		clearAll();
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

	// Startwerte für den Lauf setzen, sobald Daten da sind
	$effect(() => {
		if (first && runYear === 0) {
			runVal = first.value;
			runYear = first.year;
			dashOffset = 1;
			if (geom.x && geom.y) dotXY = { x: geom.x(first.year), y: geom.y(first.value) };
		}
	});
</script>

<div
	class="curve"
	role="group"
	aria-label="Der Kurven-Tag"
	onclick={(e) => {
		if (beat >= TOTAL) return;
		const el = e.target as HTMLElement;
		if (el.closest('button, a')) return;
		if (beat === 3 && !runNextReady) return; // während der Lauf läuft nicht weiter
		advance();
	}}
>
	<div class="thread" aria-hidden="true">
		{#each Array(TOTAL) as _, i}<i class:done={i < beat}></i>{/each}
	</div>

	{#if beat === 1}
		<div class="beat surface-ink tex" class:opening={sealOpening}>
			<div class="cover-inner">
				<div class="seal sf" class:opening={sealOpening}>
					<span class="seal-logo">NUREINE</span>
					<span class="seal-tag">Heute ist die Zahl<br />die Nachricht.</span>
					<span class="seal-badge">Kurven-Ausgabe</span>
				</div>
			</div>
			<div class="foot"><button class="pill" type="button" onclick={advance}>Ausgabe aufdecken</button></div>
		</div>
	{/if}

	{#if beat === 2}
		<div class="beat surface-ink tex">
			<div class="anc-lead sf">So war es einmal</div>
			<div class="anc-num num">{fmt(first.value)}<span class="anc-unit">{metric.unit}</span></div>
			<div class="anc-year sf">{first.year}</div>
			<p class="anc-blurb">{metric.blurb}</p>
			<div class="hint sf" aria-hidden="true">Tippen — jetzt läuft die Zeit</div>
		</div>
	{/if}

	{#if beat === 3}
		<div class="beat surface-ink tex">
			<div class="run-kick sf">{metric.label}</div>
			<div class="run-num num" aria-live="polite">{fmt(runVal)}<span class="run-u">{metric.unit}</span></div>
			<div class="run-meta">im Jahr <span class="run-yr sf">{runYear}</span></div>
			<div class="chart">
				<svg viewBox="0 0 {W} {H}" aria-hidden="true">
					<defs>
						<linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stop-color="#d08048" />
							<stop offset="1" stop-color="#d08048" stop-opacity="0" />
						</linearGradient>
					</defs>
					<line class="grid-line" x1="0" y1={H - 20} x2={W} y2={H - 20} />
					<path class="trend-fill" d={geom.dFill} style="opacity:{(1 - dashOffset) * 0.16}" />
					<path
						bind:this={pathEl}
						class="trend"
						d={geom.d}
						style="stroke-dasharray:{pathLen}; stroke-dashoffset:{pathLen * dashOffset}"
					/>
					<circle class="dot-now" r="5" cx={dotXY.x} cy={dotXY.y} />
					<text class="axis-lbl" x="6" y={H - 6}>{first?.year}</text>
					<text class="axis-lbl" x={W - 34} y={H - 6}>{last?.year}</text>
				</svg>
			</div>
			<div class="verdict sf" class:on={verdictOn}>
				{#if falling}Diese Kurve fällt.<br />Und das ist gut.{:else}Diese Kurve steigt.<br />Und das ist gut.{/if}
			</div>
			<div class="foot">
				<button class="pill quiet" type="button" disabled={!runNextReady} onclick={advance}>Warum</button>
			</div>
		</div>
	{/if}

	{#if beat === 4}
		<div class="beat surface-paper tex">
			<div class="why-para sf">Kein Wunder.<br /><span class="hl">Ein Weg.</span></div>
			<p class="why-resolve">
				{metric.blurb} Diese Zahl bewegt sich seit {first.year}, weil Millionen Menschen dieselben Dinge
				tun — immer besser, Jahr für Jahr.
			</p>
			<div class="hint sf dark" aria-hidden="true">Tippen für den Beweis</div>
		</div>
	{/if}

	{#if beat === 5}
		<div class="beat surface-paper tex" class:shake={stampGo && !reduced}>
			<span class="stamp" class:go={stampGo}>Belegt.</span>
			<p class="src nr">
				Quelle: {metric.source ?? 'offizielle Statistik'} · {first.year}–{last.year}
			</p>
			{#if metric.source_url}
				<a class="src-link sf" href={metric.source_url} target="_blank" rel="noopener noreferrer">Zur Datenquelle ↗</a>
			{/if}
			<div class="to-wall sf">↗ Wandert in „Stand der Welt"</div>
			<div class="foot"><button class="pill" type="button" onclick={() => onDone?.()}>Fertig — in den Himmel</button></div>
		</div>
	{/if}
</div>

<style>
	.curve {
		position: relative;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	.thread {
		position: absolute;
		top: max(14px, env(safe-area-inset-top));
		left: 20px;
		right: 66px;
		display: flex;
		gap: 5px;
		z-index: 40;
		color: var(--ink-text);
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
		background: var(--amber-hi);
	}

	.beat {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 72px 28px 40px;
		min-height: 100dvh;
		position: relative;
		animation: beat-in 0.5s cubic-bezier(0.2, 1, 0.3, 1);
	}
	@keyframes beat-in {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: none; }
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
	.hint.dark { color: var(--paper-ink); }
	.foot { margin-top: 22px; }
	.pill {
		width: 100%;
		font-family: var(--ff-display);
		font-weight: 700;
		font-size: 15px;
		background: var(--amber-hi);
		color: #fff;
		border: none;
		border-radius: 999px;
		padding: 15px;
		cursor: pointer;
		transition: transform 0.12s ease, opacity 0.2s ease;
	}
	.pill:active { transform: scale(0.98); }
	.pill:disabled { opacity: 0.4; pointer-events: none; }
	.pill.quiet { background: none; border: 1px solid rgba(244, 239, 230, 0.28); color: var(--ink-text); }

	/* Beat 1 */
	.cover-inner { flex: 1; display: flex; align-items: center; justify-content: center; }
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
		box-shadow: inset 0 1px 0 rgba(244, 239, 230, 0.06), 0 20px 40px rgba(0, 0, 0, 0.35);
		animation: appv2-breathe 5.5s ease-in-out infinite;
	}
	.seal.opening { animation: seal-open 0.6s cubic-bezier(0.5, 0, 0.2, 1) forwards; }
	@keyframes seal-open {
		to { transform: translateY(-58%) scale(0.86); opacity: 0; }
	}
	.seal-logo { font-size: 12px; letter-spacing: 0.28em; color: var(--amber-hi); }
	.seal-tag { font-size: 20px; letter-spacing: -0.02em; line-height: 1.24; text-align: center; padding: 0 16px; }
	.seal-badge {
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--ink-muted);
		border: 1px solid rgba(244, 239, 230, 0.2);
		border-radius: 999px;
		padding: 3px 10px;
	}

	/* Beat 2 — Anker */
	.anc-lead {
		font-size: 14px;
		letter-spacing: 0.03em;
		color: var(--ink-muted);
		text-transform: uppercase;
	}
	.anc-num { font-size: clamp(60px, 17vw, 82px); margin-top: 10px; color: var(--ink-text); }
	.anc-unit { font-size: 0.4em; color: var(--ink-muted); margin-left: 8px; letter-spacing: 0; }
	.anc-year { font-size: 44px; color: var(--amber-hi); margin-top: 2px; letter-spacing: -0.02em; }
	.anc-blurb { font-size: 15px; color: var(--ink-muted); margin-top: 14px; max-width: 30ch; }

	/* Beat 3 — Lauf */
	.run-kick { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-muted); }
	.run-num { font-size: clamp(52px, 15vw, 70px); margin-top: 6px; color: var(--ink-text); }
	.run-u { font-size: 0.35em; color: var(--ink-muted); margin-left: 6px; letter-spacing: 0; }
	.run-meta { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; font-size: 14px; color: var(--ink-muted); }
	.run-yr { color: var(--ink-text); font-variant-numeric: tabular-nums; font-size: 16px; }
	.chart { margin-top: 22px; position: relative; }
	.chart svg { width: 100%; height: auto; display: block; overflow: visible; }
	.grid-line { stroke: rgba(244, 239, 230, 0.1); stroke-width: 1; }
	.trend { fill: none; stroke: var(--amber-hi); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 8px rgba(208, 128, 72, 0.4)); }
	.trend-fill { fill: url(#cg); }
	.dot-now { fill: var(--amber-hi); filter: drop-shadow(0 0 6px rgba(208, 128, 72, 0.7)); }
	.axis-lbl { font-family: var(--ff-display); font-weight: 700; font-size: 10px; fill: var(--ink-muted); font-variant-numeric: tabular-nums; }
	.verdict { margin-top: 20px; font-size: 21px; letter-spacing: -0.02em; line-height: 1.2; opacity: 0; transform: translateY(8px); }
	.verdict.on { animation: rise 0.55s cubic-bezier(0.2, 1, 0.3, 1) forwards; }

	/* Beat 4 — Warum */
	.why-para { font-size: 27px; letter-spacing: -0.02em; line-height: 1.14; color: var(--paper-ink); }
	.why-para .hl { color: var(--amber); }
	.why-resolve { margin-top: 18px; font-size: 16.5px; line-height: 1.46; color: var(--paper-ink); }

	/* Beat 5 — Beweis */
	.stamp { margin-top: 0; }
	.src { font-size: 15.5px; color: var(--paper-muted); margin: 22px 0 0; }
	.src-link { margin-top: 12px; display: inline-block; font-size: 13.5px; color: var(--amber); text-decoration: none; }
	.to-wall { margin-top: 16px; font-size: 13px; color: var(--paper-muted); }

	@keyframes rise { to { opacity: 1; transform: none; } }

	@media (prefers-reduced-motion: reduce) {
		.beat { animation: none; }
		.seal { animation: none !important; }
		.seal.opening { opacity: 0; }
		.verdict { opacity: 1 !important; transform: none !important; animation: none !important; }
	}
</style>
