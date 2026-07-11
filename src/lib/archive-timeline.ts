/**
 * Archiv-Timeline-Helfer: gruppiert die (client-seitig gelieferten) Story-Cards
 * nach Monat + Tag, berechnet den „Puls" (Kategorie-Verteilung je Tag/Monat) und
 * die Monats-Kennzahlen. Rein funktional, keine Seiteneffekte — von allen drei
 * Archiv-Konzepten (Puls / Spur / Logbuch) geteilt.
 */

export type ArchiveStory = {
	slug: string;
	title: string;
	dek: string;
	category: string;
	country: string;
	tone: 'amber' | 'sage' | 'rose' | 'sky';
	hero: string;
	impactScore: number;
	impactNote: string;
	sensitive?: boolean;
	publishedAt: string;
	createdAt?: string;
};

export type DayGroup = {
	iso: string; // YYYY-MM-DD (lokale Berlin-Zeit)
	date: Date;
	stories: ArchiveStory[];
	lead: ArchiveStory; // stärkste Story des Tages
	topCategory: string; // dominante Kategorie (für den Puls-Punkt)
};

export type MonthGroup = {
	key: string; // YYYY-MM
	label: string; // „Juni 2026"
	date: Date; // erster des Monats
	days: DayGroup[];
	count: number;
	topStory: ArchiveStory; // stärkste Story des Monats
	topImpact: number;
	categoryShare: { category: string; count: number; pct: number }[]; // Puls
	dominantCategory: string;
};

const MONTHS_DE = [
	'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
	'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

// Kategorie → Ton (für Puls-Farben; deckt sich mit story-card/toneStyles).
export const CATEGORY_TONE: Record<string, 'amber' | 'sage' | 'rose' | 'sky'> = {
	klima: 'sage',
	tiere: 'sage',
	gesundheit: 'rose',
	wissenschaft: 'sky',
	innovation: 'sky',
	gemeinschaft: 'amber',
	kultur: 'amber'
};

// Lokales (Europe/Berlin) YYYY-MM-DD — konsistent mit der Heute-Seite.
const BERLIN = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Berlin',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
function berlinISO(d: Date): string {
	return BERLIN.format(d); // en-CA → „2026-07-09"
}

function impact(s: ArchiveStory): number {
	return s.impactScore ?? 0;
}

/** Dominante Kategorie einer Story-Liste (häufigste, bei Gleichstand stärkste). */
function dominant(stories: ArchiveStory[]): string {
	const count = new Map<string, number>();
	for (const s of stories) count.set(s.category, (count.get(s.category) ?? 0) + 1);
	let best = stories[0]?.category ?? 'gemeinschaft';
	let bestN = -1;
	for (const [cat, n] of count) {
		if (n > bestN) {
			best = cat;
			bestN = n;
		}
	}
	return best;
}

/**
 * Gruppiert Stories → Monate → Tage. Erwartet eine bereits gefilterte/sortierte
 * Liste ist NICHT nötig; wir sortieren selbst (neueste zuerst).
 */
export function groupByMonth(stories: ArchiveStory[]): MonthGroup[] {
	// Tag-Buckets
	const dayMap = new Map<string, ArchiveStory[]>();
	for (const s of stories) {
		const d = new Date(s.publishedAt || s.createdAt || Date.now());
		if (isNaN(d.getTime())) continue;
		const iso = berlinISO(d);
		const arr = dayMap.get(iso) ?? [];
		arr.push(s);
		dayMap.set(iso, arr);
	}

	// Tag-Gruppen bauen
	const days: DayGroup[] = [];
	for (const [iso, arr] of dayMap) {
		arr.sort((a, b) => impact(b) - impact(a));
		days.push({
			iso,
			date: new Date(iso + 'T12:00:00'),
			stories: arr,
			lead: arr[0],
			topCategory: dominant(arr)
		});
	}
	days.sort((a, b) => b.iso.localeCompare(a.iso)); // neueste zuerst

	// Monats-Buckets
	const monthMap = new Map<string, DayGroup[]>();
	for (const dg of days) {
		const key = dg.iso.slice(0, 7); // YYYY-MM
		const arr = monthMap.get(key) ?? [];
		arr.push(dg);
		monthMap.set(key, arr);
	}

	const months: MonthGroup[] = [];
	for (const [key, dayGroups] of monthMap) {
		const all = dayGroups.flatMap((d) => d.stories);
		const [y, m] = key.split('-').map(Number);
		const catCount = new Map<string, number>();
		for (const s of all) catCount.set(s.category, (catCount.get(s.category) ?? 0) + 1);
		const share = [...catCount.entries()]
			.map(([category, count]) => ({ category, count, pct: count / all.length }))
			.sort((a, b) => b.count - a.count);
		const top = all.slice().sort((a, b) => impact(b) - impact(a))[0];
		months.push({
			key,
			label: `${MONTHS_DE[m - 1]} ${y}`,
			date: new Date(y, m - 1, 1),
			days: dayGroups,
			count: all.length,
			topStory: top,
			topImpact: impact(top),
			categoryShare: share,
			dominantCategory: share[0]?.category ?? 'gemeinschaft'
		});
	}
	months.sort((a, b) => b.key.localeCompare(a.key)); // neueste zuerst
	return months;
}

/** Deutsche Wochentag-Kurzform + Tag-Zahl. */
export function dayParts(iso: string): { weekday: string; day: number; monthShort: string } {
	const d = new Date(iso + 'T12:00:00');
	const today = berlinISO(new Date());
	const yst = berlinISO(new Date(Date.now() - 864e5));
	let weekday: string;
	if (iso === today) weekday = 'Heute';
	else if (iso === yst) weekday = 'Gestern';
	else weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()];
	return {
		weekday,
		day: d.getDate(),
		monthShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][d.getMonth()]
	};
}
