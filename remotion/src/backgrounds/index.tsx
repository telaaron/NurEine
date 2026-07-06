import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, random, Img, staticFile } from 'remotion';
import { accentFor, CANVAS, INK } from '../brand';

/**
 * Bewegte Hintergründe (prozedural, deterministisch — nur useCurrentFrame/random(seed),
 * KEINE CSS-Animation/Date/Math.random). Drei Varianten laut Interview:
 *   PaperTexture · GradientMesh · DriftingBlobs
 * Plus FluxBackground (Ken-Burns über ein generiertes FLUX-Standbild).
 */

// ── Papier-Textur (SVG-Rauschen + langsames Wabern) ─────────────────────────
export const PaperTexture: React.FC<{ category: string; tone?: 'light' | 'dark' }> = ({ category, tone = 'light' }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const base = tone === 'dark' ? '#16140f' : CANVAS;
	// sehr langsames Wabern der Textur (Skalierung + Verschiebung)
	const scale = interpolate(Math.sin(frame / 90), [-1, 1], [1.0, 1.06]);
	const tx = interpolate(Math.sin(frame / 120), [-1, 1], [-14, 14]);
	return (
		<AbsoluteFill style={{ backgroundColor: base, overflow: 'hidden' }}>
			<svg width="0" height="0">
				<filter id="paperNoise">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
			</svg>
			<AbsoluteFill
				style={{
					filter: 'url(#paperNoise)',
					opacity: tone === 'dark' ? 0.06 : 0.09,
					transform: `scale(${scale}) translateX(${tx}px)`,
					mixBlendMode: tone === 'dark' ? 'screen' : 'multiply'
				}}
			/>
			{/* dezenter warmer Schimmer in Kategorie-Farbe */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(120% 80% at 50% ${interpolate(Math.sin(frame / 110), [-1, 1], [30, 55])}%, ${accent}22, transparent 70%)`
				}}
			/>
		</AbsoluteFill>
	);
};

// ── Gradient-Mesh (driftende Farbwolken in Kategorie-Farben) ────────────────
export const GradientMesh: React.FC<{ category: string }> = ({ category }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	// Dunklere Variante des Akzents als Basis (statt neutral-grau/schwarz-Blob).
	const deep = darken(accent, 0.45);
	const p = (a: number, b: number, speed: number, phase = 0) => interpolate(Math.sin(frame / speed + phase), [-1, 1], [a, b]);
	return (
		<AbsoluteFill style={{ backgroundColor: deep, overflow: 'hidden' }}>
			{/* satte, driftende Akzent-Wolken — KEIN dunkler #16140f-Blob mehr */}
			<AbsoluteFill
				style={{
					background: `
						radial-gradient(60% 50% at ${p(22, 42, 130)}% ${p(18, 32, 150)}%, ${accent}, transparent 62%),
						radial-gradient(65% 55% at ${p(72, 88, 160, 2)}% ${p(55, 72, 140, 1)}%, ${lighten(accent, 0.15)}, transparent 60%),
						linear-gradient(165deg, ${lighten(accent, 0.1)} 0%, ${deep} 120%)`
				}}
			/>
			{/* sanfte Vignette (nur Kanten, mittig frei) */}
			<AbsoluteFill style={{ background: 'radial-gradient(130% 110% at 50% 40%, transparent 60%, rgba(0,0,0,0.28) 100%)' }} />
		</AbsoluteFill>
	);
};

// Hex-Helfer für Mesh-Farbstufen.
function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function darken(hex: string, amt: number): string {
	const [r, g, b] = hexToRgb(hex);
	return `rgb(${Math.round(r * (1 - amt))},${Math.round(g * (1 - amt))},${Math.round(b * (1 - amt))})`;
}
function lighten(hex: string, amt: number): string {
	const [r, g, b] = hexToRgb(hex);
	return `rgb(${Math.round(r + (255 - r) * amt)},${Math.round(g + (255 - g) * amt)},${Math.round(b + (255 - b) * amt)})`;
}

// ── Driftende Blobs (abstrakte Formen, sanfte Bewegung) ─────────────────────
export const DriftingBlobs: React.FC<{ category: string; tone?: 'light' | 'dark' }> = ({ category, tone = 'dark' }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const base = tone === 'dark' ? 'linear-gradient(160deg, #1c1a15, #16140f)' : CANVAS;
	const blobs = new Array(5).fill(0).map((_, i) => {
		const seed = `blob-${i}`;
		const bx = 10 + random(seed + 'x') * 80;
		const by = 10 + random(seed + 'y') * 80;
		const size = 260 + random(seed + 's') * 340;
		const speed = 140 + random(seed + 'sp') * 120;
		const dx = interpolate(Math.sin(frame / speed + i), [-1, 1], [-40, 40]);
		const dy = interpolate(Math.cos(frame / (speed * 1.2) + i), [-1, 1], [-30, 30]);
		const op = tone === 'dark' ? 0.16 : 0.12;
		return { bx, by, size, dx, dy, op, i };
	});
	return (
		<AbsoluteFill style={{ background: base, overflow: 'hidden' }}>
			{blobs.map((b) => (
				<div
					key={b.i}
					style={{
						position: 'absolute',
						left: `${b.bx}%`,
						top: `${b.by}%`,
						width: b.size,
						height: b.size,
						borderRadius: '50%',
						background: b.i % 2 === 0 ? accent : '#d98b52',
						opacity: b.op,
						filter: 'blur(40px)',
						transform: `translate(${b.dx}px, ${b.dy}px)`
					}}
				/>
			))}
		</AbsoluteFill>
	);
};

// ── FLUX-Standbild mit Ken-Burns ────────────────────────────────────────────
export const FluxBackground: React.FC<{ file: string; overlay?: boolean }> = ({ file, overlay = true }) => {
	const frame = useCurrentFrame();
	const scale = interpolate(frame, [0, 330], [1.0, 1.12], { extrapolateRight: 'clamp' });
	const tx = interpolate(frame, [0, 330], [0, -20], { extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ overflow: 'hidden', backgroundColor: CANVAS }}>
			<AbsoluteFill style={{ transform: `scale(${scale}) translateX(${tx}px)` }}>
				<Img src={staticFile(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
			</AbsoluteFill>
			{overlay ? <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(18,16,11,0.15) 0%, rgba(18,16,11,0) 40%, rgba(18,16,11,0.35) 100%)' }} /> : null}
		</AbsoluteFill>
	);
};
