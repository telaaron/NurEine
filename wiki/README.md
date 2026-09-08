# NurEine Firmen-Wiki

**Einzige Wahrheit für den CEO-Agenten und alle Subagents.** Wiki schlägt Chat.
Was hier nicht steht, ist nicht bekannt. Was hier steht und nicht stimmt, wird
korrigiert — nicht umgangen.

## Leseordnung (jede Session, in dieser Reihenfolge)

1. `wiki/00-LAGE.md` — Ist-Zustand, Kennzahlen, Risiken, nächster Zug (datiert)
2. `VISION.md` Abschnitt 1, 13, 17 — Zielbild und getroffene Entscheidungen
3. `wiki/REBUILD-PLAN.md` — was gekillt, übernommen, neu gebaut wird
4. `wiki/HUMAN-TODO.md` — was nur Aaron kann
5. `wiki/inventar/` — Rohbestand (nur bei Bedarf, nicht jede Session)

## Regeln

- **Eine Wahrheit pro Sache.** Ein Fakt steht an genau einer Stelle; andere Stellen verweisen.
- **Datiert.** Jede Zahl, jeder Status trägt ein Datum. Ohne Datum ist es eine Vermutung.
- **Verifiziert, nicht überliefert.** Ein Status („läuft", „tot") gilt nur mit Beleg
  (Log, Commit, Abfrage). Lehre vom 2026-09-08: die Aussage „18 Cronjobs nie
  installiert" stand in 6 Dokumenten und war falsch — auf der falschen Maschine geprüft.
- **Entscheidungen** stehen in `VISION.md` Abschnitt 13 (D-xx / E-xx). Das Wiki
  wiederholt sie nicht, es verweist.
- **Human-TODO** steht nur in `wiki/HUMAN-TODO.md`. Nirgends sonst.
- **Patches nachvollziehbar:** Änderung = Commit mit Datum im Text.
- **Alte Dokumente** (Root-`*.md` außer VISION/CLAUDE/README, `docs/*`) sind
  **Steinbruch, kein Gesetz**. Ihre Bewertung steht in `wiki/inventar/docs.md`.

## Struktur

```
wiki/
  README.md          — diese Datei
  00-LAGE.md         — CEO-Lagebild (wird bei jedem Neustart aktualisiert)
  REBUILD-PLAN.md    — Kill / Übernehmen / Neu + offene Entscheidungen
  HUMAN-TODO.md      — der eine Ort für Aarons Aufgaben
  inventar/
    technik.md       — Rohinventar Code, Cron, Dienste (2026-09-08)
    docs.md          — Rohinventar Dokumente (2026-09-08)
```

Geplant, sobald der Rebuild beschlossen ist: je eine Seite pro Funktion /
Pipeline / Datenobjekt mit Zweck · Status · Code-Verweis · Abhängigkeiten ·
Secrets · Qualitätsregeln · letzte Entscheidung.
