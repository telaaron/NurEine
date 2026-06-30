-- 00042_social_reel_kind.sql
-- Reel als dritte Post-Art (Phase 2, "Atmendes Papier v2"). Additiv.
-- Die fertige MP4-URL wird in slide_urls[0] abgelegt (kein neues Feld nötig).

ALTER TABLE nureine_social_posts
  DROP CONSTRAINT IF EXISTS nureine_social_posts_post_kind_check;
ALTER TABLE nureine_social_posts
  ADD CONSTRAINT nureine_social_posts_post_kind_check
  CHECK (post_kind IN ('story', 'digest', 'reel'));

COMMENT ON COLUMN nureine_social_posts.post_kind IS 'story = täglicher Story-Post, digest = Wochen-Digest, reel = Ken-Burns-Reel (MP4 in slide_urls[0]).';
