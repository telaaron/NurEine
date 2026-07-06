import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { CANVAS, INK, MUTED, AMBER, accentFor, CATEGORY_ACCENT, FF, FONTS } from './brand';
import { CATEGORY_ICON_COMP, IconCheck, IconShare, IconBookmark, IconGlobe } from './icons';
import { LogoLockup, Badge, ProgressBar, BeforeAfter } from './components/brand-graphics';

// Statischer Kontaktbogen ALLER Reel-Assets — eine Übersicht auf 1080x1920.
export const AssetSheet: React.FC = () => {
	const [h] = React.useState(() => delayRender('sheet-fonts'));
	React.useEffect(() => {
		Promise.all([
			loadFont({ family: FF.grotesk, url: FONTS.grotesk }),
			loadFont({ family: FF.interSemi, url: FONTS.interSemi }),
			loadFont({ family: FF.inter, url: FONTS.inter }),
			loadFont({ family: FF.newsreader, url: FONTS.newsreader })
		]).then(() => continueRender(h)).catch(() => continueRender(h));
	}, [h]);

	const H = (t: string) => <div style={{ fontFamily: FF.interSemi, fontSize: 24, color: AMBER, letterSpacing: '0.08em', margin: '0 0 16px' }}>{t.toUpperCase()}</div>;
	const cats = Object.keys(CATEGORY_ICON_COMP);
	const fluxBgs = ['amber-deep', 'warm-light', 'sage-calm', 'sky-quiet'];

	return (
		<AbsoluteFill style={{ background: CANVAS, padding: 56, fontFamily: FF.inter }}>
			<div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 32 }}>
				<div style={{ fontFamily: FF.grotesk, fontSize: 52, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>Asset-Bibliothek</div>
				<div style={{ fontFamily: FF.interSemi, fontSize: 26, color: MUTED, marginLeft: 18 }}>NurEine Reels</div>
			</div>

			{/* Farben */}
			{H('Farben — Marke + Kategorie-Akzente')}
			<div style={{ display: 'flex', gap: 12, marginBottom: 34, flexWrap: 'wrap' }}>
				{[['Canvas', CANVAS], ['Ink', INK], ['Amber', AMBER]].map(([n, c]) => (
					<div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<div style={{ width: 96, height: 96, borderRadius: 16, background: c, border: '1px solid #ddd4c6' }} />
						<div style={{ fontFamily: FF.inter, fontSize: 20, color: MUTED, marginTop: 8 }}>{n}</div>
					</div>
				))}
				{Object.entries(CATEGORY_ACCENT).filter((_, i) => i < 5).map(([n, c]) => (
					<div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<div style={{ width: 96, height: 96, borderRadius: 16, background: c }} />
						<div style={{ fontFamily: FF.inter, fontSize: 18, color: MUTED, marginTop: 8 }}>{n}</div>
					</div>
				))}
			</div>

			{/* Kategorie-Icons */}
			{H('Kategorie-Icons')}
			<div style={{ display: 'flex', gap: 20, marginBottom: 34, flexWrap: 'wrap' }}>
				{cats.map((c) => {
					const Icon = CATEGORY_ICON_COMP[c];
					return (
						<div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 120 }}>
							<div style={{ width: 88, height: 88, borderRadius: 20, background: accentFor(c), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<Icon size={48} color="#fff" />
							</div>
							<div style={{ fontFamily: FF.inter, fontSize: 18, color: MUTED, marginTop: 8 }}>{c}</div>
						</div>
					);
				})}
			</div>

			{/* Funktionale Icons + Logo */}
			{H('Marke + funktionale Icons')}
			<div style={{ display: 'flex', gap: 40, alignItems: 'center', marginBottom: 34 }}>
				<LogoLockup onDark={false} />
				{[IconCheck, IconShare, IconBookmark, IconGlobe].map((Ic, i) => (
					<div key={i} style={{ width: 60, height: 60, color: INK }}><Ic size={60} color={INK} /></div>
				))}
			</div>

			{/* Badges */}
			{H('Badge-Familie (animiert: snappen rein)')}
			<div style={{ display: 'flex', gap: 20, marginBottom: 34 }}>
				<Badge text="Belegt" startFrame={-100} accent={AMBER} />
				<Badge text="Peer-reviewed" startFrame={-100} accent={accentFor('gesundheit')} />
				<Badge text="Quelle" startFrame={-100} accent={accentFor('wissenschaft')} />
			</div>

			{/* Daten-Vokabular */}
			{H('Daten-Vokabular (animiert)')}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 34, background: '#2a2a2a', borderRadius: 20, padding: 28 }}>
				<ProgressBar pct={72} startFrame={-100} accent={AMBER} label="Reichweite" />
				<ProgressBar pct={90} startFrame={-100} accent={accentFor('klima')} label="Belege" />
				<div style={{ transform: 'scale(0.5)', transformOrigin: 'left center', height: 90 }}>
					<BeforeAfter before="1.253" after="20" startFrame={-100} accent={AMBER} />
				</div>
			</div>

			{/* FLUX-Hintergründe */}
			{H('FLUX-Hintergründe (4 Varianten)')}
			<div style={{ display: 'flex', gap: 14 }}>
				{fluxBgs.map((f) => (
					<div key={f} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<div style={{ width: 130, height: 231, borderRadius: 12, overflow: 'hidden', border: '1px solid #ddd4c6' }}>
							<Img src={staticFile(`backgrounds/flux/${f}.png`)} style={{ width: 130, height: 231, objectFit: 'cover' }} />
						</div>
						<div style={{ fontFamily: FF.inter, fontSize: 17, color: MUTED, marginTop: 6 }}>{f}</div>
					</div>
				))}
			</div>

			<div style={{ position: 'absolute', bottom: 40, left: 56, fontFamily: FF.inter, fontSize: 20, color: MUTED }}>
				+ 3 bewegte Code-BGs (Paper/Mesh/Blobs) · Logo-Intro · 2 Musik-Pads · 4 Sound-FX — als Clips separat
			</div>
		</AbsoluteFill>
	);
};
