# Wikidata-Item für NurEine anlegen

**Warum das der wichtigste Schritt ist.** Google löst mehrdeutige Markennamen gegen
Wikidata auf. Für „NurEine" gibt es dort **kein Item** (zuletzt geprüft 2026-08-28:
0 Treffer). Deshalb gewinnt bei der Suche „nureine" weiterhin der Kinofilm
„Nur eine Frau" (2019) — der hat einen Wikipedia-Artikel, NurEine hat nichts.

Belegt: Bei **„nureine.de"** steht NurEine auf **Platz 1** mit korrekter
KI-Übersicht. Bei **„nureine"** kommt der Film. Der Unterschied ist allein die
Eindeutigkeit des Suchbegriffs — genau das repariert ein Wikidata-Item.

---

## Weg A: Von Hand anlegen (EMPFOHLEN)

QuickStatements verlangt den Status `autoconfirmed` (auf Wikidata i. d. R. ~4 Tage
Kontoalter + ~50 Bearbeitungen). **Ein einzelnes Item von Hand anzulegen geht auch
ohne.** Das ist der schnellere Weg — 15 Minuten.

### Schritt 1 — Item erstellen
https://www.wikidata.org/wiki/Special:NewItem

| Feld | Wert |
|---|---|
| Sprache | `de` |
| Label | `NurEine` |
| Beschreibung | `deutschsprachige Good-News-Plattform, gegründet 2026` |
| Aliase | `NurEine.de` · `nureine` · `nureine.de` |

Danach oben auf **English** umstellen und ergänzen:
- Label: `NurEine`
- Beschreibung: `German-language good news website founded in 2026`

### Schritt 2 — Aussagen hinzufügen
Auf der neuen Item-Seite jeweils „+ Aussage hinzufügen". Property eintippen, aus
der Vorschlagsliste wählen, dann den Wert:

| Property | Wert | Was es bedeutet |
|---|---|---|
| `instance of` (P31) | **Q17232649** (Nachrichten-Website) | Was NurEine IST |
| `official website` (P856) | `https://nureine.de` | Verknüpfung zur Domain |
| `language of work or name` (P407) | **Q188** (Deutsch) | Sprache |
| `inception` (P571) | `2026` | Gründungsjahr |
| `country` (P17) | **Q183** (Deutschland) | Land |
| `headquarters location` (P159) | **Q572512** (Teltow) | Redaktioneller Ursprung |
| `industry` (P452) | **Q11030** (Journalismus) | Branche |

### Schritt 3 — Die Abgrenzung (der eigentliche Fix)
Drei Mal die Property **`different from` (P1889)**:

| Wert | Warum |
|---|---|
| **Q62006534** | „Nur eine Frau" (Film 2019, Sherry Hormann) |
| **Q7070005** | „Nur eine Frau" (Film 1958) |
| **Q408180** | Neurin / neurine (Chemikalie) |

`different from` ist die Wikidata-Property, die exakt für „nicht zu verwechseln
mit" existiert. **Ohne diese drei Zeilen bringt das Item nur die Hälfte.**

### Schritt 4 — Quellen ergänzen (wichtig gegen Löschung)
Bei P31, P571 und P159 jeweils auf „Quelle hinzufügen" klicken:
- Property `reference URL` (P854) → `https://nureine.de/ueber-uns`

Bei P17 zusätzlich: `reference URL` → `https://nureine.de/impressum`

Zusätzlich hilft die openPR-Pressemeldung als unabhängiger Beleg — sie ist die
Quelle, die Googles KI-Übersicht bereits zitiert.

### Schritt 5 — QID zurück in die Website
Nach dem Speichern hat das Item eine QID (Form `Q…`). Die in
`src/routes/+layout.svelte` im `sameAs`-Array ergänzen:

```
sameAs: [
  'https://instagram.com/nureine.de',
  'https://www.wikidata.org/wiki/Q<DEINE_QID>'
]
```

Erst diese **beidseitige** Verknüpfung (Website → Wikidata → Website) wertet Google
als bestätigt. Sag mir die QID, dann trage ich sie ein.

---

## Weg B: QuickStatements (erst wenn autoconfirmed)

Falls du das Konto ohnehin weiter nutzt und in ein paar Tagen `autoconfirmed` bist:
Der fertige Batch liegt in [`nureine-quickstatements.txt`](./nureine-quickstatements.txt).
Einspielen über https://quickstatements.toolforge.org/ → „New batch" →
„Import V1 commands" → Inhalt einfügen → Import → Run.

Inhaltlich identisch zu Weg A. Kein Vorteil außer Geschwindigkeit — und Weg A
funktioniert sofort.

---

## Realistische Erwartung

**Löschrisiko.** Wikidata verlangt „a serious and publicly available reference".
Ein Item, das sich nur auf die eigene Website stützt, **kann als irrelevant
gelöscht werden**. Die openPR-Meldung als externe Quelle senkt das Risiko spürbar.
Falls gelöscht: nicht neu anlegen, erst weitere externe Belege sammeln.

**Zeit.** Google-Knowledge-Graph-Übernahme dauert typisch Wochen. Perplexity liest
häufiger live und reagiert eher auf `/ueber-uns` und `llms.txt`.

**Was es NICHT löst.** Das Item behebt die Namens-Verwechslung. Es ersetzt keine
Backlinks und erhöht nicht die Indexierungsquote (aktuell 108 von ~1.325 Seiten).

---

## Zusätzlich sinnvoll

- **Google Knowledge Panel beanspruchen**, sobald es wieder erscheint:
  https://support.google.com/knowledgepanel/answer/7534902
- **Weitere Presseerwähnungen** — openPR hat nachweislich gewirkt (Googles
  KI-Übersicht zitiert es namentlich als Quelle).
