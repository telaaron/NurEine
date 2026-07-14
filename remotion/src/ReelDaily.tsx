import type { CalculateMetadataFunction } from 'remotion';
import { type Person, type Pose } from './character/Character';

/**
 * Reel-Typen & Defaults — das gemeinsame Datenmodell der Kurzvideo-Pipeline.
 *
 * Historie: Hieß mal „ReelDaily" und trug eine eigene, ruhigere IG-Reel-Render-
 * Komponente. Seit 2026-07-14 gibt es NUR NOCH EINE Kurzvideo-Pipeline — den
 * gereiften TikTok-Master (`ReelTikTok`), der an IG-Reel-Tagen ZUSÄTZLICH auf
 * Instagram gepostet wird (dasselbe 9:16-MP4, identische Safe-Zones). Die alte
 * `ReelDaily`-Render-Komponente wurde verworfen; diese Datei behält nur die
 * geteilten Typen/Defaults, die `ReelTikTok.tsx` importiert (Dateiname bleibt aus
 * Kompatibilität, damit die Import-Pfade stabil sind).
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
		// snap/kicker auf number: Cold-Open (Zahl steht ab Frame 0, kein Count-up).
		| { kind: 'hook'; text: string; punch: string; kicker: string }
		// image auf number: Themen-Anker — Perlen-Bild dunkel HINTER der Zahl.
		| { kind: 'number'; value: string; unit: string | null; context: string; snap?: boolean; kicker?: string | null; image?: string | null }
		| { kind: 'beat'; text: string; image: string | null; pose: Pose }
		// progress: Wachstums-Archiv-Klimax („Fortschritt Nr. N" + Punkt-Spirale).
		// snapshot: Quellen-Faksimile-Kärtchen (USP visuell — Titel/Journal/Jahr/Zitat).
		| { kind: 'proof'; source: string; impact: number | null; progress?: number | null; snapshot?: { title: string; outlet: string; year: string; quote: string } | null }
		// map: Karten-Zoom auf Story-Koordinaten (lat/lng aus nureine_stories).
		| { kind: 'map'; lat: number; lng: number; label: string }
		// engage: Icon-Nudge (Herz/Kommentar/Teilen) im Loop-Ende.
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
	/** Loop-Naht — durationInFrames enthält dann den Loop-Schwanz (14 Frames). */
	loop?: boolean;
	/** Rewatch-Badge: Wirkungsindex unerklärt ab ~Sek 2, Auflösung im Stempel. */
	badge?: number | null;
	/** Soft-CTA (Strategie §5): stiller Text-Overlay ~Sek 8–15, loop-schonend. */
	softCta?: string | null;
}

export const reelDailyDefault: ReelDailyProps = {
	scenes: [
		{ kind: 'number', start: 0, dur: 80, snap: true, value: '50 Mio', unit: 'Menschen', context: 'bekommen zum ersten Mal Strom.', kicker: 'TAG 1 · NUR EINE', vo: null },
		{ kind: 'hook', start: 80, dur: 70, text: 'Der größte Netz-Ausbau der Geschichte.', punch: 'größte', kicker: 'GUTE NACHRICHT · INNOVATION', vo: null },
		{ kind: 'beat', start: 150, dur: 90, text: 'Quer durch 40 Länder in Afrika.', image: null, pose: 'point-side', vo: null },
		{ kind: 'proof', start: 240, dur: 60, source: 'Weltbank', impact: 87, progress: 1080, vo: null },
		{ kind: 'end', start: 300, dur: 90, share: 'Stell dir vor: 50 Millionen sehen zum ersten Mal abends Licht.', cta: '', hasVo: false, vo: null }
	],
	category: 'innovation',
	seed: 'demo',
	musicFile: 'audio/warm-1.mp3',
	hasVo: false,
	durationInFrames: 390,
	loop: true
};

export const calcReelDailyMetadata: CalculateMetadataFunction<ReelDailyProps> = ({ props }) => ({
	durationInFrames: Math.max(90, props.durationInFrames),
	fps: DAILY_FPS
});
