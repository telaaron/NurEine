-- ============================================================
-- 00035: Resonanz-Bewertung + Kurations-Queue (Qualität statt Lärm)
-- ============================================================
-- Resonanz = "verändert es den Menschen?" (4 Achsen) — NEU, getrennt vom
-- bestehenden impact_score ("wie groß"). Die schlaue Impact-Routine bewertet
-- abends die Kandidaten und legt die Hero-Story für morgen in die Queue.
-- Idempotent. Siehe nureine-impact/RESONANCE.md für die Achsen-Definition.
-- ============================================================

ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS res_perspektive SMALLINT;
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS res_koerper     SMALLINT;
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS res_handlung    SMALLINT;
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS res_erinnerung  SMALLINT;
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS resonance_score NUMERIC(4,2);
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS resonance_note  TEXT;
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS resonance_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_nur_stories_resonance
  ON nureine_stories (resonance_score DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS nureine_curation_queue (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  for_date      DATE NOT NULL,
  channel       TEXT NOT NULL,
  story_id      UUID REFERENCES nureine_stories(id) ON DELETE SET NULL,
  resonance_score NUMERIC(4,2),
  rationale     TEXT,
  is_pearl      BOOLEAN NOT NULL DEFAULT false,
  below_bar     BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'proposed',
  decided_at    TIMESTAMPTZ,
  draft         JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nur_curation_date_channel
  ON nureine_curation_queue (for_date, channel);
CREATE INDEX IF NOT EXISTS idx_nur_curation_status
  ON nureine_curation_queue (status, for_date DESC);

ALTER TABLE nureine_curation_queue
  DROP CONSTRAINT IF EXISTS nureine_curation_queue_channel_check;
ALTER TABLE nureine_curation_queue
  ADD CONSTRAINT nureine_curation_queue_channel_check
  CHECK (channel IN ('hero','instagram','email'));
ALTER TABLE nureine_curation_queue
  DROP CONSTRAINT IF EXISTS nureine_curation_queue_status_check;
ALTER TABLE nureine_curation_queue
  ADD CONSTRAINT nureine_curation_queue_status_check
  CHECK (status IN ('proposed','approved','rejected','published'));

ALTER TABLE nureine_curation_queue ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nureine_curation_queue IS
  'Abend-Kuration: welche Story geht morgen über welchen Kanal live. Aaron gibt frei (status). Resonanz = 4 Achsen.';
COMMENT ON COLUMN nureine_stories.resonance_score IS
  'Resonanz 0-10: verändert es den Menschen? (Perspektive/Körper/Handlung/Erinnerung). Getrennt von impact_score (Größe).';
