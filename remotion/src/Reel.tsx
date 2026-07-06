import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	spring,
	interpolate,
	Easing,
	Img,
	staticFile,
	continueRender,
	delayRender
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { AMBER, AMBER_DEEP, CANVAS, INK, MUTED, FAINT, accentFor, FF, FONTS } from './brand';

export const REEL_FPS = 30;
// 11s gesamt: Hook 4.0s, Auflösung 4.0s, Endcard 3.0s (mit Überlappung der Sequenzen).
export const REEL_DURATION_FRAMES = 330;

export type ReelType = 'A' | 'B' | 'C';

export interface ReelProps {
	type: ReelType;
	hook: string;
	punchWord: string; // Schlüsselwort, das einschlägt (Teil von hook)
	heroNumber: string | null;
	heroUnit: string | null;
	aufloesung: string;
	shareHook: string;
	place: string | null;
	category: string;
	image: string | null; // public URL der KI-Collage (Typ B)
}

export const reelDefaultProps: ReelProps = {
	type: 'C',
	hook: 'Zum ersten Mal haben 50 Millionen Menschen Strom.',
	punchWord: '50 Millionen',
	heroNumber: '50 Mio',
	heroUnit: 'Menschen',
	aufloesung: '50 Millionen Menschen in Afrika haben zum ersten Mal Strom — über eine Initiative in 40 Ländern.',
	shareHook: 'Stell dir vor: 50 Millionen Menschen sehen zum ersten Mal abends Licht.',
	place: 'Afrika',
	category: 'innovation',
	image: null
};

// Fonts einmalig laden (delayRender bis fertig).
let fontsLoaded = false;
function useBrandFonts() {
	const [handle] = React.useState(() => delayRender('fonts'));
	React.useEffect(() => {
		if (fontsLoaded) {
			continueRender(handle);
			return;
		}
		Promise.all([
			loadFont({ family: FF.grotesk, url: FONTS.grotesk }),
			loadFont({ family: FF.interSemi, url: FONTS.interSemi }),
			loadFont({ family: FF.inter, url: FONTS.inter }),
			loadFont({ family: FF.newsreader, url: FONTS.newsreader })
		])
			.then(() => {
				fontsLoaded = true;
				continueRender(handle);
			})
			.catch(() => continueRender(handle));
	}, [handle]);
}

// ── kleine Animations-Helfer ────────────────────────────────────────────────

/** Spring-Wert 0→1 ab startFrame. */
function useSpring(startFrame: number, config?: Parameters<typeof spring>[0]['config']) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	return spring({ frame: frame - startFrame, fps, config: config ?? { damping: 200, mass: 0.8 } });
}

/** Brand-Lockup oben (Logo-Wortmarke + Sublabel). */
const BrandTop: React.FC<{ onDark: boolean; place: string | null }> = ({ onDark, place }) => {
	const c = onDark ? '#fff' : INK;
	const sub = onDark ? 'rgba(255,255,255,0.55)' : MUTED;
	return (
		<div style={{ position: 'absolute', top: 72, left: 72, right: 72, display: 'flex', flexDirection: 'column' }}>
			<div style={{ display: 'flex', alignItems: 'baseline' }}>
				<div style={{ fontFamily: FF.grotesk, fontSize: 34, fontWeight: 700, color: c, letterSpacing: '-0.02em' }}>
					NurEine
				</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 24, color: sub, marginLeft: 16, letterSpacing: '0.06em' }}>
					GUTE NACHRICHTEN · BELEGT
				</div>
			</div>
			{place ? (
				<div style={{ fontFamily: FF.interSemi, fontSize: 26, color: onDark ? 'rgba(255,255,255,0.8)' : AMBER, letterSpacing: '0.06em', marginTop: 12 }}>
					{place.toUpperCase()}
				</div>
			) : null}
		</div>
	);
};

/** Wandernder Licht-Sweep über die Fläche (Shimmer). */
const Shimmer: React.FC = () => {
	const frame = useCurrentFrame();
	const x = interpolate(frame % 110, [0, 110], [-40, 140]); // % der Breite, loop
	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(115deg, transparent ${x - 18}%, rgba(255,255,255,0.10) ${x}%, transparent ${x + 18}%)`,
				mixBlendMode: 'screen'
			}}
		/>
	);
};

/** Hook-Satz mit EINEM einschlagenden Schlüsselwort. */
const PunchHook: React.FC<{ hook: string; punch: string; color: string; accent: string }> = ({ hook, punch, color, accent }) => {
	const s = useSpring(4); // Wort schlägt ab Frame 4 ein
	const idx = punch ? hook.indexOf(punch) : -1;
	const before = idx >= 0 ? hook.slice(0, idx) : hook;
	const after = idx >= 0 ? hook.slice(idx + punch.length) : '';
	const scale = idx >= 0 ? interpolate(s, [0, 1], [2.1, 1]) : 1;
	const blur = idx >= 0 ? interpolate(s, [0, 0.6, 1], [10, 2, 0]) : 0;
	const wordColor = interpolate(s, [0, 1], [0, 1]) > 0.5 ? accent : accent;
	return (
		<div
			style={{
				fontFamily: FF.grotesk,
				fontSize: hook.length <= 50 ? 90 : hook.length <= 95 ? 74 : 60,
				fontWeight: 700,
				color,
				lineHeight: 1.08,
				letterSpacing: '-0.03em'
			}}
		>
			{before}
			{idx >= 0 ? (
				<span style={{ display: 'inline-block', color: wordColor, transform: `scale(${scale})`, filter: `blur(${blur}px)`, transformOrigin: 'left center' }}>
					{punch}
				</span>
			) : null}
			{after}
		</div>
	);
};

// ── Hook-Phasen je Typ ──────────────────────────────────────────────────────

const HookA: React.FC<ReelProps> = (p) => {
	const accent = accentFor(p.category);
	const lineW = interpolate(useSpring(8), [0, 1], [0, 140]);
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<div style={{ position: 'absolute', top: -180, right: -220, width: 620, height: 620, borderRadius: 620, background: accent, opacity: 0.16 }} />
			<Shimmer />
			<BrandTop onDark place={p.place} />
			<div style={{ position: 'absolute', left: 72, right: 72, top: '50%', transform: 'translateY(-50%)' }}>
				<PunchHook hook={p.hook} punch={p.punchWord} color="#fff" accent={accent} />
				<div style={{ width: lineW, height: 7, background: accent, marginTop: 40 }} />
			</div>
		</AbsoluteFill>
	);
};

const HookB: React.FC<ReelProps> = (p) => {
	const accent = accentFor(p.category);
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, 90], [1.0, 1.06], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			{p.image ? (
				<AbsoluteFill style={{ transform: `scale(${zoom})` }}>
					<Img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.15) brightness(1.02)' }} />
				</AbsoluteFill>
			) : (
				<AbsoluteFill style={{ background: `linear-gradient(150deg, ${accent}, #16140f 220%)` }} />
			)}
			<AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(18,16,11,0.5) 0%, rgba(18,16,11,0.05) 38%, rgba(18,16,11,0.5) 72%, rgba(18,16,11,0.85) 100%)' }} />
			<Shimmer />
			<BrandTop onDark place={p.place} />
			<div style={{ position: 'absolute', left: 72, right: 72, bottom: 200 }}>
				<PunchHook hook={p.hook} punch={p.punchWord} color="#fff" accent="#fff" />
			</div>
		</AbsoluteFill>
	);
};

const HookC: React.FC<ReelProps> = (p) => {
	const accent = accentFor(p.category);
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	// Zahl zählt hoch in ~0.7s mit Settle-Punch.
	const prog = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 90 } });
	const num = p.heroNumber || '';
	// Numerischen Anteil hochzählen, Suffix (Mio/%) behalten.
	const m = num.match(/^([\d.,]+)(.*)$/);
	const targetNum = m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : null;
	const suffix = m ? m[2] : '';
	const shown =
		targetNum !== null
			? Math.round(interpolate(prog, [0, 1], [0, targetNum])).toLocaleString('de-DE') + suffix
			: num;
	const blur = interpolate(prog, [0, 0.7, 1], [9, 2, 0]);
	const scale = interpolate(prog, [0, 0.85, 1], [0.7, 1.08, 1]);
	const lineW = interpolate(useSpring(6), [0, 1], [0, 1500]);
	return (
		<AbsoluteFill style={{ background: `linear-gradient(160deg, ${accent} 0%, #16140f 240%)` }}>
			<Shimmer />
			<BrandTop onDark place={p.place} />
			<div style={{ position: 'absolute', left: 72, right: 72, top: '50%', transform: 'translateY(-50%)' }}>
				<div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
					<div
						style={{
							fontFamily: FF.grotesk,
							fontSize: (num.length <= 4 ? 360 : num.length <= 7 ? 260 : 190),
							fontWeight: 700,
							color: '#fff',
							lineHeight: 0.9,
							letterSpacing: '-0.04em',
							filter: `blur(${blur}px)`,
							transform: `scale(${scale})`,
							transformOrigin: 'left center'
						}}
					>
						{shown}
					</div>
					{p.heroUnit ? (
						<div style={{ fontFamily: FF.interSemi, fontSize: 52, color: 'rgba(255,255,255,0.92)', marginLeft: 24 }}>{p.heroUnit}</div>
					) : null}
				</div>
				<div style={{ height: 6, background: accent, marginTop: 28, width: lineW, maxWidth: '100%' }} />
				<div style={{ fontFamily: FF.newsreader, fontSize: 44, color: 'rgba(255,255,255,0.9)', lineHeight: 1.25, marginTop: 34, maxWidth: 880 }}>
					{p.hook}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Auflösung (Slide-Snap) ──────────────────────────────────────────────────

const Aufloesung: React.FC<ReelProps> = (p) => {
	const accent = accentFor(p.category);
	const s = useSpring(2, { damping: 14, mass: 0.7, stiffness: 110 });
	const y = interpolate(s, [0, 1], [80, 0]);
	const op = interpolate(useCurrentFrame(), [0, 12], [0, 1], { extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ backgroundColor: CANVAS }}>
			<Shimmer />
			<div style={{ position: 'absolute', left: 72, right: 72, top: '50%', transform: 'translateY(-50%)', opacity: op }}>
				<div style={{ width: 84, height: 6, background: accent, marginBottom: 40 }} />
				<div style={{ fontFamily: FF.newsreader, fontSize: 56, color: INK, lineHeight: 1.3, transform: `translateY(${y}px)` }}>
					{p.aufloesung}
				</div>
			</div>
			<div style={{ position: 'absolute', left: 72, right: 72, bottom: 90, display: 'flex', alignItems: 'center' }}>
				<div style={{ fontFamily: FF.interSemi, fontSize: 26, color: accent }}>Nachgeprüft · belegt</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Endcard (schickbar, CTA-Puls) ───────────────────────────────────────────

const Endcard: React.FC<ReelProps> = (p) => {
	const accent = accentFor(p.category);
	const frame = useCurrentFrame();
	const pulse = 1 + 0.03 * Math.sin((frame / REEL_FPS) * Math.PI * 2);
	const op = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ background: `linear-gradient(160deg, ${CANVAS} 0%, #efe7d8 100%)` }}>
			<div style={{ position: 'absolute', top: -220, right: -220, width: 720, height: 720, borderRadius: 720, background: accent, opacity: 0.14 }} />
			<BrandTop onDark={false} place={null} />
			<div style={{ position: 'absolute', left: 72, right: 72, top: '46%', transform: 'translateY(-50%)', opacity: op }}>
				<div style={{ fontFamily: FF.grotesk, fontSize: p.shareHook.length <= 60 ? 64 : 52, fontWeight: 700, color: INK, lineHeight: 1.12, letterSpacing: '-0.03em' }}>
					{p.shareHook}
				</div>
			</div>
			<div style={{ position: 'absolute', left: 72, right: 72, bottom: 150 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						height: 96,
						background: accent,
						borderRadius: 60,
						transform: `scale(${pulse})`
					}}
				>
					<div style={{ fontFamily: FF.interSemi, fontSize: 34, color: '#fff' }}>An jemanden schicken ↗</div>
				</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, color: AMBER_DEEP, textAlign: 'center', marginTop: 28 }}>nureine.de</div>
			</div>
		</AbsoluteFill>
	);
};

// ── Reel (Sequenz-Komposition) ──────────────────────────────────────────────

export const Reel: React.FC<ReelProps> = (props) => {
	useBrandFonts();
	const Hook = props.type === 'A' ? HookA : props.type === 'B' ? HookB : HookC;
	// Phasen mit kurzer Überlappung für weiche Übergänge (Cross-Fade via opacity).
	return (
		<AbsoluteFill style={{ backgroundColor: '#16140f' }}>
			<Sequence durationInFrames={130}>
				<FadeOutTail tail={18}>
					<Hook {...props} />
				</FadeOutTail>
			</Sequence>
			<Sequence from={120} durationInFrames={130}>
				<FadeInHead head={18}>
					<FadeOutTail tail={18}>
						<Aufloesung {...props} />
					</FadeOutTail>
				</FadeInHead>
			</Sequence>
			<Sequence from={240} durationInFrames={90}>
				<FadeInHead head={18}>
					<Endcard {...props} />
				</FadeInHead>
			</Sequence>
		</AbsoluteFill>
	);
};

const FadeInHead: React.FC<{ head: number; children: React.ReactNode }> = ({ head, children }) => {
	const op = interpolate(useCurrentFrame(), [0, head], [0, 1], { extrapolateRight: 'clamp' });
	return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

const FadeOutTail: React.FC<{ tail: number; children: React.ReactNode }> = ({ tail, children }) => {
	const frame = useCurrentFrame();
	// Tail-Out relativ zur Sequenz-Länge (130). Wir faden die letzten `tail` Frames.
	const op = interpolate(frame, [130 - tail, 130], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};
