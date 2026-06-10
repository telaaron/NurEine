-- ============================================================
-- 00026: Wirkungsindex-Aufschlüsselung + Weitersagen
-- ============================================================
-- Macht den Wirkungsindex nachvollziehbar (3 Achsen-Balken + Relevanz-Satz)
-- und liefert einen fertigen Teilen-Satz ("So erzählst du es weiter").
--   impact_reach_score : 0-100 normalisierte Reichweite (für Balken; impact_reach
--                        ist BIGINT = echte Personenzahl, nicht balkentauglich).
--   impact_explainer   : EIN menschlicher Satz, der die Relevanz übersetzt
--                        (nicht die Methodik erklärt).
--   share_hook         : EIN fertiger Chat-Satz zum Weitergeben (WhatsApp-ready).
-- durability/evidence (0-100) existieren bereits aus migration 00023-Logik.
-- ============================================================

ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS impact_reach_score SMALLINT,
  ADD COLUMN IF NOT EXISTS impact_explainer TEXT,
  ADD COLUMN IF NOT EXISTS share_hook TEXT;

COMMENT ON COLUMN nureine_stories.impact_reach_score IS '0-100 normalisierte Reichweite für die Balken-Anzeige (impact_reach ist die rohe Personenzahl).';
COMMENT ON COLUMN nureine_stories.impact_explainer IS 'Ein menschlicher Satz, der die Relevanz übersetzt — unter den Wirkungsindex-Balken.';
COMMENT ON COLUMN nureine_stories.share_hook IS 'Fertiger Chat-Satz zum Weitergeben (WhatsApp-ready), unter dem Artikel.';
