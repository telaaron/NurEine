# CONTENT.md — NurEine Redaktions-Richtlinien

Zuletzt aktualisiert: Mai 2026

## Was wir veröffentlichen

Eine Geschichte ist veröffentlichungswürdig wenn:
- Sie zeigt, dass Menschen ein Problem aktiv lösen
- Der positive Effekt belegbar ist (Quellen, Studien, offizielle Daten)
- Sie mindestens 100 Menschen direkt betrifft
- Sie nicht älter als 72 Stunden ist (außer Archiv-Features)

## Was wir NICHT veröffentlichen
- "Hund rettet Katze"-Stories (nett, aber kein Impact)
- Unternehmens-PR ohne unabhängige Bestätigung
- Politische Versprechen ohne nachweisbare Umsetzung
- Clickbait-positive Headlines ohne Substanz

## KI-Filter-Qualität prüfen
Wöchentlich cron_runs-Log prüfen:
- Wie viele Artikel wurden gescannt?
- Wie viele wurden als is_positive=true eingestuft?
- Ziel-Quote: 5–15% der gescannten Artikel werden veröffentlicht
- Unter 5%: Gemini-Prompt zu streng → anpassen
- Über 20%: Gemini-Prompt zu locker → anpassen

## Story-Qualitäts-Checkliste (manuell, optional)
- [ ] Titel max 80 Zeichen, kein Clickbait
- [ ] Subtitle erklärt den Kontext in einer Zeile
- [ ] Summary nennt: Was passiert? Wie viele betroffen? Warum dauerhaft?
- [ ] Source-URL funktioniert
- [ ] Koordinaten plausibel (für Karte)
- [ ] Emoji passt thematisch

## Kategorien-Definitionen
| Kategorie | Beispiele |
|---|---|
| klima | Erneuerbare Energie, Aufforstung, CO2-Reduktion, Artenschutz |
| gesundheit | Medizinische Durchbrüche, Impfstoffe, Versorgungsverbesserungen |
| wissenschaft | Forschungs-Milestones, Technologie-Durchbrüche, Weltraum |
| gemeinschaft | Soziale Initiativen, Stadtprojekte, Friedensabkommen |
| tiere | Artenschutz-Erfolge, Population-Erholung, Habitat-Schutz |
| kultur | Kunst, Bildung, gesellschaftlicher Zusammenhalt |
| innovation | Startup-Lösungen, Erfindungen, neue Infrastruktur |

## Quellen-Ranking (für Belegbarkeit-Score)
| Quelle | Evidence-Score |
|---|---|
| Peer-reviewed Studie | 100 |
| WHO, UN, Regierungsbericht | 90 |
| Reuters, AP, BBC | 80 |
| Etablierte Fachredaktion | 75 |
| Lokale Redaktion | 50 |
| Blog, Social Media | 20 |

## Neue RSS-Quellen aufnehmen
Kriterien:
1. Mindestens 50% der Artikel potenziell positiv
2. Regelmäßige Erscheinungsweise (mind. wöchentlich)
3. Verlässliche Quellenangaben
4. INSERT in rss_sources Tabelle, active=true