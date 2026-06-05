-- ============================================================
-- 00023: Redaktions-Pipeline — Resonanz-Emotion, Kanal-Eignung,
--        vorgenerierte Hooks/Texte + story_shared-Event
-- ============================================================
-- Idempotent. Erweitert nureine_stories um Pipeline-Felder und den
-- nureine_events name-CHECK. Aendert KEINE RLS-Policies.
-- ============================================================

-- 1) Pipeline-Felder auf Stories ---------------------------------------------
ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS emotion     TEXT,      -- relief|wonder|hope|pride|warmth
  ADD COLUMN IF NOT EXISTS ig_ok       BOOLEAN NOT NULL DEFAULT false, -- Instagram-tauglich
  ADD COLUMN IF NOT EXISTS wa_ok       BOOLEAN NOT NULL DEFAULT false, -- WhatsApp-tauglich
  ADD COLUMN IF NOT EXISTS ig_hook     TEXT,      -- erste 1,5 Zeilen (Emotion, nicht Titel)
  ADD COLUMN IF NOT EXISTS wa_opener   TEXT,      -- persönlicher WhatsApp-Einstieg
  ADD COLUMN IF NOT EXISTS slides      JSONB;     -- {hook, aufloesung, stille} für Carousel

ALTER TABLE nureine_stories
  DROP CONSTRAINT IF EXISTS nureine_stories_emotion_check;
ALTER TABLE nureine_stories
  ADD CONSTRAINT nureine_stories_emotion_check
  CHECK (emotion IS NULL OR emotion IN ('relief','wonder','hope','pride','warmth'));

COMMENT ON COLUMN nureine_stories.emotion IS 'Primäre Resonanz-Emotion. relief/wonder→IG, hope/warmth→Newsletter, pride→beide.';
COMMENT ON COLUMN nureine_stories.ig_hook IS 'Instagram-Hook: erste 1,5 Zeilen, Emotion statt Titel.';
COMMENT ON COLUMN nureine_stories.slides IS 'Carousel-Texte: {hook, aufloesung, stille}.';

-- 2) story_shared-Event ------------------------------------------------------
ALTER TABLE nureine_events
  DROP CONSTRAINT IF EXISTS nureine_events_name_check;
-- NOT VALID: gilt für neue Rows, prüft Bestand nicht (alte Events können andere
-- Namen tragen, z.B. aus Tests). story_shared ist damit erlaubt.
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
    'story_submitted',
    'story_shared'
  )) NOT VALID;
