import React from 'react';
import { AbsoluteFill } from 'remotion';
import { INK } from '../brand';

/**
 * Papier-Texturen als Overlays für die Newspaper-Szene. Zum Ausprobieren:
 * mehrere Varianten, per Prop wählbar. Rein deterministisch (SVG-Pattern/Filter).
 *   'halftone'  — klassisches Zeitungs-Punktraster
 *   'halftone-lines' — Linien-/Schraffur-Raster
 *   'fiber'     — feine Papierfaser (Turbulenz)
 *   'grain'     — körnige Druck-Textur
 *   'none'
 */
export type PaperTextureKind = 'halftone' | 'halftone-lines' | 'fiber' | 'grain' | 'none';

/** Overlay, das ÜBER die Zeitungsseite gelegt wird (position:absolute, füllt Elternelement). */
export const PaperTextureOverlay: React.FC<{ kind: PaperTextureKind; opacity?: number }> = ({ kind, opacity }) => {
	if (kind === 'none') return null;

	if (kind === 'halftone') {
		// Punktraster via radialem Pattern.
		return (
			<div style={{ position: 'absolute', inset: 0, opacity: opacity ?? 0.14, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
				<svg width="100%" height="100%">
					<defs>
						<pattern id="halftoneDots" width="10" height="10" patternUnits="userSpaceOnUse">
							<circle cx="2" cy="2" r="1.5" fill={INK} />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#halftoneDots)" />
				</svg>
			</div>
		);
	}

	if (kind === 'halftone-lines') {
		return (
			<div style={{ position: 'absolute', inset: 0, opacity: opacity ?? 0.1, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
				<svg width="100%" height="100%">
					<defs>
						<pattern id="halftoneLines" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
							<rect width="3" height="8" fill={INK} />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#halftoneLines)" />
				</svg>
			</div>
		);
	}

	if (kind === 'fiber') {
		return (
			<div style={{ position: 'absolute', inset: 0, opacity: opacity ?? 0.5, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
				<svg width="100%" height="100%">
					<filter id="paperFiber">
						<feTurbulence type="fractalNoise" baseFrequency="0.012 0.4" numOctaves="3" seed="11" />
						<feColorMatrix type="saturate" values="0" />
						<feComponentTransfer><feFuncA type="linear" slope="0.14" /></feComponentTransfer>
					</filter>
					<rect width="100%" height="100%" filter="url(#paperFiber)" />
				</svg>
			</div>
		);
	}

	// grain
	return (
		<div style={{ position: 'absolute', inset: 0, opacity: opacity ?? 0.4, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
			<svg width="100%" height="100%">
				<filter id="paperGrain">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
					<feComponentTransfer><feFuncA type="linear" slope="0.12" /></feComponentTransfer>
				</filter>
				<rect width="100%" height="100%" filter="url(#paperGrain)" />
			</svg>
		</div>
	);
};

/**
 * Szenen-Hintergrund HINTER der fliegenden Zeitung. Varianten zum Ausprobieren:
 *   'dark-vignette' — dunkel, warmer Kern (dramatisch, Zeitung leuchtet)
 *   'halftone-dark' — dunkel mit großem Halftone-Raster (redaktionell)
 *   'desk'          — warmer „Schreibtisch"-Ton (Zeitung liegt auf Holz/Papier)
 */
export type SceneBgKind = 'dark-vignette' | 'halftone-dark' | 'desk';

export const SceneBackground: React.FC<{ kind: SceneBgKind; accent: string }> = ({ kind, accent }) => {
	if (kind === 'halftone-dark') {
		return (
			<AbsoluteFill style={{ backgroundColor: '#141210' }}>
				<AbsoluteFill style={{ background: `radial-gradient(70% 55% at 50% 45%, ${accent}22, transparent 70%)` }} />
				<svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.12 }}>
					<defs>
						<pattern id="bgHalftone" width="34" height="34" patternUnits="userSpaceOnUse">
							<circle cx="6" cy="6" r="4" fill="#fff" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#bgHalftone)" />
				</svg>
			</AbsoluteFill>
		);
	}
	if (kind === 'desk') {
		return (
			<AbsoluteFill style={{ background: `linear-gradient(160deg, #2a2018, #1a140e)` }}>
				<AbsoluteFill style={{ background: `radial-gradient(80% 60% at 50% 42%, ${accent}18, transparent 75%)` }} />
			</AbsoluteFill>
		);
	}
	// dark-vignette
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<AbsoluteFill style={{ background: `radial-gradient(75% 55% at 50% 44%, ${accent}2e, #16140f 78%)` }} />
		</AbsoluteFill>
	);
};
