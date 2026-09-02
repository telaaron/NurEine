# Reel-Text — verbindliche Regeln (Aarons Stil, Stand 2026-07-30)

Gilt für JEDEN Reel-/TikTok-Text. Löst die alte Skript-Struktur ab (Zahl → Bruch →
Ort → Mechanismus → Beleg → Loop). Grundlage: Aarons eigene Überarbeitungen der
zehn Beispiel-Storys (2026-07-27) + gemessene Stimm-Tests (2026-07-30).

## 1. Die Fünf-Block-Struktur

```
[1] EINSTIEG      Gefühl/Alltag des Zuschauers spiegeln — NICHT die Zahl.
                  „Hunger fühlt sich an, wie ein Problem ohne Ausgang."
                  „Schon mal einen Unfall miterlebt?"
                  Dann der Kipp-Satz: „Die Zahlen sagen etwas anderes."

[2] KERN          Zahl + Mechanismus in einem Block. Die Zahl steht ALLEIN,
                  ohne Adjektiv davor. Danach: warum es funktioniert.

[3] BELEG         Kurz wie ein Stempel. „Geprüft von fünf UN-Organisationen.
                  Nicht erfunden." NIE ein ganzer Satz.

[4] EINORDNUNG    Warum man das sonst nicht hört + Follow-Aufruf.
                  „Sowas steht selten in den Nachrichten. Hier jeden Tag eins."

[5] LOOP          „Nächste gute Nachricht schon überprüft, nämlich:"
                  (Satzanfang → läuft in Durchlauf 2 hinein)
```

### Wenn das Keyword ein Fachwort ist

Der Einstieg darf nicht mit dem Fachbegriff öffnen, aber `render.mjs` verlangt das
SEO-Keyword dreifach: gesprochen, im Overlay und in den ersten 60 Zeichen der
Caption. Beides zusammen geht nicht, wenn das Keyword genau der Fachbegriff ist
(„Narkolepsie", „Sepsis", „Trachom").

Dafür gibt es `seo.spokenOptional: true` im Plan. Dann steht das Keyword im
Overlay und in der Caption, der gesprochene Text umschreibt es. Zwei der drei
Kanäle bleiben, und der Einstieg bleibt verständlich.

```json
"seo": { "keyword": "Narkolepsie", "spokenOptional": true }
```

Belegt 2026-09-03 am Narkolepsie-Clip: Ohne das Flag bricht der Render ab, mit
Fachbegriff in Sekunde eins ist der Zuschauer weg. Das Flag löst beides.

### Zahlen im Bild müssen gesprochen werden

Der Kohärenz-Check bricht ab, wenn eine Zahl im Overlay steht, die der voText
derselben Szene nicht exakt sagt. Wer eine Zahl aus dem Einstieg nach hinten
verschiebt, muss auch das Overlay mitnehmen — sonst zeigt Szene 1 eine Zahl,
die niemand ausspricht.

## 2. Ton: untertreiben, nicht aufblasen

Der Zuschauer soll SELBST „krass" denken. Sagt die Stimme ihm, dass es krass ist,
nimmt sie ihm die Schlussfolgerung ab — und er glaubt weniger.

- **Zahl allein stehen lassen.** „43 Millionen weniger" — nicht „unglaubliche 43 Mio".
- **Punkt statt Ausrufezeichen.** Zwingt die Stimme zum Absetzen = Understatement.
- **Kurze Hauptsätze.** „Es geht also voran." „Nicht erfunden." „Lösbar, wenn man dranbleibt."
- **Kein Superlativ, keine Wertung** („bahnbrechend", „unglaublich", „endlich").
- **Energie kommt aus TEMPO, nicht aus Begeisterung** (siehe §4).

## 3. Verbote (harte Ausschlüsse)

- **Kein Medien-Vorwurf.** „War schon wieder klar, dass das untergeht" / „Gut, dass es
  uns gibt" → das ist der Doom-Reflex („alle anderen verschweigen es") und Selbstlob
  ohne Beleg. Ersatz: „Sowas steht selten in den Nachrichten. Hier jeden Tag eins."
- **Kein englisches Wort im voText** („Progress" → „voran"). Der Englisch-Wächter
  bricht sonst hart ab.
- **Kein nacktes Substantiv am Satzanfang** — kippt die Stimme ins Englische
  („Prüfer suchten…" wurde „Proofers sucht den Geraldine"). Artikel davor.
- **Zahl im Bild = Zahl im Ton, exakt.** Nie runden (Kohärenz-Check bricht ab).

## 4. Stimme & Vortrag (gemessen, nicht geschätzt)

| Einstellung | Wert | Warum |
|---|---|---|
| Modell | `eleven_v3` | einziges mit nativen Wort-Timings + Audio-Tags |
| stability | **0.6–0.65** | 0.45 verliert Wörter („Trahum"), 0.3 halluziniert |
| speed | **1.15** | 1.2 verschluckt Silben („Tachom") |
| Audio-Tag | `[matter-of-fact]` | **NICHT** `[excited]` — Untertreibung ist der Effekt |
| Tempo-Ergebnis | ~2,4 Wörter/s | edge-tts schafft nur 1,66 W/s |

**Pausen NACH der Zahl, nicht davor.** Eine Pause davor kündigt an („jetzt kommt was
Großes"), eine danach lässt die Zahl wirken. `[pause]` sparsam, max. 2 pro Reel.

## 5. Länge

**75–80 gesprochene Wörter ≈ 30 s.** Obergrenze 80.

Diese Datei nannte bis zum 2026-09-03 „80–90 Wörter" und rechnete mit 2,4 Wörtern/s.
Das galt für das alte Tempo. Seit `REEL_TEMPO 1.28` mit ElevenLabs sind dieselben
30 Sekunden bei 75–80 Wörtern voll — so auch in `docs/REEL_BAUKASTEN.md`,
`docs/TIKTOK_FORMAT_REZEPT.md` und der Reel-Regie hinterlegt. Drei Dokumente sagten
das Neue, eines das Alte; der Widerspruch kostete jeden Lauf Prüfaufwand.

Aarons Vorgabe dahinter gilt unverändert: „lieber überhaupt Mehrwert, dafür länger"
(2026-07-27). Die alte 20-s-Regel ist damit weiterhin außer Kraft.

## 6. Aussprache-Fallen (belegt, wachsende Liste)

| Schreibweise | wird gesprochen | Fix |
|---|---|---|
| „Hunger fühlt sich an wie…" | „führt sich an" | **Komma**: „fühlt sich an, wie…" |
| „Prüfer suchten…" (Satzanfang) | „Proofers sucht den Geraldine" | Artikel: „Die Prüfer…" |
| „Trachom" (edge-tts) | „Trakum"/„Track Home"/polnisch | bezahlte Stimme ODER umschreiben |

Jedes Segment wird nach der Synthese per Whisper gegengeprüft
(`scripts/verify_vo.py`) — Abweichung = harter Render-Abbruch. Neue Fälle hier
eintragen, damit die Regie sie gar nicht erst schreibt.

## 7. Stimm-Entscheidung (2026-07-30)

**Luca — Dynamic & Engaging** (`mmAbrxFQ9xjByXyBpqrK`), männlich, jung, `social_media`.

Warum nicht Laura (die klanglich ebenbürtig ist): Sie spricht „fühlt sich an" als
**„führt sich an"** — auch mit Komma, im Langtext reproduzierbar. Luca liest denselben
Text fehlerfrei. Aussprachesicherheit schlägt Stimmfarbe.

Verworfen: „George" (britisch, `language: en` — war fälschlich als Default gesetzt),
alle `narrative_story`-Stimmen (Doku-Tempo, zu langsam für TikTok).

## 8. Caption = derselbe Einstieg wie das Voiceover (2026-08-01)

Der Einstieg spiegelt ein **Gefühl**, keine Tatsache. Sonst wird der Kipp-Satz
unlogisch: „Mammutbäume STERBEN in Waldbränden, das KLINGT nach einem Kampf" —
etwas, das nachweislich passiert, „klingt" nicht danach, es IST so.

Richtig ist die offene Formulierung, die das Voiceover ohnehin nutzt:
„Mammutbäume und Waldbrand — das klingt nach einem Kampf, den man nur verlieren kann."

**Regel:** Die TikTok-Caption übernimmt den Einstiegssatz WORTGLEICH aus Szene 0.
Wird der voText gekürzt oder umformuliert, MUSS die Caption mitgezogen werden —
sonst driften Ton und Beschreibung auseinander (belegt: beim Straffen von 86 auf
77 Wörter blieb die alte Caption stehen).
