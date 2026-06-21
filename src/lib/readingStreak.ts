/**
 * Persönliche Lese-Bilanz — cookielos, nur localStorage, ohne Login.
 *
 * Identitäts-Hebel (kein Gimmick): „Ich starte den Tag mit Fortschritt statt
 * Doomscrolling." Wer das von sich glaubt, teilt es — nicht weil wir punkten,
 * sondern weil es zur Selbstwahrnehmung passt (Carnegie/Cialdini: Konsistenz).
 *
 * KEINE Sucht-Mechanik: kein roter Streak-Counter, der bei Pause „bricht",
 * keine Push, kein Vergleich mit anderen. Nur eine ruhige Wochenbilanz.
 */
const KEY = 'nureine_reads';

interface ReadLog {
	/** ISO-Tagesdaten (YYYY-MM-DD) der gelesenen Geschichten, mit Duplikaten je Tag. */
	days: string[];
}

function load(): ReadLog {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { days: [] };
		const parsed = JSON.parse(raw) as ReadLog;
		return Array.isArray(parsed.days) ? parsed : { days: [] };
	} catch {
		return { days: [] };
	}
}

/** Eine gelesene Geschichte verbuchen (einmal pro Aufruf). */
export function recordRead(): void {
	try {
		const log = load();
		log.days.push(new Date().toISOString().slice(0, 10));
		// nur die letzten ~120 Einträge halten, mehr braucht die Bilanz nie
		if (log.days.length > 120) log.days = log.days.slice(-120);
		localStorage.setItem(KEY, JSON.stringify(log));
	} catch {
		/* ignore */
	}
}

export interface WeekStats {
	/** Gelesene Geschichten in den letzten 7 Tagen. */
	count: number;
	/** Verschiedene Tage mit mindestens einer gelesenen Geschichte (letzte 7 Tage). */
	activeDays: number;
}

export function weekStats(): WeekStats {
	const log = load();
	const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	const recent = log.days.filter((d) => d >= cutoff);
	return { count: recent.length, activeDays: new Set(recent).size };
}
