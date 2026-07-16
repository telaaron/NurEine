-- 00047: TEAM-BOARD — geteiltes Gedächtnis der Agenten.
--
-- Anlass (2026-07-16): Supabase sperrte das Projekt (exceed_egress_quota). JEDER
-- Nacht-Agent wäre nacheinander blind in denselben Fehler gelaufen — keiner
-- konnte den anderen warnen. Genauso beim Timing-Race (Veredler/Bild-Regie
-- liefen ins Leere, weil der Chefredakteur noch nicht gelaufen war).
--
-- Die Agenten sind Kollegen, keine Einzelkämpfer: hier hinterlassen sie sich
-- gegenseitig Nachrichten. Jeder Agent liest das Board ZUERST und schreibt am
-- Ende sein Ergebnis + offene Blocker rein.
CREATE TABLE IF NOT EXISTS nureine_team_board (
  id          bigserial PRIMARY KEY,
  agent       text NOT NULL,              -- 'fetcher' | 'chefredakteur' | 'redaktion' | 'analyst' | 'verbesserer' | 'reel-regie'
  kind        text NOT NULL,              -- 'status' | 'blocker' | 'hinweis' | 'uebergabe'
  severity    text NOT NULL DEFAULT 'info', -- 'info' | 'warn' | 'critical'
  title       text NOT NULL,              -- eine Zeile, für Menschen lesbar
  detail      text,                       -- was genau, mit Zahlen
  for_agent   text,                       -- NULL = an alle; sonst gezielt ('redaktion')
  resolved    boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Der häufigste Zugriff: "offene kritische Meldungen der letzten 24h".
CREATE INDEX IF NOT EXISTS idx_team_board_open
  ON nureine_team_board (resolved, created_at DESC)
  WHERE resolved = false;

COMMENT ON TABLE nureine_team_board IS
  'Geteiltes Gedächtnis der NurEine-Agenten. Jeder liest offene Blocker VOR der Arbeit und schreibt danach Status/Blocker/Übergabe rein.';
COMMENT ON COLUMN nureine_team_board.kind IS
  'status=Lauf-Ergebnis, blocker=etwas hindert die Arbeit (auch andere!), hinweis=Learning für Kollegen, uebergabe=Aufgabe an den nächsten';
COMMENT ON COLUMN nureine_team_board.severity IS
  'critical=nachfolgende Agenten sollen abbrechen/anpassen (z.B. DB gesperrt, Quota voll)';
