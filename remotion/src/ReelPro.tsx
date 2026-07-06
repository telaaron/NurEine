import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	Audio,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	spring,
	interpolate,
	continueRender,
	delayRender
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { AMBER, AMBER_DEEP, CANVAS, INK, MUTED, accentFor, FF, FONTS } from './brand';
import { GradientMesh, PaperTexture, DriftingBlobs } from './backgrounds';
import { LogoIntro, LogoLockup, Badge, CountUpNumber } from './components/brand-graphics';
import { categoryIcon } from './icons';
import { MUSIC_LOOPS, pickByHash } from './assets-manifest';

export const PRO_FPS = 30;
// Dichter geschnitten: Intro 1.2s · Zahl 3.3s · Auflösung 3.5s · Endcard 3.0s = ~11s
export const PRO_DURATION = 330;

export interface ReelProProps {
	hook: string;
	heroNumber: string;
	heroUnit: string | null;
	aufloesung: string;
	shareHook: string;
	place: string | null;
	category: string;
	evidenceLabel: string;
	seed: string; // Story-id für deterministische Musik-Rotation
}

export const reelProDefault: ReelProProps = {
	hook: 'Zum ersten Mal haben 50 Millionen Menschen Strom.',
	heroNumber: '50 Mio',
	heroUnit: 'Menschen',
	aufloesung: '50 Millionen Menschen in Afrika haben zum ersten Mal Strom — über eine Initiative in 40 Ländern.',
	shareHook: 'Stell dir vor: 50 Millionen Menschen sehen zum ersten Mal abends Licht.',
	place: 'Afrika',
	category: 'innovation',
	evidenceLabel: 'Belegt',
	seed: 'demo-50mio'
};

let fontsReady = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('fonts'));
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

const FadeInHead: React.FC<{ head: number; children: React.ReactNode }> = ({ head, children }) => {
	const op = interpolate(useCurrentFrame(), [0, head], [0, 1], { extrapolateRight: 'clamp' });
	return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};
const FadeOutTail: React.FC<{ len: number; tail: number; children: React.ReactNode }> = ({ len, tail, children }) => {
	const op = interpolate(useCurrentFrame(), [len - tail, len], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

// ── Phase 1: Logo-Intro ─────────────────────────────────────────────────────
const IntroPhase: React.FC<ReelProProps> = (p) => (
	<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
		<GradientMesh category={p.category} />
		<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
			<LogoIntro onDark />
		</AbsoluteFill>
	</AbsoluteFill>
);

// ── Phase 2: Zahl zählt hoch (mit Kategorie-Icon + Badge) ───────────────────
const NumberPhase: React.FC<ReelProProps> = (p) => {
	const accent = accentFor(p.category);
	const Icon = categoryIcon(p.category);
	const lineW = interpolate(spring({ frame: useCurrentFrame() - 8, fps: PRO_FPS, config: { damping: 200 } }), [0, 1], [0, 1600]);
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<GradientMesh category={p.category} />
			<AbsoluteFill style={{ padding: 72 }}>
				{/* Top: Lockup + Ort + Kategorie-Icon */}
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<LogoLockup onDark />
					<div style={{ flex: 1 }} />
					<div style={{ display: 'flex', width: 60, height: 60, color: 'rgba(255,255,255,0.85)' }}><Icon size={60} color="rgba(255,255,255,0.85)" /></div>
				</div>
				{p.place ? <div style={{ fontFamily: FF.interSemi, fontSize: 28, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginTop: 20 }}>{p.place.toUpperCase()}</div> : null}
				<div style={{ flex: 1 }} />
				{/* Zahl */}
				<CountUpNumber value={p.heroNumber} unit={p.heroUnit} category={p.category} startFrame={4} />
				<div style={{ height: 6, background: accent, marginTop: 28, width: lineW, maxWidth: '100%' }} />
				<div style={{ fontFamily: FF.newsreader, fontSize: 44, color: 'rgba(255,255,255,0.9)', lineHeight: 1.25, marginTop: 34, maxWidth: 880 }}>{p.hook}</div>
				<div style={{ flex: 1 }} />
				{/* Beleg-Badge snappt rein */}
				<Badge text={p.evidenceLabel} startFrame={45} accent={accent} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ── Phase 3: Auflösung (Slide-Snap) ─────────────────────────────────────────
const AufloesungPhase: React.FC<ReelProProps> = (p) => {
	const accent = accentFor(p.category);
	const s = spring({ frame: useCurrentFrame() - 2, fps: PRO_FPS, config: { damping: 14, mass: 0.7, stiffness: 110 } });
	const y = interpolate(s, [0, 1], [70, 0]);
	return (
		<AbsoluteFill style={{ backgroundColor: CANVAS }}>
			<PaperTexture category={p.category} tone="light" />
			<AbsoluteFill style={{ padding: 72, justifyContent: 'center' }}>
				<div style={{ width: 84, height: 6, background: accent, marginBottom: 40 }} />
				<div style={{ fontFamily: FF.newsreader, fontSize: 56, color: INK, lineHeight: 1.3, transform: `translateY(${y}px)`, opacity: interpolate(s, [0, 0.4], [0, 1]) }}>{p.aufloesung}</div>
			</AbsoluteFill>
			<div style={{ position: 'absolute', left: 72, right: 72, bottom: 90, display: 'flex', alignItems: 'center' }}>
				<div style={{ width: 1, height: 1 }} />
				<div style={{ fontFamily: FF.interSemi, fontSize: 26, color: accent }}>Nachgeprüft · belegt</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Phase 4: Endcard (schickbar, CTA pulst) ─────────────────────────────────
const EndcardPhase: React.FC<ReelProProps> = (p) => {
	const accent = accentFor(p.category);
	const frame = useCurrentFrame();
	const pulse = 1 + 0.03 * Math.sin((frame / PRO_FPS) * Math.PI * 2);
	const op = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ background: `linear-gradient(160deg, ${CANVAS} 0%, #efe7d8 100%)` }}>
			<DriftingBlobs category={p.category} tone="light" />
			<div style={{ position: 'absolute', top: 72, left: 72 }}><LogoLockup onDark={false} /></div>
			<AbsoluteFill style={{ padding: '0 72px', justifyContent: 'center', opacity: op }}>
				<div style={{ fontFamily: FF.grotesk, fontSize: p.shareHook.length <= 60 ? 64 : 52, fontWeight: 700, color: INK, lineHeight: 1.12, letterSpacing: '-0.03em' }}>{p.shareHook}</div>
			</AbsoluteFill>
			<div style={{ position: 'absolute', left: 72, right: 72, bottom: 150 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 96, background: accent, borderRadius: 60, transform: `scale(${pulse})` }}>
					<div style={{ fontFamily: FF.interSemi, fontSize: 34, color: '#fff' }}>An jemanden schicken ↗</div>
				</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, color: AMBER_DEEP, textAlign: 'center', marginTop: 28 }}>nureine.de</div>
			</div>
		</AbsoluteFill>
	);
};

// ── ReelPro (volle Composition mit Audio) ───────────────────────────────────
export const ReelPro: React.FC<ReelProProps> = (p) => {
	useFonts();
	const music = pickByHash(MUSIC_LOOPS, p.seed);
	// Phasen-Längen (Frames): Intro 40, Zahl 100, Auflösung 105, Endcard 90 (mit Überlappung)
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			{/* Musik-Bett (leise, gefadet) */}
			{music ? <Audio src={staticFile(music.file)} volume={(f) => interpolate(f, [0, 20, PRO_DURATION - 30, PRO_DURATION], [0, 0.28, 0.28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} /> : null}
			{/* FX: Settle beim Zahl-Einrasten (~Frame 40+18), Whoosh bei Cuts */}
			<Sequence from={58} durationInFrames={20}><Audio src={staticFile('audio/fx/settle.wav')} volume={0.5} /></Sequence>
			<Sequence from={85} durationInFrames={12}><Audio src={staticFile('audio/fx/ping.wav')} volume={0.4} /></Sequence>
			<Sequence from={140} durationInFrames={16}><Audio src={staticFile('audio/fx/whoosh.wav')} volume={0.4} /></Sequence>
			<Sequence from={245} durationInFrames={16}><Audio src={staticFile('audio/fx/whoosh.wav')} volume={0.35} /></Sequence>

			{/* Video-Phasen */}
			<Sequence durationInFrames={48}><FadeOutTail len={48} tail={12}><IntroPhase {...p} /></FadeOutTail></Sequence>
			<Sequence from={40} durationInFrames={110}><FadeInHead head={14}><FadeOutTail len={110} tail={16}><NumberPhase {...p} /></FadeOutTail></FadeInHead></Sequence>
			<Sequence from={144} durationInFrames={110}><FadeInHead head={16}><FadeOutTail len={110} tail={16}><AufloesungPhase {...p} /></FadeOutTail></FadeInHead></Sequence>
			<Sequence from={248} durationInFrames={82}><FadeInHead head={16}><EndcardPhase {...p} /></FadeInHead></Sequence>
		</AbsoluteFill>
	);
};
