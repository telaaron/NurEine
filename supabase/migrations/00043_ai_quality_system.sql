-- 00043_ai_quality_system.sql
-- Selbstlern-Layer für das KI-Qualitätssystem (docs/AI_QUALITY_SYSTEM.md).
-- Zwei Tabellen: jeder Agentenlauf wird protokolliert, und jede
-- Verbesserungs-Idee wird von Vorschlag bis gemessener Wirkung getrackt.

-- ── nureine_ai_runs — ein Eintrag pro Agentenlauf (fürs Dashboard) ──────────
create table if not exists nureine_ai_runs (
  id           bigint generated always as identity primary key,
  agent        text not null,               -- 'chefredakteur' | 'veredler' | 'bild-regie' | 'analyst' | 'reel-regie' | 'verbesserer'
  layer        text not null default 'cloud', -- 'cloud' | 'local'
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running', -- 'running' | 'ok' | 'partial' | 'failed'
  model        text,                         -- z.B. 'claude-opus-4-8' / gemischt
  -- maschinenlesbare Kennzahlen des Laufs (verarbeitet/geändert/ausgewählt …)
  metrics      jsonb not null default '{}'::jsonb,
  -- kurzer, menschenlesbarer Ergebnis-Satz fürs Dashboard
  summary      text,
  error        text
);
create index if not exists idx_ai_runs_agent_time on nureine_ai_runs (agent, started_at desc);

-- ── nureine_improvements — Vorschlag → umgesetzt? → Wirkung gemessen? ────────
create table if not exists nureine_improvements (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  proposed_by   text not null,              -- welcher Agent die Idee hatte
  -- was & wo: 'prompt' | 'threshold' | 'code' | 'source' | 'schedule' | 'other'
  kind          text not null,
  target        text,                       -- z.B. 'fetch_stories.ANALYSIS_PROMPT' / 'selectInstagramStory'
  title         text not null,              -- kurze Idee
  rationale     text not null,              -- warum (mit Daten belegt)
  -- erwartete Wirkung + wie gemessen wird (welche Metrik, welcher Zeitraum)
  hypothesis    text,
  metric        text,                       -- 'shares_per_reach' | 'newsletter_open' | 'resonance' | …
  priority      int not null default 3,     -- 1 = essenziell … 5 = nice-to-have
  -- lifecycle: proposed → approved → applied → verified(kept|reverted) | rejected
  status        text not null default 'proposed',
  applied_at    timestamptz,
  applied_ref   text,                       -- Commit-SHA / PR-URL / Prompt-Version
  -- Wirkungsmessung (vom Agenten nach N Tagen befüllt)
  baseline      numeric,                    -- Metrik vor der Änderung
  result        numeric,                    -- Metrik nach der Änderung
  verified_at   timestamptz,
  outcome       text,                       -- 'improved' | 'neutral' | 'worse'
  notes         text
);
create index if not exists idx_improvements_status on nureine_improvements (status, priority);

comment on table nureine_ai_runs is 'Ein Eintrag pro KI-Agentenlauf (Nacht-Routinen) — Basis fürs /admin/ki-Dashboard.';
comment on table nureine_improvements is 'Selbstlern-Layer: Verbesserungs-Idee von Vorschlag bis gemessener Wirkung.';
