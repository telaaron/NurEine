-- ============================================================
-- 00034: Impact-Routine-Läufe — Findings + Scores + PR pro Tag
-- ============================================================
-- Die tägliche Impact-Routine schreibt hier ihre Bewertung + die eine
-- Top-Änderung (als PR) hin. Das /admin/impact-Dashboard liest LIVE aus
-- dieser Tabelle — die Analyse erscheint also schon VOR dem PR-Merge.
-- Idempotent. service_role only (RLS an, keine anon/auth-Policy).
-- ============================================================

CREATE TABLE IF NOT EXISTS nureine_impact_runs (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_date      DATE NOT NULL,                       -- Tag des Laufs (ein Lauf/Tag)
  status        TEXT NOT NULL DEFAULT 'ok',          -- ok | blocked | gate_failed
  blocked_reason TEXT,                               -- bei status=blocked

  -- Scores (0–10 je Achse) — pro Kanal + Gesamt
  scores        JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {feed:{Z,S,E,D}, instagram:{…}, email:{…}, gesamt:6.8}

  -- Das eine Finding
  channel       TEXT,                                -- feed | instagram | email | design
  root_cause    TEXT,                                -- Ursache (nicht Symptom)
  change_summary TEXT,                               -- was geändert wurde
  change_file   TEXT,                                -- z.B. src/lib/server/newsletter.ts
  predicts      TEXT,                                -- welches Signal soll steigen

  -- Der PR (Approve-Weg)
  pr_url        TEXT,                                -- https://github.com/telaaron/NurEine/pull/NN
  pr_number     INT,
  pr_state      TEXT DEFAULT 'open',                 -- open | merged | closed

  -- Verifikation der VORTAGS-Hypothese (gegen echtes Signal)
  verify_of_date DATE,                               -- welcher frühere Lauf wird hier verifiziert
  verdict       TEXT,                                -- confirmed | rejected | pending
  verdict_source TEXT,                               -- metric | self | mixed
  verdict_note  TEXT,                                -- Beleg (welche Zahl)

  -- Metrik-Snapshot des Tages (für Trend ohne Re-Query)
  metrics       JSONB DEFAULT '{}'::jsonb,           -- {ig_saves, ig_reach, mail_opens, mail_clicks, story_reads, shares}

  log_markdown  TEXT,                                -- der knappe Tages-Report (optional, fürs Dashboard)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ein Lauf pro Tag (Re-Run überschreibt via upsert on run_date).
CREATE UNIQUE INDEX IF NOT EXISTS idx_nur_impact_run_date
  ON nureine_impact_runs (run_date);

CREATE INDEX IF NOT EXISTS idx_nur_impact_created
  ON nureine_impact_runs (created_at DESC);

ALTER TABLE nureine_impact_runs
  DROP CONSTRAINT IF EXISTS nureine_impact_runs_status_check;
ALTER TABLE nureine_impact_runs
  ADD CONSTRAINT nureine_impact_runs_status_check
  CHECK (status IN ('ok','blocked','gate_failed'));

-- service_role only — nur die Routine (Service-Key) schreibt, das Admin-Dashboard
-- liest über supabaseAdmin (ebenfalls Service-Key). Keine anon/auth-Policy.
ALTER TABLE nureine_impact_runs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nureine_impact_runs IS
  'Tägliche Impact-Routine-Läufe: Scores, Root-Cause, PR, Vortags-Verifikation. Dashboard /admin/impact liest hier live.';
