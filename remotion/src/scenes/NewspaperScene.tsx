import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, staticFile, continueRender, delayRender } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { CANVAS, INK, MUTED, FAINT, AMBER, accentFor, FF, FONTS } from '../brand';
import { PaperTextureOverlay, SceneBackground, type PaperTextureKind, type SceneBgKind } from './paper-textures';

/**
 * SZENE: Newspaper-Opener (~2.5s / 75f).
 * Eine echte Zeitungsseite fliegt aus der Ferne rotierend herein und wird
 * full-screen — framt sofort „das ist eine Nachricht". Paper-Look.
 *
 * Props = die Hero-Story (Titel, Dachzeile, Bild, Kategorie, Datum).
 */

export const NEWSPAPER_DURATION = 120; // länger → langsamerer Flug

export interface NewspaperProps {
	kicker: string; // Dachzeile/Kategorie, z.B. "INNOVATION · AFRIKA"
	headline: string;
	standfirst: string; // Unterzeile
	dateLabel: string; // "Dienstag, 1. Juli 2026"
	image: string | null; // Hero-Bild (public path oder null)
	category: string;
	texture?: PaperTextureKind; // Papier-Textur zum Vergleichen
	sceneBg?: SceneBgKind; // Szenen-Hintergrund
}

export const newspaperDefault: NewspaperProps = {
	kicker: 'INNOVATION · AFRIKA',
	headline: '50 Millionen Menschen haben zum ersten Mal Strom',
	standfirst: 'Eine Initiative bringt Leitungen in 40 Länder — der größte Netz-Ausbau der Geschichte.',
	dateLabel: 'Dienstag, 1. Juli 2026',
	image: 'backgrounds/flux/sky-quiet.png',
	category: 'innovation',
	texture: 'halftone',
	sceneBg: 'dark-vignette'
};

let loaded = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('news-fonts'));
	React.useEffect(() => {
		if (loaded) return continueRender(h);
		Promise.all([
			loadFont({ family: FF.grotesk, url: FONTS.grotesk }),
			loadFont({ family: FF.interSemi, url: FONTS.interSemi }),
			loadFont({ family: FF.inter, url: FONTS.inter }),
			loadFont({ family: FF.newsreader, url: FONTS.newsreader })
		]).then(() => { loaded = true; continueRender(h); }).catch(() => continueRender(h));
	}, [h]);
}

// Blindtext-Spalten (dünne Linien) für den Zeitungs-Look.
const TextLines: React.FC<{ lines: number; width?: string }> = ({ lines, width = '100%' }) => (
	<div style={{ display: 'flex', flexDirection: 'column', width, gap: 12 }}>
		{new Array(lines).fill(0).map((_, i) => (
			<div key={i} style={{ height: 8, borderRadius: 4, background: '#d8d0c4', width: i === lines - 1 ? '62%' : '100%' }} />
		))}
	</div>
);

const NewspaperPage: React.FC<NewspaperProps> = (p) => {
	const accent = accentFor(p.category);
	return (
		<div style={{ width: 1080, height: 1920, background: PAPER_BG, display: 'flex', flexDirection: 'column', padding: 72, boxShadow: '0 40px 120px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
			<PaperTextureOverlay kind={p.texture ?? 'halftone'} />
			{/* Zeitungskopf */}
			<div style={{ display: 'flex', alignItems: 'center', borderBottom: `4px solid ${INK}`, paddingBottom: 24 }}>
				<div style={{ fontFamily: FF.grotesk, fontSize: 76, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>NurEine</div>
				<div style={{ flex: 1 }} />
				<div style={{ fontFamily: FF.newsreader, fontStyle: 'italic', fontSize: 26, color: MUTED }}>{p.dateLabel}</div>
			</div>
			<div style={{ display: 'flex', borderBottom: `1px solid ${INK}`, padding: '10px 0 18px', marginBottom: 30 }}>
				<div style={{ fontFamily: FF.interSemi, fontSize: 22, color: accent, letterSpacing: '0.14em' }}>GUTE NACHRICHTEN · BELEGT · AUSGABE №1</div>
			</div>

			{/* Dachzeile */}
			<div style={{ fontFamily: FF.interSemi, fontSize: 26, color: accent, letterSpacing: '0.1em', marginBottom: 16 }}>{p.kicker}</div>
			{/* Schlagzeile */}
			<div style={{ fontFamily: FF.grotesk, fontSize: 82, fontWeight: 700, color: INK, lineHeight: 1.04, letterSpacing: '-0.03em', marginBottom: 22 }}>{p.headline}</div>
			{/* Unterzeile */}
			<div style={{ fontFamily: FF.newsreader, fontSize: 38, color: MUTED, lineHeight: 1.3, marginBottom: 34 }}>{p.standfirst}</div>

			{/* Hero-Bild */}
			<div style={{ width: '100%', height: 620, background: '#e7e0d4', overflow: 'hidden', marginBottom: 16 }}>
				{p.image ? <Img src={staticFile(p.image)} style={{ width: '100%', height: 620, objectFit: 'cover' }} /> : null}
			</div>
			<div style={{ fontFamily: FF.inter, fontSize: 22, color: FAINT, marginBottom: 34 }}>Illustration: KI · NurEine</div>

			{/* Spalten (Blindtext) */}
			<div style={{ display: 'flex', gap: 40, flex: 1 }}>
				<TextLines lines={7} />
				<TextLines lines={7} />
				<TextLines lines={7} />
			</div>
		</div>
	);
};

const PAPER_BG = '#faf6ee';

export const NewspaperScene: React.FC<NewspaperProps> = (props) => {
	useFonts();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const accent = accentFor(props.category);

	// LANGSAMER, weicher Grund-Flug: träger Spring (viel Masse, wenig Stiffness),
	// leichtes Überschwingen. Der Kern-Flug ist über ~2.5s statt <1s.
	const s = spring({ frame, fps, config: { damping: 14, mass: 2.4, stiffness: 42, overshootClamping: false } });

	// Ease-Fortschritt für die Basiswerte (etwas verzögert gestartet).
	const p = interpolate(s, [0, 1], [0, 1]);

	// ── organisches, NICHT-periodisches Taumeln ──
	// Drei Sinus mit nicht-harmonischen Frequenzen → keine erkennbare Wiederholung.
	// Amplitude fällt mit dem Flug ab (dampen), sodass es am Ende ruhig steht.
	const t = frame / fps;
	const dampen = interpolate(s, [0, 1], [1, 0.06]); // Rest-Wobble bleibt minimal
	const wob = (a: number, f1: number, f2: number, ph: number) =>
		(a * (Math.sin(t * f1 + ph) * 0.6 + Math.sin(t * f2 + ph * 1.7) * 0.4)) * dampen;

	// Basis-Transform (Flug aus der Tiefe) + überlagertes Taumeln.
	const scale = interpolate(p, [0, 1], [0.12, 1]);
	const rotX = interpolate(p, [0, 1], [58, 0]) + wob(6, 1.3, 2.1, 0.4);
	const rotY = interpolate(p, [0, 1], [22, 0]) + wob(5, 1.1, 1.9, 1.2); // seitliches Kippen
	const rotZ = interpolate(p, [0, 1], [-24, 0]) + wob(4, 0.9, 1.6, 2.3);
	const tx = interpolate(p, [0, 1], [90, 0]) + wob(18, 0.8, 1.4, 0.9);
	const ty = interpolate(p, [0, 1], [-230, 0]) + wob(16, 0.7, 1.25, 0.2);

	const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

	// Sehr dezenter, langsamer Rest-Drift NACH dem Settle (kein mechanischer Zoom).
	const driftY = Math.sin(t * 0.5) * 6 * interpolate(s, [0.7, 1], [0, 1], { extrapolateLeft: 'clamp' });
	const settleZoom = interpolate(frame, [70, NEWSPAPER_DURATION], [1, 1.03], { extrapolateLeft: 'clamp' });

	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<SceneBackground kind={props.sceneBg ?? 'dark-vignette'} accent={accent} />
			<AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1800 }}>
				<div
					style={{
						transform: `translate(${tx}px, ${ty + driftY}px) scale(${scale * settleZoom}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
						transformStyle: 'preserve-3d',
						opacity,
						borderRadius: 4,
						overflow: 'hidden'
					}}
				>
					<NewspaperPage {...props} />
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
