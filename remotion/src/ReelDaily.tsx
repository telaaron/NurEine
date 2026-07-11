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
	CalculateMetadataFunction
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { CANVAS, PAPER, INK, AMBER, AMBER_DEEP, MUTED, accentFor, FF, FONTS } from './brand';
import { Character, personForSeed, type Person, type Pose } from './character/Character';
import { CountUpNumber } from './components/brand-graphics';
import { PaperTextureOverlay } from './scenes/paper-textures';

/**
 * ReelDaily — das tägliche NurEine-Reel (v3.1, Juli 2026).
 *
 * Regeln aus dem IG-Research (Juni/Juli 2026):
 *  - Hook-Text steht ab FRAME 0 (3-Sekunden-Drop-off ist die dominante Metrik).
 *  - Szenenwechsel alle ~2-3s mit hartem Kontrast (hell→dunkel→hell), 15-30s.
 *  - Sends sind das Top-Ranking-Signal → Endcard = expliziter Schick-CTA.
 *  - Beleg/Quelle als sichtbares Stilmittel (USP) — Stempel-Szene "Belegt."
 *  - Figur ("Moderator") als Marken-Element in Nebenrolle, kein sprechender Avatar.
 *
 * v3.1 (Aarons Feedback 2026-07-06): Voiceover läuft PRO SZENE — jede Szene
 * trägt ihr eigenes VO-Segment, das exakt den Screen-Text spricht. Kein
 * Auseinanderlaufen von Bild und Stimme mehr. Captions sind szenenlokal.
 */

export const DAILY_FPS = 30;

export interface CaptionWord {
	t: string;
	start: number; // Frame, relativ zum SZENEN-Start
	end: number;
}

export interface SceneVo {
	file: string; // unter public/ (z.B. "vo/slug-hook.mp3")
	words: CaptionWord[];
	durFrames: number;
}

interface SceneBase {
	start: number;
	dur: number;
	vo?: SceneVo | null;
}

export type DailyScene = SceneBase &
	(
		// snap/kicker auf number: TikTok-Cold-Open (Zahl steht ab Frame 0, kein
		// Count-up von 0). ReelDaily ignoriert beide Felder, nur ReelTikTok wertet sie aus.
		| { kind: 'hook'; text: string; punch: string; kicker: string }
		| { kind: 'number'; value: string; unit: string | null; context: string; snap?: boolean; kicker?: string | null }
		| { kind: 'beat'; text: string; image: string | null; pose: Pose }
		| { kind: 'proof'; source: string; impact: number | null }
		// map: Karten-Zoom auf Story-Koordinaten (lat/lng aus nureine_stories) —
		// nur ReelTikTok rendert diesen Baustein, ReelDaily überspringt ihn.
		| { kind: 'map'; lat: number; lng: number; label: string }
		// engage: Icon-Nudge (Herz/Kommentar/Teilen) im TikTok-Loop-Ende — nur ReelTikTok.
		| { kind: 'end'; share: string; cta: string; hasVo: boolean; engage?: boolean }
	);

export interface ReelDailyProps {
	scenes: DailyScene[];
	category: string;
	seed: string;
	/** Moderator:in — fehlt sie, entscheidet der Seed (Feed wechselt ab). */
	person?: Person | null;
	musicFile: string;
	hasVo: boolean;
	durationInFrames: number;
	/** TikTok-Rezept (docs/TIKTOK_FORMAT_REZEPT.md §C): Loop-Naht — durationInFrames
	 *  enthält dann den Loop-Schwanz (14 Frames). Von ReelDaily ignoriert. */
	loop?: boolean;
	/** Rewatch-Badge: Wirkungsindex unerklärt ab ~Sek 2, Auflösung im Stempel.
	 *  Von ReelDaily ignoriert. */
	badge?: number | null;
}

export const reelDailyDefault: ReelDailyProps = {
	scenes: [
		{ kind: 'hook', start: 0, dur: 80, text: '50 Millionen Menschen haben zum ersten Mal Strom.', punch: '50 Millionen', kicker: 'GUTE NACHRICHT · INNOVATION', vo: null },
		{ kind: 'number', start: 80, dur: 70, value: '50 Mio', unit: 'Menschen', context: 'bekommen Strom — über eine Initiative in 40 Ländern.', vo: null },
		{ kind: 'beat', start: 150, dur: 90, text: 'Der größte Netz-Ausbau der Geschichte — quer durch Afrika.', image: null, pose: 'point-side', vo: null },
		{ kind: 'proof', start: 240, dur: 60, source: 'Weltbank', impact: 87, vo: null },
		{ kind: 'end', start: 300, dur: 90, share: 'Stell dir vor: 50 Millionen Menschen sehen zum ersten Mal abends Licht.', cta: 'Schick’s jemandem, der das heute braucht', hasVo: false, vo: null }
	],
	category: 'innovation',
	seed: 'demo',
	musicFile: 'audio/uplift-1.mp3',
	hasVo: false,
	durationInFrames: 390
};

export const calcReelDailyMetadata: CalculateMetadataFunction<ReelDailyProps> = ({ props }) => ({
	durationInFrames: Math.max(90, props.durationInFrames),
	fps: DAILY_FPS
});

// ── Fonts ────────────────────────────────────────────────────────────────────
let fontsReady = false;
function useFonts() {
	const [h] = React.useState(() => delayRender('daily-fonts'));
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

// IG-Safe-Zones bei 1080×1920
const SAFE_TOP = 210;
const SAFE_BOTTOM = 420;
const M = 84; // Seitenrand

// ── Szenen-lokales VO + Karaoke-Captions (Frames relativ zur Szene) ─────────
const SceneVoice: React.FC<{ vo: SceneVo | null | undefined; dark?: boolean; captions?: boolean; align?: 'center' | 'left' }> = ({ vo, dark, captions = true, align = 'center' }) => {
	const frame = useCurrentFrame();
	if (!vo) return null;
	const chunks: CaptionWord[][] = [];
	for (let i = 0; i < vo.words.length; i += 4) chunks.push(vo.words.slice(i, i + 4));
	const current = chunks.find((c) => frame >= c[0].start && frame <= c[c.length - 1].end + 8);
	return (
		<>
			<Audio src={staticFile(vo.file)} volume={1} />
			{captions && current ? (
				<div style={{ position: 'absolute', left: align === 'left' ? M : 60, right: align === 'left' ? 380 : 60, bottom: SAFE_BOTTOM + 30, display: 'flex', justifyContent: align === 'left' ? 'flex-start' : 'center', zIndex: 20 }}>
					<div style={{ background: dark ? 'rgba(244,239,230,0.94)' : 'rgba(22,20,15,0.85)', borderRadius: 18, padding: '16px 28px', maxWidth: 920 }}>
						<div style={{ fontFamily: FF.interSemi, fontSize: 40, lineHeight: 1.25, color: dark ? INK : '#fff', textAlign: align === 'left' ? 'left' : 'center' }}>
							{current.map((w, i) => (
								<span key={i} style={{ color: frame >= w.start ? (frame <= w.end ? (dark ? AMBER_DEEP : AMBER) : dark ? INK : '#fff') : dark ? 'rgba(22,20,15,0.4)' : 'rgba(255,255,255,0.45)' }}>
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

// ── Szene 1: HOOK — Text steht ab Frame 0, Punch-Wort bekommt Marker-Sweep ──
const HookScene: React.FC<Extract<DailyScene, { kind: 'hook' }>> = ({ text, punch, kicker, vo }) => {
	const frame = useCurrentFrame();
	const accent = AMBER;
	const settle = interpolate(frame, [0, 14], [1.035, 1], { extrapolateRight: 'clamp' });
	const sweep = interpolate(frame, [6, 22], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// Schriftgröße: nach Gesamtlänge, aber gedeckelt durch das LÄNGSTE Wort —
	// "Feuerwehrschläuche" (18 Zeichen) lief sonst aus dem Bild (kein Umbruch
	// innerhalb eines Wortes). ~0.58em mittlere Glyphenbreite bei Grotesk Bold.
	const longestWord = Math.max(...text.split(/\s+/).map((w) => w.length));
	const byLength = text.length <= 55 ? 108 : text.length <= 85 ? 92 : 78;
	const size = Math.min(byLength, Math.floor((1080 - 2 * M) / (longestWord * 0.58) / 1.12));

	const idx = punch ? text.toLowerCase().indexOf(punch.toLowerCase()) : -1;
	const pre = idx >= 0 ? text.slice(0, idx) : text;
	const hit = idx >= 0 ? text.slice(idx, idx + punch.length) : '';
	const post = idx >= 0 ? text.slice(idx + punch.length) : '';

	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.05} />
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 40, display: 'flex', alignItems: 'center' }}>
				<div style={{ width: 14, height: 14, background: accent, borderRadius: 2, marginRight: 16 }} />
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, letterSpacing: '0.14em', color: MUTED }}>{kicker}</div>
			</div>
			{/* Vertikal zentriert zwischen Kicker und Footer — kein toter Raum */}
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 220, bottom: SAFE_BOTTOM + 120, display: 'flex', alignItems: 'center', transform: `scale(${settle})`, transformOrigin: 'left center' }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: Math.round(size * 1.12), lineHeight: 1.08, letterSpacing: '-0.03em', color: INK, wordBreak: 'break-word' }}>
					{pre}
					{hit ? (
						// Marker als background-image des Spans: folgt Zeilenumbrüchen korrekt
						// (die absolute Overlay-Box malte bei Umbruch über die falsche Zeile).
						<span
							style={{
								backgroundImage: `linear-gradient(${accent}55, ${accent}55)`,
								backgroundRepeat: 'no-repeat',
								backgroundSize: `${sweep}% 74%`,
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
			<SceneVoice vo={vo} />
		</AbsoluteFill>
	);
};

// ── Szene 2: ZAHL — harter Kontrast (dunkel), Count-up ──────────────────────
const NumberScene: React.FC<Extract<DailyScene, { kind: 'number' }> & { category: string }> = ({ value, unit, context, category, vo }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const lineW = interpolate(spring({ frame: frame - 8, fps: DAILY_FPS, config: { damping: 200 } }), [0, 1], [0, 620]);
	const ctxOp = interpolate(frame, [14, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const ctxY = interpolate(frame, [14, 30], [26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ background: INK }}>
			<AbsoluteFill style={{ background: `radial-gradient(90% 55% at 50% 30%, ${accent}33, transparent 70%)` }} />
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 170 }}>
				<CountUpNumber value={value} unit={unit} category={category} startFrame={2} />
				<div style={{ height: 10, background: accent, marginTop: 30, width: lineW, borderRadius: 8 }} />
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 66, lineHeight: 1.12, letterSpacing: '-0.02em', color: '#fff', marginTop: 44, wordBreak: 'break-word', opacity: ctxOp, transform: `translateY(${ctxY}px)` }}>
					{context}
				</div>
			</div>
			<SceneVoice vo={vo} dark />
		</AbsoluteFill>
	);
};

// ── Szene 3: BEAT — Bild-Panel (editorial) + Zeile + Figur klein ────────────
const BeatScene: React.FC<Extract<DailyScene, { kind: 'beat' }> & { category: string; seed: string; person: Person }> = ({ text, image, pose, category, seed, person, vo }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const panelS = spring({ frame: frame - 2, fps: DAILY_FPS, config: { damping: 15, mass: 0.8, stiffness: 120 } });
	const panelY = interpolate(panelS, [0, 1], [90, 0]);
	const panelOp = interpolate(panelS, [0, 0.35], [0, 1]);
	const zoom = 1 + frame * 0.0011;
	const textS = spring({ frame: frame - 8, fps: DAILY_FPS, config: { damping: 16, mass: 0.7 } });
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.05} />
			{image ? (
				<>
					<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 30, height: 720, transform: `translateY(${panelY}px) rotate(-1.4deg)`, opacity: panelOp, background: PAPER, padding: 22, boxShadow: '0 30px 70px rgba(60,40,20,0.25)', borderRadius: 6 }}>
						<div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 3 }}>
							<Img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />
						</div>
						<div style={{ position: 'absolute', bottom: 30, left: 34, fontFamily: FF.inter, fontSize: 22, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>Illustration: KI · NurEine</div>
					</div>
					<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 820, transform: `translateY(${interpolate(textS, [0, 1], [40, 0])}px)`, opacity: interpolate(textS, [0, 0.4], [0, 1]) }}>
						<div style={{ width: 96, height: 8, background: accent, marginBottom: 26, borderRadius: 4 }} />
						<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 60, lineHeight: 1.12, letterSpacing: '-0.025em', color: INK, wordBreak: 'break-word' }}>{text}</div>
					</div>
				</>
			) : (
				// Ohne Bild: Text vertikal ZENTRIERT (nicht oben „random"), Figur unten rechts.
				<div style={{ position: 'absolute', left: M, right: 340, top: SAFE_TOP + 60, bottom: SAFE_BOTTOM + 260, display: 'flex', alignItems: 'center', transform: `translateY(${interpolate(textS, [0, 1], [40, 0])}px)`, opacity: interpolate(textS, [0, 0.4], [0, 1]) }}>
					<div>
						<div style={{ width: 96, height: 8, background: accent, marginBottom: 30, borderRadius: 4 }} />
						<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 78, lineHeight: 1.1, letterSpacing: '-0.025em', color: INK, wordBreak: 'break-word' }}>{text}</div>
					</div>
				</div>
			)}
			{/* point-side zeigt gespiegelt zum TEXT (statt aus dem Bild raus — dort wurde
			    der Finger vom Rand abgeschnitten und die Geste lief ins Leere) */}
			{!image ? <Character pose={pose} enterFrame={0} from="bottom" size={760} align="right" flip={pose === 'point-side'} seed={seed} person={person} /> : null}
			{/* Ohne Bild steht der VOLLE Text schon groß im Bild und die Figur variiert je
			    Pose ihre Position — Caption wäre redundant und kollidiert mit dem Kopf → aus. */}
			<SceneVoice vo={vo} captions={!!image} />
		</AbsoluteFill>
	);
};

// ── Szene 4: BELEG — Stempel "Belegt." + Quelle + Wirkungsindex ─────────────
const ProofScene: React.FC<Extract<DailyScene, { kind: 'proof' }> & { category: string }> = ({ source, impact, category, vo }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const stamp = spring({ frame: frame - 4, fps: DAILY_FPS, config: { damping: 13, mass: 0.6, stiffness: 190 } });
	const stampScale = interpolate(stamp, [0, 1], [2.1, 1]);
	const stampOp = interpolate(stamp, [0, 0.25], [0, 1]);
	const rowOp = interpolate(frame, [16, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const barW = interpolate(spring({ frame: frame - 20, fps: DAILY_FPS, config: { damping: 200 } }), [0, 1], [0, Math.min(100, Math.max(8, impact ?? 0))]);
	return (
		<AbsoluteFill style={{ background: PAPER }}>
			<PaperTextureOverlay kind="halftone" opacity={0.06} />
			<div style={{ position: 'absolute', left: M, top: SAFE_TOP + 230, transform: `scale(${stampScale}) rotate(-4deg)`, transformOrigin: 'left center', opacity: stampOp }}>
				<div style={{ display: 'inline-block', border: `10px solid ${accent}`, borderRadius: 14, padding: '10px 38px' }}>
					<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 150, letterSpacing: '-0.03em', color: accent, lineHeight: 1 }}>Belegt.</div>
				</div>
			</div>
			<div style={{ position: 'absolute', left: M, right: M, top: SAFE_TOP + 620, opacity: rowOp }}>
				<div style={{ fontFamily: FF.newsreader, fontSize: 52, color: INK, lineHeight: 1.3 }}>Quelle: {source}</div>
				{impact != null ? (
					<div style={{ marginTop: 52 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
							<div style={{ fontFamily: FF.interSemi, fontSize: 32, color: MUTED }}>Wirkungsindex</div>
							<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: 40, color: INK }}>{impact}/100</div>
						</div>
						<div style={{ width: '100%', height: 18, borderRadius: 18, background: 'rgba(22,20,15,0.1)', overflow: 'hidden' }}>
							<div style={{ width: `${barW}%`, height: 18, borderRadius: 18, background: accent }} />
						</div>
					</div>
				) : null}
				<div style={{ fontFamily: FF.inter, fontSize: 30, color: MUTED, marginTop: 40 }}>Jede Story nachgeprüft — Methodik auf nureine.de</div>
			</div>
			<SceneVoice vo={vo} />
		</AbsoluteFill>
	);
};

// ── Szene 5: ENDCARD — Share-Zeile zentriert + Schick-CTA + Loop-Anschluss ──
const EndScene: React.FC<Extract<DailyScene, { kind: 'end' }> & { category: string; seed: string; person: Person }> = ({ share, cta, hasVo, category, seed, person, vo }) => {
	const frame = useCurrentFrame();
	const accent = accentFor(category);
	const s = spring({ frame: frame - 2, fps: DAILY_FPS, config: { damping: 15, mass: 0.7 } });
	const pulse = 1 + 0.03 * Math.sin((frame / DAILY_FPS) * Math.PI * 2.2);
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<PaperTextureOverlay kind="halftone" opacity={0.05} />
			{/* Share-Zeile vertikal zentriert im Band über dem CTA — nicht „random oben" */}
			<div style={{ position: 'absolute', left: M, right: 300, top: SAFE_TOP + 40, bottom: SAFE_BOTTOM + 340, display: 'flex', alignItems: 'center', transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`, opacity: interpolate(s, [0, 0.4], [0, 1]) }}>
				<div style={{ fontFamily: FF.grotesk, fontWeight: 700, fontSize: share.length <= 70 ? 72 : 58, lineHeight: 1.12, letterSpacing: '-0.03em', color: INK }}>{share}</div>
			</div>
			{/* Figur klein unten rechts — CTA-Block liegt IMMER darüber (zIndex) und endet vor ihr */}
			<Character pose="wave" enterFrame={4} from="bottom" size={680} align="right" seed={seed} person={person} />
			<div style={{ position: 'absolute', left: M, right: 400, bottom: SAFE_BOTTOM, transform: `scale(${pulse})`, transformOrigin: 'left center', zIndex: 5 }}>
				<div style={{ display: 'inline-flex', alignItems: 'center', height: 100, background: accent, borderRadius: 60, padding: '0 46px', boxShadow: '0 16px 40px rgba(60,40,20,0.28)' }}>
					<div style={{ fontFamily: FF.interSemi, fontSize: 36, color: '#fff' }}>{cta} ↗</div>
				</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 30, color: AMBER_DEEP, marginTop: 24 }}>@nureine.de — täglich eine gute Nachricht</div>
				<div style={{ fontFamily: FF.inter, fontSize: 22, color: MUTED, marginTop: 14 }}>{hasVo ? 'Illustration & Stimme: KI · ' : 'Illustration: KI · '}Kuratiert von Menschen</div>
			</div>
			{/* Stimme ja, Captions nein — der CTA-Satz steht bereits als Pill im Bild */}
			<SceneVoice vo={vo} captions={false} />
		</AbsoluteFill>
	);
};

// ── Haupt-Komposition ───────────────────────────────────────────────────────
export const ReelDaily: React.FC<ReelDailyProps> = (p) => {
	useFonts();
	const person = p.person || personForSeed(p.seed);
	const total = p.durationInFrames;
	const musicVol = p.hasVo ? 0.14 : 0.3;
	return (
		<AbsoluteFill style={{ background: CANVAS }}>
			<Audio
				src={staticFile(p.musicFile)}
				loop
				volume={(f) => interpolate(f, [0, 16, total - 26, total], [0, musicVol, musicVol, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
			/>
			{p.scenes.map((sc, i) => (
				<Sequence key={i} from={sc.start} durationInFrames={sc.dur}>
					{sc.kind === 'hook' ? <HookScene {...sc} /> : null}
					{sc.kind === 'number' ? <NumberScene {...sc} category={p.category} /> : null}
					{sc.kind === 'beat' ? <BeatScene {...sc} category={p.category} seed={p.seed} person={person} /> : null}
					{sc.kind === 'proof' ? <ProofScene {...sc} category={p.category} /> : null}
					{sc.kind === 'end' ? <EndScene {...sc} category={p.category} seed={p.seed} person={person} /> : null}
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
