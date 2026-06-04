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

| P | Lücke | Warum |
|---|---|---|
| **P0** | **Echte API-Keys + Supabase live + Domain live** (CLAUDE.md offen) | Ohne Live = kein Traffic. Vercel-Env: `ADMIN_SESSION_SECRET` NEU nötig (sonst Admin-Login fail-closed). |
| **P0** | **Brevo echter Versand testen** (DNS: SPF/DKIM/DMARC) | Newsletter-Zustellbarkeit = Kern. Sonst Spam-Ordner. |
| **P1** | **Story-Einreichen-Route** (`/einreichen`) — UGC, Community | Hormozi Free-Tier-Hebel + Engagement + SEO. Existiert nicht. |
| **P1** | **Referral-Mechanik** (geteilter Link → Tracking → Belohnung) | Viraler Koeffizient. `nureine_events` kann's tracken. |
| **P1** | **Open-Rate-Tracking** (Brevo-Webhook → `category_scores`) | Auto-Personalisierung lernt aktuell nur aus Klicks, nicht Opens. |
| **P1** | **Double-Opt-in DSGVO sauber** (Confirm-Flow existiert — Logs/Nachweis prüfen) | Rechtlich Pflicht DE. |
| **P2** | **PWA / „Zum Homescreen"** | Daily-Habit, Retention. Meta-Tags da, Manifest fehlt. |
| **P2** | **Volltext-Suche / Kategorie-Filter im Archiv** | Aktuell nur Datum/Wirkung-Sort. |
| **P2** | **Slug als echte DB-Spalte** (statt slugify+id-prefix in-memory) | `getStoryBySlug` lädt ALLE Stories + filtert in JS — skaliert nicht über ~paar Tausend. |
| **P2** | **OG cold-render 36-45s** → pre-generieren (Python-Cron existiert, stillgelegt) ODER Edge-Cache-Warm | Erster Viewer wartet; danach CDN. Bei viraler Story = viele „erste". |
| **P2** | **`category_scores` decay** (alte Klicks verfallen) | Sonst „eingefrorene" Personalisierung. |
| **P3** | **Soft-Paywall / Optimist-Tier (Stripe)** | NUR nach Wachstums-Beweis (§1). Infra bereit (Stripe-MCP). |
| **P3** | **B2B-Pipeline aktiv verkaufen** | Braucht die Proof-Zahlen aus `nureine_events`. |

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

1. **Live gehen:** Supabase prod, echte API-Keys, Domain, `ADMIN_SESSION_SECRET`
   in Vercel, Brevo DNS (SPF/DKIM/DMARC). → ohne das kein Wachstum.
2. **Brevo-Echt-Versand testen** an 2-3 echte Adressen, Spam-Check.
3. **Social-Account-Setup** (IG + TikTok) + erste 7 Story-Reels aus bestehenden
   OG-Bildern.
4. **Story-Einreichen-Route** bauen (UGC + Engagement-Loop).
5. **Referral-Token** in Share-Links + `nureine_events`-Tracking.

---

## 6 · Was bewusst NICHT jetzt
- Paywall / Stripe (Wachstum first).
- B2B-Verkauf (braucht Proof-Zahlen).
- Native Apps (PWA reicht lange).
- Weitere Sprachen (DACH-Fokus erst dominieren).
