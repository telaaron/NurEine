-- Proxy-Engagement ohne instagram_manage_insights-Scope:
-- like_count/comments_count sind via fields-Abfrage mit Basis-Token lesbar.
ALTER TABLE nureine_social_posts
  ADD COLUMN IF NOT EXISTS likes integer,
  ADD COLUMN IF NOT EXISTS comments integer;
