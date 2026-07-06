import React from 'react';
import { Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { POSE_VARIANTS } from './pose-manifest';

/**
 * Der NurEine-Erzähler ("Terracotta Man") — freigestellte Posen (transparente PNGs)
 * + Micro-Motion. Kein teures Video-KI: Bewegung entsteht durch Pose-Wechsel +
 * Atmen/Wippen/Parallax (deterministisch, 0€, autonom).
 *
 * SKALIERBAR: jede Geste kann MEHRERE Bild-Varianten haben (point-up-1.png,
 * point-up-2.png …). Der `seed` (z.B. Story-id) wählt deterministisch eine Variante
 * → über viele Reels wirkt der Feed abwechslungsreich, obwohl es dieselbe Figur ist.
 * Neue Bilder: PNG nach public/character/ legen, `node scripts/scan-poses.mjs`.
 */

export type Pose = 'idle' | 'point-up' | 'reading' | 'point-side' | 'thinking' | 'wave';

export type Person = 'mann' | 'frau';

/** Wählt deterministisch eine Varianten-Datei für Person+Geste (per seed).
 *  Fallback-Kette: gewünschte Person → mann → idle (fehlende Posen brechen nie). */
function poseFile(gesture: Pose, seed: string, person: Person): string {
	const forPerson = POSE_VARIANTS[person] ?? {};
	const variants = forPerson[gesture] ?? POSE_VARIANTS['mann']?.[gesture] ?? forPerson['idle'] ?? POSE_VARIANTS['mann']?.['idle'] ?? [];
	if (variants.length === 0) return 'character/mann/idle-1.png';
	let h = 0;
	const s = seed + gesture;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return variants[h % variants.length];
}

/** Person pro Reel deterministisch aus dem Seed (Feed wechselt zwischen Moderator:in). */
export function personForSeed(seed: string): Person {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
	return h % 2 === 0 ? 'mann' : 'frau';
}

interface CharacterProps {
	pose: Pose;
	/** Frame, ab dem die Figur reinkommt (relativ zur Sequenz). */
	enterFrame?: number;
	/** Größe (Höhe in px), Default 900. */
	size?: number;
	/** Von welcher Seite reinkommen. */
	from?: 'left' | 'right' | 'bottom';
	flip?: boolean; // horizontal spiegeln (z.B. damit er nach innen zeigt)
	/** Horizontale Ausrichtung im Frame. 'left'/'right' = an den Rand (Figur bleibt sichtbar). */
	align?: 'left' | 'center' | 'right';
	/** Seed für deterministische Varianten-Wahl (z.B. Story-id). */
	seed?: string;
	/** Welche Figur: Moderator oder Moderatorin. */
	person?: Person;
}

export const Character: React.FC<CharacterProps> = ({ pose, enterFrame = 0, size = 900, from = 'bottom', flip = false, align = 'center', seed = 'default', person = 'mann' }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const local = frame - enterFrame;

	// Einflieg-Spring
	const enter = spring({ frame: local, fps, config: { damping: 16, mass: 0.9 } });
	const enterOffset = interpolate(enter, [0, 1], [1, 0]);
	const tx = from === 'left' ? -260 * enterOffset : from === 'right' ? 260 * enterOffset : 0;
	const ty = from === 'bottom' ? 220 * enterOffset : 0;
	const opacity = interpolate(enter, [0, 0.3], [0, 1]);

	// Micro-Motion: Atmen (Scale-Puls) + leichtes Wippen + Kopf-Parallax-Neigung.
	const breathe = 1 + Math.sin(local / 22) * 0.012;
	const bob = Math.sin(local / 26) * 6;
	const tilt = Math.sin(local / 34) * 0.8; // Grad

	// Bilder sind ~4:3 (1200×900). Volle Bildbreite zeigen (contain).
	const w = size * (1200 / 900);

	// Horizontale Verankerung: bei left/right sitzt die Figur am Rand, bleibt aber
	// sichtbar (die Motiv-Mitte liegt bei ~50% des Bildes → grober Rand-Versatz).
	const anchor =
		align === 'left'
			? { left: -w * 0.18, right: 'auto' as const, transformX: '0px' }
			: align === 'right'
				? { left: 'auto' as const, right: -w * 0.18, transformX: '0px' }
				: { left: '50%', right: 'auto' as const, transformX: '-50%' };

	return (
		<div
			style={{
				position: 'absolute',
				bottom: -size * 0.02,
				left: anchor.left as number | string,
				right: anchor.right as number | string,
				transform: `translateX(${anchor.transformX}) translate(${tx}px, ${ty + bob}px) scale(${breathe}) rotate(${tilt}deg) ${flip ? 'scaleX(-1)' : ''}`,
				transformOrigin: 'bottom center',
				opacity,
				width: w,
				height: size,
				// weicher Bodenschatten, damit die Figur nicht schwebt
				filter: 'drop-shadow(0 24px 40px rgba(60,40,20,0.22))'
			}}
		>
			<Img src={staticFile(poseFile(pose, seed, person))} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
		</div>
	);
};

/** Sprechblase, die der Character „sagt" — snappt rein, dezent atmend. */
export const CharacterBubble: React.FC<{ text: string; startFrame: number; x: number; y: number; accent: string; align?: 'left' | 'right' }> = ({ text, startFrame, x, y, accent, align = 'left' }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = spring({ frame: frame - startFrame, fps, config: { damping: 12, mass: 0.5, stiffness: 130 } });
	const scale = interpolate(s, [0, 0.7, 1], [0, 1.06, 1]);
	const op = interpolate(s, [0, 0.3], [0, 1]);
	return (
		<div style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})`, transformOrigin: `${align === 'left' ? 'left' : 'right'} bottom`, opacity: op, maxWidth: 720 }}>
			<div style={{ position: 'relative', background: '#fff', borderRadius: 34, padding: '32px 42px', boxShadow: '0 18px 50px rgba(0,0,0,0.2)' }}>
				<div style={{ fontFamily: 'InterSemi', fontSize: 48, color: '#16140f', lineHeight: 1.24 }}>{text}</div>
				{/* Zeiger nach UNTEN-RECHTS (Richtung Character) */}
				<div style={{ position: 'absolute', bottom: -18, [align === 'left' ? 'left' : 'right']: 70, width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: '24px solid #fff' } as React.CSSProperties} />
			</div>
		</div>
	);
};
