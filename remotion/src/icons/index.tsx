import React from 'react';

/**
 * Marken-getrimmte Icons (Lucide-Linienstil, auf NurEine-Look angepasst).
 * Stroke-Icons, currentColor → nehmen die Akzent-/Kategorie-Farbe an.
 * Kategorie-Icons + funktionale Icons. Als einfache SVG-Komponenten (deterministisch).
 */

interface IconProps {
	size?: number;
	color?: string;
	strokeWidth?: number;
}

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 64, color = 'currentColor', strokeWidth = 2, children }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
		{children}
	</svg>
);

// ── Kategorie-Icons ─────────────────────────────────────────────────────────
export const IconLeaf: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
		<path d="M2 21c0-3 1.85-5.36 5.08-6" />
	</Svg>
);
export const IconHeartPulse: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
		<path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
	</Svg>
);
export const IconFlask: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M10 2v7.31l-5.4 8.1A2 2 0 0 0 6.26 21h11.48a2 2 0 0 0 1.66-3.59L14 9.31V2" />
		<path d="M8.5 2h7M7 16h10" />
	</Svg>
);
export const IconUsers: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
	</Svg>
);
export const IconPaw: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<circle cx="11" cy="4" r="2" />
		<circle cx="18" cy="8" r="2" />
		<circle cx="4" cy="8" r="2" />
		<circle cx="7.5" cy="16" r="3.5" transform="translate(3.5 0)" />
		<path d="M9 13c-1.5 1-2 3-1 4.5s3 1.5 4.5.5c1.5 1 3.5 1 4.5-.5s.5-3.5-1-4.5" />
	</Svg>
);
export const IconPalette: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
		<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
		<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
		<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
		<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
	</Svg>
);
export const IconSparkles: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M9.94 6.06 12 2l2.06 4.06L18 8l-3.94 1.94L12 14l-2.06-4.06L6 8Z" />
		<path d="M5 18l.9 1.8L7.7 20.7 5.9 21.6 5 23.4l-.9-1.8L2.3 20.7l1.8-.9Z" />
		<path d="M19 15l.7 1.4 1.4.7-1.4.7-.7 1.4-.7-1.4-1.4-.7 1.4-.7Z" />
	</Svg>
);

// ── funktionale Icons ───────────────────────────────────────────────────────
export const IconCheck: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M20 6 9 17l-5-5" />
	</Svg>
);
export const IconShare: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
		<path d="M16 6l-4-4-4 4M12 2v13" />
	</Svg>
);
export const IconBookmark: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
	</Svg>
);
export const IconGlobe: React.FC<IconProps> = (p) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10ZM2 12h20" />
	</Svg>
);

export const CATEGORY_ICON_COMP: Record<string, React.FC<IconProps>> = {
	klima: IconLeaf,
	gesundheit: IconHeartPulse,
	wissenschaft: IconFlask,
	gemeinschaft: IconUsers,
	tiere: IconPaw,
	kultur: IconPalette,
	innovation: IconSparkles
};

export function categoryIcon(category: string): React.FC<IconProps> {
	return CATEGORY_ICON_COMP[category] || IconSparkles;
}
