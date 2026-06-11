-- ============================================================
-- 00029: Öffentliche Roadmap + Feedback
-- ============================================================
-- nureine_changelog: öffentlich lesbare Roadmap-/Changelog-Einträge (Team pflegt).
-- nureine_feedback : öffentlich einreichbar (rate-limited via API, Service-Role only).
-- ============================================================

CREATE TABLE IF NOT EXISTS nureine_changelog (
  id BIGSERIAL PRIMARY KEY,
  released_at DATE NOT NULL DEFAULT current_date,
  status TEXT NOT NULL DEFAULT 'shipped',  -- shipped | in_progress | planned
  category TEXT,                            -- feature | fix | content
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_changelog_released ON nureine_changelog(released_at DESC);
ALTER TABLE nureine_changelog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS changelog_public_read ON nureine_changelog;
CREATE POLICY changelog_public_read ON nureine_changelog FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS nureine_feedback (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL DEFAULT 'idea',   -- idea | bug | praise | other
  message TEXT NOT NULL,
  email TEXT,
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON nureine_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_iphash ON nureine_feedback(ip_hash, created_at DESC);
ALTER TABLE nureine_feedback ENABLE ROW LEVEL SECURITY;
-- keine public-Policy → nur Service-Role über die API schreibt/liest.
