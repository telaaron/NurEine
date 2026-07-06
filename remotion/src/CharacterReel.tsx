import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, continueRender, delayRender } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { CANVAS, INK, AMBER, AMBER_DEEP, accentFor, FF, FONTS } from './brand';
import { NewspaperScene, type NewspaperProps } from './scenes/NewspaperScene';
import { PaperTextureOverlay } from './scenes/paper-textures';
import { Character, CharacterBubble, type Pose } from './character/Character';
import { CountUpNumber } from './components/brand-graphics';

/**
 * Charakter-Reel: der "Terracotta Man" führt durch eine Nachricht.
 * Dramaturgie:
 *   1) Newspaper fliegt rein (framt: das ist eine Nachricht)
 *   2) Character taucht auf, zeigt nach oben: "Kurz aufatmen —"
 *   3) Zahl zählt hoch, Character zeigt zur Seite auf die Zahl
 *   4) Character denkt/erklärt die Auflösung
 *   5) Endcard: Character winkt, schickbare Zeile
 */

export const CHAR_REEL_FPS = 30;
export const CHAR_REEL_DURATION = 540; // 18s — jede Phase hält länger, damit lesbar

export interface CharacterReelProps {
	news: NewspaperProps;
	heroNumber: string;
	heroUnit: string | null;
	hookLine: string; // was der Character beim Hook sagt
	aufloesung: string;
	shareHook: string;
	category: string;
	seed: string;
}

export const charReelDefault: CharacterReelProps = {
	news: {
		kicker: 'INNOVATION · AFRIKA',
		headline: '50 Millionen Menschen haben zum ersten Mal Strom',
		standfirst: 'Eine Initiative bringt Leitungen in 40 Länder — der größte Netz-Ausbau der Geschichte.',
		dateLabel: 'Dienstag, 1. Juli 2026',
		image: 'backgrounds/flux/sky-quiet.png',
		category: 'innovation',
		texture: 'halftone',
		sceneBg: 'dark-vignette'
	},
	heroNumber: '50 Mio',
	heroUnit: 'Menschen',
	hookLine: 'Kurz aufatmen — hier ist mal eine gute.',
	aufloesung: '50 Millionen Menschen in Afrika haben zum ersten Mal Strom — über eine Initiative in 40 Ländern.',
	shareHook: 'Stell dir vor: 50 Millionen Menschen sehen zum ersten Mal abends Licht.',
	category: 'innovation',
	seed: 'demo-char-50mio'
};

let ready = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('cr-fonts'));
	React.useEffect(() => {
		if (ready) return continueRender(h);
		Promise.all([
			loadFont({ family: FF.grotesk, url: FONTS.grotesk }),
			loadFont({ family: FF.interSemi, url: FONTS.interSemi }),
			loadFont({ family: FF.inter, url: FONTS.inter }),
			loadFont({ family: FF.newsreader, url: FONTS.newsreader })
		]).then(() => { ready = true; continueRender(h); }).catch(() => continueRender(h));
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

// IG-Safe-Zones (px bei 1920 Höhe): oben Profil/Ton, unten Caption/Buttons.
const SAFE_TOP = 230;
const SAFE_BOTTOM = 400; // IG blendet unten Buttons/Caption ein
const MARGIN = 80;

// Bühnen-Hintergrund — jetzt hell/on-brand (Cutouts brauchen keine BG-Angleichung).
const Stage: React.FC<{ category: string; children: React.ReactNode }> = ({ category, children }) => {
	const accent = accentFor(category);
	const frame = useCurrentFrame();
	const glowY = interpolate(Math.sin(frame / 80), [-1, 1], [42, 56]);
	return (
		<AbsoluteFill style={{ background: `linear-gradient(165deg, ${CANVAS} 0%, #ece2d1 100%)`, overflow: 'hidden' }}>
			<AbsoluteFill style={{ background: `radial-gradient(95% 62% at 50% ${glowY}%, ${accent}22, transparent 72%)` }} />
			<PaperTextureOverlay kind="halftone" opacity={0.06} />
			{children}
		</AbsoluteFill>
	);
};

// Text-Block, der von unten einfliegt (Einheitliche Bewegung über alle Screens).
const FlyInText: React.FC<{ startFrame?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ startFrame = 2, children, style }) => {
	const s = spring({ frame: useCurrentFrame() - startFrame, fps: CHAR_REEL_FPS, config: { damping: 15, mass: 0.7, stiffness: 110 } });
	const y = interpolate(s, [0, 1], [46, 0]);
	const op = interpolate(s, [0, 0.4], [0, 1]);
	return <div style={{ transform: `translateY(${y}px)`, opacity: op, ...style }}>{children}</div>;
};

// ── Phase 2: Character stellt vor (zeigt nach oben) ─────────────────────────
const IntroChar: React.FC<CharacterReelProps> = (p) => (
	<Stage category={p.category}>
		{/* Character GRÖSSER, prominent mittig */}
		<Character pose="point-up" enterFrame={0} from="bottom" size={1240} seed={p.seed} />
		{/* Sprechblase direkt über/neben dem Kopf, Zeiger deutet zu ihm hinunter.
		    Der Kopf des point-up-Characters liegt bei ~52% Höhe, Mitte-rechts. */}
		<CharacterBubble text={p.hookLine} startFrame={14} x={90} y={640} accent={accentFor(p.category)} />
	</Stage>
);

// ── Phase 3: Zahl zählt hoch, Character zeigt nach oben drauf ───────────────
const NumberChar: React.FC<CharacterReelProps> = (p) => {
	const accent = accentFor(p.category);
	const frame = useCurrentFrame();
	const lineW = interpolate(spring({ frame: frame - 10, fps: CHAR_REEL_FPS, config: { damping: 200 } }), [0, 1], [0, 560]);
	return (
		<Stage category={p.category}>
			{/* Zahl im oberen Safe-Bereich, groß */}
			<div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: SAFE_TOP + 20 }}>
				<CountUpNumber value={p.heroNumber} unit={p.heroUnit} category={p.category} startFrame={6} />
				<div style={{ height: 8, background: accent, marginTop: 20, width: lineW, borderRadius: 8 }} />
			</div>
			{/* Character groß unten, zeigt hoch zur Zahl */}
			<Character pose="point-up" enterFrame={0} from="bottom" size={1080} seed={p.seed} />
		</Stage>
	);
};

// ── Phase 4: Auflösung — Character liest/erklärt rechts, Text links ─────────
const AufloesungChar: React.FC<CharacterReelProps> = (p) => (
	<Stage category={p.category}>
		<Character pose="reading" enterFrame={0} from="right" size={1000} align="right" seed={p.seed} />
		<FlyInText style={{ position: 'absolute', left: MARGIN, right: 300, top: SAFE_TOP + 30 }}>
			<div style={{ width: 96, height: 7, background: accentFor(p.category), marginBottom: 36 }} />
			<div style={{ fontFamily: FF.newsreader, fontSize: 64, color: INK, lineHeight: 1.3 }}>{p.aufloesung}</div>
		</FlyInText>
	</Stage>
);

// ── Phase 5: Endcard — Character winkt, schickbare Zeile + CTA ──────────────
const EndcardChar: React.FC<CharacterReelProps> = (p) => {
	const accent = accentFor(p.category);
	const frame = useCurrentFrame();
	const pulse = 1 + 0.03 * Math.sin((frame / CHAR_REEL_FPS) * Math.PI * 2);
	return (
		<Stage category={p.category}>
			<Character pose="wave" enterFrame={0} from="bottom" size={1000} align="right" seed={p.seed} />
			<FlyInText style={{ position: 'absolute', left: MARGIN, right: 300, top: SAFE_TOP + 20 }}>
				<div style={{ fontFamily: FF.grotesk, fontSize: p.shareHook.length <= 60 ? 72 : 60, fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{p.shareHook}</div>
			</FlyInText>
			{/* CTA im Safe-Bereich (nicht ganz unten, wo IG-Buttons sind) */}
			<div style={{ position: 'absolute', left: MARGIN, bottom: SAFE_BOTTOM, transform: `scale(${pulse})`, transformOrigin: 'left center' }}>
				<div style={{ display: 'flex', alignItems: 'center', height: 96, background: accent, borderRadius: 60, padding: '0 46px' }}>
					<div style={{ fontFamily: FF.interSemi, fontSize: 34, color: '#fff' }}>An jemanden schicken ↗</div>
				</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, color: AMBER_DEEP, marginTop: 22 }}>nureine.de</div>
			</div>
		</Stage>
	);
};

export const CharacterReel: React.FC<CharacterReelProps> = (p) => {
	useFonts();
	const music = 'audio/calm-1.wav';
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<Audio src={staticFile(music)} volume={(f) => interpolate(f, [0, 20, CHAR_REEL_DURATION - 30, CHAR_REEL_DURATION], [0, 0.26, 0.26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
			<Sequence from={100} durationInFrames={20}><Audio src={staticFile('audio/fx/whoosh.wav')} volume={0.4} /></Sequence>
			<Sequence from={236} durationInFrames={20}><Audio src={staticFile('audio/fx/settle.wav')} volume={0.5} /></Sequence>

			{/* 1) Newspaper (0–110) */}
			<Sequence durationInFrames={110}>
				<FadeOutTail len={110} tail={16}><NewspaperScene {...p.news} /></FadeOutTail>
			</Sequence>
			{/* 2) Character Intro (100–230) — Zeit zum Lesen der Sprechblase */}
			<Sequence from={100} durationInFrames={130}>
				<FadeInHead head={16}><FadeOutTail len={130} tail={16}><IntroChar {...p} /></FadeOutTail></FadeInHead>
			</Sequence>
			{/* 3) Zahl (224–360) */}
			<Sequence from={224} durationInFrames={136}>
				<FadeInHead head={16}><FadeOutTail len={136} tail={16}><NumberChar {...p} /></FadeOutTail></FadeInHead>
			</Sequence>
			{/* 4) Auflösung (354–470) — längster Text, hält am längsten */}
			<Sequence from={354} durationInFrames={116}>
				<FadeInHead head={16}><FadeOutTail len={116} tail={16}><AufloesungChar {...p} /></FadeOutTail></FadeInHead>
			</Sequence>
			{/* 5) Endcard (464–540) */}
			<Sequence from={464} durationInFrames={76}>
				<FadeInHead head={16}><EndcardChar {...p} /></FadeInHead>
			</Sequence>
		</AbsoluteFill>
	);
};
