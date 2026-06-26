-- ============================================================
-- 00036: hero_eligible-Flag + Quellen-Qualitäts-View (Resonanz-Diagnose)
-- ============================================================
-- Quellen-Diagnose (2026-06-27, 462 bewertete Stories) zeigte: official_stats-
-- Quellen (WHO/UN/Weltbank/OWID) liefern hohen impact_score, aber Resonanz im
-- Keller (3.3-4.1), 0 starke Stories. Sie bleiben aktiv als BELEG, werden aber
-- von der Hero-Kuration ausgeschlossen. Idempotent.
-- ============================================================

ALTER TABLE nureine_rss_sources ADD COLUMN IF NOT EXISTS hero_eligible BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN nureine_rss_sources.hero_eligible IS
  'false = Quelle liefert Belege/Größe, aber kaum Resonanz (z.B. WHO/UN/Weltbank) → wird gefetcht, aber NICHT als Hero/IG/Mail kuratiert.';

UPDATE nureine_rss_sources SET hero_eligible = false
WHERE source_type = 'official_stats'
   OR name IN ('WHO News','UN News','Weltbank (data.worldbank.org)','Our World in Data');

-- Laufende Quellen-Qualitäts-Diagnose (Routine Phase B / Outreach liest diese View).
CREATE OR REPLACE VIEW nureine_source_quality AS
SELECT
  source_name,
  count(*)                                                      AS stories,
  round(avg(impact_score), 0)                                   AS avg_impact,
  round(avg(resonance_score), 2)                                AS avg_resonanz,
  count(*) FILTER (WHERE resonance_score >= 7.0)                AS stark_7plus,
  count(*) FILTER (WHERE resonance_score >= 7.5)                AS perlen_75plus,
  round(100.0 * count(*) FILTER (WHERE resonance_score >= 7.0)
        / NULLIF(count(*), 0), 1)                               AS pct_stark
FROM nureine_stories
WHERE resonance_score IS NOT NULL
GROUP BY source_name;

COMMENT ON VIEW nureine_source_quality IS
  'Quellen-Diagnose für die Impact-Routine (Phase B / Outreach): welche Quelle liefert Resonanz, welche nur Größe.';
