# NurEine — Roadmap & Wachstumsstrategie

> Ziel: **größte Good-News-Plattform im DACH-Raum** — nicht nur durch Design,
> Performance und Funktionen, sondern durch **Kundschaft / Reichweite**.
> Stand: 2026-06-04. Lebendes Dokument.

---

## 0 · Wo wir stehen (ehrlich)

**Produkt:** stark. Redesign (Space Grotesk + Newsreader), Tiefe, OG-Bilder,
personalisierter Newsletter (explizit + gelernt), Landing, Ticker, Analytics
(eigene `nureine_events` = Proof-Engine), Admin-Cockpit, sichere Auth.

**Engpass:** **Audience.** ~7 Abonnenten. Das Produkt verdient 10.000+. Alles
unten priorisiert nach **Hormozi: Wachstum vor Monetarisierung.** Das Produkt
ist „gut genug zum Skalieren" — jetzt zählt Distribution.

---

## 1 · Brutale Wahrheiten (die großen Fragen, selbst beantwortet)

**F: Warum sollte jemand NurEine abonnieren statt Good News Network, Squirrel
News, Perspective Daily, gute-nachrichten.com?**
A: Aktuell kaum Differenzierung außer Design + Wirkungsindex. Das reicht nicht.
**Der Wedge muss schärfer:** „Genau **eine** Nachricht, **gemessen** nach Wirkung,
**lokal gewichtet**, in 2 Min." Die Konkurrenz ist Feed/Listen-basiert. Unser
Versprechen = Anti-Feed. Das ist die Positionierung, die wir überall hämmern.

**F: Was ist unser unfairer Vorteil (Moat)?**
A: Noch keiner stark. Kandidaten: (1) **Wirkungsindex als Marke** (wie „Trustpilot-Score"
für gute Nachrichten), (2) **lokale Tiefe** („Bei dir" — kein Konkurrent macht
Hyperlokal gut), (3) **owned First-Party-Daten** (`nureine_events` + Präferenzen)
→ Personalisierung, die Aggregatoren nicht können. Moat #2 + #3 ausbauen.

**F: Was ist der eine Kanal, der uns auf 1.000 echte Abonnenten bringt?**
A: Nicht „alle Kanäle". **Ein Kanal, dominiert.** Kandidaten unten (§4). Wette:
**Instagram/TikTok Reels mit OG-artigen Story-Cards** (visuell stark, teilbar,
Algorithmus belohnt positive Emotion) + **SEO-Longtail** („gute nachrichten
[thema/region]"). Beide nutzen Assets, die wir schon erzeugen (OG-Bilder, Stories).

**F: Warum verbreiten Leute es NICHT von selbst?**
A: Kein eingebauter, reibungsloser Share-Loop mit Belohnung. Share gibt's, aber
kein „Grund". Lösung: **identitätsstiftendes Teilen** („Ich lese gute Nachrichten")
+ Referral (§3) + share-optimierte OG (haben wir).

**F: Wann monetarisieren?**
A: Erst bei Engagement-Beweis. Schwelle grob: **>1.000 Abonnenten, >35% Open-Rate,
>5 organische Shares/Story.** Vorher = Wachstum + Daten sammeln.

---

## 2 · Produkt-Lücken (was technisch noch fehlt)

Priorität: **P0 = blockiert Launch/Wachstum, P1 = bald, P2 = später.**

### ✅ Erledigt (live auf main)
Redesign (Schrift/Tiefe/Hero/Feature-Card), OG-Bilder (dynamisch, Satori),
Landing /warum, Live-Ticker, eigene Analytics (`nureine_events`) + Vercel,
Admin-Cockpit + Funnel-Modul (inkl. Deliverability + Top-Werber), HMAC-Admin-Auth
(alle Endpoints), personalisierter Newsletter (explizit + gelernt), **Story-Einreichen
`/einreichen` + Admin-Moderation**, **Referral-Mechanik** (Code/Capture/Credit/Share-UI),
**Open-Rate-Tracking** (Brevo-Webhook, alle Events), **Double-Opt-in** (confirmed_at + IP),
SEO (JSON-LD, sitemap, robots), Mobil-Feinschliff. Live: Supabase, Brevo, ADMIN_SESSION_SECRET.

### Noch offen
| P | Lücke | Warum |
|---|---|---|
| **P0** | **Brevo-Webhook registrieren** (URL `?secret=`, Auth „Keine", Transactional, alle Events) | Sonst keine Open/Click-Daten. Code steht. NEU: `BREVO_WEBHOOK_SECRET` in Vercel. |
| **P0** | **Brevo DNS prüfen** (SPF/DKIM/DMARC) | Zustellbarkeit. Läuft schon an ~5+7 → vermutlich ok, verifizieren. |
| **P1** | **Auto-Social-Cards** (9:16 aus OG für IG/TikTok, Cron) | Der eine Wachstumskanal (§4). Assets existieren. |
| **P1** | **Referral-Belohnung** (Schwelle → Badge/Unlock) | Aktuell nur Zählung; Anreiz fehlt noch. |
| **P2** | **Streak / „X Tage Lichtblick"** | Habit-Loop, Retention. |
| **P2** | **Slug als echte DB-Spalte** | `getStoryBySlug` lädt ALLE Stories + filtert in JS — skaliert nicht über ~paar Tausend. |
| **P2** | **OG cold-render 36-45s** → pre-generieren / Edge-Cache-Warm | Bei viraler Story = viele „erste" Viewer warten. |
| **P2** | **`category_scores` decay** + Opens→Scores | Personalisierung lernt nur aus Klicks; Decay fehlt. |
| **P2** | **PWA-Manifest / Volltext-Suche Archiv** | Nice-to-have. |
| **P3** | **Soft-Paywall / Optimist-Tier (Stripe)** | NUR nach Wachstums-Beweis (§1). Infra bereit. |
| **P3** | **B2B aktiv verkaufen** | Proof-Zahlen aus `nureine_events` jetzt vorhanden → bald möglich. |

**Sicherheits-Notiz:** Admin-Auth jetzt HMAC-Session (gefixt). `ADMIN_SESSION_SECRET`
MUSS in Vercel gesetzt werden. Zwei `00016_*` Migrationen kollidieren (Altlast) —
bei nächster DB-Arbeit aufräumen.

---

## 3 · Wachstums-Features (Produkt = Distribution)

Die besten Wachstumshebel sind **eingebaute Produkt-Loops**, nicht Marketing-Spend.

1. **Referral-Loop** — „Lade 3 Freunde ein, schalte das Wochen-Briefing frei /
   Badge." Geteilter Link `?ref=<token>` → `nureine_events` zählt → Schwelle →
   Belohnung. Billig, viral, messbar.
2. **Share-to-unlock-Identity** — Teilen-Button mit vorformuliertem, identitäts-
   stiftendem Text („Ich starte den Tag mit einer guten Nachricht statt Doom-
   scrolling. Du auch? ↓"). OG-Bild macht den Rest.
3. **Auto-generierte Social-Cards pro Story** — wir erzeugen OG schon. Pipeline:
   Story → OG → automatisch als IG/TikTok-Story-Format (9:16) posten. Cron.
4. **„Diese Woche in Zahlen"-Wochenpost** — teilbarer Wochenrückblick (X gute
   Nachrichten, Ø Wirkung Y) als Bild. Owned-Data → Content.
5. **Embeddable Widget** — „Gute Nachricht des Tages" als `<iframe>`/Web-Component
   für andere Blogs/NGOs → Backlinks + Reichweite + B2B-Türöffner.
6. **Streak / „X Tage Lichtblick"** — Habit-Loop (ohne Sucht-Dark-Patterns), per
   localStorage/Profil. Retention.

---

## 4 · OUTREACH & SUBSCRIBER-GROWTH (der wichtigste Teil)

> Regel: **EIN Kanal dominieren, bevor der zweite startet.** Fokus schlägt Streuung.

### Phase 1 (0 → 1.000): Hand-zu-Hand + ein organischer Kanal
- **Founder-led Social (DE):** täglich die Tagesgeschichte als Reel/Carousel auf
  **Instagram + TikTok** (positive News performen dort überdurchschnittlich, weil
  sie geteilt/gespeichert werden). Hook: „Während alle über X reden — das ist
  heute WIRKLICH passiert." → CTA Bio-Link → `/warum`.
- **Reddit / Foren:** r/de, r/Optimism, r/UpliftingNews, r/GoodNews — Stories
  *ehrlich* teilen (kein Spam), Mehrwert first. Eine virale = 100+ Abonnenten.
- **Nischen-Newsletter-Swaps:** Cross-Promo mit kleinen DACH-Newslettern
  (Achtsamkeit, Nachhaltigkeit, Mental Health). Win-win, kostenlos.
- **„Build in Public":** Gründer-Story auf LinkedIn/X — „Ich baue die Anti-Doom-
  scroll-Plattform." Meta-Narrativ zieht Early Adopters + Presse.

### Phase 2 (1.000 → 10.000): SEO + PR + Partnerschaften
- **SEO-Longtail-Maschine:** jede Story = SEO-Seite (haben wir, JSON-LD ✓). Gezielt
  „gute nachrichten [Region]", „positive nachrichten [Thema] 2026". Archiv +
  „Bei dir" = Longtail-Goldmine. Sitemap aktuell ✓.
- **PR-Hook:** „Deutsches Startup misst gute Nachrichten mit KI-Wirkungsindex" —
  pitchbar an t3n, Gründerszene, OMR, Lokalpresse Brandenburg.
- **NGO-/Stadt-Partnerschaften:** Impact-Orgs wollen Sichtbarkeit (= spätere B2B-
  Kunden). Embeddable Widget (§3.5) als Köder. Sie verlinken → Backlinks + Leser.
- **Schulen / Mental-Health-Kontext:** „Nachrichten ohne Angst" — Lehrer, Therapeuten
  als Multiplikatoren.

### Phase 3 (10.000+): Bezahlte Skalierung + Monetarisierung
- Erst wenn CAC < LTV beweisbar (Daten aus `nureine_events`). Dann Meta/Google Ads
  auf `/warum` (Funnel + Tracking stehen ✓).
- B2B (Sponsoring, Team-Abos) + Optimist-Tier (§2 P3) parallel hochfahren.

### Metriken, die zählen (im Admin-Cockpit sichtbar machen)
- Wöchentliches Abonnenten-Wachstum (%) · Open-Rate · Click-Rate · Share/Story ·
  organischer vs. bezahlter Traffic · Top-Quellen. (Funnel-Modul existiert, um
  Open-Rate erweitern — §2 P1.)

---

## 5 · Sofort-Nächste-Schritte (konkret, diese Woche)

Technik steht. Jetzt = Setup-Reste + Distribution starten:
1. **Brevo-Webhook registrieren** — URL `https://nureine.de/api/webhooks/brevo?secret=<BREVO_WEBHOOK_SECRET>`, Auth **„Keine"**, Kategorie **Transactional email**, alle Events. + `BREVO_WEBHOOK_SECRET` in Vercel.
2. **Echt-Versand-Check** — Test-Newsletter an dich, öffnen+klicken, im Admin-Funnel prüfen ob Öffnung/Klick zählt.
3. **Social-Accounts** (IG + TikTok) + erste 7 Story-Reels aus OG-Bildern (§4 Phase 1).
4. **Referral teilen** — deine 7 Member haben Codes (`/einstellungen` zeigt Link). Anstoßen.
5. **Reddit/Foren + Newsletter-Swaps** starten (§4).

---

## 6 · Was bewusst NICHT jetzt
- Paywall / Stripe (Wachstum first).
- B2B-Verkauf (braucht Proof-Zahlen).
- Native Apps (PWA reicht lange).
- Weitere Sprachen (DACH-Fokus erst dominieren).

---

## 7 · Brainstorm eingeordnet (Differenzierung & Moat)

Bewertet nach Hebel ÷ Aufwand. Reihenfolge bewusst.

### 7.1 Positionierung „ehrlicher Fortschritt" (P0 · Stunden) — IN ARBEIT
Weg von „gute Nachrichten" → **„Wir berichten nicht, dass die Welt gut ist. Wir
zeigen, wo sie besser wird — täglich, belegt, in zwei Minuten."** Anti-Feed als
härteste Differenzierung überall (Hero, /warum, Manifest, Meta, OG). Zweites
Dream-Outcome: **„Eine Geschichte. Für das Gespräch heute."** (sozialer Katalysator).
Reiner Copy-/Messaging-Change, höchster Hebel pro Aufwand.

### 7.2 Wirkungsindex-Transparenzseite (P1 · niedrig) — für Skeptiker (ZG 3)
`/methodik` (oder /manifest#methodik ausbauen): Quellen, Gewichtungen (0,4/0,35/0,25),
**Limitierungen**, „Keine Blackbox" — alles öffentlich + prüfbar. Skeptiker liest
das; existiert es nicht → weg, existiert es transparent → gewonnen. Billig, hoher
Vertrauens-Hebel.

### 7.3 Familien-Feature „ein Gespräch mehr" (P1 · mittel)
Onboarding +1 Frage „Hast du Kinder?" (Spalte `has_kids`). Eltern-Segment bekommt
**dieselbe** Story + 3 Zusätze WENN tauglich: Alters-Badge („ab 8 erklärbar"),
Erklärlinie (1 Satz kindgerecht), Gesprächsstarter (offene Frage). Braucht
per-Story-Felder (`kid_age`, `explainer`, `conversation_starter`) → KI-Tagging in
`scripts/fetch_stories.py`. Reuse: Segment-Versand existiert. Kein Konkurrent
positioniert sich als Familien-Ritual → Retention + Eltern-Viral-Kanal.

### 7.4 „Stand der Welt"-Dashboard (P1 · hoch) — der echte Moat
`/stand-der-welt`: ~5–8 (später 15) kuratierte Langzeit-Metriken, **Trendlinie 20–50J
schlägt Momentaufnahme** (z.B. extreme Armut 1990 36% → 2024 8,5% = „75% eliminiert").
Quellen: World Bank REST API (trivial), Our World in Data CSV (GitHub). Python-Cron
**monatlich** (Daten ändern sich nicht über Nacht — Fake-Aktualität wäre unehrlich)
→ Supabase-Tabelle `nureine_world_metrics`. **Ehrlichkeits-Layer** „Was wir NICHT
zeigen" (CO₂, Artenvielfalt, Ungleichheit → Verweis Our World in Data) = Integrität +
immunisiert gegen Kritik. Moat = Zeit, nicht Geld. PR-Aufhänger (t3n/Gründerszene),
Lehrer-Multiplikator, Skeptiker-Bindung. Monats-Newsletter: „Der Stand der Welt".
NICHT: Echtzeit-Feed, Propaganda-Board, Datenwüste, Fake-Tagesaktualität.

### 7.5 Tagesklima / Mood (P3 · später) — erst bei Audience
Nach Story dezente Frage „Wie startest du in den Tag?" (5 Punkte, optional, 3 Sek).
Über Zeit: persönliche Kurve. Kontrollgröße: freitags „Wie war die Woche?" (Morgen-
Score vs. Wochen-Score = ehrlicher persönlicher Beweis ohne externe Daten). Teilen =
minimalistisches Kurven-Bild, opt-in. KEIN Streak-Counter (Dark Pattern), kein
Nutzer-Vergleich, keine Push, kein Pflichtfeld. **Sinnlos bei <100 aktiven Lesern →
nach Wachstum.**
