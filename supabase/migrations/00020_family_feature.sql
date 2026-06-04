-- ============================================================
-- 00020: Familien-Feature — "Ein Gespräch mehr"
-- ============================================================
-- Eltern-Segment bekommt DIESELBE Story + 3 Zusätze (wenn die Story dafür
-- getaggt ist): Alters-Badge, kindgerechte Erklärlinie, Gesprächsstarter.
-- Idempotent. Keine RLS-Änderungen.
-- ============================================================

-- Subscriber: ein einziges Onboarding-Flag (kein Alter, keine PII).
ALTER TABLE nureine_subscribers
  ADD COLUMN IF NOT EXISTS has_kids BOOLEAN;  -- NULL = nicht angegeben

COMMENT ON COLUMN nureine_subscribers.has_kids IS
  'Onboarding: Kinder im Haushalt? true/false/NULL. Steuert Familien-Zusätze im Newsletter.';

-- Story: optionale, familien-taugliche Zusatzfelder (per KI/Hand getaggt).
ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS kid_min_age          SMALLINT,  -- z.B. 8 → "ab 8 erklärbar"; NULL = nicht familientauglich
  ADD COLUMN IF NOT EXISTS kid_explainer        TEXT,      -- ein Satz, kindgerecht
  ADD COLUMN IF NOT EXISTS conversation_starter TEXT;      -- offene Frage fürs Gespräch

COMMENT ON COLUMN nureine_stories.kid_min_age IS
  'Mindestalter zum Erklären. NULL = nicht als familientauglich getaggt.';
