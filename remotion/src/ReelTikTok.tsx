import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	Audio,
	Img,
	staticFile,
	useCurrentFrame,
	spring,
	interpolate,
	continueRender,
	delayRender,
	CalculateMetadataFunction,
	Freeze
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { geoMercator, geoPath, geoGraticule10, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection } from 'geojson';
import landTopo from 'world-atlas/land-50m.json';
import countriesTopo from 'world-atlas/countries-50m.json';
import { CANVAS, PAPER, INK, AMBER, AMBER_DEEP, MUTED, accentFor, FF, FONTS } from './brand';
import { Character, personForSeed, type Person } from './character/Character';
import { PaperTextureOverlay } from './scenes/paper-textures';
import {
	type ReelDailyProps,
	type DailyScene,
	type SceneVo,
	type CaptionWord,
	reelDailyDefault
} from './ReelDaily';

/**
 * ReelTikTok — dopaminreiche TikTok-Variante des NurEine-Reels (Juli 2026).
 *
 * Teilt EXAKT die Props von ReelDaily (scenes/category/seed/person/musicFile/
 * hasVo/durationInFrames), damit render.mjs sie identisch befüllen kann. Nur die
 * VISUELLE Regie ist aggressiver:
 *  - Härtere, frühere Einzel-Animationen (Hook-Sweep [2,12] statt [6,22],
 *    Count-up-Spring steifer, Text-Pops mit Overshoot 0.6→1.12→1).
 *  - Pattern-Interrupt pro Szene: kurzer Scale-Punch (1.06→1 in ~6 Frames) am
 *    Szenenstart + ein Amber-Flash-Wisch, damit KEIN Stillstand >1s entsteht.
 *  - Rauer/kontrastreicher: größere/fettere Hook-Typo, dickere Akzent-Linien.
 *
 * Bewusst gleiche Marke/Safe-Zones/Sync wie ReelDaily — nur schneller & lauter.
 */

export const TIKTOK_FPS = 30;

// Loop-Naht (Rezept §C): das Video endet auf dem eingerasteten Cold-Open-Layout,
// damit TikToks Autoloop nahtlos in Frame 0 übergeht (Watch-% >100% als Ziel).
// Muss zu LOOP_TAIL in render.mjs passen.
export const TIKTOK_LOOP_TAIL = 14;

// IG/TikTok-Safe-Zones bei 1080×1920 (identisch zu ReelDaily)
const SAFE_TOP = 210;
const SAFE_BOTTOM = 420;
const M = 84; // Seitenrand

export const reelTikTokDefault: ReelDailyProps = reelDailyDefault;

export const calcReelTikTokMetadata: CalculateMetadataFunction<ReelDailyProps> = ({ props }) => ({
	durationInFrames: Math.max(90, props.durationInFrames),
	fps: TIKTOK_FPS
});

// ── Fonts ────────────────────────────────────────────────────────────────────
let fontsReady = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('tiktok-fonts'));
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

// ── Pattern-Interrupt: Scale-Punch + Amber-Flash am Szenenstart ─────────────
// Kurzer Snap (1.06→1 in ~6 Frames) sorgt für konstante Mikro-Bewegung, ein
// heller Wisch quer über das Bild in den ersten ~7 Frames markiert den Cut.
function usePunch(delay = 0) {
	const frame = useCurrentFrame();
	return interpolate(frame, [delay, delay + 6], [1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}

const FlashWipe: React.FC<{ color?: string }> = ({ color = AMBER }) => {
	const frame = useCurrentFrame();
	// diagonaler heller Streifen, fährt in ~7 Frames von links nach rechts durch
	const x = interpolate(frame, [0, 7], [-60, 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const op = interpolate(frame, [0, 2, 7], [0, 0.5, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	if (op <= 0.001) return null;
	return (
		<AbsoluteFill style={{ pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
			<div
				style={{
					position: 'absolute',
					top: '-20%',
					left: `${x}%`,
					width: '32%',
					height: '140%',
					transform: 'rotate(12deg)',
					background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
					opacity: op,
					filter: 'blur(8px)'
				}}
			/>
		</AbsoluteFill>
	);
};

// ── Szenen-lokales VO + Karaoke-Captions (Frames relativ zur Szene) ─────────
// Captions poppen pro Chunk kurz rein (schneller "beat"), sonst wie ReelDaily.
const SceneVoice: React.FC<{ vo: SceneVo | null | undefined; dark?: boolean; captions?: boolean; align?: 'center' | 'left'; raise?: number }> = ({ vo, dark, captions = true, align = 'center', raise = 0 }) => {
	const frame = useCurrentFrame();
	if (!vo) return null;
	const chunks: CaptionWord[][] = [];
	for (let i = 0; i < vo.words.length; i += 4) chunks.push(vo.words.slice(i, i + 4));
	// Verwaiste Mini-Pills („nicht" allein) wirken wie ein Render-Bug → letzten
	// Chunk mit <3 Wörtern in den vorigen mergen (Persona-Panel-Fix 2026-07-11).
	if (chunks.length >= 2 && chunks[chunks.length - 1].length < 3) {
		const orphan = chunks.pop() as CaptionWord[];
		chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...orphan];
	}
	const current = chunks.find((c) => frame >= c[0].start && frame <= c[c.length - 1].end + 8);
	const pop = current ? interpolate(frame, [current[0].start, current[0].start + 4], [0.82, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
	return (
		<>
			<Audio src={staticFile(vo.file)} volume={1} />
			{captions && current ? (
				<div style={{ position: 'absolute', left: align === 'left' ? M : 60, right: align === 'left' ? 380 : 60, bottom: SAFE_BOTTOM + 70 + raise, display: 'flex', justifyContent: align === 'left' ? 'flex-start' : 'center', zIndex: 20, transform: `scale(${pop})`, transformOrigin: align === 'left' ? 'left bottom' : 'center bottom' }}>
					<div style={{ background: dark ? 'rgba(244,239,230,0.96)' : 'rgba(22,20,15,0.9)', borderRadius: 18, padding: '16px 30px', maxWidth: 940, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
						<div style={{ fontFamily: FF.interSemi, fontSize: 42, lineHeight: 1.22, color: dark ? INK : '#fff', textAlign: align === 'left' ? 'left' : 'center' }}>
							{current.map((w, i) => (
								<span key={i} style={{ color: frame >= w.start ? (frame <= w.end ? (dark ? AMBER_DEEP : AMBER) : dark ? INK : '#fff') : dark ? 'rgba(22,20,15,0.4)' : 'rgba(255,255,255,0.45)', fontWeight: frame >= w.start && frame <= w.end ? 800 : 600 }}>
									{w.t}{' '}
								</span>
							))}
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};

// ── Szene 1: HOOK — Text ab Frame 0, größer/fetter, früher Sweep + Punch ────
const HookScene: React.FC<Extract<DailyScene, { kind: 'hook' }>> = ({ text, punch, kicker, vo }) => {
	const frame = useCurrentFrame();
	const accent = AMBER;
	const punchScale = usePunch(0);
	// Overshoot statt sanftes Settle: reinschnappen mit kurzem Über-1.
	const settle = interpolate(frame, [0, 6, 12], [0.9, 1.04, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const sweep = interpolate(frame, [2, 12], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const longestWord = Math.max(...text.split(/\s+/).map((w) => w.length));
	// ~8% größer als ReelDaily → aggressivere Hook-Typo.
	const byLength = text.length <= 55 ? 118 : text.length <= 85 ? 100 : 84;
	const size = Math.min(byLength, Math.floor((1080 - 2 * M) / (longestWord * 0.58) / 1.12));

	const idx = punch ? text.toLowerCase().indexOf(punch.toLowerCase()) : -1;
	const pre = idx >= 0 ? text.slice(0, idx) : text;
	const hit = idx >= 0 ? text.slice(idx, idx + punch.length) : '';
	const post = idx >= 0 ? text.slice(idx + punch.length) : '';

	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.06} />
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 40, display: 'flex', alignItems: 'center', transform: `scale(${punchScale})`, transformOrigin: 'left center' }}>
				<div style={{ width: 18, height: 18, background: accent, borderRadius: 3, marginRight: 16 }} />
				<div style={{ fontFamily: FF.interSemi, fontSize: 32, letterSpacing: '0.14em', color: AMBER_DEEP, fontWeight: 700 }}>{kicker}</div>
			</div>
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 220, bottom: SAFE_BOTTOM + 120, display: 'flex', alignItems: 'center', transform: `scale(${settle})`, transformOrigin: 'left center' }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: Math.round(size * 1.16), lineHeight: 1.05, letterSpacing: '-0.035em', color: INK, wordBreak: 'break-word' }}>
					{pre}
					{hit ? (
						<span
							style={{
								backgroundImage: `linear-gradient(${accent}66, ${accent}66)`,
								backgroundRepeat: 'no-repeat',
								backgroundSize: `${sweep}% 78%`,
								backgroundPosition: '0 82%',
								borderRadius: 6
							}}
						>
							{hit}
						</span>
					) : null}
					{post}
				</div>
			</div>
			<div style={{ position: 'absolute', left: M, bottom: SAFE_BOTTOM, fontFamily: FF.interSemi, fontSize: 28, color: MUTED }}>
				NurEine · belegt statt behauptet
			</div>
			<FlashWipe />
			<SceneVoice vo={vo} />
		</AbsoluteFill>
	);
};

// ── Szene 2: ZAHL — steifere Count-up-Spring, schnellere Kontext-Zeile ──────
// snap-Variante = Cold-Open (Rezept §C): Zahl steht ab Frame 0 und rastet mit
// Overshoot ein — kein Count-up von 0 (bei Ø 3,75 s Wiedergabedauer zu langsam
// als Opener). kicker trägt dort den Serien-Anker („TAG 217 · NUR EINE").
const NumberScene: React.FC<Extract<DailyScene, { kind: 'number' }> & { category: string }> = ({ value, unit, context, category, vo, snap, kicker, image }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const punchScale = usePunch(0);
	// härter/steifer als ReelDaily (stiffness 90 → 220), Linie schneller.
	const lineW = interpolate(spring({ frame: frame - (snap ? 2 : 4), fps: TIKTOK_FPS, config: { damping: 200, stiffness: 220 } }), [0, 1], [0, 680]);
	const ctxOp = interpolate(frame, snap ? [10, 18] : [8, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const ctxPop = interpolate(spring({ frame: frame - (snap ? 10 : 8), fps: TIKTOK_FPS, config: { damping: 12, mass: 0.5, stiffness: 200 } }), [0, 1], [0.86, 1]);
	return (
		<AbsoluteFill style={{ background: INK }}>
			{/* Themen-Anker: Perlen-Bild dunkel hinter der Zahl — man SIEHT sofort,
			    worum es geht, die Typo bleibt der Star (Publikums-Feedback 2026-07-11) */}
			{image ? (
				<>
					<Img src={image} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'saturate(0.85)', transform: `scale(${1.04 + frame * 0.0009})` }} />
					<AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(22,20,15,0.55) 0%, rgba(22,20,15,0.78) 55%, rgba(22,20,15,0.94) 100%)' }} />
				</>
			) : null}
			<AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 30%, ${accent}${image ? '2e' : '44'}, transparent 70%)` }} />
			{kicker ? (
				<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 40, display: 'flex', alignItems: 'center' }}>
					<div style={{ width: 18, height: 18, background: accent, borderRadius: 3, marginRight: 16 }} />
					<div style={{ fontFamily: FF.interSemi, fontSize: 32, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{kicker}</div>
				</div>
			) : null}
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 170, transform: `scale(${punchScale})`, transformOrigin: 'left center' }}>
				{snap ? <SnapValue value={value} unit={unit} /> : <TikTokCountUp value={value} unit={unit} category={category} />}
				<div style={{ height: 14, background: accent, marginTop: 30, width: lineW, borderRadius: 8 }} />
				<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 68, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', marginTop: 42, wordBreak: 'break-word', opacity: ctxOp, transform: `scale(${ctxPop})`, transformOrigin: 'left center' }}>
					{context}
				</div>
			</div>
			{/* Kein FlashWipe im Snap-Modus: Frame 0 ist Videostart bzw. Loop-Übergang, kein Cut */}
			{snap ? null : <FlashWipe color={accent} />}
			<SceneVoice vo={vo} dark />
		</AbsoluteFill>
	);
};

// Count-up mit steilerer Spring als das Standard-CountUpNumber (dopamin: die
// Zahl "rast" hoch und schnappt mit Overshoot ein statt sanft zu settlen).
const TikTokCountUp: React.FC<{ value: string; unit: string | null; category: string }> = ({ value, unit }) => {
	const frame = useCurrentFrame();
	const prog = spring({ frame, fps: TIKTOK_FPS, config: { damping: 13, mass: 0.5, stiffness: 200 } });
	const m = value.match(/^([\d.,]+)(.*)$/);
	const target = m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : null;
	const suffix = m ? m[2] : '';
	const decimals = m && m[1].includes(',') ? (m[1].split(',')[1] || '').length : 0;
	const shown =
		target !== null
			? interpolate(prog, [0, 1], [0, target]).toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
			: value;
	const blur = interpolate(prog, [0, 0.6, 1], [14, 3, 0]);
	const scale = interpolate(prog, [0, 0.8, 1], [0.55, 1.12, 1]);
	const size = value.length <= 4 ? 380 : value.length <= 7 ? 270 : 200;
	return (
		<div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
			<div style={{ fontFamily: FF.grotesk, fontSize: size, fontWeight: 800, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.045em', filter: `blur(${blur}px)`, transform: `scale(${scale})`, transformOrigin: 'left center' }}>{shown}</div>
			{unit ? <div style={{ fontFamily: FF.interSemi, fontSize: 54, color: 'rgba(255,255,255,0.94)', marginLeft: 24 }}>{unit}</div> : null}
		</div>
	);
};

// Cold-Open-Zahl: steht ab Frame 0 voll lesbar und rastet in ~9 Frames mit
// Overshoot ein — ersetzt den Count-up am Videoanfang (Rezept §C: erstes
// gesprochenes Wort <0,5 s, die Zahl darf dem Wort nicht hinterherzählen).
const SnapValue: React.FC<{ value: string; unit: string | null }> = ({ value, unit }) => {
	const frame = useCurrentFrame();
	// Wächst REIN statt von >1 zu schrumpfen — Overshoot >1.03 würde die Zahl
	// am rechten Rand abschneiden (transformOrigin left, Zahl füllt die Breite).
	const scale = interpolate(frame, [0, 5, 9], [0.92, 1.03, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const blur = interpolate(frame, [0, 6], [4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const size = value.length <= 4 ? 380 : value.length <= 7 ? 270 : 200;
	return (
		<div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
			<div style={{ fontFamily: FF.grotesk, fontSize: size, fontWeight: 800, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.045em', filter: `blur(${blur}px)`, transform: `scale(${scale})`, transformOrigin: 'left center' }}>{value}</div>
			{unit ? <div style={{ fontFamily: FF.interSemi, fontSize: 54, color: 'rgba(255,255,255,0.94)', marginLeft: 24 }}>{unit}</div> : null}
		</div>
	);
};

// ── Szene 3: BEAT — schnellerer Panel-Einzug, Text-Pop mit Overshoot ────────
const BeatScene: React.FC<Extract<DailyScene, { kind: 'beat' }> & { category: string; seed: string; person: Person }> = ({ text, image, pose, category, seed, person, vo }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const punchScale = usePunch(0);
	// steifer/schneller als ReelDaily (stiffness 120 → 210, mass kleiner).
	const panelS = spring({ frame: frame - 1, fps: TIKTOK_FPS, config: { damping: 14, mass: 0.6, stiffness: 210 } });
	const panelY = interpolate(panelS, [0, 1], [110, 0]);
	const panelOp = interpolate(panelS, [0, 0.3], [0, 1]);
	const panelScale = interpolate(panelS, [0, 0.8, 1], [0.9, 1.03, 1]);
	const zoom = 1 + frame * 0.0016;
	const textS = spring({ frame: frame - 5, fps: TIKTOK_FPS, config: { damping: 14, mass: 0.55, stiffness: 200 } });
	const textPop = interpolate(textS, [0, 0.8, 1], [0.86, 1.05, 1]);
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.06} />
			{image ? (
				<>
					<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 30, height: 720, transform: `translateY(${panelY}px) rotate(-1.6deg) scale(${panelScale})`, opacity: panelOp, background: PAPER, padding: 22, boxShadow: '0 34px 80px rgba(60,40,20,0.3)', borderRadius: 6 }}>
						<div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 3 }}>
							<Img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />
						</div>
						<div style={{ position: 'absolute', bottom: 30, left: 34, fontFamily: FF.inter, fontSize: 22, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>Illustration: KI · NurEine</div>
					</div>
					<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 820, transform: `scale(${textPop})`, transformOrigin: 'left center', opacity: interpolate(textS, [0, 0.35], [0, 1]) }}>
						<div style={{ width: 110, height: 10, background: accent, marginBottom: 26, borderRadius: 5 }} />
						<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 62, lineHeight: 1.1, letterSpacing: '-0.03em', color: INK, wordBreak: 'break-word' }}>{text}</div>
					</div>
				</>
			) : (
				// KEINE Figur auf TikTok (Panel-Befund 2026-07-11: 3D-Avatar = stärkster
				// „Werbung/Slop"-Marker der Skip-Personas) → Text nimmt die volle Breite.
				<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 60, bottom: SAFE_BOTTOM + 260, display: 'flex', alignItems: 'center', transform: `scale(${textPop})`, transformOrigin: 'left center', opacity: interpolate(textS, [0, 0.35], [0, 1]) }}>
					<div>
						<div style={{ width: 110, height: 10, background: accent, marginBottom: 30, borderRadius: 5 }} />
						<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 82, lineHeight: 1.08, letterSpacing: '-0.03em', color: INK, wordBreak: 'break-word' }}>{text}</div>
					</div>
				</div>
			)}
			<div style={{ position: 'absolute', inset: 0, transform: `scale(${punchScale})`, transformOrigin: 'center', pointerEvents: 'none' }} />
			<FlashWipe />
			<SceneVoice vo={vo} captions={!!image} />
		</AbsoluteFill>
	);
};

// ── Szene: KARTEN-ZOOM — Welt → Story-Ort im Marken-Stil (Aaron-Go 2026-07-11)
// Anti-Slop-Visual: echte Geografie (Natural-Earth-Daten, offline gebündelt)
// statt KI-Bild. Tinte-See + Papier-Land + Kategorie-Farbe fürs Ziel-Land.
const LAND_TOPO = landTopo as unknown as Topology;
const COUNTRIES_TOPO = countriesTopo as unknown as Topology;
const LAND = feature(LAND_TOPO, LAND_TOPO.objects.land);
const COUNTRIES = feature(COUNTRIES_TOPO, COUNTRIES_TOPO.objects.countries) as FeatureCollection;

const MapScene: React.FC<Extract<DailyScene, { kind: 'map' }> & { category: string }> = ({ lat, lng, label, category, vo }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	// Ziel-Land einmalig bestimmen (Highlight in Kategorie-Farbe)
	const target = React.useMemo(() => COUNTRIES.features.find((f) => geoContains(f, [lng, lat])) ?? null, [lat, lng]);
	// Kinozoom: träge Spring (ruhig, markentypisch) von Kontinent-Höhe aufs Land.
	const z = spring({ frame: frame - 2, fps: TIKTOK_FPS, config: { damping: 30, mass: 1.4, stiffness: 40 } });
	const scale = interpolate(z, [0, 1], [340, 2200]);
	const projection = geoMercator()
		.center([interpolate(z, [0, 1], [lng * 0.55, lng]), interpolate(z, [0, 1], [lat * 0.55 + 12, lat])])
		.scale(scale)
		.translate([540, 900]);
	const path = geoPath(projection);
	const [mx, my] = projection([lng, lat]) ?? [540, 900];
	const markerIn = spring({ frame: frame - 14, fps: TIKTOK_FPS, config: { damping: 12, mass: 0.5, stiffness: 220 } });
	const pulse = 1 + 0.5 * ((frame % 34) / 34);
	const pulseOp = 0.5 * (1 - (frame % 34) / 34);
	const labelIn = spring({ frame: frame - 20, fps: TIKTOK_FPS, config: { damping: 14, mass: 0.6, stiffness: 200 } });
	return (
		<AbsoluteFill style={{ background: INK }}>
			<AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 40%, ${accent}22, transparent 70%)` }} />
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
				<path d={path(geoGraticule10()) ?? ''} fill="none" stroke="rgba(244,239,230,0.05)" strokeWidth={1} />
				<path d={path(LAND) ?? ''} fill="rgba(244,239,230,0.16)" stroke="rgba(244,239,230,0.28)" strokeWidth={1.2} />
				{target ? <path d={path(target) ?? ''} fill={`${accent}59`} stroke={accent} strokeWidth={2.5} /> : null}
				<circle cx={mx} cy={my} r={26 * pulse * markerIn} fill="none" stroke={accent} strokeWidth={3} opacity={pulseOp * markerIn} />
				<circle cx={mx} cy={my} r={14 * markerIn} fill={accent} stroke="#fff" strokeWidth={4} />
			</svg>
			<div style={{ position: 'absolute', left: mx + 34, top: my - 34, transform: `scale(${interpolate(labelIn, [0, 1], [0.6, 1])})`, transformOrigin: 'left center', opacity: interpolate(labelIn, [0, 0.4], [0, 1]) }}>
				<div style={{ display: 'inline-block', background: PAPER, borderRadius: 14, padding: '12px 24px', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
					<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 40, color: INK, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{label}</div>
				</div>
			</div>
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 40, display: 'flex', alignItems: 'center' }}>
				<div style={{ width: 14, height: 14, background: accent, borderRadius: 2, marginRight: 14 }} />
				<div style={{ fontFamily: FF.interSemi, fontSize: 28, letterSpacing: '0.14em', color: 'rgba(244,239,230,0.75)' }}>ORT DER NACHRICHT</div>
			</div>
			<FlashWipe color={accent} />
			<SceneVoice vo={vo} dark />
		</AbsoluteFill>
	);
};

// ── Szene 4: BELEG — Stempel schlägt härter ein (steifer, mehr Overshoot) ───
// progress-Modus (Aaron 2026-07-12): Der Klimax feiert nicht unseren Prüfprozess,
// sondern DEN FORTSCHRITT — „Fortschritt Nr. N" + wachsende Phyllotaxis-Spirale
// (jeder Punkt = eine geprüfte gute Nachricht im Archiv, der heutige fliegt aus
// dem Stempel hinein). Der Beleg wird zur Eintrittskarte: „Nur was geprüft ist,
// zählt." Ohne progress: klassisches Layout (IG-kompatibel).

// Goldener Winkel — die Spirale wächst organisch nach außen wie Sonnenblumensamen.
const PHI_ANGLE = 2.39996;
function spiralPos(i: number, spacing: number): [number, number] {
	const r = spacing * Math.sqrt(i + 0.6);
	return [Math.cos(i * PHI_ANGLE) * r, Math.sin(i * PHI_ANGLE) * r];
}

const ProofScene: React.FC<Extract<DailyScene, { kind: 'proof' }> & { category: string }> = ({ source, impact, category, vo, progress }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const stamp = spring({ frame: frame - 2, fps: TIKTOK_FPS, config: { damping: 11, mass: 0.5, stiffness: 260 } });
	const stampScale = interpolate(stamp, [0, 0.7, 1], [2.4, 0.94, 1]);
	const stampOp = interpolate(stamp, [0, 0.2], [0, 1]);
	const rowOp = interpolate(frame, [10, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const barW = interpolate(spring({ frame: frame - 12, fps: TIKTOK_FPS, config: { damping: 200, stiffness: 220 } }), [0, 1], [0, Math.min(100, Math.max(8, impact ?? 0))]);
	// Aufschlag spürbar machen: Micro-Shake, während der Stempel landet (~Frame 7–13),
	// und der Wirkungsindex-Wert puncht rein, wenn das Badge sich dort auflöst.
	const shake = frame >= 7 && frame <= 13 ? Math.sin((frame - 7) * 2.6) * (13 - frame) : 0;
	const impactPop = interpolate(spring({ frame: frame - 12, fps: TIKTOK_FPS, config: { damping: 11, mass: 0.5, stiffness: 240 } }), [0, 1], [1.35, 1]);
	const sounds = (
		<>
			{/* Stempel-Sound: Anflug + satter Aufschlag — settle doppelt: normal + auf
			    0.55 verlangsamt = tiefer Bass-Thud unter dem Klick. */}
			<Audio src={staticFile('audio/fx/whoosh.wav')} volume={0.55} />
			<Sequence from={6}>
				<Audio src={staticFile('audio/fx/settle.wav')} volume={0.95} />
				<Audio src={staticFile('audio/fx/settle.wav')} volume={0.85} playbackRate={0.55} />
			</Sequence>
		</>
	);

	if (progress != null && progress > 0) {
		const n = Math.max(1, Math.round(progress));
		const shown = Math.min(n, 160); // Darstellungs-Cap; die echte Zahl trägt der Text
		const spacing = n <= 40 ? 34 : n <= 90 ? 27 : 21;
		const dotR = n <= 40 ? 15 : n <= 90 ? 12 : 9;
		const cx = 540, cy = SAFE_TOP + 880;
		// Der neue Punkt (Index shown-1, außen) fliegt ab Frame 16 vom Stempel in die Spirale.
		const fly = spring({ frame: frame - 16, fps: TIKTOK_FPS, config: { damping: 13, mass: 0.7, stiffness: 120 } });
		const [txRel, tyRel] = spiralPos(shown - 1, spacing);
		const nx = interpolate(fly, [0, 1], [M + 210 - cx, txRel]);
		const ny = interpolate(fly, [0, 1], [SAFE_TOP + 90 - cy, tyRel]);
		const zoomOut = interpolate(frame, [16, 44], [1.07, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		const breathe = 1 + 0.008 * Math.sin(frame / 11);
		const numPop = spring({ frame: frame - 12, fps: TIKTOK_FPS, config: { damping: 12, mass: 0.6, stiffness: 210 } });
		return (
			<AbsoluteFill style={{ background: PAPER, transform: `translateY(${shake}px)` }}>
				<PaperTextureOverlay kind="halftone" opacity={0.07} />
				{sounds}
				{/* Kompakter Stempel oben — Ritual bleibt (Design/Sound nie ändern) */}
				<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 20, transform: `scale(${stampScale}) rotate(-4deg)`, transformOrigin: 'left center', opacity: stampOp }}>
					<div style={{ display: 'inline-block', border: `9px solid ${accent}`, borderRadius: 12, padding: '8px 30px' }}>
						<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 96, letterSpacing: '-0.03em', color: accent, lineHeight: 1 }}>Belegt.</div>
					</div>
				</div>
				<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 200, opacity: rowOp, fontFamily: FF.newsreader, fontSize: 42, color: INK }}>Quelle: {source}</div>
				{/* Der Held: die wachsende Summe */}
				<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 300, transform: `scale(${interpolate(numPop, [0, 1], [0.85, 1])})`, transformOrigin: 'left center', opacity: interpolate(numPop, [0, 0.35], [0, 1]) }}>
					<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 88, letterSpacing: '-0.03em', color: INK, lineHeight: 1.05 }}>
						Fortschritt <span style={{ color: accent }}>Nr. {n.toLocaleString('de-DE')}</span>
					</div>
					<div style={{ fontFamily: FF.interSemi, fontSize: 32, color: MUTED, marginTop: 18 }}>Jeden Tag einer. Nur was geprüft ist, zählt.</div>
				</div>
				{/* Das Archiv: Phyllotaxis-Spirale, wächst nach außen */}
				<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, transform: `scale(${zoomOut * breathe})`, transformOrigin: `${cx}px ${cy}px` }}>
					{Array.from({ length: Math.max(0, shown - 1) }, (_, i) => {
						const [x, y] = spiralPos(i, spacing);
						const jitter = 0.75 + ((i * 2654435761) % 100) / 400; // deterministisch
						return <circle key={i} cx={cx + x} cy={cy + y} r={dotR * jitter} fill={accent} opacity={0.32} />;
					})}
					<circle cx={cx + nx} cy={cy + ny} r={dotR * 1.5 + 3 * Math.sin(Math.max(0, frame - 30) / 5)} fill={accent} stroke={PAPER} strokeWidth={3} opacity={interpolate(fly, [0, 0.15], [0, 1])} />
				</svg>
				{/* Wirkungsindex kompakt unten */}
				{impact != null ? (
					<div style={{ position: 'absolute', left: M, right: M, bottom: SAFE_BOTTOM + 60, opacity: rowOp }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
							<div style={{ fontFamily: FF.interSemi, fontSize: 28, color: MUTED }}>Wirkungsindex — nureine.de</div>
							<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 36, color: INK, transform: `scale(${impactPop})`, transformOrigin: 'right center' }}>{impact}/100</div>
						</div>
						<div style={{ width: '100%', height: 14, borderRadius: 14, background: 'rgba(22,20,15,0.1)', overflow: 'hidden' }}>
							<div style={{ width: `${barW}%`, height: 14, borderRadius: 14, background: accent }} />
						</div>
					</div>
				) : null}
				<FlashWipe color={accent} />
				{/* raise: Caption sitzt über dem Wirkungsindex-Block (sonst Überdeckung) */}
				<SceneVoice vo={vo} raise={220} />
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill style={{ background: PAPER, transform: `translateY(${shake}px)` }}>
			<PaperTextureOverlay kind="halftone" opacity={0.07} />
			{sounds}
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 230, transform: `scale(${stampScale}) rotate(-4deg)`, transformOrigin: 'left center', opacity: stampOp }}>
				<div style={{ display: 'inline-block', border: `12px solid ${accent}`, borderRadius: 14, padding: '10px 40px' }}>
					<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 156, letterSpacing: '-0.03em', color: accent, lineHeight: 1 }}>Belegt.</div>
				</div>
			</div>
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 620, opacity: rowOp }}>
				<div style={{ fontFamily: FF.newsreader, fontSize: 52, color: INK, lineHeight: 1.3 }}>Quelle: {source}</div>
				{impact != null ? (
					<div style={{ marginTop: 52 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
							<div style={{ fontFamily: FF.interSemi, fontSize: 32, color: MUTED }}>Wirkungsindex</div>
							<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 42, color: INK, transform: `scale(${impactPop})`, transformOrigin: 'right center' }}>{impact}/100</div>
						</div>
						<div style={{ width: '100%', height: 20, borderRadius: 20, background: 'rgba(22,20,15,0.1)', overflow: 'hidden' }}>
							<div style={{ width: `${barW}%`, height: 20, borderRadius: 20, background: accent }} />
						</div>
					</div>
				) : null}
				<div style={{ fontFamily: FF.inter, fontSize: 30, color: MUTED, marginTop: 40 }}>Jede Story nachgeprüft — Methodik auf nureine.de</div>
			</div>
			<FlashWipe color={accent} />
			<SceneVoice vo={vo} />
		</AbsoluteFill>
	);
};

// ── Szene 5: ENDCARD — Share-Zeile poppt, CTA-Pill pulst stärker ────────────
// loopMode (Rezept §C): KEIN CTA-Screen — keine Figur, keine Pill (die letzten
// Sekunden „Werbung" sind der messbare Completion-Killer). Stattdessen trägt die
// Share-Zeile den letzten Beat, der Follow-Anlass ist eine stille Textzeile, und
// das gesprochene Loop-Ende läuft als Karaoke-Caption mit.
const EndScene: React.FC<Extract<DailyScene, { kind: 'end' }> & { category: string; seed: string; person: Person; loopMode: boolean }> = ({ share, cta, hasVo, category, seed, person, vo, loopMode, engage }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const s = spring({ frame: frame - 1, fps: TIKTOK_FPS, config: { damping: 13, mass: 0.55, stiffness: 200 } });
	const sharePop = interpolate(s, [0, 0.8, 1], [0.86, 1.04, 1]);
	const pulse = 1 + 0.045 * Math.sin((frame / TIKTOK_FPS) * Math.PI * 2.6);
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.06} />
			<div style={{ position: 'absolute', left: M, right: loopMode ? M : 300, top: SAFE_TOP + 40, bottom: SAFE_BOTTOM + 340, display: 'flex', alignItems: 'center', transform: `scale(${sharePop})`, transformOrigin: 'left center', opacity: interpolate(s, [0, 0.35], [0, 1]) }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: share.length <= 70 ? 76 : 60, lineHeight: 1.1, letterSpacing: '-0.03em', color: INK }}>{share}</div>
			</div>
			{loopMode ? null : <Character pose="wave" enterFrame={3} from="bottom" size={680} align="right" seed={seed} person={person} />}
			{loopMode && engage !== false ? <EngageIcons accent={accent} /> : null}
			<div style={{ position: 'absolute', left: M, right: loopMode ? M : 400, bottom: SAFE_BOTTOM, transform: `scale(${loopMode ? 1 : pulse})`, transformOrigin: 'left center', zIndex: 5 }}>
				{loopMode ? (
					<div style={{ fontFamily: FF.interSemi, fontSize: 34, color: AMBER_DEEP }}>Morgen wächst es weiter.</div>
				) : (
					<div style={{ display: 'inline-flex', alignItems: 'center', height: 104, background: accent, borderRadius: 60, padding: '0 48px', boxShadow: '0 18px 46px rgba(60,40,20,0.32)' }}>
						<div style={{ fontFamily: FF.interSemi, fontSize: 38, color: '#fff', fontWeight: 700 }}>{cta} ↗</div>
					</div>
				)}
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, color: loopMode ? MUTED : AMBER_DEEP, marginTop: 24 }}>@nureine.de — täglich eine gute Nachricht</div>
				<div style={{ fontFamily: FF.inter, fontSize: 22, color: MUTED, marginTop: 14 }}>{hasVo ? 'Illustration & Stimme: KI · ' : 'Illustration: KI · '}von Menschen geprüft</div>
			</div>
			<FlashWipe />
			{/* raise: Caption sitzt im Loop-Modus über dem Follow-Block (sonst Überlappung) */}
			<SceneVoice vo={vo} captions={loopMode} raise={310} />
		</AbsoluteFill>
	);
};

// ── Engagement-Nudge (Aaron 2026-07-11) ─────────────────────────────────────
// Bewusst KEIN eigener CTA-Screen (Completion-Killer) — drei kleine Icon-Pops
// unter der Share-Zeile während des Loop-Endes: Herz → Kommentar → Teilen.
// Teilen kommt zuletzt und akzentuiert (Shares sind nach Completion unser
// stärkstes Signal). Links platziert: rechts unten liegt TikToks echte Action-
// Leiste über dem Video — dort wären eigene Icons verdeckt/irreführend.
const EngageIcons: React.FC<{ accent: string }> = ({ accent }) => {
	const frame = useCurrentFrame();
	const icons: { d: string; fill: string; flip?: boolean; size: number }[] = [
		{ d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', fill: INK, size: 56 },
		{ d: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z', fill: INK, size: 56 },
		{ d: 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z', fill: accent, flip: true, size: 66 }
	];
	return (
		<div style={{ position: 'absolute', left: M, bottom: SAFE_BOTTOM + 200, display: 'flex', alignItems: 'center', gap: 32 }}>
			{icons.map((ic, i) => {
				const s = spring({ frame: frame - (10 + i * 7), fps: TIKTOK_FPS, config: { damping: 10, mass: 0.5, stiffness: 240 } });
				const bob = frame > 34 ? Math.sin((frame - 34) / 9 + i * 1.1) * 3 : 0;
				return (
					<svg
						key={i}
						width={ic.size}
						height={ic.size}
						viewBox="0 0 24 24"
						style={{ transform: `translateY(${bob}px) scale(${interpolate(s, [0, 1], [0, 1])})${ic.flip ? ' scaleX(-1)' : ''}`, opacity: Math.min(1, interpolate(s, [0, 0.3], [0, 1])) }}
					>
						<path d={ic.d} fill={ic.fill} />
					</svg>
				);
			})}
		</div>
	);
};

// ── Rewatch-Badge — die „geplante Verwirrung" (Rezept §C) ───────────────────
// Ab ~Sek 2 klebt der Wirkungsindex UNERKLÄRT oben rechts; beim Stempel fliegt
// er in die Wirkungsindex-Zeile und löst sich auf. Wer das Badge verstehen will,
// schaut den Anfang nochmal — ohne dass Information vorenthalten wird (der
// Beleg bleibt jederzeit voll lesbar, kein Dark Pattern).
const BADGE_START = 60;
const RewatchBadge: React.FC<{ value: number; proofStart: number; category: string }> = ({ value, proofStart, category }) => {
	const frame = useCurrentFrame();
	if (frame < BADGE_START || frame > proofStart + 18) return null;
	const accent = accentFor(category);
	const inS = spring({ frame: frame - BADGE_START, fps: TIKTOK_FPS, config: { damping: 12, mass: 0.5, stiffness: 200 } });
	const hand = interpolate(frame, [proofStart, proofStart + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const scale = interpolate(inS, [0, 1], [0.4, 1]) * interpolate(hand, [0, 1], [1, 1.5]);
	return (
		<div
			style={{
				position: 'absolute',
				right: M,
				top: SAFE_TOP + 34,
				zIndex: 40,
				transform: `translate(${interpolate(hand, [0, 1], [0, -20])}px, ${interpolate(hand, [0, 1], [0, 700])}px) scale(${scale})`,
				transformOrigin: 'center',
				opacity: interpolate(hand, [0, 0.75, 1], [1, 0.85, 0])
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 92, height: 92, borderRadius: 20, background: accent, boxShadow: '0 10px 26px rgba(60,40,20,0.3)' }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 800, fontSize: 44, color: '#fff' }}>{value}</div>
			</div>
		</div>
	);
};

// ── Haupt-Komposition ───────────────────────────────────────────────────────
export const ReelTikTok: React.FC<ReelDailyProps> = (p) => {
	useFonts();
	const person = p.person || personForSeed(p.seed);
	const total = p.durationInFrames;
	const musicVol = p.hasVo ? 0.16 : 0.34;
	// Loop-Naht: die Szenen enden TIKTOK_LOOP_TAIL vor Schluss (render.mjs hat den
	// Schwanz auf durationInFrames aufgeschlagen); der Schwanz friert das
	// eingerastete Cold-Open-Layout ein → Match-Cut auf Frame 0 beim Autoloop.
	const first = p.scenes[0];
	const loop = !!p.loop && !!first && first.kind === 'number';
	const proofStart = p.scenes.find((s) => s.kind === 'proof')?.start ?? total;
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<Audio
				src={staticFile(p.musicFile)}
				loop
				// Im Loop-Modus nicht auf 0 ausfaden (hörbare Naht) — nur kurz abdimmen gegen Knackser.
				volume={(f) => interpolate(f, [0, 12, total - (loop ? 6 : 22), total], [0, musicVol, musicVol, loop ? musicVol * 0.55 : 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
			/>
			{p.scenes.map((sc, i) => (
				<Sequence key={i} from={sc.start} durationInFrames={sc.dur}>
					{sc.kind === 'hook' ? <HookScene {...sc} /> : null}
					{sc.kind === 'number' ? <NumberScene {...sc} category={p.category} /> : null}
					{sc.kind === 'beat' ? <BeatScene {...sc} category={p.category} seed={p.seed} person={person} /> : null}
					{sc.kind === 'map' ? <MapScene {...sc} category={p.category} /> : null}
					{sc.kind === 'proof' ? <ProofScene {...sc} category={p.category} /> : null}
					{sc.kind === 'end' ? <EndScene {...sc} category={p.category} seed={p.seed} person={person} loopMode={loop} /> : null}
				</Sequence>
			))}
			{loop && first.kind === 'number' ? (
				<Sequence from={total - TIKTOK_LOOP_TAIL} durationInFrames={TIKTOK_LOOP_TAIL}>
					{/* Frame 8 = Snap eingerastet, Kontextzeile noch unsichtbar → nächster Nachbar von Frame 0 */}
					<Freeze frame={8}>
						<NumberScene {...first} snap={true} vo={null} category={p.category} />
					</Freeze>
				</Sequence>
			) : null}
			{p.badge != null ? <RewatchBadge value={p.badge} proofStart={proofStart} category={p.category} /> : null}
		</AbsoluteFill>
	);
};
