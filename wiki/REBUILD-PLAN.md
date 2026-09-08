# Rebuild-Plan — einmal abreißen, neu bauen

> Stand 2026-09-08, Entwurf des CEO-Agenten. **Nichts hiervon ist umgesetzt.**
> Es gilt: erst Plan, dann Aarons Entscheidungen (unten), dann Schnitt.
> Grundlage: `wiki/00-LAGE.md`, `wiki/inventar/*`, `VISION.md` §1/§13/§17.

## 1. Was NurEine ist (der Kern, den alles härten muss)

Drei Oberflächen, ein System, eine Zustellung:

| Oberfläche | Frage | Ist heute | Im Neubau |
|---|---|---|---|
| **Heute** (eine Story) | Was ist heute passiert — und woher wissen wir das? | trägt 90 % des Traffics; Beleg = Link auf Aggregator | Story + **Beweis-Schicht** (Primärquelle, Zahl im Kontext, Ort mit Genauigkeits-Label, KI-Bild-Kennzeichnung) |
| **Stand der Welt** (Langzeitindex) | Wie ist die Welt? | V1 gebaut, statisches JSON, 4 Besucher/Monat | bleibt fachlich (Präregistrierung v1.2), wird **Einstieg** statt Anhängsel |
| **Karte** | Wo passiert es? | Leaflet, 7 Besucher/Monat, Ortsdaten bei ~⅓ | nur Stories mit verifiziertem Ort; Zeitregler; sonst nichts |
| **Newsletter** | Zustellung | 16 Abos, täglich, 30 % Öffnung | bleibt der Kanal; eine Story + ein Index-Satz |

Alles, was nicht auf eine dieser vier Zeilen einzahlt, ist Kandidat für Kill.

## 2. Kill / Übernehmen / Neu

Legende: **KILL** = weg, Code bleibt nur in Git-Historie · **STEINBRUCH** = Muster/UI
übernehmen, Code nicht 1:1 · **ÜBERNEHMEN** = fachlich weiter gültig, technisch portieren · **NEU** = von null.

### Produkt & Oberfläche

| Bestand | Empfehlung | Begründung |
|---|---|---|
| `/`, `/geschichte/[slug]`, `/archiv`, `/methodik`, `/ueber-uns`, `/impressum`, `/datenschutz`, `/newsletter` | STEINBRUCH (Optik, Stimme) → NEU (Struktur) | Typografie, warmes Papier, Story-Layout sind gut; IA wird auf drei Säulen geschnitten |
| `/stand-der-welt` (V1, D-13…D-18) | ÜBERNEHMEN | frisch, entschieden, präregistriert |
| `/karte` | STEINBRUCH → NEU | Layer/Zeitraffer-Logik erhalten, Datenbasis (Ortsqualität) neu |
| Themen-/Länder-Hubs, `/gute-nachrichten/[thema]`, `/heute`, `/roadmap`, `/manifest`, `/stimme`, `/fuer-unternehmen`, `/preise`, `/app`, `/gute-nachrichten-app`, `/go` | KILL bis auf `/go` (Attribution) | Feature-Museum; 4–6 Besucher/Monat je Seite; B2B ohne Kunden |
| Admin (20 Seiten) | NEU: **eine** Admin-Seite (Story-Freigabe + Betriebsstatus) | 20 Admin-Seiten für einen Bediener |
| Klang-Schicht (D-03), Vorlesen (D-02 eingestellt), Podcast-Feed, Audio-Bucket | KILL | zahlt nicht auf den Kern ein |

### Apps & Kanäle

| Bestand | Empfehlung | Begründung |
|---|---|---|
| `ios/` (Capacitor) **und** `ios-native/` (SwiftUI), 10 Capacitor-Pakete, APNs, Widget | **KILL** beide | nie gelaufen, nie im Store, 99 €/Jahr + Review-Zyklus für 16 Abonnenten; Web-first war Aarons Entscheidung (07/2026); Push später über Web-Push, falls je nötig |
| Reel-Pipeline (`remotion/` 764 MB, reel-regie-Agent 146 $ nominal, TTS, Whisper-Gate, ElevenLabs), TikTok, 10 Bildgenerator-Endpunkte, 9 TikTok/Reel-Docs | **KILL** (Accounts behalten, Code raus) | größter Code- und Agentenblock des Repos; Ergebnis: 3 Posts/Monat, seit 11 Tagen still, 0 messbare Abos |
| Instagram-Automation (publish/generate/story/comments/insights/digest, 7 Cron-Trigger) | **KILL** als Automat; Account bleibt | ~4 Follower bei Messung 06/2026, Insights blind, Entwürfe stapeln sich |
| Threads-Auto-Post | KILL | „laufen lassen, nicht investieren" — 0 Zeilen Ergebnis |
| B2B (`nureine_b2b_clients`, `delivery_log`, Branding, `/fuer-unternehmen`, LinkedIn-Konzept) | KILL | 0 Kunden nach 4 Monaten; STRATEGY selbst nannte es das schwächste Modell |
| Newsletter (Brevo, Worker 04:40, `newsletter.ts` 1.539 Z.) | ÜBERNEHMEN fachlich, NEU technisch | der einzige funktionierende Kanal; Neubau mit Tages-Sperre (idempotent), ein Template statt B2C/B2B-Zweig |
| `/go`-Redirector mit Attribution | ÜBERNEHMEN | einzige funktionierende Messung |

### Pipeline & Agenten

| Bestand | Empfehlung | Begründung |
|---|---|---|
| Nacht-Kette als **Claude-Code-Agenten** (fetch 8 $/Nacht nominal, chefredakteur, redaktion, analyst, verbesserer, reel-regie, veredler, bildregie; `ops/prompts/*`, 811 Z.) | **KILL** als Betriebsform | nicht deterministisch, frisst Max-Kontingent, erzeugt Branches ohne Merger; „Analyst"/„Verbesserer" sind Rollen-Theater |
| `scripts/fetch_stories.py` (2.861 Z.) + 30 weitere Scripts (28 ohne Auslöser) | STEINBRUCH → **NEU: eine Pipeline** | Regeln übernehmen: RSS-Quellen-Ranking, Vorfilter, 3-Stufen-Qualitätsmodell (<55 raus / 55–74 ohne Bild / Perlen bebildert), Dubletten, Bildkompression <150 KB, `storyImageSrc`-Proxy. Form: **ein** Python-Paket, deterministische Schritte + **ein** LLM-Aufruf pro Artikel (DeepSeek, Cent-Beträge) + Beleg-Extraktion (Primärquelle, Zahl, Ort) |
| Beweis-Schicht (`StoryEvidence`, Primärquellen-Modul, Ortsgenauigkeit, KI-Bild-Label) | **NEU** — Phase 1 der Vision | ist der Kern der Differenzierung, existiert noch nicht |
| Langzeitindex (`scripts/index_build.py`, `langzeitindex.yml`, Präregistrierung v1.2) | ÜBERNEHMEN 1:1 | frisch, geprüft, statisch |
| Healthcheck | NEU, klein | prüft Ankommen (Newsletter raus? Story neu?), nicht Produzieren |
| Reporter-Bots-Idee (Primärquellen-Beats: WHO, Weltbank, IRENA) | ÜBERNEHMEN als Konzept | stärkster Moat-Gedanke im Repo; fließt in die Beweis-Schicht |

### Daten & Infrastruktur

| Bestand | Empfehlung | Begründung |
|---|---|---|
| Supabase-Projekt `gbfbhspqwaqvnoxitohd` (geteilt, 3 Namensschemata, 55 Migrationen, 3 Nummern doppelt) | **NEU: eigenes Projekt, Schema von null, ein Präfix, Migrationen ab 0001**; Stories (1.330) per Skript importieren | Schema-Drift ist Dauerzustand; Fremdprodukte teilen das Quota |
| 29 NurEine-Tabellen | NEU: ~8 (stories, evidence, sources, subscribers, sends, places, index_snapshots, runs) | team_board, curation_queue, improvements, resonance, impact_runs, social_*, b2b_*, passkeys, world_metrics, changelog, feedback… entfallen |
| Storage `story_images` | ÜBERNEHMEN mit Regeln R1–R4; Option R2/Cloudflare | Egress war der 4-Tage-Ausfall |
| SvelteKit + TypeScript + Vercel | **ÜBERNEHMEN** (Stack bleibt) | Aaron kennt ihn, UI-Steinbruch passt, Hobby-Plan reicht; ein Framework-Wechsel kauft nichts für den Kern |
| Tailwind v4, Heroicons, Newsreader-Serife, Anthrazit-Dark | ÜBERNEHMEN | Designsystem ist entschieden (07/2026) |
| Mac Mini als Runner | ÜBERNEHMEN mit **einem** Cron-Eintrag (Pipeline) + GitHub Action als Fallback | statt 17 Einträgen |
| Cloudflare Worker (Newsletter-Scheduler) | KILL → Vercel Cron oder Mini | ein Scheduler weniger |
| Docs: 48 Dateien | 6 Wiki-Seiten + `docs/archiv/` (datiert, read-only) | Inventar mit Zuordnung: `wiki/inventar/docs.md` |
| VISION.md (1.986 Z., §6 und §16 durch §17 überholt) | ÜBERNEHMEN, **verdichten** auf: Zielbild · Entscheidungen · Präregistrierung-Verweis | sonst wird das Gedächtnis selbst zum Museum |

## 3. Reihenfolge (nach Freigabe)

| Phase | Inhalt | Dauer (Schätzung) | Risiko |
|---|---|---|---|
| **0 · Einfrieren** | Kein neues Feature im Alt-System. Verbesserer + Reel-Regie + Social-Trigger aus (Crontab). Fetch + Newsletter laufen weiter. | 1 Tag | keins — reversibel |
| **1 · Spezifikation** | Wiki-Seiten: Datenmodell (8 Tabellen), Pipeline-Schritte, IA der drei Säulen, Beweis-Schicht, Newsletter-Vertrag. Von Aaron abgenommen. | 3–5 Tage | Scope-Kriechen — hart filtern |
| **2 · Neubau parallel** | Neues Repo, neues Supabase-Projekt, Pipeline zuerst (Stories fließen), dann Heute-Seite, Newsletter, Stand der Welt (Port), Karte. Alt-System läuft unverändert weiter. | 3–4 Wochen | Übergangs-Doppelbetrieb |
| **3 · Umzug** | Stories importieren, Abonnenten importieren, Redirects für `/geschichte/*` (SEO-Wert gering, aber Links existieren), Domain umhängen, Alt-Crons aus. | 2 Tage | Newsletter-Aussetzer — Cutover morgens nach Versand |
| **4 · Abriss** | Alt-Repo archivieren (read-only), Supabase-Tabellen exportieren + löschen, Accounts kündigen (ElevenLabs), Mini-Crontab auf 1 Eintrag. | 1 Tag | keins |

## 4. Entscheidungen für Aaron (mit Empfehlung)

Groß, irreversibel oder kernändernd. Alles andere entscheide ich.

| # | Entscheidung | Empfehlung | Warum |
|---|---|---|---|
| **1** | **E-01 Fahrplan vs. Vision** | **(b) Vision gilt**, Fahrplan wird archiviert — Aarons CEO-Auftrag („Vision gesetzt") entscheidet das faktisch; ich bitte nur um Bestätigung | Der Fahrplan-Test (200 Nutzer in 30 Tagen) wurde nie gefahren und wird es im Alt-System nicht mehr |
| **2** | **iOS-Apps killen** (beide, inkl. Capacitor-Abhängigkeiten) | **Ja** | nie gelaufen, kostet Account + Review-Zyklus; Web-first war schon Aarons Entscheidung |
| **3** | **Social-Automation killen** (Reels/TikTok/IG/Threads-Pipeline, Remotion, TTS, Agent reel-regie) — Accounts bleiben | **Ja** | größter Block, kleinstes Ergebnis; Wachstum „nur soweit der Kern es braucht" |
| **4** | **B2B killen** (Tabellen, Seiten, Konzepte) | **Ja** | 0 Kunden; Modell war schon im Juni als schwächstes markiert |
| **5** | **Claude-Code-Agenten als Betriebsform killen**; Pipeline = deterministischer Code + DeepSeek-Aufruf | **Ja** | 8 $/Nacht nominal für 1 Story; nicht reproduzierbar; erzeugt Branch-Müll |
| **6** | **Stack: SvelteKit + Vercel bleiben, neues Repo, eigenes Supabase-Projekt** | **Ja** — Alternative wäre nur „alles in-place" (schneller, aber der Drift bleibt) | Kein Framework-Wechsel; die Schulden sitzen in Schema, Pipeline und Doc-Wildwuchs, nicht im Framework |
| **7** | **E-05 Sperrklausel** (fallender Index wird Titelmeldung, Methodik 12 Monate eingefroren) | **Ja, eingehen** — durch D-12 (Zustandsbild) ist sie billig geworden | Ohne sie ist die Methodikseite ein Versprechen ohne Preis |
| **8** | **Ein Distributionskanal, den Aaron persönlich bedient** — Warm-100 / Reddit / LinkedIn-Person | **Warm-100 zuerst** (14 Tage, 0 €) | Vier Strategie-Docs enthielten es, 0 verschickt; ohne einen Menschen-Kanal misst der Neubau nichts |

Offen, aber **nicht** blockierend (entscheide ich im Lauf von Phase 1, melde es):
Bildmodell (Seedream bleibt), Storage-Ort (Supabase vs. R2), Newsletter-Scheduler
(Vercel Cron), Name der Beweis-Felder, Karten-Datenbasis.

## 5. Was ich bewusst NICHT vorschlage

- Kein Framework-Wechsel, kein Self-Hosting von Postgres (83 MB DB — `ARCHITEKTUR_MAC_MINI.md` hatte recht).
- Kein neues Social-Format, kein Podcast, keine App, kein B2B — bis der Kern Leser hat.
- Keine „Analyst"/„Verbesserer"-Agenten mehr. Qualität wird im Code geprüft, nicht von einer Rolle behauptet.
