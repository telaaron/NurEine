# .agent-spool — geparkte Arbeit (Fallback, wenn Supabase hakt)

Wenn Storage (402/Quota) oder DB nicht erreichbar sind, legen die Agenten ihre
**fertige** Arbeit hier ab, statt sie zu verlieren. Nachgetragen wird später mit
`scripts/spool_flush.py --apply` (erst nach `scripts/purge_storage.py --apply`,
sonst re-lockt das Storage-Cap sofort — siehe Team-Board).

## Verzeichnisse

- `bilder/` — fertige, komprimierte JPEGs (<150 KB) + gleichnamige `.json` (Ziel).
- `sql/`   — idempotente `.sql` (INSERT/UPDATE), Dateiname mit Zeitstempel = Reihenfolge.
- `texte/` — Rohtexte/Entwürfe als Backup (optional, wenn DB weg war).

## Schema `bilder/<datum>_<slug>.json`

Jede JPEG braucht eine gleichnamige `.json`, sonst ist die Datei wertlos —
der Nachtrag weiß sonst nicht, wohin sie gehört. Exaktes Schema:

```json
{
  "bucket": "story_images",
  "path": "story-images/<slug40>-<hex12>.jpg",
  "content_type": "image/jpeg",
  "public_url": "https://<proj>.supabase.co/storage/v1/object/public/story_images/story-images/<slug40>-<hex12>.jpg",
  "local_file": ".agent-spool/bilder/<datum>_<slug>.jpg",
  "db": { "table": "nureine_stories", "id": "<uuid>", "column": "image_url" },
  "created_by": "<agent>",
  "created_at": "<iso8601>Z",
  "note": "<kurz: was + Qualitätsvermerk>"
}
```

## Nachtrag (spool_flush.py, sobald Storage wieder läuft)

1. `bilder/*.json` einlesen.
2. JPEG per Storage-REST hochladen: `POST /storage/v1/object/<bucket>/<path>`
   (Header `apikey`+`Authorization: Bearer <SERVICE_KEY>`,
   `Content-Type: image/jpeg`, `x-upsert: true`).
3. Bei Erfolg: `UPDATE <db.table> SET <db.column>='<public_url>' WHERE id='<db.id>'`.
4. `sql/*.sql` in Dateinamen-Reihenfolge (Zeitstempel) anwenden — sind idempotent
   (INSERT ... WHERE NOT EXISTS).
5. Erledigte Dateien nach `bilder/_done/` bzw. `sql/_done/` verschieben.
6. Offene `uebergabe`-Einträge auf dem Team-Board auflösen (`resolved=true`).

## Regel

Nur **geprüfte, komprimierte** Ergebnisse parken. Der Nachtrag lädt nur hoch —
er prüft nicht nach.
