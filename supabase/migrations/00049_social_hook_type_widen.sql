-- Verbesserer #7 (Hook-Monokultur): nureine_social_posts.hook_type durfte bisher
-- nur die alte 3er-Achse (zahl|frage|kontrast). queue.ts loggte den Hook-Typ aber
-- bisher NICHT aus der tatsächlichen Rotationswahl (nureine_stories.ig_hook_type,
-- 6 Werte: zahl|sieg|kontrast|wow|mensch|charme), sondern aus einer separaten
-- Zahl-im-Titel-Heuristik (pickHookType) — die griff bei fast jedem Titel und
-- schrieb praktisch immer 'zahl' zurück, egal welcher Hook-Typ wirklich gewählt
-- wurde. Das hat die Rotations-Historie (selectInstagramStory, Recency-Penalty)
-- verfälscht und macht das Analyst-Symptom "246/249 Posts = zahl" erklärbar.
-- Diese Migration weitet den CHECK nur, damit der Code-Fix (queue.ts nutzt jetzt
-- story.igHookType) die echten Werte auch speichern darf. 'frage' bleibt erlaubt
-- (Bestandsdaten + Fallback-Heuristik ohne ig_hook_type).
ALTER TABLE nureine_social_posts DROP CONSTRAINT IF EXISTS nureine_social_posts_hook_check;
ALTER TABLE nureine_social_posts ADD CONSTRAINT nureine_social_posts_hook_check
  CHECK (hook_type = ANY (ARRAY['zahl','frage','kontrast','sieg','wow','mensch','charme']));
