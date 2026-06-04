-- ============================================================
-- 00018: Subscriber-Praeferenzen (Kategorien) fuer personalisierten Newsletter
-- ============================================================
-- Zweck: Leser waehlen bevorzugte Kategorien -> taeglicher Newsletter wird
-- pro Nutzer gefiltert (statt eine Hero-Story fuer alle). Spaeter: automatische
-- Anpassung aus Open-/Click-Raten (category_scores).
--
-- Kein Login noetig: Einstellungen via bestehenden confirmation_token-Link
-- (wie unsubscribe/confirm). Leeres categories[] = "alle Kategorien".
--
-- Vollstaendig IDEMPOTENT. Aendert KEINE RLS-Policies.
-- ============================================================

-- Bevorzugte Kategorien. Leeres Array = keine Einschraenkung (alle).
ALTER TABLE nureine_subscribers
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN nureine_subscribers.categories IS
  'Bevorzugte Story-Kategorien. Leer = alle. Filtert die personalisierte Tagesausgabe.';

-- Gewichte pro Kategorie aus Engagement (open/click) — Basis fuer spaetere
-- automatische Personalisierung. { "klima": 3, "tiere": 1, ... }
ALTER TABLE nureine_subscribers
  ADD COLUMN IF NOT EXISTS category_scores JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN nureine_subscribers.category_scores IS
  'Engagement-Gewichte je Kategorie (aus Open-/Click-Raten). Spaetere Auto-Personalisierung.';

-- Letzte Aktualisierung der Praeferenzen (UI-Feedback)
ALTER TABLE nureine_subscribers
  ADD COLUMN IF NOT EXISTS preferences_updated_at TIMESTAMPTZ;
