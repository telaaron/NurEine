-- ============================================================
-- 00039: Quellen-Qualitäts-View + erste Scraper-Quelle
-- ============================================================
-- (a) View nureine_source_quality fürs Admin-Dashboard (welche Quelle bringt was).
-- (b) Undue Medical Debt als source_type='scraper' (kein RSS, per HTML-Scrape in
--     fetch_stories.py geholt — benannte Empfänger-Stories, NurEines Perlen-Archetyp).
-- Idempotent.
-- ============================================================

DROP VIEW IF EXISTS nureine_source_quality;
CREATE VIEW nureine_source_quality AS
SELECT
  s.source_name,
  count(*)                                                       AS stories,
  count(*) FILTER (WHERE s.resonance_score IS NOT NULL)          AS bewertet,
  round(avg(s.resonance_score), 2)                              AS avg_resonanz,
  round(avg(s.impact_score), 0)                                 AS avg_impact,
  count(*) FILTER (WHERE s.resonance_score >= 7.0)              AS stark_7plus,
  count(*) FILTER (WHERE s.resonance_score >= 7.5)              AS perlen_75plus,
  round(100.0 * count(*) FILTER (WHERE s.resonance_score >= 7.0)
        / NULLIF(count(*) FILTER (WHERE s.resonance_score IS NOT NULL), 0), 1) AS pct_stark,
  max(s.created_at)                                             AS letzte_story,
  bool_or(COALESCE(r.hero_eligible, true))                      AS hero_eligible
FROM nureine_stories s
LEFT JOIN nureine_rss_sources r ON r.name = s.source_name
GROUP BY s.source_name;

COMMENT ON VIEW nureine_source_quality IS
  'Quellen-Qualität fürs Admin-Dashboard: Volumen, Ø Resonanz/Impact, %-stark, Perlen, hero_eligible.';

-- Erste Scraper-Quelle (RSS-los). Heifer (406-Block) bewusst NICHT — siehe SOURCES.md.
INSERT INTO nureine_rss_sources (name, url, language, active, is_primary, hero_eligible, source_type) VALUES
  ('Undue Medical Debt', 'https://unduemedicaldebt.org/stories/', 'en', true, false, true, 'scraper')
ON CONFLICT DO NOTHING;
