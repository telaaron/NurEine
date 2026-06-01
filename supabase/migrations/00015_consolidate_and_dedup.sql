-- ============================================================
-- 00015: Konsolidierung + Newsletter-Dedup-Fundament
-- ============================================================
-- Grund: Migrationen 00008-00014 wurden per Hand im Dashboard gepatcht,
-- aber unzuverlaessig. schema_migrations endete bei 00007, 00014 fehlte
-- komplett -> newsletter_sent_at existierte nie auf prod -> select_hero +
-- newsletter lasen eine nicht-existente Spalte -> 400 -> Totalausfall.
--
-- Diese Migration ist vollstaendig IDEMPOTENT (IF NOT EXISTS / DROP+ADD).
-- Sie zieht alles nach was fehlt und bringt schema_migrations wieder in Sync.
-- Sie aendert KEINE RLS-Policies.
-- ============================================================

-- 1) Newsletter-Dedup-Spalte (war 00014, nie angewandt) ----------------------
ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS newsletter_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN nureine_stories.newsletter_sent_at IS
  'Zeitpunkt an dem die Story als Newsletter-Hero versendet wurde. Verhindert Doppel-Sends; Basis der sendezeit-atomaren Auswahl.';

-- Partieller Index: schnelle "noch nie versendet"-Auswahl zur Sendezeit
CREATE INDEX IF NOT EXISTS idx_nur_stories_unsent
  ON nureine_stories (impact_score DESC, created_at DESC)
  WHERE newsletter_sent_at IS NULL;

-- Index fuer Frische-Sortierung der Website (entkoppelter Hero)
CREATE INDEX IF NOT EXISTS idx_nur_stories_created_at
  ON nureine_stories (created_at DESC);

-- 2) Constraint-Namen normalisieren (Renames aus 00010/00013 liefen nie) ------
--    Alte lichtblick_*-Namen -> nureine_*; tier-check ohne 'plus' (00010).
ALTER TABLE nureine_stories
  DROP CONSTRAINT IF EXISTS lichtblick_stories_category_check;
ALTER TABLE nureine_stories
  DROP CONSTRAINT IF EXISTS nureine_stories_category_check;
ALTER TABLE nureine_stories
  ADD CONSTRAINT nureine_stories_category_check
  CHECK (category IN ('klima','gesundheit','wissenschaft','gemeinschaft','tiere','kultur','innovation'));

ALTER TABLE nureine_stories
  DROP CONSTRAINT IF EXISTS lichtblick_stories_impact_score_check;
ALTER TABLE nureine_stories
  DROP CONSTRAINT IF EXISTS nureine_stories_impact_score_check;
ALTER TABLE nureine_stories
  ADD CONSTRAINT nureine_stories_impact_score_check
  CHECK (impact_score BETWEEN 1 AND 100);

-- tier-check: 'plus' raus (00010 nie sauber angewandt). Erst migrieren, dann constraint.
UPDATE nureine_subscribers SET tier = 'free' WHERE tier NOT IN ('free','b2b');
ALTER TABLE nureine_subscribers
  DROP CONSTRAINT IF EXISTS lichtblick_subscribers_tier_check;
ALTER TABLE nureine_subscribers
  DROP CONSTRAINT IF EXISTS nureine_subscribers_tier_check;
ALTER TABLE nureine_subscribers
  ADD CONSTRAINT nureine_subscribers_tier_check
  CHECK (tier IN ('free','b2b'));
