-- ============================================================
-- 00028: Fetch-Log — Redaktions-Transparenz (Reporter-Monitoring)
-- ============================================================
-- Protokolliert je Lauf, was die Reporter-Pipeline durchgelassen / abgelehnt hat
-- und warum. Speist das Admin-Dashboard /admin/redaktion.
--   decision: accepted | rejected_prefilter | rejected_ai
--   reason  : history_trap, local_fluff, sports_niche, not_positive, ratgeber,
--             low_impact, db_duplicate, …
-- ============================================================

CREATE TABLE IF NOT EXISTS nureine_fetch_log (
  id BIGSERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_name TEXT,
  beat TEXT,
  title TEXT,
  decision TEXT NOT NULL,
  reason TEXT,
  impact_score SMALLINT
);

CREATE INDEX IF NOT EXISTS idx_fetch_log_ran_at ON nureine_fetch_log(ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_fetch_log_decision ON nureine_fetch_log(decision);

ALTER TABLE nureine_fetch_log ENABLE ROW LEVEL SECURITY;
