# SOURCES — Quellen-Strategie & Recherche-Log

> Welche Quellen liefern Resonanz, welche nur Größe. Grundlage: Diagnose über
> 462 bewertete Stories (2026-06-27) + tiefe Web-Recherche nach neuen Quellen.
> Laufende Diagnose: View `nureine_source_quality`.

---

## Prinzip

NurEine zeigt die EINE Story, die berührt — nicht die größte. Quellen werden danach
bewertet, ob sie **Resonanz** liefern (konkrete menschliche Szenen), nicht nur
Impact (Größe). `hero_eligible=false` = Quelle bleibt als Beleg aktiv, ist aber
kein Hero-Kandidat.

## Diagnose-Befund (2026-06-27, 462 Stories)

**Resonanz-Lieferanten (Bestand):** Reasons to be Cheerful (26% stark),
Positive.News, The Optimist Daily, Good News Network (meiste Perlen).
**Größe ohne Resonanz → hero_eligible=false:** WHO, UN, Weltbank, Our World in Data.
**Übergewicht:** Mongabay (113 Stories ≈ ¼ des Bestands, nur 1,8% stark).
Nur **1,3%** aller Stories rissen die Perlen-Schwelle (≥7.5).

## Neu aufgenommen (2026-06-27, Migration 00037, Feeds live verifiziert)

| Quelle | Fit | Pro | Contra |
|---|---|---|---|
| **The Better India** | HIGH | Tägliche menschl. Solutions-Szenen, 75% echt, füllt Global-South-Lücke | 25% Filler (Pipeline siebt) |
| **Global Voices Good News** | HIGH | 200+ Länder, echte Szenen mit Namen, macht uns wirklich global | nur bi-wöchentlich → Feeder |
| **Christian Science Monitor** | HIGH | Seriöse People-Making-a-Difference-Stücke, null Kitsch | 70% normale News → Vorfilter nötig |
| **Squirrel News** | DISCOVERY | Roundup der weltbesten Konstruktiv-Stories, vorgefiltert | keine Einzelszene → nicht direkt Hero |
| **DailyGood** | HIGH | Literarisch, anti-Clickbait, ~1 Story/Tag — NurEines Zwilling | manche Einträge Essays statt News |

## Hochdichte-Quellen (Runde 2, 2026-06-27) — Preise/Fellowships gegen die Knappheit

Befund: an 59 % der Tage riss KEIN Kandidat die 7.0-Schwelle. Lösung: vor-kuratierte
Resonanz aus Preisen/Fellowships (Experten haben Held:innen schon ausgewählt).
Tiefe Recherche, alle Feeds live verifiziert 2026-06-27.

**Aufgenommen (RSS live, hero_eligible):**
| Quelle | Pro | Contra |
|---|---|---|
| **Goldman Environmental Prize** (`/blog/feed/`) | 7 Graswurzel-Umwelthelden/Jahr + Blog, David-vs-Goliath-Arc, Global South | saisonal (April), Blog mischt Themen-Essays |
| **Ramon Magsaysay** (`rmaward.asia/feed/`) | "Asiens Nobel", echte Wendepunkt-Citations, non-westliche Vielfalt | Asien-only, saisonal Aug/Sep |
| **Whitley Awards** (`whitleyaward.org/feed/`) | ~7 Naturschutz-Held:innen, charismatische Arten, Global South | bursty um April/Mai, projekt-first-Framing |
| **StoryCorps** (`feeds.npr.org/510200/podcast.xml`) | First-Person-Menschengeschichten, höchste Resonanz, Description hat echten Story-Text | Audio (nur Description nutzbar, kein itunes:summary), bi-wöchentlich, Multi-Story-Folgen |

**Verworfen Runde 2:**
- **Right Livelihood** (Feed live) — politisch/schwer (Dissidenten, Klagen) → Fit-Risiko für Hoffnungs-Plattform.
- **GiveDirectly** (Feed live) — aktuell stats/research-lastig, Einzelschicksale (GDLive) NICHT im Feed.
- **Skoll Award** (Feed live) — Org/Systems-Sprache, kaum menschlich. **Tyler/Rolex** — kein RSS, biennial.

**Vorgemerkt (kein RSS / Bot-blockiert → Scraper nötig, hohes Potenzial):**
- **Undue Medical Debt** (`unduemedicaldebt.org/stories/`, 403) — EXAKT NurEines Perlen-Archetyp.
- **Heifer International** (`heifer.org/blog`, kein RSS, sauberer 404) — benannte Familien, before/after.
- **Aurora Prize** — höchste Einzel-Resonanz, aber ~1/Jahr + JS-Site.
- **Ashoka Fellows** — rollend, hunderte/Jahr, aber Cloudflare-blockiert, kein RSS (Scrape `community.ashoka.org/en/news`).
- **CNN Heroes, Pritzker, Global Teacher Prize, GoFundMe, charity:water, Kiva** — siehe Recherche-Log.

## Vorgemerkt (brauchen Sonderbehandlung — noch nicht aufgenommen)

- **StoryCorps (NPR)** `feeds.npr.org/510200/podcast.xml` — HÖCHSTE Resonanz
  ("Kloß im Hals"-Register), aber **Audio-Feed** → Transkript-Auswertung nötig.
- **Guardian "The Upside"** `/world/series/the-upside/rss` — redaktionell top,
  Feed-URL nicht headless verifizierbar (Guardian blockt Bots) → manuell prüfen.
- **bird story agency** — pan-afrikanisch, exzellent, **kein RSS** (Substack/E-Mail)
  → Outreach (sie wollen Republisher).
- **Bhekisisa** `bhekisisa.org/feed/` — Südafrika/Gesundheit, gut, aber **403 für
  generische Bots** → erst prüfen ob das Python-Fetch-Script durchkommt.

## Verworfen (Ehrlichkeit)

- **Sunny Skyz, Good Good Good** — zu hohes Viral-Stunt-/Kitsch-Risiko
  ("Influencerin füllt Pool mit 50.000 Gurken"). Genau der Lärm, den wir hassen.
- **Prime Progress** — Feed seit ~8 Monaten tot/gehackt (Gambling-SEO-Spam).
- **Goodnet** — Feed 404. **Global South World / The Continent** — kein RSS.
- **AllAfrica / VOA / Africanews** — reine Wire-Services, Lärm-Flut, kein Fit.
- **Chinese-state-media "constructive journalism"** — SEO-Falle, propaganda-nah.

## Nächste Outreach-Schritte (Phase B)

1. Nach 1-2 Wochen: `nureine_source_quality` prüfen — liefern die 5 Neuen Perlen?
2. StoryCorps-Audio-Pfad bauen (eigener Schritt) — höchstes Resonanz-Potenzial.
3. bird story agency anschreiben (pan-afrikanischer Wire, free-to-republish).
4. Mongabay-Übergewicht beobachten — ggf. drosseln, wenn es den Pool verzerrt.
