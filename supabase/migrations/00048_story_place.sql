-- Echter Ort pro Story — für /bei-dir ("Vor deiner Haustür").
--
-- Bisher stand in `region` nur der Ländername ("Deutschland"), weil der
-- Analyse-Prompt genau danach fragt. Die Koordinaten sind dagegen spezifisch
-- (Berlin, Dresden, Göttingen …), wurden aber nirgends benannt. Ergebnis: auf
-- jeder Karte stand "Deutschland", obwohl der echte Ort bekannt war.
--
-- WICHTIG — Granularität muss zur REICHWEITE der Story passen, nicht zur
-- Genauigkeit der Koordinate:
--   • Story über ganz Berlin        → place_name = "Berlin"      (NICHT "Mitte")
--   • neuer Supermarkt in Lankwitz  → place_name = "Lankwitz"
--   • bundesweite Regelung          → place_name = NULL          (kein Ort!)
-- Ein zu genauer Ort ist eine Falschaussage. Lieber gröber als falsch.

ALTER TABLE nureine_stories
  -- Der Ort, wie ihn ein Mensch sagen würde: "Lankwitz", "Berlin", "Dresden".
  ADD COLUMN IF NOT EXISTS place_name text,
  -- Einordnung für Ortsfremde: "Berlin-Steglitz", "Sachsen". Optional.
  ADD COLUMN IF NOT EXISTS place_context text,
  -- Wie weit die Story reicht — steuert, ob und wie fein ein Ort gezeigt wird.
  ADD COLUMN IF NOT EXISTS place_scope text,
  -- Wann aufgelöst. NULL = noch nie versucht (Backfill-Kandidat).
  ADD COLUMN IF NOT EXISTS place_resolved_at timestamptz;

-- Nur die Werte, die die Anzeige unterscheiden kann. 'none' ist bewusst ein
-- eigener Wert und nicht NULL: es heißt "geprüft, hat keinen lokalen Ort" und
-- verhindert, dass der Backfill die Story immer wieder anfasst.
ALTER TABLE nureine_stories
  DROP CONSTRAINT IF EXISTS nureine_stories_place_scope_check;
ALTER TABLE nureine_stories
  ADD CONSTRAINT nureine_stories_place_scope_check
  CHECK (place_scope IS NULL OR place_scope IN ('neighbourhood','city','region','none'));

-- /bei-dir filtert auf "hat einen echten Ort" und sortiert nach Entfernung.
CREATE INDEX IF NOT EXISTS idx_stories_place_name
  ON nureine_stories (place_name)
  WHERE place_name IS NOT NULL;

COMMENT ON COLUMN nureine_stories.place_name IS
  'Ortsname passend zur Reichweite der Story (Berlin, nicht Mitte, wenn es ganz Berlin betrifft). NULL = überregional.';
COMMENT ON COLUMN nureine_stories.place_scope IS
  'neighbourhood | city | region | none — none heißt geprüft und bewusst ohne Ort.';
