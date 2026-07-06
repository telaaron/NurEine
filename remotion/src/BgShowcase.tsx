import React from 'react';
import { AbsoluteFill, useCurrentFrame, continueRender, delayRender } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { FF, FONTS } from './brand';
import { PaperTexture, GradientMesh, DriftingBlobs } from './backgrounds';
import { LogoIntro } from './components/brand-graphics';

// Bewegte Code-Backgrounds + Logo-Intro nebeneinander (2x2), damit die Bewegung
// als Clip sichtbar wird. category='innovation' als Beispiel.
export const BgShowcase: React.FC = () => {
	const [h] = React.useState(() => delayRender('bg-fonts'));
	React.useEffect(() => {
		Promise.all([loadFont({ family: FF.grotesk, url: FONTS.grotesk }), loadFont({ family: FF.interSemi, url: FONTS.interSemi })])
			.then(() => continueRender(h))
			.catch(() => continueRender(h));
	}, [h]);

	const cat = 'innovation';
	const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
		<div style={{ position: 'relative', width: '50%', height: '50%', overflow: 'hidden', border: '2px solid #000' }}>
			{children}
			<div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: FF.interSemi, fontSize: 22, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 20 }}>{label}</div>
		</div>
	);

	return (
		<AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
			<Cell label="Paper-Textur"><PaperTexture category="klima" tone="light" /></Cell>
			<Cell label="Gradient-Mesh"><GradientMesh category={cat} /></Cell>
			<Cell label="Drifting-Blobs"><DriftingBlobs category="gemeinschaft" tone="dark" /></Cell>
			<Cell label="Logo-Intro">
				<AbsoluteFill style={{ background: '#16140f', alignItems: 'center', justifyContent: 'center' }}>
					<div style={{ transform: 'scale(0.7)' }}><LogoIntro onDark /></div>
				</AbsoluteFill>
			</Cell>
		</AbsoluteFill>
	);
};
