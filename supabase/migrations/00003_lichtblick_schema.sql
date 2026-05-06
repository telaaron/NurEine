-- ============================================================
-- Lichtblick Tables (lichtblick_ Prefix) for mustseen project
-- ============================================================

-- Haupt-Stories
CREATE TABLE IF NOT EXISTS lichtblick_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  body_markdown TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('klima','gesundheit','wissenschaft','gemeinschaft','tiere','kultur','innovation')) NOT NULL,
  region TEXT,
  region_code TEXT,
  lat FLOAT,
  lng FLOAT,
  impact_score INT CHECK (impact_score BETWEEN 1 AND 100),
  impact_reach INT,
  impact_durability INT,
  impact_evidence INT,
  reading_time_min INT DEFAULT 3,
  emoji TEXT,
  is_hero BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RSS Quellen
CREATE TABLE IF NOT EXISTS lichtblick_rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT DEFAULT 'de',
  region TEXT,
  region_code TEXT,
  active BOOLEAN DEFAULT true
);

-- Newsletter Subscriber
CREATE TABLE IF NOT EXISTS lichtblick_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  tier TEXT CHECK (tier IN ('free','plus','b2b')) DEFAULT 'free',
  confirmed BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  lat FLOAT,
  lng FLOAT,
  region TEXT,
  region_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Newsletter Sends Log
CREATE TABLE IF NOT EXISTS lichtblick_newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES lichtblick_subscribers(id),
  story_id UUID REFERENCES lichtblick_stories(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened BOOLEAN DEFAULT false
);

-- Cronjob Run Log
CREATE TABLE IF NOT EXISTS lichtblick_cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  stories_found INT,
  stories_inserted INT,
  ran_at TIMESTAMPTZ DEFAULT now(),
  error TEXT
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_lb_stories_category ON lichtblick_stories(category);
CREATE INDEX IF NOT EXISTS idx_lb_stories_impact_score ON lichtblick_stories(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_lb_stories_published_at ON lichtblick_stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_lb_stories_is_hero ON lichtblick_stories(is_hero) WHERE is_hero = true;
CREATE INDEX IF NOT EXISTS idx_lb_stories_source_url ON lichtblick_stories(source_url);
CREATE INDEX IF NOT EXISTS idx_lb_stories_region_code ON lichtblick_stories(region_code);
CREATE INDEX IF NOT EXISTS idx_lb_stories_lat_lng ON lichtblick_stories(lat, lng);
CREATE INDEX IF NOT EXISTS idx_lb_subscribers_email ON lichtblick_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_lb_subscribers_tier ON lichtblick_subscribers(tier);
CREATE INDEX IF NOT EXISTS idx_lb_subscribers_confirmed ON lichtblick_subscribers(confirmed) WHERE confirmed = true;
CREATE INDEX IF NOT EXISTS idx_lb_rss_sources_active ON lichtblick_rss_sources(active) WHERE active = true;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE lichtblick_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read stories" ON lichtblick_stories
  FOR SELECT USING (true);

ALTER TABLE lichtblick_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON lichtblick_subscribers
  USING (true)
  WITH CHECK (true);

ALTER TABLE lichtblick_newsletter_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON lichtblick_newsletter_sends
  USING (true)
  WITH CHECK (true);

ALTER TABLE lichtblick_rss_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON lichtblick_rss_sources
  USING (true)
  WITH CHECK (true);

ALTER TABLE lichtblick_cron_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON lichtblick_cron_runs
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED RSS Sources
-- ============================================================

INSERT INTO lichtblick_rss_sources (name, url, language, region, region_code, active) VALUES
  ('Good News Network', 'https://www.goodnewsnetwork.org/feed/', 'en', 'global', NULL, true),
  ('Positive.News', 'https://www.positive.news/feed/', 'en', 'global', NULL, true),
  ('Golem Science', 'https://rss.golem.de/rss.php?feed=RSS2.0', 'de', 'Deutschland', 'DE', true),
  ('Utopia.de', 'https://utopia.de/feed/', 'de', 'Deutschland', 'DE', true),
  ('Berliner Zeitung', 'https://www.berliner-zeitung.de/feed.xml', 'de', 'Deutschland/Berlin', 'DE', true),
  ('Mongabay', 'https://news.mongabay.com/feed/', 'en', 'global', NULL, true),
  ('WHO News', 'https://www.who.int/feeds/entity/mediacentre/news/en', 'en', 'global', NULL, true),
  ('Nature News', 'https://www.nature.com/news.rss', 'en', 'global', NULL, true)
ON CONFLICT DO NOTHING;
