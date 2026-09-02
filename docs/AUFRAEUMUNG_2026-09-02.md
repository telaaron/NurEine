# Aufräumung 2026-09-02 — was schiefgelaufen war und was jetzt gilt

Aarons Verdacht war: „durch das Arbeiten in vielen parallelen Chats sind viele
Fehler entstanden." Das stimmt, aber nicht so, wie es klingt. Die Sessions
haben sauber gearbeitet. Falsch war, **was sie zuerst lasen** und **wohin ihre
Arbeit floss**.

Dieses Dokument hält beides fest, damit die nächste Session nicht dieselbe
Diagnose noch einmal stellt.

---

## Der Kernbefund

**43 von 48 Remote-Branches waren nicht in `main`.**

Der Verbesserer-Agent läuft täglich um 10:17, findet Fehler, behebt sie sauber
und legt für jede Idee einen neuen Branch an. Einen Pull Request kann er nicht
erstellen, weil seit Wochen der `gh`-Auth-Blocker (#139) offen ist. Also blieb
alles liegen. Und weil er weder `main` noch seine eigenen älteren Branches
ansah, fand er dieselben Fehler immer wieder neu:

| Fehler | Wie oft neu „entdeckt" |
|---|---|
| TTS-Fallback `NameError` | 3× (Juli, August, August) |
| `social-publish` maxDuration 60→120 s | 3× |
| impact-Deckel im Prompt | 5×, vier davon an derselben Zeile |

Fünf konkurrierende Deckel an einer Prompt-Zeile heißen: garantierter Konflikt,
egal wer zuerst merged. Deshalb lief der Wirkungsindex sieben Wochen ohne jede
dieser Bremsen.

---

## Was behoben wurde

### 1. Der Wächter war selbst blind

`ops/run/healthcheck.sh` prüfte, ob etwas **produziert** wird (Stories, Reels,
Agentenläufe), nie ob es **ankommt**. Ergebnis am 02.09.: Stories und Newsletter
liefen täglich weiter, während Instagram vier und TikTok sechs Tage still
standen. 24 Entwürfe stapelten sich. Niemand merkte es, weil ein liegen
gebliebener Entwurf in der Datenbank genauso aussieht wie einer, der gleich
rausgeht.

Neu: Alarm bei Instagram > 2 Tage ohne Post, TikTok > 4 Tage, mehr als 3
gestapelte Entwürfe.

### 2. Der Wächter konnte nicht einmal starten

`healthcheck.sh` und `reel-watchdog.sh` hatten `ROOT="/home/aaron/NurEine"`
hartkodiert, während `agent.sh`, `trigger.sh`, `pyjob.sh` und `selfupdate.sh`
den Pfad aus `BASH_SOURCE` ableiten. Stimmt der Pfad nicht, bricht
`cd "$ROOT" || exit 1` ab, **bevor** eine Prüfung läuft — und weil der Abbruch
vor dem Mail-Block liegt, kommt keine Mail.

In einem Werkzeug, dessen Konzept „Stille heißt alles gut" ist, sieht der
eigene Ausfall exakt wie ein gesundes System aus.

### 3. Threads postete ins Leere

`threads.ts` setzte `hook_type: 'hook'` — ein Wert, den der CHECK aus Migration
`00022` nicht erlaubt. Der Insert warf, und ein gemeinsamer `catch` über Posten
**und** Protokollieren fing ihn ab. Folge: Der Post war längst draußen, wurde
nie gespeichert, und der Cron meldete ihn als fehlgeschlagen.

Belegt: **0 Threads-Zeilen** in `nureine_social_posts`, obwohl der Job seit
Wochen läuft. Jetzt getrennte `try`-Blöcke.

### 4. Die Hook-Rotation war eine Illusion

`queue.ts` schrieb `hook_type` aus einer Zahl-im-Titel-Heuristik statt aus der
echten Rotationswahl. Die Heuristik griff bei fast jedem Titel.

Belegt: **80 von 90 Instagram-Posts als `'zahl'`** (89 %). Die gesamte
A/B-Historie und die Recency-Penalty in `selectInstagramStory` waren dadurch
wertlos. Migration `00050` weitet den CHECK auf die echte Sechser-Achse.

### 5. Ausfälle meldeten sich als Erfolg

`load_active_sources()` gab bei einem Supabase-Fehler ein leeres `[]` zurück —
ununterscheidbar von „keine Quellen konfiguriert" — und der Lauf meldete
`completed`. So stand der Fetch vom 15.–17.07. drei Tage still, ohne eine
einzige Fehlerzeile.

Jetzt: Der JSON-Fallback bleibt (er überbrückt eine 402-Sperre), aber das Log
sagt ausdrücklich **NOTBETRIEB**. Ohne Fallback fliegt `SourceLoadError` und
der Lauf landet als `failed` in `nureine_cron_runs`.

### 6. Die Dokumente logen

- **`CLAUDE.md`** nannte einen Cron-Plan mit einem Workflow `select-hero.yml`,
  den es nie gab, und Newsletter 04:20, obwohl der Worker seit dem 22.07. um
  04:40 feuert. Das ist die Datei, die **jede** Session zuerst liest. Sie nennt
  jetzt keine Uhrzeiten mehr, sondern verweist auf `ops/crontab.txt`.
- **`ARCHITECTURE.md`** war laut `CLAUDE.md` Pflichtlektüre und beschreibt
  Gemini, Resend und `select_hero.py`. Alle drei kommen in **null** Dateien des
  Projekts vor. Jetzt mit Warnhinweis, nicht mehr Pflichtlektüre.
- **`/admin/vision`** war auf Vercel dauerhaft kaputt: Git verfolgt `VISION.md`,
  auf der Platte liegt `vision.md`. Auf einem case-insensitiven Mac-Volume
  fällt das nie auf, auf Linux schon. Der Loader probiert jetzt beide.

### 7. Der Agent prüft jetzt auf Dubletten

`ops/prompts/verbesserer.md` hat einen neuen Pflichtschritt **vor** jedem neuen
Branch: `git fetch --all`, offene Branches ansehen, `git log --all --grep`
nach dem Stichwort, und die Historie der Datei prüfen. Drei mögliche Ergebnisse
(in main erledigt / liegt auf einem Branch / berührt dieselbe Stelle) mit klarer
Handlungsanweisung. Dazu die Regel, den wachsenden Branch-Stapel zu melden.

---

## Zwei Regeln, die daraus folgen

**1. Eine Wahrheit pro Sache.** Der Cron-Plan stand in `CLAUDE.md`, in
`ops/crontab.txt`, in `GROWTH.md` und in 15 Workflow-Dateien. Vier Quellen
driften garantiert auseinander. Jetzt zeigt jede Stelle auf `ops/crontab.txt`.
Dasselbe gilt für Schwellenwerte: Sie stehen an neun Orten verstreut (45, 55,
60, 65, 70, 75, 80, 85) und die Doku widerspricht dem Code (70 gegen 65). Das
ist noch offen.

**2. Ein Fallback muss laut sein.** Jeder stille Ausfall in dieser Liste hatte
dieselbe Form: Etwas ging schief, ein Fallback fing es auf, und niemand erfuhr
davon. Ein Fallback darf einen Ausfall überbrücken — er darf ihn nie
verstecken.

---

## Was noch offen ist

| Thema | Warum es wartet |
|---|---|
| 29 ungemergte Branches | Einzeln zu sichten, mehrere berühren dieselbe Prompt-Zeile |
| Fünf impact-Deckel | Gehören als **ein** Regelblock in einen Commit, sonst Konflikte |
| Doppelte Migrationsnummern (00016, 00047, 00048) | Reihenfolge ist alphabetisch, DB-Neuaufbau nicht reproduzierbar |
| Schwellenwerte zentralisieren | `src/lib/thresholds.ts` + Python-Pendant |
| 7 tote Python-Skripte, 1 tote TS-Datei | Aufräumen, wenn nichts Dringenderes ansteht |
| Instagram steht seit 29.08. | Verdacht: abgelaufener Token. Braucht Vercel-Logs |
| `gh`-Auth-Blocker #139 | Ursache dafür, dass Agenten-Arbeit liegen bleibt |

**Vor jedem Löschen von Branches prüfen:** `sicherung-vor-merge-2026-08-03`
(„21 fehlende Funktionen aus Merge-Konflikt wiederherstellen") und
`fix/restore-fetch-stories-functions-board125` belegen zusammen mit dem
Kommentar in `healthcheck.sh` („main war 2 Wochen kaputt — 1140 Zeilen aus
fetch_stories.py gelöscht") einen früheren Datenverlust. Diese Branches nicht
anfassen, bevor bestätigt ist, dass alle Funktionen heute in `main` sind.
