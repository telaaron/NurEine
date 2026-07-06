import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, continueRender, delayRender, Sequence } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { AMBER, INK, FF, FONTS, accentFor } from '../brand';
import { GradientMesh } from '../backgrounds';

/**
 * SZENE: Logo-Intro (Marken-Rahmen, ~1.5s / 45f).
 * Isolierte Composition zum Feinschliff in Remotion Studio.
 *
 * Design-Ziele (Iteration): der Leuchtturm soll sich anfühlen wie „Licht geht an" —
 * Turm baut sich auf, Lichtkegel schwingt/pulst, Strahl-Sweep, dann Wortmarke.
 * Kurz, edel, wiedererkennbar. Kein Effekt-Feuerwerk.
 */

export const LOGO_INTRO_DURATION = 60; // 2s @30 zum Feilen (im Reel später kürzer)

let loaded = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('logo-fonts'));
	React.useEffect(() => {
		if (loaded) return continueRender(h);
		Promise.all([loadFont({ family: FF.grotesk, url: FONTS.grotesk }), loadFont({ family: FF.interSemi, url: FONTS.interSemi })])
			.then(() => { loaded = true; continueRender(h); })
			.catch(() => continueRender(h));
	}, [h]);
}

// Der Leuchtturm, aufbaubar (draw-Anteil) + Licht.
const Lighthouse: React.FC<{ size: number; build: number; beam: number; sweep: number }> = ({ size, build, beam, sweep }) => {
	const towerClip = interpolate(build, [0, 1], [100, 0]); // von unten aufbauen (clip von oben)
	return (
		<svg width={size} height={size} viewBox="0 0 48 48" fill="none">
			<defs>
				<clipPath id="towerReveal">
					<rect x="0" y={towerClip * 0.48} width="48" height="48" />
				</clipPath>
				<radialGradient id="beamGlow" cx="50%" cy="30%" r="60%">
					<stop offset="0%" stopColor={AMBER} stopOpacity={0.9 * beam} />
					<stop offset="100%" stopColor={AMBER} stopOpacity="0" />
				</radialGradient>
			</defs>

			{/* Lichtschein hinter der Laterne */}
			<circle cx="24" cy="15" r="20" fill="url(#beamGlow)" />

			{/* Lichtkegel, schwenkt leicht (sweep in Grad) */}
			<g transform={`rotate(${sweep} 24 15)`}>
				<path d="M24 15 L2 5 L2 25 Z" fill={AMBER} opacity={beam * 0.45} />
				<path d="M24 15 L46 5 L46 25 Z" fill={AMBER} opacity={beam * 0.45} />
			</g>

			{/* Turm — baut sich von unten auf */}
			<g clipPath="url(#towerReveal)">
				<path d="M18 44 L20 18 L28 18 L30 44 Z" fill="#fff" />
				<rect x="19" y="24" width="10" height="3" fill={AMBER} />
				<rect x="18.5" y="32" width="11" height="3" fill={AMBER} />
				<rect x="20" y="12" width="8" height="7" rx="1" fill="#fff" />
				<path d="M21 12 L24 8 L27 12 Z" fill="#fff" />
			</g>
			{/* Laternen-Licht (immer sichtbar, pulst) */}
			<circle cx="24" cy="15.5" r="2.4" fill={AMBER} opacity={0.6 + beam * 0.4} />
		</svg>
	);
};

export const LogoIntroScene: React.FC<{ category?: string }> = ({ category = 'innovation' }) => {
	useFonts();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Aufbau des Turms (spring)
	const build = spring({ frame, fps, config: { damping: 16, mass: 0.8 } });
	// Licht „geht an" ab Frame 10, dann Dauer-Puls
	const litOn = interpolate(frame, [10, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const beam = litOn * interpolate(Math.sin((frame - 20) / 5), [-1, 1], [0.7, 1]);
	// Lichtkegel schwenkt einmal sanft durch
	const sweep = interpolate(frame, [14, 44], [-12, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => t * t * (3 - 2 * t) });
	// leichter Auftrieb der ganzen Gruppe
	const groupY = interpolate(build, [0, 1], [30, 0]);
	// Wortmarke fadet nach dem Licht
	const wordOp = interpolate(frame, [22, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const wordY = interpolate(frame, [22, 36], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<GradientMesh category={category} />
			{/* leichte Abdunklung, damit das Logo-Licht wirkt */}
			<AbsoluteFill style={{ background: 'radial-gradient(80% 60% at 50% 42%, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />
			<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${groupY}px)`, opacity: interpolate(build, [0, 0.25], [0, 1]) }}>
					<Lighthouse size={180} build={build} beam={beam} sweep={sweep} />
					<div style={{ fontFamily: FF.grotesk, fontSize: 60, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginTop: 24, opacity: wordOp, transform: `translateY(${wordY}px)` }}>NurEine</div>
					<div style={{ fontFamily: FF.interSemi, fontSize: 27, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginTop: 12, opacity: wordOp, transform: `translateY(${wordY}px)` }}>GUTE NACHRICHTEN · BELEGT</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
