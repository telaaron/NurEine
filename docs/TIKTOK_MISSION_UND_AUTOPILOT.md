# NurEine TikTok — Mission, Kommunikation & autonomer Lead-Agent

Das „Meeting" als Dokument (Aaron + Claude, 2026-07-14). Definiert das WOFÜR, wie wir
es auf TikTok sagen, und den vollautonomen Autopilot, der wie ein Mensch testet →
auswertet → Fazit zieht → umsetzt und uns Leads holt. Ergänzt (nicht ersetzt)
`docs/TIKTOK_STRATEGIE.md` (Funnel-Details) und `docs/AI_QUALITY_SYSTEM.md` (Lern-System).

---

## 1. Die Mission (Aaron-Entscheid)

**„Die Welt wird besser — und wir beweisen es."**

Nicht Wohlfühl-Ritual, nicht „Pause im Feed" als Kern — sondern eine *verteidigbare
Behauptung gegen die Zeitstimmung*: Der Fortschritt ist real, täglich, messbar — und
die meisten sehen ihn nicht, weil ihr Feed das Gegenteil zeigt. **Der Beleg ist das
Herz**, nicht die Deko. Das ist unser Existenzgrund und unser Unterschied zu jedem
Wohlfühl-/Hopecore-Account: Die kuscheln, wir *beweisen*.

Konsequenz für alles: Jede Design-, Text- und Autopilot-Entscheidung fragt zuerst
„macht das den Fortschritt sichtbarer/glaubwürdiger?" — nicht „ist das nett?".

## 2. Kommunikation auf TikTok — die Sprach-Doktrin

**Der Doom-Fehler (Aaron 2026-07-14, grundlegend):** Auf TikTok das Wort „Doom" (oder
„kein Doom", „hör auf zu scrollen", „schlechte Nachrichten") zu benutzen heißt, sich in
die Doom-Sprache EINZUREIHEN und den Schmerz zu BENENNEN, statt ihn zu lösen. TikTok IST
die Doom-Gesellschaft — wir predigen ihr nicht, wir sind der Kontrast IN ihr, ohne ihn
auszusprechen. **Regel: Wir benennen den Schmerz NIE. Wir zeigen die Lösung und lassen
den Kontrast wirken.**

Erlaubte Sprache (positiv, beweisend):
- „Das ist heute wirklich passiert. Belegt."
- „Die Welt wird an einer Stelle messbar besser."
- „Jeden Tag eine, die stimmt. Nachgeprüft."
- „Fortschritt Nr. 1.080 — und er geht weiter."

Verbotene Sprache (Anti-Doom-Klausel):
- „Doom", „Doomscrolling", „hör auf zu scrollen", „kein Doom mehr"
- „Die Welt ist schlecht, ABER…" (reproduziert den Schmerz)
- „schlechte Nachrichten", „negativer Feed", jede Bildschirmzeit-/Moral-Ansprache
- aufgesetzte Toxic Positivity / Kitsch / Superlativ ohne Beleg

**Der Meta-Move bleibt** — aber implizit: Wir SIND der Kontrast im Feed, wir sagen es
nicht. Das Video selbst ist der Beweis; wenn es beruhigt und belegt, hat der Zuschauer
das Gefühl „das war anders" — ohne dass wir „anders" behaupten mussten.

## 3. Der Funnel — erst Vertrauen, dann Conversion (Aaron-Entscheid)

Die ersten Wochen (bis ~1.000 Follower): **fast nur Format-Qualität.** Kein Verkaufen.
Der einzige Funnel-Touch ist der gepinnte Kommentar mit der QUELLE (reiner Mehrwert,
kein Marken-Sprech — sonst dupliziert er die Caption und wirkt bot-haft, s. Fix
2026-07-14) und ein dezenter Bio-Link. Newsletter/App wachsen organisch aus Vertrauen.
Nordstern bleibt: bestätigte Newsletter-Abos aus TikTok (nicht Views). Aber in Phase 1
ist die Leit-Frage „wächst das Vertrauen (Completion, Saves, Kommentar-Sentiment,
Marken-Suche)?", nicht „wie viele Abos heute?".

## 4. Der autonome Lead-Agent („NurEine-Wachstum")

Ziel: ein Agent, der wie ein guter Social-Media-Manager AGIERT — **Hypothese →
Test → Messung → Fazit → Umsetzung → nächste Hypothese** — vollautonom (Aaron-Entscheid),
Aaron kontrolliert nur per Report + Veto. Läuft auf dem Mac Mini (24/7), sobald der steht.

### 4.1 Er erfindet nichts neu — er erweitert den bestehenden Kreislauf
Wir haben schon: **Analyst** (zieht Metriken, schreibt Learnings + Verbesserungs-
Kandidaten in `nureine_improvements`), **Verbesserer** (setzt um, markiert applied),
**Reel-Regie** (produziert). Und `nureine_events` trackt DSGVO-freundlich
`newsletter_signup` + `go_click` (Funnel messbar). Der Lead-Agent ist die **TikTok-
Wachstums-Schleife obendrauf**, die diese Bausteine für EIN Ziel orchestriert: Leads.

### 4.2 Der Loop (was der Agent jeden Tag/Zyklus tut)
1. **Messen:** TikTok-Performance der letzten Posts (manuell von Aaron eingegebene
   Completion/Watch/Saves ODER später via API) + Funnel (`nureine_events`: go_click
   src=tiktok → newsletter_signup) zusammenführen. Was zog, was floppte, was
   konvertierte?
2. **Auswerten gegen Hypothesen:** Jeder Post trägt eine Testzelle (Hook-Klasse,
   Länge, Gimmick, Sachbild vs. Person, Soft-CTA an/aus, Kategorie). Welche Zelle
   gewinnt bei welcher Metrik? Ehrlich mit Stichprobengröße (bei <5 Posts/Zelle = noch
   kein Fazit, weiter sammeln — nicht auf Rauschen optimieren).
3. **Fazit + Learning:** Schreibt ein belegtes Learning nach `nureine_improvements`
   (Hypothese, Evidenz, Konfidenz). Beispiel: „Sachbild schlägt Person bei Completion
   um X% über 8 Posts → Wissenschafts-Stories immer Sachbild."
4. **Umsetzen:** Ändert die Produktions-Regeln (plan.json-Defaults, Baukasten-Parameter,
   Framing) im Rahmen der Governance (4.3) — ODER schlägt größere Änderungen Aaron vor.
5. **Nächste Hypothese:** Wählt die nächste offene Frage (was wissen wir noch nicht?)
   und setzt die Testzelle für die kommenden Posts.
6. **Report an Aaron:** Was getestet, was gelernt, was geändert, was als Nächstes,
   Funnel-Zahlen. Immer mit „das entscheide ich / das brauche ich von dir".

### 4.3 Governance — die harten Grenzen (KRITISCH bei Vollautonomie)
Der Agent darf eigenständig: Testzellen setzen, Hook/Framing/Länge/Gimmick/Bild-Motiv
variieren, Produktions-Regeln nach belegten Learnings anpassen, Captions/gepinnte
Kommentare formulieren, Story-Auswahl priorisieren, Reports schreiben.

Der Agent darf NIEMALS ohne Aarons Freigabe:
- **Fakten posten, die nicht gegen die Primärquelle geprüft sind** (Overpromise-Guard =
  USP-kritisch, s. Endometriose/Billion-Fälle). Zahl-Zweifel → nicht posten.
- Die **Anti-Doom-Klausel** (§2) verletzen oder den Schmerz benennen.
- **Sensible Themen** ohne Würde behandeln (Krankheit/Tod/Leid — kein Voyeurismus).
- Die **Marke aufweichen** (Superlativ ohne Beleg, Kitsch, Clickbait, Chart-Trending-
  Sounds/DMCA-Risiko, KI-Bild mit Anatomiefehler).
- **Geld ausgeben / Ads schalten / Rechtliches** (Impressum, DSGVO) ändern.
- **Automatisch auf TikTok posten**, solange kein sauberer Auto-Post-Weg steht (aktuell
  postet Aaron manuell; der Agent bereitet alles vor + reportet).
- Das **DB-Schema / RLS / Cron-Zeiten** ändern (bestehende harte Regel).
Bei jedem Zweifel: an Aaron eskalieren, nicht raten. Jede autonome Änderung wird in
`nureine_ai_runs`/`nureine_improvements` geloggt → Aaron kann alles nachvollziehen +
zurückrollen (Git).

### 4.4 Die Metriken, an denen der Agent sich selbst misst (Phase 1: Vertrauen)
Primär (Vertrauen): Completion-Rate, Ø-Watch-%, Saves/1k, Kommentar-Sentiment
(positiv/neutral/skeptisch), Marken-Suchvolumen „NurEine".
Nordstern (ab Phase 2): newsletter_signup mit src=tiktok / Woche (aus nureine_events).
Anti-Metrik (Warnsignal): Skip-Rate in Sek 3, „Slop/Werbung"-Kommentare, Unfollows.
Regel: Bei kleinem Sample qualitativ argumentieren, nicht auf Rauschen optimieren.

### 4.5 Menschlichkeit (Aaron: „soll wie ein Mensch agieren")
Der Agent handelt wie ein neugieriger, ehrlicher Kollege: formuliert Hypothesen in
Klartext, gibt Konfidenzen an, gibt eigene Fehler zu („diese Zelle war zu klein, ich
weiß es noch nicht"), fragt Aaron bei Geschmack/Ton, und optimiert auf das ECHTE Ziel
(Leads/Vertrauen), nicht auf Vanity. Kein blindes A/B-Grinden — er denkt in Geschichten
darüber, WARUM etwas zog.

## 5. Umsetzungs-Reihenfolge (wenn der Mac Mini steht)
1. **Testzellen-Tracking:** Jeder TikTok-Master bekommt eine Testzelle-Kennung (Feld im
   plan.json / an der Story). Ohne das kann der Agent nichts auswerten. (Kleiner Build.)
2. **Manueller Metrik-Eingabekanal:** Aaron trägt Completion/Watch/Saves pro Post ein
   (Admin-Feld), solange TikTok keine API-Zahlen liefert → Agent hat Datenbasis.
3. **Lead-Agent-Routine** (`nureine-wachstum`, SKILL): der Loop aus 4.2, Governance 4.3,
   Reports. Setzt auf Analyst/Verbesserer-Muster auf.
4. **Auto-Post** (separat, wenn Weg steht) — bis dahin bereitet der Agent vor, Aaron postet.

## 6. Offene Aaron-Entscheidungen
- Business-Account (Bio-Link ab Tag 1) — noch offen.
- Mac Mini live → dann Lead-Agent scharfschalten.
- App-Store-Link in `/go` eintragen, wenn App live.
- Schnelle Newsletter-Signup-Landingpage für TikTok (nicht Homepage).
