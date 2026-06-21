/**
 * Referral-Stufen — eine Quelle der Wahrheit für Belohnungen.
 *
 * Bewusst KEIN Gimmick/Kindergarten: die Belohnung ist Bedeutung (Carnegie —
 * Menschen sehnen sich nach Wert + Würdigung), nicht Punkte oder Konfetti.
 * Stufe 1 = exklusiver Inhalt (existiert: Stand-der-Welt-Tiefenbrief),
 * Stufe 2 = öffentliche Würdigung als Mitwirkende:r.
 *
 * Genutzt von: /einstellungen (Fortschrittsanzeige), /teilen, Confirm-Logik.
 */
export interface ReferralTier {
	count: number;
	title: string;
	/** Was man bei Erreichen freischaltet — eine ruhige, ernste Zeile. */
	reward: string;
}

export const REFERRAL_TIERS: ReferralTier[] = [
	{ count: 3, title: 'Tiefenbrief', reward: 'Der monatliche „Stand der Welt"-Tiefenbrief — die großen, leisen Fortschritte in Zahlen.' },
	{ count: 10, title: 'Mitwirkende:r', reward: 'Du wirst als Mitwirkende:r gewürdigt — auf Wunsch mit Namen auf der Unterstützer-Seite.' }
];

/** Nächste noch nicht erreichte Stufe (oder null, wenn alle erreicht). */
export function nextTier(count: number): ReferralTier | null {
	return REFERRAL_TIERS.find((t) => count < t.count) ?? null;
}

/** Höchste bereits erreichte Stufe (oder null). */
export function currentTier(count: number): ReferralTier | null {
	let reached: ReferralTier | null = null;
	for (const t of REFERRAL_TIERS) if (count >= t.count) reached = t;
	return reached;
}

/** Fortschritt zur nächsten Stufe als 0..1 (für den Balken). */
export function tierProgress(count: number): number {
	const next = nextTier(count);
	if (!next) return 1;
	const prev = currentTier(count)?.count ?? 0;
	return Math.min(1, (count - prev) / (next.count - prev));
}
