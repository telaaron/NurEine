-- ============================================================
-- 00040: Resonanz-vs-Realität-View (täglicher Verhaltens-Mess-Loop)
-- ============================================================
-- Stellt die ursprüngliche 2. Säule wieder her: täglich messen, ob unsere
-- Resonanz-Bewertung mit dem echten Nutzerverhalten übereinstimmt (Kalibrierung).
-- Join über props->>'slug' — nureine_events tragen KEINE story_id, nur slug/path.
-- Der Slug endet auf die ersten 8 Zeichen der Story-UUID → eindeutig genug.
-- ============================================================

CREATE OR REPLACE VIEW nureine_resonance_vs_reality AS
SELECT
  s.id,
  s.title,
  s.category,
  s.resonance_score,
  s.impact_score,
  s.is_hero,
  s.published_at,
  count(*) FILTER (WHERE e.name = 'story_read') AS reads,
  count(*) FILTER (WHERE e.name = 'share')      AS shares,
  count(*) FILTER (WHERE e.name = 'cta_click')  AS cta
FROM nureine_stories s
LEFT JOIN nureine_events e
  ON e.props->>'slug' LIKE '%' || left(s.id::text, 8)
WHERE s.resonance_score IS NOT NULL
  AND s.published_at > now() - interval '30 days'
GROUP BY s.id, s.title, s.category, s.resonance_score, s.impact_score, s.is_hero, s.published_at;

COMMENT ON VIEW nureine_resonance_vs_reality IS
  'Kalibrierung: Resonanz-Bewertung neben echtem Verhalten (reads/shares/cta aus nureine_events, Join via slug). Opens/Saves noch nicht getrackt.';
