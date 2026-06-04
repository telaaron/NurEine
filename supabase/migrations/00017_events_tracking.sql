-- ============================================================
-- 00017: First-party Funnel-Event-Tracking (nureine_events)
-- ============================================================
-- Zweck: Eigene, DSGVO-freundliche Funnel-Events (newsletter_signup,
-- story_read, cta_click, share, ...) in eigener Tabelle. Wir besitzen die
-- Daten -> Proof-Engine fuer spaeteren B2B-Verkauf (Reichweite/Wirkung).
--
-- Keine Cookies, keine personenbezogenen Daten. session_id ist ein
-- anonymer, client-generierter Zufallswert (kein Fingerprint, kein PII).
--
-- Vollstaendig IDEMPOTENT. Aendert KEINE bestehenden Tabellen/Policies.
-- ============================================================

CREATE TABLE IF NOT EXISTS nureine_events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  props       JSONB NOT NULL DEFAULT '{}'::jsonb,
  path        TEXT,
  referrer    TEXT,
  session_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE nureine_events IS
  'Anonyme First-Party Funnel-Events. Keine PII. session_id = anonymer client-random.';

-- Event-Name auf bekannte Typen begrenzen (erweiterbar via neue Migration)
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
    'archive_filter'
  ));

-- Query-Indizes: nach Name+Zeit (Reports) und nach Zeit (Recent)
CREATE INDEX IF NOT EXISTS idx_nur_events_name_created
  ON nureine_events (name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nur_events_created
  ON nureine_events (created_at DESC);

-- RLS: nur INSERT von aussen erlaubt; Lesen nur service_role (Admin/Reports)
ALTER TABLE nureine_events ENABLE ROW LEVEL SECURITY;

-- anon + authenticated duerfen Events einfuegen (INSERT-only)
DROP POLICY IF EXISTS "events_insert_public" ON nureine_events;
CREATE POLICY "events_insert_public"
  ON nureine_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Kein SELECT/UPDATE/DELETE fuer anon/authenticated -> nur service_role (bypasst RLS)
-- (Service-Role-Key umgeht RLS vollstaendig; daher keine SELECT-Policy noetig.)
