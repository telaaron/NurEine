-- ============================================================
-- 00051: VISION.md in die Datenbank
-- ============================================================
-- Warum: /admin/vision las die Datei per readFile aus dem Repo-Wurzel-
-- verzeichnis. Auf Vercel liegt sie dort nicht — Serverless-Bundles enthalten
-- nur importierte Module, keine .md-Dateien (geprueft: NULL Markdown-Dateien
-- im Function-Bundle). Die Seite war live also dauerhaft im Fehlerzweig, und
-- Bearbeiten war ohnehin unmoeglich, weil das Dateisystem read-only ist.
--
-- Mit der Tabelle funktioniert die Seite live zum Lesen UND Bearbeiten.
-- VISION.md bleibt als Datei bestehen (Pflichtlektuere fuer Claude-Sessions,
-- siehe CLAUDE.md) und wird aus der DB heraus aktualisiert.
--
-- Versionierung: jede Speicherung schreibt eine neue Zeile. Das Dokument ist
-- das Gedaechtnis ueber alle parallelen Sessions — ein versehentliches
-- Ueberschreiben muss zurueckholbar sein.
-- ============================================================

CREATE TABLE IF NOT EXISTS nureine_vision (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,                       -- 'admin' | 'sync' | Session-Hinweis
  note TEXT                              -- optionale Notiz zur Aenderung
);

CREATE INDEX IF NOT EXISTS idx_vision_updated ON nureine_vision(updated_at DESC);

-- Kein oeffentlicher Lesezugriff: Das Dokument enthaelt interne Roadmap,
-- offene Entscheidungen und Nutzerzahlen. Nur der Service-Role-Key (Admin,
-- server-seitig) kommt heran.
ALTER TABLE nureine_vision ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vision_no_public ON nureine_vision;
-- Bewusst KEINE permissive Policy: ohne Policy kommt anon/authenticated
-- nicht an die Zeilen. Service-Role umgeht RLS ohnehin.
