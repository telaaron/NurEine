# GROWTH.md — NurEine Wachstumssystem

Stand: 2026-06. Ziel: 0 → größte Good-News-Plattform DACH. Über Reichweite, nicht nur Produkt.
Leitsatz (Hormozi): **"Be the customer, not the seller."** Wir posten als Mensch, den
etwas bewegt hat — nicht als Gründer, der verkauft.

---

## 0. Die eine Metrik

**Saves pro Post** (Instagram), **Antworten** (WhatsApp-Status). Nicht Follower, nicht Likes.
Ein Save = Kaufabsicht. Bester Prädiktor für Newsletter-Signup.
Ziel nach 4 Wochen: Ø 5 Saves/Post. Dann skaliert der Rest.

---

## 1. Kanäle & Rollen

| Kanal | Rolle | Frequenz | Auswahl |
|---|---|---|---|
| **Instagram** | Reichweite, Top-of-Funnel | 1×/Tag, 7:30 | jede Tagesstory |
| **WhatsApp-Status** | Vertrauen, warme Kontakte → Signups | nur wenn's bewegt | nur Wirkung ≥ 85 |
| **Reddit** | gezielte Reichweite, Nische | 2×/Woche | hand-selektiert |
| **Newsletter-Swap** | geliehenes Publikum | bei Gelegenheit | persönlich |

**Kein TikTok zum Start.** Ein Kanal meistern (IG) schlägt drei halbherzig.

---

## 2. Instagram — der Algorithmus-Plan

### Was der Algo belohnt (2026)
1. **Saves + Shares** > Likes. Carousel-Posts mit "Mehrwert zum Aufheben" werden gespeichert.
2. **Verweildauer** — Folie 1 muss zum Wischen zwingen (Hook), Folie 2-3 liefern.
3. **Regelmäßigkeit** — täglich gleiche Zeit > Schübe. Algo lernt deinen Rhythmus.
4. **Frühe Interaktion** — die ersten 30 Min nach Post entscheiden. Du antwortest sofort auf jeden Kommentar.
5. **Native Inhalte** — nativ hochgeladen, kein offensichtlicher "via Tool"-Footprint, kein Link-Spam in Caption (Link nur in Bio).

### Post-Format (Carousel, 3 Folien)
- **Folie 1 — Hook:** die Zahl / der Kontrast. Groß, ein Satz. Kein "Folgt uns".
- **Folie 2 — Auflösung:** was dahintersteckt, 1-2 Sätze, belegt.
- **Folie 3 — Kontext/Wirkung:** Wirkungsindex + eine Zeile Einordnung + dezent `nureine.de`.

### Caption-Format (ab Woche 2)
```
[Zahl oder Fakt — kurz, präzise]

[Eine Zeile Kontext]

[Woche 1-3: kein CTA. Ab Woche 4: "Täglich im Newsletter → nureine.de"]
```
Regeln: kein Emoji-Spam, kein "Folgt uns für mehr", kein Ausrufezeichen. Ruhig, erwachsen.

### Hook-Typen (A/B-Test-Achse)
- **Zahl:** "Kindersterblichkeit: −60 % seit 1990."
- **Frage:** "Warum ist diese Nachricht wichtiger als die andere?"
- **Kontrast:** "1990 vs. heute: …"

### Hashtags (max 5, gezielt)
`#gutenachrichten #positivenews #fortschritt #weltverbesserer #[kategorie]`
Kategorie-Map → ein passender Tag pro Story (z.B. klima→#klimaschutz, gesundheit→#globalhealth).

---

## 3. A/B-Test-System (datengetrieben ab Woche 3)

Jeder generierte Post bekommt **eine Test-Dimension** zugewiesen + getrackt:
- **Hook-Typ** (Zahl / Frage / Kontrast)
- **Kategorie** (klima / gesundheit / wissenschaft / …)
- **Format** (3 Folien / 2 Folien / Einzelbild)

Nach 2 Wochen: Auswertung im Admin-Cockpit — welcher Hook-Typ / welche Kategorie holt die meisten Saves?
**70/30-Regel ab Woche 3:** 70 % = was funktioniert, 30 % = neues Format testen.

Saves müssen manuell gepflegt werden (IG-API liefert sie nur eingeschränkt) ODER via Graph-API-Insights
sobald angebunden. Trockenlauf-Phase: Feld bleibt leer, ab Live trägst du / die API es nach.

---

## 4. Der tägliche Rhythmus (Trockenlauf → Live)

### Phase A — Trockenlauf (Woche 0, JETZT)
- Generator-Cron läuft täglich, erzeugt einen **Post-Entwurf** (Story + Karte + Caption + Hashtags + Test-Dimension).
- Status `draft`. **Es wird NICHTS gepostet.**
- Du prüfst eine Woche lang im Admin-Cockpit (`/admin/social`): Vorschau, editierst, gibst frei oder verwirfst.
- Ziel: Gefühl für Output + Format-Feinschliff, bevor irgendwas öffentlich wird.

### Phase B — Live mit Approval-Gate (Woche 1+)
- Generator erzeugt weiter täglich Entwürfe.
- Du gibst im Cockpit frei (`approved`) → Post-Cron veröffentlicht via Graph API zur Zielzeit → `posted`.
- **Nichts geht ohne dein OK raus.**

### Phase C — Voll-autonom (optional, ein Schalter)
- Setting `social_autopilot = true` → freigegebene-by-default, Post-Cron veröffentlicht direkt.
- Du kannst jederzeit zurück auf Gate.

---

## 5. WhatsApp-Status (nur ≥ 85)

Bereits gebaut: Highlight-Mail feuert 06:30 UTC, wenn Tages-Top-Story Wirkung ≥ 85 hat → Mail an dich
mit Link auf `/share/[slug]` (9:16-Karte + Begleittext zum Kopieren).
**Regel:** Nur posten, wenn dich die Story selbst bewegt. Lieber 3×/Woche echt als täglich pflichtschuldig.
Wer auf den Status antwortet → bekommt den Newsletter-Link persönlich (1:1, höchste Conversion).

---

## 6. Outreach-Playbooks

### 6a. Reddit (2×/Woche)
- Subs: r/de, r/UpliftingNews, r/Optimismus, r/solarpunk, ggf. r/Futurology.
- **Regel:** Inhalt teilen, KEIN Link im Titel/Body. "Quelle: nureine.de" am Ende. Kein "Abonniert".
- Titel = der Hook (Zahl/Kontrast). Body = die Auflösung + Quelle. Echter Mehrwert, sonst Bann.
- Timing: r/de morgens (DE-Zeit), englische Subs 14-16 Uhr UTC.

### 6b. Newsletter-Swap (bei Gelegenheit)
- Ziel: DACH-Newsletter < 5.000 Subs (Achtsamkeit / Nachhaltigkeit / Mental Health / Wissenschaft).
- **Pitch (persönlich, kein Template-Ton):**
  > "Hi [Name], ich baue NurEine — ein kuratiertes Good-News-Medium, eine belegte Geschichte pro Tag.
  > Ich glaube, eure Leser und meine überschneiden sich. Lust auf einen kleinen Swap — ich erwähne euch,
  > ihr mich? Kein Druck. — Aaron"
- Liste wird im Admin gepflegt (Backlog), Versand manuell (du prüfst jede Mail).

---

## 7. Was du prüfst, bevor irgendwas live geht

1. Eine Woche Trockenlauf-Entwürfe im Cockpit durchsehen.
2. Captions/Hashtags-Format final abnicken.
3. Meta-API erst danach scharfschalten.
4. Erster echter IG-Post: von dir manuell freigegeben.

---

## 8. Build-Status

- [x] WhatsApp-Highlight-Mail (≥85) + /share-Seite + 9:16-Karte
- [x] OG/Card Performance-Fix (sharp downscale)
- [x] `/heute` öffentliche Asset-Seite (teilbar) — live
- [x] DB: `nureine_social_posts` (Queue) — migration 00022
- [x] Generator-Cron (täglich 06:15 UTC, Trockenlauf-Modus) — live
- [x] Admin `/admin/social` (Queue, Vorschau, Freigabe, Save-Tracking, A/B-Auswertung) — live
- [x] IG-Post-Cron (Graph API) — gebaut, hinter Approval-Gate, no-op ohne Token
- [ ] **Meta Graph API Setup** (Business-Account, FB-Seite, App, Token) → IG_USER_ID + IG_ACCESS_TOKEN in Vercel. ERST nach Trockenlauf-Woche.
- [ ] Outreach-Backlog im Admin (Reddit-Subs, Newsletter-Swap-Ziele)

### Offene To-Dos für Aaron
1. ✅ GitHub Secret `PUBLIC_BASE_URL` gesetzt.
2. Eine Woche `/admin/social` prüfen — Entwürfe ansehen, Captions/Format abnicken.
3. Danach Meta-Setup → Instagram scharfschalten.

## 9. Redaktions-Pipeline (Schicht 2-5) — gebaut 2026-06-05

DeepSeek scort jede Story zusätzlich (fetch_stories.py):
- **emotion**: relief|wonder|hope|pride|warmth (relief/wonder→IG, hope/warmth→Newsletter, pride→beide)
- **ig_ok / wa_ok**: Kanal-Eignung (ig_ok erzwingt server-seitig impact≥70)
- **ig_hook**: erste 1,5 Zeilen (Emotion, nicht Titel) — überlebt vor "… mehr"
- **wa_opener**: persönlicher WhatsApp-Einstieg ("Das hat mich ruhiger gemacht")
- **slides**: {hook, aufloesung, stille} für Carousel
- **discard**: is_nureine=false → wird gar nicht inserted (Qualitätsschwellen Schicht 4)

Tages-Auswahl (queries.ts): selectInstagramStory / selectWhatsappStory.
**Lieber leer als falsch** — keine ig_ok/wa_ok Story heute → kein Post.
Fallback-Heuristik (impact≥75 / ≥85) für Stories vor der Pipeline.

Ausgabe:
- Carousel /api/carousel/[slug]/[1-3] (3 Folien 4:5) → IG-Carousel-Publish
- Caption baut auf Hook auf statt zu wiederholen (buildCaptionFromHook)
- share-card verspielter (Emotion-Tag, gerundetes Bild), OG-Headline größer
- Highlight-Mail + /heute nutzen wa_opener (persönlich, aufbauend)

Share-Tracking: story_shared {format: whatsapp|instagram|og, via: copy|download}
auf /heute + /share. In 30 Tagen: welcher Kanal konvertiert wirklich.

---

## 10. Marketing-Autopilot (2026-06-07)

Ziel: alles läuft selbst. Mensch greift nur bei Strategie ein.

### Content-Strom (Ursache des Drought gefixt)
- RSS-Quellen 8 → **21** (Spektrum, Perspective Daily, Tagesschau, Reasons to be
  Cheerful, Optimist Daily, Yale E360, Grist, Anthropocene, MIT Tech, Phys.org,
  ScienceDaily, Our World in Data, Futura).
- Pre-Filter entschärft: nur krasse Negatives im TITEL, Rest → KI (vorher killte
  `\bdies?\b` 56/Run, `tot\b` matchte "total", desc mitgeprüft).
- **Großzügige Archiv-Aufnahme:** is_nureine = jede valide positive News (auch mittel).
  Wirkungsindex sortiert später was gepostet/versendet wird.

### Gestufte Schwellen
| Kanal | Schwelle |
|---|---|
| Archiv | jede valide positive News (großzügig) |
| Newsletter | Tier 1/2 (≤48h) sonst Tier-3 ≤7d + impact≥60 (kein verstaubter Newsletter mehr) |
| IG-Feed-Post | ig_ok + impact≥70, max 1/Tag |
| IG-Story | impact≥60, ≤36h, max 4/Tag verteilt |

### Crons (alle GitHub Actions)
| Cron | Zeit (UTC) | Was |
|---|---|---|
| fetch-stories | 06/10/14/18 | News holen + scoren (21 Quellen) |
| social-generate | 06:15 | Feed-Post-Draft (nur ig_ok) |
| social-publish | 05:30 | Feed-Post posten (Guard: 1/Tag) |
| social-story | 06/10/14/17 | IG-Story posten (Guard: 4/Tag) |
| social-comments | 07:30/11:30/15:30/19:30 | KI-Kommentar-Antworten |
| social-insights | 22:00 | saves/reach automatisch ziehen |
| highlight-email | 06:30 | WhatsApp-Highlight-Mail (≥85) |

### Autopilot-Schalter
`SOCIAL_AUTOPILOT=true` (Vercel) → publish postet draft+approved autonom (nur ig_ok,
1/Tag-Guard). Default aus = Approval-Gate. **Noch nicht aktiviert** (erst Output prüfen).

### A/B (nur tracken, du entscheidest)
- Folie-1-Stil image vs. number (hook_style col) alternierend
- IG-Insights-Cron zieht saves/reach automatisch → byStyle/byHook/byCategory im Admin
- Hashtags: 8/Kategorie-Pool, rotierend ~10/Post (seed = Post-Zähler)

### KI-Kommentar-Antworten
DeepSeek klassifiziert: nur positive/Fragen → kurze menschliche Antwort. Troll/Spam/
Politik → still skip. Dedup via nureine_social_replies, max 8/Run.
**Braucht instagram_manage_comments-Scope** (Token hat ihn noch nicht — Code wartet).

### Kategorien
/archiv/[kategorie] SEO-Seiten (klima/gesundheit/…) + Footer + Sitemap.
IG-Highlight-Cover pro Kategorie: manuell in IG-App (Cover-Bild generierbar).

### Bonus-Ideen (Backlog, noch nicht gebaut)
- **Best-time-to-post:** misst Reach-Peak, verschiebt Postzeit dahin
- **Reel-Format:** Karten als 5-Sek-Slideshow-Reel (3× Reach vs. Feed)
- **Wachstums-Dashboard:** Follower-Trend, Save-Rate, Top-Posts, A/B-Sieger im Admin
- **Cross-Post:** IG-Feed + Story + (später) Threads/TikTok aus einem Generator
