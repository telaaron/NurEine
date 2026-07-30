# Wikidata-Item für NurEine anlegen

**Warum das der wichtigste Schritt ist.** Google (AI Overview / Knowledge Graph) und
Perplexity lösen mehrdeutige Markennamen zuerst gegen Wikidata und Wikipedia auf.
Für „NurEine" gibt es dort **kein Item** (Stand 2026-07-26, per API geprüft: 0 Treffer).
Deshalb fällt die Auflösung auf die nächststarken Entitäten zurück:

- den Kinofilm „Nur eine Frau" (2019, Sherry Hormann) → Q62006534
- die Chemikalie „Neurin" / englisch „neurine" → Q408180

Genau das zeigen die beiden Screenshots vom 26.07.2026. Die Seiten-Änderungen
(`/ueber-uns`, `llms.txt`, `disambiguatingDescription`) liefern die *Belege* — aber
die Verknüpfung im Entity-Graph entsteht erst mit dem Wikidata-Item.

---

## Das musst du selbst machen

Ich lege keine Accounts an und veröffentliche nichts auf externen Plattformen in
deinem Namen. Der Batch unten ist fertig — Einfügen und Bestätigen machst du.

### Schritt 1 — Account
Wikidata-Konto anlegen: https://www.wikidata.org/w/index.php?title=Special:CreateAccount

### Schritt 2 — QuickStatements autorisieren
https://quickstatements.toolforge.org/ → oben rechts über OAuth mit dem
Wikidata-Konto verbinden.

### Schritt 3 — Batch einfügen
Dort „New batch" → **Import V1 commands** → den kompletten Inhalt von
[`nureine-quickstatements.txt`](./nureine-quickstatements.txt) einfügen → „Import" →
„Run".

### Schritt 4 — QID notieren
Nach dem Lauf bekommt NurEine eine QID (Form `Q…`). Die brauchst du für Schritt 5.

### Schritt 5 — QID zurück in die Website
Sobald die QID existiert, in `src/routes/+layout.svelte` im `sameAs`-Array der
`NewsMediaOrganization` ergänzen:

```
sameAs: [
  'https://instagram.com/nureine.de',
  'https://www.wikidata.org/wiki/Q<DEINE_QID>'
]
```

Das schließt den Kreis: Website → Wikidata und Wikidata → Website verweisen
aufeinander. Erst diese **beidseitige** Verknüpfung wertet Google als bestätigt.

---

## Was im Batch steht (alle IDs gegen die Live-API geprüft)

| Zeile | Bedeutung |
|---|---|
| `Lde` / `Len` | Label „NurEine" (deutsch/englisch) |
| `Dde` / `Den` | Kurzbeschreibung |
| `Ade` / `Aen` | Aliase: `NurEine.de`, `nureine`, `Nur Eine` — fängt Falschschreibungen ab |
| `P31 Q17232649` | ist ein(e): **news website** |
| `P856` | offizielle Website: https://nureine.de |
| `P407 Q188` | Sprache des Werks: **Deutsch** |
| `P571` | Gründung: **2026** (Genauigkeit `/9` = Jahr) |
| `P17 Q183` | Land: **Deutschland** |
| `P159 Q572512` | Sitz: **Teltow** |
| `P452 Q11030` | Branche: **Journalismus** |
| `P1813` | Kurzname |
| **`P1889 Q62006534`** | **verschieden von: „A Regular Woman" (Film 2019)** |
| **`P1889 Q7070005`** | **verschieden von: „Nur eine Frau" (Film 1958)** |
| **`P1889 Q408180`** | **verschieden von: neurine (Chemikalie)** |

Die drei `P1889`-Zeilen sind der eigentliche Fix. „different from" ist die
Wikidata-Property, die exakt für diesen Fall existiert — sie sagt dem Entity-Graph
maschinenlesbar, dass NurEine **nicht** der Film und **nicht** die Chemikalie ist.

`S854` hängt an die Aussagen eine Referenz-URL. Ohne Quellen werden neue Items
schneller zur Löschung vorgeschlagen.

---

## Realistische Erwartung

**Wikidata-Relevanzkriterien.** Wikidata ist toleranter als Wikipedia, verlangt aber,
dass ein Item „a serious and publicly available reference" hat. Ein Item, das sich
ausschließlich auf die eigene Website stützt, **kann als nicht relevant gelöscht
werden**. Das ist ein reales Risiko, kein theoretisches.

Die Chance steigt deutlich, sobald es unabhängige Belege gibt (Presseerwähnung,
Verzeichniseintrag, Branchenmedium). Falls das Item gelöscht wird: nicht neu anlegen,
sondern erst externe Belege sammeln und dann erneut versuchen.

**Zeit.** Selbst wenn alles durchläuft, ändern sich AI-Antworten nicht sofort.
Google-Knowledge-Graph-Übernahme dauert typisch Wochen; Perplexity liest häufiger
live, reagiert also eher auf `/ueber-uns` und `llms.txt`. Rechne in Wochen, nicht Tagen.

---

## Zusätzlich sinnvoll (nicht im Batch, nicht von mir gemacht)

- **Google Knowledge Panel beanspruchen:** Das Panel für „NurEine" existiert bereits
  (im Screenshot rechts sichtbar). Über die Search-Console-Verifizierung kannst du es
  beanspruchen und die Beschreibung korrigieren → https://support.google.com/knowledgepanel/answer/7534902
- **Bing Places / Bing Webmaster Tools:** speist ChatGPTs Websuche.
- **Unabhängige Erwähnungen:** der stärkste Hebel für alles oben. Ohne externe
  Quellen bleibt jede Entity-Behauptung schwach belegt.
