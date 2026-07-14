# ops/prompts/ — die Agenten-Prompts

Hier liegt je Claude-Agenten-Routine eine Markdown-Datei mit dem **exakten Prompt**,
den `ops/run/agent.sh <name>` per `claude -p` ausführt.

## WICHTIG: 1:1 aus den heutigen Scheduled-Tasks übernehmen

Die Prompts der aktuell laufenden Routinen leben im Claude-Code-Scheduled-Tasks-Store
auf Aarons MacBook — **nicht** im Repo. Damit die Routinen auf dem Mini identisch
arbeiten, müssen die Original-Prompts hier eingetragen werden:

1. In der Claude-Code-App auf dem MacBook die Scheduled Tasks / Routinen öffnen.
2. Je Routine den Prompt-Text kopieren.
3. In die passende Datei unten einfügen (die Platzhalter ersetzen).

## Erwartete Dateien

| Datei | Routine | Heutige Zeit |
|---|---|---|
| `analyst.md` | Analyst — IG/Newsletter-Metriken auswerten → nureine_improvements | ~01:33 |
| `fetch.md` | Fetch-Analyse — Stories bewerten (fetch_stories.py --export/--import) | ~01:15 |
| `chefredakteur.md` | Chefredakteur — neu bewerten, Tages-Perlen wählen | ~02:04 |
| `veredler.md` | Story-Veredler — Perlen-Felder ausformulieren | ~02:46 |
| `bildregie.md` | Bild-Regie — fal.ai-Prompt + Bild + Vision-QA | ~03:16 |
| `verbesserer.md` | Verbesserer — Code-Verbesserungen umsetzen (PR/Commit) | wenn Mac an |

Reel-/TikTok-Regie ist gesondert (`ops/run/reel.sh`, ruft render.mjs) — sie ist
weniger ein reiner Prompt als eine Kommando-Kette (siehe docs/REEL_BAUKASTEN.md).

> Solange eine Datei nur den Platzhalter enthält, bricht `agent.sh` bewusst ab
> (kein Blindlauf mit falschem Prompt).
