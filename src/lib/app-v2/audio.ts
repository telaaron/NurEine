// Klang & Haptik der Beweis-Schicht — live per Web Audio synthetisiert.
// Not-Boring-Regel: nie zweimal exakt identisch. Nur der Stempel klingt; sonst Stille.
// Funktioniert immer auch stumm (Klang ist opt-in, siehe Aarons v1-Default).
//
// Übernommen aus den Prototypen exp2-kurve / exp3-onboarding (dort inline JS).

let ctx: AudioContext | null = null;
let enabled = false;

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
	if (!c || !enabled) return;
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
	g.connect(c.destination);
	s.start();
}

/** Bass-Thud — der Settle-Moment des Stempels (einer aufs Halbe gepitcht = Bass). */
export function thud(): void {
	const c = ac();
	if (!c || !enabled) return;
	const o = c.createOscillator();
	o.type = 'sine';
	o.frequency.setValueAtTime(180, c.currentTime);
	o.frequency.exponentialRampToValueAtTime(52, c.currentTime + 0.16);
	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.012);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.34);
	o.connect(g);
	g.connect(c.destination);
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
	g2.connect(c.destination);
	s.start();
}

/** Zwei-Ton-Chime — Abschluss / geschenktes Licht (warm, nie triumphal). */
export function chime(): void {
	const c = ac();
	if (!c || !enabled) return;
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
		g.connect(c.destination);
		o.start(t);
		o.stop(t + 0.72);
	});
}

/** Leiser Tick — Mikro-Feedback bei Beat-Wechseln. */
export function tick(): void {
	const c = ac();
	if (!c || !enabled) return;
	const o = c.createOscillator();
	o.type = 'triangle';
	o.frequency.value = 660;
	const g = c.createGain();
	g.gain.setValueAtTime(0.06, c.currentTime);
	g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
	o.connect(g);
	g.connect(c.destination);
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
