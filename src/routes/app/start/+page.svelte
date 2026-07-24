<script lang="ts">
	// Screen 8 — Tag 1 / Onboarding (aus Exp 3, verifiziert). 6 Beats:
	// Frage → Magic Moment → sichtbare Arbeit → Wenn-Dann-Anker → geschenkte Lichter → Push-Bitte.
	// Verkauft nichts, zeigt. Jeder Beat zahlt auf D7-Retention ein; Push kommt zuletzt.
	// Themen-Beispiele illustrativ (DB-unabhängig) — der erste ECHTE Beleg kommt danach über /app.
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import { CheckCircleIcon, ClockIcon, DevicePhoneMobileIcon, SparklesIcon } from 'heroicons-svelte/24/outline';
	import SkyView from '$lib/app-v2/SkyView.svelte';
	import { collection } from '$lib/app-v2/collection.svelte';
	import { prefs } from '$lib/app-v2/prefs.svelte';
	import { animate, easeOut, prefersReducedMotion } from '$lib/app-v2/motion';
	import { whoosh, thud, chime, tick, haptic } from '$lib/app-v2/audio';

	const reduced = prefersReducedMotion();

	let beat = $state(1);
	const TOTAL = 6;

	// ── Beat 1: Themen-Wahl steuert den ersten illustrativen Beleg ──
	type TopicKey = 'klima' | 'gesundheit' | 'konflikt';
	let topic = $state<TopicKey>('gesundheit');
	const TOPICS: Record<TopicKey, { label: string; icon: typeof SparklesIcon | typeof CheckCircleIcon; answer: string; num: string; unit: string }> = {
		klima: {
			label: 'Klima & Umwelt',
			icon: SparklesIcon,
			answer: 'Seit dem Tief 1990 hat sich das Ozonloch messbar geschlossen — weil die Welt sich an ein Abkommen gehalten hat.',
			num: '−28 %',
			unit: 'FCKW-Ausstoß weltweit fast bei null. Das Ozonloch ist heute kleiner als in den 1980ern.'
		},
		gesundheit: {
			label: 'Krankheit & Gesundheit',
			icon: CheckCircleIcon,
			answer: 'Seit 1990 ist die Zahl der Kinder, die vor ihrem fünften Geburtstag sterben, jedes Jahr gefallen. Nicht ein bisschen.',
			num: '−63 %',
			unit: '12,8 Millionen im Jahr → unter 4,8 Millionen. Jeden Tag rund 19.000 Kinder, die früher gestorben wären.'
		},
		konflikt: {
			label: 'Kriege & Konflikte',
			icon: CheckCircleIcon,
			answer: 'Seit 1990 wurden weltweit über 55 Millionen Landminen aus dem Boden geholt — von Menschen, die dafür jeden Tag rausgehen.',
			num: '−55 Mio',
			unit: 'Ganze Länder sind heute wieder minenfrei. Kambodscha meldet Dörfer, in denen Kinder erstmals frei laufen.'
		}
	};

	// ── Beat 2: Magic Moment ──
	let mmAnswerOn = $state(false);
	let mmNumOn = $state(false);
	let mmUnitOn = $state(false);
	let mmStampGo = $state(false);
	let mmNextReady = $state(false);

	// ── Beat 3: sichtbare Arbeit ──
	let wr = $state([false, false, false]);
	let workNoteOn = $state(false);

	// ── Beat 4: Anker ──
	const ANCHORS = [
		{ key: 'Kaffee', label: 'der erste Kaffee', icon: SparklesIcon, trigger: 'den ersten Kaffee nehme', when: 'beim ersten Kaffee' },
		{ key: 'Bahn', label: 'in der Bahn', icon: DevicePhoneMobileIcon, trigger: 'in die Bahn steige', when: 'in der Bahn' },
		{ key: 'Fruehstueck', label: 'beim Frühstück', icon: SparklesIcon, trigger: 'mich zum Frühstück setze', when: 'beim Frühstück' },
		{ key: 'Aufwachen', label: 'nach dem Aufwachen', icon: ClockIcon, trigger: 'aufwache', when: 'nach dem Aufwachen' }
	];
	let anchorKey = $state<string | null>(null);
	const anchorFormed = $derived(
		anchorKey ? ANCHORS.find((a) => a.key === anchorKey)?.trigger ?? '' : ''
	);

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

	onMount(() => {
		collection.hydrate();
		prefs.hydrate();
	});

	function pickTopic(k: TopicKey) {
		topic = k;
		if (prefs.sound) tick();
		haptic(8);
		T(() => go(2), reduced ? 0 : 340);
	}

	function go(n: number) {
		beat = n;
		if (n === 2) runMagic();
		if (n === 3) runWork();
		if (n === 6 && !reduced) T(() => chime(), 300);
	}

	function runMagic() {
		mmAnswerOn = mmNumOn = mmUnitOn = mmStampGo = mmNextReady = false;
		if (reduced) {
			mmAnswerOn = mmNumOn = mmUnitOn = mmStampGo = mmNextReady = true;
			return;
		}
		T(() => {
			mmAnswerOn = true;
			if (prefs.sound) tick();
		}, 300);
		T(() => {
			mmNumOn = true;
			whoosh();
		}, 1200);
		T(() => (mmUnitOn = true), 1700);
		T(() => {
			mmStampGo = true;
			thud();
			haptic([8, 40, 22]);
			T(() => {
				mmNextReady = true;
				chime();
			}, 300);
		}, 2500);
	}

	function runWork() {
		wr = [false, false, false];
		workNoteOn = false;
		if (reduced) {
			wr = [true, true, true];
			workNoteOn = true;
			return;
		}
		T(() => {
			wr = [true, false, false];
			if (prefs.sound) tick();
		}, 250);
		T(() => {
			wr = [true, true, false];
			if (prefs.sound) tick();
		}, 750);
		T(() => {
			wr = [true, true, true];
			if (prefs.sound) tick();
		}, 1250);
		T(() => (workNoteOn = true), 1800);
	}

	function pickAnchor(key: string) {
		anchorKey = key;
		prefs.setAnchor(key);
		if (prefs.sound) tick();
		haptic(6);
	}

	function advance() {
		clearAll();
		if (beat < TOTAL) {
			haptic(6);
			if (prefs.sound && beat !== 1) whoosh();
			go(beat + 1);
		}
	}

	function finish() {
		prefs.completeOnboarding();
		goto(base + '/app');
	}

	const pushWhen = $derived(
		anchorKey ? 'morgen, ' + (ANCHORS.find((a) => a.key === anchorKey)?.when ?? '') : 'morgen früh'
	);
	const t = $derived(TOPICS[topic]);
</script>

<svelte:head>
	<title>Willkommen · NurEine</title>
	<meta name="theme-color" content="#14110d" />
</svelte:head>

<div
	class="ob"
	role="group"
	aria-label="Willkommen bei NurEine"
	onclick={(e) => {
		// Tap-to-advance nur in reinen Anzeige-Beats (2/3); der Rest hat eigene Buttons.
		if (beat !== 2 && beat !== 3) return;
		const el = e.target as HTMLElement;
		if (el.closest('button, a')) return;
		if (beat === 2 && !mmNextReady) return;
		advance();
	}}
>
	<div class="thread" aria-hidden="true">
		{#each Array(TOTAL) as _, i}<i class:done={i < beat}></i>{/each}
	</div>

	{#if beat === 1}
		<div class="beat surface-ink tex">
			<div class="kick sf">Eine Frage zum Anfang</div>
			<div class="q-lead sf">Was zieht dich in letzter Zeit am meisten runter?</div>
			<p class="q-sub">Ehrlich. Wir drehen es nicht schön — wir zeigen dir, wo sich genau da etwas bewegt.</p>
			<div class="choices">
				{#each Object.entries(TOPICS) as [key, val]}
					<button class="choice sf" type="button" onclick={() => pickTopic(key as TopicKey)}>
						<span class="ch-ico"><Icon icon={val.icon} /></span>{val.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if beat === 2}
		<div class="beat surface-ink tex" class:shake={mmStampGo && !reduced}>
			<div class="kick sf">Dann fangen wir genau hier an</div>
			<p class="mm-answer" class:on={mmAnswerOn}>{t.answer}</p>
			<div class="mm-num num" class:on={mmNumOn} aria-live="polite">{t.num}</div>
			<p class="mm-unit" class:on={mmUnitOn}>{t.unit}</p>
			<div class="mm-stamp" class:on={mmStampGo}><span class="stamp" class:go={mmStampGo}>Belegt.</span></div>
			<div class="hint sf" aria-hidden="true">{mmNextReady ? 'Tippen — wie ihr das prüft' : ''}</div>
		</div>
	{/if}

	{#if beat === 3}
		<div class="beat surface-paper tex">
			<div class="kick amber sf">Warum du das glauben kannst</div>
			<div class="work-lead sf">Für diesen einen Beleg<br />haben wir heute Nacht:</div>
			<div class="work-rows">
				<div class="work-row" class:on={wr[0]}><span class="wn num">137</span><span class="wl">Quellen automatisch gelesen — Studien, Register, UN-Daten</span></div>
				<div class="work-row reject" class:on={wr[1]}><span class="wn num">124</span><span class="wl">davon aussortiert: zu dünn belegt, zu alt, zu reißerisch</span></div>
				<div class="work-row" class:on={wr[2]}><span class="wn num">13</span><span class="wl">blieben übrig. Einer wird dein Morgen.</span></div>
			</div>
			<p class="work-note nr" class:on={workNoteOn}>Kein Redakteur, der gute Laune verordnet. Eine Maschine, die nur das durchlässt, was sich nachprüfen lässt.</p>
			<div class="hint sf dark" aria-hidden="true">Tippen weiter</div>
		</div>
	{/if}

	{#if beat === 4}
		<div class="beat surface-paper tex">
			<div class="kick amber sf">Der Trick, der es hält</div>
			<div class="anc-lead sf">Eine gute Gewohnheit hängt sich am besten an eine, die du schon hast.</div>
			<p class="anc-sub">Wann liest du deinen NurEine-Beleg? Wähle einen Moment, den du eh jeden Morgen hast:</p>
			<div class="anc-chips">
				{#each ANCHORS as a}
					<button class="anc-chip sf" type="button" class:sel={anchorKey === a.key} onclick={() => pickAnchor(a.key)}>
						<span class="ac-ico"><Icon icon={a.icon} /></span>{a.label}
					</button>
				{/each}
			</div>
			{#if anchorKey}
				<div class="anc-formed sf">Abgemacht: <span class="hl">Wenn ich {anchorFormed}, dann NurEine.</span></div>
			{/if}
			<div class="foot">
				<button class="pill" type="button" disabled={!anchorKey} onclick={advance}>Passt</button>
			</div>
		</div>
	{/if}

	{#if beat === 5}
		<div class="beat-sky">
			<SkyView lights={collection.all} total={collection.total} sinceDay={collection.since} />
			<div class="gift-overlay">
				<div class="gift-t1 sf">Drei Lichter geschenkt.</div>
				<p class="gift-t2">
					Pocken ausgerottet. Ozonloch schrumpft. Kindersterblichkeit halbiert. Du steigst mitten in
					eine laufende Erfolgsgeschichte ein — nicht am Anfang.
				</p>
			</div>
			<div class="foot floating">
				<button class="pill" type="button" onclick={advance}>Mein erstes eigenes Licht holen</button>
			</div>
		</div>
	{/if}

	{#if beat === 6}
		<div class="beat surface-ink tex">
			<div class="push-ico" aria-hidden="true"><Icon icon={SparklesIcon} size="2rem" /></div>
			<div class="push-lead sf">Sollen wir dich morgen<br />einmal antippen?</div>
			<p class="push-sub">Ein leiser Hinweis, wenn dein Beleg fertig ist. Kein Feed, kein Nachschub — ein Morgen, einer.</p>
			<div class="push-preview">
				<div class="pp-ico"></div>
				<div>
					<div class="pp-t sf">NurEine</div>
					<div class="pp-b">Dein Morgen ist da. 3 Minuten, dann bist du fertig.</div>
					<div class="pp-when">{pushWhen}</div>
				</div>
			</div>
			<div class="foot">
				<button class="pill" type="button" onclick={finish}>Ja, einmal am Morgen</button>
				<button class="pill quiet" type="button" onclick={finish}>Ohne Erinnerung starten</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.ob {
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
	.kick {
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--amber-hi);
		margin-bottom: 14px;
	}
	.kick.amber { color: var(--amber); }
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
		min-height: 13px;
	}
	.hint.dark { color: var(--paper-ink); }

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
	.pill.quiet {
		background: none;
		border: 1px solid rgba(244, 239, 230, 0.28);
		color: var(--ink-text);
	}
	.foot {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	/* Beat 1 */
	.q-lead { font-size: 27px; letter-spacing: -0.02em; line-height: 1.16; color: var(--ink-text); }
	.q-sub { margin-top: 12px; font-size: 14px; color: var(--ink-muted); max-width: 32ch; }
	.choices { margin-top: 22px; display: flex; flex-direction: column; gap: 10px; }
	.choice {
		text-align: left;
		background: rgba(244, 239, 230, 0.05);
		border: 1px solid rgba(244, 239, 230, 0.16);
		color: var(--ink-text);
		border-radius: 14px;
		padding: 14px 16px;
		cursor: pointer;
		font-size: 14.5px;
		display: flex;
		align-items: center;
		gap: 11px;
		transition: border-color 0.25s, background 0.25s, transform 0.12s;
	}
	.choice:hover { border-color: rgba(208, 128, 72, 0.5); }
	.choice:active { transform: scale(0.985); }
	.ch-ico { font-size: 17px; }

	/* Beat 2 */
	.mm-answer { margin-top: 12px; font-size: 15px; line-height: 1.5; color: var(--ink-text); opacity: 0; }
	.mm-answer.on { animation: fade 0.5s ease forwards; }
	.mm-num { font-size: clamp(58px, 16vw, 80px); margin-top: 18px; color: var(--ink-text); opacity: 0; }
	.mm-num.on { animation: snapin 0.5s cubic-bezier(0.2, 1.3, 0.35, 1) forwards; }
	@keyframes snapin {
		0% { opacity: 0; transform: scale(0.92); filter: blur(4px); }
		60% { transform: scale(1.03); filter: blur(0); }
		100% { opacity: 1; transform: scale(1); }
	}
	.mm-unit { margin-top: 8px; font-size: 14px; color: var(--ink-muted); max-width: 30ch; opacity: 0; }
	.mm-unit.on { animation: fade 0.5s ease 0.1s forwards; }
	.mm-stamp { margin-top: 22px; opacity: 0; }
	.mm-stamp.on { opacity: 1; }

	/* Beat 3 */
	.work-lead { font-size: 24px; letter-spacing: -0.02em; line-height: 1.16; color: var(--paper-ink); }
	.work-rows { margin-top: 22px; display: flex; flex-direction: column; gap: 14px; }
	.work-row { display: flex; align-items: baseline; gap: 12px; opacity: 0; transform: translateY(6px); }
	.work-row.on { animation: rise 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
	.work-row .wn { letter-spacing: -0.03em; font-size: 34px; min-width: 66px; color: var(--paper-ink); }
	.work-row .wl { font-size: 13.5px; color: var(--paper-muted); line-height: 1.4; }
	.work-row.reject .wn { color: var(--rose); }
	.work-note { margin-top: 22px; font-size: 15px; color: var(--paper-muted); opacity: 0; }
	.work-note.on { animation: fade 0.5s ease forwards; }

	/* Beat 4 */
	.anc-lead { font-size: 23px; letter-spacing: -0.02em; line-height: 1.18; color: var(--paper-ink); }
	.anc-sub { margin-top: 12px; font-size: 13.5px; color: var(--paper-muted); max-width: 32ch; }
	.anc-chips { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 9px; }
	.anc-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 10px 15px;
		cursor: pointer;
		font-size: 13.5px;
		color: var(--paper-ink);
		transition: border-color 0.25s, background 0.25s, transform 0.12s;
	}
	.anc-chip:hover { border-color: var(--amber); }
	.anc-chip.sel { border-color: var(--amber); background: rgba(189, 106, 53, 0.12); }
	.anc-chip:active { transform: scale(0.97); }
	.ac-ico { font-size: 15px; }
	.anc-formed { margin-top: 22px; font-size: 17px; letter-spacing: -0.01em; line-height: 1.3; color: var(--paper-ink); animation: fade 0.45s ease; }
	.anc-formed .hl { color: var(--amber); }

	/* Beat 5 (sky) */
	.beat-sky { position: relative; min-height: 100dvh; }
	.gift-overlay {
		position: absolute;
		left: 28px;
		right: 28px;
		top: 40%;
		transform: translateY(-50%);
		z-index: 4;
		text-align: center;
	}
	.gift-t1 { font-size: 21px; letter-spacing: -0.02em; color: var(--ink-text); }
	.gift-t2 { margin-top: 12px; font-size: 14px; line-height: 1.5; color: var(--ink-muted); max-width: 34ch; margin-inline: auto; }
	.foot.floating {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 6;
		margin: 0;
		padding: 0 26px max(34px, env(safe-area-inset-bottom));
	}

	/* Beat 6 */
	.push-ico {
		width: 70px;
		height: 70px;
		border-radius: 19px;
		margin: 0 auto 22px;
		background: radial-gradient(circle at 42% 38%, rgba(232, 166, 104, 0.98), rgba(156, 85, 39, 0.9));
		box-shadow: 0 0 44px rgba(208, 128, 72, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 34px;
		animation: appv2-breathe 12s ease-in-out infinite;
	}
	.push-lead { text-align: center; font-size: 23px; letter-spacing: -0.02em; line-height: 1.2; color: var(--ink-text); }
	.push-sub { text-align: center; font-size: 14px; color: var(--ink-muted); margin: 10px auto 0; max-width: 30ch; line-height: 1.5; }
	.push-preview {
		margin: 22px auto 0;
		max-width: 320px;
		background: rgba(244, 239, 230, 0.06);
		border: 1px solid rgba(244, 239, 230, 0.16);
		border-radius: 15px;
		padding: 12px 14px;
		display: flex;
		gap: 11px;
		align-items: flex-start;
	}
	.pp-ico { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(150deg, #e8a668, #bd6a35); flex-shrink: 0; }
	.pp-t { font-size: 12.5px; color: var(--ink-text); }
	.pp-b { font-size: 12px; color: var(--ink-muted); margin-top: 2px; line-height: 1.4; }
	.pp-when { font-size: 10.5px; color: var(--ink-faint); margin-top: 5px; letter-spacing: 0.06em; }

	@keyframes fade { to { opacity: 1; } }
	@keyframes rise { to { opacity: 1; transform: none; } }

	@media (prefers-reduced-motion: reduce) {
		.beat { animation: none; }
		.push-ico { animation: none !important; }
		.mm-answer, .mm-num, .mm-unit, .mm-stamp, .work-row, .work-note, .anc-formed { opacity: 1 !important; transform: none !important; animation: none !important; }
	}
</style>
