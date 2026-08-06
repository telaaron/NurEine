-- 00048_ai_runs_zombie_watchdog.sql
-- Verbesserung #39 (nureine_improvements): Agentenläufe, die abstürzen, bleiben
-- für immer auf status='running' stehen — mit finished_at=NULL und error=NULL.
-- Die DB sieht dann nicht leer, sondern fälschlich BESCHÄFTIGT aus: der nächste
-- Agent der Kette wartet auf einen Lauf, der nie endet, und jede Lücken-
-- Überwachung ist blind. Gemessen 21.07.2026: zwei solcher Zombie-Zeilen
-- (fetcher seit 412 Min bzw. seit 79 h), Folge in derselben Nacht 0 neue
-- Stories, kein Chefredakteurs-Lauf, 0 Perlen für die Redaktion.
--
-- Lösung: ein Watchdog, den jeder Agent beim Start aufruft. Er schließt fremde
-- verwaiste Läufe als 'failed' ab, damit der Ausfall SICHTBAR ist statt still.

-- ── Watchdog: verwaiste 'running'-Läufe auf 'failed' setzen ────────────────
-- p_max_age_minutes: ab welchem Alter ein laufender Eintrag als tot gilt.
--   90 Min ist bewusst großzügig — der längste reguläre Lauf (Reel-Regie mit
--   Render) blieb bisher deutlich darunter.
-- p_exclude_id: der eigene, gerade gestartete Lauf wird nie angefasst.
create or replace function nureine_ai_runs_reap_stale(
  p_max_age_minutes int default 90,
  p_exclude_id      bigint default null
)
returns table (id bigint, agent text, started_at timestamptz, age_minutes int)
language sql
security definer
set search_path = public
as $$
  update nureine_ai_runs r
     set status      = 'failed',
         finished_at = now(),
         error       = coalesce(r.error, '')
                       || case when coalesce(r.error, '') = '' then '' else ' | ' end
                       || 'Watchdog: Lauf ohne Abschluss beendet (seit '
                       || round(extract(epoch from (now() - r.started_at)) / 60)
                       || ' Min auf running, kein finished_at) — vermutlich abgestürzt.'
   where r.status = 'running'
     and r.started_at < now() - make_interval(mins => p_max_age_minutes)
     and (p_exclude_id is null or r.id <> p_exclude_id)
  returning r.id,
            r.agent,
            r.started_at,
            round(extract(epoch from (now() - r.started_at)) / 60)::int;
$$;

comment on function nureine_ai_runs_reap_stale(int, bigint) is
  'Verbesserung #39: schließt abgestürzte Agentenläufe (status=running ohne finished_at, älter als p_max_age_minutes) als failed ab, damit ein Ausfall sichtbar wird statt die Kette blind warten zu lassen. Von jedem Agenten beim Start aufzurufen: select * from nureine_ai_runs_reap_stale(90, <eigene_run_id>);';

-- ── Sicht auf die Lauf-Gesundheit (fürs /admin/ki-Cockpit) ─────────────────
-- Zeigt je Agent den letzten Lauf und ob er hängt. So ist ein stiller Ausfall
-- eine Zeile im Dashboard, kein Rätsel.
create or replace view nureine_ai_run_health as
select distinct on (r.agent)
  r.agent,
  r.id            as last_run_id,
  r.status,
  r.started_at,
  r.finished_at,
  round(extract(epoch from (now() - r.started_at)) / 60)::int as age_minutes,
  (r.status = 'running'
     and r.started_at < now() - interval '90 minutes')        as is_stale,
  r.summary,
  r.error
from nureine_ai_runs r
order by r.agent, r.started_at desc;

comment on view nureine_ai_run_health is
  'Letzter Lauf je Agent inkl. Hänger-Erkennung (is_stale). Basis für die Ausfall-Anzeige im KI-Cockpit — Verbesserung #39.';

-- ── Altlasten der Vergangenheit einmalig aufräumen ─────────────────────────
select * from nureine_ai_runs_reap_stale(90, null);
