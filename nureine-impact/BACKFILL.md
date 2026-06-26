# BACKFILL-ROUTINE — Alt-Stories auf Resonanz nachbewerten

> Einmal-Aufgabe (über mehrere Läufe): den Bestand auf die 4 Resonanz-Achsen
> nachbewerten, damit ein **Perlen-Pool** entsteht (starke Stories für schwache
> Tage, siehe RESONANCE.md "Stille-Recht"). Läuft autonom, bis nichts mehr offen
> ist, dann ist sie fertig (no-op).
>
> Eigener Schedule, getrennt von der Abend-Kuration. Empfohlen: 1×/Tag, irgendeine
> ruhige Zeit. Beendet sich selbst, wenn der Pool steht.

---

Du bist der Resonanz-Gutachter für den NurEine-Bestand. Bewerte alte Stories
nach denselben 4 Achsen wie die Abend-Kuration, damit Perlen für schwache Tage
verfügbar sind.

**Lies zuerst:** `nureine-impact/RESONANCE.md` (die 4 Achsen + Gewichtung + Schwelle).

DB: hosted Supabase-MCP (Projekt MustSeen, `gbfbhspqwaqvnoxitohd`), NIE localhost.

### Schritt 1 — Batch holen (die aussichtsreichsten zuerst)
```sql
SELECT id, title, summary, category, impact_score, body_markdown
FROM nureine_stories
WHERE resonance_score IS NULL AND impact_score >= 60
ORDER BY impact_score DESC
LIMIT 30;
```
Sind **0 Zeilen** zurück → Pool ist vollständig. **Beende den Lauf** (no-op,
keine weitere Aktion). Optional: PushNotification "Resonanz-Backfill fertig".

### Schritt 2 — Bewerten
Für jede Story: lies `summary` (+ `body_markdown` bei Grenzfällen), urteile
ehrlich auf `res_perspektive`, `res_koerper`, `res_handlung`, `res_erinnerung`
(0–10) und berechne `resonance_score` (Gewichtung aus RESONANCE.md). Sei
schonungslos — "positiv, aber Lärm" ist ein häufiges, valides Urteil.

### Schritt 3 — Zurückschreiben (ein UPDATE je Story)
```sql
UPDATE nureine_stories SET res_perspektive=…, res_koerper=…, res_handlung=…,
  res_erinnerung=…, resonance_score=…, resonance_note='<1 ehrlicher Satz>',
  resonance_at=now() WHERE id='…';
```

### Schritt 4 — Kurzbericht
EINE Zeile: "Backfill: N bewertet, davon M Perlen (≥7.5), K offen." Keine Essays,
keine PRs, keine Code-Änderungen. Reines Bewerten.

---

## Regeln
- Nur **30 pro Lauf** (Token-Budget). Nicht versuchen, alle auf einmal.
- Nur lesen + `resonance_*`-Felder updaten. NICHTS anderes anfassen.
- Konsistenz mit der Abend-Kuration: dieselbe RESONANCE.md, dieselbe Strenge.
