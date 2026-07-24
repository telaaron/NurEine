# NurEine für Unternehmen — B2B-Seiten-Konzept (Route + Copy + Formular)

**Stand:** 2026-07-21 · **Umsetzung durch:** Agent · **Route:** `/fuer-unternehmen`
**Basis:** BUSINESS.md (B2B = einzige Monetarisierung, €499/799/999, Pilot-Garantie).
Diese Seite ist das Ziel des LinkedIn-Vertriebs (docs/LINKEDIN_KONZEPT.md) —
Custom-Button + Post 4 verlinken hierher.

## Aarons Entscheidungen (fix)

| Frage | Entscheidung |
|---|---|
| Ziel-Aktion | **Pilot anfragen** (30 Tage kostenlos) |
| Preise | **offen zeigen** — €499 / €799 / €999 |
| Kern-Nutzen | **Fertiger Content ohne Aufwand** (Hauptbotschaft) |
| Umfang | **volle Seite** |
| Referenzen | **ehrlich als Gründungsphase** — „erste 3 Pilotpartner gesucht" statt Fake-Logos |
| Formular | **Supabase-Tabelle + Brevo-Mail an Aaron** |

---

## Seitenstruktur (Abschnitte von oben nach unten)

### 1. Hero
- **H1:** „Guter Content für eure Kanäle. Jeden Tag. Ohne eine Minute Redaktionsarbeit."
- **Sub:** „NurEine liefert täglich eine belegte gute Nachricht — für eure
  Office-Screens, euren internen Newsletter, euer Intranet. Recherchiert,
  geschrieben und geprüft. Ihr müsst nichts tun außer sie zeigen."
- **Primär-CTA:** „30 Tage kostenlos testen" → scrollt zum Formular (Abschnitt 8).
- **Sekundär (Textlink):** „Wie funktioniert das?" → scrollt zu Abschnitt 3.
- Optik: Hero im Website-Stil (Creme-Canvas, Amber-Akzent, Serif-H1). Rechts der
  Amber-Kreis wie im OG/Banner, darin ein stilisierter Office-Screen-Mock
  (eine NurEine-Story auf einem Bildschirm).

### 2. Das Problem (kurz, spiegeln nicht predigen)
- **Überschrift:** „Nachrichten laugen aus. Den ganzen Tag."
- 3 knappe Zeilen: Eure Leute scrollen den ganzen Tag durch schlechte Nachrichten →
  das senkt Stimmung und Fokus (belegt) → und trifft genau die Bildschirme in
  Kantine, Wartebereich, Intranet, an denen sie täglich vorbeigehen.
- Kein Drama, keine Statistik-Schlacht. Ein Satz Empathie, dann weiter zur Lösung.

### 3. Die Lösung / So funktioniert's (3 Schritte)
- **Überschrift:** „Ein Strom belegter guter Nachrichten — automatisch."
- 3 Karten:
  1. **Wir recherchieren & schreiben.** Täglich aus hunderten Meldungen die eine
     mit echter Wirkung. Mit Quelle, mit Wirkungsindex, kein Kitsch.
  2. **Ihr bekommt sie fertig.** Per API-Feed auf eure Screens, als Baustein in
     eurem Newsletter, oder im Intranet. Whitelabel möglich.
  3. **Eure Leute sehen etwas Gutes.** Jeden Tag ein Lichtblick statt Krisen-
     ticker. Null Aufwand für euch.

### 4. Warum belegt (der USP, kurz)
- **Überschrift:** „Gute Nachrichten — aber keine erfundenen."
- Der Wirkungsindex + Quellenpflicht als Vertrauensanker. „Wir erfinden nie eine
  Zahl. Jede Quelle ist offen." → das unterscheidet uns von Wohlfühl-Kacheln und
  entkräftet die KI-Skepsis offensiv.

### 5. Preise (offen, 3 Tiers)
Drei Karten nebeneinander, mittlere hervorgehoben („beliebt"):

| Tier | Preis | Für wen | Enthält |
|---|---|---|---|
| **Screen** | €499/Mon | Ein Standort, Bildschirme | API-Feed für Office-Screens, Wartezimmer, Kantine · Whitelabel-Option |
| **Whitelabel** ⭐ | €799/Mon | Interne Kommunikation | Alles aus Screen + eigenes Branding + Integration in euren Firmen-Newsletter |
| **Enterprise** | €999/Mon | Mehrere Standorte | Alles aus Whitelabel + Multi-Standort + Priorisierter Support |

- Unter der Tabelle: **„Alle Tarife starten mit 30 Tagen kostenlos. Kein Vertrag,
  keine Kündigungsfrist im Pilot."**
- Jede Karte hat denselben CTA → Formular, mit vorausgewähltem Tier.

### 6. Pilot-Garantie (der Angst-Nehmer)
- Großer, ruhiger Block, ein Satz aus BUSINESS.md:
  > „30 Tage kostenlos auf euren Bildschirmen. Wenn eure Leute es ignorieren —
  > zahlt ihr nichts."
- Darunter klein: keine Kreditkarte nötig, kein Automatik-Abo, echte Menschen als
  Ansprechpartner.

### 7. Gründungsphase (statt Fake-Referenzen — EHRLICH)
- **Überschrift:** „Wir suchen unsere ersten drei Pilotpartner."
- Text: NurEine ist jung. Statt geliehener Logos bieten wir den ersten drei
  Unternehmen etwas Echtes: **Frühzugang, Mitgestaltung des Produkts und dauerhafte
  Sonderkonditionen.** Wer jetzt einsteigt, prägt mit, wie belegte Good News in
  Unternehmen aussehen.
- Das macht das Fehlen von Referenzen zur Chance — passt exakt zur ehrlichen Marke.
- (Sobald echte Testimonials da sind: dieser Block wird durch sie ersetzt.)

### 8. Anfrage-Formular (die Conversion)
- **Überschrift:** „Lasst uns 30 Tage testen."
- Felder: Firma*, Ansprechpartner*, E-Mail*, Interesse (Dropdown: Screen /
  Whitelabel / Enterprise / „weiß noch nicht" — vorbelegt aus Preis-Karten-Klick),
  optional Nachricht.
- Button: „Pilot anfragen".
- Rechtlich: kurzer Datenschutz-Hinweis + Link, kein Newsletter-Zwang-Häkchen.
- Nach Absenden: freundliche Bestätigung „Wir melden uns innerhalb von 24 Stunden."

### 9. Footer-Verweis
- Kurz: „NurEine gibt's auch kostenlos für alle → nureine.de" (B2C-Cross-Link).

---

## Technik

### Route
`src/routes/fuer-unternehmen/+page.svelte` (+ `+page.server.ts` nur, wenn nötig).
Nav: NICHT in die B2C-Hauptnav (verwirrt Leser) — eigene, schlanke Seite, verlinkt
aus LinkedIn, Footer und ggf. `/methodik`. In `src/routes/+layout.svelte` höchstens
ein dezenter Footer-Link „Für Unternehmen".

### Formular-Backend (Aarons Wahl: Supabase + Brevo)
1. **Additive Migration** `nureine_b2b_leads`:
   `id uuid, firma text, ansprechpartner text, email text, interesse text,
    nachricht text, quelle text (default 'website'), status text (default 'neu'),
    created_at timestamptz default now()`.
   NEUE Datei, nie eine alte editieren (harte Projektregel). RLS: nur Service-Role
   schreibt (Insert über Server-Endpoint, nicht Anon).
2. **Endpoint** `src/routes/api/b2b-lead/+server.ts` (POST):
   - Validiert Pflichtfelder, Honeypot gegen Bots.
   - INSERT in `nureine_b2b_leads` über den Server-Supabase-Client (Service Role).
   - Schickt Aaron eine Brevo-Mail (`sendBrevoEmail`-Muster aus newsletter.ts):
     Betreff „Neue B2B-Pilot-Anfrage: <Firma>", Body mit allen Feldern.
   - Antwort 200 → Frontend zeigt Bestätigung.
3. Kein Anon-Key-Insert vom Client (Projektregel: server-seitige Calls nur über
   den Service-Role-Client).

### Design
Website-Komponenten wiederverwenden (Farben, Fonts, Buttons aus app.css). KEINE
neue Design-Sprache. Preis-Karten im selben Stil wie bestehende Karten. Der Hero
nutzt Creme-Canvas + Amber-Kreis wie OG-Image/Banner — visuelle Klammer zur Marke.

---

## Reihenfolge für den umsetzenden Agenten

1. Migration `nureine_b2b_leads` (additiv) + RLS.
2. Endpoint `/api/b2b-lead` (Insert + Brevo-Mail an Aaron).
3. Seite `/fuer-unternehmen` mit allen 9 Abschnitten + Copy aus diesem Dokument.
4. Formular an den Endpoint hängen, Honeypot, Bestätigungs-State.
5. Footer-Link „Für Unternehmen" in `+layout.svelte`.
6. LinkedIn-Konzept aktualisieren: Custom-Button-Ziel = `/fuer-unternehmen` (steht
   dort als offener Punkt).
7. Verifizieren: Formular absenden → Zeile in `nureine_b2b_leads` + Mail bei Aaron.
