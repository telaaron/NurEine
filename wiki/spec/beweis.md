# Spezifikation „Welt & Beweis" — Quellen, Story-Kriterien, Beweis-Schicht

> Stand 2026-09-09 · Phase 1 des Rebuilds (VISION D-20…D-28) · Fachteil Redaktion/Beweis.
> Gilt für Stories. Der Langzeitindex selbst ist präregistriert (v1.2) und wird hier
> nicht angefasst; nur die Verbindung Story ↔ Indikator (D-10) gehört in dieses Dokument.
> Jede Zahl trägt ihre Quelle (Datei oder REST-Abfrage vom 2026-09-09). Unsicheres ist markiert.

## 0. Befund, auf dem alles aufsetzt (gemessen 2026-09-09)

| Befund | Zahl | Quelle |
|---|---|---|
| Stories in DB | 1.335 | `nureine_stories`, Content-Range |
| Stories mit echtem Ort (Stadt/Region) | 267 von 1.000 jüngsten (27 %); `none` 582, ungeprüft 151 | `place_scope` |
| Stories mit gesetztem Quellentyp | 219 von 1.000 (`source_type` sonst NULL) | `nureine_stories` |
| Annahmequote Fetch 22.08.–09.09. | 73 von 1.000 Entscheidungen (7 %); 692 `rejected_ai`, 161 `rejected_impact`, 74 Vorfilter | `nureine_fetch_log` |
| Primärquellen als RSS | WHO News 0/52, Our World in Data 0/30, UN News 0/11 angenommen | `nureine_fetch_log` |
| RSS-Quellen | 43 Zeilen, alle `active`, davon 2 Dubletten (WHO News, OWID je doppelt) | `nureine_rss_sources` |
| Faktenfehler im Archiv | 3 von 5 geprüften Stories falsch, alle durch Aggregator-Verkürzung | Memory 2026-07-17 (HPV „unter 30" statt 20–24; „BGH" statt OLG Bamberg) |
| Beleg-Ziel der Story | `source_url` zeigt in allen 25 letzten Newsletter-Stories auf das Aggregator-Medium, einmal auf ein Podcast-Transkript (Optimist Daily, 30.08.) | `nureine_stories` |

Kurz: Heute belegt jede Story einen Link auf ein Medium, das selbst nur zitiert. Der Ort ist bei
zwei Dritteln keiner. Die Primärquellen liegen als RSS in der Pipeline und werden zu 100 % verworfen,
weil ihr Format (Statistik-Update, Pressemitteilung) nicht wie eine „Nachricht" aussieht.

## 1. Was eine NurEine-Story ist

Eine Story wird veröffentlicht, wenn **alle fünf** Kriterien erfüllt sind:

| # | Kriterium | Prüffrage | Wer prüft |
|---|---|---|---|
| K1 | **Belegtes Ergebnis, keine Ankündigung** | Ist der Nutzen eingetreten (Vergangenheit, gemessen)? Nicht „soll", „plant", „könnte", „im Tierversuch" | Agent, Code-Deckel (§4) |
| K2 | **Primärquelle auffindbar** | Studie (DOI), Behörde, Gericht, Statistikamt, Register, Organisation mit eigener Datenerhebung. URL erreichbar, Datum vorhanden | Code (erreichbar) + Agent (Typ) |
| K3 | **Zahl prüfbar** | Die tragende Zahl steht wörtlich in der Primärquelle, mit Einheit und Bezug (X von Y, seit wann, gemessen woran) | Code (String-Match) + zweiter Blick |
| K4 | **Strukturelle Wirkung** | Benannte Nutznießer (Zahl oder klar definierte Gruppe) und ein Grund, warum es bleibt (Gesetz, Infrastruktur, Zulassung, Bestand) | Agent |
| K5 | **Keine Kuriosität** | Wird das Leben von jemandem morgen messbar anders? Lässt sich die Story einer Domäne des Langzeitindex oder einem benannten Zähler zuordnen? | Agent |

**Ausschlussliste** (Code-Vorfilter, wo möglich; sonst Agent): Jahrestage und Rückblicke ·
Einzelrettungen und Fundsachen („11-Jähriger rettet Mann", „Geldbörse nach 30 Jahren", beide im
Archiv mit impact 25–30) · Sport-Einzelleistungen · Grundlagenforschung ohne Nutznießer
(Exoplaneten, Quasare, Taxonomie) · Präklinik (Maus, Zellkultur) · Finanzierungszusagen, Abkommen,
Absichtserklärungen ohne eingetretenen Nutzen · Firmen-PR und CSR-Partnerschaften · Wetterbedingte
Effekte (La Niña) · Ratgeber, Listicles, Kolumnen · Podcast-Transkripte und Wochenrückblicke als
Quelle (das ist Aggregation zweiter Hand) · Stories, die primär eine politische Seite gut aussehen
lassen · Doom mit Pflaster (Problem ist Hauptsache, Fortschritt ist Beiwerk).

Die drei „Todsünden" und die Deckel (Aussicht ≤ 55, Präklinik ≤ 55, Zusage ≤ 55, Wetter ≤ 52,
CSR ≤ 45) aus `ANALYSIS_PROMPT_TEMPLATE` werden übernommen, wandern aber aus dem Prompt in die
Konfigdatei (§4), damit der Agent sie nicht „interpretiert".

## 2. Die Beweis-Schicht als Datenvertrag

Eine Tabelle `evidence` (1:1 zu `stories`), geschrieben von der Pipeline, gelesen von Seite,
Newsletter und Karte. Feldnamen sind Vorschlag für das neue Schema (D-25).

| Block | Feld | Typ | Pflicht | Regel |
|---|---|---|---|---|
| **Primärquelle** | `primary_url` | text | **ja** | erreichbar (HTTP 200/301) beim Lauf; DOI bevorzugt |
| | `primary_type` | enum `study·official_data·government·court·registry·ngo_report·institution` | **ja** | `journalism` ist **kein** zulässiger Primärtyp |
| | `primary_publisher`, `primary_date` | text, date | **ja** | Datum der Primärquelle, nicht des Aggregators |
| | `primary_quote` | text ≤ 300 Z. | **ja** | wörtlicher Span aus der Primärquelle, der die Kernzahl enthält |
| | `primary_lang` | text | ja | Sprache der Quelle (Anzeige „Quelle auf Englisch") |
| | `finder_url`, `finder_name` | text | ja | das Medium, das den Hinweis lieferte (heute `source_url`) |
| **Zahl** | `figure_value`, `figure_unit` | numeric, text | **ja** | genau eine tragende Zahl je Story |
| | `figure_referent` | text | **ja** | worauf sie sich bezieht: „Anteil unterernährter Menschen weltweit, 2025" |
| | `figure_context` | enum `verlauf·zielanteil·groessenvergleich·anteil·tempo` | **ja** | mind. ein Kontext nach VISION §3.2; Text im `context_sentence` |
| | `figure_source` | enum `primary·secondary` | **ja** | muss `primary` sein, sonst blockiert |
| | `figure_uncertainty` | text | optional | „Schätzung", „vorläufig", „Stand März 2026" |
| **Ort** | `place_scope` | enum `point·city·region·country·global·none` | **ja** (Wert `none` erlaubt) | §7 |
| | `place_name`, `place_country`, `lat`, `lng` | text, ISO-2, float | nur bei point/city/region | Koordinate nur aus Geocoder-Whitelist |
| | `place_origin` | enum `primary_text·finder_text·geocoder` | bei Ort | woher der Ortsname stammt |
| **Bild** | `image_generated` | bool | **ja** | |
| | `image_model`, `image_label` | text | bei generiert | Label wörtlich: „KI-generierte Illustration (Modell X). Zeigt nicht den Ort der Geschichte." |
| | `image_attribution`, `image_license` | text | bei echtem Foto | ohne Lizenz kein Foto |
| **Indikator** | `index_domain` | enum der 9 Domänen + `keine` | **ja** | §8 |
| | `index_indicator` | code aus den 25 (z. B. `SN.ITK.DEFC.ZS`) | optional | nur wenn die Story denselben Gegenstand misst |
| | `magnitude_sentence` | text | **ja** wenn Domäne ≠ keine | „Betrifft rund 40.000 Menschen. Der Bereich umfasst 8,1 Milliarden." |
| | `mechanism_sentence` | text | **ja** wenn Domäne ≠ keine | „Programme dieser Art sind einer der Wege, auf denen diese Kurve fällt." |
| **Prüfung** | `confidence` | 0–1 | **ja** | aus dem zweiten Blick (§5); < 0,7 → blockiert |
| | `checked_claims` | jsonb | **ja** | je Behauptung: `belegt·abweichend·nicht_belegt` + Zitat |
| | `checked_at`, `checked_by` | timestamp, text | **ja** | Modell/Agent-Version |
| **Optional** | `independent_sources[]`, `satellite_*`, `rosling_tag` | | nein | VISION §3.3/§4.4, später |

**Fehlt ein Pflichtfeld:** Story bekommt `status = blocked` mit Grund, wird nicht veröffentlicht,
erscheint nicht im Archiv, nicht auf der Karte, nicht im Newsletter. Kein Fallback-Text, kein
„Quelle folgt". Der Newsletter nimmt den nächsten freigegebenen Kandidaten; gibt es keinen,
geht an diesem Tag **kein** Newsletter raus (Healthcheck meldet es). Lieber leer als falsch.

**Alt-Stories beim Import** (1.335) bekommen kein rückwirkendes Beweis-Feld. Sie tragen das
Label „Archiv vor September 2026, nicht nach heutigem Verfahren geprüft" und sind von Karte
und Index-Zuordnung ausgenommen. Nachprüfung nur auf Zuruf.

## 3. Quellen

### 3.1 Drei Rollen statt einer Liste

| Rolle | Aufgabe | Liefert | Beispiele |
|---|---|---|---|
| **Finder** | Hinweis, dass etwas passiert ist | nur `finder_url`; nie Zahl, nie Zitat | Optimist Daily, Reasons to be Cheerful, Mongabay, Positive.News, Perspective Daily, GNN |
| **Beleg** | Primärquelle für Zahl, Datum, Zitat | `primary_*` | WHO, FAO, Weltbank, UNICEF, IEA, IRENA, Ember, Eurostat, Destatis, OWID (als Brücke zur Originalquelle), Lancet/Nature (DOI), Gerichte, Gesetzblätter, INPE, Statistikämter |
| **Daten-Beat** | Kandidaten direkt aus Datenveröffentlichungen, ohne Medium | Story-Kandidat + Beleg in einem | WHO GHO, Weltbank-API, Ember-Monatsdaten, Eurostat-Releases, Destatis-Pressekalender |

Finder dürfen nie Beleg sein. Damit ist der Aggregator-Verkürzungsfehler strukturell abgestellt:
Die Zahl kommt aus einem Dokument, das der Finder nur zitiert hat.

### 3.2 Welche heutigen RSS-Quellen überleben (Daten 22.08.–09.09., `nureine_fetch_log`)

| Quelle | geprüft | angenommen | davon ≥ 75 | Newsletter-Einsätze gesamt | Urteil |
|---|---|---|---|---|---|
| Reasons to be Cheerful | 42 | 7 (17 %) | 0 | 7 | **Finder, bleibt** (Lösungsjournalismus mit Personen und Orten) |
| The Optimist Daily | 56 | 9 (16 %) | 4 | 20 | **Finder, bleibt**, aber Transkripte/Wochenrückblicke im Vorfilter sperren |
| Good News Network | 230 | 27 (12 %) | 1 | 28 | **Finder, bleibt unter Vorbehalt**: liefert die meisten Treffer und den meisten Fluff (85 `local_fluff` im Fenster kommen fast alle von hier) |
| Perspective Daily | 63 | 6 (10 %) | 1 | 8 | **Finder, bleibt** (einzige deutsche Quelle mit Treffern) |
| Yale Environment 360 | 47 | 4 (9 %) | 1 | 4 | Finder, bleibt |
| Grist | 44 | 4 (9 %) | 0 | 2 | Finder, Probezeit 60 Tage |
| Johns Hopkins Hub | 39 | 3 (8 %) | 0 | 2 | Finder, Probezeit (Uni-PR, Primärquelle meist verlinkt) |
| Positive.News | 60 | 4 (7 %) | 1 | 4 | Finder, bleibt; Wochenrückblick-URLs sperren |
| Mongabay | 153 | 8 (5 %) | 0 | 13 | Finder, bleibt (Ökologie mit Ortsbezug, oft INPE/Studien verlinkt) |
| Spektrum Wissenschaft | 40 | 1 (2 %) | 0 | 4 | **raus** (Erkenntnis statt Wirkung; 112 Stories, 2 über 75) |
| The Conversation, Anthropocene Magazine | 71 / 62 | 0 | 0 | 1 / 0 | **raus** |
| WHO News, UN News, Our World in Data | 52 / 11 / 30 | 0 | 0 | 1 / 6 / 0 | **raus als RSS-Finder**, rein als **Beleg** und **Daten-Beat** (§3.3) |
| Golem, Berliner Zeitung, Utopia, Tagesschau Wissen, Futura, Phys.org, ScienceDaily ×2, Nature News, MIT TR, CleanTechnica, pv magazine, Yale Climate, Medical Xpress, STAT, TechXplore | keine Entscheidung im Fenster (Feed tot, 403 oder im Vorfilter komplett weg) | | | 0–4 | **raus**; Wiederaufnahme nur mit 30-Tage-Probelauf |
| Better India, Global Voices, CSM, Squirrel, DailyGood, StoryCorps (Podcast!), Undue Medical Debt (Scraper), Goldman/Magsaysay/Whitley Awards | 0 Stories in DB | | | 0 | **raus** (nie geliefert; Preis-Feeds sind Ankündigungen) |

Unsicherheit: Das Fenster ist 19 Tage; Quellen mit saisonalem Rhythmus können unterschätzt sein.
Perlenraten aus `nureine_source_quality` (Stand Juli, Alt-Skala) bestätigen die Reihung
(Yale e360 64 %, RtbC 62 %, Optimist 57 %, Positive 57 %, GNN 50 %, Spektrum 27 %, UN News 17 %).

Ergebnis: **9 Finder** statt 41. Weniger Rauschen, weniger LLM-Aufrufe (heute ~50 Entscheidungen
pro Nacht für ~4 Aufnahmen).

### 3.3 Neue Beats (Primärquellen), Reihenfolge nach Ertrag pro Aufwand

| Beat | Quelle | Zugang | Was sie liefert | Phase |
|---|---|---|---|---|
| Ernährung, Überleben, Gesundheit | WHO GHO API, FAO SOFI, UNICEF Data | offen, JSON | Jahreswerte, Eliminationserklärungen (Ebola, Trachom, Malaria) | 2 |
| Materiell, Infrastruktur, Wissen | Weltbank-API (bereits im Index-Code) | offen | Länderwerte mit Vintage | 2 |
| Energie | Ember (Monatsdaten Strom), IEA (Reports, teils Konto), IRENA (403 auf RSS, Statistik als XLSX) | offen / Konto | „Wind+Sonne > Gas seit April" mit Primärzahl | 2 |
| Ökologie | INPE/PRODES, Global Forest Watch API, Copernicus | offen | Entwaldung, Waldfläche, Brände | 2–3 |
| DACH | Destatis (GENESIS, Pressekalender), Eurostat Releases, UBA, RKI | offen, Konto für GENESIS | deutsche Zahlen für die Brücke (STIMME § 8b) | 3 |
| Recht | Gerichts-Pressestellen (BVerfG, BGH, OLG), EUR-Lex | offen | Aktenzeichen statt Golem-Deutung | 3 |
| Forschung | Crossref/Unpaywall (DOI-Auflösung), Europe PMC | offen (E-Mail als UA) | Studie hinter der Uni-PR | 2 (nur Auflösung) |

Ein Daten-Beat erzeugt keinen Text, sondern einen **Kandidaten**: Indikator, alter Wert, neuer
Wert, Vintage, Link. Der Agent entscheidet, ob daraus eine Story wird (Regel: nur bei Schwelle
überschritten, Erklärung erreicht, Trend gedreht; kein „ist um 0,3 % gestiegen").

### 3.4 Quellen-Score (für Beleg-Quellen, ersetzt CONTENT.md-Tabelle)

| Typ | Score | Beispiel |
|---|---|---|
| Peer-Review mit DOI, offizielle Statistik, Gerichtsentscheid, Gesetzblatt | 100 | Lancet, WHO GHO, Destatis, BVerfG |
| Bericht einer Organisation mit eigener Erhebung | 85 | FAO SOFI, UNICEF, Ember, INPE |
| Regierungsstelle ohne Rohdaten (Pressemitteilung mit Zahl) | 75 | Ministerium im Parlament (Indien-Wasser) |
| NGO-Bericht mit Methodik | 65 | Global Forest Watch, Amnesty |
| Uni-Pressestelle, Fachredaktion (Nature News, STAT) | 50 | nur wenn die Studie nicht auffindbar ist; dann `confidence` ≤ 0,7 |
| Aggregator, Blog, Podcast, Social | 0 | nie Beleg |

`MIN_EVIDENCE = 65` für Veröffentlichung. Sprache: Eingang EN + DE (Finder), Beleg in jeder
Sprache (der zweite Blick liest sie), Ausgabe nur DE.

## 4. Qualitäts-Gate

**3-Stufen-Modell bleibt, mit einer Änderung:** Die Beweis-Schicht ist Pflicht ab Stufe ②,
nicht nur für die Tages-Story. Was im Archiv steht, ist veröffentlicht.

| Stufe | Schwelle | Folge |
|---|---|---|
| ① raus | `impact < 55` oder ein K1–K5 verletzt oder Beweis unvollständig | nicht gespeichert (nur Log) |
| ② Archiv | 55–74, Beweis vollständig | Archiv, Karte (bei Ort), Typo-Karte statt Bild |
| ③ Tages-Story | beste freigegebene Story des Tages, typischerweise ≥ 75 | Newsletter, Startseite, KI-Bild mit Label |

**Alle Schwellen an einer Stelle:** `pipeline/gates.toml` im neuen Repo (Vorschlag), eingelesen
von Code und in den Agenten-Prompt injiziert, nie im Prompt hart geschrieben:

```
story_min_impact = 55        pearl_min_impact = 75        min_evidence = 65
min_confidence = 0.70        max_age_days_news = 7        max_age_days_data = 21
cap_announcement = 55        cap_preclinical = 55         cap_pledge = 55
cap_weather = 52             cap_csr = 45                 max_candidates_per_night = 12
```

Begründung: Die Deckel stehen heute als Prosa im Prompt (`Verbesserung #25/#27/#37/#43/#56`)
und wurden dennoch wiederholt vom Modell übergangen (Frosch-Bakterium: `ev 85, dur 80` bei
reiner Maus-Studie). Ein Deckel, den Code anwendet, hält.

**Relevanz statt Kuriosität, operationalisiert** (Agent beantwortet vier Fragen mit ja/nein;
zwei Nein = raus, ein Nein = max 54):

1. Gibt es benannte Nutznießer (Zahl oder definierte Gruppe)?
2. Ist der Nutzen eingetreten, nicht angekündigt?
3. Gibt es einen Grund, warum er bleibt?
4. Lässt sich die Story einer Index-Domäne oder einem benannten Zähler zuordnen?

| Archiv-Beispiel (echt) | impact heute | Urteil nach neuem Gate |
|---|---|---|
| **124 Millionen Haushalte in Indien haben Leitungswasser** (03.08., Optimist Daily) | 90 | **gut**: Zahl aus Parlamentsantwort, unabhängige Prüfung 2022 genannt, Domäne Infrastruktur `SH.H2O.SMDW.ZS` |
| **Welthunger sinkt unter 8 Prozent** (30.07., GNN) | 86 | **gut**: FAO SOFI 2026 ist Primärquelle, Domäne Ernährung, Indikator `SN.ITK.DEFC.ZS` direkt |
| **Uganda hat seinen Ebola-Ausbruch gestoppt** (08.09., GNN) | 72 | **gut**: WHO-Erklärung als Beleg, Ort Land, Domäne Gesundheit; Größenordnung ehrlich klein |
| **Ein Bakterium aus dem Frosch-Darm ließ bei Mäusen alle Tumore verschwinden** (12.07.) | 30 | **schlecht**: Präklinik, K1 verletzt; gehört nicht ins Archiv |
| **Exoplaneten mit ewiger Nacht könnten Leben beherbergen** (09.07.) | 30 | **schlecht**: keine Nutznießer, keine Domäne, Konjunktiv im Titel |
| **11-Jähriger rettet bewusstlosen Mann aus Pool** (08.07.) | 30 | **schlecht**: wörtlich die „local fluff"-Todsünde, trotzdem aufgenommen |
| **HPV-Impfung eliminiert fast Gebärmutterhalskrebs** (26.06., Positive.News) | 95 | **richtige Story, falsche Zahl**: „unter 30" stand nur im Aggregator, Lancet sagt 20–24. Mit K3 wäre sie blockiert worden, bis der Titel stimmt |

## 5. Arbeitsteilung Code · Agent · zweiter Blick (D-24)

| Schritt | **Code** (deterministisch, 0 €) | **Agent 1: Redaktion** (Urteil) | **Agent 2: zweiter Blick** (Pflicht) |
|---|---|---|---|
| Sammeln | RSS der 9 Finder + Daten-Beats; Vorfilter (Ausschluss-Regex, Alter, Transkript-URLs); Dublette per Titel-Ähnlichkeit + Primär-URL | | |
| Primärquelle | Links aus dem Finder-Artikel extrahieren, DOI auflösen, Erreichbarkeit prüfen, Volltext ziehen | wählt aus den gefundenen Links die Primärquelle; findet keine → sucht gezielt (Behörde, Studie); findet keine → `blocked` | |
| Zahl | prüft, ob `figure_value` als String (mit Formatvarianten) im Primär-Volltext steht | benennt tragende Zahl, Bezug, Kontext | liest **nur** Primärtext + Entwurf, nie den Finder; prüft jede Behauptung: belegt / abweichend / nicht belegt |
| Ort | Zentroid-Check, Geocoder-Whitelist, Genauigkeitslabel | wählt Ebene aus Kandidaten (§7) | bestätigt, dass der Ort im Primärtext vorkommt |
| Wirkung | wendet Deckel aus `gates.toml` an (Cap gewinnt immer gegen Agenten-Score) | vier Relevanzfragen, impact, Domäne, Größenordnung, Mechanismus | prüft Mechanismus-Satz auf erfundene Kausalität (VISION §7.3) |
| Text | Blacklist-Scan (STIMME § 6), Längen, Gedankenstriche, 70 Zeichen Betreff, Titel ≠ Hook | schreibt Kern-Satz, Titel, Text, Epilog in STIMME | prüft Superlative gegen Beleg („erstmals", „Rekord" nur wenn Quelle es sagt) |
| Bild | Größe < 150 KB, Proxy, Label gesetzt | Bild-Prompt (nur Tages-Story) | |
| Ergebnis | schreibt `evidence`, setzt `status`, loggt Kosten pro Lauf | | setzt `confidence`; eine Abweichung bei Zahl, Datum, Ort, Reifegrad → `blocked` |

Kostenrahmen (Messlatte D-24: heute Ø 8 $/Nacht nominal für eine Story): Vorfilter und
Extraktion laufen ohne LLM oder mit DeepSeek (Cent-Beträge). Die beiden Agenten sehen höchstens
`max_candidates_per_night = 12` Kandidaten mit vorbereitetem Material (Primärtext schon geladen).
Zielwert < 1 $/Nacht; Ist wird pro Lauf in `runs` protokolliert und im Admin angezeigt.

**Prompt-Skelett Redaktions-Agent** (Struktur; Texte kommen aus den referenzierten Dateien):

```
1  Rolle: Redakteur bei NurEine. Du bekommst je Kandidat: Finder-Text, Primärtext(e), Gates.
2  Verbindlich: docs/STIMME.md (Ton) · wiki/spec/beweis.md §1, §8, §9 (Kriterien, Index, Anti-Hype)
3  Gates (injiziert aus gates.toml): Deckel, Schwellen, Alter
4  Aufgabe A · Auswahl: K1–K5 mit je einem Satz Begründung; vier Relevanzfragen ja/nein
5  Aufgabe B · Beweis: primary_url/type/date/quote · figure_value/unit/referent/context · place-Ebene aus Kandidatenliste
6  Aufgabe C · Index: index_domain (oder keine) · magnitude_sentence · mechanism_sentence · nie Punkte, nie Beitrag
7  Aufgabe D · Text: kern_satz (≤ 70 Z.) · title (≤ 65 Z.) · body (Länge nach impact) · epilog (Schluss A oder B)
8  Verbote: nichts behaupten, was nicht im Primärtext steht · kein Ich · keine Gedankenstriche · Blacklist
9  Ausgabe: JSON nach Schema evidence + story · bei fehlender Primärquelle: {"status":"blocked","reason":…}
```

Der zweite Blick bekommt ein eigenes, kürzeres Skelett: Primärtext, Entwurf, Liste der
Behauptungen; Ausgabe je Behauptung ein Urteil mit Zitat. Er darf nicht umschreiben, nur urteilen.

## 6. Texte: Kern-Satz, Titel, Epilog (STIMME.md verdichtet)

1. Kern-Satz (heute `share_hook`): ein Satz, ≤ 70 Zeichen, kein Punkt, die Zahl trägt ihn, nie der Titel.
2. Titel ≤ 65 Zeichen, sagt was passiert ist; kein Eigenname ohne Einordnung, kein „erstmals" ohne Beleg.
3. Einstieg mit Szene, Zahl oder Widerspruch, nie mit dem Thema.
4. Brücke spätestens im zweiten Absatz, wenn die Story fern ist (Weltbild, Übertragbarkeit, Größenordnung, gemeinsames Problem).
5. Drei starke Zahlen schlagen neun; jede Zahl mit Bezug (VISION §3.2).
6. Kein Ich. „Wir" höchstens einmal, nur mit Archivbeleg. „Du" nur, wenn es den Leser wirklich betrifft.
7. Keine erfundene Rezeption: kein „endlich", „Aufatmen", „lang ersehnt".
8. Superlativ nur mit Zahl und Quelle.
9. Epilog = Schluss A (Einordnung: „der 26. Bundesstaat") oder B (Folge für einen Menschen). Nie „bleibt abzuwarten".
10. Keine Gedankenstriche, keine Ausrufezeichen, keine Blacklist-Wendungen (Code prüft).

**E-06 Ich-Perspektive, Empfehlung:** VISION §3.4 in **„Stimme aus der Quelle"** umbenennen.
Erlaubt sind wörtliche, belegte Zitate mit Name, Rolle und Fundstelle. Eine generierte
Ich-Erzählung ist eine erfundene Zeugenaussage und widerspricht §2 dieses Dokuments (nichts, was
nicht im Primärtext steht). Aarons Ich bleibt in persönlichen Kanälen (Push, WhatsApp) erlaubt.

## 7. Ort

Zweistufig, in umgekehrter Richtung zu heute (heute: Koordinate vom Modell → Nominatim rät zurück):

1. **Kandidaten aus dem Text.** Ortsnamen aus dem Primärtext (bevorzugt) und dem Finder-Text.
   Kein Ortsname im Text → `scope = none`, fertig, kein Netzaufruf.
2. **Geocoding vorwärts** (Nominatim, 1 Anfrage/s, eigener User-Agent) liefert je Kandidat
   Ebene und Koordinate. Koordinate innerhalb `KNOWN_CENTROIDS` ± 0,06° → verworfen.
3. **Agent wählt die Ebene**, die zur Reichweite der Story passt: `point` (Anlage, Gebäude,
   Fluss-Abschnitt) · `city` · `region` · `country` · `global`. Er darf nur Namen aus der
   Kandidatenliste wählen (Whitelist), sonst erfindet er Orte.
4. **Zweiter Blick** bestätigt, dass der Ortsname im Primärtext steht.

| Label auf der Seite | Karte | Beispiel |
|---|---|---|
| genauer Ort | Pin | Wassertank-Projekt in einer benannten Stadt |
| Stadt / Region | Pin auf Zentrum, Text „ungefähr" | Baltimore, Kentucky |
| Land | **kein Pin**, nur Text | „Uganda ist ebolafrei" |
| global / kein Ort | nichts | Welthunger, Studie, Weltrekord Solar |

Erwartung: weiterhin nur etwa ein Drittel der Stories mit Pin (Memory 2026-08-05: 27 % heute).
Das ist korrekt, kein Mangel. Die Karte zeigt nur `point·city·region` (REBUILD-PLAN §1).

## 8. Story ↔ Langzeitindex (D-10)

**Zuordnungsregeln**

- Genau eine Domäne aus den neun (Überleben, Gesundheit, Ernährung, Materiell, Infrastruktur,
  Sicherheit, Freiheit, Wissen, Ökologie) oder `keine`. Zweitdomäne nur intern.
- Indikator-Code nur, wenn die Story **denselben Gegenstand** misst (Welthunger → `SN.ITK.DEFC.ZS`).
  Eine Solaranlage misst nicht `EN.GHG.CO2.MT.CE.AR5`; dort bleibt es bei der Domäne Ökologie.
- Zuordnung erfolgt **nach** der Auswahl, nie davor (Zusatzregel D-10 gegen Selektionsverstärkung).
  Auch fallende Domänen bekommen Stories.
- Größenordnung immer als zwei Zahlen: Reichweite der Story und Größe des Bereichs.
- Mechanismus beschreibt den **Weg**, nie den Beitrag: „Impfprogramme sind einer der Wege, auf
  denen diese Kurve fällt", nicht „senkt die Kindersterblichkeit um".
- Quartalsprüfung: Domäne ohne Story seit 6 Monaten → Hinweis im Methodik-Changelog.

**Anzeige-Satz-Vorlage** (drei Zeilen auf der Story-Karte, D-10):

```
BEREICH:        {domain_label}
GRÖSSENORDNUNG: {magnitude_sentence}   z. B. „Betrifft rund 156 Millionen Haushalte. Der Bereich Infrastruktur umfasst 8,1 Milliarden Menschen."
MECHANISMUS:    {mechanism_sentence}   z. B. „Wasseranschlüsse dieser Art sind einer der Wege, auf denen diese Kurve steigt."
```

Bei `keine`: „Diese Geschichte gehört zu keinem Bereich des Langzeitindex." (sichtbar, nicht versteckt).

**Verboten:** „trägt X Punkte bei" · „hebt den Index" · Prozentanteil am Index · Marker auf oder an
der Kurve · Pfeile · `estimatedContribution` in irgendeiner Anzeige · Zuordnung zu einer
steigenden Domäne, wenn die Story eigentlich zu einer fallenden gehört.

## 9. Anti-Hype-Regeln

| Regel | Heißt konkret |
|---|---|
| **„Schlecht und besser"** (Rosling) | Jede Verbesserung nennt den verbleibenden Stand: „7,8 Prozent, das sind noch immer rund 640 Millionen Menschen." Ohne Rest-Zahl keine Veröffentlichung. |
| Keine Ausgleichs-Rhetorik | Kein „trotz allem", kein „aber immerhin", kein Doom als Rahmen, um die Story größer zu machen. Der Stand ist der Rahmen. |
| Superlativ nur mit Zahl und Quelle | „erstmals", „Rekord", „historisch", „Meilenstein" nur, wenn die Primärquelle den Vergleich selbst zieht. |
| Keine Kausalität über die Quelle hinaus | Sprachstufen aus VISION §7.3: „liegt zeitlich innerhalb", „ist Teil eines dokumentierten Trends", „nach Angaben von". |
| Zahl mit Bezug | Nie eine Zahl ohne Verlauf, Zielanteil, Vergleich, Anteil oder Tempo (§2 `figure_context`). |
| Unsicherheit als Feststellung | „Die Zahl ist eine Schätzung der FAO, Stand März 2026." Nicht verschweigen, nicht dramatisieren. |
| Keine Tempo-Behauptung ohne Basis | „doppelt so schnell" nur mit „wie was, gemessen woran". |
| Kein Sieg über die Menschheit | Keine „wir schaffen das"-Wendung, kein Appell, kein Imperativ. |

Code prüft Superlativ-Wörter gegen `primary_quote`; Treffer ohne Entsprechung → zweiter Blick
muss ausdrücklich freigeben.

## 10. E-04: zwei Batches pro Tag?

**Empfehlung: ein Batch pro Nacht, mit einem Tag Vorlauf.** VISION E-04 beschreibt vier
Fetch-Läufe (06/10/14/18 UTC); das ist überholt, `ops/crontab.txt` fährt heute einen Lauf 03:10.
Für ein Produkt mit einer Story pro Tag bringt ein zweiter Batch keine zweite Story, nur
doppelte Kosten. Was fehlt, ist Zeit für den zweiten Blick: Deshalb wählt der Lauf in Nacht N
die Story für Tag N+1 aus dem geprüften Bestand und füllt gleichzeitig den Bestand für N+2.
Ein optionaler Tageslauf (12:00) prüft nur Erreichbarkeit der Primär-URLs bereits freigegebener
Stories (Link tot → Story bleibt mit Archivlink, Label „Quelle am … geprüft"). Keine neuen Stories.

## 11. Entscheidungen für den CEO

| # | Frage | Empfehlung | Warum |
|---|---|---|---|
| B-1 | Beweis-Pflicht nur für Tages-Story oder für alles Veröffentlichte? | **alles** (ab Stufe ②) | Archiv und Karte sind öffentlich; eine unbelegte Archiv-Story ist dieselbe Blamage wie eine unbelegte Titel-Story |
| B-2 | Finder-Liste auf 9 Quellen kürzen (§3.2) | **ja**, Rest deaktivieren, nicht löschen | 0 Treffer in 19 Tagen bei 20 Quellen; Wiederaufnahme mit Probelauf möglich |
| B-3 | Frische: 7 Tage für Nachrichten, 21 Tage für Datenveröffentlichungen, Reserve-Pool erlaubt | **ja** | ohne Reserve fällt der Newsletter an schwachen Tagen aus; Datenreleases altern langsam |
| B-4 | Kein Newsletter, wenn keine freigegebene Story | **ja** | „lieber leer als falsch" muss auch den Kanal betreffen, sonst wird die Regel weich |
| B-5 | E-06: „Stimme aus der Quelle" statt Ich-Format | **ja** | §6 |
| B-6 | E-04: ein Batch, ein Tag Vorlauf | **ja** | §10 |
| B-7 | Modelle: DeepSeek für Extraktion, Claude-Agenten für Urteil und zweiten Blick | **ja**, Budget < 1 $/Nacht sichtbar | D-24 Messlatte 8 $/Nacht |
| B-8 | KI-Bild nur für Tages-Story, Label Pflicht; Alternative wäre gar kein Bild | **Bild mit Label** | Newsletter-Öffnung hängt am Bild (unbewiesen, markiert als Annahme); Label kostet nichts |
| B-9 | Alt-Archiv ungeprüft importieren mit Label statt nachprüfen | **ja** | 1.335 Nachprüfungen kosten Wochen; das Label ist ehrlich |
| B-10 | Zweiter Blick als eigener Agent (blind gegenüber dem Finder) oder Teil des Redaktions-Agenten | **eigener Agent** | ein Modell prüft die eigene Verkürzung nicht; die 3 von 5 Fehler entstanden genau so |

**Human-TODO-Kandidaten** (für `wiki/HUMAN-TODO.md`, nur Aaron):

- Destatis-GENESIS-Konto anlegen (kostenlos) und IEA-Konto für Report-Downloads; Zugangsdaten in `keys.env`.
- IRENA: RSS blockt mit 403; einmal anfragen, ob ein API-/Statistik-Zugang für Nicht-Kommerzielle möglich ist.
- Crossref/Unpaywall verlangen eine Kontakt-E-Mail im User-Agent: Adresse festlegen (kontakt@nureine.de?).
- Kill-Liste §3.2 bestätigen (B-2), besonders Good News Network unter Vorbehalt.
- Vier Wochen lang je Woche 3 veröffentlichte Stories selbst gegen die Primärquelle lesen (Kalibrierung des zweiten Blicks); Befund in `wiki/`.
- Wortlaut des Bild-Labels und des Archiv-Labels (§2) freigeben; beide stehen öffentlich.
- Entscheidung, ob das Archiv-vor-September öffentlich bleibt oder nur über Direktlink erreichbar ist.
