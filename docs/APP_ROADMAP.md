# App-Roadmap (iOS + Web-App)

**Stand: 2026-07-21** · Branch `feat/app-neuerfindung-phase3`

Diese Datei ist die EINE Prioritätenliste für die App. Sie ersetzt für den
App-Bereich das Suchen in den 19 Plandokumenten. Alles außerhalb der App
(Content-Nachschub, Newsletter, Social, SEO) steht bewusst NICHT hier —
siehe „Nicht mein Auftrag" unten.

---

## Wo wir stehen

Die neu erfundene Erfahrung läuft **im Web vollständig** (`/app/*`) und ist
**nach iOS übersetzt**. Beides teilt dieselbe DNA: eine Ausgabe, in Schlägen
gelesen, danach ist man fertig; jede gelesene Ausgabe wird ein Licht.

| Baustein | Web | iOS |
|---|---|---|
| Aufdecken → Ritual-Reader (6 Schläge) | ✅ | ✅ |
| Himmel / Sammlung | ✅ | ✅ (Lichter antippbar) |
| Onboarding (Tag 1) | ✅ | ✅ (3 geschenkte Lichter) |
| Reader-Deep-Link (Push/Spotlight) | ✅ | ✅ |
| Archiv als Zeitreise („Puls") | ✅ | ✅ |
| Karte | ✅ | ✅ (Altbestand) |
| Kurven-Tag / Stand der Welt | ✅ | ⬜ fehlt |
| Widget (Tageszahl) | — | ✅ kompiliert |

**Verifiziert:** `xcodebuild -scheme NurEine` → BUILD SUCCEEDED (signiert,
`generic/platform=iOS`), Widget-Plist enthält `NSExtension`.

---

## Was als Nächstes ansteht

### 1. Auf dem echten Gerät durchspielen ← HIER STEHEN WIR
Nur Aaron kann das: Xcode öffnen, iPhone anstecken, Play.
Die Simulator-Runtime für iOS 27 fehlt auf diesem Rechner, deshalb ist die App
bisher **nur kompiliert, nie gelaufen**. Zu prüfen:
- Ritual: Fühlen sich die sechs Schläge richtig an? Tempo? Ist „fertig" befriedigend?
- Archiv: Sind die Tageszeilen auf dem schmalen Display zu gedrängt?
- Himmel: Trifft man die Lichter gut genug? (Trefferfläche ggf. vergrößern)
- Onboarding: Läuft der Tag-1-Flow rund?

Alles Weitere hängt an dieser Rückmeldung — Feinschliff ohne Ansehen wäre Raten.

### 2. Feinschliff nach Aarons Eindruck
Erst nach Schritt 1 planbar. Wahrscheinliche Kandidaten:
- Trefferflächen/Abstände auf kleinen Displays
- Tempo der Übergänge (aktuell 0,42 s je Schlag, Himmel-Einflug 1,4 s)
- Reader: Braucht Beat 3 (Mechanismus) mehr Text als den ersten Absatz?

### 3. Kurven-Tag (Typ 2) nach iOS bringen
Der einzige Screen, den das Web hat und iOS nicht. Nutzt
`nureine_world_metrics.series`. Erst sinnvoll, wenn 1+2 sitzen.

### 4. Offline-Festigkeit
`StoryStore` cacht nur im Speicher (5 Min). Kaltstart ohne Netz = leerer
Bildschirm. Für ein Morgen-Ritual heikel (U-Bahn!). Lösung: letzte Ausgabe
auf die Platte schreiben und beim Start zeigen.

---

## Blockiert / wartet auf Aaron

- **Push (APNs)** — braucht den bezahlten Developer-Account (99 €/Jahr).
  Der Client-Code steht vollständig; in `NurEine.entitlements` sind die zwei
  Blöcke auskommentiert, inkl. Anleitung. Personal Teams können kein Push.
  **Das ist der wichtigste Wachstumshebel der App** (Lockscreen 6:25 schlägt E-Mail).
- **TestFlight / App Store** — ebenfalls Account-abhängig.
- **App läuft nur 7 Tage** auf dem Gerät (Personal Team), dann neu installieren.

---

## Nicht mein Auftrag (nur zur Kenntnis)

Aarons Ansage 2026-07-21: „deine aufgabe ist nur die app".
Trotzdem dokumentiert, weil es die App-Inhalte betrifft:

- **Supabase-402-Sperre ist WEG** (21.07., API antwortet wieder HTTP 200).
- **Aber die Content-Kette steht:** letzter Story-Fetch-Cron 10.07., letzter
  Newsletter 15.07. Ursache: Der GitHub-Cron wurde am 10.07. bewusst
  abgeschaltet (Commit `fdcbba3`, Umstellung auf eine lokale Claude-Routine),
  der lokale Ersatz wurde aber **nie eingeplant** — weder crontab noch
  LaunchAgent existieren. Die Social-Jobs laufen weiter und verteilen alte Stories.
- Folge für die App: Sie zeigt echte, aber älter werdende Inhalte.

---

## Chronik (was schon erledigt ist)

- `b7f0e6b` Web: Design-Basis + Kern-Ritual
- `dd32091` Web: Himmel + Sammlung
- `de74848` Web: Reader-Routen + Push-Deep-Link wiederhergestellt
- `10330e1` Web: Onboarding (Tag 1)
- `5631603` Beispiel-Daten-Fallback (selbstheilend, greift nur bei leerer DB)
- `fb362c2` Web: echter Dark Mode im App-Anthrazit
- `4b4d1c4` iOS: Ritual-Erfahrung + Widget-Target + Bundle-ID
- `836fcb2` iOS: Push-Entitlement deaktiviert (Personal Team)
- `1b8d4c6` iOS: Widget-Info.plist mit NSExtension (App war nicht installierbar)
- `b74d1a6` iOS: Archiv als Zeitreise + Himmel-Lichter antippbar
