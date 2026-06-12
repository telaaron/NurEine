-- Kommentar-Antworten laufen ab jetzt durch eine Freigabe-Queue statt Auto-Post.
-- status: pending (wartet auf Freigabe) | posted | skipped (KI: nicht antworten)
--         | rejected (Mensch: nicht antworten) | failed (Graph-API-Fehler)
-- Bestehende Zeilen: reply_text gesetzt = war gepostet, sonst übersprungen.
ALTER TABLE nureine_social_replies
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'posted';

UPDATE nureine_social_replies
  SET status = CASE WHEN reply_text IS NULL THEN 'skipped' ELSE 'posted' END
  WHERE status = 'posted';

CREATE INDEX IF NOT EXISTS idx_social_replies_status
  ON nureine_social_replies (status);
