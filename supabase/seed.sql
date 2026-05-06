-- Seed RSS Sources
INSERT INTO nureine_rss_sources (name, url, language, region, region_code, active) VALUES
  ('Good News Network', 'https://www.goodnewsnetwork.org/feed/', 'en', 'global', NULL, true),
  ('Positive.News', 'https://www.positive.news/feed/', 'en', 'global', NULL, true),
  ('Golem Science', 'https://rss.golem.de/rss.php?feed=RSS2.0', 'de', 'Deutschland', 'DE', true),
  ('Utopia.de', 'https://utopia.de/feed/', 'de', 'Deutschland', 'DE', true),
  ('Berliner Zeitung', 'https://www.berliner-zeitung.de/feed.xml', 'de', 'Deutschland/Berlin', 'DE', true),
  ('Mongabay', 'https://news.mongabay.com/feed/', 'en', 'global', NULL, true),
  ('WHO News', 'https://www.who.int/feeds/entity/mediacentre/news/en', 'en', 'global', NULL, true),
  ('Nature News', 'https://www.nature.com/news.rss', 'en', 'global', NULL, true)
ON CONFLICT DO NOTHING;
