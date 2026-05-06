-- ============================================================
-- Rename from Lichtblick to NurEine
-- Rename all tables and indexes to nureine_ prefix
-- ============================================================

-- Rename tables
ALTER TABLE IF EXISTS lichtblick_stories RENAME TO nureine_stories;
ALTER TABLE IF EXISTS lichtblick_rss_sources RENAME TO nureine_rss_sources;
ALTER TABLE IF EXISTS lichtblick_subscribers RENAME TO nureine_subscribers;
ALTER TABLE IF EXISTS lichtblick_newsletter_sends RENAME TO nureine_newsletter_sends;
ALTER TABLE IF EXISTS lichtblick_cron_runs RENAME TO nureine_cron_runs;

-- Rename indexes
ALTER INDEX IF EXISTS idx_lb_stories_category RENAME TO idx_nur_stories_category;
ALTER INDEX IF EXISTS idx_lb_stories_impact_score RENAME TO idx_nur_stories_impact_score;
ALTER INDEX IF EXISTS idx_lb_stories_published_at RENAME TO idx_nur_stories_published_at;
ALTER INDEX IF EXISTS idx_lb_stories_is_hero RENAME TO idx_nur_stories_is_hero;
ALTER INDEX IF EXISTS idx_lb_stories_source_url RENAME TO idx_nur_stories_source_url;
ALTER INDEX IF EXISTS idx_lb_stories_region_code RENAME TO idx_nur_stories_region_code;
ALTER INDEX IF EXISTS idx_lb_stories_lat_lng RENAME TO idx_nur_stories_lat_lng;
ALTER INDEX IF EXISTS idx_lb_subscribers_email RENAME TO idx_nur_subscribers_email;
ALTER INDEX IF EXISTS idx_lb_subscribers_tier RENAME TO idx_nur_subscribers_tier;
ALTER INDEX IF EXISTS idx_lb_subscribers_confirmed RENAME TO idx_nur_subscribers_confirmed;
ALTER INDEX IF EXISTS idx_lb_rss_sources_active RENAME TO idx_nur_rss_sources_active;
