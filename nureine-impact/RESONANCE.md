# RESONANCE — Die 4 Achsen: "Verändert es den Menschen?"

> Das Herzstück der Kuration. NurEine will keine gute Nachricht TÄGLICH, sondern
> die EINE, die hängenbleibt — bedacht, fast wie eine wohldosierte Droge, kein
> Scrollfutter. Diese Datei definiert, woran die Routine "Droge" von "Lärm" trennt.

---

## Warum getrennt von impact_score

Die Pipeline misst bisher **Größe**: `impact_score`, `reach`, `durability`,
`evidence` → "wie viele Menschen, wie dauerhaft, wie belegt". Das ist nötig, aber
NICHT hinreichend. Eine Story kann 10 Mio. Menschen betreffen und trotzdem
**niemanden berühren** ("EU beschließt Richtlinie X"). Resonanz misst das andere:
**bewegt es DICH, den Erstnutzer ohne Vorwissen?**

Eine Story muss BEIDES haben: belegt (Größe) UND berührend (Resonanz). Resonanz
ohne Beleg = Kitsch/toxische Positivität (§Zyniker). Größe ohne Resonanz = Lärm.

---

## Die 4 Achsen (je 0–10)

### 1. `res_perspektive` — Perspektiv-Verschiebung
Lässt die Story dich die Welt danach **anders sehen**? Ein "das hätte ich nicht
gedacht"-Moment, der eine Überzeugung verschiebt — nicht nur "schön".
- **0–3:** bestätigt nur, was man eh dachte. "Nett."
- **4–6:** ein interessanter neuer Fakt, aber kein Umdenken.
- **7–10:** kippt eine Annahme. Man sieht ein Problem/eine Gruppe/die Zukunft neu.

### 2. `res_koerper` — Körperliche Reaktion
Eine **messbare** Resonanz: Gänsehaut, Kloß im Hals, Tränen, tiefes Durchatmen.
Nicht intellektuelles Nicken, sondern der Körper reagiert.
- **0–3:** flach, kein Gefühl.
- **4–6:** ein leichtes Wärmegefühl, aber vergänglich.
- **7–10:** echte körperliche Regung. Man hält kurz inne.

### 3. `res_handlung` — Handlungs-/Hoffnungs-Funke
Bleibt ein **Antrieb** zurück? Man will selbst etwas tun, oder fühlt echte
(nicht naive) Hoffnung für die Welt.
- **0–3:** "ok" und weitergescrollt. Nichts bleibt.
- **4–6:** ein kurzer Hoffnungs-Hauch, aber folgenlos.
- **7–10:** man will es teilen, nachmachen, unterstützen — oder trägt echten
  Optimismus in den Tag.

### 4. `res_erinnerung` — Erinnerbarkeit
Erzählt man sie jemandem weiter? Denkt man morgen noch dran? Oder sofort
weggescrollt und vergessen?
- **0–3:** in 10 Sekunden vergessen.
- **4–6:** man erinnert sich, wenn man dran erinnert wird.
- **7–10:** klebt. Man erzählt sie beim Abendessen.

---

## Gesamt-Resonanz (`resonance_score`)

Gewichteter Schnitt — **alle 4 zählen, aber die seltenen Achsen mehr**, weil sie
"Droge" von "nur nett" trennen:

```
resonance_score = perspektive×0.30 + koerper×0.25 + handlung×0.25 + erinnerung×0.20
```

`resonance_note`: EIN Satz, warum es (nicht) berührt. Ehrlich, schonungslos.
Beispiel schwach: "Positiv, aber generisch — betrifft viele, bewegt niemanden."
Beispiel stark: "Der Vater, der zum ersten Mal sieht — das bleibt im Hals stecken."

---

## Die SCHWELLE (Qualität statt Lärm)

- **resonance_score ≥ 7.0** → Hero-würdig. Verdient die Bühne.
- **5.0–6.9** → solide, aber nicht "die Eine". Nur posten, wenn nichts Besseres da.
- **< 5.0** → **Lärm. NICHT als Hero posten.** Lieber eine Archiv-Perle.

**Stille-Recht:** Reißt an einem Tag KEINE frische Story die 7.0 → die Routine
greift auf eine **Archiv-Perle** zurück (`resonance_score ≥ 7.5` aus dem Bestand,
die lange nicht lief) statt Tagesfüllstoff. Lieber eine bewährte starke Story
zweimal im Jahr als täglich Mittelmaß. NIE Lärm publizieren.

---

## Was das für die Quellen bedeutet (Outreach-Signal)

Wenn über mehrere Tage **alle** Kandidaten unter 5.0 resonieren, ist nicht der
Tag schlecht — die **Quellen** sind es. Diagnose-View: `nureine_source_quality`
(Volumen vs. Resonanz pro Quelle). Das ist der tiefste Hebel: bessere Quellen >
besseres Framing.

### Empirischer Befund (2026-06-27, 462 bewertete Stories)
- Nur **1,3 %** rissen die Perlen-Schwelle (≥7.5). Der Bestand liefert reichlich
  Größe, aber Resonanz ist selten — das bestätigt die Prämisse.
- **Resonanz-Lieferanten:** Reasons to be Cheerful (26 % stark), Positive.News,
  The Optimist Daily, Good News Network (die meisten Perlen). → mehr davon.
- **Größe ohne Resonanz (jetzt `hero_eligible=false`):** WHO, UN, Weltbank,
  Our World in Data — hoher impact_score, aber Resonanz 3.3–4.1, **0** starke.
  Bleiben als Beleg aktiv, sind aber KEINE Hero-Kandidaten mehr.
- **Mongabay:** größte Quelle (113 Stories ≈ ¼ des Bestands), aber nur 1,8 %
  stark — Fachjournalismus-Stil. Übergewicht beobachten.
