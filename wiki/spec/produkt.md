# Spezifikation Produkt & Oberfläche — Neubau

> Stand 2026-09-09 · Fachteil „Produkt & UX" · Phase 1 des Rebuild-Plans.
> Grundlage: `wiki/00-LAGE.md`, `wiki/REBUILD-PLAN.md` §1/§2, VISION §1, §2, §3, §4, §9,
> §10, §18, D-04 bis D-18, D-20 bis D-28, `docs/STIMME.md`. Alt-Code ist Steinbruch (D-28).
> Offene Punkte sind mit **[CEO]** markiert und am Ende gesammelt. Nichts hier ist gebaut.

## 0. Der eine Satz

Drei Oberflächen, ein System: **Heute** sagt, was passiert ist und woher wir es wissen.
**Der Stand der Welt** sagt, wie die Welt ist. **Die Karte** sagt, wo. Jede Oberfläche
verweist auf die zwei anderen an genau einer Stelle, mit demselben Datenstand, nie mit
einer zweiten Zahl (16.12). Was nicht auf eine der drei Fragen einzahlt, wird nicht gebaut.

## 1. Nutzerreise in fünf Sätzen

1. **Erstbesuch (Suche, Link, Warm-100):** Man landet auf einer Story und sieht in den
   ersten zwei Bildschirmen Titel, Kern-Satz, Bild mit Kennzeichnung und den Block
   „Belegt durch" mit Primärquelle und Ort samt Genauigkeit. Das Versprechen: *Das hier
   stimmt, und du kannst es selbst prüfen.*
2. **Unter der Story** steht ein Satz aus dem Langzeitindex (Richtung, nie Niveau allein,
   D-05) und ein Link auf den Bereich, in den die Story gehört (D-10). Dann ein
   Newsletter-Feld. Dann Stille. Kein Grid mit sechs weiteren Geschichten.
3. **Newsletter-Klick (16 Abonnenten, 30 % Öffnung):** Der Link führt auf die Story-Seite,
   nicht auf `/`. Die Mail enthält dieselbe Story und denselben Index-Satz, nichts Drittes.
4. **Rückkehr ohne Login (VISION §9):** `/` zeigt die heutige Story als Titelseite, darunter
   den Index-Satz und die Karte mit dem heutigen Ort. Kommt jemand nach Tagen wieder,
   steht dort „Seit deinem letzten Besuch: 4 neue belegte Entwicklungen" aus LocalStorage,
   ohne Streak, ohne Schuldsprache. Das ist V2, nicht V1 (VISION §14, Phase 5).
5. **Das eine Versprechen** auf jeder Seite, im Header als Unterzeile: *Nur eine Verbindung
   zur echten Welt.* Nicht „gute Nachrichten", nicht „Lichtblick" (VISION §1, §10).

## 2. Informationsarchitektur

Ziel unterschritten: **10 öffentliche Seiten + 5 technische Endpunkte** (heute 118 Routen).
Navigation im Header: Heute · Stand der Welt · Karte · Archiv. Rechts: Newsletter.
Footer: Methodik · Über NurEine · Impressum · Datenschutz. Sonst nichts.

| Route | Zweck | Primärinhalt | Steinbruch (Alt-Code) | SEO-Pflicht |
|---|---|---|---|---|
| `/` | Titelseite: heutige Story + Index-Satz + Karte | Hero der Story des Tages, D-17-Satz mit 8-Balken-Leiste, Karten-Panel, „Diese Woche" (7 Zeilen), Newsletter | `src/routes/+page.svelte` (Hero-Block Z. 123–306, Wochenliste Z. 337–410), `+page.server.ts` | Title/Description im Layout · JSON-LD `NewsMediaOrganization`+`WebSite` (Graph aus `src/app.html`) · Sitemap 1.0 daily · llms.txt |
| `/geschichte/[slug]` | Die Story mit Beweis-Schicht (Kern, Abschnitt 3) | s. Abschnitt 3 | `src/routes/geschichte/[slug]/+page.svelte` (Kopf Z. 195–260, Wirkungsindex-Aside Z. 326–395), `+page.server.ts` | Title = Titel, Description = Kern-Satz (Layout-Fallback) · JSON-LD `NewsArticle` mit `citation` auf Primärquellen · Sitemap alle Stories (kein 1000er-Deckel, kein Impact-Filter) · OG-Bild `/api/og/[slug]` |
| `/stand-der-welt` | Der Langzeitindex (D-13 bis D-18) | V1 unverändert; neu: Verweis auf heutige Story im Bereich, Sperrklausel-Link | `src/routes/stand-der-welt/+page.svelte` + `+page.server.ts` + `src/lib/data/langzeitindex.json` + `scripts/index_build.py` **1:1** | Title mit Wert nur zusammen mit Bereichen (D-05) · JSON-LD `Dataset` (existiert) · Sitemap 0.8 monthly · llms.txt |
| `/karte` | Wo belegte Entwicklungen passieren | Leaflet, nur verifizierte Orte, Zeitregler, Story-Karte bei Klick | `src/routes/karte/VariantLiveFeed.svelte` (Zeitraffer Z. 60–130, Marker Z. 196–300), `src/lib/map/basemap.ts`, `glow-marker.ts`, `src/lib/styles/leaflet-shared.css`, `MobileStorySheet.svelte` | Title/Description im Layout · Sitemap 0.7 · kein JSON-LD |
| `/archiv` | Alle Stories, crawlbar, ohne Filter-Deckel | Monatsblöcke, je Story eine Zeile (Datum, Titel, Ort, Wirkung) | `src/routes/archiv/alle/+page.svelte` (Struktur), Lehre aus `nureine-archiv-zwei-deckel` | Title/Description im Layout · Sitemap 0.8 daily · interne Links = einzige Waisen-Sicherung |
| `/archiv/[jahr-monat]` | Monatsseite, hält `/archiv` klein | wie oben, ein Monat | neu | Description dynamisch aus Monat · Sitemap |
| `/methodik` | Wirkungsindex + Langzeitindex + Sperrklausel + drei Sätze + Verliererliste | s. Abschnitt 5 | `src/routes/methodik/+page.svelte` (Filter-Teil), VISION 16.6/16.8 wörtlich | Title/Description im Layout · Sitemap 0.7 · llms.txt · meistverlinkte Seite (17 Refs) bleibt |
| `/newsletter` | Anmelden, Bestätigt, Abgemeldet (ein Template, drei Zustände per Query) | Formular, Erklärung „eine Story + ein Satz zum Stand der Welt, täglich 06:20" | `src/lib/components/InlineNewsletter.svelte`, `/api/subscribe`, `/api/confirm`, `/api/unsubscribe` | Title/Description im Layout · Sitemap 0.8 · Abmelde-Zustand `noindex` |
| `/ueber-uns` | Was NurEine ist, warum, wer (ersetzt `/warum`, `/werte`, `/manifest`, `/redaktion`) | Begriffsklärung (Film/Chemikalie), Betreiber, Prinzipien in 6 Sätzen, Gründerfoto | `src/routes/ueber-uns/+page.svelte` (Entity-Teil), Prosa aus `/warum` | Title/Description im Layout · JSON-LD `AboutPage` · Sitemap 0.9 · llms.txt · Wikidata `sameAs` bleibt |
| `/impressum`, `/datenschutz` | Pflicht | Text | 1:1 übernehmen, Betreiberangabe prüfen | Sitemap 0.2 |
| `/go` | Attributions-Redirector (D-27, Warm-100) | 302 + Event | `src/routes/go/+server.ts` (App-Store-Zweig raus) | `noindex`, nicht in Sitemap |
| `/img` | Bild-Proxy (harte Regel CLAUDE.md) | WebP, skaliert, 1 Jahr Cache | `src/routes/img/+server.ts`, `src/lib/story-images.ts::storyImageSrc` **1:1** | — |
| `/api/og/[slug]` | OG-Bild pro Story | Satori, statische Fonts | `src/lib/server/og/` | — |
| `/sitemap.xml`, `/llms.txt`, `/robots.txt` | Auffindbarkeit | Listen aus dieser Tabelle | Server-Routen übernehmen, Listen neu schreiben | Pflicht bei jeder neuen Route (Memory: SEO-Checkliste) |

**Redirects (301) beim Umzug:** `/warum`, `/werte`, `/manifest`, `/redaktion` → `/ueber-uns` ·
`/archiv/alle`, `/archiv/[kategorie]`, `/gute-nachrichten/*` → `/archiv` · `/heute`,
`/lichtblick`, `/gute-nachrichten-app`, `/app/*` → `/` · `/bei-dir` → `/karte` · Rest 410.
GSC zeigt 0 Klicks in 28 Tagen; es geht kein Ranking verloren, nur bestehende Links.

## 3. Die Story-Seite als Kern

Eine Spalte, max. 680 px Textbreite, keine Seitenleiste. Reihenfolge von oben nach unten.
Datenquelle „Story" = neue Tabelle `stories`, „Evidence" = neue Tabelle `evidence`
(Felder nach VISION 4.2 `StoryEvidence`), „Index" = `langzeitindex.json`.

| # | Block | Zweck | Pflicht | Datenquelle / Regel |
|---|---|---|---|---|
| 1 | **Kopfzeile** | Datum · Bereich · Ort-Kurzform | Pflicht | Story `published_at`, `bereich` (s. [CEO] P-2), `placeLine()` aus `src/lib/place.ts` |
| 2 | **Titel** (H1) | Was passiert ist, als Aussage, ≤ 70 Zeichen wie der Betreff | Pflicht | Story `title`; Stil `docs/STIMME.md` §9.3 |
| 3 | **Kern-Satz** | Der eine Fakt mit Zahl, der die Story in eine Reihe stellt (STIMME §1) | Pflicht | Story `dek`; ersetzt die alte `summary` |
| 4 | **Bild + Kennzeichnung** | Bild nur ab Wirkung 75 (3-Stufen-Modell); Label direkt unter dem Bild, nicht im Footer | Pflicht wenn Bild | `storyImageSrc(hero, base, 1800)`; Label `Illustration, KI-generiert. Zeigt nicht den Ort der Geschichte.` (VISION 4.5). Ohne Bild: Typo-Karte in Bereichsfarbe, kein Fallback-Foto |
| 5 | **Text** | 900 / 1.400 / 2.000 Zeichen nach Wirkung (STIMME §7); Brücke bei DACH-Relevanz < 70 (§8b); Schluss A oder B (§5) | Pflicht | Story `body`; `sections()` aus `src/lib/utils.ts` |
| 6 | **Belegt durch** | Das Beweis-Modul (VISION 4.1). Nur vorhandene Zeilen, keine leeren Haken | Pflicht: ≥ 1 Quelle mit Typ. Primärquelle: Pflicht für Titelstory [CEO] P-3 | Evidence `primarySources[]` (Titel, Herausgeber, Typ-Label „Amtliche Daten / Studie / Behörde / NGO-Bericht / Institution / Journalismus", Datum), `independentSources[]`. Fehlt die Primärquelle: Zeile `Primärquelle nicht gefunden. Berichtet von <Medium>.` sichtbar, nicht versteckt |
| 7 | **Die Zahl im Kontext** | Eine zentrale Zahl, ein Bezugsrahmen (VISION 3.2): Verlauf, Zielanteil, Größenvergleich, Unsicherheit | Pflicht wenn Story eine Zahl trägt; sonst Block entfällt | Evidence `numberContext {value, unit, frame, source}`; erzeugt in der Pipeline, geprüft im Admin. Kein Balken ohne zählbaren Rest (16.11) |
| 8 | **Hier passiert es** | Ort mit Genauigkeits-Label, reduzierter Kartenausschnitt (statisches Bild oder Mini-Leaflet ohne Interaktion), Link `Auf der Karte` | Optional; nur bei `precision` exact/city/region | Evidence `location {label, precision}`; Label-Text: `genauer Ort` / `Stadt` / `Region` / `ungefähres Projektgebiet`. `country` → kein Kartenblock, nur Kopfzeile (Memory: Ortsauflösung) |
| 9 | **Wirkung** | Story-Wirkungsindex, klar getrennt vom Langzeitindex (VISION §2) | Pflicht | Story `impact_score` + 3 Achsen, kompakt: eine Zeile „Wirkung 82 · Reichweite 80 · Dauer 90 · Beleg 75", aufklappbar; Steinbruch Aside Z. 326–395 |
| 10 | **Im großen Bild** | Verbindung zum Langzeitindex **neben** der Kurve (D-10): drei Zeilen Bereich / Größenordnung / Mechanismus + Link `/stand-der-welt#<bereich>` | Optional; nur wenn zugeordnet, auch zu fallenden Bereichen | Evidence `indexLink {bereich, magnitude, mechanism}`; nie ein Zahlbeitrag, nie ein Marker auf der Kurve |
| 11 | **Epilog** | „Eine Story, dann Stille." Genau drei Elemente: (a) Index-Satz nach D-17 mit Mini-Balkenleiste, (b) Newsletter-Feld, (c) eine Zeile `Gestern: <Titel> →` | Pflicht | (a) `langzeitindex.json`, Satz generiert; (b) `InlineNewsletter` mit `source=story_end`; (c) Vorgänger-Story. **Gestrichen:** „Ähnliche Geschichten"-Grid, Wochenbilanz/Streak, Vorlesen, Audio, Klang |
| 12 | **Teilen** | Eine Zeile unter dem Titelblock: WhatsApp · Link kopieren | Pflicht | `ShareBar.svelte` auf zwei Ziele reduziert; Text = Kern-Satz + URL |

Mobil bleibt die Reihenfolge; Block 8 und 10 sind auf Mobil eingeklappt (Titel sichtbar, ein Tap).

## 4. Startseite

**Empfehlung: Titelseite, nicht Volltext.** `/` zeigt die heutige Story als Hero (Titel,
Kern-Satz, Bild mit Kennzeichnung, Beweis-Kurzzeile `Belegt durch WHO · Kampala (Stadt) ·
Illustration`, Knopf `Lesen`), darunter drei Zeilen, die die Säulen zusammenbinden:

| Position | Block | Inhalt | Warum so |
|---|---|---|---|
| 1 | Hero | heutige Story, s. o. | trägt 90 % des Interesses |
| 2 | **Stand der Welt** als Kontextzeile | D-17-Satz `5 von 8 Bereichen steigen seit 2005. Ökologie fällt.` + 8-Balken-Leiste (D-14, Ebene 3) + `Datenstand 2023` + Link | D-05 verbietet die Zahl ohne ihre Bereiche; die Leiste liefert sie visuell in einer Zeile. Kein Count-up (VISION §10) |
| 3 | **Karte** als Panel | statisches Kartenbild (kein Leaflet auf `/`) mit dem heutigen Ort, wenn verifiziert, sonst die letzten 30 verifizierten Orte; Zeile `43 Orte in 30 Tagen` + Link | Leaflet kostete auf `/karte` ~600 Zeilen und Ladezeit; die LCP von `/` lag bei 5,3 s (app.html-Kommentar). Ein Bild lädt in einer Anfrage |
| 4 | Diese Woche | 7 Zeilen: Tag, Titel, Ort, Wirkung | Rückkehrer sehen, was sie verpasst haben, ohne Grid |
| 5 | Newsletter | ein Feld, ein Satz | einziger funktionierender Kanal |

**Alternative (nicht empfohlen): `/` = Volltext der heutigen Story.** Vorteil: kein Klick
im Morgenritual. Nachteile: zwei URLs mit demselben Text am selben Tag, Analytics
verschmieren (Story-Traffic ist die einzige saubere Kennzahl), OG-Bild von `/` wechselt
täglich. Falls Aaron das Ritual höher gewichtet: Volltext, aber `rel=canonical` auf
`/geschichte/[slug]` und `/` ohne eigene Description. **[CEO] P-1.**

Karte als Einstieg? Nein. 7 Besucher im Monat bei 9 Verweisen zeigen: Die Karte ist eine
Antwort auf „wo?", keine Startfrage. Sie wird über Story (Block 8) und `/` (Panel) erreicht.

## 5. Stand der Welt

Bleibt fachlich und optisch, wie unter D-13 bis D-18 gebaut (`/stand-der-welt`, V1, Commit
`845f1b2`). Änderungen nur in der Einbettung:

| Änderung | Inhalt |
|---|---|
| Anker pro Bereich | `#ueberleben`, `#oekologie` usw., damit Story-Block 10 direkt landet |
| Rückverweis | Unter jedem Bereich: `Heute in diesem Bereich: <Titel> →`, wenn eine Story zugeordnet ist; sonst nichts. Kein Marker auf der Kurve (D-10) |
| Hero-Regel | Zahl nie ohne Bereichsleiste im selben Viewport (D-05); Title-Tag nur `Der Stand der Welt · 5 Bereiche steigen, 1 fällt`, nicht die Zahl allein |
| Verliererliste | Abschnitt „Geprüft und verworfen" mit Begründung (D-11) auf `/methodik`, von hier verlinkt |
| Statisch | Daten weiter aus `langzeitindex.json`, prerendered; kein Supabase-Call (D-09, überlebt 402) |

**Methodikseite, wörtlich und sichtbar, nicht im Kleingedruckten:** die drei Sätze aus 16.8
und die Sperrklausel (D-26), eingeleitet mit einem Satz:

> Fällt der Langzeitindex in einem Datenstand, ist das die Titelmeldung des Tages, mit
> derselben Prominenz wie jeder Anstieg. Ab diesem Tag ändern wir zwölf Monate lang weder
> Indikatoren noch Anker noch Gewichte, außer zur Korrektur eines nachgewiesenen
> Rechenfehlers, den wir einzeln, öffentlich und mit Vorher-Nachher-Wert dokumentieren.

Darunter der Wortlaut aus VISION 16.6 als Zitat mit Datum der Selbstverpflichtung (2026-09-08).

## 6. Karte

| Regel | Festlegung |
|---|---|
| **Was gezeigt wird** | Nur Stories mit `evidence.location.precision ∈ {exact, city, region}`. Region als Fläche oder Punkt mit größerem Radius, nie als scharfer Pin. `country` und überregionale Meldungen erscheinen **nicht** (Memory: Ortsauflösung, ~⅓ der Stories hat einen echten Ort; lieber 400 richtige Punkte als 1.300 Zentroide) |
| **Pin-Klick** | Karte: Datum, Titel, Ort mit Genauigkeits-Label, Wirkung, `Lesen →`. Mobil als Sheet (`MobileStorySheet.svelte`) |
| **Zeitregler** | 7 Tage · 30 Tage · 12 Monate · Seit Start. Standard 30 Tage. Kein „24 Stunden" (eine Story am Tag). Rechts eine Zeile: `43 Orte · 12 Länder`, keine Wirkungssumme (VISION 5.2: keine Behauptung, die Welt werde durch Story-Anzahl besser) |
| **Filter** | Bereich (8 Index-Bereiche), sonst keiner. Indikator-Filter (5.3) ist V2 |
| **Update-Moment** | Neue Punkte des Tages erscheinen mit dem bestehenden Glow-Marker (`glow-marker.ts`), einmal, dezent. `prefers-reduced-motion` respektiert |
| **Basemap** | ArcGIS-Kacheln aus `basemap.ts` bleiben (extern, kein eigener Egress); Alternative Protomaps/eigener Stil ist V2 |
| **Gestrichen** | „Puls der Welt"-Seitenleiste (`src/lib/world-index.ts` rechnet anders als der Langzeitindex, zwei Zahlen verboten, 16.12) · Klang/`livePulse()` (Klang-Schicht gekillt) · Nutzer-Standort-Marker und `/bei-dir` [CEO] P-4 · Intro-Zeitraffer beim Laden (wird zu Zeitregler-Funktion) · Ton-Filter nach Farbe |

Datenbasis für den Import der 1.330 Alt-Stories: `place_scope != 'none'` und `lat/lng`
gesetzt → `precision = city`; alles andere ohne Ort. Nachverortung ist Pipeline-Thema.

## 7. Designsystem-Übernahme

Entschieden (D-25): Newsreader, warmes Papier, Anthrazit-Dark, Heroicons, Tailwind v4.

| Bestand | Übernahme | Datei |
|---|---|---|
| Farb-Tokens Light + Dark, Schatten, `surface-ink`/`on-accent`-Paare | **1:1** | `src/app.css` Z. 1–140 (`@theme` + `@media (prefers-color-scheme: dark) :root`) |
| Typo-Utilities `.serif .display .tnum .eyebrow .badge .meta .page-h1 .page-dek` | 1:1 | `src/app.css` Z. 156–260 |
| Fonts | Newsreader (Text, Deks), Space Grotesk (Titel), Inter (UI). JetBrains Mono nur auf `/stand-der-welt` für Tabellenzahlen; sonst raus [CEO] P-5 | `src/app.html` Font-Link (render-non-blocking-Muster übernehmen) |
| Dark Mode | folgt System, kein Schalter (Aaron 2026-07-20) | wie oben |
| Icons | ausschließlich Heroicons über `Icon.svelte`; Ausnahme Leuchtturm-Logo und OG-Renderings | `src/lib/components/Icon.svelte` 1:1 |
| Komponenten 1:1 | `Icon.svelte`, `InlineNewsletter.svelte`, `MapLegend.svelte`, `MapLoadingOverlay.svelte`, `MobileStorySheet.svelte`, `MaintenanceNotice.svelte` | `src/lib/components/` |
| Komponenten als Steinbruch (Optik ja, Props neu) | `Header.svelte` (Nav auf 4 Einträge), `Footer.svelte`, `StoryCard.svelte` (ohne sensitive/audio/freshness), `ShareBar.svelte` (2 Ziele), Story-Kopf und Wirkungs-Aside der Story-Seite, Hero-Block von `/` | s. Abschnitt 2 |
| Bibliotheken | `storyImageSrc` + `/img`-Proxy, `utils.ts` (`formatDate`, `sections`, `inline`, `toneStyles`), `place.ts` (`hasRealPlace`, `placeLine`, `placeDetail`; `newspaperName`/`issue*` raus), `leaflet-shared.css`, `map/basemap.ts`, `map/glow-marker.ts` | `src/lib/` |
| SEO-Muster | `pathTitles`/`pathDescriptions` zentral im Layout, JSON-LD-Graph, Satori-OG mit statischen Fonts | `src/routes/+layout.svelte` Z. 36–150, `src/app.html`, `src/lib/server/og/` |
| **Bewusst nicht** | `src/lib/sound/`, `readingStreak.ts`, `referral*.ts`, `sensitive.ts` [CEO] P-10, `Ticker.svelte`, `PaperMasthead/PaperStory` (Lokalzeitung), `Archive*.svelte`, `CountUp/DrawPath/ScrollScreen` (Animationen ohne Datengrund), `B2BForm`, `src/lib/app-v2/`, `src/routes/app/`, `map/user-marker.ts`, Passkeys | — |

Farb-Töne (amber/sage/rose/sky) hängen heute an Kategorien. Im Neubau hängen sie am
Index-Bereich (8 Bereiche → 4 Töne, Zuordnung in einer Tabelle in `categories.ts`).

## 8. Admin: eine Seite

`/admin` (Login per `ADMIN_SESSION_SECRET`-Cookie wie heute, `/admin/login`; keine
Passkeys). Vier Blöcke untereinander, keine Unterseiten. Steinbruch: `src/routes/admin/+page.svelte`
Block „Heutige Hero-Story" (Z. 241–275) und Health-Block (Z. 471–486).

| Block | Inhalt | Aktionen |
|---|---|---|
| **1 · Freigabe** | Kandidat für morgen: Titel, Kern-Satz, Bild mit Label, Text; Beweis-Checkliste mit Ampel: Primärquelle vorhanden · Zahl-Kontext geprüft · Ort + Genauigkeit · Bild-Kennzeichnung · Länge nach Wirkung · Blacklist-Treffer (STIMME §6) | `Freigeben` · `Kandidat 2/3 nehmen` · `Zurückstellen` · Inline-Edit für Titel, Kern-Satz, Zahl-Kontext, Ortsgenauigkeit. Ohne Freigabe bis 05:30 geht der bestgeprüfte Kandidat automatisch raus (Regel sichtbar) |
| **2 · Betrieb** | Letzter Pipeline-Lauf (Zeit, Status, Artikel rein/raus, Dauer) · Newsletter (gesendet an N, Öffnungen gestern) · Index-Build (Datum, Vintage) · Healthcheck-Ampeln: Story für morgen da? Newsletter raus? Sitemap aktuell? | `Pipeline jetzt` (ein Knopf, idempotent) |
| **3 · Kosten** | Heute / Monat je Posten: DeepSeek, fal, Claude-Agenten (`total_cost_usd`), Brevo-Kontingent; Messlatte D-24 sichtbar: `Ziel < 8 $/Nacht` | keine |
| **4 · Abonnenten** | bestätigt / unbestätigt, Zugänge 7 Tage, Abmeldungen 7 Tage | `Test-Mail an mich` |

Kein Funnel-Dashboard, keine Kategorien-Statistik, kein B2B, kein Social, kein Audio, kein
Vision-Editor (VISION.md lebt im Repo).

## 9. Leere- und Fehlerzustände

| Zustand | Wo | Verhalten |
|---|---|---|
| Keine Story für heute | `/`, Newsletter | `/` zeigt die letzte Story mit Datum und der Zeile `Heute keine neue Geschichte. Die letzte ist vom <Datum>.` Newsletter wird **nicht** gesendet (Tages-Sperre, kein Wiederholungsversand); Admin-Ampel rot, Healthcheck-Mail |
| Index nicht aktualisiert | `/stand-der-welt`, Kontextzeilen | Statisches JSON bleibt gültig; Anzeige `Datenstand 2023, Stand der Berechnung <Datum>`. Älter als 60 Tage: Admin-Ampel gelb, öffentlich keine Warnung (der Index ändert sich jährlich) |
| Bild fehlt oder Proxy-Fehler | Story, `/`, Karte | Typo-Karte in Bereichsfarbe mit Kern-Satz; nie ein Fallback-Foto, nie ein leeres `<img>` (`storyImageSrc` liefert `''`) |
| Ort unbekannt | Story, Karte | Block 8 entfällt, Kopfzeile zeigt nur das Land; Story ist nicht auf der Karte. Kein „ungefähr", wenn nichts bekannt ist |
| Primärquelle fehlt | Story Block 6 | Sichtbare Zeile `Primärquelle nicht gefunden. Berichtet von <Medium>.`; Story darf nicht Titelstory werden [CEO] P-3 |
| Zahl ohne Kontext | Story Block 7 | Block entfällt; Admin-Ampel gelb; Pipeline versucht nicht, einen Kontext zu erfinden |
| Supabase nicht erreichbar (402/5xx) | alle | `/stand-der-welt` und `/methodik` sind prerendered und laufen weiter; `/` und Story zeigen `MaintenanceNotice` mit der letzten gecachten Story (ISR/Edge-Cache 1 h); Karte zeigt Hinweis statt leerer Welt |
| Newsletter-Bestätigung abgelaufen | `/newsletter?zustand=abgelaufen` | Ein Satz, neues Formular |
| Archivmonat leer | `/archiv/[jahr-monat]` | 404 mit Link auf `/archiv` |

## 10. Was ausdrücklich nicht gebaut wird

- Kein Login, kein Profil, keine Einstellungen-Seite, keine Passkeys, kein Journaling.
- Keine App, keine App-Seite, kein App-Store-Zweig in `/go`, kein Web-Push in V1.
- Kein B2B, keine Preise, kein Unternehmens-Formular, kein Branding.
- Kein Themen-/Länder-Hub, kein `/gute-nachrichten/*`, keine Kategorieseiten.
- Keine Streaks, keine Wochenbilanz, keine Badges, kein Count-up, kein Konfetti, kein Klang.
- Kein Vorlesen, kein Audio-Bucket, kein Podcast.
- Keine Ich-Erzählung (E-06): höchstens ein wörtliches, belegtes Zitat mit Name und Rolle im Text.
- Kein Story-Marker auf der Indexkurve, kein Zahlbeitrag einer Story zum Index, kein Tageszähler (D-09, D-10).
- Kein zweites Index-System auf der Karte (16.12).
- Keine Satelliten-Vorher/Nachher, kein Schätzspiel, kein „Seit deinem letzten Besuch" in V1 (V2-Kandidaten, VISION §14).
- Kein Ticker, keine Lokalzeitung („Teltower Lichtblick"), keine Teilen-Kartengeneratoren (`/teilen`, `/heute`, WhatsApp-/Edition-Cards).
- Kein Einreichen-Formular, keine Unterstützerliste, keine öffentliche Roadmap-Seite.
- Keine Admin-Unterseiten. Keine Story-Bearbeitung außerhalb der vier Felder in Block 1.

## 11. Entscheidungen für den CEO

| # | Frage | Empfehlung | Warum |
|---|---|---|---|
| P-1 | `/` als Titelseite (Teaser) oder Volltext der heutigen Story? | **Teaser** | Eine URL pro Story hält Analytics und SEO sauber; Ritual-Kosten = ein Tap |
| P-2 | Ordnungssystem: alte Kategorien (gesundheit, tiere, …) oder die 8 Index-Bereiche als einziges Feld? | **8 Index-Bereiche + optional „außerhalb des Index"** (z. B. Kultur) | Ein System statt zwei; Block 10 und Karten-Filter brauchen den Bereich ohnehin. Unsicher: Tiere/Biodiversität fällt unter Ökologie, das kann sich flach anfühlen |
| P-3 | Primärquelle Pflicht für Veröffentlichung? | **Pflicht für die Titelstory, ehrliches Label für alle anderen** | Sonst gibt es Tage ohne Story; das Label ist selbst ein Vertrauenssignal |
| P-4 | `/bei-dir` und Nutzer-Standort auf der Karte killen? | **Ja** | Nicht in REBUILD-PLAN §1; Standort ist V2-Knopf auf der Karte, wenn je gefragt |
| P-5 | Fonts von vier auf drei (JetBrains Mono nur SdW-Tabelle) | **Ja** | Ein Request weniger auf jeder Seite; Optik bleibt |
| P-6 | Karten-Datenbasis: nur `exact/city/region`, Landesebene nie auf der Karte | **Ja** | Ein falscher Pin kostet mehr Vertrauen als 900 fehlende |
| P-7 | Archiv als Monatsseiten statt Kategorie-Seiten | **Ja** | Crawlbarkeit ohne Deckel, 12 Seiten pro Jahr statt 9 Kategorien mit Filterlogik |
| P-8 | Teilen auf WhatsApp + Link kopieren reduzieren | **Ja** | Alles andere hatte keine messbare Nutzung |
| P-9 | E-06 Ich-Perspektive endgültig streichen, Ersatz „Stimme aus der Quelle" (Zitat-Block) | **Streichen, Zitat-Block ohne eigenes Format** | Erfundene Zeugenaussage entwertet die Beleg-Achse |
| P-10 | Jugendschutz-Verhüllung (`sensitive`) übernehmen? | **Nein** | Titelstory geht durch Freigabe; ein Flag mit Blur ist Komplexität für einen Fall pro Monat |

## 12. Human-TODO-Kandidaten (nur Aaron)

- Sperrklausel-Wortlaut (Abschnitt 5) einmal lesen und freigeben; er steht dann mit Datum
  auf `/methodik` und ist danach zwölf Monate gebunden.
- Betreiberangabe festlegen: JSON-LD und `/ueber-uns` sagen heute „Teltow", das Impressum
  „Aaron Technologies OÜ, Tallinn". Eine Version für alle Stellen.
- Gründerfoto für `/ueber-uns` ablegen (offen seit Juni).
- Redirect-Liste (Abschnitt 2) abnicken, besonders `/warum` und `/werte` (Sitemap-Priorität 0.9, aber 0 Klicks).
- Warm-100-Ziel-URL festlegen: `/go?src=warm&to=/` oder direkt auf die Story des Tages.
- Newsletter-Texte für Bestätigung und Abmeldung freigeben (Ich-Stimme erlaubt, STIMME §4).
