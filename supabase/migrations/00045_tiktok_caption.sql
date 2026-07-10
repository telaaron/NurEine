-- 00045_tiktok_caption.sql
-- TikTok-Kanal-Start: pro Story eine eigene TikTok-Caption + Hashtags.
--
-- Warum eigene Felder (nicht die IG-caption wiederverwenden): TikTok verlangt
-- einen anderen Hook (Payoff/Zahl in Sekunde 1), Keyword-SEO in den ersten ~60
-- Zeichen, 3-5 Hashtags und einen Save-/Comment-CTA statt des IG-Send-CTA
-- (siehe docs/TIKTOK_PLAN.md §3/§5). Diese Felder schreibt die Reel-Regie-Routine
-- (bzw. werden für den Bestand handgepflegt); das Admin-Tool /admin/tiktok liest
-- sie und fällt auf den regelbasierten Builder (tiktok-caption.ts) zurück, wenn
-- sie leer sind.
--
-- Rein additiv: nur ADD COLUMN, keine bestehende Spalte/RLS/Policy verändert.

ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS tiktok_caption  TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_hashtags TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN nureine_stories.tiktok_caption IS
  'TikTok-optimierte Caption (Hook + Keyword vorne + Save/Comment-CTA + Quellenzeile), OHNE Hashtags. NULL => Admin-Tool nutzt den regelbasierten Fallback aus tiktok-caption.ts.';
COMMENT ON COLUMN nureine_stories.tiktok_hashtags IS
  '3-5 TikTok-Hashtags inkl. fuehrendem #, #gutenachrichten zuerst. Leer => Fallback-Builder.';
