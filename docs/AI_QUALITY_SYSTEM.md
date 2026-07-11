# NurEine — KI-Qualitätssystem (DeepSeek → Claude, selbstlernend)

**Ziel (Aaron, 2026-07-07):** Maximaler Mehrwert & Qualität. Keine Storys mehr,
die keinen interessieren. Relevante Bilder. Beste Modelle für den besten Content.
Alles läuft autonom, nachts; Aaron schaut nur im Dashboard nach. Ein Layer findet
laufend heraus, was besser werden muss → das Produkt lernt über die Zeit.

Dieses Dokument ist der Bauplan. Status-Spalte zeigt, was schon steht.

---

## 0. Drei-Stufen-Qualitätsmodell (Aaron 2026-07-10) — die oberste Regel

Weniger, aber konsequent. Reihenfolge der Abstufungen:

| Stufe | Schwelle | Was passiert | Menge/Tag (real, 14d) |
|---|---|---|---|
| **① raus** | Wirkungsindex **< 55** | Wird beim Fetch **gar nicht** aufgenommen (`STORY_MIN_IMPACT=55` in `scripts/fetch_stories.py`, Stage 4b, decision `rejected_impact`). | schneidet ~9/Tag weg |
| **② rein, ohne Bild** | **55 – unter Perle** | Steht in DB/Archiv/Feed, **kein** KI-Bild → redaktionelle **Typo-Karte** (Kategorie-Ton + Kategoriewort als Rubrik-Motiv, Headline im Body). KEIN Emoji, KEIN Kategorie-Stockfoto (Aaron 2026-07-10). | ~10–12/Tag |
| **③ rein + bebildern** | **Tages-Perlen des Chefredakteurs** | Premium-Seedream-Bild via **Bild-Regie-Routine** (nachts, `nureine_curation_queue` approved, ~3–6/Tag). „Immer die relativ besten des Tages", egal ob impact 74 oder 82. | ~2–4 Bilder/Tag |

**Konsequenzen im Code:**
- Der **Fetch bebildert NICHT mehr** (`IMAGE_GATE_MIN_IMPACT=101`, `IMAGE_GATE_INCLUDE_IG_OK=False`) — die Perlen-Routine ist die *einzige* Bildquelle. fal.ai-Kosten: ~18 Bilder/Tag → ~2–4/Tag.
- Eine **IG-Story ohne echtes Bild wird nicht gepostet** (`publishStoryDue`-Gate) → nur bebilderte Perlen erreichen IG. Alles kohärent: ① Aufnahme, ② Bestand, ③ Bühne.

---

## 1. Wo heute KI steckt (Ist-Zustand, kartiert 2026-07-07)

**Text-LLM = überall DeepSeek `deepseek-chat`.** Ein einziger Mega-Call in
`scripts/fetch_stories.py` (`ANALYSIS_PROMPT_TEMPLATE`, ~350 Zeilen) erzeugt in
EINEM Aufruf praktisch alle kundensichtbaren Felder einer Story:
`title, subtitle, summary, body, category, sensitive, region, image_prompt,
impact_score (+reach/durability/evidence), impact_explainer, share_hook,
kid_*, emotion, ig_ok, ig_hook_type, dach_relevanz, ig_hook, slides, ig_caption,
wa_ok, wa_opener`. → Tabelle `nureine_stories`.

Weitere DeepSeek-Stellen:
- `scripts/image_quality.py` — Prompt-Review (Text) vor FLUX + Regenerierung.
- `scripts/fetch_worldbank.py` — baut Stories aus Weltbank-Daten.
- Backfill/Rescore-Skripte (`backfill_social.mjs`, `backfill_breakdown.mjs`,
  `regenerate_drafts.mjs`, `rescore_impact.mjs`, `backfill_images.py`, …).
- `src/lib/server/social/comments.ts` — IG-Kommentar-Antworten (Human-in-loop).

**Bild = fal.ai FLUX.1 [pro]** (Prompt kommt aus dem DeepSeek-Call),
**Bild-QA = fal.ai LLaVA-NeXT** (altes Vision-Modell, fällt bei Timeout still auf
„akzeptiert" zurück). **TTS = ElevenLabs** (Story-Audio) + **edge-tts** (Reels).

**Regelbasiert (kein LLM), aber Qualitäts-relevant:**
- `src/lib/server/social/caption.ts` — Captions/Hooks schematisch.
- `src/lib/server/newsletter.ts` — Betreff = `share_hook`, Inhalt = Template,
  keine echte Personalisierung.
- `src/lib/server/queries.ts::selectInstagramStory` — Heuristik über Stopp-Kraft.

**Kernbefund (DB-Analyse):** Die Auswahl belohnt Wissenschafts-Kuriosität
(„Quantenkristall", „Komet älter als die Sonne", „Deos ohne Aluminium") statt
menschlicher Relevanz. Der größte Hebel ist die **Bewertung/Auswahl**, nicht die
Aufbereitung. Score-Inflation ist bekannt (deshalb existiert `rescore_impact.mjs`).

**Vorhandene Selbstlern-Bausteine:** `nureine_source_quality` (Quellen-Perlenrate),
`nureine_curation_queue` (Freigabe-Queue, von der bisherigen „Regie" gespeist),
`resonance_score` an Stories, Admin-Cockpits (`/admin/redaktion`, `/kosten`,
`/impact`, `/social`).

---

## 2. Zielarchitektur — drei Ebenen

### Ebene A — Cloud-Routinen (online, laufen IMMER, unabhängig vom Mac)
Alles, was nur Online-Dienste nutzt (Supabase-DB, fal.ai, IG-/Brevo-APIs) und
KEINEN Repo-Code ändert. Laufen nachts als Claude-Cloud-Agents (`/schedule`).
Sie **veredeln Daten in der DB** und steuern Online-Aktionen — sie committen nie.

### Ebene B — Lokale Routinen (brauchen den Mac / das Repo)
Alles, was Repo-Code liest/ändert/committet: der **Verbesserungs-Agent** und das
Ausführen essentieller Code-Verbesserungen. Laufen, wenn der Mac an ist; verpasste
Läufe holen nach. Sie erzeugen PRs/Commits + tracken, ob eine Änderung gewirkt hat.

### Ebene C — Selbstlern-Layer (verbindet A & B)
Eine Feedback-Schleife: Performance-Daten (IG-Insights, Newsletter-Öffnungen,
Klicks, `resonance_score`) → Analyse → konkrete Verbesserungs-Vorschläge →
Tracking, ob der Vorschlag die Metrik verbessert hat → nächste Iteration.
Persistiert in neuen Tabellen `nureine_ai_runs` (jeder Agentenlauf) und
`nureine_improvements` (Vorschlag → umgesetzt? → Wirkung gemessen?).

---

## 3. Die Agenten (orchestriert)

| # | Agent | Ebene | Cron (nachts, CEST) | Aufgabe | Modell-Staffelung |
|---|---|---|---|---|---|
| 1 | **Chefredakteur** | A Cloud | täglich ~02:00 | Neue Stories der letzten 24h neu bewerten: „berührt das echte Menschen?" → `resonance_score` + kalibrierter `impact_score` + `ig_ok`. Score-Inflation raus. Wählt die Tages-Perlen in `nureine_curation_queue`. | Haiku Vorfilter Masse → Sonnet/Opus Feinurteil Top-N |
| 2 | **Story-Veredler** | A Cloud | täglich ~02:30 | Nur für die ausgewählten Perlen: `summary`, `share_hook`, `slides`, `ig_hook`, `ig_caption`, Newsletter-Betreff perfekt ausformulieren (Premium-Ton). | Sonnet, Opus für Hero |
| 3 | **Bild-Regie** | A Cloud | täglich ~03:00 | Für Perlen: prägnanten Motiv-Bild-Prompt bauen (Abstraktion statt wörtlich), FLUX pro auslösen, Ergebnis mit modernem Vision-Urteil abnehmen, sonst neu. | Opus (Prompt) + Vision-QA |
| 4 | **Reel-Regie** | A Cloud | Mo/Mi/Fr ~08:00 | Bestehend (`nureine-reel-regie`) — auf Cloud heben, nutzt Perlen aus #1. | — |
| 5 | **Analyst** | A Cloud | täglich ~01:30 | IG-Insights + Newsletter-Metriken ziehen, auswerten: was zog, was floppte. Schreibt Learnings + Verbesserungs-Kandidaten nach `nureine_improvements`. | Sonnet |
| 6 | **Verbesserer** | B Lokal | wenn Mac an & offene Idee | Nimmt getrackte Verbesserungs-Ideen (Prompts, Gates, Schwellen, Code), setzt die essentiellen um (PR/Commit), misst danach die Wirkung. | Opus (im Claude-Code-Kontext) |

**Quellen-Kurator** (monatlich, Cloud): schwache RSS-Quellen (niedrige Perlenrate
in `nureine_source_quality`) rauswerfen, neue vorschlagen. Optional Ausbaustufe.

---

## 4. Modell-Staffelung (Qualität, nicht sparen — aber sinnvoll)

- **Haiku** — Masse vorfiltern (offensichtlicher Müll raus, ~150 Stories/Woche).
- **Sonnet** — Standard-Ausformulierung, Bewertung der Kandidaten, Analyse.
- **Opus** — die wenigen sichtbaren Endstücke: Hero-Newsletter, Reel-Skript,
  Bild-Prompt der Perlen, Code-Verbesserungen.
Alles nachts, wenn Aarons Claude-Usage frei ist.

---

## 5. Dashboard (Aaron schaut nur hier rein)

Neue Admin-Seite `/admin/ki` (baut auf bestehenden Cockpits auf):
- Was lief letzte Nacht (aus `nureine_ai_runs`): pro Agent Status, Dauer, Ergebnis.
- Story-Qualität: Verteilung `resonance_score`, wie viele Perlen, abgelehnt & warum.
- Performance-Trend: IG-Shares/Reach, Newsletter-Öffnung/Klick über Zeit.
- Selbstlernen: offene/umgesetzte Verbesserungen aus `nureine_improvements` +
  ob die Metrik danach besser wurde (Vorher/Nachher).

---

## 6. Selbstlern-Schleife (das Herz)

1. **Messen** (Analyst): Performance pro Story/Reel/Newsletter in die DB.
2. **Diagnostizieren**: Welche Eigenschaft trennt Top von Flop? (Hook-Typ,
   Kategorie, Länge, Bildstil, Betreff-Muster …)
3. **Vorschlagen**: konkrete, testbare Änderung → `nureine_improvements`
   (z.B. „Zahl-Hooks +40% Shares → Chefredakteur soll Zahl-Stories höher ranken").
4. **Umsetzen**: Cloud-Agent (Prompt/Schwelle) oder lokaler Verbesserer (Code).
5. **Verifizieren**: nach N Tagen Wirkung messen → behalten oder zurückrollen.
Jede Änderung ist getrackt → das System weiß, was funktioniert hat.

---

## 7. Migrationsstrategie (DeepSeek bleibt Fallback)

- DeepSeek-Pipeline NICHT abschalten — sie ist der Sicherheits-Fallback und füllt
  die DB weiter. Die Claude-Cloud-Routinen legen sich als **Veredelungs-Schicht**
  darüber (bewerten neu, wählen aus, schreiben die Perlen perfekt). So kein
  Big-Bang-Risiko; Qualität steigt schrittweise und messbar.
- Wenn die Claude-Schicht bewiesen besser ist, wandern einzelne DeepSeek-Calls
  (z.B. das Impact-Scoring) ganz zu Claude.

---

## 8. Status

- [x] Ist-Zustand kartiert (2 Explorer + DB-Analyse), 2026-07-07.
- [x] Architektur entschieden (Cloud für online, lokal für Code, Selbstlern-Layer).
- [ ] DB: `nureine_ai_runs` + `nureine_improvements` anlegen (Migration).
- [ ] Agent #5 Analyst (Cloud) — erste Schleife, misst + schlägt vor.
- [ ] Agent #1 Chefredakteur (Cloud) — Relevanz-Neubewertung.
- [ ] Agent #2 Story-Veredler + #3 Bild-Regie (Cloud).
- [ ] Agent #6 Verbesserer (lokal) + Wirkungs-Tracking.
- [ ] Dashboard `/admin/ki`.
- [ ] Reel-Regie auf Cloud heben.
