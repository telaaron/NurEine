// Klang & Haptik von NurEine — live per Web Audio synthetisiert, KEINE Sample-Dateien.
//
// Warum synthetisiert statt "einen satisfying Sound suchen":
//   1. 0 Bytes Transfer. Ein Pack mit Mikro-Sounds sind schnell 200–500 KB — für
//      eine Seite, die schon einmal am Egress-Limit hing, die falsche Richtung.
//   2. Lizenzfrei und für immer unsere. Kein Freesound-Autor, keine Attribution.
//   3. Parametrierbar: derselbe "Tick" kann 40 Tonhöhen haben (siehe countTick) —
//      mit Samples bräuchte das 40 Dateien oder klänge nach Detune-Matsch.
//
// DIE REGEL, die alles zusammenhält (sonst wird es Gepiepse):
//   Alles klingt in C-Dur-Pentatonik (C D E G A). Egal welcher Sound wann feuert —
//   zwei zufällig überlappende Töne sind nie dissonant. Das ist der Grund, warum
//   das Ganze "satisfying" wirkt und nicht nach UI-Alarm.
//
// Not-Boring-Regel: nie zweimal exakt identisch (leichte Zufalls-Varianz).
// Funktioniert immer auch stumm — Klang ist opt-in (Aarons v1-Default: aus).
//
// Übernommen aus den Prototypen exp2-kurve / exp3-onboarding (dort inline JS),
// seit 2026-08-26 gemeinsame Basis für App UND Website (vorher app-v2/audio.ts).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;

/** C-Dur-Pentatonik ab C5 — die harmonische Grundlage aller Stimmen. */
export const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0];

/**
 * Gesamt-Lautstärke. Bewusst leise: Mikro-Sounds sollen unter der Wahrnehmungs-
 * schwelle "mitlaufen", nicht ansagen. Wer sie bewusst hört, hört sie zu laut.
 */
const MASTER_GAIN = 0.5;

function ac(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		try {
			const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			ctx = new AC();
		} catch {
			ctx = null;
		}
	}
	return ctx;
}

/**
 * Master-Bus. Alle Stimmen hängen hier dran statt direkt an destination —
 * so gibt es einen einzigen Punkt für Lautstärke und ein sauberes Fade-out.
 */
function bus(): AudioNode | null {
	const c = ac();
	if (!c) return null;
	if (!master) {
		master = c.createGain();
		master.gain.value = MASTER_GAIN;
		master.connect(c.destination);
	}
	return master;
}

/**
 * Darf gerade geklungen werden? Zentrale Stelle für ALLE Stimmen — eine
 * vergessene Prüfung in einer einzelnen Stimme wäre sonst ein Ton, den der
 * Nutzer nie erlaubt hat.
 *
 * Respektiert zusätzlich prefers-reduced-motion: wer Bewegung reduziert, will
 * in aller Regel auch keine begleitenden Effektgeräusche.
 */
function canPlay(): boolean {
	if (!enabled) return false;
	if (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		return false;
	}
	return true;
}

/** Klang an/aus. Muss aus einer User-Geste heraus aktiviert werden (Autoplay-Policy). */
export function setSoundEnabled(on: boolean): void {
	enabled = on;
	if (on) {
		const c = ac();
		if (c && c.state === 'suspended') void c.resume();
	}
}

export function isSoundEnabled(): boolean {
	return enabled;
}

/** Leichte Zufalls-Varianz (±cents), damit nichts zweimal exakt gleich klingt. */
function vary(freq: number, cents = 12): number {
	return freq * Math.pow(2, ((Math.random() * 2 - 1) * cents) / 1200);
}

function noiseBuffer(c: AudioContext, dur: number): AudioBuffer {
	const n = Math.floor(c.sampleRate * dur);
	const b = c.createBuffer(1, n, c.sampleRate);
	const data = b.getChannelData(0);
	for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
	return b;
}

/** Whoosh — Aufdecken / Anlauf des Stempels. */
export function whoosh(): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;
	const b = noiseBuffer(c, 0.42);
	const s = c.createBufferSource();
	s.buffer = b;
	const f = c.createBiquadFilter();
	f.type = 'bandpass';
	f.Q.value = 0.8;
	f.frequency.setValueAtTime(400, c.currentTime);
	f.frequency.exponentialRampToValueAtTime(2600, c.currentTime + 0.34);
	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.16, c.currentTime + 0.08);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.42);
	s.connect(f);
	f.connect(g);
	g.connect(out);
	s.start();
}

/** Bass-Thud — der Settle-Moment des Stempels (einer aufs Halbe gepitcht = Bass). */
export function thud(): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;
	const o = c.createOscillator();
	o.type = 'sine';
	o.frequency.setValueAtTime(180, c.currentTime);
	o.frequency.exponentialRampToValueAtTime(52, c.currentTime + 0.16);
	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.012);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.34);
	o.connect(g);
	g.connect(out);
	o.start();
	o.stop(c.currentTime + 0.36);
	// Click-Transiente oben drauf
	const b = noiseBuffer(c, 0.06);
	const s = c.createBufferSource();
	s.buffer = b;
	const hp = c.createBiquadFilter();
	hp.type = 'highpass';
	hp.frequency.value = 1800;
	const g2 = c.createGain();
	g2.gain.setValueAtTime(0.22, c.currentTime);
	g2.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
	s.connect(hp);
	hp.connect(g2);
	g2.connect(out);
	s.start();
}

/** Zwei-Ton-Chime — Abschluss / geschenktes Licht (warm, nie triumphal). */
export function chime(): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;
	[523.25, 783.99].forEach((fr, i) => {
		const o = c.createOscillator();
		o.type = 'sine';
		o.frequency.value = fr;
		const g = c.createGain();
		const t = c.currentTime + i * 0.09;
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(0.11, t + 0.04);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
		o.connect(g);
		g.connect(out);
		o.start(t);
		o.stop(t + 0.72);
	});
}

/** Leiser Tick — Mikro-Feedback bei Beat-Wechseln. */
export function tick(): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;
	const o = c.createOscillator();
	o.type = 'triangle';
	o.frequency.value = 660;
	const g = c.createGain();
	g.gain.setValueAtTime(0.06, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
	o.connect(g);
	g.connect(out);
	o.start();
	o.stop(c.currentTime + 0.06);
}

/** Haptik (nur Mobilgeräte mit Vibration-API). */
export function haptic(pattern: number | number[]): void {
	if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
		try {
			navigator.vibrate(pattern);
		} catch {
			// ignoriert — Vibration ist Zusatz, nie kritisch
		}
	}
}

/** Der komplette Stempel-Moment: Whoosh → (Settle) Thud + Haptik. */
export function stampSound(): void {
	whoosh();
	setTimeout(() => {
		thud();
		haptic([8, 40, 22]);
	}, 340);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mikro-Stimmen (2026-08-26) — Live-Updates & hochdrehende Zahlen.
// Alle in der Pentatonik, alle unter 0.09 Gain: sie sollen die Bewegung
// begleiten, nicht kommentieren.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ein Tick der hochlaufenden Zahl. `progress` (0..1) steigt die Pentatonik
 * hinauf — DAS ist der "satisfying"-Effekt: das Ohr hört, dass die Zahl auf ein
 * Ziel zuläuft, und bekommt beim Einrasten die Auflösung.
 *
 * Wichtig: NICHT pro Frame aufrufen (60/s wäre ein Sägezahn-Ton). Die Zähl-
 * Animation ruft es ~12× über die Laufzeit auf — siehe countUpSound().
 */
export function countTick(progress: number): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;

	const p = Math.max(0, Math.min(1, progress));
	// Über die Pentatonik + eine Oktave: Stufe wächst mit dem Fortschritt.
	const step = Math.floor(p * (PENTATONIC.length * 2 - 1));
	const base = PENTATONIC[step % PENTATONIC.length];
	const freq = step >= PENTATONIC.length ? base * 2 : base;

	const o = c.createOscillator();
	o.type = 'triangle';
	o.frequency.value = vary(freq, 8);

	const g = c.createGain();
	// Leiser Start, zum Ziel hin minimal präsenter (Spannungsaufbau).
	const peak = 0.018 + p * 0.022;
	g.gain.setValueAtTime(peak, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.045);

	o.connect(g);
	g.connect(out);
	o.start();
	o.stop(c.currentTime + 0.05);
}

/**
 * Das Einrasten am Ende einer Zahl: Quinte drunter, weich — die Auflösung nach
 * dem Anstieg. Ohne diesen Schluss klingt die Tonleiter "abgeschnitten".
 */
export function countLand(): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;

	[PENTATONIC[0], PENTATONIC[3]].forEach((fr, i) => {
		const o = c.createOscillator();
		o.type = 'sine';
		o.frequency.value = vary(fr, 5);
		const g = c.createGain();
		const t = c.currentTime + i * 0.05;
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(0.075, t + 0.02);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
		o.connect(g);
		g.connect(out);
		o.start(t);
		o.stop(t + 0.57);
	});
	haptic(8);
}

/**
 * Lichtpuls — ein neuer Live-Eintrag trifft ein. Sehr kurz, sehr weich, mit
 * Tiefpass: kein "Notification-Bing", eher ein Tropfen. Zufällige Stufe aus der
 * Pentatonik, damit eine Serie von Updates wie ein Mobile klingt statt wie ein
 * Wecker.
 */
export function livePulse(): void {
	const c = ac();
	if (!c || !canPlay()) return;
	const out = bus();
	if (!out) return;

	const fr = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];

	const o = c.createOscillator();
	o.type = 'sine';
	o.frequency.setValueAtTime(vary(fr * 2, 10), c.currentTime);
	// Minimal fallend — nimmt dem Ton das Digitale.
	o.frequency.exponentialRampToValueAtTime(vary(fr, 10), c.currentTime + 0.28);

	const lp = c.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.value = 2400;

	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.055, c.currentTime + 0.015);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.42);

	o.connect(lp);
	lp.connect(g);
	g.connect(out);
	o.start();
	o.stop(c.currentTime + 0.44);
}
