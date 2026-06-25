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
| **Design (visuell)** | gerenderte Routen `/heute`, `/share/[slug]`, OG-Card `/api/og/[slug]` | Screenshot → Layout, Hierarchie, Vertrauen, Lesbarkeit |
| **Versand-Wahrheit** | `cron_runs`, `nureine_social_posts.posted_at`, `newsletter_sends.sent_at`, `nureine_delivery_log` | Was *tatsächlich* rausging (nicht nur Entwurf) |

**Pull-Reihenfolge:** Stories → Social-Posts → Highlight/Newsletter-Body → 1 Screenshot von `/heute` (+ `/share/<hero-slug>` falls Hero existiert).

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

## 6. Auto-Apply-Regeln (Cloud-Schedule → Push auf main, mit Gate + Auto-Rollback)

Der Loop ist **selbsttragend** (live ohne manuelles Merge) UND **selbstheilend**
(was nicht wirkt, fliegt automatisch raus). Damit kann das Vortags-Signal
überhaupt entstehen — ein offener PR wäre nicht live und der Loop stünde still.

### Anwenden (Schritt 5 der Routine)
1. Die EINE Top-Änderung umsetzen: **Text/Framing direkt**, **Code als Diff**.
   Text-Änderungen betreffen Generatoren (`src/lib/server/social/caption.ts`,
   `src/lib/server/newsletter.ts`), NICHT einzelne DB-Zeilen — Ursache, nicht Symptom.
2. **GRÜN-GATE (Pflicht, vor jedem Push):** `pnpm run check` (svelte-check) UND
   `pnpm run build` müssen fehlerfrei durchlaufen.
   - Grün → committen auf `main`, pushen. Commit-Message:
     `impact(auto): <kanal> — <kurz-ursache> [h-DATE-NN]`
   - Rot → **NICHT pushen.** Änderung lokal verwerfen (`git restore .`),
     ins Log schreiben "Top-Änderung scheiterte am Gate: <fehler>", Hypothese
     gar nicht erst anlegen. Lieber kein Push als ein kaputtes Deployment.
3. Hypothese in `state.json` schreiben mit `status: "applied"` (sie ist ja live)
   + `commit_sha` (für späteren Revert) + `predicts` (Ziel-Signal §4).
4. `state.json` + `log/DATE.md` im selben Commit pushen.

### Verifizieren + Auto-Rollback (Schritt 1 des nächsten Laufs)
Für jede Hypothese mit `status: "applied"`, deren Signal reif ist (§4):
- **Signal verbessert** → `status: "confirmed"`, Code bleibt. Weiter.
- **Signal verschlechtert/neutral** → `status: "rejected"`:
  1. `git revert <commit_sha> --no-edit` → Push auf `main` (macht die Änderung
     rückgängig, behält die History sauber statt force-push).
  2. Erneut GRÜN-GATE vor dem Revert-Push (ein Revert kann auch brechen).
  3. Ins Log: warum verworfen + welches Signal. `verdict_source: "metric"`.
  4. Diesen Tag eine **andere Ursache** angehen (nicht dieselbe nochmal).
- **Signal noch unreif** (Daten-Lag) → bleibt `applied`, `verdict_source: "self"`,
  morgen erneut prüfen. Self-Score bestätigt/verwirft NIE allein (§4).

### Was NIE auto-geändert wird (nur Empfehlung ins Log, kein Commit)
Versand-Trigger/Crons, Auth, Secrets, Schema-Migrationen (`supabase/migrations`),
Lösch-Operationen, `package.json`-Deps. Diese Hebel sind zu riskant für autonome
Pushes — sie landen als markierte Empfehlung im Tages-Log für Aarons Hand.

---

## 7. Dashboard

`/admin/impact` (SvelteKit-Route, hinter bestehendem Admin-Auth):
- **Score-Trend** (Z/S/E/D + Gesamt über Zeit) — Liniendiagramm
- **Vortags-Hypothese:** Text + Status (open/applied/✅bestätigt/❌verworfen) + Signal-Beleg
- **Heutige Top-Änderung:** Was + Ursache + Link zum PR
- Quelle: liest `nureine-impact/state.json` (vom Routine-Lauf geschrieben/committet)
