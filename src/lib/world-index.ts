// Aggregiert die echten Welt-Metriken (World Bank, s. nureine_world_metrics)
// zu einem normalisierten Teilindex PRO KATEGORIE — die Datengrundlage für die
// Sparklines der "Puls der Welt"-Trendzeile auf /karte.
//
// WICHTIG — was das ist und was NICHT:
//   • Der Teilindex misst die ECHTE Weltlage (externe Indikatoren), NICHT die
//     Menge oder Wirkung der NurEine-Storys. Kein Zirkelschluss.
//   • Richtungsbewusst: "steigt" heißt IMMER "die Welt wird in diesem Feld
//     messbar besser". Negative Rohindikatoren (Kindersterblichkeit, Armut …)
//     werden vor der Aggregation invertiert (direction: 'down').
//   • Normalisierung: Min-Max je Metrik über ihre eigene Zeitreihe → 0..100,
//     damit Prozente, Todesfälle, Jahre etc. seriös kombinierbar sind.
//
// Solange eine Kategorie keine (ausreichenden) Daten hat, liefert sie
// `status: 'pending'` — die UI zeigt dann ehrlich "Daten folgen", statt eine
// erfundene Linie zu zeichnen.

export type Direction = 'up' | 'down';

export interface MetricLike {
	metric_key: string;
	category: string;
	direction: Direction;
	series: { year: number; value: number }[];
}

export interface CategoryTrend {
	category: string;
	status: 'ok' | 'pending';
	/** Normalisierte Teilindex-Serie (0..100), aufsteigend nach Jahr. */
	series: { year: number; value: number }[];
	/** Jüngster Teilindex-Wert (0..100), gerundet auf 1 Nachkommastelle. */
	latest: number | null;
	latestYear: number | null;
	/** Veränderung ggü. ~10 Jahre früher (oder ältestem Punkt), in Indexpunkten. */
	delta: number | null;
	deltaFromYear: number | null;
	/** Anzahl beitragender Metriken (für "Abdeckung"). */
	metricCount: number;
}

// Min-Max-Normalisierung eines Werts auf 0..100 über [min,max]; direction-aware.
function normalize(value: number, min: number, max: number, direction: Direction): number {
	if (max === min) return 50; // konstante Reihe → neutral
	const t = (value - min) / (max - min); // 0..1 (roh)
	const score = direction === 'up' ? t : 1 - t; // 'down' invertieren
	return score * 100;
}

// Baut je Metrik eine Map year→normalizedScore.
function normalizedByYear(m: MetricLike): Map<number, number> {
	const out = new Map<number, number>();
	const vals = m.series.map((p) => p.value).filter((v) => Number.isFinite(v));
	if (vals.length < 2) return out;
	const min = Math.min(...vals);
	const max = Math.max(...vals);
	for (const p of m.series) {
		if (!Number.isFinite(p.value)) continue;
		out.set(p.year, normalize(p.value, min, max, m.direction));
	}
	return out;
}

/**
 * Aggregiert alle Metriken zu Teilindex-Trends je Kategorie.
 * @param metrics  Rohmetriken (mit Zeitreihen + direction)
 * @param categories  gewünschte Kategorie-Keys (auch leere → 'pending')
 * @param points  Anzahl der jüngsten Jahre in der Sparkline (Default 12)
 */
export function categoryTrends(
	metrics: MetricLike[],
	categories: string[],
	points = 12
): CategoryTrend[] {
	return categories.map((cat) => {
		const inCat = metrics.filter((m) => m.category === cat && m.series?.length >= 2);
		if (inCat.length === 0) {
			return {
				category: cat,
				status: 'pending',
				series: [],
				latest: null,
				latestYear: null,
				delta: null,
				deltaFromYear: null,
				metricCount: 0
			};
		}

		// year → [scores] über alle Metriken der Kategorie
		const perYear = new Map<number, number[]>();
		for (const m of inCat) {
			for (const [year, score] of normalizedByYear(m)) {
				(perYear.get(year) ?? perYear.set(year, []).get(year)!).push(score);
			}
		}

		// Nur Jahre behalten, in denen mind. die Hälfte der Metriken Daten hat —
		// sonst springt die Linie, weil je Jahr andere Indikatoren fehlen.
		const minContributors = Math.max(1, Math.ceil(inCat.length / 2));
		let series = [...perYear.entries()]
			.filter(([, arr]) => arr.length >= minContributors)
			.map(([year, arr]) => ({ year, value: arr.reduce((a, b) => a + b, 0) / arr.length }))
			.sort((a, b) => a.year - b.year);

		if (series.length < 2) {
			return {
				category: cat,
				status: 'pending',
				series: [],
				latest: null,
				latestYear: null,
				delta: null,
				deltaFromYear: null,
				metricCount: inCat.length
			};
		}

		// Auf die jüngsten `points` Jahre kürzen.
		const trimmed = series.slice(-points);
		const last = trimmed[trimmed.length - 1];
		// Vergleichspunkt: ~10 Jahre zurück, sonst ältester in der Sparkline.
		const cmp =
			trimmed.find((p) => p.year >= last.year - 10) ?? trimmed[0];

		return {
			category: cat,
			status: 'ok',
			series: trimmed.map((p) => ({ year: p.year, value: Math.round(p.value * 10) / 10 })),
			latest: Math.round(last.value * 10) / 10,
			latestYear: last.year,
			delta: Math.round((last.value - cmp.value) * 10) / 10,
			deltaFromYear: cmp.year,
			metricCount: inCat.length
		};
	});
}

// Innenkoordinaten einer Sparkline für eine 0..100-Serie in einer viewBox
// 0..w × 0..h; y invertiert (oben = hoch = besser).
function sparkPoints(series: { value: number }[], w: number, h: number, pad: number) {
	const vals = series.map((p) => p.value);
	const min = Math.min(...vals);
	const max = Math.max(...vals);
	const span = max - min || 1;
	const innerW = w - pad * 2;
	const innerH = h - pad * 2;
	return series.map((p, i) => ({
		x: pad + (i / Math.max(1, series.length - 1)) * innerW,
		y: pad + (1 - (p.value - min) / span) * innerH
	}));
}

// SVG-Pfad (polyline) für eine Sparkline.
export function sparklinePath(series: { value: number }[], w: number, h: number, pad = 1.5): string {
	if (series.length < 2) return '';
	return sparkPoints(series, w, h, pad)
		.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
		.join(' ');
}

// Letzter Punkt der Sparkline (für den Highlight-Kreis am Ende der Linie).
export function sparklineLast(series: { value: number }[], w: number, h: number, pad = 1.5) {
	if (series.length < 2) return { x: w - pad, y: h / 2 };
	const pts = sparkPoints(series, w, h, pad);
	return pts[pts.length - 1];
}
