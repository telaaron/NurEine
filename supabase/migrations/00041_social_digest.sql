-- 00041_social_digest.sql
-- Wochen-Digest-Post (Idee #10) als eigene Post-Art in der Social-Queue.
-- Additiv: nur neue Spalten + entspannter Unique-Index. Kein Bestandscode bricht.

-- 1) Post-Art unterscheiden: normaler Story-Post vs. Wochen-Digest (N+2 Folien,
--    nicht an EINE Story gebunden, eigener Render-Endpoint /api/digest/<n>).
ALTER TABLE nureine_social_posts
  ADD COLUMN IF NOT EXISTS post_kind TEXT NOT NULL DEFAULT 'story';

ALTER TABLE nureine_social_posts
  DROP CONSTRAINT IF EXISTS nureine_social_posts_post_kind_check;
ALTER TABLE nureine_social_posts
  ADD CONSTRAINT nureine_social_posts_post_kind_check
  CHECK (post_kind IN ('story', 'digest'));

-- 2) Fertige Folien-URLs direkt am Post ablegen. Story-Posts leiten die URLs
--    weiter aus og_url ab (slide_urls bleibt NULL → abwärtskompatibel); der
--    Digest braucht eigene /api/digest/<n>-URLs und legt sie hier ab.
ALTER TABLE nureine_social_posts
  ADD COLUMN IF NOT EXISTS slide_urls TEXT[];

-- 3) Unique-Index entspannen: bisher (story_id, platform) → ein Post je Story.
--    Der Digest verweist auf die Top-Story der Woche, die evtl. schon einen
--    eigenen Story-Post hat. Mit post_kind im Index sind Story- und Digest-Post
--    für dieselbe Story erlaubt.
DROP INDEX IF EXISTS nureine_social_posts_story_platform_idx;
CREATE UNIQUE INDEX IF NOT EXISTS nureine_social_posts_story_platform_kind_idx
  ON nureine_social_posts (story_id, platform, post_kind);

-- Hinweis: "max. ein Digest pro Tag" wird in generateDigestDraft() im Code
-- erzwungen (Datums-Range-Guard), nicht per Teil-Index — ein Index auf
-- (scheduled_for::date) ist nicht IMMUTABLE (timezone-abhängig) und von
-- Postgres im Index-Ausdruck nicht erlaubt.

COMMENT ON COLUMN nureine_social_posts.post_kind IS 'story = täglicher Story-Post, digest = wöchentlicher Wochen-Digest-Carousel.';
COMMENT ON COLUMN nureine_social_posts.slide_urls IS 'Explizite Folien-URLs (v.a. Digest). NULL bei Story-Posts → aus og_url abgeleitet.';
