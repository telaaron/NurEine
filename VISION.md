# VISION.md — NurEine

> **PFLICHTLEKTÜRE. Lies dieses Dokument VOR jeder Arbeit an NurEine — Code,
> Konzept, Text, Redaktion.** Es ist die einzige verbindliche Quelle für
> Zielbild, Produktausrichtung und interne Roadmap. Bei Widerspruch zu einem
> anderen Dokument gilt dieses hier.
>
> **Stand:** 2026-08-26 · **Status:** Entwurf, in Evaluierung
> **Bearbeitbar unter:** `/admin/vision`

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
„Globaler Wirkungsindex" kollidiert sprachlich mit dem bestehenden
„Wirkungsindex" der Story. Genau diese Verwechslung will Abschnitt 6.2
verhindern — der Name arbeitet dagegen.

Alternativen: „Weltstand" · „Stand der Welt" (bereits als Seitenname vergeben) ·
„Welt-Index" · „NurEine-Index"

→ *Noch nicht entschieden.*

**E-04 · Zwei Batches pro Tag?**
Abschnitt 5.1 nennt zwei Update-Fenster täglich. Der Fetch läuft aktuell
**vier Mal** (06/10/14/18 UTC), der Newsletter einmal (04:20 UTC). Entweder das
Konzept anpassen oder die Cronjobs — Cron-Zeiten nur nach Absprache (CLAUDE.md).

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
| 2 | „Puls der Welt" in der Seitenleiste | 🔄 in Arbeit | `src/lib/world-index.ts` + Karten-Seitenleiste, parallele Session (2026-08-29) |
| 3 | Index-MVP (3–4 Bausteine) | ⬜ offen | |
| 3 | Öffentliche Methodikseite | ⬜ offen | `/methodik` existiert, müsste erweitert werden |
| 4 | Statistiker-KI | ⬜ offen | |
| 4 | Ziel-Fortschrittsleisten | ⬜ offen | |
| 5 | Satelliten-Vorher/Nachher | ⬜ offen | |
| 5 | „Seit deinem letzten Besuch" | ⬜ offen | |

Legende: ✅ gebaut · 🔄 in Arbeit · ⬜ offen · ❌ verworfen (mit Verweis auf
Entscheidung in Abschnitt 13)
