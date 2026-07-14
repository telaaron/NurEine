# App-Neuerfindung — Prototyp-Quellen

Roh-Quellen der klickbaren HTML-Prototypen für die NurEine-App-Neuerfindung
(Phase 2). **Kontext & Rolle: siehe `../APP_NEUERFINDUNG_HANDOVER.md`.**

Diese Dateien werden NICHT von der App gebaut/deployt — sie sind Prototypen fürs
Artifact-Publishing (Design-Abnahme mit Aaron). Persistente Kopie hier, weil der
Session-Scratchpad geleert werden kann.

## Dateien
- `build.py` — macht eine Roh-Quelle Artifact-tauglich: bettet Marken-Fonts base64 ein
  (`remotion/public/fonts/`, Pfad hartkodiert) und macht die Datei rein ASCII
  (HTML→`&#NNN;`, `<script>`→`\uXXXX`, damit Emoji/Umlaute im Artifact ohne charset
  korrekt rendern).
- `exp2-kurve.raw.html` — Experiment 2 „Der Kurven-Tag" (Typ-2-Ausgabe: Kurve läuft
  1990→heute, Zahl fällt mit). Enthält den robusten `animate()`-Helfer (setInterval-
  basiert, überlebt rAF-Throttling). **Publiziert** (URL im Handover §6).
- `exp3-onboarding.raw.html` — Experiment 3 „Tag 1" (Onboarding, 7 Beats: Frage→Magic
  Moment→sichtbare Arbeit→Wenn-Dann-Anker→3 geschenkte Lichter→Push-Bitte→Abschluss).
  Themen- und Anker-Wahl personalisieren den Flow. **Publiziert** (URL im Handover §6).

## Bauen
```
python3 docs/app-prototypes/build.py \
  docs/app-prototypes/<exp>.raw.html \
  <ziel>/<exp>.html
```
Dann die gebaute Datei per `Artifact`-Tool veröffentlichen (`favicon:"🌅"`).

## Status
Alle drei Experimente sind gebaut, verifiziert und publiziert (Art. 4/5/6, Handover §6).
- `exp1-morgen` (Morgen-Flow): publiziert, Roh-Quelle ging beim Scratchpad-Leeren
  verloren (Inhalt in Session-Historie) — nur Exp2+Exp3 haben Roh-Quellen hier.
- Nächster Schritt: Aarons Abnahme, dann Phase 3 (echte App). Siehe Handover §7.
