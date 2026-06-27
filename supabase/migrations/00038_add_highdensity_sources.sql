-- ============================================================
-- 00038: Hochdichte-Quellen — Preise/Fellowships (Runde 2, 2026-06-27)
-- ============================================================
-- Befund: an 59% der Tage riss KEIN Kandidat die 7.0-Resonanz-Schwelle.
-- Lösung: vor-kuratierte Resonanz aus Preisen/Fellowships — eine Experten-Jury
-- hat die Held:innen bereits ausgewählt. Hohe Treffer-Dichte statt Volumen.
-- Alle Feeds live verifiziert 2026-06-27. Siehe nureine-impact/SOURCES.md.
-- Idempotent.
-- ============================================================

INSERT INTO nureine_rss_sources (name, url, language, active, is_primary, hero_eligible) VALUES
  -- 7 Graswurzel-Umwelthelden/Jahr + Blog. David-vs-Goliath-Arc, Global South.
  ('Goldman Environmental Prize', 'https://www.goldmanprize.org/blog/feed/', 'en', true, false, true),
  -- "Asiens Nobel": echte Wendepunkt-Citations, non-westliche Vielfalt.
  ('Ramon Magsaysay Award', 'https://rmaward.asia/feed/', 'en', true, false, true),
  -- ~7 Naturschutz-Held:innen/Jahr + charismatische Arten, Global South.
  ('Whitley Awards', 'https://whitleyaward.org/feed/', 'en', true, false, true),
  -- First-Person-Menschengeschichten (NPR). Audio-Feed, aber <description> trägt
  -- echten Story-Text (vor dem ersten <br/><br/>) → zur Resonanz-Bewertung nutzbar.
  ('StoryCorps', 'https://feeds.npr.org/510200/podcast.xml', 'en', true, false, true)
ON CONFLICT DO NOTHING;

-- VERWORFEN Runde 2: Right Livelihood (politisch/schwer), GiveDirectly (stats-lastig,
--   Einzelschicksale nicht im Feed), Skoll (Org-Sprache), Tyler/Rolex (kein RSS).
-- VORGEMERKT (kein RSS / Cloudflare → Scraper nötig, hohes Potenzial): Undue Medical
--   Debt (exakter Perlen-Archetyp), Heifer, Aurora Prize, Ashoka Fellows, CNN Heroes.
