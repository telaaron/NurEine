-- Remove tables accidentally created by 00001 (we use lichtblick_ prefixed tables from 00003)
DROP TABLE IF EXISTS newsletter_sends CASCADE;
DROP TABLE IF EXISTS cron_runs CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS rss_sources CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
