import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AMBER, INK, FF, accentFor } from '../brand';
import { IconCheck } from '../icons';

/**
 * Marken-Grafik-Bausteine (animiert, deterministisch): Logo-Intro/Outro,
 * Badge-Familie, Daten-Vokabular (Count-up, Balken, Vorher-Nachher, Mini-Chart).
 */

// ── Leuchtturm-Logo (SVG) mit Lichtkegel ────────────────────────────────────
const Lighthouse: React.FC<{ size: number; beam: number; color: string }> = ({ size, beam, color }) => (
	<svg width={size} height={size} viewBox="0 0 48 48" fill="none">
		{/* Lichtkegel */}
		<path d="M24 14 L2 6 L2 22 Z" fill={AMBER} opacity={beam * 0.5} />
		<path d="M24 14 L46 6 L46 22 Z" fill={AMBER} opacity={beam * 0.5} />
		{/* Turm */}
		<path d="M18 44 L20 18 L28 18 L30 44 Z" fill={color} />
		<rect x="19" y="24" width="10" height="3" fill={AMBER} />
		<rect x="18.5" y="32" width="11" height="3" fill={AMBER} />
		{/* Laterne */}
		<rect x="20" y="12" width="8" height="7" rx="1" fill={color} />
		<circle cx="24" cy="15.5" r="2.2" fill={AMBER} opacity={0.6 + beam * 0.4} />
		<path d="M21 12 L24 8 L27 12 Z" fill={color} />
	</svg>
);

/** Logo-Intro: Turm rutscht hoch, Lichtkegel pulst, Wortmarke fadet. */
export const LogoIntro: React.FC<{ onDark?: boolean }> = ({ onDark = true }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
	const y = interpolate(s, [0, 1], [40, 0]);
	const beam = interpolate(Math.sin(frame / 6), [-1, 1], [0.4, 1]);
	const wordOp = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: 'clamp' });
	const color = onDark ? '#fff' : INK;
	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${y}px)`, opacity: interpolate(s, [0, 0.3], [0, 1]) }}>
			<Lighthouse size={150} beam={beam} color={color} />
			<div style={{ fontFamily: FF.grotesk, fontSize: 56, fontWeight: 700, color, letterSpacing: '-0.02em', marginTop: 20, opacity: wordOp }}>NurEine</div>
			<div style={{ fontFamily: FF.interSemi, fontSize: 26, color: onDark ? 'rgba(255,255,255,0.55)' : AMBER, letterSpacing: '0.1em', marginTop: 10, opacity: wordOp }}>GUTE NACHRICHTEN · BELEGT</div>
		</div>
	);
};

/** Kleine Logo-Wortmarke oben (für die Reel-Phasen). */
export const LogoLockup: React.FC<{ onDark: boolean }> = ({ onDark }) => {
	const color = onDark ? '#fff' : INK;
	return (
		<div style={{ display: 'flex', alignItems: 'center' }}>
			<Lighthouse size={44} beam={0.8} color={color} />
			<div style={{ fontFamily: FF.grotesk, fontSize: 34, fontWeight: 700, color, letterSpacing: '-0.02em', marginLeft: 12 }}>NurEine</div>
		</div>
	);
};

/** Badge-Pill, die ab startFrame reinsnappt. */
export const Badge: React.FC<{ text: string; startFrame: number; accent: string }> = ({ text, startFrame, accent }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = spring({ frame: frame - startFrame, fps, config: { damping: 12, mass: 0.5, stiffness: 140 } });
	const scale = interpolate(s, [0, 0.7, 1], [0.4, 1.08, 1]);
	const op = interpolate(s, [0, 0.4], [0, 1]);
	return (
		<div style={{ display: 'flex', alignItems: 'center', height: 56, background: accent, borderRadius: 56, padding: '0 26px', transform: `scale(${scale})`, opacity: op }}>
			<div style={{ display: 'flex', width: 26, height: 26, marginRight: 12, color: '#fff' }}>
				<IconCheck size={26} color="#fff" strokeWidth={3} />
			</div>
			<div style={{ fontFamily: FF.interSemi, fontSize: 28, color: '#fff' }}>{text}</div>
		</div>
	);
};

/** Count-up-Zahl mit Motion-Blur + Settle-Punch. */
export const CountUpNumber: React.FC<{ value: string; unit: string | null; category: string; startFrame?: number }> = ({ value, unit, category, startFrame = 0 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const prog = spring({ frame: frame - startFrame, fps, config: { damping: 14, mass: 0.6, stiffness: 90 } });
	const m = value.match(/^([\d.,]+)(.*)$/);
	const target = m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : null;
	const suffix = m ? m[2] : '';
	// Dezimalstellen der Eingabe beibehalten: "3,69 Mio" zählte sonst auf
	// gerundete "4 Mio" hoch (falsche Zahl im Bild!).
	const decimals = m && m[1].includes(',') ? (m[1].split(',')[1] || '').length : 0;
	const shown =
		target !== null
			? interpolate(prog, [0, 1], [0, target]).toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
			: value;
	const blur = interpolate(prog, [0, 0.7, 1], [10, 2, 0]);
	const scale = interpolate(prog, [0, 0.85, 1], [0.7, 1.08, 1]);
	const size = value.length <= 4 ? 360 : value.length <= 7 ? 260 : 190;
	return (
		<div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
			<div style={{ fontFamily: FF.grotesk, fontSize: size, fontWeight: 700, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.04em', filter: `blur(${blur}px)`, transform: `scale(${scale})`, transformOrigin: 'left center' }}>{shown}</div>
			{unit ? <div style={{ fontFamily: FF.interSemi, fontSize: 52, color: 'rgba(255,255,255,0.92)', marginLeft: 24 }}>{unit}</div> : null}
		</div>
	);
};

/** Fortschrittsbalken, füllt sich ab startFrame. */
export const ProgressBar: React.FC<{ pct: number; startFrame: number; accent: string; label?: string }> = ({ pct, startFrame, accent, label }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = spring({ frame: frame - startFrame, fps, config: { damping: 200 } });
	const w = interpolate(s, [0, 1], [0, Math.max(4, Math.min(100, pct))]);
	return (
		<div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
			{label ? <div style={{ fontFamily: FF.interSemi, fontSize: 28, color: '#fff', marginBottom: 12 }}>{label}</div> : null}
			<div style={{ display: 'flex', width: '100%', height: 20, borderRadius: 20, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
				<div style={{ display: 'flex', width: `${w}%`, height: 20, borderRadius: 20, background: accent }} />
			</div>
		</div>
	);
};

/** Vorher→Nachher-Slider (zwei Zahlen mit Pfeil, animiert). */
export const BeforeAfter: React.FC<{ before: string; after: string; startFrame: number; accent: string }> = ({ before, after, startFrame, accent }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = spring({ frame: frame - startFrame, fps, config: { damping: 16 } });
	const afterOp = interpolate(s, [0.3, 1], [0, 1], { extrapolateLeft: 'clamp' });
	const afterX = interpolate(s, [0.3, 1], [40, 0], { extrapolateLeft: 'clamp' });
	return (
		<div style={{ display: 'flex', alignItems: 'center' }}>
			<div style={{ fontFamily: FF.grotesk, fontSize: 120, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{before}</div>
			<div style={{ fontFamily: FF.grotesk, fontSize: 80, color: accent, margin: '0 30px' }}>→</div>
			<div style={{ fontFamily: FF.grotesk, fontSize: 150, fontWeight: 700, color: '#fff', opacity: afterOp, transform: `translateX(${afterX}px)` }}>{after}</div>
		</div>
	);
};
