-- Lichtblick Supabase Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

-- Haupt-Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  body_markdown TEXT NOT NULL,
  summary TEXT NOT NULL, -- 2-3 Sätze, KI-generiert
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('klima','gesundheit','wissenschaft','gemeinschaft','tiere','kultur','innovation')) NOT NULL,
  region TEXT, -- Land oder Region auf Deutsch
  region_code TEXT, -- ISO 3166-1 alpha-2
  lat FLOAT,
  lng FLOAT,
  impact_score INT CHECK (impact_score BETWEEN 1 AND 100), -- Wirkungsindex
  impact_reach INT, -- geschätzte betroffene Menschen
  impact_durability INT, -- 0-100
  impact_evidence INT, -- 0-100
  reading_time_min INT DEFAULT 3,
  emoji TEXT, -- ein Emoji als visuelles Icon
  is_hero BOOLEAN DEFAULT false, -- täglich genau eine Hero-Story
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RSS Quellen
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT DEFAULT 'de',
  region TEXT,
  region_code TEXT,
  active BOOLEAN DEFAULT true
);

-- Newsletter Subscriber
CREATE TABLE IF NOT EXISTS subscribers (
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
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  story_id UUID REFERENCES stories(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened BOOLEAN DEFAULT false
);

-- Cronjob Run Log
CREATE TABLE IF NOT EXISTS cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT, -- 'fetch', 'newsletter_sunday', 'newsletter_daily'
  stories_found INT,
  stories_inserted INT,
  ran_at TIMESTAMPTZ DEFAULT now(),
  error TEXT
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_impact_score ON stories(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_is_hero ON stories(is_hero) WHERE is_hero = true;
CREATE INDEX IF NOT EXISTS idx_stories_source_url ON stories(source_url);
CREATE INDEX IF NOT EXISTS idx_stories_region_code ON stories(region_code);
CREATE INDEX IF NOT EXISTS idx_stories_lat_lng ON stories(lat, lng);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_tier ON subscribers(tier);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmed ON subscribers(confirmed) WHERE confirmed = true;
CREATE INDEX IF NOT EXISTS idx_rss_sources_active ON rss_sources(active) WHERE active = true;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Stories: Public can read published stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read stories" ON stories
  FOR SELECT USING (true);

-- Subscribers: Only service role can access
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON subscribers
  USING (true)
  WITH CHECK (true);

-- Newsletter sends: Only service role
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON newsletter_sends
  USING (true)
  WITH CHECK (true);

-- RSS sources: Only service role
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON rss_sources
  USING (true)
  WITH CHECK (true);

-- Cron runs: Only service role
ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON cron_runs
  USING (true)
  WITH CHECK (true);
