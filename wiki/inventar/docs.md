# Rohinventar Dokumente — Stand 2026-09-08

> Erhoben durch einen Lese-Agenten am 2026-09-08 über alle 48 Markdown-Dokumente.
> Empfehlungen darin sind Vorschläge des Agenten; verbindlich ist `wiki/REBUILD-PLAN.md`.
>
> **Korrektur:** Human-TODO #2 („18 Cronjobs installieren") ist **hinfällig** — die Jobs
> laufen auf dem Mini (siehe `wiki/00-LAGE.md`). Die Docs haben das falsch überliefert.

The scratchpad exists but I operate strictly read-only (no Write tool, no file creation). So I'll deliver the full inventory here rather than as a file — the requested 12-line summary first, then the complete tables below it.

**Zusammenfassung (12 Zeilen)**

1. **48 Markdown-Dokumente** inventarisiert: 17 im Root (ohne VISION.md/CLAUDE.md), 29 in `docs/`, 2 Ordner-READMEs, plus die Obsidian-Notiz.
2. **Überholt: 31 von 48** (~65 %) — alles aus Mai–Juli 2026, insbesondere der komplette B2B/Wachstums-Block und der gesamte TikTok/Reel-Cluster (9 Dokumente für einen Kanal).
3. **Noch gültig: 10** (VISION-Umfeld, STIMME, Präregistrierung, AUFRAEUMUNG, REEL_TEXT_REGELN, EFFIZIENZ, ARCHITEKTUR_MAC_MINI, APP_ROADMAP, AI_QUALITY_SYSTEM, ROSLING); 7 sind Teil-gültig.
4. Gültig #1 — **`docs/STIMME.md`** (25.08.): Der Stil-Kanon ist die einzige Tonquelle; die „Vertrauens-Metapher" statt „Diät-Metapher" ist exakt VISION §1 in Textform.
5. Gültig #2 — **`docs/langzeitindex-praeregistrierung.md`** v1.2: 9 Bereiche, 25 Indikatoren, Fenster 2005–2023, Gleichgewichtung 1/9 — die einzige Selbstbindung mit Git-Zeitstempel.
6. Gültig #3 — **`docs/AUFRAEUMUNG_2026-09-02.md`**: „Eine Wahrheit pro Sache" + „Ein Fallback muss laut sein" — genau das Gegenmittel gegen Aarons „Featuremuseum".
7. Gültig #4 — **`docs/EFFIZIENZ_KONZEPT.md`** R1–R4 (Bild-Proxy, <150 KB, nichts speichern was renderbar ist): verhindert die Supabase-Sperre, die 4 Tage Ausfall kostete.
8. Gültig #5 — **`docs/ARCHITEKTUR_MAC_MINI.md`**: Postgres bleibt Supabase, nur Bytes wandern; Cloudflare R2 hat null Egress. Nie umgesetzt, gilt sachlich weiter.
9. Widersprüche zu VISION: **BUSINESS.md** (B2B-Screen als einzige Monetarisierung), **B2B_SEITE_KONZEPT.md** und **LINKEDIN_KONZEPT.md** bauen auf einem Modell, das STRATEGY selbst als „am schwächsten" abräumt; **ARCHITECTURE.md/SETUP.md/Obsidian** beschreiben Gemini+Resend, die es nicht gibt.
10. Human-TODO #1: **Apple Developer Account (99 €/Jahr)** — blockiert seit Juni APNs-Push, TestFlight, App Store und ASO. Die App ist gebaut, kompiliert, aber nie gelaufen.
11. Human-TODO #2: **18 Cronjobs installieren** (`bash ops/install-cron.sh --dry-run`, Skript am 08.09. repariert) — ohne sie stehen Story-Fetch, Highlight-Mail, IndexNow und Social still.
12. Human-TODO #3–5: **App auf echtem iPhone durchspielen** (einzige Freigabe für den ganzen App-Zweig) · **E-05 Sperrklausel entscheiden** (blockiert laut VISION den Index-Bau formal) · **Google Publisher Center + Business Profile** (je 30 Min, 0 €, seit Juni offen).

---

## Inventar

### Root (`/Volumes/SSD 500G/.../NurEine/`)

| Datei | Datum | Thema | Kernaussage, die heute gilt | Widerspruch zu VISION.md? | Empfehlung |
|---|---|---|---|---|---|
| `README.md` | 2026-05-29 | Lizenz-/Eigentumshinweis, privates Repo | Alle Rechte vorbehalten, kein Open Source, kein Self-Hosting. | nein | **Behalten**, aber die Verweiszeile „Interne Dokumentation: ARCHITECTURE.md, BUSINESS.md, SETUP.md" auf VISION.md + STIMME.md korrigieren |
| `ARCHITECTURE.md` | 2026-09-02 | Stack, DB-Schema, RLS, Frontend-Routen (Mai-Stand) | Nur noch die RLS-/Tabellentrennungs-Begründungen sind wahr; Warnhinweis vom 02.09. sagt selbst: Gemini, Resend, `select_hero.py` existieren in **null** Dateien. | ja — beschreibt einen Phantom-Stack (Gemini/Resend); VISION verweist auf `.env.example` + `ops/crontab.txt` | **Archivieren** unter `docs/archiv/`. Ins Wiki nur den Abschnitt „Sicherheit/RLS" + Wirkungsindex-Formel (reach_norm ×0,4 / durability ×0,35 / evidence ×0,25) |
| `SETUP.md` | 2026-05-07 | Launch-Checkliste (Supabase, Resend, Gemini, Vercel, GitHub Secrets) | Nichts. Resend und Gemini sind ersetzt (Brevo, DeepSeek); Supabase läuft „über anderes Projekt". | ja — dieselbe Phantom-Stack-Ebene wie ARCHITECTURE | **Löschen.** Die 4 Monitoring-SQL-Queries am Ende vorher ins Wiki retten |
| `CONTENT.md` | 2026-05-06 | Redaktions-Richtlinien, Kategorien, Quellen-Ranking | Das **Quellen-Ranking** (peer-review 100 → Blog 20) und die Kategorie-Definitionen leben im Code weiter. | teilweise — „Gemini-Prompt anpassen" ist tot; Ton ist heute in STIMME.md geregelt | **Ins Wiki**: Quellen-Ranking-Tabelle + Kategorien-Definitionen + „Was wir NICHT veröffentlichen". Rest archivieren |
| `BUSINESS.md` | 2026-05-18 | Geschäftsmodell, B2B-Tiers, Unit Economics, Wettbewerb | Nur die 6 Manifest-Prinzipien und die Wettbewerbstabelle. Preise €499/799/999 sind nie getestet worden (0 zahlende Kunden). | **ja, doppelt**: (1) „B2B-Screen ist die einzige Monetarisierung" — STRATEGY 13.06. stuft dasselbe Modell als „am schwächsten" ein; (2) Ziel „5.000 Subs Jahr 1" vs. reale 15 | **Archivieren.** Ins Wiki: Wettbewerbstabelle + Manifest-Prinzipien. Preisliste als „nie validiert" kennzeichnen |
| `STRATEGY.md` | 2026-08-29 (Inhalt 06-12/06-13) | Zahlenbild, Benchmarks, Kanalentscheidungen, blinder Fleck | **Der schärfste Text im Repo.** §8: „Drei Strategie-Dokumente, null Ausführung der Mensch-Tasks" — gebaut wurde, nicht gewachsen. Reddit nie automatisieren. X/Twitter bleibt raus. | teilweise — Historisch-Banner trägt; das Nordstern-Ziel „Saves/Post" ist durch VISION überholt | **Ins Wiki**: §5 (Automatisierungs-Grenze), §8 (blinder Fleck) und die Warnung Upworthy/ze.tt. Rest archivieren |
| `ROADMAP.md` | 2026-08-29 (Inhalt 06-04) | Produktlücken P0–P3, Wachstums-Loops, Paywall-Strategie | Die P2-Notiz **`getStoryBySlug` lädt ALLE Stories und filtert in JS** ist ein echter, vermutlich offener Skalierungsbug. Paywall-Schwelle >500 aktive Abos. | ja — Feature-Programm gegen VISION-Priorisierung; „Stand der Welt" ist seit D-18 ersetzt | **Archivieren.** Ins Wiki nur die zwei technischen Schulden (Slug-Spalte, OG cold-render 36–45 s) als Backlog-Tickets |
| `FAHRPLAN.md` | 2026-08-29 (Inhalt 06-13) | 30-Tage-Nutzergewinnung, Tagesplan, Technik-Reste | „30 Tage, ein Ziel: 13 → ~200 Nutzer. KEIN neues Feature." — der **Kill-/Continue-Test, der nie durchgeführt wurde**. | **ja, der zentrale** — VISION §0 benennt ihn explizit als offene Entscheidung E-01 | **Behalten bis E-01 entschieden ist**, dann archivieren. Ins Wiki: der Kill-Kriterium-Satz als offene Führungsfrage |
| `BACKLOG.md` | 2026-06-13 | Task-Backlog mit [AARON]/[AGENT]/[EXTERN]-Owner | Die Owner-Legende ist das brauchbarste Muster im Repo. Die [AARON]-Tasks sind fast alle noch offen. | teilweise — Priorisierung folgt STRATEGY, nicht VISION | **Archivieren**, aber die offenen **[AARON]-Tasks vorher in die Human-TODO-Liste** überführen (siehe unten) |
| `GROWTH.md` | 2026-06-07 | Instagram-Algorithmus-Plan, A/B-System, Hashtags | Fast nichts. Nordstern „5 Saves/Post" wurde laut STRATEGY §8 **keinen einzigen Tag gemessen**. | ja — „größte Good-News-Plattform DACH" ist nicht mehr das Zielbild | **Archivieren.** Als Mahnmal wertvoll: eine Nordstern-Metrik, die 5 Wochen nie angeschlossen war |
| `GROWTH-REPORT.md` | 2026-06-25 | Growth-Engine-Audit, GEO/pSEO-Bets, ICE-Ranking | Gebaut und live: `llms.txt`, `/gute-nachrichten-app`, Themen-/Länder-Hubs, `/go`-Redirector mit `bet/src/asset`-Tracking. **Der `/go`-Mechanismus ist die einzige funktionierende Attribution.** | nein (technisch), teilweise (Zielbild) | **Ins Wiki**: `/go`-Attributionsschema + die GEO-Zitierlücke. Rest archivieren |
| `GROWTH-REDDIT-KIT.md` | 2026-06-25 | Reddit-Playbook, Subreddit-Liste, 3 fertige Posts | Die 5 Anti-Bann-Regeln und die Subreddit-Zuordnung gelten unverändert. Nie ausgeführt (0 Reddit-Referrer). | nein | **Ins Wiki** (Regeln + Subreddit-Tabelle). Die 3 konkreten Posts sind veraltet → löschen |
| `PITCH-TRAINING.md` | 2026-06-20 | Pitch-Skripte, Rollenspiele, PR-Templates | Die 5 Grundprinzipien und der 1-Satz-Pitch. Aber: der Kern-Pitch („wo die Welt besser wird") ist die **alte** Positionierung. | ja — Pitch sagt „wo die Welt besser wird", VISION D-12 sagt „wie die Welt IST" | **Ins Wiki nach Neuformulierung** des Kern-Pitches gegen D-12. §0-Prinzipien gelten unverändert |
| `META_SETUP.md` | 2026-06-07 | Instagram-Auto-Posting einrichten, Token-Weg | App-ID `1956896111625575`, IG_USER_ID `17841427734990268`, FB-Seite `1148485798353511`. Page-Token läuft nie ab. Der Token-Weg bei Neubedarf. | nein (rein operativ) | **Ins Wiki** als Runbook „Meta-Token neu ziehen" — die IDs und die MCP-Tab-Falle sind sonst nirgends dokumentiert |
| `REPORTER_BOTS.md` | 2026-06-11 | Primärquellen-Beats statt Medien-Aggregation | **Der stärkste Moat-Gedanke im Repo**: Primärquellen (WHO, Weltbank, IRENA) statt Zweite-Hand-Lärm; `beat` + `source_type` in der DB; „Lieber leer als laut". | nein — deckt sich mit VISION („worauf jede Aussage beruht") | **Ins Wiki, hohe Priorität.** Offen: Beat 5 (Kommunen) und die echten Daten-API-Adapter |
| `REBUILD_NOTES.md` | 2026-06-01 | Schema-Drift-Postmortem (Mai-Ausfall) | Die Lehre gilt: Migrationen wurden per Hand im Dashboard gepatcht, `schema_migrations` endete bei 00007. Newsletter-Auswahl ist seither atomar über `newsletter_sent_at`. | nein | **Archivieren** (TODO-Liste ist abgearbeitet). Ins Wiki: die Regel „nie per Hand im Dashboard patchen" + Postgres-Projekt-ID `gbfbhspqwaqvnoxitohd` |
| `OG_IMAGE_IMPROVEMENTS.md` | 2026-06-01 | OG-Bild-Pipeline: Größe, WebP/AVIF, srcset | Rein technisch, teils überholt durch EFFIZIENZ_KONZEPT (OG-Bilder gehören gar nicht mehr in den Storage). | nein | **Löschen** — der Inhalt ist durch EFFIZIENZ_KONZEPT R3 überschrieben |

### `docs/`

| Datei | Datum | Thema | Kernaussage, die heute gilt | Widerspruch zu VISION.md? | Empfehlung |
|---|---|---|---|---|---|
| `AUFRAEUMUNG_2026-09-02.md` | 2026-09-02 | Postmortem: 43 unmerged Branches, blinder Healthcheck, lügende Docs | **Zwei Regeln: „Eine Wahrheit pro Sache" und „Ein Fallback muss laut sein."** Plus die Liste offener Altlasten (doppelte Migrationsnummern 00016/00047/00048, 9 verstreute Schwellenwerte, zwei Resonanz-Skalen). | nein — stützt VISION direkt | **Ins Wiki, oberste Priorität.** Die zwei Regeln gehören in CLAUDE.md; die offene Tabelle wird zur Tech-Debt-Liste |
| `langzeitindex-praeregistrierung.md` | 2026-09-03 | Präregistrierung v1.2: Bereiche, Indikatoren, Anker, Abbruchkriterien | 9 Bereiche à 1/9, 25 verifizierte Weltbank-Codes, Fenster 2005–2023, keine Negativ-Quote, Richtung nie Auswahlkriterium. Git-Commit `1fe3dbc` als Zeitstempel. | nein — ist die operative Umsetzung von VISION §17 | **Ins Wiki als eigenständiges, unantastbares Dokument.** Nie stillschweigend ändern (Regel steht im Kopf des Dokuments) |
| `STIMME.md` | 2026-09-02 | Stil-Kanon: Ton, Satzbau, Verbote | „Eine Quelle reicht, um mit dem echten Zustand der Welt verbunden zu sein." Jede Story zeigt über sich hinaus (der 26. Bundesstaat, der dritte Fluss). **Einzige Tonquelle**; Prompts folgen ihr, nicht umgekehrt. | nein — deckungsgleich mit VISION §1 | **Ins Wiki, unverändert.** Zweitwichtigstes Dokument nach VISION.md |
| `EFFIZIENZ_KONZEPT.md` | 2026-07-17 | Regeln nach dem Supabase-Quota-Ausfall (4 Tage offline) | **R1** nie Supabase-URL direkt in `<img src>` (immer `storyImageSrc()`), **R2** nie unkomprimiert hochladen (<150 KB), **R3** nichts speichern was renderbar ist, **R4** Ephemeres löschen. | nein | **Ins Wiki.** R1–R4 gehören nach CLAUDE.md (dort laut Dokument bereits verankert — verifizieren) |
| `KOSTEN_EFFIZIENZ_KONZEPT.md` | 2026-07-16 | Dieselbe Sperre, Zahlen-Analyse pro Bucket | Die Messung (story_images 971 MB / 1002 Dateien, 252 Bilder Müll). Laut AUFRAEUMUNG heute nur noch 260/1024 MB → Problem gelöst. | nein | **Archivieren** — vollständig durch EFFIZIENZ_KONZEPT + AUFRAEUMUNG abgelöst. Doppelung mit fast identischem Titel ist selbst ein Symptom |
| `ARCHITEKTUR_MAC_MINI.md` | 2026-07-17 | Was gehört in die Cloud, was auf den Mini | **„Postgres bleibt in Supabase. Der Mac Mini wird Agenten-Runner + Bild-Archiv. Auslieferung über Cloudflare R2 (kein Egress)."** DB war nie das Problem (83 MB / 500 MB). | nein | **Ins Wiki.** Die R2-Empfehlung ist nie umgesetzt und weiterhin die richtige Antwort auf Egress-Kosten |
| `APP_ROADMAP.md` | 2026-07-21 | Die eine Prioritätenliste für iOS + Web-App | Web-App vollständig, iOS übersetzt und kompiliert — **aber nie gelaufen**. Fehlt: Kurven-Tag auf iOS, Offline-Festigkeit. Blockiert: Push/TestFlight/Store am Developer-Account. | nein (der App-Zweig ruht) | **Behalten als aktive App-Liste.** Ins Wiki: der Blocker-Abschnitt |
| `APP_NEUERFINDUNG_HANDOVER.md` | 2026-07-19 | Übergabe: Rolle, Zielbild, Design-DNA, Phasen | Aarons fixe Entscheidungen: Web zuerst, dann SwiftUI · Kern-Ritual „eine Geschichte + stiller Epilog" · Erfolgsmaß D7-Retention · **0 % Einfluss der alten Optik**. | teilweise — „fühlen, dass die Welt wächst" kollidiert mit D-12 („wie die Welt IST", nicht wie gut) | **Ins Wiki nur die Entscheidungstabelle §2**, mit Vermerk zum D-12-Konflikt. Rest (468 Zeilen Session-Handover) archivieren |
| `AI_QUALITY_SYSTEM.md` | 2026-08-25 | KI-Qualitätssystem, Drei-Stufen-Modell | **Das Drei-Stufen-Qualitätsmodell**: <55 gar nicht aufnehmen · 55–Perle ohne Bild (Typo-Karte, kein Emoji, kein Stockfoto) · nur Perlen bebildern. Fetch bebildert nicht mehr. | nein | **Ins Wiki.** Die Schwelle 55 gehört in die zentrale Schwellenwert-Datei (offener Punkt aus AUFRAEUMUNG) |
| `AI_ROADMAP.md` | 2026-07-13 | Agenten-Fahrplan, Bildmodell, Anatomie-Härtung | Bildmodell **Seedream v4.5** ($0,04/Bild) statt FLUX; Fotografen-DNA (Leica 35 mm, Portra 400, ein Terracotta-Akzent); Hände nie zeigen; Best-of-4 + Vision-Judge. | nein | **Ins Wiki**: Bildmodell-Entscheidung + Anatomie-Regeln. Der Agenten-Zeitplan ist überholt → archivieren |
| `NACHT_ROUTINEN_PROBLEME.md` | 2026-07-12 | Timing-Fehler und Blocker der Nacht-Kette | Die Kettenregel: Fetch → Chefredakteur → Veredler → Bild-Regie, alle nach 03:00 (sonst ist Aarons Claude-Kontingent leer). | nein | **Archivieren** — Momentaufnahme. Ins Wiki nur die Reihenfolge-Regel |
| `ROSLING_POSITIONIERUNG.md` | 2026-08-05 | Factfulness als Marketing-Fundament | **„Dein Weltbild ist nachweislich falsch. Wir korrigieren es — mit einem Beleg pro Tag."** Plus Roslings Warnung: nicht negative mit positiven Nachrichten ausgleichen, sondern „bad AND better". | nein — die stärkste Außenformulierung von VISION §1 | **Ins Wiki, hohe Priorität.** Das ist der Pitch, den PITCH-TRAINING.md noch nicht hat |
| `SEO_AUTHORITY_PLAN.md` | 2026-07-10 | Warum die Domain nicht rankt, Off-Site-Plan | Die Diagnose gilt: technisches SEO ist exzellent, es fehlen **Backlinks**. Google Business Profile ist der wichtigste Einzelschritt. NAP: NurEine / Teltow, Brandenburg / nureine.de. | nein | **Ins Wiki**: NAP-Definition + Diagnose + die 0-€-Verzeichnisliste. Offen und unerledigt |
| `PRESSEMITTEILUNG_LAUNCH.md` | 2026-07-10 | Fertige PM für openPR (0 €) | Versandfertiger Text, nie eingestellt. **Aber:** enthält „Human-Flourishing-Forschung" als Methodik-Grundlage — das ist nicht mehr die Methodik. | ja — beschreibt „Wirkungsindex 0–100 nach Human Flourishing", während der Index heute ein Zustandsbild nach SDG-Marken ist | **Überarbeiten oder löschen.** In der jetzigen Form würde ein Journalist eine Diskrepanz zur Methodikseite finden |
| `OUTREACH_PLAN.md` | 2026-07-07 | Reel-Maschine, Comment-to-DM, Cross-Promos | Realistische Conversion: **0,03–0,05 % View→Sub** — für 100 Subs/Monat braucht es 200–350k Views. Die Conversion-Maschine muss vor der Reichweite stehen. | ja — Nordstern „Newsletter-Abos + App-Warteliste" ist nicht VISIONs Zielbild | **Archivieren.** Ins Wiki nur die Conversion-Benchmark-Zahl (sie kalibriert jede künftige Erwartung) |
| `B2B_SEITE_KONZEPT.md` | 2026-07-24 | Konzept für `/fuer-unternehmen` | Aarons Entscheidungen: Preise offen zeigen, ehrlich „erste 3 Pilotpartner gesucht" statt Fake-Logos. | ja — baut auf dem B2B-Screen-Modell, das STRATEGY als schwächstes einstuft und das 0 Kunden hat | **Archivieren.** Wieder aufnehmen erst, wenn das Geschäftsmodell entschieden ist |
| `LINKEDIN_KONZEPT.md` | 2026-07-24 | LinkedIn-Kanal: Hybrid Firmenseite + Gründerprofil | Der strategische Kern gilt: LinkedIn bestraft News-Reposts, belohnt Thesen; Firmenseiten haben magere Reichweite, Reichweite entsteht über die Person. | teilweise — Zweck ist B2B-Vertrieb (siehe oben) | **Ins Wiki**: die Hybrid-Begründung + Arbeitsteilungstabelle. Der Vertriebszweck ist offen |
| `SOCIAL_ENGINE.md` | 2026-06-30 | Carousels, Wochen-Digest, Reels v3 | Der Format-Scheduler (Di Beleg · Do Methodik · Sa Stille · So Digest). **KI-Footer auf allen bildtragenden Slides — EU-KI-VO Art. 50, verbindlich ab 02.08.2026.** | teilweise | **Ins Wiki nur die KI-Kennzeichnungspflicht** (rechtlich bindend, Frist verstrichen) + Scheduler-Logik. „Reels v3/ReelDaily" ist laut REEL_BAUKASTEN verworfen → archivieren |
| `HOOK_PSYCHOLOGIE.md` | 2026-07-11 | Psychologisches Fundament des Kurzvideo-Formats | Die 20-Sekunden-Spannungskette mit Primärquellen (Loewenstein, Kahneman, Danek). Sauber gearbeitet, inkl. Hinweis dass Zeigarnik nicht repliziert. | nein | **Ins Wiki** als Referenzdokument — überlebt jeden Plattformwechsel, weil es Mechanismen statt Taktiken beschreibt |
| `REEL_TEXT_REGELN.md` | 2026-09-03 | Aarons Fünf-Block-Textstruktur für Reels | Einstieg spiegelt das Gefühl (nicht die Zahl) · Zahl steht allein ohne Adjektiv · Beleg wie ein Stempel · kein Medien-Vorwurf · Loop-Satzanfang. **Bei Widerspruch schlägt diese Datei REEL_BAUKASTEN.** | nein | **Ins Wiki**, gebündelt mit STIMME.md als „Textregeln" |
| `REEL_BAUKASTEN.md` | 2026-09-08 | Handbuch der täglichen Reel-Regie-Routine | Eine Pipeline (TikTok-Master), ElevenLabs ist Default, Stimme „Luca" `mmAbrxFQ9xjByXyBpqrK`, stability 0.65 / speed max 1.15, nie `[excited]`. **Aussprache-Gate per Whisper ist Pflicht** — ungeprüften Ton gibt es nicht. | nein (operativ) | **Behalten als aktives Betriebshandbuch.** Ins Wiki: Stimm-Parameter + die Gate-Pflicht |
| `TTS_PLAN.md` | 2026-07-26 | Aussprache-Sicherheit + lokale Stimme | Der Englisch-Wächter ist gelöst (Commit 62c4bdc). **Lizenz-Tabelle ist wertvoll**: XTTS-v2, F5-TTS-German, SauerkrautTTS = CC-BY-NC → für NurEine (kommerziell) tabu. | nein | **Ins Wiki**: nur die Lizenztabelle. Der Mac-Mini-Umstiegsplan ist offen/hypothetisch |
| `TIKTOK_PLAN.md` | 2026-07-13 | Account-Gründung, Automatisierung, Recht | **Impressumspflicht (TMG): Link im Website-Feld, sonst Bußgeld bis 50.000 €** — vor dem ersten Post. Creator-Konto statt Business (Musikrechte). | teilweise | **Ins Wiki nur die Rechtspflichten** (Impressum, AIGC-Label). Der Automatisierungspfad ist offen (Anbieter-Account fehlt) |
| `TIKTOK_STRATEGIE.md` | 2026-07-14 | Nordstern, Pain-Framing, Funnel | Pain spiegeln statt behaupten (Reaktanz vermeiden). Nordstern = bestätigte Abos aus TikTok/Woche, nicht Views. | teilweise — Nordstern ist ein Kanalziel, kein VISION-Ziel | **Archivieren.** Ins Wiki: das Pain-Framing-Prinzip |
| `TIKTOK_MISSION_UND_AUTOPILOT.md` | 2026-07-14 | Mission + autonomer Lead-Agent | **Die Doom-Sprachregel (Aaron, grundlegend): Wir benennen den Schmerz NIE.** Kein „Doom", kein „hör auf zu scrollen" — wir sind der Kontrast, ohne ihn auszusprechen. | ja — Mission „Die Welt wird besser und wir beweisen es" steht direkt gegen D-12 („nicht wie GUT, sondern wie die Welt IST") | **Ins Wiki nur die Doom-Sprachregel** (gilt kanalübergreifend). Die Mission muss gegen D-12 neu formuliert werden |
| `TIKTOK_FORMAT_REZEPT.md` | 2026-08-20 | Sekunden-Bauplan, Hook-Bibliothek, Wettbewerbsanalyse | Das Muster der Gewinner: ein emotionaler Moment, Peak in Sekunde 1, Kontext im Overlay, kein Moderator. **Verlierer: IG-Repost 1:1 auf TikTok.** Transparent über unverifizierte Zahlen. | nein (rein handwerklich) | **Ins Wiki**: die Gewinner-/Verlierer-Muster. Die Follower-Snapshots von Juli 2026 sind verfallen |
| `TIKTOK_PERSONA_TEST_PROMPT.md` | 2026-07-11 | Externer Prompt für Video-Test-Panel (5 Personas) | Funktionierendes Werkzeug, weil Claude keine MP4s ansehen kann. Rückweg: Audio-Audit → `remotion/tts-lexikon.json`. | nein | **Ins Wiki** als Werkzeug. Ein Dokument, das ehrlich eine Modellgrenze umgeht |
| `app-prototypes/README.md` | 2026-07-14 | Ordner-Zusammenfassung | 2 Roh-HTML-Prototypen (Kurven-Tag, Onboarding) + `build.py` für Artifact-Publishing. Exp1 ging beim Scratchpad-Leeren verloren. | nein | **Ordner behalten** solange die App-Neuerfindung ruht; bei Abbruch des App-Zweigs mit archivieren |
| `legacy-app-archive/README.md` | 2026-07-14 | Ordner-Zusammenfassung | Alte `/app`-SPA, bewusst aus `src/routes/` genommen (2 TS-Fehler, Build/Typecheck-Störung). Design verworfen, nur der API-Vertrag war wiederverwendbar. **Nicht reaktivieren.** | nein | **Löschen** — der Zweck („bei Bedarf Muster herauskopieren") ist nach 14 Monaten hinfällig; Git hält die Historie ohnehin |

### Extern

| Datei | Datum | Thema | Kernaussage, die heute gilt | Widerspruch zu VISION.md? | Empfehlung |
|---|---|---|---|---|---|
| `~/Documents/Obsidian Vault/20-projects/nur-eine.md` | 2026-05-12 (updated), Status-Block 2026-05-28 | Projektnotiz: Stack, 7-Stage-Pipeline, Quellen-Conversion | Die Quellen-Conversion-Tabelle (Good News Network ~88 %, Berliner Zeitung ~9 %, Utopia ~5 %) ist die einzige Stelle mit Conversion pro Quelle. | ja — nennt FLUX.1 [schnell] (heute Seedream), 4× Fetch + „1x hero select" (existiert nicht), lokaler Pfad falsch (`/Users/…` statt SSD-Volume) | **Ersetzen** durch einen kurzen Zeiger auf VISION.md + `ops/crontab.txt`. Conversion-Tabelle vorher ins Wiki retten |

---

## (a) Alle je genannten Ziele und Kennzahlen

| Zahl / Ziel | Datum | Quelle |
|---|---|---|
| Free Subscriber: 500 (Monat 3) / 5.000 (Jahr 1) | 2026-05-18 | `BUSINESS.md` |
| B2B-Kunden: 3 Piloten (M3) / 20–30 (J1); MRR €1.500 → €10–15k | 2026-05-18 | `BUSINESS.md` |
| Weg zu €100k MRR = 200 B2B-Kunden à €499; Break-Even bei 5 Kunden | 2026-05-18 | `BUSINESS.md` |
| Preis-Trigger: nach 3 Piloten → €699; nach 10 Kunden → Enterprise €999 | 2026-05-18 | `BUSINESS.md` |
| Cold Outreach: 50 LinkedIn-Messages/Tag; 5 % Response × 20 % Close ≈ 4 Kunden/Woche | 2026-05-18 | `BUSINESS.md` |
| **7 Abonnenten** (Ist) | 2026-06-04 | `ROADMAP.md` §0 |
| Monetarisierungs-Schwelle: >1.000 Abos, >35 % Open-Rate, >5 Shares/Story | 2026-06-04 | `ROADMAP.md` §1 |
| Paywall „NurEine Plus" ~3,99 €/Mo bzw. 35 €/Jahr, Launch erst >500 aktive Abos | 2026-06-04 | `ROADMAP.md` §8 |
| Nordstern: **Ø 5 Saves/Post** nach 4 Wochen (nie gemessen) | 2026-06 | `GROWTH.md` §0 |
| Newsletter-Swap-Ziel: DACH-Newsletter <5.000 Subs | 2026-06 | `GROWTH.md` |
| **13 Abonnenten** (11 bestätigt), +1–4/Woche | 2026-06-12 | `STRATEGY.md` §0 |
| Zustellrate 284/284 = 100 %, 0 Bounces; Open ≈16 % (unzuverlässig, Apple MPP); Klick ≈37 % | 2026-06-12 | `STRATEGY.md` §0 |
| Instagram: 13 Feed-Posts + 33 Stories, **~4 Follower**, 129 Profilaufrufe/30 T | 2026-06-12 | `STRATEGY.md` §0 |
| Website: 714 Pageviews / 60 Sessions — echter Fremd-Traffic **<100 Views/Monat** | 2026-06-12 | `STRATEGY.md` §0 |
| Redaktion: 945 KI-Entscheidungen, 78 akzeptiert = 8,3 % (~12:1), 389 Stories | 2026-06-12 | `STRATEGY.md` §0 |
| **Kill-/Continue-Kriterium: 13 → ~200 echte Nutzer in 30 Tagen** | 2026-06-13 | `STRATEGY.md` / `FAHRPLAN.md` |
| App realistisch 3–6 Wochen bis zum ersten Fremdnutzer (Account → Verifizierung → Review) | 2026-06-13 | `STRATEGY.md`, `FAHRPLAN.md` |
| Warm-100: 100 Nachrichten in 14 Tagen → 50–100 Subs (warm konvertiert >50 %) | 2026-06-13 | `STRATEGY.md` §6 |
| Reddit-Ziel: 3 Posts/Woche → 1–2 Posts >500 Upvotes in 90 T → +150–400 Subs | 2026-06-13 | `STRATEGY.md` §6 |
| PR-Ziel: 1–2 Veröffentlichungen → 300–1.000 Subs | 2026-06-13 | `STRATEGY.md` §6 |
| Stufenplan: 0→1.000 (M1–3) · 1.000→10.000 (M4–8) · 10.000→50.000 (M9–12+), CAC <2 € | 2026-06-13 | `STRATEGY.md` §6 |
| Open-Rate-Messlatte: 40 %+ (beehiiv-Ø 41 %), nicht 20 % | 2026-06-13 | `STRATEGY.md` §1 |
| GSC-Baseline: ~3 Impressions, 2 Queries, **0 Klicks** / 90 T; ~700 Story-Seiten, 0 indexiert | 2026-06-25 | `GROWTH-REPORT.md` |
| GSC 28 T: 1 Klick, ~62 Impressions, 4 Queries; ~1.000 Story-URLs nicht indexiert | 2026-07-10 | `SEO_AUTHORITY_PLAN.md` |
| ~13 Newsletter-Abos, IG <1.000 Follower, 232 Posts automatisiert | 2026-07-06 | `OUTREACH_PLAN.md` |
| Conversion-Realität: **0,03–0,05 % View→Sub** → 200–350k Views/Monat für 100 Subs | 2026-07-06 | `OUTREACH_PLAN.md` |
| Trial Reels erst ab 1.000 Followern → 1k ist Etappenziel #1 | 2026-07-06 | `OUTREACH_PLAN.md` |
| TikTok-Ziele: Completion 70 %+, dann Rewatch → Shares → Saves | 2026-07-11 | `TIKTOK_FORMAT_REZEPT.md` |
| App-Erfolgsmaß 90 Tage: **D7-Retention** (Morgen-Ritual gehalten) | 2026-07-14 | `APP_NEUERFINDUNG_HANDOVER.md` |
| Qualitätsstufen: <55 raus · 55–Perle ohne Bild · nur Perlen bebildern (~2–4 Bilder/Tag) | 2026-07-10 | `AI_QUALITY_SYSTEM.md` |
| Stories: ~22/Tag → Ziel ~8–12 wirklich relevante | 2026-07-08 | `AI_ROADMAP.md` |
| 1.092 Stories, 21 Subscriber, DB 83 MB | 2026-07-17 | `ARCHITEKTUR_MAC_MINI.md` |
| **15 bestätigte Abonnenten**, 1.294 Stories, 50 Roadmap-Einträge, iOS-App nicht im Store | 2026-08-26 | `VISION.md` §0 |
| Langzeitindex 2023 = **53,6** (2005: 50,2), +0,11 Punkte/Jahr; 8 Bereiche steigen, Ökologie −14,1 | 2026-09-03 | `VISION.md` §19.2 |
| Robustheitsquote 86,5 % (gefordert 90 %) — bewusst überschrieben (D-19) | 2026-09-03 | `VISION.md` §19.1 |
| Storage aktuell 260 von 1.024 MB | 2026-09-02 | `docs/AUFRAEUMUNG_2026-09-02.md` |

**Muster:** Die Abonnentenzahl bewegt sich über vier Monate 7 → 13 → 15 → 21 → 15. Jedes Zielbild darüber (500, 1.000, 5.000, 50.000) wurde formuliert, ohne dass eine Stufe je erreicht wurde. Das ist die Zahl, an der sich das CEO-Projekt messen lassen muss.

---

## (b) Externe Accounts, Dienste, Kosten

| Dienst | Was in den Docs steht | Status |
|---|---|---|
| **Vercel** | Hosting SvelteKit (adapter-vercel), Auto-Deploy auf main. Env in 3 Umgebungen. Erforderlich: `ADMIN_SESSION_SECRET`, `BREVO_WEBHOOK_SECRET`, `IG_USER_ID`, `IG_ACCESS_TOKEN`, `ELEVENLABS_API_KEY`, `FAL_KEY`, `PUBLIC_BASE_URL` | aktiv; einzelne Env-Variablen laut ROADMAP unverifiziert |
| **Supabase** | Projekt `gbfbhspqwaqvnoxitohd` (MustSeen). Free-Tier: 500 MB DB / 1 GB Storage / 5 GB Egress. **Sperre 16.–20.07.2026**, 4 Tage offline. Pro = $25/Mo als Dauerlösung erwogen, abgelehnt. Heute 260/1024 MB | Free-Tier, wieder im grünen Bereich |
| **Cloudflare** | Account existiert (Newsletter-Worker). **R2 empfohlen**: kein Egress, 10 GB gratis, dann ~$0,015/GB/Monat | R2 nie eingerichtet — offener Hebel |
| **Brevo** | E-Mail/Newsletter + Webhook (`/api/webhooks/brevo`). Free = **300 Mails/Tag** → Grenze bei ~300 Abos. Starter ~9–25 €/Mo geplant. SPF/DKIM/DMARC zu verifizieren (P0 seit Juni) | Free-Tier; DNS-Prüfung offen |
| **DeepSeek** | Text-LLM (`deepseek-chat`) für alle Story-Felder. Guthaben 45,59 $ (06/2026). Ein 402 hat den Fetch schon in den Notbetrieb gezwungen | aktiv; Anthropic als zweiter Endpunkt |
| **fal.ai** | Bilder. Alt: FLUX.1 [pro]. Neu: **Seedream v4.5, $0,04/Bild**, ~5–6 Premium-Bilder/Tag ≈ **7–8 €/Monat**. Bild-QA LLaVA-NeXT (veraltet) | aktiv; **offen: kommerzielle Lizenz im fal.ai-Plan bestätigen** |
| **ElevenLabs** | TTS, Default-Engine. Stimme „Luca — Dynamic & Engaging" (`mmAbrxFQ9xjByXyBpqrK`). **47,5 % Kontingent verbraucht** (06/2026) | aktiv; Kontingent beobachten |
| **edge-tts** | Microsoft, kostenlos, Fallback (`REEL_TTS=edge`). Trifft Fachwörter nicht sicher | Fallback |
| **Google Gemini** | API-Key angelegt, 250 Requests/Tag Free | **tot** — kommt in null Dateien vor |
| **Resend** | Newsletter-API laut ARCHITECTURE/SETUP | **tot** — durch Brevo ersetzt |
| **Apple Developer** | **99 €/Jahr.** Blockiert APNs-Push, TestFlight, App Store, ASO. Personal Teams können kein Push | **nicht gekauft** — der älteste Blocker |
| **Instagram / Meta** | IG `nureine.de` (Business), FB-Seite „NurEine" `1148485798353511`, App „NurEine Poster" `1956896111625575`, IG_USER_ID `17841427734990268`. Page-Token läuft nie ab. Fehlender Scope `instagram_manage_insights` → Saves/Reach seit Tag 1 blind | aktiv, Insights blind |
| **Threads** | Setup 12.06., Auto-Post ab 13.06. „Laufen lassen, nicht investieren". 0 Zeilen in `nureine_social_posts` (Bug, am 02.09. behoben) | aktiv, minimal |
| **TikTok** | Creator-Konto geplant (nicht Business, wegen Trend-Sounds). Auto-Post nur über auditierten Wrapper: **upload-post.com ~16–24 $/Mo** oder Blotato ~29 $/Mo; Ayrshare ab 299 $/Mo verworfen | Anbieter-Account **nicht angelegt**; manueller `/admin/tiktok`-Flow |
| **LinkedIn** | Hybrid Firmenseite + Aarons Profil; Firmenseite anzulegen | offen |
| **WhatsApp-Kanal** | Ab ~1.000 Subs, 1 Post/Tag | offen |
| **Reddit** | Account braucht >2 Wochen Alter / >50 Karma vor dem ersten Post | vorbereitet, nie genutzt |
| **Google Search Console** | Domain verifiziert; Sitemaps eingereicht; „URL is unknown to Google" für `/stand-der-welt` | aktiv |
| **Google Publisher Center** | News/Discover-Eligibility, kostenlos, ~30 Min | **nicht angemeldet** |
| **Google Business Profile** | Wichtigster Einzelschritt für Brand-Signale. NAP: NurEine / Teltow, Brandenburg / nureine.de | **nicht angelegt** |
| **openPR** | PM einstellen 0 €; Fachverteiler DACH 47–347 € einmalig; Full-Service 199 € | PM fertig, nie eingestellt |
| **Verzeichnisse** | Webwiki, Cylex, Gelbe Seiten, Das Örtliche, Das Telefonbuch, 11880, GoYellow, Brownbook — je 0 €, dofollow | offen |
| **DM-Tools** | ManyChat verworfen (Free nur 25 Kontakte). Alternativen: InstantDM $9,99/Mo, LinkDM Free 1.000 DMs, CreatorFlow Free 500 | Account offen |
| **Keyword-Tool** | SEMrush o. ä. ~140 €/Monat — VISION E-09, unentschieden | offen |
| **Gastbeitrag/Link** | ~150–400 €/Link (DR30+), erst nach 0-€-Fundament | nicht empfohlen |
| **Domain nureine.de** | Aktiv. NAP-Anker. Impressum unter `/impressum` erforderlich (TMG) | aktiv |
| **GitHub** | Actions (am 25.07. abgeschaltet), Secrets, `langzeitindex.yml` (So 03:00 UTC). `gh` auf dem Mini eingeloggt seit 02.09. | teils aktiv |
| **Mac Mini** | Agenten-Runner + Bild-Archiv, 24/7. 18 Cronjobs nie installiert | Hardware da, Jobs nicht scharf |
| **Wikidata / Bing** | in den Dokumenten **nicht erwähnt** | — |
| **Laufende Kosten gesamt** | **~13,50 $ / 30 Tage** (06/2026). „15 $/Monat = praktisch unendlicher Runway" | der stärkste strukturelle Vorteil |

---

## (c) Human-TODOs — nur Aaron kann das

**Blockiert ganze Zweige**

1. **Apple Developer Account kaufen (99 €/Jahr)** — danach: APNs-Key → Vercel → Migration 00032 → Push → TestFlight → App Store. Blockiert seit Juni den gesamten App-Zweig plus ASO und die echte Store-URL in `/go` (heute Platzhalter `id0000000000`). *(FAHRPLAN, APP_ROADMAP, GROWTH-REPORT)*
2. **18 Cronjobs installieren.** Skript am 08.09. repariert (`b718db5`), Pfad mit Leerzeichen war die Ursache. Risikofrei ansehen: `bash ops/install-cron.sh --dry-run`. Betroffen: Story-Fetch, Social-Publish/-Generate, Highlight-Mail, IndexNow, Welt-Newsletter, Healthcheck. Aarons Entscheidung, weil die Jobs Mails verschicken und posten. *(VISION E-07)*
3. **App auf dem echten iPhone durchspielen.** Xcode öffnen, iPhone anstecken, Play. Die App ist kompiliert, aber nie gelaufen (iOS-27-Simulator fehlt). Alles Weitere hängt an dieser Rückmeldung. *(APP_ROADMAP)*
4. **E-05 Sperrklausel entscheiden** — öffentliche Selbstbindung: fallender Wert wird Titelmeldung, Methodenänderungen 12 Monate gesperrt. Blockiert laut VISION den Index-Bau formal (V0/V1 sind faktisch trotzdem gebaut). *(VISION §13)*
5. **E-01 entscheiden: Fahrplan oder Vision.** Bei 15 Abonnenten die Führungsfrage — (a) erst 200 Nutzer, (b) Vision gilt, (c) nur Phase 1. *(VISION §13)*

**Accounts und Keys**

6. **IG-Token mit `instagram_manage_insights` neu ziehen** — Meta-App-Dashboard → „NurEine Poster" → Berechtigung ergänzen → OAuth im normalen Browser (nicht im MCP-Tab) → neuer Page-Token in Vercel. Saves/Reach sind seit Tag 1 blind. *(FAHRPLAN, NACHT_ROUTINEN, BACKLOG #3)*
7. **TikTok-Auto-Post-Anbieter anlegen** (upload-post.com, ~16–24 $/Mo) + OAuth-Kanalverknüpfung + API-Key. Bis dahin bleibt jeder Post manuell. *(TIKTOK_PLAN §8c)*
8. **DM-Tool-Account** für Comment-to-DM wählen und anlegen. *(OUTREACH_PLAN Phase B)*
9. **fal.ai-Lizenz bestätigen** — einmalig im Plan prüfen, dass die generierten Bilder kommerziell genutzt werden dürfen. *(SOCIAL_ENGINE)*
10. **Vercel-Env verifizieren**: `ELEVENLABS_API_KEY`, `FAL_KEY`, `ADMIN_SESSION_SECRET`, `PUBLIC_BASE_URL` (ohne letztere feuert der Monats-Cron ins Leere). *(FAHRPLAN, ROADMAP)*
11. **Brevo**: SPF/DKIM/DMARC verifizieren; Starter-Plan vor ~300 Abonnenten einplanen. *(ROADMAP P0, STRATEGY)*

**Sichtbarkeit, 0 €, je unter einer Stunde**

12. **Google Publisher Center anmelden** (~30 Min, dann passiv). *(BACKLOG #5)*
13. **Google Business Profile anlegen** — laut SEO-Plan der wichtigste Einzelschritt; NAP exakt: NurEine / Teltow, Brandenburg / nureine.de. *(SEO_AUTHORITY_PLAN 1.1)*
14. **8 Branchenverzeichnisse eintragen** (Webwiki, Cylex, Gelbe Seiten, Das Örtliche, Das Telefonbuch, 11880, GoYellow, Brownbook), NAP identisch. *(SEO_AUTHORITY_PLAN 1.2)*
15. **Pressemitteilung bei openPR einstellen** — Text ist fertig, aber vorher gegen die neue Methodik prüfen („Human Flourishing" stimmt nicht mehr). *(PRESSEMITTEILUNG_LAUNCH)*
16. **Gründerfoto ablegen**: `static/images/aaron.jpg` (~600 px). Das fehlende 5-Sekunden-Vertrauenssignal. *(FAHRPLAN, BACKLOG #10)*
17. **Impressum prüfen** und in alle Social-Profile verlinken — TMG-Pflicht vor dem ersten Marken-Post, Bußgeld bis 50.000 €. *(TIKTOK_PLAN §2.4)*

**Distribution — nie ausgeführt, laut STRATEGY der einzige echte Engpass**

18. **Warm-100**: 100 persönliche 1:1-Nachrichten mit Ref-Link über 14 Tage. Seit Mai in drei Dokumenten, 0 verschickt.
19. **Reddit-Routine 3×/Woche** — Kit ist fertig, Regeln stehen, 0 Posts. Niemals automatisieren.
20. **PR-Pitches** an t3n, Gründerszene, OMR, DLF Nova, MAZ — erst nach Punkt 16.
21. **3 B2B-Gratis-Piloten** aus dem warmen Netzwerk (Schule/Pflege/HR) für ein Testimonial.

**Sonstiges**

22. **Reel-Stimme abnehmen** (`REEL_VO=1` setzen) — falls noch offen; REEL_BAUKASTEN legt ElevenLabs bereits als Default fest. *(SOCIAL_ENGINE, OUTREACH_PLAN)*
23. **Podcast-Submission** an Spotify/Apple/Amazon, sobald der Feed gebaut ist (Accounts nötig). *(BACKLOG #15)*
24. **`/private/tmp` läuft über** (`ENOSPC`) und blockiert temp-lastige Werkzeuge sporadisch — nur Aaron kann aufräumen. *(APP_NEUERFINDUNG_HANDOVER)*

---

Eine Einordnung zum Schluss: Der Befund deckt sich mit Aarons eigener Diagnose. Der auffälligste Bestand sind nicht die 31 überholten Dokumente, sondern die **Doppelungen** — zwei fast identische Effizienz-Konzepte aus derselben Woche, neun TikTok/Reel-Dokumente für einen Kanal, vier Wachstumsstrategien, die alle dieselbe unerledigte Warm-100-Aufgabe enthalten. `STRATEGY.md` §8 hat das schon im Juni benannt: „Drei Strategie-Dokumente, null Ausführung der Mensch-Tasks." Für das Wiki würde ich daraus sechs Seiten machen — Vision/Index, Stimme & Text, Redaktion & Quellen, Betrieb & Kosten, Distribution, Recht & Accounts — und alles andere in ein datiertes Archiv verschieben, aus dem nichts mehr als Arbeitsgrundlage gelesen wird.

Wenn du magst, schreibe ich dir das Inventar in eine Datei — dafür bräuchte ich eine Session mit Schreibrechten, diese hier ist bewusst read-only.