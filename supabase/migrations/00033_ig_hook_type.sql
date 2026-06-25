-- IG hook type per story (empirically derived from the 200-story IG-suitability
-- audit, 2026-06-21). ig_ok is now gated on STOP-POWER (one strong hook type),
-- not on impact_score>=70 or emotion. This column records WHICH hook carries the
-- story, so the feed can vary hook types instead of always leading with a number.
--
-- Six types: zahl | sieg | kontrast | wow | mensch | charme.
-- Nullable: only set when ig_ok = true. No backfill (older rows stay NULL).
ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS ig_hook_type text;

COMMENT ON COLUMN nureine_stories.ig_hook_type IS
  'IG stop-power hook type (zahl|sieg|kontrast|wow|mensch|charme). Set only when ig_ok=true.';

-- DACH proximity (0-100): how personally relevant the story is to DE/AT/CH readers.
-- Soft factor in the ig_ok decision (distant local stories need an exceptionally
-- strong universal hook). Universal themes (nature, animals, health, war) score high.
ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS dach_relevanz integer;

COMMENT ON COLUMN nureine_stories.dach_relevanz IS
  'DACH reader proximity 0-100. Soft input to ig_ok (very distant <25 is gated out).';
