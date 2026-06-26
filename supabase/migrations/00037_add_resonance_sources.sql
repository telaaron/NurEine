-- ============================================================
-- 00037: Neue Resonanz-Quellen (Outreach-Erweiterung 2026-06-27)
-- ============================================================
-- Nach der Quellen-Diagnose (00036): der Bestand lieferte Größe, aber Resonanz
-- war selten (1,3% Perlen) und zu westlich/institutionell. Diese 5 Quellen wurden
-- recherchiert + Feeds live verifiziert (2026-06-27). Sie schließen die größte
-- Lücke: konkrete menschliche Einzelschicksale + Global South.
--
-- Siehe nureine-impact/SOURCES.md für die volle Pro/Contra-Bewertung.
-- Idempotent (ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO nureine_rss_sources (name, url, language, active, is_primary, hero_eligible) VALUES
  -- Indien: tägliche menschliche Solutions-Szenen (75% echt, geprüft). Global-South-Lücke.
  ('The Better India', 'https://www.thebetterindia.com/feed/', 'en', true, false, true),
  -- 200+ Länder, lokale Stimmen übersetzt, echte Szenen mit Namen. Bi-wöchentlich → Feeder.
  ('Global Voices Good News', 'https://globalvoices.org/-/topics/good-news/feed/', 'en', true, false, true),
  -- Seriöse People-Making-a-Difference-Stücke, null Kitsch. ~30% passt, Rest filtert die Pipeline.
  ('Christian Science Monitor', 'https://rss.csmonitor.com/feeds/all', 'en', true, false, true),
  -- Roundup der weltweit besten Konstruktiv-Stories → Discovery-Feeder für den Kurator.
  ('Squirrel News', 'https://squirrel-news.net/feed/', 'en', true, false, true),
  -- Literarisch, anti-Clickbait, ~1 kuratierte Story/Tag. Philosophisch fast NurEines Zwilling.
  ('DailyGood', 'https://www.dailygood.org/feed', 'en', true, false, true)
ON CONFLICT DO NOTHING;

-- VORGEMERKT (noch NICHT aufgenommen — brauchen Sonderbehandlung):
--   • StoryCorps (NPR) — feeds.npr.org/510200/podcast.xml — HÖCHSTE Resonanz, aber
--     AUDIO-Feed (Episoden, kein Text) → Routine müsste Transkripte auswerten. Eigener Bauschritt.
--   • Guardian "The Upside" — /world/series/the-upside/rss — redaktionell top, aber
--     Feed-URL nicht headless verifizierbar (Guardian blockt Bots) → manuell im Reader prüfen.
--   • bird story agency — pan-afrikanisch, exzellent, aber KEIN RSS (nur Substack/E-Mail) → Outreach.
--   • Bhekisisa (bhekisisa.org/feed/) — Südafrika/Gesundheit, gut, aber Feed gibt 403 für
--     generische Bots → erst prüfen, ob das Fetch-Script durchkommt.
