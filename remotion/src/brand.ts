import { staticFile } from 'remotion';

// NurEine-Marken-DNA — identisch zu carousel.ts / reel-frames.ts.
export const CANVAS = '#f4efe6';
export const PAPER = '#fbf8f1';
export const INK = '#16140f';
export const MUTED = '#6b6359';
export const FAINT = '#9a9087';
export const AMBER = '#bd6a35';
export const AMBER_DEEP = '#9c5527';

export const CATEGORY_ACCENT: Record<string, string> = {
	klima: '#56764e',
	gesundheit: '#b06f6f',
	wissenschaft: '#5d7e9c',
	gemeinschaft: '#bd6a35',
	tiere: '#56764e',
	kultur: '#bd6a35',
	innovation: '#5d7e9c'
};

export function accentFor(category: string): string {
	return CATEGORY_ACCENT[category] || AMBER;
}

// Marken-Fonts aus public/fonts (via @remotion/fonts geladen).
export const FONTS = {
	grotesk: staticFile('fonts/SpaceGrotesk-Bold.ttf'),
	interSemi: staticFile('fonts/Inter-SemiBold.ttf'),
	inter: staticFile('fonts/Inter-Regular.ttf'),
	newsreader: staticFile('fonts/Newsreader-Italic.ttf')
};

export const FF = {
	grotesk: 'SpaceGrotesk',
	interSemi: 'InterSemi',
	inter: 'Inter',
	newsreader: 'Newsreader'
};
