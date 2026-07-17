# Agenten-Spool — die lokale Zwischenablage

**Zweck:** Wenn Supabase hakt (Quota, Sperre, offline), sollen die Agenten
**weiterarbeiten** statt abzubrechen. Sie legen ihr fertiges Ergebnis hier ab.
Sobald Supabase wieder läuft, trägt der Nachtrag-Lauf alles nach.

> Merksatz: **Die Arbeit ist getan — nur die Ablage fehlt noch.**
> Ein Blocker darf einen Lauf verzögern, nicht vernichten.

Anlass: 2026-07-16 sperrte Supabase das Projekt (Egress+Storage-Quota). Die
Redaktion konnte nicht bebildern und lief mehrere Nächte leer — die Arbeit war
schlicht weg. Das darf nicht wieder passieren.

---

## Struktur

```
.agent-spool/
├── bilder/     Fertige, KOMPRIMIERTE Bilder + je eine .json mit dem Ziel
├── texte/      Veredelte Texte, wenn nicht mal die DB erreichbar ist
├── videos/     Gerenderte Reels/TikTok-MP4s, die nicht hochgeladen werden konnten
├── sql/        Nicht ausführbare DB-Änderungen als .sql (wenn die DB weg ist)
└── _erledigt/  Nachgetragenes wandert hierher (nicht löschen — Nachweis)
```

## Regeln

1. **Ein Paar pro Ergebnis**: die Datei + eine gleichnamige `.json` mit dem Ziel.
   Ohne die `.json` weiß der Nachtrag nicht, wohin damit.
2. **Fertig heißt fertig**: Was hier liegt, ist geprüft und komprimiert
   (Bilder <150 KB via `scripts/image_utils.py::encode_story_image()`).
   Der Nachtrag lädt nur hoch — er prüft und rechnet nicht nach.
3. **Nach dem Nachtragen** → Dateipaar nach `_erledigt/` verschieben, nicht löschen.
4. **Immer aufs Team-Board**: Wer hier parkt, schreibt einen `uebergabe`-Eintrag
   (`for_agent='nachtrag'`), damit niemand die Arbeit übersieht.

## Format der `.json` (das Ziel)

```jsonc
// bilder/2026-07-17_fisch-im-reisfeld.json
{
  "typ": "bild",                       // bild | video | text | sql
  "erstellt": "2026-07-17T04:20:00+02:00",
  "agent": "redaktion",
  "grund": "Storage 402 (Quota-Sperre bis ~20.07.)",
  "datei": "2026-07-17_fisch-im-reisfeld.jpg",

  // Wohin beim Nachtragen:
  "bucket": "story_images",
  "pfad": "story-images/fisch-im-reisfeld-a1b2c3d4e5f6.jpg",
  "content_type": "image/jpeg",

  // Was danach in der DB gesetzt wird (die öffentliche URL kennt erst der Nachtrag):
  "db": {
    "tabelle": "nureine_stories",
    "id": "0b4c673f-fdad-446e-8ca6-499951b79cfc",
    "spalte": "image_url"
  }
}
```

Für `typ: "sql"` reicht die `.sql`-Datei mit einem Kommentarkopf (Agent, Grund,
Datum) — der Nachtrag führt sie in Reihenfolge des Dateinamens aus.

## Nachtragen (wenn Supabase wieder läuft)

```bash
python3 scripts/spool_flush.py            # Trockenlauf: zeigt, was anliegt
python3 scripts/spool_flush.py --apply    # lädt hoch, setzt DB, räumt nach _erledigt/
```
