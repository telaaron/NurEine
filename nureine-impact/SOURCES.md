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
