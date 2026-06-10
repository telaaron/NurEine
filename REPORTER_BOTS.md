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

## Umsetzungsreihenfolge

1. ✅ **Konzept-Doc** (dieses Dokument).
2. **DB:** Migration `beat` + `source_type` auf Stories + Quellen.
3. **Beat 1 — Klima & Energie lauffähig:** Primärquellen-Katalog (IRENA/Ember/
   Our World in Data/Global Forest Watch) als eigener Fetch, durch die bestehende
   Pipeline, mit Beat-Tag. Beweist den Anti-Lärm-Ansatz.
4. **Transparenz-Badge** auf Detailseite.
5. **Beats 2-5** nach dem Muster von Beat 1.
6. **/redaktion-Seite** als öffentliches Vertrauenssignal.

## Leitprinzipien

- **Lieber leer als laut.** Eine leise echte Story schlägt zehn laute Aggregate.
- **Mensch entscheidet final.** Bots liefern belegten Rohentwurf, kein Auto-Publish
  ohne Freigabe (außer im bewusst aktivierten Autopilot).
- **Grenzen mitschreiben.** Jeder Draft sagt, was die Quelle NICHT belegt — das
  unterscheidet uns von reißerischem Good-News-Kitsch.
