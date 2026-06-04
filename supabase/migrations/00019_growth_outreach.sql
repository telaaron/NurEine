-- ============================================================
-- 00019: Growth/Outreach — DOI-Nachweis, Referral, Story-Einreichung,
--        erweiterte Event-Typen (Open/Click/Referral)
-- ============================================================
-- Idempotent. Aendert KEINE bestehenden RLS-Policies ausser dem
-- nureine_events name-CHECK (erweitert) und einer neuen Tabelle.
-- ============================================================

-- 1) DOI-Nachweis + Referral auf Subscriber ----------------------------------
ALTER TABLE nureine_subscribers
  ADD COLUMN IF NOT EXISTS confirmed_at    TIMESTAMPTZ,            -- DSGVO: Zeitpunkt Double-Opt-in
  ADD COLUMN IF NOT EXISTS signup_ip       TEXT,                  -- DSGVO: IP bei Anmeldung (Nachweis)
  ADD COLUMN IF NOT EXISTS referral_code   TEXT,                  -- eigener Empfehlungs-Code
  ADD COLUMN IF NOT EXISTS referred_by     TEXT,                  -- Code des Werbers
  ADD COLUMN IF NOT EXISTS referral_count  INTEGER NOT NULL DEFAULT 0; -- bestätigte Geworbene

CREATE UNIQUE INDEX IF NOT EXISTS idx_nur_sub_referral_code
  ON nureine_subscribers (referral_code) WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN nureine_subscribers.confirmed_at IS 'Double-Opt-in Bestätigungszeit (DSGVO-Nachweis).';
COMMENT ON COLUMN nureine_subscribers.referral_count IS 'Anzahl bestätigter geworbener Abonnenten.';

-- 2) Story-Einreichungen (UGC) -----------------------------------------------
CREATE TABLE IF NOT EXISTS nureine_story_submissions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title        TEXT NOT NULL,
  source_url   TEXT NOT NULL,
  reason       TEXT,                 -- warum positiv / bedeutsam
  category     TEXT,
  region       TEXT,
  submitter_email TEXT,              -- optional, für Rückmeldung
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nureine_story_submissions
  DROP CONSTRAINT IF EXISTS nureine_story_submissions_status_check;
ALTER TABLE nureine_story_submissions
  ADD CONSTRAINT nureine_story_submissions_status_check
  CHECK (status IN ('pending','approved','rejected'));

CREATE INDEX IF NOT EXISTS idx_nur_submissions_status_created
  ON nureine_story_submissions (status, created_at DESC);

ALTER TABLE nureine_story_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_insert_public" ON nureine_story_submissions;
CREATE POLICY "submissions_insert_public"
  ON nureine_story_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- Lesen/Moderation nur service_role (bypasst RLS) -> keine SELECT-Policy.

COMMENT ON TABLE nureine_story_submissions IS 'Community-eingereichte Story-Vorschläge (UGC). Moderation im Admin.';

-- 3) Event-Typen erweitern (Open/Click via Brevo, Referral) ------------------
ALTER TABLE nureine_events
  DROP CONSTRAINT IF EXISTS nureine_events_name_check;
ALTER TABLE nureine_events
  ADD CONSTRAINT nureine_events_name_check
  CHECK (name IN (
    'pageview',
    'newsletter_signup',
    'newsletter_signup_attempt',
    'story_read',
    'cta_click',
    'share',
    'ticker_click',
    'archive_filter',
    'email_open',
    'email_click',
    'referral_signup',
    'story_submitted'
  ));
