-- ============================================================
-- 00021: "Stand der Welt" — Langzeit-Fortschritts-Metriken (der Moat)
-- ============================================================
-- Kuratierte globale Indikatoren mit Langzeit-Trend. Monatlicher Python-Cron
-- (World Bank / OWID) schreibt rein. NICHT tagesaktuell — Daten ändern sich
-- jährlich/quartalsweise; Fake-Aktualität wäre unehrlich.
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS nureine_world_metrics (
  metric_key   TEXT PRIMARY KEY,            -- z.B. 'extreme_poverty'
  label        TEXT NOT NULL,               -- "Extreme Armut"
  category     TEXT NOT NULL,               -- 'ueberleben' | 'planet' | 'wissen' | 'frieden'
  unit         TEXT,                        -- '%', 'Jahre', ...
  latest_value DOUBLE PRECISION,            -- aktuellster Wert
  latest_year  SMALLINT,
  baseline_value DOUBLE PRECISION,          -- Vergleichswert (z.B. 1990)
  baseline_year  SMALLINT,
  direction    TEXT NOT NULL DEFAULT 'up',  -- 'up' = höher ist besser, 'down' = niedriger ist besser
  blurb        TEXT,                        -- 1-3 Sätze Kontext
  series       JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{year, value}, ...] für die Trendlinie
  source       TEXT,                        -- "World Bank", "WHO", ...
  source_url   TEXT,
  sort_order   SMALLINT NOT NULL DEFAULT 100,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nureine_world_metrics
  DROP CONSTRAINT IF EXISTS nureine_world_metrics_category_check;
ALTER TABLE nureine_world_metrics
  ADD CONSTRAINT nureine_world_metrics_category_check
  CHECK (category IN ('ueberleben','planet','wissen','frieden'));

ALTER TABLE nureine_world_metrics ENABLE ROW LEVEL SECURITY;
-- Öffentlich lesbar (es sind aggregierte, öffentliche Statistiken).
DROP POLICY IF EXISTS "world_metrics_read_public" ON nureine_world_metrics;
CREATE POLICY "world_metrics_read_public"
  ON nureine_world_metrics FOR SELECT TO anon, authenticated
  USING (true);
-- Schreiben nur service_role (Cron) → keine INSERT/UPDATE-Policy.

COMMENT ON TABLE nureine_world_metrics IS
  'Kuratierte Langzeit-Fortschritts-Metriken für /stand-der-welt. Monatlicher Cron.';
