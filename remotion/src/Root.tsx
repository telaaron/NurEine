import { Composition } from 'remotion';
import { ReelDaily, reelDailyDefault, calcReelDailyMetadata, DAILY_FPS } from './ReelDaily';
import { Reel, reelDefaultProps, REEL_FPS, REEL_DURATION_FRAMES } from './Reel';
import { ReelPro, reelProDefault, PRO_FPS, PRO_DURATION } from './ReelPro';
import { AssetSheet } from './AssetSheet';
import { BgShowcase } from './BgShowcase';
import { LogoIntroScene, LOGO_INTRO_DURATION } from './scenes/LogoIntroScene';
import { NewspaperScene, newspaperDefault, NEWSPAPER_DURATION } from './scenes/NewspaperScene';
import { CharLighthouse, CharOrigami, CharAbstract } from './scenes/Characters';
import { CharacterReel, charReelDefault, CHAR_REEL_DURATION } from './CharacterReel';
import { Character } from './character/Character';
import { AbsoluteFill } from 'remotion';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* Produktions-Reel (täglicher Cron rendert diese Komposition) */}
			<Composition
				id="ReelDaily"
				component={ReelDaily}
				durationInFrames={reelDailyDefault.durationInFrames}
				fps={DAILY_FPS}
				width={1080}
				height={1920}
				defaultProps={reelDailyDefault}
				calculateMetadata={calcReelDailyMetadata}
			/>
			<Composition
				id="Reel"
				component={Reel}
				durationInFrames={REEL_DURATION_FRAMES}
				fps={REEL_FPS}
				width={1080}
				height={1920}
				defaultProps={reelDefaultProps}
			/>
			<Composition
				id="ReelPro"
				component={ReelPro}
				durationInFrames={PRO_DURATION}
				fps={PRO_FPS}
				width={1080}
				height={1920}
				defaultProps={reelProDefault}
			/>
			<Composition id="AssetSheet" component={AssetSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
			<Composition id="BgShowcase" component={BgShowcase} durationInFrames={120} fps={30} width={1080} height={1920} />

			{/* ── Einzel-Szenen (Feinschliff in Studio) ── */}
			<Composition
				id="Scene-LogoIntro"
				component={LogoIntroScene}
				durationInFrames={LOGO_INTRO_DURATION}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{ category: 'innovation' }}
			/>
			<Composition
				id="Scene-Newspaper"
				component={NewspaperScene}
				durationInFrames={NEWSPAPER_DURATION}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={newspaperDefault}
			/>
			<Composition id="Char-A-Lighthouse" component={CharLighthouse} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ category: 'innovation' }} />
			<Composition id="Char-B-Origami" component={CharOrigami} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ category: 'klima' }} />
			<Composition id="Char-C-Abstract" component={CharAbstract} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ category: 'wissenschaft' }} />

			{/* Terracotta-Man Erzähler */}
			<Composition
				id="CharacterReel"
				component={CharacterReel}
				durationInFrames={CHAR_REEL_DURATION}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={charReelDefault}
			/>
			<Composition
				id="Char-Test"
				component={(props: { pose: 'idle' | 'point-up' | 'reading' | 'point-side' | 'thinking' | 'wave' }) => (
					<AbsoluteFill style={{ background: 'linear-gradient(165deg,#d3bfa6,#c4ad92)' }}>
						<Character pose={props.pose} enterFrame={0} from="bottom" size={1100} />
					</AbsoluteFill>
				)}
				durationInFrames={60}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{ pose: 'point-up' as const }}
			/>
		</>
	);
};
