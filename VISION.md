# VISION.md — NurEine

> **PFLICHTLEKTÜRE. Lies dieses Dokument VOR jeder Arbeit an NurEine — Code,
> Konzept, Text, Redaktion.** Es ist die einzige verbindliche Quelle für
> Zielbild, Produktausrichtung und interne Roadmap. Bei Widerspruch zu einem
> anderen Dokument gilt dieses hier.
>
> **Stand:** 2026-09-01 · **Status:** Entwurf, in Evaluierung
> **Bearbeitbar unter:** `/admin/vision`
>
> **Letzte Änderung (2026-09-01):** Der globale Index wurde durch sechs
> Fachgutachten geprüft (Abschnitt 16). Abschnitt 6 ist dadurch an mehreren
> Stellen überholt — die Gutachten-Fassung gilt. Neue Entscheidungen D-04
> bis D-11, neue offene Punkte E-05 bis E-07.
>
> ⚠️ **KURSÄNDERUNG am selben Tag (D-12, Abschnitt 17):** Der Index ist kein
> Fortschrittsindex mehr, sondern ein **Zustandsbild**. Das ändert die
> Auswahlregel und macht Teile von Abschnitt 16 hinfällig. **Lies Abschnitt 17,
> bevor du Abschnitt 16 anwendest.**

---

## Wie mit diesem Dokument gearbeitet wird

Es ist zugleich Vision **und** interne Roadmap. Der Ablauf:

1. **Vision festhalten** (dieses Dokument, Abschnitte 1–12) ✅ erledigt
2. **Entwürfe bauen** — mit Claude Prototypen erstellen und ansehen
3. **Evaluieren** — mit Claude prüfen: ist das Feature wirklich eine gute Idee?
4. **Ergebnis hier eintragen** — jede Festlegung kommt in Abschnitt 13
   („Evaluierungen & Entscheidungen"), nicht in einen Chatverlauf

Was nicht in diesem Dokument steht, ist nicht entschieden. Chatverläufe sind
flüchtig, dieses Dokument ist das Gedächtnis.

**Regeln für Claude-Sessions:**
- Vor Arbeitsbeginn lesen — besonders Abschnitt 13 (was schon entschieden ist).
- Nach einer Festlegung Abschnitt 13 ergänzen (Datum, Entscheidung, Begründung).
- Eine Entscheidung nie stillschweigend umkehren. Widerspruch benennen und
  Aaron fragen.
- Status eines Features in Abschnitt 14 (Roadmap-Board) mitpflegen.

---

## 0. Ehrlicher Ausgangspunkt (Stand 2026-08-26)

Damit dieses Dokument nicht über der Realität schwebt:

| Größe | Ist-Wert |
|---|---|
| Bestätigte Newsletter-Abonnenten | **15** |
| Geschichten in der Datenbank | 1294 |
| Öffentliche Roadmap-Einträge | 50 |
| iOS-App | gebaut, **nicht** im App Store |
| Kurzvideos | laufen, manuelle Freigabe |

**Der offene Konflikt:** `FAHRPLAN.md` (Stand 2026-06-13) sagt: *„30 Tage, ein
Ziel: von 13 → ~200 echte Nutzer. KEIN neues Feature."* Seitdem sind aus 13
Nutzern 15 geworden — und es wurden sehr viele Features gebaut.

Dieses Dokument beschreibt ein großes Feature-Programm. Das steht in direktem
Widerspruch zum Fahrplan. **Das ist kein Fehler im Dokument, sondern eine
Entscheidung, die Aaron bewusst treffen muss** — siehe Abschnitt 13, offene
Entscheidung E-01. Bis dahin gilt: Bauen ist erlaubt, aber die Frage „bringt
uns das Leser?" steht bei jedem Feature mit im Raum.

---

## 1. Zielbild

NurEine entwickelt sich von einer Plattform für „eine gute Nachricht am Tag" zu
einer **vertrauenswürdigen Verbindung zum realen Zustand der Welt**.

Die tägliche Story bleibt bestehen, ist künftig aber nicht mehr das gesamte
Produkt. Sie ist der Einstieg in ein größeres System: eine ruhige,
nachvollziehbare Übersicht darüber,

- wo die Welt nachweislich besser wird,
- in welchen Bereichen Fortschritt passiert,
- wie schnell sich zentrale Entwicklungen verändern,
- welche konkreten Ereignisse zu langfristigen Trends gehören,
- und worauf jede Aussage beruht.

Die zentrale Positionierung lautet:

> Du brauchst nicht zehn Apps, Newsfeeds und Social-Media-Quellen, um zu
> verstehen, wo die Welt wirklich steht. Nur eine.

Wichtig: NurEine ist **keine** Plattform, die behauptet, „alles sei gut". Sie
zeigt belegbaren Fortschritt, ordnet ihn ehrlich ein und benennt auch Grenzen,
Unsicherheiten und Rückschritte. Die Differenzierung ist nicht „Good News",
sondern **faktenbasierter Fortschrittsjournalismus mit überprüfbarem Kontext**.

Die bisherige Bedeutung von „NurEine" erweitert sich dadurch:

- Früher: „Nur eine gute Nachricht am Tag."
- Künftig: „Nur eine Verbindung zur echten Welt."
- Als Index-Formel: „Nur eine Zahl, die zeigt, wo die Welt steht."

---

## 2. Informationsarchitektur

Die tägliche Story bleibt das redaktionelle Kernformat. Zusätzlich wird die
Website um zwei gleichwertige Produktbereiche erweitert:

| Bereich | Aufgabe | Nutzerfrage |
|---|---|---|
| Heute / Story | Eine konkrete, menschlich erzählte Entwicklung | „Was ist heute passiert?" |
| Karte der Hoffnung | Wo Fortschritt lokal und weltweit sichtbar wird | „Wo passiert gerade etwas Gutes?" |
| Globaler Wirkungsindex | Aggregierter, transparenter Zustand zentraler Weltentwicklungen | „Wo stehen wir insgesamt — woher kommen wir und wohin gehen wir?" |

Die Navigation sollte perspektivisch klar auf diese drei Ebenen zugeschnitten
werden:

- **Heute** — die kuratierte Story bzw. Stories
- **Der Stand der Welt** oder **Weltindex** — globaler Wirkungsindex, Trends,
  Ziele und Zeitlinien
- **Karte der Hoffnung** — räumliche Ebene aller belegten Entwicklungen
- Archiv / Themen / Bei dir / Manifest als sekundäre Navigation

Der heutige Artikel-Wirkungsindex bleibt erhalten, muss aber klar vom späteren
globalen Wirkungsindex getrennt sein:

- **Story-Wirkungsindex**: Wie groß, dauerhaft und gut belegt ist die Wirkung
  einer einzelnen Story?
- **Globaler Wirkungsindex**: Wie entwickeln sich langfristige, datenbasierte
  Weltindikatoren tatsächlich?

Diese beiden Zahlen dürfen nicht vermischt werden.

---

## 3. Artikel-Seite erweitern

Die vorhandene Story-Seite ist visuell bereits eine gute Grundlage: starke
Headline, ruhige Typografie, Bild, Story, Wirkungsindex, Weitererzähl-CTA und
Newsletter. Ergänzt werden soll eine neue Ebene aus **Kontext, Beleg und
Einordnung**.

### 3.1 Neues Modul: „Einordnung im großen Bild"

Direkt nach dem Story-Wirkungsindex oder vor dem „So erzählst du es
weiter"-Block soll ein neues Kontext-Modul erscheinen.

Beispiel für die Niger-Story:

> **Was diese Geschichte im großen Bild bedeutet**
> Die Wiederbegrünung in Niger ist ein lokaler und regionaler Fortschritt. Sie
> zahlt auf den langfristigen Trend „Wiederherstellung degradierter Flächen in
> der Sahelzone" ein.
>
> Die Welt ist beim Ziel, 350 Millionen Hektar degradierte Flächen bis 2030
> wiederherzustellen, bei X %.
> Niger trägt mit 5 Millionen Hektar sichtbar dazu bei.
>
> **Ein großer regionaler Schritt — aber kein Beweis, dass globale Entwaldung
> insgesamt gelöst ist.**

Dieses Modul muss drei Dinge gleichzeitig leisten:

- Die Story einem **konkreten übergeordneten Indikator** zuordnen
- Den langfristigen **Trend** sichtbar machen
- Die Bedeutung der Story **ehrlich proportional** einordnen

Nicht jede Story muss den globalen Trend messbar bewegen. Das darf ausdrücklich
sichtbar sein. Der Standardtext kann z. B. lauten:

> Diese Entwicklung ist wichtig für die betroffene Region. Global verändert sie
> den Indikator noch nicht messbar, sie ist aber ein belegter Schritt in
> dieselbe Richtung.

Das ist ein zentraler Vertrauensmechanismus. NurEine darf einzelne Erfolge
nicht künstlich als globale Wendepunkte darstellen.

### 3.2 Neues Modul: „Die Zahl im Kontext"

Jede zentrale Zahl in einer Story soll mindestens einen der folgenden Kontexte
erhalten:

- Historischer Verlauf: „vor 10 Jahren / heute"
- Anteil am Ziel: „X % des 2030-Ziels"
- Größenvergleich: „entspricht ungefähr …"
- Regionaler/globaler Anteil: „X von Y"
- Unsicherheit: „Schätzung", „vorläufig", „Stand von …"
- Entwicklungstempo: „pro Jahr", „pro Monat", „schneller/langsamer als zuvor"

Beispiel — nicht nur:

> 5 Millionen Hektar wurden wiederbegrünt.

Sondern:

> In Niger wurden rund 5 Millionen Hektar wiederbegrünt — ungefähr so viel
> Fläche wie Niedersachsen. Das entspricht rund X % des landesweiten
> Wiederherstellungsziels und ist Teil der afrikanischen AFR100-Initiative.

Zahlen ohne Bezugsrahmen sollen künftig vermieden werden.

### 3.3 Rosling-/Denkfehler-Tag

Optionales, leichtgewichtiges Story-Metadatum:

> **Diese Geschichte korrigiert:** den Negativitäts-Instinkt
> Fortschritt ist oft langsamer, leiser und weniger sichtbar als Krisen.

Oder:

> **Diese Geschichte korrigiert:** den Generalisierungs-Instinkt
> Die Sahelzone ist nicht nur Dürre und Krise; sie enthält unterschiedliche
> lokale Entwicklungen.

Das soll nicht belehrend wirken und zunächst nur bei wirklich passenden Storys
erscheinen.

### 3.4 Ich-Perspektive für ausgewählte Stories

Für besonders menschliche oder langfristige Entwicklungen soll es ein
alternatives Format geben:

- „Ich bin Aïcha. Seit drei Jahren schneide ich diese Triebe zurück …"
- „Als unser Dorf erstmals Zugang zu Strom bekam …"
- „Ich arbeite im Labor, das diese Krankheit heute nicht mehr nachweist …"

Dies ist kein Standard für jede Story. Es ist ein **Premium-Story-Format** für
Fälle, in denen eine reale Person, direkte Quelle und belastbares
Bild-/Interviewmaterial existieren.

Ziel: Fakten und emotionale Nähe verbinden, ohne in Pathos oder NGO-Werbung
abzurutschen.

---

## 4. Externe Beweise pro Story

Jede Story soll künftig nicht nur durch einen Quellenlink am Ende belegt sein,
sondern durch einen klar sichtbaren, strukturierten **Beweis-Layer**.

Der Leser soll nicht nur denken „Das klingt plausibel", sondern sehen: „Ich kann
selbst überprüfen, woher das kommt und wo es passiert."

Forschung zu Faktenchecks bewertet direkt zugängliche Belege als zentralen
Bestandteil von Transparenz und unabhängiger Überprüfbarkeit.
Geolocation-Verfahren kombinieren Karten, Bilder und Satellitendaten, um den Ort
eines Ereignisses nachvollziehbar zu machen.
([tandfonline](https://www.tandfonline.com/doi/full/10.1080/1461670X.2026.2633165))

### 4.1 Neues Modul: „Belegt durch"

Unter der Story oder direkt beim Wirkungsindex wird ein einheitliches
Proof-Modul eingeführt:

> **Belegt durch**
> ✓ Primärquelle / Studie
> ✓ Offizielle Datenquelle
> ✓ Ort auf der Karte
> ✓ Bildnachweis
> ✓ Weitere unabhängige Einordnung

Jedes Element ist nur sichtbar, wenn es tatsächlich vorhanden ist. Keine leeren
Badges und keine implizite Verifikation.

### 4.2 Pflichtfelder je Story

Für jede veröffentlichte Story soll die Pipeline bzw. Redaktion nach Möglichkeit
erzeugen oder prüfen:

```ts
type StoryEvidence = {
  primarySources: Array<{
    title: string
    publisher: string
    url: string
    sourceType:
      | "official-data"
      | "study"
      | "government"
      | "ngo-report"
      | "institution"
      | "journalism"
    publishedAt?: string
  }>
  independentSources: Array<{
    title: string
    publisher: string
    url: string
  }>
  location?: {
    label: string
    countryCode: string
    latitude: number
    longitude: number
    precision: "exact" | "city" | "region" | "country"
    mapUrl?: string
    bounds?: [number, number, number, number]
  }
  image?: {
    url: string
    attribution: string
    license?: string
    originalUrl?: string
    verifiedLocation?: boolean
    locationVerificationNote?: string
  }
  satelliteComparison?: {
    available: boolean
    provider: "Sentinel Hub" | "Google Earth" | "Landsat" | "other"
    beforeDate: string
    afterDate: string
    beforeImageUrl: string
    afterImageUrl: string
    caption: string
    methodologyUrl?: string
  }
}
```

### 4.3 Kartenbeleg pro Story

Bei geografisch zuordenbaren Storys wird ein Kartenmodul eingebaut:

> **Hier passiert es**
> Niger · Region Zinder · ungefährer Projektbereich
> [Auf Karte öffnen]

Anforderungen:

- Auf der Story-Seite: reduzierter Kartenausschnitt, keine überladene Karten-App
- Externer Link: Google Maps, OpenStreetMap oder Google Earth
- Transparenz über Genauigkeit: „genauer Ort", „Region", „Land" oder
  „ungefähres Projektgebiet"
- Kein erfundener präziser Pin, wenn Quellen nur eine Region nennen
- Klick auf den Pin öffnet Kartenansicht oder passenden Filter auf der
  NurEine-Karte

### 4.4 Satelliten-Vorher/Nachher für passende Umweltstories

Für bestimmte Umwelt- und Infrastruktur-Storys kann ein besonderes Proof-Format
entstehen:

> **Aus dem All sichtbar**
> Vegetationsentwicklung im Projektgebiet: 2000 → 2026
> [Vorher/Nachher-Slider]

Geeignete Fälle: Wiederbegrünung und Aufforstung · Entwaldungsstopp ·
Renaturierung · Gletscher-, Gewässer- oder Küstenentwicklung · Solar-/Windpark-
Ausbau · großflächige Agrar- oder Infrastrukturveränderungen

Nicht geeignete Fälle: medizinische Durchbrüche · Gesetzesänderungen ·
Bildungsprogramme · einzelne soziale Projekte · Ereignisse ohne klar
abgrenzbaren geografischen Bereich

Sentinel Hub stellt APIs für historische und aktuelle Satellitendaten bereit;
solche Daten können für räumlich großflächige Veränderungen als visuelle
Ergänzung genutzt werden.
([dataspace.copernicus](https://dataspace.copernicus.eu/analyse/apis/sentinel-hub))

Das ist ein späteres Differenzierungsfeature, keine Voraussetzung für Version 1.

### 4.5 Foto- und Ortsverifikation

Ein Badge wie „📍 Ort verifiziert" darf nur erscheinen, wenn die Redaktion oder
ein dokumentierter Verifikationsprozess den Ort tatsächlich bestätigt hat.

Mögliche Stufen:

- **Bildquelle dokumentiert**: Herkunft und Lizenz des Bildes bekannt
- **Ort bestätigt**: Bild stammt nachweislich aus der genannten Region
- **Vor Ort dokumentiert**: eigenes Material / Partner-Material mit direkter
  Standortbestätigung

Keine Badge-Verwendung bei Stockfotos, generischen Illustrationen oder
KI-generierten Bildern. In diesen Fällen muss es klar gekennzeichnet sein:

> Symbolbild / Illustration — zeigt nicht den konkreten Ort der Geschichte.

⚠️ **Aktuelle Realität:** NurEine erzeugt Story-Bilder heute mit Seedream (KI).
Das heißt: Der Bildnachweis-Haken in 4.1 darf für diese Bilder **nie** gesetzt
werden, und die Kennzeichnung „Illustration" ist Pflicht, nicht optional.

---

## 5. Karte der Hoffnung weiterentwickeln

Die bestehende Karte ist der richtige Ausgangspunkt. Sie soll von einer Karte
mit archivierten Story-Pins zu einem **lebenden Fortschrittsfenster** werden.

Die Karte zeigt künftig drei Ebenen:

1. **Ereignisse:** einzelne belegte Storys als Punkte
2. **Entwicklungen:** Trends und Indikatoren je Region/Thema
3. **Zeit:** wie sich die Sicht auf die Welt verändert, wenn man zurück- oder
   vorspult

### 5.1 Batch-Ritual statt Fake-Echtzeit

Da neue Stories nur zwei Mal täglich als Batch veröffentlicht werden, darf die
Karte keine künstliche Sekunde-für-Sekunde-Echtzeit simulieren.

Stattdessen:

- Zwei klar definierte Update-Fenster pro Tag
- Neue Story-Punkte erscheinen sichtbar auf der Karte
- Dezente Einflug-/Lichtpunkt-Animation
- Sehr zurückhaltender Signatur-Sound, standardmäßig stumm bzw. nur nach
  Nutzer-Interaktion aktiv
- Kurzer Header-Hinweis: „12 neue Entwicklungen seit heute Morgen"

Mögliche Benennung: **Die Eine am Morgen** · **Die Eine am Abend** · **Neuer
Stand der Welt** · **Heute hinzugekommen**

Nicht übergamifizieren. Der Effekt soll sich wie ein ruhiger „Update-Moment"
anfühlen, nicht wie ein Slot-Machine-Reward.

> ℹ️ **Bereits gebaut (2026-08-26):** Die Klang-Schicht dafür existiert schon —
> `src/lib/sound/` mit `livePulse()` für Kartenpunkte, opt-in, Default stumm,
> respektiert `prefers-reduced-motion`. Siehe Entscheidung D-03.

### 5.2 Zeitregler: Herkunft, Gegenwart, Richtung

Unterhalb der Karte kommt ein Zeitregler: Letzte 24 Stunden · 7 Tage · 30 Tage ·
Letztes Jahr · Seit Start von NurEine

Bei Bewegung durch die Zeit:

- Story-Pins erscheinen bzw. verschwinden entsprechend ihrem
  Veröffentlichungs-/Ereignisdatum
- Nutzer sieht, wie sich die Karte füllt
- Rechts erscheint eine kompakte Zusammenfassung: Anzahl Stories, Kategorien,
  Länder, Summe/Verteilung der Story-Wirkung
- Keine Behauptung, die Welt werde allein anhand der Anzahl veröffentlichter
  Storys besser

Der Zeitregler ist primär eine Darstellung der **redaktionell belegten
Fortschrittsereignisse**, nicht der globale Welttrend. Diese Trennung muss in
UI-Copy klar bleiben.

### 5.3 Filter: von Themen zu Indikatoren

Die heutigen groben Kategorien können bleiben, müssen aber erweiterbar sein:
Klima/Umwelt · Gesundheit · Bildung/Chancen · Sicherheit/Frieden ·
Wissenschaft/Innovation · Rechte/Freiheit · Armut/Lebensstandard ·
Menschlich/Gemeinschaft · Tiere/Biodiversität

Zusätzlich soll jede Story künftig mindestens einem spezifischen **Indikator**
zugeordnet werden, z. B.: Kindersterblichkeit · Zugang zu sauberem Wasser ·
Impfquote · Malaria-Fälle · Wiederhergestellte Ökosysteme · CO₂-Intensität des
Strommixes · Erneuerbare Stromerzeugung · Alphabetisierung · Extreme Armut ·
Pressefreiheit · Frauen in Bildung oder Erwerbsarbeit

Klick auf einen Themenfilter zeigt weiterhin Stories. Klick auf einen
spezifischen Indikator öffnet künftig Trend, Quelle, Ziel und die zugehörigen
Storys.

### 5.4 Seitenleiste: Stories plus Trend-Puls

Die heutige rechte Seitenleiste zeigt überwiegend Einzelstorys. Sie soll oben um
einen kompakten Bereich **„Puls der Welt"** ergänzt werden.

| Bereich | Darstellung | Aussage |
|---|---|---|
| Klima | Mini-Sparkline + Richtung | Langfristiger Indikator entwickelt sich in welche Richtung? |
| Gesundheit | Mini-Sparkline + Zielstatus | Welche messbaren Fortschritte sind sichtbar? |
| Bildung | Mini-Sparkline + Datumsstand | Wann wurde die Statistik zuletzt aktualisiert? |
| Sicherheit | Mini-Sparkline + Unsicherheitsmarker | Entwickelt sich der Wert zuverlässig oder mit Vorbehalt? |

Eine Sparkline ist ein kleines, achsenloses Trenddiagramm. Sie soll nicht
komplexe Statistik erklären, sondern auf einen Blick vermitteln: steigt · fällt ·
stagniert · beschleunigt · verlangsamt sich · oder ist aktuell nicht belastbar
genug.

Unter diesem Puls-Bereich bleibt die bestehende Liste neuer/hoch bewerteter
Storys.

---

## 6. Globaler Wirkungsindex

> ⚠️ **Teilweise überholt seit 2026-09-01.** Sechs Fachgutachten haben die
> Konstruktion geprüft (Abschnitt 16). Wo dieser Abschnitt und Abschnitt 16
> sich widersprechen, **gilt Abschnitt 16**. Konkret überholt:
> - **6.3 Bausteine** → ersetzt durch 8 Domänen mit verifizierten Indikatoren (D-06)
> - **6.4 Darstellung** → die nackte Zahl „67,4/100" ist so nicht zulässig (D-05)
> - **6.5 Berechnung** → geometrisch ist nicht „Alternative", sondern gesetzt (D-07)
> - **Name** → „Globaler Wirkungsindex" ist verworfen (D-04)
>
> Zweck (6.1) und die Abgrenzung zum Story-Score (6.2) gelten unverändert
> weiter und wurden durch die Gutachten bestätigt.

### 6.1 Zweck

Der globale Wirkungsindex ist das neue Herzstück von NurEine.

Er ist **nicht** die Summe der veröffentlichten Good-News-Storys. Er ist auch
kein täglich künstlich wechselnder Stimmungswert. Er ist eine datenbasierte,
transparente Zusammenfassung zentraler langfristiger Weltentwicklungen.

Er beantwortet drei Fragen:

1. **Wo stehen wir?** — aktueller globaler Wert
2. **Woher kommen wir?** — historische Entwicklung
3. **Wie schnell bewegen wir uns?** — Tempo, Richtung und, sofern seriös
   möglich, Distanz zum Ziel

Der Index soll die Rosling-Idee produktisieren: Die Welt ist weder pauschal gut
noch pauschal schlecht. Sie verändert sich in verschiedenen Bereichen
unterschiedlich schnell. NurEine zeigt diese Realität verständlich, sichtbar und
quellenoffen.

### 6.2 Nicht mit Artikel-Score verwechseln

| System | Einheit | Datengrundlage | Zweck |
|---|---|---|---|
| Story-Wirkungsindex | einzelne Story, 0–100 | Reichweite, Dauerhaftigkeit, Belegbarkeit | Qualität/Bedeutung eines einzelnen Ereignisses |
| Globaler Wirkungsindex | Welt bzw. Teilbereich, 0–100 | langfristige Indikator-Zeitreihen | tatsächlicher Zustand/Trend der Weltentwicklung |

Eine Story darf den Story-Wirkungsindex 95 haben und gleichzeitig zum globalen
Index fast nichts beitragen. Das ist korrekt und muss sichtbar bleiben.

### 6.3 Index-Bausteine

| Baustein | Leitfrage | Beispielindikatoren |
|---|---|---|
| Gesundheit | Leben Menschen länger und gesünder? | Kindersterblichkeit, Impfungen, vermeidbare Krankheiten, Zugang zur Versorgung |
| Lebensstandard | Können Menschen sicherer und selbstbestimmter leben? | extreme Armut, Zugang zu Strom, Wasser, Ernährung |
| Bildung & Chancen | Haben mehr Menschen Wissen und Handlungsmöglichkeiten? | Schulbesuch, Alphabetisierung, Bildungszugang, digitale Teilhabe |
| Klima & Natur | Wird die Lebensgrundlage stabiler geschützt und wiederhergestellt? | Emissionsintensität, erneuerbare Energien, Renaturierung, Schutzgebiete, Biodiversität |
| Sicherheit & Frieden | Leben Menschen sicherer und freier von Gewalt? | Konfliktopfer, Mordrate, Vertreibung, Sicherheit im Alltag |
| Rechte & Freiheit | Werden Menschen freier und gleichberechtigter behandelt? | demokratische Teilhabe, Pressefreiheit, Gleichstellung, rechtliche Schutzrechte |
| Wissen & Problemlösung | Werden neue Lösungen messbar nutzbar? | medizinische Innovationen, wissenschaftliche Durchbrüche mit realer Umsetzung |

Nicht jeder Bereich muss ab Tag eins enthalten sein. Gesundheit, Lebensstandard,
Bildung sowie Klima/Natur sind wahrscheinlich die stabilsten ersten Säulen, weil
hierfür relativ gute internationale Datenreihen bestehen.

Der Human Development Index ist ein gutes methodisches Vorbild: Er verdichtet
mehrere klar benannte Dimensionen zu einer verständlichen Kennzahl, ohne zu
verschleiern, welche Einzelindikatoren darin enthalten sind.
([link.springer](https://link.springer.com/rwe/10.1007/978-3-031-25984-5_557))

### 6.4 Darstellung auf der Website

Die Seite „Der Stand der Welt" soll nicht wie ein Finanzdashboard wirken. Ruhig,
visuell klar, verständlich.

**Above the fold:**
- Große globale Indexzahl, z. B. `67,4 / 100`
- Richtung: `+0,6 Punkte gegenüber 2020`
- Aussage in Klartext: `Die Welt macht messbare Fortschritte — ungleichmäßig,
  aber in mehreren Bereichen.`
- Historische Hauptlinie: z. B. 1990 → heute
- Datumsstand: `Datenstand: August 2026`
- Transparenzlink: `So wird diese Zahl berechnet`

**Direkt darunter: Bausteine.** Jeder zeigt Name/Icon, Teilindex 0–100, kleine
Sparkline, Richtung/Veränderung, Datenstand, einen Satz zur Lage, Link zu
Details und zugehörigen Storys.

> **Gesundheit**
> 74,2 / 100 · ↑ 1,8 Punkte seit 2020
> Kindersterblichkeit sinkt langfristig weiter, Fortschritt bei Impfungen bleibt
> regional ungleich.
> Datenstand: 2025 · [Gesundheit im Detail]

**Ziele / „Sind wir gleich da?"** — zusätzlich zu offenen Trends gibt es klar
definierte Ziele, bei denen ein Fortschrittsbalken seriös möglich ist:
Polio-Ausrottung · Zugang zu Elektrizität · Zugang zu sicherem Trinkwasser ·
Ende bestimmter vernachlässigter Krankheiten · Wiederherstellung degradierter
Flächen · Anteil erneuerbarer Energien · Reduktion von Kindersterblichkeit

```txt
Polio-Ausrottung
██████████████████░░ 94 %
Noch betroffen: X Länder
Trend: schneller / stabil / gefährdet
Bei aktuellem Tempo: keine fixe Zusage, geschätzte Zielnähe bis …
Quelle: WHO
Letzte Aktualisierung: …
```

Keine harte ETA, wenn Datenlage oder politische Risiken das nicht seriös
erlauben. Dann stattdessen:

> Der Fortschritt reicht bei aktuellem Tempo noch nicht sicher für das Zieljahr.

Das ist ehrlicher als ein künstlicher Countdown.

### 6.5 Berechnungsprinzip

Für jedes Thema gibt es mehrere messbare Indikatoren. Jeder Indikator wird:

1. aus einer dokumentierten Quelle geladen,
2. auf eine einheitliche Skala normalisiert,
3. mit einer klar dokumentierten Richtung versehen,
4. mit einem Datenstand und Unsicherheitsgrad gespeichert,
5. zunächst in einen Teilindex und danach in den globalen Index aggregiert.

```
Teilindex             = Σ  wᵢ · normalisierter Indikatorᵢ
Globaler Wirkungsindex = Σ  Wⱼ · Teilindexⱼ
```

Alternativ kann ein geometrisches Mittel verwendet werden, damit ein sehr
starker Bereich nicht schlechte Werte in einem anderen Bereich vollständig
überdeckt. Das HDI-Prinzip nutzt genau diesen Gedanken.
([dspace.stellamariscollege](http://www.dspace.stellamariscollege.edu.in:8080/xmlui/bitstream/handle/123456789/6166/Deve.pdf?sequence=1&isAllowed=y))

Vor öffentlichem Launch der finalen Zahl braucht es: veröffentlichte
Gewichtungen · nachvollziehbare Normalisierungsgrenzen · Versionierung der
Formel · Changelog bei Methodenänderungen · Anzeige von Datenstand und
Datenlücken · idealerweise externe fachliche Review durch
Statistiker:innen/Fachexpert:innen.

---

## 7. Statistiker-KI: Verbindung von Story und Trend

Die bestehende RSS-Pipeline findet und bewertet relevante positive
Entwicklungen. Sie soll nicht ersetzt, sondern um einen zweiten Layer ergänzt
werden: einen **Statistik- und Kontext-Agenten**.

### 7.1 Problem, das dieser Layer löst

Eine einzelne Nachricht ist ein Ereignis. Ein globaler Indikator ist eine
langsam veränderliche Zeitreihe.

- Story: Trachom in Australien eliminiert
- Übergeordneter Indikator: globale Belastung durch vernachlässigte
  Tropenkrankheiten
- Realität: Die Story ist regional bedeutend, verändert den globalen Wert aber
  eventuell kaum messbar

Daher darf die Produktlogik **nicht** lauten: „Jede positive Story lässt den
globalen Index steigen." Sie muss lauten: „Jede Story wird in den echten Trend
eingeordnet — als lokaler Erfolg, skalierbarer Ansatz, regionaler Wendepunkt
oder messbar globaler Fortschritt."

### 7.2 Aufgaben der Statistiker-KI

```ts
type StoryTrendContext = {
  primaryIndicatorId: string
  secondaryIndicatorIds: string[]
  contributionType:
    | "local-progress"
    | "regional-progress"
    | "evidence-of-trend"
    | "scalable-solution"
    | "global-milestone"
    | "not-measurably-linked"
  estimatedContribution: "not-measurable" | "small" | "moderate" | "large"
  trendDirection: "improving" | "worsening" | "flat" | "mixed" | "unknown"
  eventNovelty: "routine" | "notable" | "unusual" | "potential-turning-point"
  interpretation: string
  caveats: string[]
  evidenceLinks: string[]
  confidence: number
  requiresHumanReview: boolean
}
```

Der Layer soll insbesondere: Storys auf enge Indikatoren mappen · historische
Baselines abrufen · erkennen, ob das Ereignis häufig, ungewöhnlich oder
potenziell wegweisend ist · die Relevanz für lokalen, regionalen oder globalen
Fortschritt einschätzen · Grenzen/Unsicherheiten formulieren · ein
nutzerverständliches Kontextstatement erzeugen · bei niedriger Sicherheit
zwingend menschliche Prüfung verlangen.

### 7.3 Wichtig: KI darf keine Kausalität erfinden

Nicht zulässig:

> Diese neue Solaranlage senkte nachweislich nationale Emissionen.

Wenn nur bekannt ist:

> Diese Solaranlage ging ans Netz und erhöht die installierte erneuerbare
> Kapazität.

Der Agent muss sprachlich differenzieren: „trägt potenziell bei" · „ist Teil
eines dokumentierten Trends" · „liegt zeitlich innerhalb dieser Entwicklung" ·
„der direkte kausale Beitrag ist nicht separat quantifizierbar" · „nach Angaben
von Quelle X" · „noch zu früh für eine belastbare Trendbewertung".

Bei Unsicherheit wird nicht künstlich gerundet oder positiv interpretiert.

### 7.4 Human-in-the-loop

Der Statistik-Layer ist eine redaktionelle Assistenz, kein autonomer
Faktenautor. Pflichtfälle für Review: neue/ungewöhnliche Indikator-Zuordnung ·
behaupteter globaler oder systemischer Effekt · geschätzter quantitativer
Beitrag · medizinische, politische oder konfliktbezogene Storys · niedriger
Confidence-Score · widersprüchliche Quellen · Daten älter als definierter
Aktualitätszeitraum.

---

## 8. Datenmodell und Datenquellen

Als Ausgangspunkt können etablierte, transparente Quellen genutzt werden:
internationale Organisationen, nationale Statistikstellen, wissenschaftliche
Publikationen und spezialisierte Forschungsinstitute. Our World in Data bündelt
Daten aus solchen Quellen und macht die Primärquellen sichtbar.
([ourworldindata](https://ourworldindata.org/search))

### 8.1 Zentrale Entitäten

```ts
type Indicator = {
  id: string
  slug: string
  title: string
  description: string
  categoryId: string
  unit: string
  geographyLevel: "global" | "country" | "region" | "local"
  desiredDirection: "up" | "down"
  measurementFrequency: "daily" | "monthly" | "quarterly" | "yearly" | "irregular"
  sourceMethodologyUrl: string
  calculationVersion: string
  active: boolean
}

type IndicatorObservation = {
  id: string
  indicatorId: string
  geographyCode?: string
  date: string
  value: number
  unit: string
  sourceName: string
  sourceUrl: string
  sourcePublishedAt?: string
  retrievedAt: string
  confidence: "high" | "medium" | "low"
  isEstimate: boolean
  note?: string
}

type IndexComponent = {
  id: string
  indexVersion: string
  indicatorId: string
  weight: number
  normalizationMethod: string
  minValue?: number
  maxValue?: number
  inversionRequired: boolean
}

type IndexSnapshot = {
  id: string
  indexVersion: string
  scope: "global" | "category" | "country"
  categoryId?: string
  geographyCode?: string
  score: number
  delta1Year?: number
  delta5Years?: number
  calculatedAt: string
  dataCoverageScore: number
  methodologyUrl: string
}
```

### 8.2 Datenprinzipien

- Jede Kennzahl bekommt Quelle, Abrufdatum, Veröffentlichungsdatum und Datenstand.
- Jede Berechnung ist versioniert.
- Historische Werte werden nicht lautlos überschrieben.
- Wenn sich eine Quelle revidiert, wird dies im Changelog sichtbar.
- Fehlende Daten senken den Vertrauens-/Abdeckungswert; sie werden nicht
  unsichtbar interpoliert.
- Der Index darf sich nur ändern, wenn neue Daten oder eine klar dokumentierte
  Methodenänderung vorliegen.
- „Live" meint bei Indikatoren: **aktuellster verfügbarer Datenstand**, nicht
  künstliche Sekundentaktbewegung.

> ⚠️ **Schema-Regel beachten:** Neue Tabellen nur per neuer Migrationsdatei in
> `supabase/migrations/`, nie durch Editieren bestehender. RLS-Policies sind
> sicherheitskritisch (siehe CLAUDE.md).

---

## 9. Rückkehr-Mechanik ohne Login und ohne Journaling

NurEine soll keine persönliche Health-/Journaling-App werden. Die Bindung
entsteht über die Verbindung zum Weltfortschritt, nicht über private
Selbstoffenbarung.

```ts
type VisitorProgressState = {
  firstSeenAt: string
  lastSeenAt: string
  visits: number
  viewedStoryIds?: string[]
  consentVersion?: string
}
```

Beim Wiederkommen zeigt die Website zum Beispiel:

> **Seit deinem letzten Besuch**
> 14 neue belegte Entwicklungen auf NurEine.
>
> In dieser Zeit wurden weltweit geschätzt X zusätzliche Menschen mit Strom
> versorgt. Der globale Gesundheitsindex wurde mit neuen Daten aktualisiert.
> Drei neue Fortschritte auf der Karte der Hoffnung.

Regeln: Kein Login-Zwang · keine private Eingabe · kein manipulativer Streak ·
keine Schuld-Sprache bei Abwesenheit · datenschutzrechtlich sauber (Consent,
LocalStorage-Transparenz, einfache Löschmöglichkeit) · nur Aussagen aus echten
Index-/Story-Daten, keine frei erfundenen Live-Zahlen.

---

## 10. Audio, Animation und Designprinzipien

Das Design soll die bestehende ruhige, hochwertige Ästhetik fortführen. Kein
lautes Gamification-Dashboard und keine künstliche Dringlichkeit.

**Zulässig:** Lichtpunkt erscheint bei neuen Storys auf der Karte · Karte
pulsiert subtil beim Batch-Update · Index-Baustein animiert ruhig, wenn neue
Daten ihn ändern · Vorher/Nachher-Satelliten-Slider · dezenter
Bestätigungs-Sound bei bewusst aktivierter Interaktion · Einblendung „Neuer
Datenstand" statt aggressiver Notification.

**Nicht zulässig:** Endlose Count-ups ohne reale Datengrundlage · künstliche
Echtzeitdaten · Konfetti, Lootbox-Logik, aggressive Badges · Streak-Druck ·
Push-Mechaniken, die Angst vor Verpassen erzeugen · Animationen, die schlechtere
oder unsichere Daten kaschieren.

**Marken-Sprachbausteine:** „Nur eine Verbindung zur echten Welt." · „Die Welt
in nur einer Zahl." · „Der Stand der Welt — klar, belegt, ohne Lärm." · „Wo
Fortschritt passiert." · „Was sich seit deinem letzten Besuch verändert hat." ·
„Eine Geschichte. Ein größerer Zusammenhang." · „Nicht perfekt. Aber messbar in
Bewegung." · „Nur eine Welt."

---

## 11. Empfohlene Phasen

### Phase 1: Vertrauen und Kontext
Ziel: Bestehende Story-Seiten sofort glaubwürdiger und verständlicher machen.

Primärquellen-Modul · strukturierte externe Links · Kartenlink bzw.
Kartenausschnitt pro geografischer Story · Ortsgenauigkeits-Label ·
Bildnachweis/Illustrationskennzeichnung · „Die Zahl im Kontext" · einfache,
menschlich redigierte Story-Trend-Einordnung · klare Trennung zwischen
Story-Wirkungsindex und globalem Index · Datenmodell für `StoryEvidence`,
`Indicator` und `StoryTrendContext`.

**Ergebnis:** Jede Story ist nicht nur gut erzählt, sondern unabhängig
überprüfbar und im größeren Zusammenhang lesbar.

### Phase 2: Karte als Fortschrittsfenster
Batch-basierte Kartenupdates · neue Punkt-/Licht-Animation · optionaler Sound
nach Interaktion · Zeitfilter und Zeitregler · erweiterte Kategorien ·
spezifische Indikator-Tags · „Puls der Welt" in der Seitenleiste ·
Mini-Sparklines · Story-Karte mit Verbindung zum jeweiligen Trend.

### Phase 3: Index-MVP
Start mit 3–4 robusten Bausteinen · wenige, gut dokumentierte Indikatoren je
Baustein · Datenimport-Jobs · Versionierung · Index-Snapshots · öffentliche
Methodikseite · globale Zahl mit historischer Trendlinie ·
Baustein-Aufschlüsselung · Datenstand, Quellen und Abdeckungsgrad · keine
künstlichen täglichen Bewegungen.

### Phase 4: Statistiker-KI und Zielsystem
Indikator-Mapping-Agent · Baseline-/Anomalie-Bewertung ·
Contribution-/Relevanzklassifikation · Unsicherheits- und Review-Workflow ·
Ziel-Fortschrittsleisten · seriöse Tempo-/Zielnähe-Aussagen · automatische
Vorschläge für Kontexttexte, aber menschliche Freigabe bei kritischen Fällen.

### Phase 5: Differenzierende Proof-Features
Sentinel-/Landsat-/Google-Earth-gestützte Vorher-Nachher-Module · optionale
Bild-/Ortsverifikations-Workflows · verifizierte Orts-Badges · tiefe
Indikatorseiten · Besucher-Rückkehrmodul („Seit deinem letzten Besuch").

---

## 12. Definition of Done

Die neue Ausrichtung ist produktseitig erreicht, wenn ein Nutzer in weniger als
einer Minute nachvollziehen kann:

1. **Was heute positiv und belegbar passiert ist**
2. **Wo es passiert**
3. **Welche Originalquelle oder Datenbasis dahintersteht**
4. **Ob dies ein lokaler Erfolg, ein regionaler Trend oder ein global messbarer
   Schritt ist**
5. **Wie sich das Themenfeld über Zeit entwickelt**
6. **Aus welchen Daten die große globale Indexzahl besteht**
7. **Wann die Daten zuletzt aktualisiert wurden und wo ihre Grenzen liegen**

Dann ist NurEine nicht mehr nur ein kuratierter Good-News-Feed, sondern eine
ruhige, glaubwürdige Oberfläche für die Frage:

> Wo steht die Welt wirklich — und woran können wir sehen, dass sie sich
> verändert?

Ein zusammengesetzter Index ist nur dann glaubwürdig, wenn seine Dimensionen,
Quellen und Berechnung transparent bleiben. Das sollte bei NurEine nicht als
juristischer Methodik-Anhang behandelt werden, sondern als sichtbarer Teil des
Produkts.
([link.springer](https://link.springer.com/rwe/10.1007/978-3-031-25984-5_557))

---

## 13. Evaluierungen & Entscheidungen

> **Hier kommt alles rein, was festgelegt wurde.** Format: ID · Datum ·
> Entscheidung · Begründung. Offene Punkte als `E-xx`, entschiedene als `D-xx`.
> Eine Entscheidung wird nie gelöscht — bei Änderung wird sie durchgestrichen
> und eine neue darunter ergänzt, mit Verweis.

### Offen — Aaron muss entscheiden

**E-01 · Fahrplan-Konflikt: Nutzer gewinnen vs. Features bauen**
`FAHRPLAN.md` sagt „KEIN neues Feature, erst 200 Nutzer". Dieses Dokument
beschreibt ein Programm über fünf Phasen. Bei 15 bestätigten Abonnenten ist die
Frage real: Baut das Programm eine Plattform für Leser, die es noch nicht gibt?

Denkbare Auflösungen:
- **(a)** Fahrplan gilt weiter, Vision wird erst nach 200 Nutzern gebaut
- **(b)** Vision gilt, Fahrplan wird als überholt markiert
- **(c)** Zwischenweg: nur Phase 1 bauen (macht bestehende Storys glaubwürdiger,
  ist zugleich ein Distributions-Argument), Rest wartet auf Nutzerzahlen

→ *Noch nicht entschieden.*

**E-02 · Was passiert mit den bestehenden Planungsdokumenten?**
Es existieren `ROADMAP.md` (Juni), `FAHRPLAN.md` (Juni), `STRATEGY.md` (Juni),
`BACKLOG.md`, `docs/APP_ROADMAP.md`, `docs/AI_ROADMAP.md`. Wenn VISION.md
Pflichtlektüre ist, brauchen die anderen einen klaren Status — sonst widersprechen
sich mehrere „lebende Dokumente".

→ *Noch nicht entschieden. Vorschlag: alle als „historisch, Stand Juni 2026"
markieren, VISION.md ist die einzige aktuelle Quelle.*

**E-03 · Name des globalen Index**
→ **Entschieden am 2026-09-01, siehe D-04.**

**E-04 · Zwei Batches pro Tag?**
Abschnitt 5.1 nennt zwei Update-Fenster täglich. Der Fetch läuft aktuell
**vier Mal** (06/10/14/18 UTC), der Newsletter einmal (04:20 UTC). Entweder das
Konzept anpassen oder die Cronjobs — Cron-Zeiten nur nach Absprache (CLAUDE.md).

→ *Noch nicht entschieden.*

**E-05 · Die Sperrklausel — echte Selbstverpflichtung, nur Aaron kann sie eingehen**
Der Index wird laut Gutachten **nur dann gebaut**, wenn vorher öffentlich zugesagt
wird, wie mit einem Rückgang umgegangen wird (Wortlaut in 16.6). Kern: Ein
fallender Wert wird zur Titelmeldung mit derselben Prominenz wie ein Anstieg, und
**Methodenänderungen sind danach 12 Monate gesperrt**.

Das ist keine technische Entscheidung, sondern eine Bindung, die ein späteres
„wir justieren mal die Gewichte" ausschließt. Ohne sie lautet die Empfehlung:
keine Gesamtzahl, nur 8 Einzelkurven nebeneinander (die Position des Kartografen).

→ *Noch nicht entschieden. Blockiert V0 — ohne Antwort kein Präregistrierungs-Commit.*

**E-06 · Ich-Perspektive (Abschnitt 3.4) — Konflikt mit dem Beleg-Versprechen**
Abschnitt 3.4 beschreibt ein Ich-Erzähl-Format. In der Sitzung vom 2026-08-27
wurde eingewandt: Eine **künstlich geschriebene** Ich-Erzählung ist eine erfundene
Zeugenaussage und entwertet rückwirkend die Belege-Achse des Story-Wirkungsindex —
bei einem Produkt, dessen Kernvorwurf ohnehin „das ist doch geschönt" lautet.

Der Text in 3.4 sichert das bereits ab („nur wenn reale Person, direkte Quelle und
belastbares Material existieren") — dann ist es aber **Zitat/Portrait, keine
Ich-Fiktion**. Die Formulierung „Ich bin Aïcha …" als generiertes Format bleibt
riskant.

Vorschlag (nicht entschieden): 3.4 umbenennen in „Stimme aus der Quelle" und auf
wörtliche, belegte Zitate mit Name und Rolle beschränken — psychologisch fast
gleichwertig, ohne Erfindungsrisiko.

→ *Noch nicht entschieden.*

**E-07 · Was passiert mit den 18 nicht installierten Cronjobs?**
Geprüft am 2026-08-27: `ops/crontab.txt` enthält 18 Jobs, `crontab -l` kennt
**keinen davon** (nur ein unbeteiligtes Mac-Cleanup-Skript). Keine Logs, keine
Läufe. Die GitHub-Actions wurden am 25.07. abgeschaltet, weil sie parallel zum
Mac-Mini feuerten — der Mac-Mini-Teil wurde nie scharf geschaltet. **Seither läuft
beides nicht.**

Betroffen: Story-Fetch, Social-Publish/-Generate/-Story, Highlight-Mail,
IndexNow-Ping, Weltmetriken (monatlich), Welt-Newsletter, Healthcheck. Der
Healthcheck läuft ebenfalls nicht — deshalb hat nichts Alarm geschlagen.

Zweites Problem: Der Template-Pfad ist `$HOME/NurEine/`, das Repo liegt unter
`/Volumes/SSD 500G/…`. Ein simples `crontab ops/crontab.txt` würde 18 Jobs
installieren, die alle ins Leere laufen (plus Leerzeichen im Pfad → Quoting).

→ *Noch nicht entschieden.* Optionen: (a) alles scharf schalten nach Pfadfix,
(b) nur den Weltmetriken-Job, (c) zurück zu GitHub Actions. Für den Index ist
(b) ausreichend — die Gutachten-Architektur nutzt ohnehin eine GitHub Action
statt des Mini (D-09).

**E-08 · SEO-Agent: Inhalte erzeugen oder Prioritäten vorschlagen?**
Abschnitt 15 hält den Forschungsstand fest. Die Architektur hängt an dieser
Weiche: Schreibt der Agent (Artikel, Hub-Texte), oder sagt er nur, *was* zu tun
ist — welche Seite ausbauen, welche URL indexieren, welcher Zusammenhang trägt?

Die Datenlage spricht für „vorschlagen“: 1.153 Seiten sind „gefunden, nicht
indexiert“ — mehr Inhalt vergrößert diesen Stapel, statt ihn aufzulösen.

→ *Noch nicht entschieden. Blockiert den Bau des Agenten.*

**E-09 · Budget für ein Keyword-Tool?**
Ohne echtes Suchvolumen (SEMrush o. ä., ~140 €/Monat) arbeitet der Agent blind
auf den eigenen Daten. Das geht — ist aber eine andere Konstruktion als mit
Volumendaten. Bei aktuell 2 Klicks pro Quartal ist der Nutzen fraglich.

→ *Noch nicht entschieden.*

### Entschieden

**D-01 · 2026-08-26 · VISION.md ist Pflichtlektüre**
Dieses Dokument ist die verbindliche Quelle für Zielbild und Roadmap. In
`CLAUDE.md` als erste Leseanweisung verankert, im Admin unter `/admin/vision`
sichtbar und bearbeitbar.
*Begründung:* Aaron arbeitet mit vielen parallelen Claude-Code-Sessions. Ohne
eine gemeinsame Quelle driften sie auseinander.

**D-02 · 2026-08-26 · Vorlesen-Funktion eingestellt**
Die automatische Vertonung ist abgeschaltet (`audio_autopilot = false`), der
Roadmap-Eintrag entfernt.
*Begründung:* Verbrauchte ~1.600 ElevenLabs-Zeichen pro Tag für ein Feature ohne
belegte Nachfrage. Das Kontingent wird für Kurzvideos gebraucht.

**D-03 · 2026-08-26 · Klang-Schicht existiert bereits**
`src/lib/sound/` ist gebaut: synthetisiert (0 Bytes Transfer, 1,42 kB gzip),
C-Dur-Pentatonik als Harmonie-Regel, opt-in mit Default stumm, respektiert
`prefers-reduced-motion`. Enthält `livePulse()` für Kartenpunkte und
`countUpSound()` für hochlaufende Zahlen.
*Begründung:* Erfüllt die Anforderungen aus Abschnitt 10 bereits. Abschnitt 5.1
und 10 müssen dieses Feature nicht neu erfinden, sondern nur anwenden.

---

> **D-04 bis D-11 · 2026-09-01 · aus sechs Fachgutachten** (Details: Abschnitt 16)

**D-04 · 2026-09-01 · Der Index heisst „Der Langzeitindex" — löst E-03**
Untertitel: *„24 Reihen zum Zustand der Welt"* (Zahl steht erst nach dem Nulllauf
endgültig fest). Englisch: *The Long-Run Index*.
*Begründung:* Der Name enthält die **Zeitachse, nicht den Zustand**. „Der
Langzeitindex liegt bei 71" klingt unfertig und provoziert die Rückfrage
„verglichen womit?" — der Name arbeitet damit aktiv gegen die Niveau-Lesart, die
laut D-05 ohnehin nicht verteidigbar ist. Er besteht ausserdem den **Fall-Test**:
„Der Langzeitindex ist gefallen" ist ein normaler Satz. Kein Namenskonflikt
geprüft (deutsch und englisch frei).

❌ **Ausdrücklich verworfen: jeder Name mit „Fortschritt".** Drei Gründe, jeder
für sich ausreichend: (1) Das Vorzeichen stünde im Titel — der Vorwurf „kennt sein
Ergebnis, bevor es misst" wäre in der Überschrift bestätigt. (2) „Fortschrittsindex
gefallen" ist ein Selbstwiderspruch und ein kostenloser Screenshot für Kritiker.
(3) Es ist exakt die Rahmung, die bei Eibach & Purdie-Vaughns messbar verlor
(D-08). Zusätzlich dreifach belegt (Bergheim, BMFSFJ, Social Progress Index).
Ebenfalls verworfen: „Menschheitsindex" (zu gross → methodische Falschaussage),
„Weltzustandsindex" (dito).

**D-05 · 2026-09-01 · Es gibt EINE Zahl — aber das Niveau ist nicht zitierfähig**
Aarons Kernversprechen („nur eine Zahl") bleibt. Aber: Belastbar ist nur die
**Richtung**, nie das **Niveau**. Zulässige Schlagzeile: „Seit 1990 um X Punkte
gestiegen" / „6 von 8 Bereichen verbessern sich". Unzulässig: „Der Zustand der
Welt liegt bei 72."

**Technisch erzwungen, nicht redaktionell:** Die Zahl erscheint in keinem View,
keiner OG-Karte, keinem Newsletter-Block und keinem API-Response ohne ihre 8
Domänenwerte. `?fields=index` liefert **400**. Im UI nie grösser als 1,6× der
Domänenwerte.
*Begründung:* Redaktionsregeln erodieren, technische Sperren nicht. Der Verzicht
auf die Zahl (Position des Kartografen) würde laut ESG-Befund nur 6 % des Problems
lösen (Gewichtung) und dafür das Produkt aufgeben.

**D-06 · 2026-09-01 · Acht Domänen — ersetzt die 7 Bausteine aus 6.3**
Überleben · Gesundheit · Ernährung · Materielle Existenzsicherung · Infrastruktur
des Alltags · Sicherheit vor Gewalt · Freiheit und Teilhabe · Ökologische
Lebensgrundlage. **Jede Domäne exakt 1/8**, unabhängig von der Indikatorzahl.

**Ausgeschlossen — jeweils mangels Daten, nicht mangels Bedeutung:** Bildung,
psychische Gesundheit, soziale Einbindung, institutionelle Qualität. Sie bleiben
als **benannte Leerstellen** sichtbar.

⚠️ **Der härteste Ausschluss ist Bildung** — und er widerspricht 6.3, wo Bildung
als eine der „stabilsten ersten Säulen" genannt wird. Grund: Verfügbar sind nur
Abschluss- und Alphabetisierungsquoten (Anwesenheitsmasse). Der einzige Indikator,
der *Gelerntes* misst (`SE.LPV.PRIM`), hat weltweit **zwei Datenpunkte**. Eine
Bildungsdomäne aus Abschlussquoten wäre Ergebnis-Design mit dem richtigen
Vorzeichen — und damit nach D-11 verboten.

**D-07 · 2026-09-01 · Geometrisches Mittel ist gesetzt, nicht „Alternative"**
Korrigiert 6.5. Zweistufig geometrisch (Indikatoren → Domäne → Index), plus Boden
`I' = 1 + 0,99 × I`.
*Begründung:* Arithmetisch mitteln behauptet implizit **einen Wechselkurs zwischen
geretteten Kindern und verlorenem Regenwald**. Der HDI wechselte 2010 aus genau
diesem Grund; hier wiegt das Argument schwerer, weil noch inkommensurablere Grössen
kombiniert werden. Der Boden ist ein deklarierter Kompromiss: ohne ihn setzt ein
einzelner Nullwert den ganzen Index auf null.

**D-08 · 2026-09-01 · Rahmung „das hat gewirkt" statt „X % geschafft"**
Der einzige gut belegte Befund der ganzen Gutachten-Runde. Geiger et al. (2023):
Hoffnung auf **eigenes Handeln r = +0,40**; Hoffnung als **„so schlimm ist es
nicht" r = −0,40**. Dieselben Daten, zwei Lesarten, entgegengesetztes Vorzeichen.

**Bauliche Konsequenz:** Jeder Domänenwert trägt ein Pflichtfeld
`wirkmechanismus` (mit Quelle). Ein Domänenwert ohne ausgefülltes Feld wird
**nicht gerendert**. Der Halbsatz „jederzeit zurückdrehbar" ist Schema-Bestandteil,
keine Stilfrage — er trennt die Verpflichtungs- von der Fortschritts-Rahmung.
Verbotene Formulierungen (Lint-Regel im Build): „schon X % geschafft", „auf dem
besten Weg", „bald erreicht".

**D-09 · 2026-09-01 · Kein Tageszähler — stattdessen der Tagesschnitt**
Ein Zähler „seit gestern X Kinder weniger gestorben" wird **nicht** gebaut. Grund
ist nicht der Bias, sondern die Nichtberechenbarkeit: Der Satz braucht die
Sterberate von *gestern*; der letzte harte Wert ist 2024, und der Datenverzug
korreliert mit Staatsfragilität. Eine ehrliche Spanne müsste „ca. 9.000–19.000"
lauten — eine Spanne über Faktor 2 kommuniziert keine Grössenordnung mehr.

**Stattdessen — und das erfüllt Aarons Game-Gedanken besser:** Der **Tagesschnitt**.
Täglich 06:20 CEST mit dem Newsletter eine deterministisch rotierende Ansicht:
heute ein Indikator, morgen ein Regionenvergleich, übermorgen eine
Divergenz-Ansicht, dann ein Bereich, der fällt. 24 Indikatoren × 4 Ansichtstypen ×
7 Regionen = mehrere hundert echte Tagesansichten.
> **Es ändert sich der Ausschnitt, nicht die Zahl.**

Keine erfundene Zahl, tägliche Veränderung, passt in den bestehenden
Newsletter-Slot. Datenquelle: statisches JSON im Repo, wöchentlich per **GitHub
Action** erneuert — kein Supabase-Livecall, damit der Index einen 402 übersteht.

**D-10 · 2026-09-01 · Story steht NEBEN der Kurve, nicht darauf**
Korrigiert die Erwartung aus 5.4/7.x. Kein Marker auf oder unter der Indexkurve,
keine Zeitachsen-Berührung. Stattdessen drei Textzeilen auf der Story-Karte:

```
BEREICH:        Überleben
GRÖSSENORDNUNG: Betrifft rund 40.000 Menschen.
                Der Bereich Überleben umfasst 8,1 Milliarden.
MECHANISMUS:    Programme dieser Art sind einer der Wege,
                auf denen diese Kurve fällt.
```

*Begründung:* Zwei unabhängige Gutachten kommen aus entgegengesetzten Richtungen
zum selben Schluss. Statistisch: Ein Punktbeitrag von 0,0003 liegt
Grössenordnungen unter der Messunsicherheit — Rauschen als Signal. Psychologisch:
Eine ausgewiesene 0,0003 ist ein **Pseudoinefficacy-Generator**, sie sagt dem Leser
„das war nichts" und senkt die Hilfsbereitschaft. Und praktisch: Die Story von
gestern landet zwangsläufig **rechts vom letzten harten Datenpunkt** (2024) — ein
Kritiker müsste nur eine Woche schlechte Nachrichten auf dieselbe Kurve setzen.
Das ist ein Screenshot, kein Aufsatz.

Damit ist 7.1/7.2 (Statistiker-KI) bestätigt, aber die Ausgabe geändert: Der Layer
liefert **Zuordnung + Grössenordnung + Mechanismus**, keinen quantifizierten
Indexbeitrag. `estimatedContribution` (7.2) bleibt intern, wird nie angezeigt.

**Zusatzregel gegen Selektionsverstärkung:** Eine Story wird nach ihrem eigenen
Wert ausgewählt, *dann* zugeordnet — auch zu Bereichen, die fallen. Wenn nach
6 Monaten keine Story dem Bereich Sicherheit, Klima oder Biodiversität zugeordnet
wurde, ist das ein messbares Alarmsignal und wird im Quartalsbericht ausgewiesen.

**D-11 · 2026-09-01 · Auswahl vor Richtungsprüfung — die Regel gegen Ergebnis-Design**
Indikatoren werden ausgewählt, **bevor** jemand ihre Richtung anschaut.
Auswahlbegründung öffentlich.

❌ **Ausdrücklich verworfen: eine Negativ-Quote** („mindestens ein fallender
Indikator"). Das wäre Ergebnis-Design mit umgekehrtem Vorzeichen — etwas einbauen,
damit es ehrlicher *wirkt*.

✅ **Empirisch bestätigt:** Bei sauberer Methode entstehen negative Bausteine
ohnehin. Der Kartograf definierte 13 Bereiche vor jedem Datenblick; die Bereiche,
die er als am schwersten messbar einstufte, sind exakt die, die fallen — Gewalt,
Klima, Biodiversität. Ergebnis: **5 Domänen steigen, 1 steht still, 2 fallen.**
Keine Quote, sondern Mechanik.

**Ersatz für das Anliegen dahinter (Falsifizierbarkeit):** drei Strukturen statt
einer Quote — (1) **Präregistrierung** mit Git-Zeitstempel vor dem ersten
Datenabruf, (2) die **Verliererliste** aller erwogenen und verworfenen Indikatoren
inklusive Begründung (dass darauf *steigende* Kandidaten stehen — BIP,
Einschulungsrate — ist der Beleg, dass nicht nach Richtung sortiert wurde),
(3) die **Sperrklausel** (E-05).

---

## 14. Roadmap-Board (interner Status)

> Der öffentliche Changelog liegt in der Datenbank (`nureine_changelog`, sichtbar
> unter `/roadmap`). Dieses Board hier ist **intern** und bildet die Vision-Phasen
> ab. Beides nicht verwechseln.

| Phase | Feature | Status | Notiz |
|---|---|---|---|
| — | Klang-Schicht (`src/lib/sound/`) | ✅ gebaut | D-03 |
| — | „Stand der Welt" mit Zahlen-Animation | ✅ gebaut | Basis für 6.4 |
| — | Karte mit Zeitraffer + Live-Puls | ✅ gebaut | Basis für 5.1/5.2 |
| 1 | Primärquellen-Modul („Belegt durch") | ⬜ offen | |
| 1 | Kartenbeleg pro Story | ⬜ offen | Ortsdaten teilweise vorhanden |
| 1 | Ortsgenauigkeits-Label | ⬜ offen | |
| 1 | Illustrations-Kennzeichnung | ⬜ offen | **wichtig** — Bilder sind KI-generiert |
| 1 | „Die Zahl im Kontext" | ⬜ offen | |
| 1 | Story-Trend-Einordnung (manuell) | ⬜ offen | |
| 1 | Datenmodell `StoryEvidence` / `Indicator` | ⬜ offen | neue Migration nötig |
| 2 | Zeitregler auf der Karte | ⬜ offen | Zeitraffer existiert, Regler fehlt |
| 2 | Indikator-Tags je Story | ⬜ offen | |
| 2 | „Puls der Welt" in der Seitenleiste | 🔄 in Arbeit | `src/lib/world-index.ts` + Karten-Seitenleiste, parallele Session (2026-08-29). ⚠️ **Aggregation weicht vom Langzeitindex ab — siehe 16.12** |
| 3 | **V0 · Präregistrierung** | ⬜ offen | **blockiert durch E-05 (Sperrklausel).** Muss vor jedem Datenabruf passieren |
| 3 | **V0.5 · Nulllauf** (`scripts/index_build.py`) | ⬜ offen | Entscheidet, ob überhaupt gebaut wird (16.7) |
| 3 | Index-MVP → **V1 Langzeitindex** | ⬜ offen | 8 Domänen, 24 Indikatoren (16.2). Ersetzt „3–4 Bausteine" |
| 3 | Öffentliche Methodikseite | ⬜ offen | `/methodik` existiert, müsste erweitert werden. Muss die drei Sätze aus 16.8 wörtlich enthalten |
| 3 | Verliererliste (verworfene Indikatoren) | ⬜ offen | Teil von V1, nicht optional — Beleg für D-11 |
| 4 | Statistiker-KI | ⬜ offen | Ausgabe geändert: Zuordnung + Grössenordnung + Mechanismus, **kein** quantifizierter Indexbeitrag (D-10) |
| 4 | ~~Ziel-Fortschrittsleisten mit ETA~~ | ⬜ offen | **ETA gestrichen** (16.11). Balken nur bei zählbarem Rest, z. B. Polio |
| 4 | Tagesschnitt (statt Tageszähler) | ⬜ offen | V2, D-09 |
| 5 | Satelliten-Vorher/Nachher | ⬜ offen | |
| 5 | „Seit deinem letzten Besuch" | ⬜ offen | |
| — | SEO-Agent (Forschung) | 🔄 in Arbeit | Abschnitt 15, wartet auf E-08/E-09 |
| — | Wikidata-Item Q141203108 | ✅ gebaut | 2026-08-28, `sameAs` beidseitig |

Legende: ✅ gebaut · 🔄 in Arbeit · ⬜ offen · ❌ verworfen (mit Verweis auf
Entscheidung in Abschnitt 13)

---

## 15. SEO-Agent — Forschungsstand (Stand 2026-08-29)

> **Status: Forschungsphase, noch nicht gebaut.** Dieser Abschnitt hält den
> Kenntnisstand fest, damit parallele Sessions nicht bei null anfangen. Die
> Architektur folgt erst, wenn E-08 und E-09 (Abschnitt 13) entschieden sind.

### 15.1 Der Auslöser

Aarons Idee: ein täglicher Agent, der beobachtet, was gerade gesucht wird, und
NurEine dort positioniert. Ausdrücklich **kein Slop** — sondern KI nutzen, um
Ereignisse zu verbinden, Zusammenhänge zu sehen und einseitig gehypte Nachrichten
mit Daten einzuordnen.

Der Kern der Idee ist tragfähig und wird hier festgehalten. Die *Ausführung* als
täglicher Artikel-Generator ist es nach aktueller Datenlage **nicht** — siehe 15.3.

### 15.2 Was gemessen wurde (nicht vermutet)

Alle Zahlen aus der Google Search Console und der Datenbank, 3-Monats-Fenster
25.05.–25.08.2026:

| Kennzahl | Wert |
|---|---|
| Indexierte Seiten | **108** von ~1.325 (8 %) |
| „Gefunden – zurzeit nicht indexiert" | **1.153** |
| Impressionen gesamt | 81 |
| Klicks gesamt | 2 |
| Seiten mit ≥1 Impression | 29 |

**Hub- vs. Story-Seiten** — der wichtigste Befund:

| Typ | Seiten | Impressionen | Ø pro Seite |
|---|---|---|---|
| Hub-Seiten (`/archiv/*`, `/karte`, `/bei-dir` …) | 9 | 108 | **12,0** |
| Story-Seiten (`/geschichte/*`) | 1.260 | 31 | **0,025** |

Eine Hub-Seite bringt rund **480×** so viele Impressionen wie eine Story-Seite.

**Wichtige Präzisierung:** Story-Seiten *ranken* nicht schlecht — die
WHO-Trachom-Geschichte steht auf **Position 1**, Schweden-Handys auf 2. Sie
treffen nur zu enge Fragen. Eine Hub-Seite deckt ein ganzes Themencluster ab.

**Der Beleg dafür:** `/archiv/wissenschaft` rankt für „kernfusion durchbruch 2026
geplante experimente" auf Position 9,4 mit 47 Impressionen — und holte den
einzigen Klick der gesamten Domain. Ungeplant.

Ironie dabei: Zu Kernfusion existieren nur **4 Geschichten**. Die Seite rankt,
weil sie 267 Wissenschafts-Geschichten bündelt, nicht wegen Themen-Tiefe.

### 15.3 Warum „täglich ein Artikel" der falsche Ansatz wäre

Drei Gründe, alle belegt:

1. **Der Engpass ist nicht fehlender Inhalt.** 1.153 Seiten sind „gefunden, nicht
   indexiert". Mehr Seiten vergrößern genau diesen Stapel.
2. **Crawl-Budget ist nachweislich NICHT das Problem** (Messung 2026-08-18:
   0 verwaiste Seiten, Median 612 Wörter pro Story, kein Thin Content). Es ist ein
   Crawl-*Nachfrage*-Problem: zu wenig Vertrauen in die junge Domain.
3. **Risiko „scaled content abuse".** Das März-2026-Core-Update kostete
   Aggregatoren mit KI-umgeschriebenen Artikeln 50–75 % Traffic. NurEine *ist* ein
   KI-Aggregator — die Abgrenzung muss im Agenten erzwungen sein, nicht im Prompt
   erhofft. Siehe auch den Aggregator-Verkürzungsfehler in der Projekthistorie.

### 15.4 Die tragfähige Fassung der Idee

Kein Artikel-Generator, sondern ein **Rechercheur mit Gedächtnis**:

- beobachtet, was in den eigenen Primärquellen läuft
- gleicht es gegen die 1.260 belegten Geschichten ab
- findet die Fälle, wo NurEine eine **belegte Gegenposition** oder eine
  **Langzeitlinie** hat, die sonst niemand zeigen kann
- legt einen begründeten Vorschlag in eine Queue — Freigabe durch Aaron

**Produziert selten und schwer statt oft und dünn.** Vorbild ist CMOGlobal
(`~/CMOGlobal` auf mac-mini-server, Dashboard Port 8778): Freigabe-Queue mit
`dry_run`, Arbeitszeitfenster, Caps pro Kanal und Risiko-Feld pro Eintrag.

Der strukturelle Vorteil, der bisher ungenutzt ist: **NurEine monitort
Primärquellen und weiß früher als andere, dass etwas passiert ist.**

### 15.5 Verifizierte Themencluster

Aus 1.260 Geschichten, Regex-geprüft gegen Titel + Untertitel + Zusammenfassung:

| Cluster | Stories | Ø Wirkung |
|---|---|---|
| Regenwald & Aufforstung | 54 | 64 |
| Korallen & Meeresschutz | 38 | 65 |
| Impfstoffe | 31 | **72** |
| Krebsforschung | 29 | 59 |
| Solarenergie | 28 | **70** |
| Artenschutz-Rückkehr | 19 | 66 |
| Malaria & Tropenkrankheiten | 15 | **74** |

⚠️ **Messfalle, dokumentiert:** Eine erste Messung ergab „Kernfusion: 207
Stories". Falsch — das Muster `iter` traf „weiter"/„breiter", `fusion` traf
Firmenfusionen. Themencluster **immer** mit Wortgrenzen (`\y`) messen und
gegenprüfen.

### 15.6 Warum jetzt KEINE neuen Hub-Seiten gebaut werden

Naheliegend wäre: für jedes Cluster eine Hub-Seite. Dagegen spricht der Ist-Stand
(geprüft 2026-08-28):

| Seite | Status |
|---|---|
| `/archiv/wissenschaft` | ✅ indexiert |
| `/archiv/klima` | ✅ indexiert (nach manuellem Antrag) |
| `/gute-nachrichten/klima` | ✅ indexiert (nach manuellem Antrag) |

Es existieren **bereits 21 Hub-Seiten** (7 Kategorien + 14 Länder). Vor neuen
Hubs muss belegt sein, dass die bestehenden indexiert sind und Impressionen
holen. Sonst wird nur der ignorierte Stapel größer.

### 15.7 Offene Architekturfragen

Vor dem Bau zu beantworten:

1. **Woher kommt das Nachfragesignal?** GSC ist ein Rückspiegel (zeigt nur, wo man
   schon auftaucht — aktuell 5 Begriffe). Keyword-Tool kostet ~140 €/Monat.
   Google Trends ist kostenlos, zeigt aber kein absolutes Volumen.
2. **Was ist die kleinste nützliche Ausgabe?** Ein Artikel · ein Ausbau-Vorschlag
   für eine bestehende Seite · eine Indexierungs-Liste · ein CMOGlobal-Entwurf.
3. **Lässt sich „Zusammenhänge sehen" zuverlässig automatisieren**, oder braucht es
   menschliches Urteil? Die Projekthistorie mahnt zur Vorsicht.
4. **Was misst Erfolg?** Bei 2 Klicks/Quartal ist „mehr Traffic" nicht messbar.
   Brauchbare Frühindikatoren: Indexierungsquote (108 → ?), Anzahl rankender
   Begriffe (aktuell 5), Hub-Impressionen, externe Erwähnungen.
5. **Was darf der Agent selbst?** Bei einer Domain, die gerade erst wieder
   gecrawlt wird, spricht viel für „nur vorschlagen".

### 15.8 Was unabhängig vom Agenten wirkt

Belegt wirksam, kein Agent nötig:

- **Manuelle Indexierungsanträge** — lösten am 17.08. drei Wochen Stillstand;
  am 26.08. erneut bestätigt (`/archiv/klima` von „unbekannt" auf indexiert).
- **Externe Erwähnungen** — die openPR-Meldung (11.07.) ist die Quelle, die
  Googles KI-Übersicht namentlich zitiert, und stützt jetzt das Wikidata-Item.
- **Wikidata-Item Q141203108** — angelegt 2026-08-28, mit `different from` gegen
  beide Filme „Nur eine Frau" und die Chemikalie Neurin, drei openPR-Belege.

---

## 16. Der Langzeitindex — geprüfte Spezifikation (Stand 2026-09-01)

> **Dieser Abschnitt hat Vorrang vor Abschnitt 6.** Er ist das Ergebnis von sechs
> unabhängigen Fachgutachten (Composite-Indicator-Mechanik, Datenkuratierung,
> Red-Team-Kritik, Verhaltenswissenschaft, Naming, Synthese). Die ersten vier
> arbeiteten parallel und ohne Kenntnis voneinander, damit sie nicht konvergieren.
>
> **Status: noch nichts gebaut.** Vor dem Bau stehen V0 (Präregistrierung) und
> V0.5 (Nulllauf) — siehe 16.7.

### 16.1 Was sich gegenüber Abschnitt 6 geändert hat

| Thema | Abschnitt 6 (August) | Jetzt gültig |
|---|---|---|
| Name | „Globaler Wirkungsindex" | **Der Langzeitindex** (D-04) |
| Bausteine | 7, inkl. Bildung | **8 Domänen**, ohne Bildung (D-06) |
| Aggregation | arithmetisch, geometrisch „alternativ" | **geometrisch, zwingend** (D-07) |
| Zahl | „67,4 / 100" gross above the fold | Zahl **nie ohne** 8 Domänenwerte (D-05) |
| Story-Bezug | Beitrag zum Index | **Zuordnung statt Beitrag** (D-10) |
| Tägliche Bewegung | offen | **Tagesschnitt**, kein Zähler (D-09) |

### 16.2 Die acht Domänen und 24 Indikatoren

Alle Codes wurden **gegen die echte Weltbank-API geprüft** (`api.worldbank.org/v2/
country/WLD/...`). Die Jahresangaben sind die tatsächlichen ersten/letzten
Nicht-Null-Werte der Weltreihe, nicht geschätzt.

| Domäne | Indikator | Code / Quelle | Reihe (WLD) | Anker |
|---|---|---|---|---|
| **1 Überleben** | Kindersterblichkeit u5 | WB `SH.DYN.MORT` | 1990–2024 | B |
| | Müttersterblichkeit | WB `SH.STA.MMRT` | 1985–2023 | B |
| | Lebenserwartung | WB `SP.DYN.LE00.IN` | 1960–2024 | C |
| **2 Gesundheit** | HIV-Neuinfektionen | WB `SH.HIV.INCD.TL.P3` | 1990–2024 | C |
| | TB-Inzidenz | WB `SH.TBS.INCD` | 2000–2024 | C |
| | DTP3-Impfquote | WB `SH.IMM.IDPT` | 1980–2024 | A |
| **3 Ernährung** | Unterernährung | WB `SN.ITK.DEFC.ZS` | 2001–2023 | A |
| | Wasting u5 | OWID | 2000–2024 | A ⚠️ |
| **4 Materiell** | Armut < 3,00 $/Tag | WB `SI.POV.DDAY` | 1981–2024, Lücke 2019 | A |
| | Armut < 8,30 $/Tag | WB `SI.POV.UMIC` | 1981–2024, Lücke 2019 | A |
| **5 Infrastruktur** | Sicheres Trinkwasser | WB `SH.H2O.SMDW.ZS` | 2000–2024 | A |
| | Sichere Sanitärversorgung | WB `SH.STA.SMSS.ZS` | 2000–2024 | A |
| | Stromzugang | WB `EG.ELC.ACCS.ZS` | 1998–2024 | A |
| | Saubere Kochenergie | WB `EG.CFT.ACCS.ZS` | 2000–2023 | A |
| | Internetnutzung | WB `IT.NET.USER.ZS` | 2005–2025 | A |
| **6 Sicherheit** | Tötungen /100k | WB `VC.IHR.PSRC.P5` | 2000–2023 | C |
| | Konflikttote | UCDP via OWID | 1989–2025 | C |
| **7 Freiheit & Teilhabe** | Wahldemokratie-Index | V-Dem via OWID | ab 1990 | A |
| | Bürgerrechtsindex | V-Dem via OWID | ab 1990 | A |
| | Frauen in Parlamenten | WB `SG.GEN.PARL.ZS` | 1997–2025 | A |
| **8 Ökologie** | CO₂ pro Kopf | WB `EN.GHG.CO2.PC.CE.AR5` | 1970–2024 | C |
| | CO₂ absolut | WB `EN.GHG.CO2.MT.CE.AR5` | 1970–2024 | C |
| | Living Planet Index | ZSL/WWF via OWID | 1970–2020 | A |
| | Schutzgebiete % | WB `ER.PTD.TOTL.ZS` | 2013–2025 | B |

⚠️ **Domäne 3 (Ernährung) ist ein Grenzfall.** Für Wasting liegen weder Code noch
Zahlenwerte verifiziert vor. **Verifizierungsauftrag vor Bau:** Existiert keine
belastbare Weltjahresreihe, wird Ernährung **gestrichen** und der Index läuft mit
7 Domänen à 1/7. Es wird **kein Ersatzindikator gesucht** — das wäre Nachjustieren
am Ergebnis (D-11).

⚠️ **Domäne 6 (Sicherheit) verletzt eine Regel — bewusst und deklariert.** Sie
besteht zu 100 % aus Typ-C-Ankern; die Regel lautet eigentlich „keine Domäne
überwiegend Typ C". Sie wird trotzdem aufgenommen: Die Domäne steht am *unteren*
Ende ihres historischen Korridors, der Zirkelschluss wirkt hier **gegen** den Index,
nicht für ihn. Die einzige klar fallende Gewaltdomäne zu streichen wäre
Ergebnis-Design. **Der Regelbruch steht namentlich auf der Methodikseite.**

#### Neun Codes, die geprüft und verworfen wurden

Modelle halluzinieren plausible Weltbank-Codes. Diese hier hätte man aus dem
Gedächtnis zitiert — sie funktionieren nicht:

| Code | Befund |
|---|---|
| `EN.ATM.CO2E.PC` (CO₂ p. c.) | **existiert nicht mehr** — „deleted or archived" |
| `SM.POP.REFG`, `SG.LAW.INDX` | **existieren nicht** |
| `SI.POV.GINI` (Ungleichheit) | existiert, **keine Weltreihe** |
| `VC.BTL.DETH` (Konflikttote) | existiert, **keine Weltreihe** |
| `SH.STA.STNT.ZS` (Stunting) | existiert, **keine Weltreihe** |
| `SE.LPV.PRIM` (Lernarmut) | Welt nur **2015 + 2019** |
| `SH.STA.AIRP.P5`, `SH.STA.WASH.P5` | Welt nur **ein Jahr (2019)** |

**Regel für alle künftigen Sessions: jeden Indikator-Code gegen die API prüfen,
bevor er ins Konzept oder in Code geht.**

### 16.3 Normierung — drei Ankertypen, streng hierarchisch

```
mehr ist besser:     I = 100 × (x − min) / (max − min)
weniger ist besser:  I = 100 × (max − x) / (max − min)
danach kappen auf [0,100], dann Boden:  I' = 1 + 0,99 × I
```

- **Typ A — logischer Anker.** Nur bei konstruktionsbedingt begrenzten Grössen:
  min = 0 %, max = 100 %. Der einzige wirklich willkürfreie Fall.
- **Typ B — offiziell beschlossenes Ziel.** Kindersterblichkeit: 0-Punkt = 87,5
  (Welt 1990), 100-Punkt = 25 (SDG 3.2). Müttersterblichkeit: 380 → 70 (SDG 3.1).
  Schutzgebiete: 0 % → 30 % (Kunming-Montreal). Legitimität kommt von aussen:
  *193 Regierungen haben unterschrieben, nicht wir.*
- **Typ C — historischer Korridor 1990–2020, eingefroren.** `min = s`,
  `max = b + 0,2 × (b − s)`. Das Fenster wird **einmal** festgelegt und nie
  erweitert.

**Zwei Regeln, die den Unterschied machen:**
1. **Anker werden nie verschoben**, auch nicht wenn ein Ziel verfehlt oder 2030
   überschritten wird. Sonst wird der Massstab am Ergebnis geeicht.
2. Die s/b-Werte für Typ C werden im Präregistrierungs-Commit **als Konstanten
   eingefroren**. Ein Korridor, der bei jedem Lauf neu aus den Daten berechnet
   wird, verschiebt sich mit den Daten und ist wertlos.

### 16.4 Aggregation und Gewichtung

```
D_j    = (∏ I'_ji)^(1/k_j)      k = Indikatoren mit Wert für Jahr t
Index  = (∏_{j=1..8} D_j)^(1/8)
```

**Gleichgewichtung auf Domänenebene, nicht auf Indikatorebene.** Das ist der
Punkt, der leicht übersehen wird: Flache Gleichgewichtung über alle Indikatoren
verschiebt das Gewicht heimlich dorthin, wo es die meisten Daten gibt — acht
Gesundheits- gegen drei Umweltindikatoren wären 8/11 gegen 3/11, von niemandem
entschieden. *Statistische Bequemlichkeit würde zur Ethik.*

Jede Domäne bekommt exakt 1/8. Damit liegt die einzige Wertentscheidung in der
Frage „Welche Domänen gibt es?" — und die steht sichtbar oben auf der
Methodikseite, statt sich in der Indikatorzählung zu verstecken.

**Kein öffentlicher Gewichtungs-Regler.** Er ist eine rhetorische Entlastung ohne
Wirkung (die Titelzahl wird zitiert, den Regler bedient fast niemand), und laut
ESG-Befund erklärt Gewichtung nur 6 % der Divergenz zwischen Ratern. Stattdessen:
**Robustheitsquote** über 10.000 Dirichlet-Zufallsgewichtungen — der Anteil der
Ziehungen, bei denen die Trendrichtung 1990→heute unverändert bleibt.

### 16.5 Fehlende Daten, Divergenz, Vintages

- **Lücken zwischen Messpunkten:** linear interpoliert, im Chart als dünnere Linie.
- **Nach dem letzten Messpunkt: nie fortschreiben.** Fortschreiben ist die
  gefährlichste Variante, weil der Fehler systematisch in eine Richtung zeigt —
  Nicht-Messung würde als *Ausbleiben von Verschlechterung* gelesen. Genau der
  Bias, den eine Good-News-Plattform am wenigsten haben darf. Die Kurve endet
  **optisch** am letzten harten Punkt.
- **Mindestabdeckung 60 %** je Domäne, sonst kein Domänenwert und kein Index für
  dieses Jahr. Dazu ein dauerhaft sichtbarer Vollständigkeits-Balken:
  „2024: basiert auf 19 von 24 Indikatoren (79 %)."
- **Kernreihe** aus den lückenlosen Indikatoren 1990–heute. Weicht sie im Trend
  vom Hauptindex ab (> 5 Punkte), wäre der Trend teilweise Korbwechsel statt
  Weltveränderung → Warnsignal, wird ausgewiesen.
- **Spannweite als zweite, gleichrangige Zahl:** Differenz zwischen bester und
  schlechtester der 7 Weltbank-Regionen. Begründung unten (16.8).
- **Vintages:** Jede Veröffentlichung ist unveränderlich (`v2026.1`), mit CSV und
  SHA-256 unter fester URL. Jeder zitierte Wert trägt sein Vintage: „72,4
  (v2026.2)". Zwei getrennte Zeitachsen — „aktuelle Reihe" und „Vintage-Archiv".
  Ankeränderungen erzwingen ein Major-Vintage mit neu gerechneter Historie.

### 16.6 Die Sperrklausel (→ E-05, muss VOR dem Bau veröffentlicht werden)

> Wenn der Langzeitindex in einem Vintage fällt, wird der Rückgang zur Titelmeldung
> des Tages, mit derselben Gestaltung und derselben Prominenz wie jeder Anstieg.
> Wir stellen keine Erklärung voran, die den Rückgang relativiert. Wir passen weder
> Indikatoren noch Anker noch Gewichte in dem Vintage an, in dem der Rückgang
> auftritt. Methodische Änderungen sind ab dem Tag eines gemeldeten Rückgangs für
> 12 Monate gesperrt — ausser zur Korrektur eines nachgewiesenen Rechenfehlers, die
> dann einzeln, öffentlich und mit Vorher-Nachher-Wert dokumentiert wird.

**Warum das das Geschäftsmodell überlebt:** NurEine ist kein Optimismus-Produkt,
sondern ein Wirksamkeits-Produkt. Ein fallender Index passt zur Rahmung „das hat
gewirkt, und es wirkt nur weiter, solange es getan wird" (D-08) — der Rückschlag
ist darin bereits als Möglichkeit enthalten. Er passt nur zur Lesart „so schlimm
ist es nicht" nicht, und die ist ohnehin die schädliche (r = −0,40).

**Ohne diese Klausel wird der Index nicht gebaut.** Rückfallposition: 8
Einzelkurven nebeneinander, keine Gesamtzahl.

### 16.7 Der Test vor dem Bau — Abbruchkriterien

**Vor der ersten Zeile Frontend-Code wird der Index vollständig gerechnet — nur
als CSV, ohne jede Visualisierung.** Grund: Der wirksamste Schutz gegen den
Rater-Effekt ist, die Zahl zu sehen, *bevor* man in sie investiert hat.

| Befund im Nulllauf | Konsequenz |
|---|---|
| Weniger als 6 von 8 Domänen haben 2020–2024 einen Wert | **Abbruch** — ein Index, der die letzten Jahre nicht abdeckt, ist ein Geschichtsprodukt |
| Wasting hat keine verwertbare Weltjahresreihe | Ernährung streichen, 7 Domänen à 1/7. Kein Ersatzindikator |
| Hauptindex und Kernreihe divergieren > 5 Punkte | **Abbruch** — Trend wäre überwiegend Korbwechsel |
| Robustheitsquote < 90 % (Dirichlet) | **Abbruch** — hängt die Richtung von der Gewichtung ab, trägt die einzige zulässige Aussage nicht. Dann: keine Zahl, nur 8 Kurven |
| **Alle 8 Domänen steigen** | **Abbruch und Rückbau** — beweist einen Fehler in Normierung oder Ankern (wahrscheinlich zu grosszügiger Typ-C-Korridor) |
| Eigene Variante über dem 80. Perzentil der Multiverse-Verteilung | **Nicht veröffentlichen**, überarbeiten bis mittlerer Bereich oder Abweichung methodisch zwingend |
| Kein Knick 2020 (COVID) | **Warnung** — die Glättung muss gefunden werden, bevor gebaut wird |

Das dritte Kriterium von unten nutzt den Kartografen-Befund als **Fehlerdetektor**:
Wenn bei sauberer Methode alles steigt, stimmt die Rechnung nicht.

**Zusätzlich die Multiverse-Probe:** Der Index wird über alle vertretbaren
Varianten durchgerechnet (geometrisch vs. arithmetisch, mit/ohne Boden, anderes
Typ-C-Fenster, jede Domäne einmal weggelassen, Median statt Mittel). Die
Verteilung wird veröffentlicht, mit der eigenen Variante darin markiert. Das ist
der einzige Mechanismus, der den Rater-Effekt **messbar** macht, statt ihn zu
beteuern.

### 16.8 Drei Sätze, die nicht wegkonstruierbar sind

Sie gehören wörtlich und sichtbar auf die Methodikseite, nicht ins Kleingedruckte:

> **1. Diese Zahl kann steigen, während es der Mehrheit der Menschen schlechter geht.**
>
> **2. Wir haben ein wirtschaftliches Interesse daran, dass diese Zahl steigt.**
>
> **3. Diese Zahl beschreibt nicht heute. Sie beschreibt einen Datenstand von vor
> 1 bis 4 Jahren, und die schlechtest gestellten Länder sind darin am schlechtesten
> erfasst.**

**Zu Satz 1 — empirisch belegt, nicht theoretisch.** Armut unter 3 $, 1995→2024:

| Region | 1995 | 2024 | Delta |
|---|---|---|---|
| Ostasien & Pazifik | 55,7 % | 2,0 % | −53,7 |
| Südasien | 47,1 % | 3,8 % | −43,3 |
| **Welt** | 39,4 % | 10,4 % | **−29,0** |
| Subsahara-Afrika | 64,4 % | 45,1 % | −19,3 |

**Der Weltwert beschreibt keine einzige Region.** Deshalb die Spannweite als
zweite gleichrangige Zahl (16.5) und die Regel: *jeder Indikator nach Region
ausgewiesen, ein Weltwert erscheint nie allein.*

**Zu Satz 3 — der unterschätzte Teil:** Der Datenverzug ist **nicht zufällig
verteilt**. Fragile Staaten und Konfliktgebiete melden am spätesten und
lückenhaftesten. Der Index hat dadurch einen **eingebauten Aufwärts-Bias** — nicht
durch Absicht, sondern durch Datenverfügbarkeit.

### 16.9 Roadmap des Index

| Stufe | Inhalt | Aufwand |
|---|---|---|
| **V0** | **Präregistrierung**: Domänenliste, 24 Codes, Anker, Sperrklausel als Markdown ins öffentliche Repo, Git-Commit mit Zeitstempel. **Muss vor jedem Datenabruf passieren** — sonst ist die Auswahlregel (D-11) nachträglich nicht mehr belegbar | 1 Tag, kein Code |
| **V0.5** | **Nulllauf**: `scripts/index_build.py`, 24 Reihen ziehen, normieren, aggregieren, CSV. Multiverse-Probe. Alle Abbruchkriterien prüfen. **Hier fällt die Entscheidung, ob überhaupt gebaut wird.** Läuft offline gegen die Weltbank-API, unabhängig vom Supabase-Zustand | 2–3 Tage |
| **V1** | Route `/index`: Zahl + Spannweite + 8 Domänenwerte + Vollständigkeitsbalken · Kurve 1990–heute · Methodikseite · Verliererliste · Vintage-CSV mit SHA-256 · Story-Karten mit Bereichszuordnung · statisches JSON, wöchentliche GitHub Action · **SEO-Pflicht** (Description+Title ins Layout, Sitemap, interne Links, JSON-LD `Dataset`, llms.txt) | 1–2 Wochen |
| **V2** | Tagesschnitt (D-09) · Regionenaufschlüsselung · Vintage-Archiv-Ansicht · A/B-Test der Rahmung „das hat gewirkt" vs. „X % geschafft" | nach 4 Wochen V1-Betrieb |
| **V3** | **Adversarial Review** — jemanden bezahlen, der das Projekt nicht mag, und das Ergebnis ungekürzt neben dem Index veröffentlichen. Die einzige Massnahme, die ein Kritiker nicht als PR abtun kann, weil sie weh tut · Ziel-Fortschrittsbalken · Bugfix-Bounty | bei Budget |
| **Nie** | ETA-Anzeigen · Streaks · Live-Zähler · Story-Marker auf der Kurve · Anker, die nachjustiert werden, weil ein Ziel verfehlt wurde | — |

### 16.10 Was aus den Gutachten NICHT gebaut wird

| Idee | Warum nicht |
|---|---|
| Tageszähler | Kontrafaktik nicht seriös rechenbar (D-09) |
| Story-Marker auf der Kurve | Screenshot-Risiko asymmetrisch tödlich (D-10) |
| Öffentlicher Gewichtungs-Regler | Rhetorische Entlastung ohne Wirkung; Gewichtung = 6 % der Divergenz |
| ETA / Restlaufzeit | Lineare Restlaufzeit auf nichtlinearer Kurve ist eine Falschaussage. Afghanistan und Pakistan sind seit über einem Jahrzehnt die „letzten drei Jahre" bei Polio |
| Streaks / Punkte / Abzeichen | Extrinsische Schicht frisst intrinsisches Interesse (Deci/Ryan, 128 Studien). Ein Streak befeuert Antrieb ohne Weg — bindet an Zählerpflege statt an ein Thema |
| Nicht-kompensatorische Aggregation | Sauberer, aber nicht laientauglich erklärbar und liefert keine kardinale Zahl |
| Negativ-Quote | Ergebnis-Design mit umgekehrtem Vorzeichen (D-11) |
| BIP als Indikator | Durchsatzmass, kein Zustandsmass. Ölkatastrophe und Krebsbehandlung erhöhen es. Nur als Kontextzahl neben dem Index |

### 16.11 Fortschrittsbalken — die Grenze

Aus 6.4 bleibt der Gedanke, aber mit scharfer Regel:

> **Spielmechanik darf die Struktur eines realen Ziels sichtbar machen. Sie darf
> nie eine Zielstruktur behaupten, die es nicht gibt.**

- **Polio: zulässig** — es gibt einen definierten Endzustand und eine Zahl
  verbleibender Fälle. Der Balken bildet etwas ab, das existiert.
- **„Armut", „Klima", „Frieden": unzulässig** — kein Endzustand. Ein Balken
  erfindet dort ein Ziel und suggeriert Vollendbarkeit.
- **Balken nur bei zählbarem Rest. Und: Wenn ein Balken nie fallen kann, ist er
  kein Messinstrument, sondern eine Dekoration.**

Die ETA aus 6.4 entfällt ersatzlos (D-09 / 16.10). 6.4 sagt bereits „keine harte
ETA, wenn die Datenlage das nicht erlaubt" — die Gutachten verschärfen das: Bei
nichtlinearer Endphase gibt es **gar keine** ETA, auch keine weiche.

### 16.12 Kollision mit `src/lib/world-index.ts` (parallele Session, 2026-08-29)

⚠️ **Wichtig für alle Sessions.** Die parallele Session hat für „Puls der Welt"
(Board-Zeile Phase 2) bereits `src/lib/world-index.ts` gebaut. Der Code ist gut
und sein Kommentar formuliert die Zirkelschluss-Regel sauber. **Aber seine
Aggregation weicht in drei Punkten von dieser Spezifikation ab:**

| Punkt | `world-index.ts` (gebaut) | Diese Spezifikation |
|---|---|---|
| Normierung | Min-Max **über die eigene Zeitreihe** | Feste Anker Typ A/B/C, eingefroren (16.3) |
| Aggregation | **arithmetisches** Mittel | **geometrisch**, zweistufig (D-07) |
| Mindestabdeckung | ≥ 50 % der Metriken | ≥ 60 % (16.5) |

Die erste Abweichung ist die gravierende: Min-Max über die eigene Reihe bedeutet,
dass der **jüngste Wert fast immer nahe 100 landet**, sobald er der beste der
Reihe ist — und dass sich die gesamte Historie verschiebt, sobald ein neuer
Extremwert dazukommt. Das ist genau der Zirkelschluss, den 16.3 mit dem
eingefrorenen Korridor und dem 20-%-Kopfraum verhindert.

**Kein Grund, den Code wegzuwerfen** — er erfüllt seinen Zweck (Sparklines pro
Kategorie auf `/karte`) und ist als *Trendrichtungs-Anzeige* brauchbar. Aber:

> **`world-index.ts` darf nicht zur Grundlage des Langzeitindex werden, und die
> Zahlen, die es liefert, dürfen nicht als Domänenwerte des Langzeitindex
> ausgegeben werden.** Der Langzeitindex bekommt eine eigene Berechnung
> (`scripts/index_build.py`, V0.5). Sonst existieren zwei Zahlen für dasselbe
> Feld — genau die Verwechslung, die 6.2 verhindern will.

Zu klären, wenn der Nulllauf steht: ob `world-index.ts` auf die Anker-Normierung
umgestellt wird (dann eine Quelle für beides) oder ob es bewusst eine separate,
gröbere Kartenanzeige bleibt.

### 16.13 Wo die Gutachten sich widersprachen — und wie entschieden wurde

Für spätere Sessions, damit Entscheidungen nicht versehentlich zurückgedreht werden:

| Konflikt | Entscheidung | Grund |
|---|---|---|
| Eine Zahl vs. keine Zahl | **Eine Zahl** (D-05) | Der Einwand richtet sich gegen ein *Niveau*, nicht gegen eine *Zahl*. Verzicht löst 6 % des Problems und gibt dafür das Produkt auf |
| Story auf der Kurve vs. daneben | **Daneben** (D-10) | Die Position „auf der Kurve" adressiert das Zeitachsen-Problem nicht: Die Story landet zwangsläufig rechts vom letzten harten Datenpunkt |
| Negativ-Quote ja/nein | **Nein** (D-11) | Ergebnis-Design mit umgekehrtem Vorzeichen. Das Anliegen (Falsifizierbarkeit) wird durch Präregistrierung + Verliererliste + Sperrklausel erfüllt |
| Tageszähler ja/nein | **Nein** (D-09) | Nicht wegen des Bias, sondern weil die Rechnung nicht geht — ehrliche Spanne überspannt Faktor 2 |
| Bildung als Domäne | **Nein** (D-06) | Nur Anwesenheitsmasse verfügbar. Eine steigende Kurve aufzunehmen, weil sie verfügbar ist, wäre Ergebnis-Design mit dem richtigen Vorzeichen |
| Name „Fortschrittsindex" | **Verworfen** (D-04) | Vorzeichen im Titel, scheitert am Fall-Test, ist die r = −0,40-Rahmung, dreifach belegt |


---

## 17. Kursänderung: vom Fortschrittsindex zum Zustandsbild (2026-09-01)

> **Dieser Abschnitt hat Vorrang vor Abschnitt 16 und 6.** Er ist am selben Tag
> entstanden wie Abschnitt 16, aber nach ihm — und ändert die Grundfrage.

### 17.1 Die Entscheidung

**D-12 · 2026-09-01 · Der Index zeigt, WIE die Welt ist — nicht, wie GUT sie ist**

Aarons Wortlaut:

> „Lass uns grundsätzlich von 0 diesen Index aufbauen. Ziel ist nicht, zu zeigen
> wie gut die Welt ist, sondern allgemeiner wie die Welt IST. Wir finden heraus,
> welche Indikatoren alle wichtig sind für einen Überblick über die Welt. Bloß
> nicht schauen, welche Indikatoren zeigen, dass wir wachsen."

*Begründung:* Alle sechs Gutachten aus Abschnitt 16 arbeiteten sich am selben
Kernvorwurf ab — *„Er kennt sein Ergebnis, bevor er es misst."* Sperrklausel,
Negativ-Quoten-Debatte, der Name, der gegen die Niveau-Lesart arbeitet: alles
Abwehrarchitektur gegen eine Prämisse, die jetzt entfällt. **Ein Index, der nicht
zeigen will, dass die Welt wächst, kann diesen Vorwurf nicht bekommen.**

### 17.2 Was das konkret ändert

| | Abschnitt 16 (Fortschrittsindex) | Ab jetzt (Zustandsbild) |
|---|---|---|
| Grundfrage | „Wird die Welt besser?" | **„Wie ist die Welt?"** |
| Auswahlregel | Auswahl *vor* Richtungsprüfung (D-11) | **Richtung ist in KEINER Phase ein Kriterium** |
| Ausgeschlossene Bereiche | Bildung, Ungleichheit, psych. Gesundheit, Einsamkeit — mangels Daten vertretbar | **Gravierende Lücken.** Bei „wie IST die Welt" wiegt eine fehlende Ungleichheits-Spalte schwerer als bei einem Fortschrittsbild → härter nachsuchen |
| Fallende Indikatoren | Beleg für Redlichkeit | **Normalfall, kein Thema** |
| Sperrklausel (E-05) | Existenzbedingung | **Weitgehend gegenstandslos** — ein Zustandsbild darf fallen, das ist sein Zweck |

D-11 (Auswahl vor Richtungsprüfung) wird dadurch nicht aufgehoben, sondern
**verschärft**: Die Richtung ist nicht mehr „erst später anschauen", sondern
**gar kein Kriterium**. Sie wird nur noch protokolliert.

### 17.3 Was bestehen bleibt

Aus Abschnitt 16 gilt unverändert weiter:

- **D-05** — eine Zahl, aber nie ohne ihre Bausteine (technisch erzwungen)
- **D-07** — geometrische Aggregation
- **D-08** — Rahmung „das hat gewirkt" statt „X % geschafft"
- **D-09** — kein Tageszähler
- **D-10** — Story neben der Kurve, nicht darauf
- **16.5** — Vintages, Mindestabdeckung, keine Fortschreibung
- **16.8** — die drei Sätze auf der Methodikseite (Satz 1 und 3 gelten weiter;
  Satz 2 „wir haben ein wirtschaftliches Interesse, dass die Zahl steigt" wird
  durch D-12 schwächer, aber nicht falsch)

**Offen und Gegenstand der laufenden zweiten Expertenrunde:** Name (D-04 hiess
„Der Langzeitindex" — passt weiterhin, weil richtungsoffen), Domänenschnitt,
Normierung, und die Frage, wie eine Zahl 0–100 einen Zustand beschreiben kann,
ohne implizit „höher = besser" zu behaupten.

### 17.4 Aarons zweite Festlegung: eine Zahl, leicht und spielerisch

> „Ich will eine Zahl. Möglichst leicht und spielerisch für den Endnutzer."

Das erzeugt eine echte Konstruktionsspannung, die benannt gehört: **Eine Skala
0–100 impliziert immer „höher = besser".** Wer „wie IST die Welt" sagt und dann
eine 0–100-Zahl zeigt, behauptet Ergebnisoffenheit, ohne sie zu konstruieren.
Diese Spannung ist Auftrag an die Experten, nicht wegzudefinieren.

### 17.5 Verifizierte Datenkorrekturen (2026-09-01)

Beim Vorbereiten der Präregistrierung gegen die echte Weltbank-API geprüft.
**Drei Befunde, die Abschnitt 16 korrigieren:**

**(a) Die Ernährungs-Domäne ist gerettet — 8 Domänen, nicht 7.**
`SH.STA.WAST.ZS` (Wasting u5) hat eine echte Weltreihe **2000–2024, 25 Punkte**,
direkt bei der Weltbank. Der OWID-Umweg und der Streichungsvorbehalt aus 16.2
entfallen. (`SH.STA.STNT.ZS` (Stunting) ist dagegen bestätigt leer.)

**(b) Zwei Typ-B-Anker in 16.3 waren falsch.**

| Indikator | in 16.3 | **verifiziert** |
|---|---|---|
| Kindersterblichkeit, Welt 1990 | 87,5 | **93,5** |
| Müttersterblichkeit, Welt 1990 | 380 | **391** |

Beide wären als eingefrorene Konstanten falsch ins Präregistrierungs-Dokument
gegangen. **Lehre: auch Anker verifizieren, nicht nur Codes.**

**(c) Die Kappungsfalle — ein echtes Konstruktionsproblem.**
CO₂ absolut liegt heute bei **39.633 Mt**; der schlechteste Wert im eingefrorenen
Fenster 1990–2020 ist **38.008 Mt** (2019). Nach der Kappungsregel steht der
Indikator dauerhaft auf **0** — für 2021, 2022, 2023, 2024 gleichermassen — und
**bewegt sich nie wieder**, egal wie sich Emissionen entwickeln. Bei Tötungen
tritt derselbe Effekt am oberen Ende auf (5,2 in 2023 ist besser als der
Fenster-Bestwert 5,3 → Kappung bei 100).

Das ist kein Rechenfehler, sondern eine Grenze des eingefrorenen Korridors: Der
Fall „ein Indikator liegt dauerhaft ausserhalb des Fensters" war in 16.3 nicht
vorgesehen. **Ein gekappter Indikator misst nichts mehr** — er kann nicht zwischen
„schlimm" und „noch schlimmer" unterscheiden. Gegenstand der laufenden
Expertenrunde; die Lösung muss grundsätzlich sein, nicht CO₂-spezifisch.

**Alle 20 geprüften Weltbank-Codes liefern echte WLD-Reihen** — die Codeliste aus
16.2 ist ansonsten belastbar.


---

## 18. Entwurfsentscheidungen zur Oberfläche (2026-09-01)

**D-13 · 2026-09-01 · Eine Zahl als Hero, darunter ein Dashboard**

Aaron hat fünf Gestaltungsentwürfe verglichen (Hero / Globus / Magazin / Terminal /
Feed, alle mit echten Daten als klickbarer Prototyp). Ergebnis:

| Entwurf | Entscheidung |
|---|---|
| **Eine Zahl (Hero)** | ✅ **übernommen** — aber nur mit visuellem Kontext (D-14) |
| **Magazin** | ✅ teilweise — eine aus den Daten generierte Schlagzeile unter dem Hero |
| **Terminal** | ✅ die *Dichte*, ❌ die Optik — „sehr techy und nerdy", Oma darf nicht überfordert werden |
| **Globus** | ❌ vorerst raus (nicht verworfen, vertagt) |
| **Feed** | ❌ verworfen |

Aarons Zielbild wörtlich: *„Ich will wirklich Dashboard. Zahlen, Infos, Grafiken,
Stats. Benutzerfreundlich aufbereitet. Also eigentlich eher nicht techy."*

**D-14 · 2026-09-01 · Der Kontext zur Zahl ist visuell, nicht textlich**

Aaron: *„Es muss noch mehr Kontext gegeben sein. Dieser muss nicht als Text da sein,
sondern kann visuell sein. Aber man muss verstehen, was einem die Zahl sagt."*

Drei visuelle Ebenen direkt unter der Zahl, keine davon Fließtext:

1. **Die Skala** beantwortet „ist 54 viel?" ohne einen Satz. Vier Marken:
   `0 = nichts erreicht` · `Stand 2001` · `heute` · `100 = Ziele erreicht`.
2. **Die Verlaufskurve** 2001–heute — zeigt, dass es keine Momentaufnahme ist.
3. **Die Bausteinleiste** — ein Balken je Bereich, mit dunklem Strich für den
   Stand 2001. Links vom Strich = schlechter als damals. Ökologie ist der einzige
   Balken links vom Strich; das ist ohne Erklärung lesbar.

**D-15 · 2026-09-01 · Jeder Wert wird in Alltagssprache übersetzt (Oma-Test)**

In den Bereichskacheln erscheinen **nie** Indexwerte, sondern Sätze mit einer Zahl:

> Von 1000 Kindern sterben **37** vor dem 5. Geburtstag
> **92** von 100 Menschen haben Strom
> **39,6** Milliarden Tonnen CO₂ pro Jahr

Punkt grün/rot je nach Richtung gegenüber dem Startjahr. Der normierte Indexwert
existiert im Datenmodell, wird aber auf Kachelebene nie angezeigt.

**D-16 · 2026-09-01 · Terminal-Dichte ja, Terminal-Ästhetik nein**

Alle Messreihen stehen in einer Tabelle am Seitenende: heutiger Wert, früherer Wert,
Sparkline, Richtung als Pill. Dieselbe Informationsdichte wie ein Analysten-Tool —
aber auf warmem Papier (`--color-canvas`), mit Newsreader-Serife, ohne Monospace-
Neon-Ästhetik. **Progressive Offenlegung:** Wer die Tiefe will, scrollt; wer nicht,
sieht sie nie.

**D-17 · 2026-09-01 · Die Schlagzeile wird aus den Daten generiert**

Statt einer redaktionellen Überschrift: `"{n} Bereiche steigen. {m} bricht ein."` —
automatisch aus den Domänen-Deltas. Sie ändert sich mit den Daten. Fällt nächstes
Jahr ein zweiter Bereich, steht das da, ohne dass jemand eingreift. Das ist die
technische Umsetzung der Sperrklausel-Haltung (16.6) auf Textebene.

### 18.1 Prototyp-Befund: die Konstruktion trägt

Der Entwurf wurde mit **16 echten Weltbank-Reihen** gerechnet (2001–2023,
8 Domänen, konstanter Korb, geometrisch, Sättigungsnormierung gegen externe Anker).
Vorläufiges Ergebnis — **nicht** die endgültige Zahl, aber ein Beleg, dass die
Mechanik funktioniert:

| | |
|---|---|
| Weltzahl 2023 | **54,0** von 100 |
| 2001 | 48,8 |
| Bewegung | **+0,25 Punkte/Jahr** |
| Überleben | +16,7 |
| Freiheit & Teilhabe | +15,6 |
| Wissen | +12,0 |
| Materielle Lage | +11,5 |
| Infrastruktur / Sicherheit / Ernährung | +2,4 / +1,4 / +1,1 |
| **Ökologie** | **−17,2** |

Drei Dinge sind damit belegt:

1. **Die Bewegung liegt bei +0,25/Jahr** — fast exakt die Prognose aus den
   Gutachten (±0,4). Die Zahl bewegt sich zu langsam für tägliche Anzeige; das
   bestätigt D-09 (kein Tageszähler).
2. **Die geometrische Aggregation wirkt wie vorgesehen.** Ökologie fällt um 17
   Punkte und dämpft die Gesamtzahl sichtbar — arithmetisch wäre der Einbruch
   fast unsichtbar geblieben.
3. **Der Korbwechsel-Effekt ist real.** Bei Rechnung über 1990–2024 sprang die
   Zahl von 54,6 (2020) auf 50,2 (2024) — überwiegend, weil Domänen fehlten,
   nicht weil sich die Welt änderte. Deshalb konstanter Korb 2001–2023. Das ist
   die Bestätigung der Kernreihen-Warnung aus 16.5 an echten Daten.

### 18.2 Was der Prototyp NICHT ist

Die Anker sind noch **nicht präregistriert** — sie wurden für den Entwurf gesetzt,
um die Mechanik zu zeigen. Die endgültige Zahl entsteht im Nulllauf (V0.5) mit den
präregistrierten Ankern und wird anders aussehen. Beurteilt wurde die **Struktur**,
nicht der Wert.

Ebenfalls offen: Das **Schätzspiel** (erst raten, dann auflösen) ist im Dashboard
nicht enthalten. Es wurde separat prototypisiert und ist weder angenommen noch
verworfen — Aaron war unsicher, ob es zu verspielt wirkt. Entscheidung vertagt;
es liesse sich später über den Hero legen, ohne die Struktur zu ändern.

