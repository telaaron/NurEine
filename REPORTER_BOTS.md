# Reporter-Bots — Architektur & Konzept

**Stand:** 2026-06-10 · Status: Konzept + Beat 1 (Klima) in Umsetzung

## Die Idee in einem Satz

NurEine berichtet nicht über den **Lärm**, den die großen Medien ohnehin schon
verstärken — sondern monitort **Primärquellen direkt** und findet die großen,
aber leisen Geschichten, die nie durch die Redaktions-Filter der etablierten
Medien kommen. Entschieden wird nach **Impact, nicht nach Reichweite des Lärms**.

## Warum das ein Moat ist

Jede andere Good-News-Seite aggregiert dieselben Medien-Artikel (Reuters, GNN,
Positive.News). Das ist Lärm zweiter Hand. Unser Unterschied:

1. **Primärquellen statt Medien.** WHO-Statistik-Updates, IRENA-Ausbaudaten,
   Patentregister, kommunale Open-Data, Studien-Preprints. Dort liegen die
   großen-aber-leisen Stories, bevor (oder ohne dass) ein Medium sie aufgreift.
2. **Transparenz.** Wir zeigen offen, WELCHE Primärquelle eine Story belegt und
   WELCHER Beat sie gefunden hat. Kein Konkurrent zeigt seinen Auswahlprozess.
   "Primärquelle, nicht von Medien weitergereicht" wird zum Qualitätslabel.
3. **Impact-Auswahl, nicht Klick-Auswahl.** Der Wirkungsindex (siehe
   ARCHITECTURE.md) entscheidet — nicht ob etwas viral ist.

## Die fünf Beats

Kein Personen-Branding (keine fiktiven "Lena/Max"-Personas — das wäre ein
Gimmick und intransparent). Stattdessen **sachliche Beat-Labels** + sichtbare
Primärquelle pro Story.

| Beat | Themen | Beispiel-Primärquellen |
|---|---|---|
| **Klima & Energie** | Energiewende, Emissionen, Naturschutz | IEA, IRENA, Ember, Fraunhofer ISE, Global Forest Watch, Our World in Data |
| **Gesundheit & Forschung** | Krankheitsrückgang, Zulassungen, Durchbrüche | WHO, ECDC, EMA, PubMed/Europe PMC, Uni-Kliniken, medRxiv |
| **Gesellschaft & Bildung** | Armut, Bildung, Gleichstellung, Rechte | Weltbank, UNESCO, UNICEF, Our World in Data, Amnesty-Erfolge |
| **Innovation & Wirtschaft** | Tech-Durchbrüche, Arbeitsplätze, Patente | EPO/USPTO, arXiv, Nature/Science, Cleantech-IR, Startup-Register |
| **Städte & Kommunen** | Infrastruktur, lokale Lösungen mit Modellcharakter | Open-Data-Portale, Stadtwerke, EU-Kommunalprogramme, C40 Cities |

## Die Pipeline (einmal gebaut, alle Beats teilen sie)

```
1. FETCH        Beat-Quellenkatalog (RSS · Sitemap · API · JSON)
                → eigener Cron-Takt je Beat
2. EXTRAKTION   Clean Text + Felder: Organisation · Datum · Region · Claim · Quellentyp
3. EVIDENZ      Quellentyp-Gewichtung. Primärquelle (peer-review / offizielle
                Statistik / Register) = hoch. Schwelle: kein Draft unter Mindest-Evidenz.
4. SCORING      Wirkungsindex 1-100 (Reichweite · Dauerhaftigkeit · Belegbarkeit).
                < 40 → Auto-Drop. (Bestehende Logik aus fetch_stories.py.)
5. DRAFT        Deutscher Story-Entwurf, Pflichtstruktur:
                  – Was ist passiert? (Fakten + Primärquelle)
                  – Warum relevant? (Wirkung, Zahlen)
                  – Grenzen / Limitationen (was die Quelle NICHT belegt)
6. QUEUE        Admin-Cockpit: Entwurf + Score + Quelle + Beat. Freigabe < 5 Min.
7. OUTPUT       Website · Newsletter · Audio · Social Cards (bestehender Stack).
```

Der bestehende `scripts/fetch_stories.py` ist bereits Schritt 2-7. Die Reporter-
Bots erweitern **Schritt 1** (Beat-spezifische Primärquellen) und ergänzen die
**Beat-Zuordnung + Quellentyp** in der DB für die Transparenz-Anzeige.

## Datenmodell (Erweiterung)

`nureine_stories` bekommt:
- `beat` TEXT — welcher Beat hat sie gefunden (klima-energie, gesundheit-forschung, …).
- `source_type` TEXT — Primärquellen-Typ (peer_review, official_stats, registry,
  open_data, gov, ngo, media). Steuert Evidenz-Gewichtung + Transparenz-Badge.

`nureine_rss_sources` (oder Beat-Katalog) bekommt:
- `beat` TEXT · `source_type` TEXT · `is_primary` BOOLEAN.

## Transparenz-UI

- **Story-Detailseite:** Badge "Beat: Klima & Energie · Primärquelle: IRENA"
  neben der Quelle. Bei `source_type=media` kein Primärquellen-Label (ehrlich).
- **/redaktion-Seite** (später): zeigt je Beat die monitorten Quellen + die
  letzten Funde. "So arbeiten wir" als Vertrauenssignal.

## Umsetzungsstand

1. ✅ **Konzept-Doc** (dieses Dokument).
2. ✅ **DB:** Migration 00027 (`beat` + `source_type` auf Stories + Quellen),
   00028 (`nureine_fetch_log` für Monitoring).
3. ✅ **Beats 1-4 verdrahtet** (13 Quellen, beat+source_type-getaggt):
   - **Klima & Energie:** Grist, CleanTechnica, pv magazine, Yale Climate.
   - **Gesundheit & Forschung:** WHO (official_stats, primär), Medical Xpress,
     STAT News, Johns Hopkins Hub (peer_review, primär).
   - **Gesellschaft & Bildung:** UN News (primär), The Conversation,
     Our World in Data (official_stats, primär).
   - **Innovation & Wirtschaft:** ScienceDaily Tech (peer_review, primär), TechXplore.
4. ✅ **Transparenz-Badge** auf Detailseite ("Beat: … · Quellentyp").
5. ✅ **Gründlicher beobachten:** max_per_run 6→10 — auch kleinere/tiefere Meldungen
   je Quelle werden neutral bewertet, nicht nur die Top-Schlagzeilen.
6. ✅ **Rejection-Logging:** jede Pipeline-Entscheidung (accepted / rejected_ai /
   rejected_prefilter + Grund + Score) landet in `nureine_fetch_log`.
7. ✅ **/admin/redaktion** Monitor: Quellen je Beat, Aufnahme/Ablehnung + Gründe,
   Score-Verteilung, letzte Entscheidungen.

## Noch offen (Phase 2)

- **Beat 5 — Städte & Kommunen:** verlässliche RSS-Feeds sind rar → braucht
  Open-Data-/API-Anbindung (kommunale Portale, C40, EU-Programme).
- **Echte Daten-Primärquellen per API:** WHO/Weltbank/OWID liefern Statistik-Updates
  ("Malaria-Tote -30%"), die NIE als Artikel erscheinen. Größter Moat. Pro API ein
  eigener Adapter, der Datenpunkte in bewertbare Story-Kandidaten übersetzt.
  (IRENA/Ember/EEA/CarbonBrief-RSS blocken Bots mit 403 → ebenfalls API-Pfad.)
- **/redaktion-Seite öffentlich:** das Admin-Monitoring als öffentliches
  Vertrauenssignal aufbereiten ("So arbeiten wir, diese Quellen, diese Funde").

## Leitprinzipien

- **Lieber leer als laut.** Eine leise echte Story schlägt zehn laute Aggregate.
- **Mensch entscheidet final.** Bots liefern belegten Rohentwurf, kein Auto-Publish
  ohne Freigabe (außer im bewusst aktivierten Autopilot).
- **Grenzen mitschreiben.** Jeder Draft sagt, was die Quelle NICHT belegt — das
  unterscheidet uns von reißerischem Good-News-Kitsch.
