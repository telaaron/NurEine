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
- [ ] `/heute` öffentliche Asset-Seite (teilbar)
- [ ] DB: `nureine_social_posts` (Queue)
- [ ] Generator-Cron (täglich Entwurf, Trockenlauf-Modus)
- [ ] Admin `/admin/social` (Queue, Vorschau, Freigabe, Save-Tracking, A/B-Auswertung)
- [ ] IG-Post-Cron (Graph API) — hinter Approval-Gate, Schalter auf Voll-Auto
- [ ] Meta Graph API Setup (Business-Account, FB-Seite, App, Token)
- [ ] Outreach-Backlog im Admin (Reddit-Subs, Newsletter-Swap-Ziele)
