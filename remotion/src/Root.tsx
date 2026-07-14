import { Composition } from 'remotion';
import { ReelTikTok, reelTikTokDefault, calcReelTikTokMetadata, TIKTOK_FPS } from './ReelTikTok';

/**
 * Seit 2026-07-14: NUR NOCH EINE Kurzvideo-Komposition — der gereifte
 * `ReelTikTok`-Master. Er ist das tägliche TikTok UND (an IG-Reel-Tagen) das
 * Instagram-Reel — dasselbe 9:16-MP4, identische Safe-Zones. Der alte
 * `ReelDaily`-Build und die Studio-Experimente (Reel, ReelPro, CharacterReel,
 * AssetSheet, Einzel-Szenen) wurden verworfen. Die geteilten Typen leben weiter
 * in `ReelDaily.tsx` (reines Datenmodell).
 */
export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="ReelTikTok"
			component={ReelTikTok}
			durationInFrames={reelTikTokDefault.durationInFrames}
			fps={TIKTOK_FPS}
			width={1080}
			height={1920}
			defaultProps={reelTikTokDefault}
			calculateMetadata={calcReelTikTokMetadata}
		/>
	);
};
