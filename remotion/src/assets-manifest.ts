/**
 * NurEine Reel — Asset-Manifest (verbindliche Grundlage).
 *
 * Definiert ALLE Reel-Bausteine: Hintergründe, Icons, Badges, Daten-Vokabular,
 * Audio, Motion-Presets — plus welcher Slot pro Reel-Typ womit gefüllt wird und
 * wie rotiert wird. Der Video-Skill / Renderer liest DIESES Manifest, statt Assets
 * ad-hoc zu wählen → kohärenter, wiedererkennbarer Feed.
 *
 * Aus dem Interview (2026-07-01):
 *   - Ton: dichter & dynamischer (mehr Bewegung, gezielte Punch-Momente)
 *   - Bild-Basis: Mischung je Typ (A reine Typo · B Bild im Zentrum · C Typo/Grafik)
 *   - Hintergründe: animierte Paper-Textur + Gradient-Mesh + driftende Blobs
 *     (kein Partikel/Kitsch); zusätzlich FLUX-Bild-Varianten zum Vergleich
 *   - Grafik: Logo-Intro/Outro, Kategorie-Icons, Badge-Familie, Daten-Vokabular
 *   - Audio: 3-5 CC0-Loops (rotieren) + Sound-FX; selbst gerendert (Graph API
 *     erlaubt KEIN Trending-Audio bei automatischen Posts)
 */

export type ReelType = 'A' | 'B' | 'C';

// ── Hintergründe ────────────────────────────────────────────────────────────
// 'code' = prozedurale Remotion-Komponente, 'flux' = generiertes Standbild-Video.
export type BackgroundKind = 'paper' | 'mesh' | 'blobs' | 'flux-image' | 'flux';

export interface BackgroundAsset {
	id: string;
	kind: BackgroundKind;
	label: string;
	/** Für flux: Pfad in public/. Für code: Komponentenname in src/backgrounds. */
	ref: string;
	/** Passt zu welchen Reel-Typen? */
	forTypes: ReelType[];
}

export const BACKGROUNDS: BackgroundAsset[] = [
	// Prozedural (Code) — echte Bewegung.
	{ id: 'paper-warm', kind: 'paper', label: 'Papier warm (Fasern + Wabern)', ref: 'PaperTexture', forTypes: ['A', 'B', 'C'] },
	{ id: 'mesh-category', kind: 'mesh', label: 'Gradient-Mesh (Kategorie-Farben)', ref: 'GradientMesh', forTypes: ['A', 'C'] },
	{ id: 'blobs-drift', kind: 'blobs', label: 'Driftende Blobs', ref: 'DriftingBlobs', forTypes: ['A', 'C'] },
	// FLUX-Standbilder (Ken-Burns) — generiert, on-brand Paper-Collage.
	{ id: 'flux-amber-deep', kind: 'flux-image', label: 'FLUX amber-tief (heller Text)', ref: 'backgrounds/flux/amber-deep.png', forTypes: ['A', 'C'] },
	{ id: 'flux-warm-light', kind: 'flux-image', label: 'FLUX warm-hell (dunkler Text)', ref: 'backgrounds/flux/warm-light.png', forTypes: ['A'] },
	{ id: 'flux-sage-calm', kind: 'flux-image', label: 'FLUX sage-ruhig', ref: 'backgrounds/flux/sage-calm.png', forTypes: ['A', 'B'] },
	{ id: 'flux-sky-quiet', kind: 'flux-image', label: 'FLUX sky-still', ref: 'backgrounds/flux/sky-quiet.png', forTypes: ['A', 'B'] }
];

// ── Kategorie-Icons + funktionale Icons ─────────────────────────────────────
// Referenzieren Remotion-Komponenten in src/icons (Gratis-Set, marken-getrimmt).
export const CATEGORY_ICON: Record<string, string> = {
	klima: 'IconLeaf',
	gesundheit: 'IconHeartPulse',
	wissenschaft: 'IconFlask',
	gemeinschaft: 'IconUsers',
	tiere: 'IconPaw',
	kultur: 'IconPalette',
	innovation: 'IconSparkles'
};

export const FUNCTIONAL_ICON = {
	check: 'IconCheck',
	share: 'IconShare',
	save: 'IconBookmark',
	source: 'IconGlobe'
} as const;

// ── Badge-Familie (animierte Pills) ─────────────────────────────────────────
// impact_evidence-Grad → Badge-Text (identisch zur Carousel-evidenceLabel-Logik).
export function badgeForEvidence(score: number): string {
	if (score >= 90) return 'Peer-reviewed';
	if (score >= 70) return 'Belegt';
	if (score >= 50) return 'Solide Quelle';
	return 'Erste Hinweise';
}

// ── Daten-Vokabular (Typ C) ─────────────────────────────────────────────────
export type DataVizKind = 'countup' | 'bar' | 'beforeafter' | 'minichart';
export const DATA_VIZ: Record<DataVizKind, string> = {
	countup: 'CountUpNumber',
	bar: 'ProgressBar',
	beforeafter: 'BeforeAfterSlider',
	minichart: 'MiniChart'
};

// ── Audio (rotieren pro Reel per id-Hash → deterministisch) ──────────────────
export interface AudioLoop {
	id: string;
	file: string; // Pfad in public/audio
	mood: 'ruhig' | 'hoffnung' | 'warm';
	license: string; // Quelle + Lizenz (CC0 …) — Nachweis
}

export const MUSIC_LOOPS: AudioLoop[] = [
	// Vorerst synthetisierte Ambient-Pads (ffmpeg, 100% lizenzfrei da generiert).
	// TODO: gegen kuratierte CC0-Loops (Pixabay/Uppbeat) tauschen → reicherer Klang.
	{ id: 'calm-1', file: 'audio/calm-1.wav', mood: 'ruhig', license: 'synthetisiert (ffmpeg) — lizenzfrei' },
	{ id: 'hope-1', file: 'audio/hope-1.wav', mood: 'hoffnung', license: 'synthetisiert (ffmpeg) — lizenzfrei' }
];

export type SoundFx = 'whoosh' | 'settle' | 'click' | 'ping';
export const SOUND_FX: Record<SoundFx, string> = {
	whoosh: 'audio/fx/whoosh.wav', // beim Cut
	settle: 'audio/fx/settle.wav', // wenn die Zahl einrastet
	click: 'audio/fx/click.wav', // Badge/CTA
	ping: 'audio/fx/ping.wav' // Beleg-Häkchen
};

// ── Reel-Bauplan je Typ (welche Slots womit gefüllt werden) ─────────────────
export interface ReelBlueprint {
	type: ReelType;
	label: string;
	background: BackgroundKind[]; // erlaubte Hintergründe (rotieren)
	usesStoryImage: boolean;
	dataViz: DataVizKind | null;
	phases: string[]; // Dramaturgie
}

export const BLUEPRINTS: Record<ReelType, ReelBlueprint> = {
	A: {
		type: 'A',
		label: 'Satz auf Schwarz',
		background: ['paper', 'mesh', 'blobs'],
		usesStoryImage: false,
		dataViz: null,
		phases: ['logo-intro', 'hook-punch', 'aufloesung-snap', 'endcard-share']
	},
	B: {
		type: 'B',
		label: 'Atmendes Bild (Mensch/Charme)',
		background: ['flux-image'],
		usesStoryImage: true,
		dataViz: null,
		phases: ['logo-intro', 'hook-on-image', 'aufloesung-dim', 'endcard-share']
	},
	C: {
		type: 'C',
		label: 'Zahl zählt hoch',
		background: ['mesh', 'paper'],
		usesStoryImage: false,
		dataViz: 'countup',
		phases: ['logo-intro', 'number-countup', 'aufloesung-snap', 'endcard-share']
	}
};

/** Deterministische Rotation: gleiche Story → gleiches Asset (kein Flackern). */
export function pickByHash<T>(list: T[], seed: string): T | null {
	if (list.length === 0) return null;
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
	return list[h % list.length];
}
