-- ============================================================
-- 00022: Social-Posting-System — Instagram-Post-Queue
-- ============================================================
-- Idempotent. Neue Tabelle nureine_social_posts + Setting-Default
-- social_autopilot. Aendert KEINE bestehenden Policies.
-- ============================================================

-- 1) Post-Queue --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nureine_social_posts (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  story_id     UUID NOT NULL REFERENCES nureine_stories(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL DEFAULT 'instagram',  -- instagram | (später: tiktok…)
  -- Generierte Inhalte (editierbar im Admin)
  caption      TEXT NOT NULL,
  hashtags     TEXT[] NOT NULL DEFAULT '{}',
  card_url     TEXT,                                 -- /api/share-card/<slug> (9:16)
  og_url       TEXT,                                 -- /api/og/<slug> (1.91:1)
  hook_type    TEXT NOT NULL DEFAULT 'zahl',         -- zahl | frage | kontrast  (A/B-Achse)
  category     TEXT,                                 -- Story-Kategorie (A/B-Achse)
  -- Workflow
  status       TEXT NOT NULL DEFAULT 'draft',        -- draft | approved | posted | skipped | failed
  scheduled_for TIMESTAMPTZ,                         -- geplante Postzeit (Default: nächster 07:30)
  posted_at    TIMESTAMPTZ,
  ig_media_id  TEXT,                                 -- Graph-API Media-ID nach Post
  error        TEXT,                                 -- letzte Fehlermeldung bei status=failed
  is_carousel  BOOLEAN NOT NULL DEFAULT false,       -- 3-Folien-Carousel statt Einzelbild
  -- Performance (A/B-Auswertung)
  saves        INTEGER,                              -- manuell/Insights gepflegt
  reach        INTEGER,
  -- Meta
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ein Post pro Story pro Plattform (kein Doppelpost).
CREATE UNIQUE INDEX IF NOT EXISTS idx_nur_social_story_platform
  ON nureine_social_posts (story_id, platform);

CREATE INDEX IF NOT EXISTS idx_nur_social_status_sched
  ON nureine_social_posts (status, scheduled_for);

ALTER TABLE nureine_social_posts
  DROP CONSTRAINT IF EXISTS nureine_social_posts_status_check;
ALTER TABLE nureine_social_posts
  ADD CONSTRAINT nureine_social_posts_status_check
  CHECK (status IN ('draft','approved','posted','skipped','failed'));

ALTER TABLE nureine_social_posts
  DROP CONSTRAINT IF EXISTS nureine_social_posts_hook_check;
ALTER TABLE nureine_social_posts
  ADD CONSTRAINT nureine_social_posts_hook_check
  CHECK (hook_type IN ('zahl','frage','kontrast'));

-- service_role only (Admin). RLS an, keine anon/auth-Policy -> nur Service-Key liest/schreibt.
ALTER TABLE nureine_social_posts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nureine_social_posts IS 'Instagram-Post-Queue. Generator legt drafts an, Admin gibt frei, Publish-Cron postet via Graph API.';
COMMENT ON COLUMN nureine_social_posts.hook_type IS 'A/B-Achse: zahl | frage | kontrast.';
COMMENT ON COLUMN nureine_social_posts.saves IS 'Saves pro Post — die eine Metrik (manuell oder via Insights gepflegt).';

-- Autopilot-Schalter: env var SOCIAL_AUTOPILOT ('true' = Voll-Auto, sonst Approval-Gate).
-- Kein Settings-Table in dieser DB — daher per env, nicht per Row.
