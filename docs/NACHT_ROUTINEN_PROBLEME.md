# NurEine — Probleme aus den Nacht-Routinen (Stand 2026-07-12)

Alle Läufe der letzten 3 Nächte liefen technisch mit `status: ok` durch — es gab
**keine Abstürze**. Die „Probleme" sind (A) ein struktureller Timing-Fehler,
(B) externe Blocker, die nur Aaron lösen kann, und (C) inhaltliche Befunde der
Agenten (offene Verbesserungs-Ideen). Zusammengetragen aus `nureine_ai_runs` +
`nureine_improvements`.

---

## A. STRUKTURELL — Reihenfolge/Timing kaputt (das dringendste, selbst behebbar)

**A1 — Kontingent-Aushunger:** Alle Nacht-Routinen liefen 01:15–03:16 Uhr. Wenn
Aaron am Vorabend einen großen Prompt schickt, ist das Claude-Kontingent nachts
leer → die Routinen laufen gar nicht (0 Nacht-Läufe messbar), holen erst am
Vormittag nach. → **Fix: alle Zeiten nach 03:00 legen, gestaffelt (s.u.).**

**A2 — Timing-Race Chefredakteur → Veredler/Bild-Regie:** Der Veredler (02:46)
und die Bild-Regie (03:16) liefen VOR dem Chefredakteur (der intern 02:04 UTC =
04:04 lokal ansetzte, also nach ihnen). Folge in 2 Nächten:
- Veredler fand „keine approved Perlen" → veredelte nur Notnagel-Nicht-Perlen.
- Bild-Regie fand „keine approved Perlen" → **bebilderte NICHTS**, die Tages-Perle
  blieb auf `status=proposed` mit altem Paper-Collage-Bild.
→ **Fix: strikte Kette Fetch → Chefredakteur → Veredler → Bild-Regie mit genug
Abstand, alle nach 03:00.**

---

## B. EXTERN BLOCKIERT — nur Aaron kann das lösen

**B1 — IG-Insights-Scope fehlt (#6, Prio 1):** Graph gibt `(#10) Application does
not have permission`. Der Code ist fertig (504-Timeout behoben, shares-Spalte,
Story/Feed-Metriken), aber ohne den Scope `instagram_manage_insights` bleibt die
Leitmetrik shares/reach blind. → Aaron: Scope im Meta Graph API Explorer holen,
Long-Lived-Token in Vercel setzen. (In Arbeit — Aaron gerade dabei.)

**B2 — Newsletter-Öffnungstracking wirkungslos (#5):** Der Verbesserer hat den
Brevo-Webhook-Fix umgesetzt (PR #5), aber die Öffnungsrate ist weiter 0/583. Fix
wirkte nicht (PR nicht gemergt ODER Webhook liefert keine opened-Events). →
Prüfen: ist PR #5 gemergt/deployed? Kommen Brevo-`opened`-Events überhaupt an?

---

## C. INHALTLICHE BEFUNDE — offene Verbesserungs-Ideen der Agenten

**Prio 1:**
- **#15 — 3-Stufen-Qualitätsgate war nicht produktiv:** Analyst meldete, das Gate
  sei nur uncommittet. INZWISCHEN committet+deployed (2026-07-12) → sollte beim
  nächsten Fetch greifen. Verifizieren, dann #15 schließen.
- **#10 — Feed verschwendet 36% auf die 2 schwächsten Kategorien** (wissenschaft
  + innovation floppen bei Engagement, kriegen aber 46% der Slots). → Feed-Auswahl
  soll gesundheit/tiere/gemeinschaft bevorzugen.

**Prio 2:**
- **#7/#16 — Hook-Monokultur:** 99% der IG-Posts sind Zahl-Hooks. Zahl trägt zwar
  100% des Engagements, aber Rotation fehlt völlig (Reichweiten-Risiko).
- **#2/#8/#13/#14/#17 — Kuriositäts-Quellen:** ScienceDaily Tech, Spektrum
  Wissenschaft, Astro-/Quanten-Quellen liefern systematisch Sub-55-Kuriosität.
  Härter vorfiltern / drosseln.
- **#3 — DeepSeek-Vorfilter überbewertet Wissenschafts-Kuriosität** (Restbestand,
  soweit DeepSeek noch im Vorfilter läuft).
- **#4 — Semantische Dubletten-Erkennung** (Embeddings statt reiner Titel-
  Überlappung) — würde die verbleibenden Doppel-Stories fangen.
- **#18 — Frisch-Batches sind DACH-fern und dünn:** kaum eine Story mit direktem
  Deutschland-/DACH-Bezug. Quellen-Mix um DACH-Quellen erweitern.

**Prio 3:**
- **#9 — Vorfilter verwechselt „wissenschaftlich interessant" mit „relevant".**
- **#11 — Null-Perlen-Quellen** (Berliner Zeitung, WHO, Perspective, Yale liefern
  0% starke Stories trotz Volumen) → prunen.

---

## Was NICHT das Problem war
- Kein Agent ist abgestürzt. Keine Datenkorruption. Keine Duplikate erzeugt.
- Bild-Regie funktioniert (hat in einer Nacht beide Perlen mit echtem Seedream
  neu bebildert, Paper-Collage ersetzt) — sie lief nur einmal ins Timing-Race.
