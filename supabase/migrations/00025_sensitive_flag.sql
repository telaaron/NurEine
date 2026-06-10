-- ============================================================
-- 00025: Jugendschutz — sensitive-Flag für heikle Themen
-- ============================================================
-- Markiert Stories mit potenziell heiklem Inhalt (sexueller/expliziter
-- Kontext, Gewalt-Bezug). Default jugendfrei: solche Stories werden im
-- Frontend dezent verhüllt + nur auf bewusstes Antippen ("ungefiltert
-- zeigen") aufgedeckt. Die Story bleibt im Archiv, wird nur nicht
-- ungewollt prominent ausgespielt.
-- ============================================================

ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS sensitive BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN nureine_stories.sensitive IS 'true = potenziell heikles Thema (Sex/Gewalt-Kontext). Frontend zeigt es dezent verhüllt mit Aufdeck-Toggle. Default false (jugendfrei).';
