import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	Audio,
	Img,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	spring,
	interpolate,
	continueRender,
	delayRender,
	CalculateMetadataFunction
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { CANVAS, PAPER, INK, AMBER, AMBER_DEEP, MUTED, accentFor, FF, FONTS } from './brand';
import { Character, type Pose } from './character/Character';
import { CountUpNumber } from './components/brand-graphics';
import { PaperTextureOverlay } from './scenes/paper-textures';

/**
 * ReelDaily — das tägliche NurEine-Reel (v3, Juli 2026).
 *
 * Regeln aus dem IG-Research (Juni/Juli 2026):
 *  - Hook-Text steht ab FRAME 0 (3-Sekunden-Drop-off ist die dominante Metrik;
 *    On-Screen-Text ist SEO-Signal). Kein Logo-Intro.
 *  - Szenenwechsel alle ~2-3s mit hartem Kontrast (hell→dunkel→hell).
 *  - 15-30s gesamt, Ende schließt visuell an den Anfang an (Loop).
 *  - Sends sind das Top-Ranking-Signal → Endcard = expliziter Schick-CTA.
 *  - Beleg/Quelle als sichtbares Stilmittel (USP: kein Good-News-Account zeigt
 *    Evidenz im Format) — Stempel-Szene "Belegt."
 *  - Figur ("Terracotta Man") als Marken-Element in Nebenrolle, NICHT als
 *    sprechender Avatar (Glaubwürdigkeitsrisiko lt. Research).
 *  - Optionales KI-Voiceover mit wortsynchronen Captions; Kennzeichnung
 *    "Stimme: KI" im Endcard (EU-KI-VO Art. 50 / IG-Policy).
 *
 * Alle Szenen-Timings kommen aus den Props (render.mjs berechnet sie aus
 * Textlänge bzw. VO-Wort-Timestamps) — die Komposition ist rein deklarativ.
 */

export const DAILY_FPS = 30;

export type DailyScene =
	| { kind: 'hook'; start: number; dur: number; text: string; punch: string; kicker: string }
	| { kind: 'number'; start: number; dur: number; value: string; unit: string | null; context: string }
	| { kind: 'beat'; start: number; dur: number; text: string; image: string | null; pose: Pose }
	| { kind: 'proof'; start: number; dur: number; source: string; impact: number | null }
	| { kind: 'end'; start: number; dur: number; share: string; cta: string; hasVo: boolean };

export interface CaptionWord {
	t: string;
	start: number; // Frame
	end: number; // Frame
}

export interface ReelDailyProps {
	scenes: DailyScene[];
	category: string;
	seed: string;
	voFile: string | null; // Datei unter public/ (z.B. "vo/slug.mp3")
	musicFile: string; // z.B. "audio/hope-1.wav"
	words: CaptionWord[] | null;
	durationInFrames: number;
}

export const reelDailyDefault: ReelDailyProps = {
	scenes: [
		{ kind: 'hook', start: 0, dur: 80, text: '50 Millionen Menschen haben zum ersten Mal Strom.', punch: '50 Millionen', kicker: 'GUTE NACHRICHT · INNOVATION' },
		{ kind: 'number', start: 80, dur: 70, value: '50 Mio', unit: 'Menschen', context: 'bekommen Strom — über eine Initiative in 40 Ländern.' },
		{ kind: 'beat', start: 150, dur: 90, text: 'Der größte Netz-Ausbau der Geschichte — quer durch Afrika.', image: null, pose: 'point-side' },
		{ kind: 'proof', start: 240, dur: 60, source: 'Weltbank', impact: 87 },
		{ kind: 'end', start: 300, dur: 90, share: 'Stell dir vor: 50 Millionen Menschen sehen zum ersten Mal abends Licht.', cta: 'Schick’s jemandem, der das heute braucht', hasVo: false }
	],
	category: 'innovation',
	seed: 'demo',
	voFile: null,
	musicFile: 'audio/hope-1.wav',
	words: null,
	durationInFrames: 390
};

export const calcReelDailyMetadata: CalculateMetadataFunction<ReelDailyProps> = ({ props }) => ({
	durationInFrames: Math.max(90, props.durationInFrames),
	fps: DAILY_FPS
});

// ── Fonts ────────────────────────────────────────────────────────────────────
let fontsReady = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('daily-fonts'));
	React.useEffect(() => {
		if (fontsReady) return continueRender(h);
		Promise.all([
			loadFont({ family: FF.grotesk, url: FONTS.grotesk }),
			loadFont({ family: FF.interSemi, url: FONTS.interSemi }),
			loadFont({ family: FF.inter, url: FONTS.inter }),
			loadFont({ family: FF.newsreader, url: FONTS.newsreader })
		]).then(() => { fontsReady = true; continueRender(h); }).catch(() => continueRender(h));
	}, [h]);
}

// IG-Safe-Zones bei 1080×1920
const SAFE_TOP = 210;
const SAFE_BOTTOM = 420;
const M = 84; // Seitenrand

// ── Szene 1: HOOK — Text steht ab Frame 0, Punch-Wort bekommt Marker-Sweep ──
const HookScene: React.FC<Extract<DailyScene, { kind: 'hook' }>> = ({ text, punch, kicker }) => {
	const frame = useCurrentFrame();
	const accent = AMBER;
	// Settle: minimal größer starten, kein Fade — Text ist SOFORT lesbar.
	const settle = interpolate(frame, [0, 14], [1.035, 1], { extrapolateRight: 'clamp' });
	// Marker-Sweep hinter dem Punch-Wort (Frame 6-20)
	const sweep = interpolate(frame, [6, 22], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const size = text.length <= 55 ? 108 : text.length <= 85 ? 92 : 78;

	// Text in Teile zerlegen, Punch-Wort markieren
	const idx = punch ? text.toLowerCase().indexOf(punch.toLowerCase()) : -1;
	const pre = idx >= 0 ? text.slice(0, idx) : text;
	const hit = idx >= 0 ? text.slice(idx, idx + punch.length) : '';
	const post = idx >= 0 ? text.slice(idx + punch.length) : '';

	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.05} />
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 40, display: 'flex', alignItems: 'center' }}>
				<div style={{ width: 14, height: 14, background: accent, borderRadius: 2, marginRight: 16 }} />
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, letterSpacing: '0.14em', color: MUTED }}>{kicker}</div>
			</div>
			{/* Vertikal zentriert zwischen Kicker und Footer — kein toter Raum */}
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 220, bottom: SAFE_BOTTOM + 120, display: 'flex', alignItems: 'center', transform: `scale(${settle})`, transformOrigin: 'left center' }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: Math.round(size * 1.12), lineHeight: 1.08, letterSpacing: '-0.03em', color: INK }}>
					{pre}
					{hit ? (
						<span style={{ position: 'relative', whiteSpace: 'pre-wrap' }}>
							<span style={{ position: 'absolute', left: '-0.08em', right: `${100 - sweep}%`, top: '0.12em', bottom: '0.02em', background: `${accent}55`, borderRadius: 6, zIndex: 0 }} />
							<span style={{ position: 'relative', zIndex: 1 }}>{hit}</span>
						</span>
					) : null}
					{post}
				</div>
			</div>
			<div style={{ position: 'absolute', left: M, bottom: SAFE_BOTTOM, fontFamily: FF.interSemi, fontSize: 28, color: MUTED }}>
				NurEine · belegt statt behauptet
			</div>
		</AbsoluteFill>
	);
};

// ── Szene 2: ZAHL — harter Kontrast (dunkel), Count-up ──────────────────────
const NumberScene: React.FC<Extract<DailyScene, { kind: 'number' }> & { category: string }> = ({ value, unit, context, category }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const lineW = interpolate(spring({ frame: frame - 8, fps: DAILY_FPS, config: { damping: 200 } }), [0, 1], [0, 620]);
	const ctxOp = interpolate(frame, [14, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const ctxY = interpolate(frame, [14, 30], [26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ background: INK }}>
			<AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 30%, ${accent}33, transparent 70%)` }} />
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 170 }}>
				<CountUpNumber value={value} unit={unit} category={category} startFrame={2} />
				<div style={{ height: 10, background: accent, marginTop: 30, width: lineW, borderRadius: 8 }} />
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 66, lineHeight: 1.12, letterSpacing: '-0.02em', color: '#fff', marginTop: 44, opacity: ctxOp, transform: `translateY(${ctxY}px)` }}>
					{context}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Szene 3: BEAT — Bild-Panel (editorial) + Zeile + Figur klein ────────────
const BeatScene: React.FC<Extract<DailyScene, { kind: 'beat' }> & { category: string; seed: string }> = ({ text, image, pose, category, seed }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const panelS = spring({ frame: frame - 2, fps: DAILY_FPS, config: { damping: 15, mass: 0.8, stiffness: 120 } });
	const panelY = interpolate(panelS, [0, 1], [90, 0]);
	const panelOp = interpolate(panelS, [0, 0.35], [0, 1]);
	// langsamer Ken-Burns-Zoom im Bild
	const zoom = 1 + frame * 0.0011;
	const textS = spring({ frame: frame - 8, fps: DAILY_FPS, config: { damping: 16, mass: 0.7 } });
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.05} />
			{image ? (
				<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 30, height: 760, transform: `translateY(${panelY}px) rotate(-1.4deg)`, opacity: panelOp, background: PAPER, padding: 22, boxShadow: '0 30px 70px rgba(60,40,20,0.25)', borderRadius: 6 }}>
					<div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 3 }}>
						<Img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />
					</div>
					<div style={{ position: 'absolute', bottom: 30, left: 34, fontFamily: FF.inter, fontSize: 22, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>Illustration: KI · NurEine</div>
				</div>
			) : null}
			<div style={{ position: 'absolute', left: M, right: image ? M : 320, top: image ? SAFE_TOP + 850 : SAFE_TOP + 170, transform: `translateY(${interpolate(textS, [0, 1], [40, 0])}px)`, opacity: interpolate(textS, [0, 0.4], [0, 1]) }}>
				<div style={{ width: 96, height: 8, background: accent, marginBottom: 30, borderRadius: 4 }} />
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: image ? 60 : 78, lineHeight: 1.12, letterSpacing: '-0.025em', color: INK }}>{text}</div>
			</div>
			{!image ? <Character pose={pose} enterFrame={0} from="bottom" size={860} align="right" seed={seed} /> : null}
		</AbsoluteFill>
	);
};

// ── Szene 4: BELEG — Stempel "Belegt." + Quelle + Wirkungsindex ─────────────
const ProofScene: React.FC<Extract<DailyScene, { kind: 'proof' }> & { category: string }> = ({ source, impact, category }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	// Stempel: knallt von groß auf Position (wie ein echter Stempelabdruck)
	const stamp = spring({ frame: frame - 4, fps: DAILY_FPS, config: { damping: 13, mass: 0.6, stiffness: 190 } });
	const stampScale = interpolate(stamp, [0, 1], [2.1, 1]);
	const stampOp = interpolate(stamp, [0, 0.25], [0, 1]);
	const rowOp = interpolate(frame, [16, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const barW = interpolate(spring({ frame: frame - 20, fps: DAILY_FPS, config: { damping: 200 } }), [0, 1], [0, Math.min(100, Math.max(8, impact ?? 0))]);
	return (
		<AbsoluteFill style={{ background: PAPER }}>
			<PaperTextureOverlay kind="halftone" opacity={0.06} />
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 230, transform: `scale(${stampScale}) rotate(-4deg)`, transformOrigin: 'left center', opacity: stampOp }}>
				<div style={{ display: 'inline-block', border: `10px solid ${accent}`, borderRadius: 14, padding: '10px 38px' }}>
					<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 150, letterSpacing: '-0.03em', color: accent, lineHeight: 1 }}>Belegt.</div>
				</div>
			</div>
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 620, opacity: rowOp }}>
				<div style={{ fontFamily: FF.newsreader, fontSize: 52, color: INK, lineHeight: 1.3 }}>Quelle: {source}</div>
				{impact != null ? (
					<div style={{ marginTop: 52 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
							<div style={{ fontFamily: FF.interSemi, fontSize: 32, color: MUTED }}>Wirkungsindex</div>
							<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 40, color: INK }}>{impact}/100</div>
						</div>
						<div style={{ width: '100%', height: 18, borderRadius: 18, background: 'rgba(22,20,15,0.1)', overflow: 'hidden' }}>
							<div style={{ width: `${barW}%`, height: 18, borderRadius: 18, background: accent }} />
						</div>
					</div>
				) : null}
				<div style={{ fontFamily: FF.inter, fontSize: 30, color: MUTED, marginTop: 40 }}>Jede Story nachgeprüft — Methodik auf nureine.de</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Szene 5: ENDCARD — Share-Zeile + Schick-CTA + Follow + Loop-Anschluss ───
const EndScene: React.FC<Extract<DailyScene, { kind: 'end' }> & { category: string; seed: string }> = ({ share, cta, hasVo, category, seed }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const s = spring({ frame: frame - 2, fps: DAILY_FPS, config: { damping: 15, mass: 0.7 } });
	const pulse = 1 + 0.03 * Math.sin((frame / DAILY_FPS) * Math.PI * 2.2);
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.05} />
			<div style={{ position: 'absolute', left: M, right: 300, top: SAFE_TOP + 120, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`, opacity: interpolate(s, [0, 0.4], [0, 1]) }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: share.length <= 70 ? 72 : 58, lineHeight: 1.1, letterSpacing: '-0.03em', color: INK }}>{share}</div>
			</div>
			<Character pose="wave" enterFrame={4} from="bottom" size={740} align="right" seed={seed} />
			{/* CTA-Block ÜBER der Figur (zIndex) und schmaler, damit nichts überlappt */}
			<div style={{ position: 'absolute', left: M, right: 330, bottom: SAFE_BOTTOM, transform: `scale(${pulse})`, transformOrigin: 'left center', zIndex: 5 }}>
				<div style={{ display: 'inline-flex', alignItems: 'center', height: 100, background: accent, borderRadius: 60, padding: '0 46px', boxShadow: '0 16px 40px rgba(60,40,20,0.28)' }}>
					<div style={{ fontFamily: FF.interSemi, fontSize: 36, color: '#fff' }}>{cta} ↗</div>
				</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, color: AMBER_DEEP, marginTop: 24 }}>@nureine.de — jeden Tag eine belegte gute Nachricht</div>
				<div style={{ fontFamily: FF.inter, fontSize: 22, color: MUTED, marginTop: 14 }}>{hasVo ? 'Illustration & Stimme: KI · ' : 'Illustration: KI · '}Kuratiert von Menschen</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Captions (Karaoke, nur mit VO) ──────────────────────────────────────────
const Captions: React.FC<{ words: CaptionWord[] }> = ({ words }) => {
	const frame = useCurrentFrame();
	// Chunks à max 4 Wörter; aktueller Chunk wird angezeigt, aktives Wort amber.
	const chunks: CaptionWord[][] = [];
	for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4));
	const current = chunks.find((c) => frame >= c[0].start && frame <= c[c.length - 1].end + 8);
	if (!current) return null;
	return (
		<div style={{ position: 'absolute', left: 60, right: 60, bottom: SAFE_BOTTOM + 30, display: 'flex', justifyContent: 'center' }}>
			<div style={{ background: 'rgba(22,20,15,0.82)', borderRadius: 18, padding: '18px 30px', maxWidth: 940 }}>
				<div style={{ fontFamily: FF.interSemi, fontSize: 42, lineHeight: 1.25, color: '#fff', textAlign: 'center' }}>
					{current.map((w, i) => (
						<span key={i} style={{ color: frame >= w.start ? (frame <= w.end ? AMBER : '#fff') : 'rgba(255,255,255,0.45)' }}>
							{w.t}{' '}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};

// ── Haupt-Komposition ───────────────────────────────────────────────────────
export const ReelDaily: React.FC<ReelDailyProps> = (p) => {
	useFonts();
	const total = p.durationInFrames;
	const musicVol = p.voFile ? 0.16 : 0.3;
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<Audio
				src={staticFile(p.musicFile)}
				volume={(f) => interpolate(f, [0, 16, total - 26, total], [0, musicVol, musicVol, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
			/>
			{p.voFile ? <Audio src={staticFile(p.voFile)} volume={1} /> : null}

			{p.scenes.map((sc, i) => (
				<Sequence key={i} from={sc.start} durationInFrames={sc.dur}>
					{sc.kind === 'hook' ? <HookScene {...sc} /> : null}
					{sc.kind === 'number' ? <NumberScene {...sc} category={p.category} /> : null}
					{sc.kind === 'beat' ? <BeatScene {...sc} category={p.category} seed={p.seed} /> : null}
					{sc.kind === 'proof' ? <ProofScene {...sc} category={p.category} /> : null}
					{sc.kind === 'end' ? <EndScene {...sc} category={p.category} seed={p.seed} /> : null}
				</Sequence>
			))}

			{p.words && p.words.length > 0 ? <Captions words={p.words} /> : null}
		</AbsoluteFill>
	);
};
