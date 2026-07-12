-- 00047_tiktok_video_url.sql
-- Der TikTok-Master (eigene Komposition ReelTikTok, docs/REEL_BAUKASTEN.md) ist ein
-- SEPARATES Video als das IG-Reel — andere Dramaturgie, andere Länge, andere Musik.
-- Bisher hinterlegte render.mjs bei --tiktok --upload nur die Caption; die MP4 selbst
-- war im Admin-Tool nicht sichtbar (dort lief das IG-Reel-Video). Diese Spalte hält die
-- öffentliche URL des TikTok-Masters, damit /admin/tiktok genau das Video zeigt, das
-- auch wirklich für TikTok gebaut wurde. Rein additiv, kein Constraint, keine RLS-Änderung.
ALTER TABLE nureine_stories ADD COLUMN IF NOT EXISTS tiktok_video_url text;

COMMENT ON COLUMN nureine_stories.tiktok_video_url IS
  'Öffentliche URL des für TikTok gerenderten Masters (ReelTikTok, story_reels-Bucket). Von render.mjs --tiktok --upload gesetzt; von /admin/tiktok bevorzugt angezeigt.';
