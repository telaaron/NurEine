import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { CANVAS, INK, MUTED, AMBER, AMBER_DEEP, accentFor, FF } from '../brand';

/**
 * DREI Character-Konzepte zum Vergleich (isolierte Szenen).
 * Alle nur visuell (Sprechblase), kein Voiceover. Der User wählt danach eins.
 *   A) Leuchtturm-Maskottchen (on-brand)
 *   B) Papier-Origami-Vogel (passt zum Paper-Look)
 *   C) Abstrakter Erzähler (Lichtpunkt + zeichnende Linie)
 */

const CHAR_LINE = 'Diese Nachricht ist echt — und belegt.';

// Sprechblase, die reinsnappt + leicht atmet.
const SpeechBubble: React.FC<{ text: string; startFrame: number; x: number; y: number; accent?: string }> = ({ text, startFrame, x, y, accent = INK }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = spring({ frame: frame - startFrame, fps, config: { damping: 12, mass: 0.5, stiffness: 130 } });
	const scale = interpolate(s, [0, 0.7, 1], [0, 1.06, 1]);
	return (
		<div style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})`, transformOrigin: 'left bottom', opacity: interpolate(s, [0, 0.3], [0, 1]) }}>
			<div style={{ position: 'relative', background: '#fff', borderRadius: 28, padding: '26px 34px', maxWidth: 620, boxShadow: '0 14px 40px rgba(0,0,0,0.18)' }}>
				<div style={{ fontFamily: FF.interSemi, fontSize: 38, color: accent, lineHeight: 1.25 }}>{text}</div>
				<div style={{ position: 'absolute', bottom: -16, left: 40, width: 0, height: 0, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderTop: '20px solid #fff' }} />
			</div>
		</div>
	);
};

// ── A) Leuchtturm-Maskottchen ───────────────────────────────────────────────
export const CharLighthouse: React.FC<{ category?: string }> = ({ category = 'innovation' }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
	const bob = Math.sin(frame / 14) * 8; // leichtes Wippen
	const blink = frame % 90 < 4 ? 0.1 : 1; // blinzeln
	const beamSweep = Math.sin(frame / 20) * 10;
	const accent = accentFor(category);
	const x = interpolate(enter, [0, 1], [-300, 0]);
	return (
		<AbsoluteFill style={{ background: `linear-gradient(160deg, ${CANVAS}, #efe7d8)` }}>
			<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
				<div style={{ transform: `translateX(${x}px) translateY(${bob}px)` }}>
					<svg width={340} height={480} viewBox="0 0 68 96">
						{/* Lichtkegel */}
						<g transform={`rotate(${beamSweep} 34 26)`}>
							<path d="M34 26 L2 12 L2 40 Z" fill={AMBER} opacity={0.35} />
							<path d="M34 26 L66 12 L66 40 Z" fill={AMBER} opacity={0.35} />
						</g>
						{/* Körper (Turm) */}
						<path d="M22 92 L26 40 L42 40 L46 92 Z" fill="#fff" stroke={INK} strokeWidth={1.5} />
						<rect x="24.5" y="52" width="19" height="6" fill={accent} />
						<rect x="23" y="70" width="22" height="6" fill={accent} />
						{/* Laternenkopf */}
						<rect x="26" y="20" width="16" height="16" rx="2" fill="#fff" stroke={INK} strokeWidth={1.5} />
						<path d="M25 20 L34 10 L43 20 Z" fill={AMBER_DEEP} />
						{/* Gesicht (Augen auf der Laterne) */}
						<circle cx="31" cy="28" r="1.8" fill={INK} opacity={blink} />
						<circle cx="37" cy="28" r="1.8" fill={INK} opacity={blink} />
						<path d="M31 32 Q34 34 37 32" stroke={INK} strokeWidth={1.2} fill="none" strokeLinecap="round" />
						{/* Licht in der Laterne */}
						<circle cx="34" cy="24" r="2.5" fill={AMBER} opacity={0.5 + Math.sin(frame / 8) * 0.3} />
					</svg>
				</div>
			</AbsoluteFill>
			<SpeechBubble text={CHAR_LINE} startFrame={22} x={560} y={620} accent={INK} />
			<Label text="A · Leuchtturm-Maskottchen" />
		</AbsoluteFill>
	);
};

// ── B) Papier-Origami-Vogel ─────────────────────────────────────────────────
export const CharOrigami: React.FC<{ category?: string }> = ({ category = 'klima' }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
	const fly = interpolate(enter, [0, 1], [-400, 0]);
	const flap = Math.sin(frame / 6) * 14; // Flügelschlag
	const bob = Math.sin(frame / 10) * 10;
	const accent = accentFor(category);
	return (
		<AbsoluteFill style={{ background: `linear-gradient(160deg, ${CANVAS}, #eae2d4)` }}>
			<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
				<div style={{ transform: `translateX(${fly}px) translateY(${bob}px)` }}>
					<svg width={380} height={340} viewBox="0 0 76 68">
						{/* Körper (gefaltetes Papier — Facetten) */}
						<polygon points="24,40 48,32 44,52 28,54" fill="#fff" stroke={INK} strokeWidth={1} />
						<polygon points="48,32 62,38 44,52" fill="#f0e9db" stroke={INK} strokeWidth={1} />
						{/* Kopf */}
						<polygon points="24,40 14,34 26,30" fill="#fff" stroke={INK} strokeWidth={1} />
						<polygon points="14,34 8,36 18,30" fill={accent} />
						{/* Auge */}
						<circle cx="20" cy="35" r="1.6" fill={INK} />
						{/* Flügel (schlägt) */}
						<g transform={`rotate(${flap} 44 40)`}>
							<polygon points="40,38 68,22 52,48" fill={accent} stroke={INK} strokeWidth={1} opacity={0.92} />
						</g>
						{/* Schwanz */}
						<polygon points="44,52 30,64 40,50" fill="#f0e9db" stroke={INK} strokeWidth={1} />
					</svg>
				</div>
			</AbsoluteFill>
			<SpeechBubble text={CHAR_LINE} startFrame={24} x={520} y={640} accent={INK} />
			<Label text="B · Papier-Origami-Vogel" />
		</AbsoluteFill>
	);
};

// ── C) Abstrakter Erzähler (Lichtpunkt + Linie) ─────────────────────────────
export const CharAbstract: React.FC<{ category?: string }> = ({ category = 'wissenschaft' }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const accent = accentFor(category);
	// Lichtpunkt zeichnet eine Linie, „hüpft" beim Sprechen.
	const draw = spring({ frame, fps, config: { damping: 200 } });
	const pathLen = interpolate(draw, [0, 1], [0, 300]);
	const pulse = 1 + Math.sin(frame / 5) * 0.25;
	const dotY = 480 + Math.sin(frame / 6) * 10;
	return (
		<AbsoluteFill style={{ background: '#16140f' }}>
			<AbsoluteFill style={{ background: `radial-gradient(60% 50% at 30% 50%, ${accent}33, #16140f 75%)` }} />
			<svg width={1080} height={1920} style={{ position: 'absolute' }}>
				<path d={`M 240 720 q 150 -120 300 0`} fill="none" stroke={accent} strokeWidth={6} strokeLinecap="round" strokeDasharray={300} strokeDashoffset={300 - pathLen} />
			</svg>
			{/* der „Erzähler" — leuchtender Punkt */}
			<div style={{ position: 'absolute', left: 240, top: dotY, width: 44, height: 44, borderRadius: 44, background: accent, transform: `scale(${pulse})`, boxShadow: `0 0 60px 20px ${accent}88` }} />
			<SpeechBubble text={CHAR_LINE} startFrame={20} x={330} y={520} accent={INK} />
			<Label text="C · Abstrakter Erzähler" dark />
		</AbsoluteFill>
	);
};

const Label: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
	<div style={{ position: 'absolute', bottom: 60, left: 0, width: 1080, textAlign: 'center', fontFamily: FF.interSemi, fontSize: 30, color: dark ? 'rgba(255,255,255,0.7)' : MUTED }}>{text}</div>
);
