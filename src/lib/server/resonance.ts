// Resonanz-Skala vereinheitlichen (improvement #1, Verbesserer-Agent).
//
// Historisch gemischte Skala in nureine_stories / nureine_curation_queue:
// Alt-Daten stehen auf 0–10 (z.B. 7.20), der neue Chefredakteur-Agent schreibt
// 0–100 (z.B. 78). Gemischte Skala macht Ranking & Schwellen unzuverlässig —
// eine mittelmäßige neue 45/100 rutscht sonst über dieselbe Schwelle wie eine
// exzellente alte 9/10, und beim Sortieren rankt jede 0–100-Story pauschal über
// jeder 0–10-Story.
//
// Statt die 657 Produktions-Zeilen irreversibel zu migrieren, normalisieren wir
// defensiv beim Lesen/Vergleichen auf eine kanonische 0–100-Skala. Werte ≤ 10
// gelten als Alt-Skala und werden ×10 genommen; Werte > 10 sind bereits 0–100.
// (Die Admin-UI /admin/ki nutzt bereits genau diese Heuristik beim Anzeigen.)

/** Kanonische Obergrenze für Resonanz nach Normalisierung. */
export const RESONANCE_MAX = 100;

/**
 * Normalisiert einen (evtl. gemischt skalierten) resonance_score auf 0–100.
 * null/undefined bleibt null. Werte ≤ 10 werden als Alt-Skala (0–10) erkannt
 * und ×10 skaliert; Werte > 10 gelten bereits als 0–100.
 */
export function normalizeResonance(score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  return score <= 10 ? score * 10 : score;
}

/** Kanonische Hero-Schwelle: entspricht dem früheren 7.0/10 auf der 0–100-Skala. */
export const RESONANCE_HERO_THRESHOLD = 70;
