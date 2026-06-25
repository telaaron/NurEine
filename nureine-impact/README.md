# nureine-impact — Tägliche Hoffnungs-Impact-Routine

Ein selbst-iterierender Morgen-Loop, der den heutigen NurEine-Content (Feed,
Instagram, E-Mail, Design) **schonungslos aus Nutzersicht** auf emotionalen
Impact bewertet, die EINE strukturelle Top-Änderung umsetzt (PR), und am
nächsten Morgen prüft, ob sie an echten Zahlen gewirkt hat.

## Dateien

| Datei | Rolle | Ändert sich |
|---|---|---|
| `CONSTITUTION.md` | Ton, Score-Achsen, Datenquellen, Regeln. Wird 1× pro Lauf gelesen (gecacht). | selten |
| `ROUTINE.md` | Der kurze Prompt, den der Schedule-Agent ausführt. | selten |
| `state.json` | Gedächtnis: Score-Historie (30 Tage) + offene/letzte Hypothesen. | täglich (committet) |
| `log/YYYY-MM-DD.md` | Knapper Tages-Report. | täglich |

Dashboard: **`/admin/impact`** (liest `state.json`).

## Warum das token-effizient ist

- Stabiler Kontext (Ton, Pfade, Tabellennamen) liegt EINMAL in `CONSTITUTION.md`
  → die Routine durchsucht nie den Code, um Quellen zu finden.
- Bewertet **strukturierte DB-Zeilen von heute**, nicht Volltext-Quellcode.
- Output = Zahlen + 1 Root-Cause + 1 Änderung. Keine Essays, keine 3× redundante
  Perspektiven-Prosa.
- Ein Screenshot, eine Top-Änderung pro Lauf.

## Einrichten als täglicher Cloud-Lauf

Per Claude-Code `/schedule` (gehosteter Cron-Agent). Empfohlene Zeit: **nach**
den Morgen-Crons, die den Content erzeugen — Story-Fetch 06:00 UTC,
Social-Generate 06:15, Highlight-Mail 06:30. Also z.B. **07:00 UTC täglich**.

Prompt für den Schedule-Agent (verweist nur auf ROUTINE.md → minimaler Prompt):

> Führe die tägliche Impact-Routine für NurEine aus. Befolge exakt
> `nureine-impact/ROUTINE.md`. Lies zuerst CONSTITUTION.md + state.json,
> dann die 5 Schritte. Die eine Top-Änderung wird — nach grünem
> svelte-check + build (Gate, §6) — direkt auf `main` gepusht, mit
> state.json + Log im selben Commit. Verworfene Vortags-Hypothesen
> werden per `git revert` automatisch zurückgenommen.

## Erfolg messen (Hybrid-Signal)

Hypothesen werden an echten Zahlen geprüft, wo vorhanden:
`nureine_social_posts.saves/reach`, `newsletter_sends.opened`,
`nureine_events` (story_read / cta_click / share / newsletter_signup).
Wo Daten noch unreif sind: markierter Selbst-Score (bestätigt eine Hypothese
NICHT allein). Siehe `CONSTITUTION.md §4`.
