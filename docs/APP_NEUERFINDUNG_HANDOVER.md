# NurEine App-Neuerfindung — Übergabe-Dokument

> **Zweck dieser Datei:** Eine neue KI-Session soll die Rolle „Lead Product Designer &
> Creative Engineer" für die NurEine-App-Neuerfindung **exakt an der Stelle** übernehmen,
> an der die letzte Session aufgehört hat. Diese Datei ist selbstständig — sie enthält
> Rolle, Zielbild, alle Entscheidungen, den Design-DNA-Kanon, den genauen Fortschritt,
> die Fallstricke und die konkreten nächsten Schritte mit Datei-Pfaden.
>
> Stand: 2026-07-14, mitten in **Phase 2 (Experimente)**. Erstellt beim Kontext-Übergang.

---

## 0. Wer du bist & wie du arbeitest

Du bist **Lead Product Designer & Creative Engineer** für NurEine. Auftrag von Aaron:
die NurEine-App **komplett neu erfinden** — nicht patchen. Am Ende soll sie vollständig
umgesetzt (produktionsreif) sein.

**Arbeitsweise (von Aaron gesetzt):**
- Zeig regelmäßig **Visuelles** — Aaron entscheidet an Beispielen, nicht an Beschreibungen.
  Bisheriges Mittel: **Artifacts** (klickbare, animierte HTML-Prototypen im Handy-Rahmen).
- Triff selbst mutige Design-Entscheidungen; bei **Weichenstellungen** lass Aaron wählen
  (Tool: `AskUserQuestion`, immer mit Empfehlung als erster Option).
- Sei kritisch mit dir selbst: sieht etwas nach „Standard-KI-App" aus → wegwerfen.
- Sprache mit Aaron: **Deutsch**, direkt, technisch, kein Bullshit. (Siehe seine
  Präferenzen: Ehrlichkeit > falsches Selbstbewusstsein.)

**Die 4-Phasen-Struktur des Auftrags:**
- **Phase 0 — Verstehen & Zielbild** ✅ abgeschlossen
- **Phase 1 — Konzept** (2–3 distinkte Konzepte, Aaron wählt) ✅ abgeschlossen
- **Phase 2 — Planung & Experimente** (Bauplan + animierte Prototypen einzelner Momente)
  🔄 **HIER BIST DU** — Bauplan fertig, 2 von 3 Experimenten fertig
- **Phase 3 — Vollständige Umsetzung** (produktionsreif, echte Daten) ⬜ offen

---

## 1. Das Zielbild (verinnerlichen, bevor du etwas tust)

Menschen sollen die App öffnen und **fühlen, dass die Welt wächst** — nicht „ich lese
Nachrichten", sondern „ich sehe Fortschritt, der sich aufsummiert, und ich bin Teil davon".
Emotionaler Kern: **Ruhe + Hoffnung + Staunen.** Nie Kitsch, nie Doomscrolling, nie
generische KI-App-Ästhetik.

**Wert in einem Satz** (aus PITCH-TRAINING.md, Aarons eigener Leitsatz):
> „Niemand braucht eine weitere gute Nachricht. Viele brauchen eine Pause von der
> schlechten. NurEine verkauft keine Information — es verkauft einen besseren Start in den Tag."

**Der Befund, der alles rahmt** (aus der Phase-0-Recherche):
> Die Good-News-Konkurrenz liefert **Inhalte ohne Mechanik**. Die besten Apps der Welt
> liefern **Mechanik ohne unsere Inhalte**. Die Lücke, die niemand besetzt: ein
> **tägliches, endliches Morgen-Artefakt** (Wordle-Knappheit + Fitness-Ring-Abschluss),
> erzählt in der Reel-Bewegungssprache (Zahlen mit Gewicht, Beleg-Stempel), im Ton von
> Gentler Streak statt Duolingo, in einer handgebauten Welt statt Template-Minimalismus.

**Harte Regel zur Vorlage:** Die bestehende App (SvelteKit-Web unter `/app/*` + native
SwiftUI unter `ios-native/`) darf technisch als Fundament dienen (API, Datenmodell,
Bilder). Aber **0 % Einfluss** vom aktuellen optischen Design/Flow/Layout. Das alte
`/app/*` ist Legacy und wird ersetzt.

---

## 2. Aarons Entscheidungen (FIX — nicht neu aufrollen)

Aus zwei `AskUserQuestion`-Runden. Diese sind gesetzt:

| Weiche | Entscheidung |
|---|---|
| **Plattform** | **Web zuerst** (mobile-first, SvelteKit/Vercel-Stack). Danach 1:1-Übersetzung nach SwiftUI (API-Vertrag + Push-Pfad existieren schon). |
| **Kern-Ritual** | **Eine Geschichte + stiller Epilog.** EINE Story in voller Dramaturgie ist die Erfahrung; danach optional „Außerdem heute" (3 Ein-Zeilen-Belege) + die Tages-Zahl aus Stand der Welt. |
| **Erfolg (90 Tage)** | **Morgen-Ritual** — D7-Retention ist die eine Zahl. Teilen ist eingebaut, dient aber dem Ritual. |
| **Fortschritt** | **Stille Sammlung** — alles akkumuliert, nichts verfällt je. Wochen-Rahmen statt Tages-Streak (kein Verlust möglich; Gentler-Streak-Philosophie). |
| **Konzept-Wahl** | **Alle drei verschmelzen** (Aaron wörtlich: „finde alles drei sehr gut, zu schade irgendwas wegzuwerfen"). Auflösung siehe §4. |

**Nebenfragen — BEANTWORTET (Aaron, 2026-07-14), jetzt FIX:**
- **Familien-Zeile:** ja, als aufklappbare Zeile im Abschluss-Beat (kein eigener Modus). ✅
- **Klang:** opt-in (Toggle, startet leise, funktioniert stumm) — wie in den Prototypen. ✅
- **Sprache:** v1 nur Deutsch. ✅
- **Persistenz:** v1 komplett lokal (localStorage), KEINE Schema-Änderung (RLS bleibt
  unangetastet, CLAUDE.md-Regel). ✅
- Home morgens: direkt ins Aufdecken (mein Default, in Exp1 umgesetzt) — von Aaron nicht
  widersprochen, gilt als bestätigt.
- **Noch offen (nicht blockierend):** Domain — neue Web-App ersetzt `nureine.de` komplett
  oder parallel `app.nureine.de` und löst dann ab? Bei Phase-3-Deploy klären.

---

## 3. Design-DNA v0.1 (der Kanon — konsistent halten)

**Herkunft:** Die DNA ist aus der **Reel-Marke geerbt** (`remotion/src/brand.ts` +
`ReelDaily.tsx`/`ReelTikTok.tsx`), damit Reel, Share-Card und App **eine** Sprache
sprechen (Robinhood-Prinzip: Wiedererkennung über Kanäle). Das ist NICHT die alte
App-Optik — die hat diese Welt nie konsequent gesprochen.

### Zwei Schichten (der Kontrast IST die Marke)
- **Ruhe-Schicht (das Papier):** alles Redaktionelle. Warme Neutrals, Bewegung
  **400–800 ms** (Headspace-Regel), Serifen-Momente, viel Raum, Stille als Default.
- **Beweis-Schicht (die Zahl):** Zahlen, Stempel, Fortschritt. Knackige Springs
  **< 400 ms**, Motion-Blur, Overshoot, Klang + Haptik. Selten, dafür mit Gewicht.

### Farben (aus `remotion/src/brand.ts`)
```
--bg/Papier   #f6f1e7  (Reel: CANVAS #f4efe6, App minimal wärmer)
--card        #fcf9f2   --paper #fbf8f1
--ink/Tinte   #16140f   --text #211d16   --muted #6b6359   --faint #9a9087
--amber       #bd6a35  (AMBER)   --amber-hi/deep #d08048 / #9c5527
Kategorie-Akzente: Klima/Tiere #56764e (Salbei) · Gesundheit #b06f6f (Rosé) ·
  Wissenschaft/Innovation #5d7e9c (Blau) · Gemeinschaft/Kultur #bd6a35 (Amber)
```
Dark Mode = „vor Sonnenaufgang" (`--bg #14110d`), NIE klinisches Schwarz. Regel:
**ein Akzent pro Screen**; die Buntheit liefern die dokumentarischen Story-Bilder.
Vollständiges Token-Set mit `@media (prefers-color-scheme)` + `:root[data-theme]`
in jedem Prototyp-`<style>` — von dort kopieren.

### Typografie (Fonts liegen in `remotion/public/fonts/`)
- **Space Grotesk Bold** — Display/Zahlen/Hooks. Zahlen: `font-variant-numeric:
  tabular-nums; letter-spacing:-.045em`. **Zahlen sind das Heldenelement.**
- **Newsreader Italic** — ausschließlich für **Quellen & Zitate** (editorialer Ton).
- Neutrale Grotesk (system-ui) fürs Laufende. (Inter liegt auch bereit, wird aber
  in den Prototypen nicht separat eingebettet.)
- Vertrauensregel: **Bild präzise, Sprache rund** — „160.566" im Screen, „über
  160.000" im Satz.

### Die 5 Bewegungs-Verben (Wortschatz)
1. **Einrasten** — Zahl kommt an: `scale 0,92→1,03→1` in ~9 Frames, Blur 4→0. Kein
   Laden.
2. **Wachsen** — Count-up mit historischem Anker, ease-out, endet in Stillstand
   (Closure). Max. **1 Count-up pro Session**, am Peak.
3. **Stempeln** — der Signature-Moment. `scale 2,4→0,94→1`, −4°, 2-Frame-Shake, Whoosh
   + Bass-Thud + Haptik. **Einmal pro Ausgabe. Wird NIE redesignt.**
4. **Schneiden** — harte Hell/Dunkel-Wechsel, Panels von unten mit −1,5°, KEINE
   Crossfades (editorialer Schnitt).
5. **Atmen** — Idle ±1,2 % Scale ~22-Frame-Periode; Abschluss-Atemzyklus **12 s**
   (4 s ein / 2 halten / 6 aus, parasympathisch).
Anti-Regeln: keine Scroll-Reveals auf allem; kein Konfetti; Interrupt-Arten rotieren
(Habituation); `prefers-reduced-motion` bekommt würdevolle stille Fassung.

### Klang & Haptik
Nur der **Stempel** klingt (Whoosh + doppelter Settle-Thud, einer aufs Halbe gepitcht =
Bass) + Haptik. In der App aus Reel-Samples + 8–12 Varianten (nie zweimal identisch,
Not-Boring-Regel). Sonst Stille. Funktioniert immer auch stumm. In den Prototypen ist
der Klang **live per Web Audio API synthetisiert** (keine externe Datei — die CSP der
Artifacts blockt externe Hosts).

### Ton (Microcopy)
- SO: „97.000 Landminen. Weg." · „4 Belege. 3 Minuten. Dann bist du fertig." ·
  „Morgen die nächste. Belegt." · jede Zahl trägt ihr Quellen-Label.
- NIE: „Entdecke deine tägliche Dosis Positivität" · Ausrufezeichen · Superlative ohne
  Beleg · „Unlock" · Emoji-Konfetti · KI-Motivations-Sprech · Guilt.

### Die Spannungs-Kette (Session-Dramaturgie, aus docs/HOOK_PSYCHOLOGIE.md)
Eine Session ist eine psychologische Zustandskette (dieselbe wie im 20-s-Reel, gedehnt
auf ~3 min): **Andocken → Aufdecken → Staunen → Verstehen → Beweis → Abschluss →
Weitergeben → Wachsen.** Die 5 Kernregeln daraus:
1. Hoffnung ist ein Verb (jede Story = Weg/Pathways + Handelnde + Mini-Handlung).
2. Der Fortschritt gehört der Welt, das Erleben dem Nutzer (Endowed Progress:
   Onboarding startet nie bei 0 — „du steigst in eine laufende Erfolgsgeschichte ein").
3. **Das Ende ist das Produkt** (Peak-End; feste Menge → Peak → zelebrierter Schluss;
   kein „Ähnliche Artikel", kein Pull-to-Refresh danach).
4. Gewohnheit schlägt Klickreiz (wir werden der Termin, nicht der Impuls).
5. Vorhersagbare Mechanik, staunenswerter Inhalt (**null variable Rewards**;
   Überraschung liegt in der Welt, nie im Interface).

### Anti-Slop-Wächter (jedes Konzept dagegen prüfen)
Template-Minimalismus (weiße Cards, Lila-Verlauf) · Motion ohne Hierarchie (alles faded
gleich) · Asset-Flickenteppich (Stile mischen) · Konfetti-Gamification ab Tag 1 ·
behaupteter statt bewiesener Wert. Persona „Carla" (Slop-Radar) ist Test-Jurorin.

---

## 4. Das Produkt-Konzept (Phase-1-Ergebnis, Synthese aller drei)

Aaron wollte alle drei Konzepte behalten. Auflösung:

- **A „Die Ausgabe" = das Erlebnis** (Kern-Ritual, das tägliche Artefakt).
- **B „Das wachsende Bild" = der Rahmen/das Zuhause** (ein Himmel voller Lichter =
  die stille Sammlung; jede gelesene Ausgabe = ein Licht; nichts verfällt).
- **C „Der Zähler" = ein zweiter Ausgaben-Typ** (an „Statistik-Tagen", wenn die
  Nachricht selbst eine neue Zeitreihe ist) **+ der Bereich „Stand der Welt"**.

**Home-Logik (meine mutige, geflaggte Entscheidung — von Aaron noch zu bestätigen):**
Morgens, solange die Ausgabe ungelesen ist, öffnet die App **direkt ins Aufdecken**
(null Reibung, Ritual zuerst — Habit-Forschung). Erst **nach** dem Lesen und bei jedem
weiteren Öffnen des Tages ist **der Himmel das Zuhause**, in das das neue Licht geflogen
ist. So ist B der Rahmen, ohne dem Ritual im Weg zu stehen.

**Die zwei Ausgaben-Typen (eine Dramaturgie, zwei Körper):**
- **Typ 1 — Die Geschichte** (Standard): Aufdecken → Cold-Open-Zahl → Wer&Wo (Bild,
  benannte Menschen) → Mechanismus (Aha) → Beweis (Stempel) → Abschluss (Atem, Teilen,
  Epilog, Familien-Zeile).
- **Typ 2 — Die Kurve** (Statistik-Tag): Aufdecken → Anker (alte Zahl, z. B. „1990:
  12,8 Mio") → Der Lauf (Kurve läuft 1990→heute, Zahl fällt mit) → Warum (Mechanismus)
  → Beweis + Abschluss; Kurve wandert zusätzlich in die „Stand der Welt"-Wand.
- Auswahl-Regel: Der Chefredakteur (Kurations-Routine) markiert Kurven-Tag automatisch,
  wenn die Primärquelle eine Zeitreihe ist (`source_type=official_stats` + Treffer in
  `nureine_world_metrics`).

**Die 9 Screens** (voller Bauplan im Phase-2-Artifact, siehe §6): 1 Aufdecken/Heute
`/app` · 2 Ausgabe/Reader `/app/ausgabe/[datum]` · 3 Himmel `/app/himmel` · 4 Stempelbogen
`/app/bogen` · 5 Stand der Welt `/app/welt` · 6 Archiv `/app/archiv` · 7 Geschichte
`/app/geschichte/[slug]` · 8 Onboarding `/app/start` · 9 Mehr `/app/mehr`.

---

## 5. Rohmaterial (das technische Fundament — nutzen, nicht neu bauen)

Stack: **SvelteKit + TypeScript** (Vercel), **Supabase** (Postgres, Tabellen-Prefix
`nureine_`), Bilder in Supabase Storage. Alle server-seitigen Queries zentral in
`src/lib/server/queries.ts`. **CLAUDE.md lesen** (Regeln, Cronjob-Zeiten) — und
**ARCHITECTURE.md + BUSINESS.md** vor Code.

**Story-Felder, die es schon gibt** (wichtigste; volle Liste in `queries.ts` Typen
`SupabaseStory`/`StoryResult` + `supabase/migrations/`):
- Kern: `title, subtitle(→dek), body_markdown, summary, source_url, source_name,
  reading_time_min, published_at, created_at` (created_at = Wahrheit für Frische).
- Kategorie/Geo: `category` (klima/gesundheit/wissenschaft/gemeinschaft/tiere/kultur/
  innovation), `region, region_code, lat, lng`.
- **Wirkungsindex**: `impact_score` (1–100), `impact_reach` (BIGINT), `impact_reach_score`
  (0–100, für Balken), `impact_durability`, `impact_evidence`, **`impact_explainer`**
  (ein menschlicher Satz). Anzeige: IMMER 3 erklärte Balken (Reichweite/Dauerhaftigkeit/
  Belege), nie nackte Zahl.
- Resonanz (getrennt): `res_perspektive/koerper/handlung/erinnerung`, `resonance_score`
  (0–10, ≥7,5 = „Perle"), `resonance_note`.
- Bild/Audio: `image_url` (Bucket story_images), `og_image_url`, `og_image_srcset` (JSONB),
  **`audio_url`** (TTS, Top-Stories).
- **`emotion`** (relief/wonder/hope/pride/warmth) — steuert Ton/Farbe/Dramaturgie.
- Social/Teilen: **`share_hook`** (fertiger Weitergabe-Satz!), `wa_opener`, `ig_hook`,
  `slides` (JSONB {hook,aufloesung,stille}), `tiktok_caption/_hashtags`.
- **Familie**: `kid_min_age, kid_explainer, conversation_starter` („ab 8 erklärbar").
- Beleg-Herkunft: `beat`, `source_type` (peer_review/official_stats/registry/open_data/
  gov/ngo/media). Status: `is_hero, newsletter_sent_at, sensitive, duplicate_of`.

**APIs (bestehend, für v1 ausreichend):**
- `GET /api/stories` — `?featured=true` (eine Story = Website-Hero, `getLatestFeatured`),
  `?category=`, `?limit=`, ohne Param = alle (newest first). `?stats=true`.
- `GET /api/stories/[id]`, `POST /api/track` (First-Party-Events, anonym),
  `POST /api/subscribe` / `GET /api/confirm` / `unsubscribe`, `POST /api/preferences`.
- Bild-Rendering: `/api/og/[slug]`, `/api/share-card/[slug]` (9:16), `/api/carousel/…`.
- **Push-Pfad EXISTIERT fertig**: `POST /api/app/register-token` + Tabelle
  `nureine_device_tokens` + Cron `/api/cron/push` (APNs Morgen-Story).
- Bild-Proxy: `/img?url=&w=` (PNG→WebP).
- `/stand-der-welt`: Tabelle **`nureine_world_metrics`** mit `series` (JSONB-Zeitreihe
  [{year,value}]), `baseline_value/_year` (z. B. 1990), `latest_value/_year`, `direction`
  (up/down = höher/niedriger besser), `blurb`, `source`, Rubrik `category` (ueberleben/
  planet/wissen/frieden). Monatliches Update (bewusst nicht live).

**iOS** (`ios-native/`, SwiftUI, Bundle `de.nureine.app`): reiner Reader über die Prod-API.
Design wird verworfen; wiederverwendbar sind API-Vertrag, `/img`-Proxy, Push-Pfad,
StoryStore-Cache. Legacy: `ios/` (alter Capacitor), `build-app/`, `/app/*`-Web-Shell.

**`nureine-impact/`** (Verzeichnis): Doku einer täglichen selbst-iterierenden
Hoffnungs-Impact-Routine (Cloud-Cron) — nicht die App, aber relevanter Kontext für den
Ton. Persistenz in `nureine_impact_runs` + `nureine_improvements`, Dashboard `/admin/impact`.

---

## 6. Bisherige Deliverables (Artifacts — live auf claude.ai)

Alle sechs sind veröffentlicht und für Aaron sichtbar:

1. **Phase 0 — Zielbild & Design-DNA:**
   https://claude.ai/code/artifact/c9740941-6d23-44a0-92fd-669f5d547133
2. **Phase 1 — Drei Konzepte** (klickbare Prototypen A/B/C im Handy-Rahmen):
   https://claude.ai/code/artifact/255101be-2a5b-47f2-8246-885e9e499798
3. **Phase 2 — Der Bauplan** (Konzept-Synthese, alle 9 Screens, beide Ausgaben-Typen,
   Onboarding, Ritual-Mechanik, Technik):
   https://claude.ai/code/artifact/98133e38-8893-471f-8b8c-f2a49df34865
4. **Experiment 1 — Der Morgen-Flow** (kompletter Typ-1-Flow, Aufdecken→Stempel→Himmel,
   mit Web-Audio-Klang + Haptik):
   https://claude.ai/code/artifact/7a9cef43-8e36-47c1-b5b8-f34439cbb504
5. **Experiment 2 — Der Kurven-Tag** (Typ-2-Ausgabe: Kurve läuft 1990→2024, Zahl fällt
   12,8→4,8 Mio mit, Stempel „Belegt.", Kurven-Licht in den Himmel; alle 6 Beats
   verifiziert, `animate()`-Helfer robust gegen rAF-Throttling):
   https://claude.ai/code/artifact/e1b8ce23-8a57-4d3e-8274-6c0581628d58
6. **Experiment 3 — Tag 1 / Onboarding** (6 Beats: Frage→Magic-Moment mit Held-Zahl
   „−63 %" + Stempel→sichtbare Arbeit 137/124/13→selbst gewählter Wenn-Dann-Anker
   [„Wenn ich den ersten Kaffee nehme, dann NurEine", trägt in Push-Vorschau]→3
   geschenkte Lichter [Endowed Progress]→Push-Bitte nach dem Wert; alle 7 Beats +
   Themen-/Anker-Interaktion verifiziert):
   https://claude.ai/code/artifact/b5bbff96-c8b2-4e0f-88a3-da7f29760f75

> **Wichtig zum Aktualisieren von Artifacts:** Um ein bestehendes Artifact zu
> überschreiben, `Artifact` mit `url:<die obige URL>` aufrufen (sonst entsteht ein
> neues). Für ein Artifact, das DIESE Session veröffentlicht hat, reicht derselbe
> `file_path`. Fetchen des gerenderten Inhalts geht per `WebFetch` auf die Artifact-URL
> (liefert aber Markdown, nicht das rohe HTML/JS — Quelltext also nicht daraus
> rekonstruierbar).

---

## 7. GENAUER Fortschritt & DIE NÄCHSTE AUFGABE

**Fertig:** Phase 0, Phase 1 (inkl. Aarons Konzept-Wahl), Phase-2-Bauplan (Artifact 3),
Experiment 1 (Artifact 4), **Experiment 2 „Der Kurven-Tag" (Artifact 5) UND Experiment 3
„Tag 1 / Onboarding" (Artifact 6) — beide verifiziert & publiziert 2026-07-14. Damit
sind ALLE DREI Experimente fertig.**

**Exp2 abgeschlossen** (Quelle unverändert `docs/app-prototypes/exp2-kurve.raw.html`,
gebaut mit `build.py`, publiziert als Artifact 5). Verifikation ergab: Seal-Open →
Anker (12,8 Mio/1990) → Lauf (Kurve läuft sauber auf 4,8 Mio/2024, Verdict erscheint,
`animate()`-Helfer überlebt Throttling) → Warum → Stempel „Belegt." (landet sichtbar,
`slam`-fill:forwards) → Himmel (33→34 Lichter, Toast). Encoding 0 Leaks, 0 Konsolen-Fehler.
⚠️ **Gelernt:** Die Chrome-MCP-Testumgebung erzwingt „Auto Dark Mode" (forced-dark) —
ein reines `#fff`-Div rendert als `rgb(24,26,27)`. Deshalb erscheinen die **Papier-Beats
(`.d-paper`) in Screenshots dunkel** statt hell; das ist ein Umgebungs-Artefakt, KEIN
Bug — `--paper` bleibt korrekt `#fbf8f1`, im Artifact/echten Gerät rendert die
Papier-Schicht hell. (White-Probe-Test zur Bestätigung: `#fff`-Div einfügen, `getComputedStyle`
prüfen.) Mechanik-Verifikation lief deshalb per `javascript_tool` DOM-State-Lesen, nicht
per Screenshot-Augenschein.

**Exp3 abgeschlossen** (Quelle `docs/app-prototypes/exp3-onboarding.raw.html`, gebaut mit
`build.py`, publiziert als Artifact 6). 7 Layer/Beats, alle verifiziert per DOM-State-Lesen:
(1) Frage „Was zieht dich runter?" mit 3 Themen-Chips → (2) Magic Moment (Held-Zahl rastet
ein „−63 %", Stempel „Belegt." schlägt zu — themenabhängig: Klima/Gesundheit/Konflikt) →
(3) sichtbare Arbeit (137 gelesen / 124 aussortiert [rosa] / 13 blieben) → (4) Anker
(4 Chips, bildet „Wenn ich den ersten Kaffee nehme, dann NurEine", trägt in Push-Vorschau
durch) → (5) 3 geschenkte Lichter (Endowed Progress, „du fängst nicht bei Null an") →
(6) Push-Bitte nach dem Wert (ehrliche Vorschau + gleichwertiges „Nein") → (7) „Du bist
drin." Encoding 0 Leaks, 0 Konsolen-Fehler. Interaktion (Themen-Wahl steuert Mini-Ausgabe,
Anker-Wahl personalisiert Formel+Push) funktioniert. Nutzt denselben `animate()`-Helfer,
Web-Audio + Haptik, forced-dark-Hinweis von Exp2 gilt auch hier (Papier-Beats 3+4).

**ABNAHME ERTEILT (Aaron, 2026-07-14): „Passt — ab in Phase 3".** Alle 3 Experimente
abgenommen, keine Iteration gefordert. Phase-3-Reihenfolge: Aaron überlässt sie mir
(technisch sauberste). Vier v1-Defaults FIX (siehe §2): nur Deutsch · lokal/localStorage
(kein Schema-Touch) · Klang opt-in · Familien-Zeile aufklappbar.

**PHASE 3 LÄUFT — Schritt 1+2 FERTIG & VERIFIZIERT (2026-07-14):**

Baureihenfolge (nach Abhängigkeit): (1) Basis ✅ → (2) Kern-Ritual ✅ → (3) Himmel ⬜ →
(4) Onboarding ⬜ → (5) Kurven-Tag/Stand der Welt ⬜ → (6) Rest ⬜.

- **Legacy verschoben:** altes `src/routes/app/` liegt jetzt in
  `docs/legacy-app-archive/routes-app/` (nur Referenz, hatte 2 vorbestehende TS-Fehler,
  raus aus Build/Routing). Neue App unter frischem `src/routes/app/`.
- **Schritt 1 — Design-Basis (`src/lib/app-v2/`):** `app-v2.css` (DNA-Token-Set, gescoped
  auf `.appv2`, Light+Dark via prefers-color-scheme + data-theme; WICHTIG: Text auf der
  Papier-Fläche nutzt `--paper-ink/-muted/-faint`, die mit dem Theme mitkippen — NICHT
  `--ink` direkt, sonst Dark-Mode-Kontrastfehler, war ein Bug). `motion.ts` (`animate()`
  setInterval-basiert, easeOut/snap, formatDeNumber). `audio.ts` (Web-Audio-Synth:
  whoosh/thud/chime/tick + haptic + stampSound). `prefs.svelte.ts` (localStorage-Store,
  Klang opt-in + Theme, Svelte-5-Runes). Fonts kommen global aus app.html (Google Fonts) —
  KEIN base64/@font-face nötig (nur die Artifacts brauchten das).
- **Schritt 2 — Kern-Ritual (`/app` = Screen 1 + `RitualReader.svelte`):** SSR-first
  (`+layout.ts` ssr=true, `+page.server.ts` lädt `getLatestFeatured()` server-seitig).
  6 Beats Typ 1, alle mit ECHTEN Daten im Dev-Server verifiziert (Port 5180, mobile):
  Aufdecken (atmendes Siegel) → Cold-Open (Score rastet per animate() ein, „70 von 100")
  → Wer&Wo (echtes Bild via /img-Proxy + Titel/Dek/Land, Newsreader nur Dek) → Mechanismus
  (3 erklärte Wirkungs-Balken Reichweite/Dauerhaftigkeit/Belege + summary) → Beweis
  (Stempel „Belegt." + Quelle Newsreader + sourceUrl) → Abschluss (Atem, shareHook-Teilen
  via wa.me, aufklappbare Familien-Zeile, „Fertig — in den Himmel"). Akzent folgt category
  (ein Akzent pro Screen). 0 Konsolen-Fehler, svelte-check 0 Errors.
- **queries.ts erweitert (kein Schema-Touch):** kid_min_age/kid_explainer/
  conversation_starter in `SupabaseStory`+`StoryResult`+`mapStory` durchgereicht (waren in
  DB, aber nicht gemappt) → Familien-Zeile funktioniert. Fallen bestätigt: `impactReach` =
  0-100-Score (nicht Personenzahl); `country`=Klarname/`region`=ISO-Code.
- **⚠️ Push-Deep-Link `/app/geschichte/{id}` ist AKTUELL TOT** (Legacy verschoben, neue
  Reader-Route noch nicht gebaut) — in Schritt 3/4 als `/app/ausgabe/[datum]` bzw.
  `/app/geschichte/[id]` wiederherstellen (native.ts + Legacy-Push zeigen dorthin).

**NÄCHSTER SCHRITT — Schritt 3: Screen 3 „Himmel" (der Rahmen).** localStorage-Sammlung
(jede gelesene Ausgabe = ein Licht, nichts verfällt). Das „Licht fliegt in den Himmel"
aus Exp2/Exp3 (buildSky/flyLight) übernehmen. Danach den `onDone`-Platzhalter in
`/app/+page.svelte` (aktuell simpler „Gelesen"-Screen) durch den echten Himmel-Übergang
ersetzen. `RitualReader.svelte` ist bewusst wiederverwendbar (nimmt `story` + `onDone`) —
der `/app/ausgabe/[datum]`-Reader (Schritt 3/4) nutzt dieselbe Komponente.

Referenz-Implementierung für alle weiteren Beats: `src/lib/app-v2/` + die 3 Roh-Quellen
(docs/app-prototypes/ für Exp2+Exp3; Exp1 in Session-Historie). Prototyp-Copy ist
produktionsreif formuliert und kann übernommen werden.

---

## 8. Technische Fallstricke (aus dieser Session gelernt — WICHTIG)

1. **Artifact-Encoding:** Der Artifact-Wrapper kontrolliert `<head>`, du kannst keinen
   charset setzen. Nicht-ASCII kippt sonst zu `Â·`/`â€"`. **Lösung = `build.py`** (liegt
   im Scratchpad): macht die Datei rein ASCII — HTML/CSS-Bereiche → numerische Entities
   (`&#NNN;`), **`<script>`-Bereiche → JS-Unicode-Escapes** (`\uXXXX`), weil HTML-Entities
   in JS/`textContent` NICHT dekodiert werden (das war der `&#128263;`-Sound-Bug).
   Emoji in JS immer als `🔇`-Escape.
2. **Fonts einbetten:** Die Marken-Fonts liegen in
   `remotion/public/fonts/{SpaceGrotesk-Bold,Newsreader-Italic}.ttf`. `build.py` bettet
   sie base64 über Platzhalter `__SG_B64__`/`__NR_B64__` ein (CSP blockt Font-CDNs).
   Roh-Quelle hat die Platzhalter, gebaute Datei die Daten. **Workflow:** roh editieren
   → `python3 build.py exp2-kurve.raw.html exp2-kurve.html` → `Artifact` auf die gebaute.
3. **rAF-Throttling in der Verifikations-Umgebung:** `requestAnimationFrame` (und teils
   `setInterval` in blockierendem `await`) feuern im Hintergrund-Tab der Chrome-MCP-
   Umgebung nicht → Animationen schienen „eingefroren". **Lösung = `animate(dur, onFrame,
   onDone)`-Helfer** (setInterval + `performance.now`, überlebt Throttling; ist auch auf
   echten Low-Power-Geräten robuster). Bereits in Exp2 drin; **Exp1 nutzt für den
   Count-up noch rohes rAF** (auf echtem fokussiertem Gerät unproblematisch, aber in
   Phase 3 überall `animate()` verwenden). Verifikation im Browser: **nicht** in einem
   CDP-`await` lange schlafen — stattdessen fire-and-forget klicken, per Bash `sleep`
   Wall-Clock warten, dann in separatem Call den DOM-State lesen.
4. **Scratchpad ist flüchtig:** Der in dieser Session genutzte Task-Unterordner
   (`5e8e9d04-…`) wurde mitten in der Arbeit geleert; der konfigurierte Scratchpad ist
   `…/1f1fa756-d44c-49ec-a8fb-d958089880bc/scratchpad`. **Lege Wichtiges, das überleben
   soll, ins Repo** (wie diese Datei) — nicht in den Scratchpad.
5. **Statischer Test-Server:** `python3 -m http.server 8731` im Scratchpad; Chrome-MCP
   (`mcp__claude-in-chrome__*`, via ToolSearch laden) navigiert auf `localhost:8731/…`.
   Tabs verschwinden gelegentlich → `tabs_context_mcp{createIfEmpty:true}` neu holen.

---

## 9. Speicher / Kontext (was schon dokumentiert ist)

- **Projektgedächtnis:** `~/.claude/projects/…-NurEine/memory/` — Datei
  `nureine-app-reinvention-2026-07.md` hält Weichen, DNA-Quelle, Konzept-Stand,
  Artifact-URLs; im `MEMORY.md`-Index verlinkt.
- **Obsidian-Session-Log:** `~/Documents/Obsidian Vault/70-sessions/2026-07-12.md`
  (Phase 0+1 detailliert).
- **Relevante Docs im Repo (Pflicht-Lektüre für die Rolle):** `docs/HOOK_PSYCHOLOGIE.md`
  (Spannungsphysik = das psychologische Fundament), `docs/TIKTOK_FORMAT_REZEPT.md`
  (Beweis-Loop-Dramaturgie), `docs/REEL_BAUKASTEN.md` (Motion-Details),
  `docs/AI_ROADMAP.md` (Foto-DNA: warm/dokumentarisch/ein Terracotta-Akzent),
  `STRATEGY.md` (App = Hauptkanal, Push>Mail), `CONTENT.md` (Redaktionsregeln),
  `ROADMAP.md §7` (Familien-Feature, Stand-der-Welt-Rationale, Anti-Streak-Haltung).
- **Motion-Katalog** (falls du exakte Spring-Configs brauchst): in
  `remotion/src/ReelDaily.tsx` + `ReelTikTok.tsx` (Snap `scale [0,5,9]→[0.92,1.03,1]`;
  Stempel `spring d11/m0.5/s260`, `scale 2.4→0.94→1`; Count-up `spring d13/m0.5/s200`).

---

## 10. Wenn du nur eine Sache tust

Veröffentliche **Experiment 2** (liegt fertig im Scratchpad), baue **Experiment 3**
(Onboarding, §7), zeig beide Aaron zur Abnahme — und halte dabei die Design-DNA (§3)
strikt ein: zwei Schichten, ein Akzent pro Screen, Zahlen als Held, Stempel als
unveränderliches Ritual, das Ende als Produkt, null variable Rewards. Dann Phase 3.
