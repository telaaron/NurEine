# Präregistrierung — Der Langzeitindex

> **Dies ist eine Selbstbindung, kein Konzeptpapier.**
>
> Alles in diesem Dokument wurde festgelegt, **bevor** die erste vollständige
> Zeitreihe gerechnet wurde. Der Zweck ist überprüfbar: Wer später behauptet, wir
> hätten die Indikatoren nach ihrem Ergebnis ausgesucht, kann diese Datei gegen
> den Git-Zeitstempel halten.
>
> **Version:** 1.0 · **Festgelegt am:** 2026-09-01
> **Festgelegt mit Commit:** `1fe3dbc629d6908efc768f8fdc425a94b8d2fd79`
> **Zeitstempel:** 2026-09-02T23:55:44+01:00
>
> Änderungen an diesem Dokument sind erlaubt, aber nie stillschweigend: Jede
> Änderung bekommt Datum, Begründung und bleibt in der Git-Historie sichtbar.
> Die alte Fassung wird nie gelöscht.

---

## 1. Was der Index ist — und was nicht

Der **Langzeitindex** ist eine Zahl zwischen 0 und 100, die beschreibt, **wie die
Welt ist** — nicht, wie gut sie ist.

Er misst den Abstand zu Marken, die **andere gesetzt haben**: SDG-Zielwerte,
logische Grenzen (0 % / 100 %), wissenschaftliche Referenzpunkte. Wir setzen
keine dieser Marken selbst.

**Der Satz, den wir nicht sagen:** „Wir bewerten nicht."
**Der Satz, der stimmt:** „Wir bewerten nicht selbst — wir messen den Abstand zu
Marken, die andere gesetzt haben."

### Was er ausdrücklich nicht ist

- **Kein Fortschrittsindex.** Die Richtung eines Indikators war in keiner Phase
  ein Auswahlkriterium. Ein Indikator, der seit 20 Jahren fällt, ist genauso
  aufgenommen wie einer, der steigt.
- **Keine Summe unserer Geschichten.** Der Index wird aus externen Statistiken
  berechnet. Eine veröffentlichte Story bewegt ihn nie.
- **Keine Aussage über heute.** Der Datenstand liegt 1–4 Jahre zurück.

---

## 2. Die Auswahlregel (das Kernstück)

**Die Bereiche wurden definiert, bevor die Daten angesehen wurden.** Erst danach
wurde geprüft, welche Indikatoren sie messen. Erst ganz zuletzt wurde die Richtung
protokolliert.

Diese Reihenfolge ist die Substanz des Projekts. Wer erst schaut und dann auswählt,
findet immer das Ergebnis, das er sucht.

**Keine Negativ-Quote.** Es wird ausdrücklich *nicht* verlangt, dass eine bestimmte
Anzahl Indikatoren fällt. Das wäre Ergebnis-Design mit umgekehrtem Vorzeichen. Dass
am Ende Bereiche fallen, ist Folge der Methode, nicht ihre Vorgabe.

---

## 3. Die neun Bereiche

Jeder Bereich zählt **exakt gleich viel (1/9)** — unabhängig davon, wie viele
Indikatoren er enthält.

Das ist eine Wertentscheidung, keine Neutralität. Wir treffen sie, weil jede
andere Aufteilung eine Behauptung darüber wäre, welcher Bereich menschlichen
Lebens wichtiger ist. Die Gleichgewichtung auf **Bereichsebene** (statt auf
Indikatorebene) verhindert außerdem, dass Bereiche mit besserer Datenlage
heimlich mehr Gewicht bekommen.

| # | Bereich | Warum er dazugehört |
|---|---|---|
| 1 | **Überleben** | Logisch vorgeordnet: Wer stirbt, hat keine anderen Bereiche mehr. |
| 2 | **Gesundheit** | Überleben ist die Untergrenze, nicht das Ziel. |
| 3 | **Ernährung** | Eigenständig, weil frühkindliche Unterernährung lebenslang wirkt. |
| 4 | **Materielle Lage** | Die Ressourcengrenze, in der die meisten Menschen operieren. |
| 5 | **Infrastruktur** | Wasser, Sanitär, Energie, Netz — der Unterschied zwischen einem Tag, der aus Wasserholen besteht, und einem, der zur Verfügung steht. |
| 6 | **Sicherheit** | Gewalt ist der Boden, auf dem alles andere steht. |
| 7 | **Freiheit & Teilhabe** | Ohne diesen Bereich könnte der Index ein wohlgenährtes Gefängnis als Erfolg ausweisen. |
| 8 | **Wissen** | Was Menschen können — nicht, wo sie gesessen haben. |
| 9 | **Ökologie** | Ohne diesen Bereich würde Vermögensverzehr als Gewinn verbucht. |

---

## 4. Die 25 Indikatoren

**Alle 25 Codes wurden am 2026-09-01 gegen die echte API geprüft** (Existenz,
Weltreihe, tatsächliche Jahre, Lücken). Jahresangaben sind die realen Start- und
Endjahre der Weltreihe, nicht geschätzt.

**Zeitfenster: 2005–2023.** In diesem Fenster haben alle 25 Reihen Werte
(einzige Ausnahme: die beiden Armutsreihen haben 2019 eine Lücke, die nach
Abschnitt 7.3 interpoliert wird). Der Korb bleibt über die gesamte Reihe konstant — sonst zeigt die Kurve
Korbwechsel statt Weltveränderung.

| Bereich | Indikator | Quelle / Code | Reihe | Anker 0 | Anker 100 | Typ |
|---|---|---|---|---|---|---|
| Überleben | Kindersterblichkeit u5 (je 1.000) | WB `SH.DYN.MORT` | 1990–2024 | 93,5 (Welt 1990) | 25 | **B** SDG 3.2 |
| Überleben | Müttersterblichkeit (je 100.000) | WB `SH.STA.MMRT` | 1985–2023 | 391 (Welt 1990) | 70 | **B** SDG 3.1 |
| Überleben | Lebenserwartung (Jahre) | WB `SP.DYN.LE00.IN` | 1960–2024 | 50 | 85 | **C** |
| Gesundheit | Tuberkulose-Inzidenz (je 100.000) | WB `SH.TBS.INCD` | 2000–2024 | 190 (Welt 2000) | 0 | **A** |
| Gesundheit | DTP3-Impfquote (%) | WB `SH.IMM.IDPT` | 1980–2024 | 0 | 100 | **A** |
| Ernährung | Unterernährung (%) | WB `SN.ITK.DEFC.ZS` | 2001–2023 | 100 | 0 | **A** |
| Ernährung | Auszehrung u5 (%) | WB `SH.STA.WAST.ZS` | 2000–2024 | 100 | 0 | **A** |
| Materiell | Armut < 3,00 $/Tag (%) | WB `SI.POV.DDAY` | 1981–2024 · Lücke 2019 | 100 | 0 | **A** |
| Materiell | Armut < 8,30 $/Tag (%) | WB `SI.POV.UMIC` | 1981–2024 · Lücke 2019 | 100 | 0 | **A** |
| Infrastruktur | Sicheres Trinkwasser (%) | WB `SH.H2O.SMDW.ZS` | 2000–2024 | 0 | 100 | **A** |
| Infrastruktur | Sichere Sanitärversorgung (%) | WB `SH.STA.SMSS.ZS` | 2000–2024 | 0 | 100 | **A** |
| Infrastruktur | Stromzugang (%) | WB `EG.ELC.ACCS.ZS` | 1998–2024 | 0 | 100 | **A** |
| Infrastruktur | Saubere Kochenergie (%) | WB `EG.CFT.ACCS.ZS` | 2000–2023 | 0 | 100 | **A** |
| Infrastruktur | Internetnutzung (%) | WB `IT.NET.USER.ZS` | 2005–2025 | 0 | 100 | **A** |
| Sicherheit | Tötungsdelikte (je 100.000) | WB `VC.IHR.PSRC.P5` | 2000–2023 | 20 | 0 | **C** |
| Sicherheit | Militärausgaben (% BIP) | WB `MS.MIL.XPND.GD.ZS` | 1960–2024 | 10 | 0 | **C** |
| Freiheit | Wahldemokratie-Index (0–1) | OWID `electoral-democracy-index` (V-Dem) | 1789–2025 | 0 | 1 | **A** |
| Freiheit | Menschenrechts-Index (0–1) | OWID `civil-liberties-index-vdem` (V-Dem) | 1789–2025 | 0 | 1 | **A** |
| Freiheit | Frauen in Parlamenten (%) | WB `SG.GEN.PARL.ZS` | 1997–2025 | 0 | 50 | **B** Parität |
| Wissen | Alphabetisierung 15+ (%) | WB `SE.ADT.LITR.ZS` | 1975–2024 | 0 | 100 | **A** |
| Wissen | Grundschulabschluss (%) | WB `SE.PRM.CMPT.ZS` | 1988–2024 | 0 | 100 | **A** |
| Wissen | Hochschulbildung, brutto (%) | WB `SE.TER.ENRR` | 1970–2024 | 0 | 100 | **A** |
| Ökologie | CO₂ absolut (Mt) | WB `EN.GHG.CO2.MT.CE.AR5` | 1970–2024 | 42.000 | 0 | **C** Netto-Null |
| Ökologie | CO₂ pro Kopf (t) | WB `EN.GHG.CO2.PC.CE.AR5` | 1970–2024 | 6 | 0 | **C** |
| Ökologie | Waldfläche (%) | WB `AG.LND.FRST.ZS` | 1992–2023 | 0 | 50 | **C** |

**Ankertypen:**
**A** = logisch (Anteile, Abdeckungsgrade — nichts zu entscheiden) ·
**B** = offiziell beschlossenes Ziel (SDG, internationale Vereinbarung) ·
**C** = begründeter Referenzpunkt, in Abschnitt 6 einzeln erklärt

> **Anker werden nie verschoben** — auch nicht, wenn ein Ziel verfehlt oder das
> Zieljahr 2030 überschritten wird. Sonst würde der Maßstab am Ergebnis geeicht.

---

## 5. Die Verliererliste — geprüft und nicht aufgenommen

Diese Liste ist Teil des Belegs. Dass darauf **steigende** Kandidaten stehen
(BIP, Einschulungsrate, Schutzgebiete), zeigt, dass nicht nach Richtung sortiert
wurde.

### Geprüft, Code existiert nicht oder hat keine Weltreihe

| Code | Befund (verifiziert 2026-09-01) |
|---|---|
| `EN.ATM.CO2E.PC` | existiert nicht mehr — „deleted or archived" |
| `SM.POP.REFG`, `SG.LAW.INDX` | existieren nicht |
| `SI.POV.GINI` (Ungleichheit) | existiert, **keine Weltreihe** |
| `VC.BTL.DETH` (Konflikttote) | existiert, **keine Weltreihe** |
| `SH.STA.STNT.ZS` (Stunting) | existiert, Weltreihe **leer** |
| `SE.LPV.PRIM` (Lernarmut) | Welt nur **2015 und 2019** — 2 Punkte |
| `SL.TLF.0714.ZS` (Kinderarbeit) | Weltzeile vorhanden, **alle Werte null** |
| `SI.DST.10TH.10`, `SI.DST.FRST.20` | Weltzeile vorhanden, **alle Werte null** |
| Alle WGI-Codes (`CC.EST`, `RL.EST`, …) | **keine Weltreihe** |

### Fachlich verworfen — trotz verfügbarer Daten

| Kandidat | Richtung | Warum nicht |
|---|---|---|
| **BIP pro Kopf** (`NY.GDP.PCAP.PP.KD`) | **steigt** (+92 %) | Durchsatzmaß, kein Zustandsmaß. Ölkatastrophe und Krebsbehandlung erhöhen es; unbezahlte Sorgearbeit taucht nicht auf. Nur als Kontextzahl neben dem Index. |
| **Einschulungsrate** (`SE.PRM.NENR`) | **steigt** | Der Paradefall „sieht aus wie Fortschritt, misst etwas anderes": Sie stieg fast überall, während vielerorts die Mehrheit der Zehnjährigen keinen einfachen Text lesen kann. Ersetzt durch Abschlussquote. |
| **Schutzgebiete** (`ER.PTD.TOTL.ZS`) | **steigt** (+53 %) | Reihe beginnt erst 2013 — bricht den konstanten Korb. Misst außerdem Ausweisung, nicht Schutzwirkung („paper parks"). |
| **Suizidrate** (`SH.STA.SUIC.P5`) | fällt | Endet 2021, bricht den Korb am anderen Ende. Misst zudem nur die äußerste Spitze psychischer Not. |
| **Transparency-CPI** | — | TI warnt selbst vor Längsschnittvergleichen. Ein Index ohne Zeitvergleichbarkeit kann keinen Trend zeigen. |
| **Freedom House** | — | Zugunsten V-Dem verworfen: geringere Transparenz der Kodierung. Nicht, weil das Ergebnis unbequem wäre — V-Dem zeigt dieselbe Entwicklung. |

### Bereiche, die wichtig sind und trotzdem fehlen

Diese Lücken bleiben **sichtbar benannt**. Wer sie wegdefiniert, kann später
behaupten, sie seien nie ein Thema gewesen.

| Bereich | Was konkret geprüft wurde |
|---|---|
| **Ungleichheit** | Kein Weltwert bei der Weltbank. WID.world hat eine Reihe, ist aber eine andere Methodik — für V1 nicht aufgenommen, für V2 offen. Ersatzweise **zwei Armutsschwellen**: Ihr Abstand macht Verteilung sichtbar. |
| **Psychische Gesundheit** | IHME-Daten über OWID: **HTTP 403** („non-redistributable"). WHO GHO hat nur Infrastruktur-Indikatoren (Vorhandensein eines Plans, Psychiater je 100.000), keine Weltprävalenz. |
| **Einsamkeit** | Alle OWID-Slugs nach „lonel" durchsucht — **null Treffer**. Es gibt keine globale Zeitreihe. |
| **Institutionelle Qualität** | Alle WGI-Codes ohne Weltaggregat (verifiziert). V-Dem-Korruptionsindex hat kein World-Aggregat. |
| **Vertreibung** | UNHCR hat die Daten, aber nicht über die Weltbank-API. Für V2 vorgesehen. |
| **Biodiversität** | Living Planet Index endet 2020 — bricht den Korb. Für V2, wenn das Fenster angepasst wird. |

---

## 6. Die Anker vom Typ C — einzeln begründet

Typ-A- und Typ-B-Anker brauchen keine Begründung: Sie sind logisch (0 %/100 %)
oder von Staaten beschlossen. Typ C ist die schwächste Stelle der Konstruktion und
wird deshalb hier einzeln offengelegt.

| Indikator | Anker | Begründung |
|---|---|---|
| Lebenserwartung | 50 → 85 | Dieselben Marken wie der HDI der UN. Nicht von uns gewählt. |
| Tötungsdelikte | 20 → 0 | 20 je 100.000 entspricht der Größenordnung der am stärksten betroffenen Regionen; 0 ist die logische Grenze. |
| Militärausgaben | 10 % → 0 % | 10 % des BIP ist historisch das Niveau von Kriegswirtschaften. |
| CO₂ absolut | 42.000 Mt → 0 | Obergrenze knapp über dem historischen Höchstwert; 0 ist Netto-Null nach dem Pariser Abkommen. |
| CO₂ pro Kopf | 6 t → 0 | 6 t liegt über dem heutigen Weltdurchschnitt; 0 folgt Netto-Null. |
| Waldfläche | 0 % → 50 % | 50 % der Landfläche entspricht der Größenordnung der vorindustriellen Bewaldung. |

**Warum wir keine beobachteten Korridore verwenden:** Ein Anker aus dem Minimum
und Maximum der eigenen Datenreihe ist kein Anker, sondern eine Stichprobe. Er
wandert mit den Daten, und jede Größe mit offenem Ende sprengt ihn irgendwann.
Konkret geprüft: CO₂ absolut liegt heute über jedem Wert des Fensters 1990–2020 —
ein eingefrorener Korridor hätte den Indikator auf 0 gekappt und **eine tote Zone
von 1.625 Mt** erzeugt, in der sich die Welt hätte verbessern können, ohne dass
die Zahl reagiert.

---

## 7. Die Rechnung

### 7.1 Normierung — Sättigung statt Kappung

```
p        = (anker0 − x) / (anker0 − anker100)      Fortschrittsanteil, unbeschränkt
Position = 100 · p / (p + k)      für p > 0,   mit k = 0,5
Position = 100 · 0,5/(0,5 − p) · 0,02   für p ≤ 0  (jenseits des Referenzpunkts)
```

Eigenschaften, auf die es ankommt:

- **streng monoton** — jede Änderung bewegt die Zahl, in beide Richtungen
- **erreicht nie 0 und nie 100** — keine toten Zonen an den Rändern
- **braucht keine Beobachtung der Zukunft** — nur zwei feste externe Punkte

`k = 0,5` ist die **einzige Zahl in dieser Konstruktion, die wir selbst wählen.**
Sie ist für alle Indikatoren gleich. Wir veröffentlichen die Zahl zusätzlich mit
`k = 0,3` und `k = 1,0` als Empfindlichkeitsangabe.

### 7.2 Aggregation — geometrisch, zweistufig

```
Bereich_j    = (I_j1 · I_j2 · … · I_jn)^(1/n)
Langzeitindex = (B_1 · B_2 · … · B_9)^(1/9)
```

**Warum nicht der Durchschnitt:** Beim arithmetischen Mittel könnte ein Gewinn bei
der Gesundheit einen Einbruch bei der Sicherheit rechnerisch vollständig aufheben.
Das behauptet einen Wechselkurs zwischen geretteten Kindern und verlorenem
Regenwald. Beim geometrischen Mittel geht das nicht: Ein Bereich, der absackt,
zieht die ganze Zahl mit.

### 7.3 Fehlende Daten

- **Lücken zwischen zwei Messpunkten** (betrifft: Armut 2019): linear
  interpoliert, im Chart als dünnere Linie dargestellt.
- **Nach dem letzten Messpunkt:** nie fortgeschrieben, nie extrapoliert. Die
  Kurve endet optisch am letzten harten Datenpunkt.
- **Fortschreiben ist verboten.** Es würde Nicht-Messung als Ausbleiben von
  Verschlechterung darstellen — ein Fehler, der systematisch in eine Richtung
  zeigt.

### 7.4 Zweite Ziffer: die Bewegung

Neben dem Stand steht die Veränderung der letzten zehn Jahre in Punkten pro Jahr.

**Sie kann negativ werden. Das ist so vorgesehen.** Eine Zahl, die nur steigen
kann, misst nicht den Zustand der Welt, sondern unsere Erwartung an ihn.

---

## 8. Vintages und Revisionen

Statistikämter korrigieren alte Werte rückwirkend. Ohne Vorkehrung würde sich die
veröffentlichte Geschichte still ändern.

- Jede Veröffentlichung ist ein **unveränderliches Vintage** (`v2026.1`), mit
  vollständiger Datenmatrix als CSV und SHA-256-Prüfsumme unter fester URL.
- **Jeder zitierbare Wert trägt sein Vintage:** `54,0 (v2026.1)`.
- Zwei getrennte Zeitachsen: die **aktuelle Reihe** (wie wir die Vergangenheit
  heute sehen) und das **Vintage-Archiv** (was wir wann veröffentlicht haben).
- **Änderungsprotokoll in Alltagssprache**, getrennt nach „neue Jahresdaten" und
  „alte Werte von der Quelle korrigiert".
- Eine Ankeränderung ist nie Teil einer Revision. Sie erzwingt ein
  **Major-Vintage** (`v2027.0`) mit neu gerechneter Historie, dargestellt **neben**
  der alten Reihe.

---

## 9. Die Sperrklausel

> **Wenn der Langzeitindex in einem Vintage fällt, wird der Rückgang zur
> Titelmeldung des Tages — mit derselben Gestaltung und derselben Prominenz wie
> jeder Anstieg. Wir stellen keine Erklärung voran, die den Rückgang relativiert.
> Wir passen weder Indikatoren noch Anker noch Gewichte in dem Vintage an, in dem
> der Rückgang auftritt. Methodische Änderungen sind ab dem Tag eines gemeldeten
> Rückgangs für zwölf Monate gesperrt — außer zur Korrektur eines nachgewiesenen
> Rechenfehlers, die dann einzeln, öffentlich und mit Vorher-Nachher-Wert
> dokumentiert wird.**

Diese Klausel ist der Grund, warum dieses Dokument vor dem ersten Lauf existiert.
Eine Selbstverpflichtung, die man abgibt, nachdem man das Ergebnis kennt, ist
keine.

---

## 10. Drei Sätze, die nicht wegkonstruierbar sind

Sie gehören wörtlich und sichtbar auf die Methodikseite:

> **Diese Zahl kann steigen, während es der Mehrheit der Menschen schlechter geht.**
>
> **Wir haben ein wirtschaftliches Interesse daran, dass diese Zahl steigt.**
>
> **Diese Zahl beschreibt nicht heute. Sie beschreibt einen Datenstand von vor
> ein bis vier Jahren — und die schlechtest gestellten Länder sind darin am
> schlechtesten erfasst.**

Zum ersten Satz, belegt an echten Daten: Armut unter 3 $, 1995 → 2024.
Ostasien −53,7 Punkte, Südasien −43,3, **Welt −29,0**, Subsahara-Afrika −19,3.
Der Weltwert beschreibt keine einzige Region.

Zum dritten Satz: Der Datenverzug ist **nicht zufällig verteilt**. Fragile Staaten
und Konfliktgebiete melden am spätesten. Der Index hat dadurch einen eingebauten
Aufwärts-Bias — nicht durch Absicht, sondern durch Datenverfügbarkeit.

---

## 11. Abbruchkriterien für den ersten Lauf

Der Index wird zuerst vollständig gerechnet — **nur als CSV, ohne jede
Visualisierung.** Der wirksamste Schutz gegen unbewusstes Schönrechnen ist, die
Zahl zu sehen, bevor man in sie investiert hat.

| Befund | Konsequenz |
|---|---|
| Weniger als 7 der 9 Bereiche haben 2019–2023 Werte | **Abbruch** — ein Index ohne die letzten Jahre ist ein Geschichtsprodukt |
| Robustheitsquote unter 90 % (10.000 Zufallsgewichtungen) | **Abbruch** — hängt die Richtung von der Gewichtung ab, trägt die Aussage nicht. Dann: keine Zahl, nur neun Kurven |
| Haupt- und Kernreihe divergieren um mehr als 5 Punkte | **Abbruch** — der Trend wäre überwiegend Korbwechsel |
| **Alle 9 Bereiche steigen** | **Abbruch und Rückbau** — beweist einen Fehler in Normierung oder Ankern |
| Eigene Variante über dem 80. Perzentil aller vertretbaren Varianten | **nicht veröffentlichen**, überarbeiten |
| Kein Knick 2020 (COVID) | **Warnung** — die Glättung muss gefunden werden, bevor gebaut wird |

Zusätzlich die **Multiverse-Probe**: Der Index wird über alle vertretbaren
Varianten durchgerechnet (geometrisch vs. arithmetisch, andere `k`, jeder Bereich
einmal weggelassen, Median statt Mittel). Die Verteilung wird veröffentlicht, mit
unserer Variante darin markiert.

---

## 12. Was wir bewusst nicht bauen

| | Warum nicht |
|---|---|
| **Tageszähler** („seit gestern X Kinder weniger") | Die kontrafaktische Hochrechnung ist nicht seriös rechenbar. Eine ehrliche Spanne müsste den Faktor 2 überspannen — das kommuniziert keine Größenordnung mehr. |
| **Story-Marker auf der Indexkurve** | Eine Story von gestern landet zwangsläufig rechts vom letzten harten Datenpunkt. Stories bekommen eine Bereichszuordnung, keine Punktverortung. |
| **ETA / Restlaufzeit** | Eine lineare Restlaufzeit auf einer nichtlinearen Kurve ist eine Falschaussage. |
| **Streaks, Punkte, Abzeichen** | Extrinsische Belohnung verdrängt das Interesse an der Sache. |
| **Fortschrittsbalken ohne zählbaren Rest** | „Armut" und „Klima" haben keinen Endzustand. Ein Balken würde Vollendbarkeit erfinden. |
| **Öffentlicher Gewichtungsregler** | Rhetorische Entlastung ohne Wirkung. Stattdessen: die Robustheitsspanne veröffentlichen. |

---

## Änderungsprotokoll

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-01 | Erstfassung. 9 Bereiche, 25 Indikatoren, Fenster 2005–2023. Alle Codes gegen die API verifiziert. Vor dem ersten vollständigen Lauf festgelegt. |
