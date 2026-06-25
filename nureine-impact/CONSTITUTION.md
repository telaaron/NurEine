# IMPACT CONSTITUTION — NurEine.de

> Stabiles Referenzdokument für die tägliche Impact-Routine.
> Ändert sich selten. Wird einmal pro Lauf gelesen (gecacht) — die Routine
> sucht NICHTS davon im Code. Wenn sich Datenquellen oder Ton ändern: hier
> aktualisieren, nicht im Routine-Prompt.

---

## 0. Mission (die einzige Frage)

> Löst der heutige Content bei einem **Erstnutzer ohne Vorwissen** ein tiefes,
> **fundiertes** Hoffnungsgefühl aus — über alle Kanäle hinweg?

Nicht: "ist es korrekt formatiert". Sondern: **fühlt es sich echt an.**

---

## 1. Markenton (Bewertungsmaßstab — aus CONTENT.md + GROWTH.md)

NurEine ist **belegter, ruhiger Optimismus**. Eine belegte Geschichte pro Tag.

**IST der Ton:**
- Belegbar (Quelle, Studie, offizielle Daten) — Hoffnung ist *erkämpft*, nicht behauptet
- Ruhig, erwachsen, ehrlich — spricht Menschen an, die Nachrichtenmüdigkeit kennen
- Konkret: Was passiert? Wie viele Menschen? Warum dauerhaft?

**IST NICHT der Ton (= automatische Reibungspunkte):**
- ❌ Clickbait-Headlines ohne Substanz
- ❌ Toxische Positivität ("Alles wird gut!")
- ❌ Ausrufezeichen, Emoji-Spam, "Folgt uns!", "Jetzt abonnieren!"
- ❌ "Hund rettet Katze" — nett, aber kein Impact
- ❌ PR-Sprech, Versprechen ohne Umsetzungsbeleg

---

## 2. Die drei Nutzer-Perspektiven (Score-Achsen, je 0–10)

Bewerte jeden Kanal aus diesen drei Augen. **Zahlen, keine Essays.**
Prosa NUR für den EINEN tiefsten Reibungspunkt (siehe §5).

| Achse | Persona | Die eine Frage |
|---|---|---|
| **Z** (Zyniker) | hasst toxische Positivität, wittert Naivität | Wirkt die Hoffnung fundiert, real, ehrlich erkämpft? |
| **S** (Scroller) | 2 Sekunden Aufmerksamkeit | Transportieren Bild + Hook + erster Satz die Hoffnung *sofort*? |
| **E** (Erschöpfter) | sucht echten Halt | Berührt es das Herz? Gefühl "die Welt ist ein Stück besser"? |
| **D** (Design/Nutzer) | sehr kritischer Erstnutzer | Sieht es vertrauenswürdig & klar aus, oder billig/verwirrend/laut? |

Gesamt-Impact = gewichteter Schnitt: **Z×0.30 + S×0.30 + E×0.30 + D×0.10**
(Z/S/E gleich gewichtet — Substanz, Sofort-Wirkung, Herz zählen gleich viel.
Design ist Verstärker, nicht Kern.)

---

## 3. WAS bewertet wird & WO es liegt (Datenquellen — NICHT suchen)

Alle Inhalte von **heute** kommen aus Supabase + gerenderten Routen.
Tabellen-Prefix: `nureine_`. Lesen via Service-Key (read-only genügt).

| Kanal | Quelle | Felder, die "Content" sind |
|---|---|---|
| **Website-Feed** | `nureine_stories` WHERE `published_at::date = today` | `title`, `subtitle`, `summary`, `body_markdown`, `emoji`, `is_hero`, `impact_score`, `og_image_url` |
| **Instagram/Threads** | `nureine_social_posts` WHERE `created_at::date = today` | `caption`, `hashtags`, `hook_type`, `card_url`, `og_url`, `status` |
| **E-Mail (Highlight)** | `src/lib/server/newsletter.ts` → `sendHighlightEmailIfWorthy()`; Endpoint `/api/cron/highlight` | Betreff, Hook, Body der Highlight-Mail (nur wenn Top-Story ≥ 85) |
| **E-Mail (Newsletter)** | `/api/cron/newsletter` + `newsletter_sends` | Versendeter Newsletter-Body, Betreff |
| **Design (über Code)** | Komponenten von `/heute`, `/share/[slug]`, OG-Card-Generator `src/lib/server/og/` | Markup + CSS → Hierarchie, Vertrauen, Lesbarkeit (KEIN Screenshot — Cloud hat keinen Browser) |
| **Versand-Wahrheit** | `cron_runs`, `nureine_social_posts.posted_at`, `newsletter_sends.sent_at`, `nureine_delivery_log` | Was *tatsächlich* rausging (nicht nur Entwurf) |

**Ausführungsumgebung:** Die Routine läuft in der **Cloud** (geklontes Repo +
angehängte Connectoren). Sie hat **keinen** Zugriff auf Aarons lokalen Mac,
keinen Dev-Server, keinen Browser. Design wird aus dem Code/Markup bewertet,
nicht aus einem Screenshot.

**DB-Zugriff — WICHTIG (sonst läuft die Routine blind):**
- Nutze den **hosted Supabase-MCP** (`@supabase/mcp-server-supabase`, Management-API,
  Tool `execute_sql` / `list_tables`). Er fragt die ECHTE gehostete DB ab.
- **NIEMALS** den `supabase-data`-Connector aus der Repo-`.mcp.json` benutzen —
  der zeigt hardcoded auf `http://127.0.0.1:54321` (lokale Dev-Instanz) und ist
  in der Cloud nicht erreichbar (connection refused). Das ist KEIN "Projekt nicht
  live", sondern der falsche Connector.
- Voraussetzung: `SUPABASE_PROJECT_REF` + `SUPABASE_ACCESS_TOKEN` sind im
  Schedule-Setup gesetzt. Fehlen sie → DB nicht erreichbar → blocked-Run (siehe §8).
- Beispiel-Query: `SELECT id,title,subtitle,summary,emoji,impact_score,is_hero
  FROM nureine_stories WHERE published_at::date = current_date;`

**Pull-Reihenfolge:** Stories → Social-Posts → Highlight/Newsletter-Body →
Design aus den Komponenten ableiten.

---

## 4. Erfolgs-Signal (Hybrid — die "Wahrheit" über Wirkung)

Vortags-Hypothese wird an **echten Zahlen** geprüft, wo vorhanden; sonst Selbst-Score (klar markiert).

| Signal | Quelle | Aussage |
|---|---|---|
| **Saves / Reach** | `nureine_social_posts.saves`, `.reach` | IG-Wirkung (Lag 1–2 Tage) |
| **Open / Click** | `newsletter_sends.opened` | Mail-Wirkung |
| **Funnel-Events** | `nureine_events.name` ∈ {`story_read`, `cta_click`, `share`, `newsletter_signup`} | echtes Verhalten — das stärkste Signal |
| **Selbst-Score** | Routine re-bewertet eigene Vortags-Änderung | Füllung bis Daten reif (markiere `quelle: "self"`) |

**Regel:** Jede Hypothesen-Bewertung trägt `quelle: "metric" | "self" | "mixed"`.
Self-Score allein darf eine Hypothese NICHT als ✅ bestätigen — nur als "noch offen, subjektiv positiv".

---

## 5. Output-Disziplin (Token-Budget)

- Scores = **Zahlen**. Keine Prosa pro Achse.
- Prosa NUR für den **einen tiefsten Reibungspunkt** pro Kanal (max 2 Sätze).
- **Root-Cause-Pflichtfeld:** jede Empfehlung MUSS die *Ursache* benennen, nicht das Symptom.
  - Symptom: "Satz 2 umformulieren." ❌
  - Ursache: "Der Hook führt mit der Institution statt mit dem Menschen → Scroller fühlt nichts." ✅
- Maximal **EINE** Top-Änderung pro Lauf wird angewandt (Fokus schlägt Streuung).

---

## 6. Apply-Modell: PR + DB-Insert (NICHT Push auf main)

Zwei getrennte Pfade — so siehst du die Analyse SOFORT (DB), entscheidest aber
selbst, ob der Code live geht (PR-Merge):

- **Findings → Supabase** (`nureine_impact_runs`). Sofort, immer, auch wenn Code
  scheitert. Speist das Dashboard live.
- **Code-Änderung → PR** auf einen Branch `impact/auto-YYYY-MM-DD`. Du mergst auf
  GitHub (oder per Dashboard-Link). Erst der Merge macht es live.

### Anwenden (Schritt 5 der Routine)
1. **State = DB.** Es gibt KEINE state.json mehr. Lies den letzten Lauf via
   `SELECT * FROM nureine_impact_runs ORDER BY run_date DESC LIMIT 2;`
2. Die EINE Top-Änderung umsetzen: **Text/Framing/Code als Diff**.
   Generatoren (`src/lib/server/social/caption.ts`, `src/lib/server/newsletter.ts`),
   NICHT einzelne DB-Zeilen — Ursache, nicht Symptom.
3. **GRÜN-GATE:** `pnpm install`, dann `pnpm run check`. Vergleiche mit Baseline
   (vorbestehende `$env/static`-Fehler ohne Secrets sind OK) → **0 neue** Fehler.
   - Rot → Code verwerfen (`git restore .`), KEINEN PR, aber **trotzdem** den
     DB-Eintrag mit `status:"gate_failed"` + Finding schreiben (Analyse ist wertvoll).
4. **PR erstellen:** Branch `impact/auto-DATE`, commit, push des Branches, PR öffnen
   (GitHub-MCP `create_pull_request` oder `gh pr create`). Titel:
   `impact(auto): <kanal> — <kurz-ursache>`. PR-Body = das Finding + Vorhersage.
   - Push/PR scheitert (403/Policy)? → **PUSH-FALLBACK** (§6b). Niemals still verlieren.
5. **DB-Insert** (immer, via Supabase-MCP `execute_sql`, upsert on `run_date`):
   ```sql
   INSERT INTO nureine_impact_runs (run_date,status,scores,channel,root_cause,
     change_summary,change_file,predicts,pr_url,pr_number,pr_state,metrics,log_markdown)
   VALUES (current_date,'ok', '{…}'::jsonb, …, '<pr_url>', <nr>, 'open', '{…}'::jsonb, '<log>')
   ON CONFLICT (run_date) DO UPDATE SET …;
   ```

### 6b. PUSH-FALLBACK (PR scheitert)
Die Code-Arbeit darf nie verloren gehen. Bei 403/Policy (einmalig, nicht wiederholen):
- Patch: `git format-patch origin/main..HEAD --stdout > impact-DATE.patch`.
- Patch an Aaron senden (SendUserFile) + PushNotification mit Kern-Erkenntnis.
- DB-Eintrag trotzdem schreiben (`pr_url` NULL, im `log_markdown`: "PR blockiert,
  als Patch geliefert"). Patch aus dem Tree löschen.

### Verifizieren (Schritt 1 des nächsten Laufs) — über echtes Signal
Lies den letzten Lauf aus der DB. Wenn er einen offenen Vorschlag hatte:
- **PR gemerged + Signal besser** (§4) → schreibe heutigen Eintrag mit
  `verify_of_date=<damals>`, `verdict:"confirmed"`, `verdict_source:"metric"`.
- **PR gemerged + Signal schlechter/neutral** → `verdict:"rejected"`. Schlage einen
  **Revert-PR** vor (Branch `impact/revert-DATE`, `git revert <sha>`), öffne ihn,
  Aaron merged. Heute eine ANDERE Ursache angehen.
- **PR noch offen** (nicht gemerged) → kein Signal möglich. `verdict:"pending"`,
  `verdict_source:"self"`. Nicht erneut denselben Vorschlag machen.
- **Signal unreif** (Daten-Lag) → `verdict:"pending"`, morgen erneut.
Self-Score bestätigt/verwirft NIE allein (§4).

### Was NIE auto-geändert wird (nur Finding in DB, kein PR-Code)
Versand-Trigger/Crons, Auth, Secrets, Schema-Migrationen (`supabase/migrations`),
Lösch-Operationen, `package.json`-Deps. Zu riskant — landen als Empfehlung im
`log_markdown`/`root_cause` für Aarons Hand.

---

## 7. Dashboard

`/admin/impact` (SvelteKit, hinter Admin-Auth) liest **live aus `nureine_impact_runs`**
(via `supabaseAdmin`) — die Analyse erscheint also VOR dem PR-Merge:
- **Score-Trend** (Gesamt über Zeit) + Achsen-Kacheln (Z/S/E/D, Schnitt der Kanäle)
- **Heutiges Finding:** Ursache + Änderung + Datei + Vorhersage + **PR-Link-Button**
  (PR-Status: offen / gemerged / geschlossen)
- **Vortags-Hypothese:** verdict (bestätigt/verworfen/pending) + Signal-Beleg
- **Tages-Report** (ausklappbar, `log_markdown`)

---

## 8. Blocked-Run (DB nicht erreichbar / Content fehlt)

Wenn PULL (§3) fehlschlägt — DB nicht erreichbar, Connector falsch, Keys fehlen:
- **Niemals Scores erfinden.** Kein Self-Score auf Phantomdaten.
- Schreibe (wenn die DB wenigstens fürs Schreiben erreichbar ist) einen Eintrag
  `status:"blocked"`, `blocked_reason:"<kurz>"`, KEINE `scores`. Sonst:
  PushNotification an Aaron mit dem Grund.
- **Anti-Spam:** War der letzte Lauf schon `blocked` mit derselben Ursache →
  nur `run_date` aktualisieren (upsert), still beenden. Ein Blocker pro Ursache.
- Dashboard zeigt dann das Blocked-Banner statt Leerzustand.
