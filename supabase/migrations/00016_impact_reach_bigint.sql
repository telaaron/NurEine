-- ============================================================
-- 00016: impact_reach INT -> BIGINT
-- ============================================================
-- Grund (gefunden via defensives Insert-Logging in fetch_stories.py am
-- 2026-06-03): DeepSeek schaetzt "betroffene Menschen" und liefert bei globalen
-- Stories Werte wie 2200000000 (2,2 Mrd). impact_reach war INT (int4, max
-- 2147483647) -> PostgREST 400 "value out of range for type integer" -> der
-- GESAMTE Insert starb. Das (nicht die Kategorie) war der eigentliche Killer der
-- fetch-Pipeline seit ~2026-05-26: 85-89 Stories gefunden, fast 0 inserted.
--
-- 2,2 Mrd ist eine legitime Reichweite -> Spalte auf BIGINT erweitern.
-- fetch_stories.py clampt zusaetzlich defensiv via _safe_int(hi=BIGINT_MAX).
-- ============================================================

ALTER TABLE nureine_stories
  ALTER COLUMN impact_reach TYPE BIGINT;

COMMENT ON COLUMN nureine_stories.impact_reach IS
  'Estimated number of people positively affected. BIGINT — global stories can exceed 2.1B (int4 max).';
