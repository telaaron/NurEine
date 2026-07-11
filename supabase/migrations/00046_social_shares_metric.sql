-- 00046: shares-Metrik für Social-Posts.
-- Der Analyst nennt shares/reach als LEITMETRIK (Sends = Top-Ranking-Signal auf
-- IG/Reels), konnte sie aber nie schreiben, weil die Spalte fehlte. refreshInsights
-- zieht Story-Insights jetzt mit reach,replies,shares und Feed mit saved,reach,
-- likes,shares — beide brauchen ein Ziel für shares.
ALTER TABLE nureine_social_posts
  ADD COLUMN IF NOT EXISTS shares integer;

COMMENT ON COLUMN nureine_social_posts.shares IS
  'IG-Insight: Wie oft der Post/Story geteilt wurde (Sends). Leitmetrik shares/reach.';
