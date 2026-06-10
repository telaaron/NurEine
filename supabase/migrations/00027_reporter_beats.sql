-- ============================================================
-- 00027: Reporter-Bots — Beat-Zuordnung + Quellentyp
-- ============================================================
-- Ermöglicht die Anti-Lärm-Redaktion (siehe REPORTER_BOTS.md):
--   beat        : welcher Themen-Beat hat die Story gefunden.
--   source_type : Primärquellen-Typ → Evidenz-Gewichtung + Transparenz-Badge.
-- Beide NULL für Legacy-Stories (allgemeiner RSS-Pool).
-- ============================================================

ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS beat TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT;

COMMENT ON COLUMN nureine_stories.beat IS 'Reporter-Beat: klima-energie, gesundheit-forschung, gesellschaft-bildung, innovation-wirtschaft, staedte-kommunen. NULL = Legacy.';
COMMENT ON COLUMN nureine_stories.source_type IS 'Quellentyp: peer_review, official_stats, registry, open_data, gov, ngo, media.';

CREATE INDEX IF NOT EXISTS idx_nureine_stories_beat ON nureine_stories(beat);
