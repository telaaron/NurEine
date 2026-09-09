# Spec Wachstum — Distribution, Social, Marke (nur soweit der Kern es braucht)

> Stand 2026-09-09. Fachteil „Wachstum" der Phase-1-Spezifikation (REBUILD-PLAN §3).
> Rahmen: D-12 (wie die Welt IST), D-22 (Social killen, TikTok-Fundament übernehmen),
> D-23 (B2B weg), D-27 (Warm-100 zuerst). Ist-Zahlen aus `wiki/00-LAGE.md` (08.09.):
> 16 bestätigte Abos, ~40 echte Besucher/Woche, 0 Google-Klicks, Öffnung ~30 % fallend.
> Benchmark für jede Reichweiten-Erwartung: **0,03–0,05 % View→Abo** (`docs/OUTREACH_PLAN.md`).
> Jede Zahl trägt Quelle; „unsicher" heißt: nicht selbst gemessen.

## 1. Warum jemand bleibt

1. Weil er morgens in zwei Minuten weiß, was gestern in der Welt passiert ist, und woher wir es wissen (Story + Beleg-Schicht, REBUILD-PLAN §1).
2. Weil die eine Story nicht allein steht, sondern an einer Langzeitlinie hängt („der 26. Bundesstaat", STIMME §1; Index-Satz im Newsletter).
3. Weil nichts inszeniert ist: keine erfundene Reaktion, kein Superlativ ohne Zahl (STIMME §8), und die Quelle steht daneben, nicht dahinter.
4. Weil es eine Quelle ist und nicht zehn: kein Feed, keine Wahl, keine Schuld beim Nichtlesen.
5. Weil er selbst „krass" denkt, statt es gesagt zu bekommen (REEL_TEXT_REGELN §2, gilt für alle Kanäle).

**Nordstern des Neubaus: Ritual-Leser** = bestätigte Abonnenten mit ≥3 geöffneten Newslettern in den letzten 7 Tagen. Eine Zahl, wöchentlich, aus `sends.opened_at`.

| Metrik | Definition | Messung | Ist (unsicher) |
|---|---|---|---|
| **Ritual-Leser** (Nordstern) | Abos mit ≥3 Öffnungen / 7 Tage | Brevo-Webhook `opened`/`unique_opened` → `sends.opened_at` (`api/webhooks/brevo`). **`proxy_open` (Apple MPP) getrennt zählen**, heute wird es als Öffnung gewertet (Z. 42) | Baseline per Abfrage; Größenordnung 4–8 Tagesöffnungen bei 16 Abos |
| Hilfsmetrik A: **bestätigte Neu-Abos / Woche nach Quelle** | DOI bestätigt, `source` aus `/go?src=` | `/go` loggt `go_click` in `nureine_events`; **Kette bricht heute**: `/newsletter` reicht `src`/`ref` nicht an `/api/subscribe` weiter (nur `ref`-Body-Feld, kein URL-Lesen im Page-Code, grep 09.09.) → im Neubau `subscribers.source` Pflichtfeld | 3 Zugänge seit 25.06. (LAGE) |
| Hilfsmetrik B: **Klickquote Mail → Story** | Klicks `/r` ÷ Sends | `nureine_newsletter_clicks` (Migration 00048), UTM `newsletter/email/daily` | nicht ausgewertet |

Web-Rückkehr ohne Cookie ist nicht sauber messbar (Vercel zählt Tagesbesucher, keine Wiederkehr). Kein Tracking-Cookie dafür einführen; die Rückkehr wird über den Newsletter gemessen. Reichweiten-Zahlen (Views, Follower) sind keine Metrik des Neubaus.

## 2. Newsletter als Kanal

**Inhaltsvertrag (pro Ausgabe, jeden Tag, alle Empfänger dieselbe):**

| Element | Regel | Quelle |
|---|---|---|
| Eine Story | Titel, Teaser (`subtitle`, nicht `share_hook`, sonst Echo zum Betreff), Bild über `/img`-Proxy, ein Link auf die Story | `buildB2CHtml` Z. 285–292 |
| Ein Index-Satz | Ein Satz aus dem Langzeitindex, Richtung offen (D-12), mit Vintage-Jahr; wechselt wöchentlich, nicht täglich | VISION §17, Präregistrierung v1.2 |
| Ein Beleg | Primärquelle als Klartext-Name + Link, Zahl im Kontext, Ortsgenauigkeits-Label wenn Ort | Beweis-Schicht (REBUILD-PLAN §2, NEU) |
| Fußzeile | „KI-recherchiert, Quellen offen, von Menschen verantwortet" (Art. 50 Abs. 4 KI-VO, Text-Ausnahme durch redaktionelle Verantwortung), Abmelden, Impressum | `buildB2CHtml` Z. 396–401 |

**Betreff:** ein Satz, ≤70 Zeichen, kein Punkt, Zahl oder Detail trägt, kein „Stell dir vor" (32,6 % vs. 43,7 % Öffnung, STIMME §9.3). Quelle: ein eigenes Feld `subject`, das die Pipeline schreibt; kein Fallback über 70 Zeichen mehr (heute kappt `dailySubject` bei 67 + „…").
**Versandzeit:** heute 04:40 UTC (Worker) = 06:40 MESZ / 05:40 MEZ, driftet mit der Zeitumstellung. Neubau: **06:30 Europe/Berlin**, ein Vercel-Cron (REBUILD-PLAN: Worker weg), Sommer/Winter als zwei UTC-Einträge mit Tages-Sperre.
**Tages-Sperre:** `sends` hat Unique (subscriber_id, send_date); zweiter Lauf am selben Tag sendet 0 (Vorfall 2026-09-07: 15 von 16 leer, `newsletter.ts` Z. 1067–1076).
**DOI:** unverändert dreistufig: `/api/subscribe` (confirmed=false, Token, Brevo-Mail) → `/api/confirm` (confirmed=true, Willkommensmail) → soft-unsubscribe (`confirmed=false`, Token+E-Mail in jedem Mail-Fuß). Neu: `source` und `referred_by` werden beim Subscribe aus der URL übernommen; unbestätigte Adressen nach 14 Tagen löschen (das Bestätigungsmail verspricht „wird automatisch gelöscht" ohne Frist, `subscribe/+server.ts` Z. 117; ein Lösch-Job ist nicht auffindbar, grep in `scripts/` und `api/cron/` 0 Treffer).
**Abmeldung:** ein Klick, keine Rückfrage, List-Unsubscribe-Header setzen (heute nicht gesetzt, grep `List-Unsubscribe` 0 Treffer).

**Steinbruch aus `src/lib/server/newsletter.ts` (1.539 Z.):**

| Funktion | Übernehmen | Begründung |
|---|---|---|
| `sendBrevoEmail` (Z. 583) | ja | Brevo-Call inkl. Reply-To, bewährt |
| `dailySubject` (Z. 122) | Muster (70-Regel), Fallback-Kette weg | Kuration-Queue entfällt |
| `trackedStoryUrl` + Route `/r` (Z. 195) | ja, ohne `category_scores` | Klickzähler + UTM bleiben; Personalisierung entfällt |
| `fetchRecentSendsByStory`/`markStorySent`/`logSend` (Z. 796–940) | als Tages-Sperre neu | Dedup-Idee richtig, Ausführung nicht atomar |
| `selectApprovedOrBestHero` (Z. 623) | Logik „eine für alle" | Quelle wird die neue Pipeline (Story des Tages), nicht `curation_queue` |
| `buildB2CHtml` (Z. 252) | Optik (Papier, Dark-Mode-Pixel, Fuß) | Template auf Story + Index-Satz + Beleg umgebaut |
| Gmail-Dark-Mode-Pixel `PNG_*` (Z. 89–95) | ja | gelöstes Problem |
| **Weg:** `buildB2BHtml`, `buildWebhookPayload`, `fetchActiveB2BClients`, `logDelivery` (D-23) · `pickForSubscriber`, `selectRankedStories`, `fetchConfirmedFreeSubscribers`-Tiers, Familienblock (`kid_*`) · `sendHighlightEmailIfWorthy`, `renderHighlightHtml`, `sendCurationReminderIfPending` · `sendWorldMetricsNewsletter`/`renderWorldMetricsHtml` (Monats-Digest; der Index-Satz ersetzt ihn) · Route `/api/cron/world-newsletter`, `/api/cron/highlight` | | |

## 3. TikTok-Erstellungsfundament — Übernahme-Inventar

Gemessen im Hauptordner `remotion/` am 09.09.: **764 MB, 10.414 Dateien**. Davon:

| Anteil | Größe | Dateien | Was | Git |
|---|---|---|---|---|
| `node_modules/` | 463 MB | 8.514 | Remotion 4.0.290, React 19, d3-geo, world-atlas | ignoriert |
| `out/` | 241 MB | 33 | 26 Render-MP4 (14–18 MB je), Testreels, `asset-sheet.png` | ignoriert |
| `public/` | 35 MB | 401 | davon `vo/` 15 MB / 339 VO-Dateien (ignoriert), `character/` 7,6 MB, `audio/` 5,1 MB, `reel-assets/` 4,4 MB (gesperrt), Fonts, Texturen | teils |
| `.venv-tts/` | 23 MB | 1.428 | nur `edge-tts` (MacBook). **Whisper ist hier nicht installiert**; auf dem Mini laut `ops/RUNBOOK.md` Z. 387 in derselben venv erwartet — unsicher, nie verifiziert | ignoriert |
| **Getrackter Kern** | **~20 MB** | **97** | Code, Pläne, Assets (Worktree-Messung) | ja |

Der eigentliche Code ist klein: **~3.900 Zeilen** getrackt (render.mjs 1.138 · `src/` 1.971 · `scripts/` 806 · Pläne 9 × ~90) plus `tiktok-caption.ts` 322 im SvelteKit-Repo und ~665 Zeilen Regeln (`REEL_BAUKASTEN.md` 380, `REEL_TEXT_REGELN.md` 136, `reel-regie.md` 149).

| Datei/Modul | Zweck | Zeilen | Abhängigkeiten | Urteil | Begründung |
|---|---|---|---|---|---|
| `render.mjs` — `synthSegment` + Gate-Aufruf (Z. 446–555) | TTS pro Segment, **Whisper-Gate**: Abweichung = Exit 3 = Render-Abbruch; Gate kaputt (Exit 2) = ebenfalls Abbruch, `--allow-unverified-vo` übersteuert; stumme Szene = Abbruch (`--allow-silent-scene`) | ~110 | Python-Venv, Whisper, ffmpeg | **ÜBERNEHMEN** | Das ist das Fundament: ungeprüften Ton gibt es nicht (Vorfall „Trakum"/„Proofers", 2026-07-26) |
| `render.mjs` — `synthWholeTake` (Z. 627–717) | Eine Aufnahme für alle Szenen, Wort-Zuordnung über Wortlaut, kein Atmer-Doppler | ~90 | ElevenLabs Wort-Timestamps | ÜBERNEHMEN | gelöstes Problem (2026-08-22) |
| `render.mjs` — `germanizeForTts`, `prepareTts`, `detectEnglishWords`, `mergeNumberWords` (Z. 246–430) | Ziffern → deutsche Zahlwörter, Abkürzungen, Englisch-Wächter, Lexikon | ~180 | `tts-lexikon.json` | ÜBERNEHMEN | Captions zeigen Ziffern, Stimme spricht deutsch; ohne das liest die Stimme „97.000" englisch |
| `render.mjs` — SEO-Dreifach-Check + Kohärenz-Check (Z. 934–1000) | Keyword in voText+Overlay+Caption; Zahl im Bild = Zahl im Ton, sonst Hard-Fail | ~70 | — | ÜBERNEHMEN | „belegt" verträgt keine gerundete Zahl (Panel 2026-07-17) |
| `render.mjs` — `buildScenesFromPlan`, Loop-Schwanz, Badge (Z. 718–772, 918–932) | Plan-JSON → Szenen mit VO-Timing, 14-Frame-Loop-Naht | ~80 | Remotion | ÜBERNEHMEN | Regie-Modus ist der einzige genutzte Pfad |
| `render.mjs` — `webFassung` (Z. 794) | ffmpeg H.264 main/4.0, crf 24, faststart | 19 | ffmpeg | ÜBERNEHMEN | 15 MB → Web-Größe |
| `render.mjs` — `generateScript`/`fallbackScript`/`buildScenes`/`VOICE_BLOCK` (Z. 84–245, 560–626) | Auto-Modus ohne Plan (DeepSeek schreibt Skript) | ~230 | DeepSeek | **weg** | Der Agent „Reel" liefert den Plan; zweiter Redakteur widerspricht STIMME §11 |
| `render.mjs` — `uploadToSupabase`, `queueReel`, `persistTikTokMeta` (Z. 813–891) | Upload `story_reels`, IG-Draft, Story-Felder | ~80 | Supabase REST | STEINBRUCH → neu | IG-Queue entfällt (D-22); Ablage im neuen Projekt, MP4 nur als Web-Fassung |
| `render.mjs` — IG-Zweitfassung mit Musikbett (Z. 1100–1125) | zweiter Render mit `uplift-*` | ~25 | — | weg | nur für Auto-Post gebaut; Master bleibt musikfrei (Aaron 2026-08-01) |
| `src/ReelTikTok.tsx` | Komposition 1080×1920: Number (Cold Open, snap), Hook (Snapback), Beat (Bild randlos, KI-Label), **Proof = Beleg-Szene** (Stempel + Sound + Shake, `snapshot`-Faksimile: outlet/year/title/quote, Punkt-Spirale „Fortschritt Nr. N"), Map, End (Loop, „Illustration & Stimme: KI · von Menschen geprüft"), Safe-Zones 300/440/200, Badge, Soft-CTA, Ducking | 995 | Remotion, Fonts, `audio/fx` | **ÜBERNEHMEN** (minus Character-Import) | Beleg-Szene ist der USP im Bild; Safe-Zones sind am iPhone ausgemessen (2026-08-26) |
| `src/ReelDaily.tsx` | nur noch Typen (`DailyScene`, `SceneVo`, `CaptionWord`) | 100 | — | ÜBERNEHMEN, umbenennen `types.ts` | Datenmodell des Plans |
| `src/brand.ts`, `src/Root.tsx`, `remotion.config.ts`, `tsconfig.json` | Farben, Fonts, eine Composition | 71 | — | ÜBERNEHMEN | Marken-DNA identisch zu Web |
| `src/scenes/paper-textures.tsx`, `src/components/brand-graphics.tsx`, `src/icons/index.tsx`, `src/backgrounds/index.tsx`, `src/assets-manifest.ts` | Papier, Stempel-Grafik, Icons, prozedurale Hintergründe | 643 | Texturen 8 JPG | STEINBRUCH | nur, was ReelTikTok wirklich importiert; Rest raus |
| `src/character/*`, `public/character/` (7,6 MB), `CHARACTER.md`, `scripts/scan-poses.mjs` | 3D-Moderator:in | 206 | 11 PNG | **weg** | auf TikTok abgeschaltet: stärkster „KI-Slop"-Marker (Panel 2026-07-11) |
| Map-Szene (in ReelTikTok Z. 505–556) + `d3-geo`, `topojson-client`, `world-atlas` | Karten-Zoom auf Story-Ort | ~50 | 3 npm-Pakete | ÜBERNEHMEN, **nur bei verifiziertem Ort** | echte Geografie = Anti-Slop; passt zur Säule Karte; Ort nur aus Beweis-Schicht |
| `scripts/tts.py` | ElevenLabs `eleven_v3`, Stimme **Luca** `mmAbrxFQ9xjByXyBpqrK`, `stability 0.65`, `similarity 0.75`, `speed ≤1.15`, Tag `[matter-of-fact]` automatisch, `REEL_TEMPO 1.28` per ffmpeg `atempo`, Satzzeichen-Marker für Captions; edge-tts nur Testlauf | 306 | ElevenLabs-Key, ffmpeg, edge-tts (optional) | **ÜBERNEHMEN** | Parameter sind gemessen (0.45 verliert Wörter, 0.30 halluziniert, 1.2 verschluckt Silben) |
| `scripts/verify_vo.py` | Whisper `small` transkribiert, Vergleich normalisiert (Zahlwörter ↔ Ziffern, Toleranzliste, Füllwörter), Gegenprobe `medium`; Exit 0/2/3 | 315 | `openai-whisper`, Modell-Cache ~0,5–1,5 GB (unsicher) | **ÜBERNEHMEN** | das Gate |
| `scripts/safezone_check.py` | legt TikTok-UI-Zonen (270/141/393 px) über Standbilder | 70 | ffmpeg | ÜBERNEHMEN | einziges Werkzeug, das Verdeckung vor dem Posten zeigt |
| `scripts/gen-flux-backgrounds.mjs`, `public/backgrounds/flux/` | 4 FLUX-Hintergründe | 74 | fal.ai | weg | einmalig genutzt; Bild kommt pro Story aus der Pipeline |
| `tts-lexikon.json` | Aussprache-Korrekturen (Komposita mit Bindestrich) | 45 | — | ÜBERNEHMEN | wächst nur durch gehörte Fehler |
| `public/fonts/` (Inter, SpaceGrotesk-Bold, Newsreader-Italic), `public/audio/fx/` (click/ping/settle/whoosh), Texturen | Marke, Sound-Design (ein Ereignis = ein Ton, 0.10–0.35) | — | ~3–5 MB (Schätzung) | ÜBERNEHMEN | Fonts gebündelt, kein CDN |
| `public/audio/warm-*/uplift-*/calm/hope`, `public/reel-assets/_gesperrt-*` | Musikbetten, Vorratsbilder | — | 5+4 MB | weg | Musik kommt aus TikToks CML beim Posten; Vorratsbilder erzeugen eine „Hauptdarstellerin" (Aaron 2026-08-28) |
| `plans/*.json` (9) | Referenzpläne | ~820 | — | 2 behalten als Fixtures (`hepatitis`, `mammutbaeume`) | Schema-Beispiele, Rest ist Story-spezifisch |
| `src/lib/server/social/tiktok-caption.ts` | regelbasierte Caption + `buildSoundKeywords` (englisch, für CML-Suche) | 322 | — | STEINBRUCH | Quellenzeile „Quelle: X — von uns nachgeprüft." bleibt wörtlich (STIMME §9.8) |
| `docs/REEL_TEXT_REGELN.md`, `REEL_BAUKASTEN.md` (Abschnitte Stimme, Szenen, TikTok-Master, Sicht), `ops/prompts/reel-regie.md` (Schritt C) | Fünf-Block-Struktur, 75–80 Wörter ≈ 30 s, Loop-Satz mit Doppelpunkt, Overpromise-Audit, Sicht-Checks | 665 | — | ÜBERNEHMEN als **eine** Wiki-Seite | Textregeln sind das eigentliche Fundament, nicht der Code |
| `ops/prompts/reel-regie.md` Schritt A (Insights-Analyse), 5b (IG-Post), Test-Rotation W1–W4 | Analyse über `social-insights`, Auto-Post | — | IG-API | weg | Insights waren blind (LAGE), Rotation ist abgelaufen |
| `/api/reel-data`, `/api/reel-frame`, `/api/cron/social-reel-select`, `render-reel.yml`, `scripts/render_reel.py`, `ops/run/reel-watchdog.sh` | Altpfade um den Render herum | ~500 | — | weg | Auslöser wird der Agent „Reel", nicht ein Cron-Geflecht |

**Kern-Schätzung:** ~2.400 Zeilen Code (render.mjs ~600 nach Kürzung, ReelTikTok ~900, Typen/Brand ~200, tts.py ~250, verify_vo.py 315, safezone 70, Lexikon) + 665 Zeilen Regeln + ~5 MB Assets. Gegenüber 764 MB sind das **< 1 %**; 97 % des Ordners sind `node_modules`, Renders und die Venv.

**Das kleine Modul im neuen Repo:**

```
reel/
  package.json          remotion, react, d3-geo (3 Pakete), sonst nichts
  render.mjs            Plan → VO (ElevenLabs) → Gate (Whisper) → Remotion → ffmpeg-Web-Fassung
  src/ReelTikTok.tsx    Composition · src/types.ts · src/brand.ts · src/graphics/*
  tts/tts.py  tts/verify_vo.py  tts/lexikon.json  tts/requirements.txt (edge-tts, openai-whisper)
  tools/safezone_check.py
  public/fonts  public/fx  public/textures
  fixtures/hepatitis.json
```

Ein Befehl: `reel render <story-id> [--plan plan.json] → out/<slug>.mp4 + out/<slug>-web.mp4 + out/<slug>.caption.txt`. Ohne `--plan` holt der Befehl die Story aus dem neuen Projekt (API mit Beweis-Schicht) und startet den Agenten „Reel" für den Plan; mit `--plan` läuft alles deterministisch ohne LLM. Kein Upload, kein Queue-Flag, kein IG-Zweig: das Ergebnis liegt in `out/`, und `/admin` (die eine Admin-Seite) zeigt MP4 + Caption + Sound-Keywords zum manuellen Posten.

**Agent „Reel" vs. Code (D-24: Vorarbeit im Code, Urteil im Agenten):**

| Code (deterministisch) | Agent (Urteil) |
|---|---|
| Story-Kandidaten (Impact ≥55, Bild vorhanden, nicht verbraucht, Ort verifiziert oder null) | Story wählen nach Stop-Power; „lieber leer als schwach" |
| Zahlwörter, Englisch-Wächter, SEO-Dreifach, Kohärenz, Whisper-Gate, Safe-Zones, Loop-Naht, Kennzeichnung | Fünf-Block-Text (75–80 Wörter), `snapshot` **aus dieser Story** (Vorfall 05.09.: fremder Beleg), Snapback, Overpromise-Audit |
| Render, Web-Fassung, Ablage, Kostenzeile pro Lauf | Sicht: Frame 0, letzter Frame, Stempel, Mute-Test, Anatomie-Check des Bilds |
| Abbruch bei jedem Gate-Fehler, kein „OK" ohne Datei (Vorfall 01./02.08.) | Übergabe an Aaron: MP4, Caption, Sound-Keywords, AI-Label-Hinweis |

Kostenlatte: der Alt-Agent lag bei 146 $ nominal gesamt (REBUILD-PLAN); Zielwert < 1 $ Claude + ~0,2 $ ElevenLabs pro Video (ElevenLabs-Anteil unsicher, Kontingent 47,5 % verbraucht Stand 06/2026, `wiki/inventar/docs.md`).

## 4. Neuaufbau Social — nach dem Kern (Phase 2, Ende)

| Reihenfolge | Kanal | Erstellung | Posten | Kill-Kriterium nach 8 Wochen |
|---|---|---|---|---|
| 0 | Newsletter | Pipeline | automatisch | ist der Kern, kein Kill |
| 1 | Warm-100 | Aaron | Aaron | siehe §5 |
| 2 | TikTok (3 Videos/Woche = 24) | Agent „Reel" + Code | **manuell** über `/admin` (kein Anbieter-Account, TIKTOK_PLAN §8c) | < 5 bestätigte Abos mit `src=tiktok` **und** mediane Completion < 30 % (Aaron liest TikTok-Studio, trägt wöchentlich ein) → pausieren |
| 3 | Instagram Reels | dasselbe MP4 | manuell, Mo/Mi/Fr | < 3 bestätigte Abos mit `src=ig` → nur noch Profil als Visitenkarte |
| — | Reddit | Aaron von Hand, nie automatisiert (STRATEGY §5) | erst wenn Kern + Warm-100 durch sind | — |

Was automatisiert wird: **Erstellung ja** (Plan, VO, Gate, Render, Caption). **Posten nein**, bis ein auditierter Anbieter gewählt ist und TikTok-Kill nicht griff. Keine Insights-Bots, keine Kommentar-Bots, kein Digest, keine Threads (D-22).

**Kennzeichnungspflichten (kein Rechtsrat; einmal prüfen lassen, siehe Human-TODO):**

| Pflicht | Grundlage | Umsetzung im Neubau |
|---|---|---|
| KI-Bild sichtbar kennzeichnen | EU-KI-VO Art. 50 Abs. 4 (Deepfake-Nähe bei fotorealistischen Orten/Ereignissen), anwendbar seit 02.08.2026 | Overlay „Illustration: KI · NurEine" auf jeder Bild-Szene (ReelTikTok Z. 466/474), auf der Website neben dem Bild (Beweis-Schicht) |
| KI-Stimme kennzeichnen | Art. 50 Abs. 4 (synthetisches Audio), Plattformregeln | Endcard „Illustration & Stimme: KI · von Menschen geprüft" (Z. 784) + **TikTok „AI-generated content"-Schalter an**, IG „Made with AI" |
| KI-Text | Art. 50 Abs. 4 UAbs. 2, Ausnahme bei redaktioneller Verantwortung | Newsletter-/Story-Fuß „KI-recherchiert, von Menschen verantwortet" + `/methodik` |
| Impressum in Social-Profilen | § 5 DDG (seit 14.05.2024, ersetzt TMG; alte Docs sagen TMG) + § 18 MStV | Website-Feld jedes Profils = `nureine.de/impressum`; Betreiber Aaron Technologies OÜ, Tallinn (Impressum Z. 19–28) |
| Musik | nur TikTok Commercial Music Library beim Posten; nie im Master | Sound-Keywords aus `tiktok-caption.ts` |

## 5. Warm-100 operationalisiert (D-27)

**Zielgruppe:** Menschen, die Aaron persönlich kennen und die morgens Nachrichten lesen: Musik-Szene, Gemeinde, Schule, Familie, Studienkreis (STRATEGY §7). Nicht: Gründer-Netzwerk, LinkedIn-Kontakte, Presse. Je Person eine eigene erste Zeile; dieselbe Nachricht an 20 Leute fällt auf (PITCH-TRAINING §1).

**Nachrichtenvorlage** (Ich ist hier erlaubt, STIMME §4; keine Gedankenstriche; kein „Startup/Plattform/KI" im ersten Satz; keine „wo die Welt besser wird"-Formel, D-12):

> Hey [Name], ich hab in den letzten Monaten etwas gebaut, das ich dir zeigen will: NurEine. Jeden Morgen eine Nachricht darüber, wie die Welt gerade wirklich ist, mit der Quelle direkt daneben, zwei Minuten. Heute ging es um [ein Halbsatz aus der Story des Tages]. Wenn du magst, trag dich hier ein und sag mir nach einer Woche ehrlich, ob es was taugt: [Link]

Follow-up nach 5 Tagen, ohne Vorwurf, mit der Story des Tages, ein Satz + Link. Nach Eintrag + 3 Tage: „War was Gutes dabei?" Erst bei begeisterter Antwort die Frage nach einer weiteren Person.

**Ref-Link-Schema über `/go` (ÜBERNEHMEN, REBUILD-PLAN):**
`nureine.de/go?src=warm&asset=<wa|ig|mail|persoenlich>&v=<w1|w2>&to=newsletter`
`/go` loggt `go_click` (`src/routes/go/+server.ts`), leitet auf `/newsletter?src=warm&asset=…`; die Anmeldeseite reicht `src`/`asset` an `/api/subscribe` weiter, `subscribers.source` = `warm`. Bestätigung ist das Ereignis, das zählt. Kein individueller Code pro Person (Overhead, Datenschutz); die Tracking-Tabelle macht die Zuordnung.

**Tracking-Tabelle** (Obsidian oder Sheet, Aaron führt sie):

| # | Name/Kürzel | Kreis | Kanal | Gesendet | Variante | Antwort | Bestätigt | Follow-up | Feedback (1 Satz) |
|---|---|---|---|---|---|---|---|---|---|

**Erfolgsmaß:** bestätigte Abos mit `source=warm` nach 21 Tagen (14 Tage senden + 7 Tage Nachlauf). Schwellen (Annahme, nicht gemessen; STRATEGYs „>50 %" ist unbelegt): **≥20 = Produkt trägt bei Nahestehenden**, 10–19 = Text/Onboarding nachschärfen, < 10 = Produktsignal, kein Kanalproblem. Zweites Maß: wie viele davon nach 4 Wochen Ritual-Leser sind (§1).

**14-Tage-Plan:** Tag 0 Liste mit 100 Namen in drei Kreisen (eng / bekannt / lose) · Tag 1–14 je 7 Nachrichten, morgens nach dem Newsletter (Story ist dann frisch) · Tag 5, 10, 15 Follow-ups · Tag 7 und 14 Zwischenstand (Antworten, Bestätigungen, häufigstes Feedback-Wort) · Tag 21 Auswertung gegen die Schwellen.

**Was Aaron dafür braucht:** die 100 Namen (niemand sonst kann das), 20–30 Minuten täglich, `/go`→`source`-Kette funktionsfähig (Neubau oder Mini-Fix im Alt-System: `?src` auf `/newsletter` lesen und an `/api/subscribe` geben — 10 Zeilen, Entscheidung CEO ob vor dem Umzug), eine Story des Tages, die er selbst gut findet.

## 6. SEO/GEO-Minimum im Neubau (Pflicht, kein Projekt)

| Baustein | Ist (Alt-Repo) | Neubau |
|---|---|---|
| Title/Description zentral | `+layout.svelte` `pathDescriptions` + `seoTitle` (Z. 51–124); Titel „Ehrlicher Fortschritt, täglich" | Muster übernehmen; Texte nach §7 |
| JSON-LD | `NewsMediaOrganization` + `WebSite` (Layout Z. 180–230), `NewsArticle` je Story, `Dataset` auf `/stand-der-welt` | alle vier behalten; `Dataset` mit `version`, `temporalCoverage` 2005–2023, `citation` je Indikator; `NewsArticle` bekommt `citation` = Primärquelle (Beweis-Schicht) |
| Sitemap | `sitemap.xml` (Story-Loop) | ohne 1.000er-Deckel und ohne Anzeige-Filter (Vorfall 2026-08-24: 412 statt 1.260 URLs) |
| `llms.txt` | vorhanden, nennt „native iOS-App" und „Good-News-Plattform" | umschreiben: kein App-Satz (D-21), Formel aus §7, Betreiber OÜ Tallinn bleibt |
| IndexNow | `/api/cron/indexnow` + Mini-Trigger | in die Pipeline: nach Veröffentlichung pingen, kein eigener Cron |
| Wikidata Q141203108 | `sameAs` in Layout Z. 217 und `/ueber-uns` | behalten; Item-Beschreibung nach D-12 anpassen (Human-TODO) |
| Entity-Prosa „NurEine ist …" | `/ueber-uns`, `llms.txt`, `disambiguatingDescription` | ein Satz, an allen drei Stellen identisch: „NurEine ist ein deutschsprachiger Nachrichtendienst (gegründet 2026, Betreiber Aaron Technologies OÜ, Tallinn), der jeden Tag eine belegte Nachricht darüber liefert, wie die Welt ist, und sie in einen Langzeitindex einordnet. Nicht zu verwechseln mit dem Film „Nur eine Frau" oder der Chemikalie Neurin." |
| Redirects | — | `/geschichte/<slug>` → neue URL, 301, Phase 3 |

**E-08 (SEO-Agent):** Empfehlung **nur vorschlagen**: wöchentlich eine Liste (nicht indexierte URLs mit Antrag, eine bestehende Seite zum Ausbau, externe Erwähnungen). Kein Inhalt. Begründung: 1.153 „gefunden, nicht indexiert" (VISION E-08); jede neue Seite vergrößert den Stapel. **E-09 (Keyword-Tool):** **nein** bei 0 Klicks/28 Tage; GSC + Google Trends reichen. Wiedervorlage bei ≥100 Klicks/Monat.

## 7. Marke: Name und Claim nach D-12

Der Name bleibt (Wikidata, Domain, 1.330 URLs). Die heutigen Claims widersprechen D-12: „Ehrlicher Fortschritt, täglich" (Title), „Eine Geschichte am Tag. Mehr nicht." (JSON-LD `slogan`, DOI-Mails), „Gute Nachrichten. Jeden Tag exakt eine." (`SUBJECT_DAILY`), TikTok-Endcard „täglich eine gute Nachricht" (ReelTikTok Z. 783), Reel-Regie-Prompt „ehrlicher Fortschritt". Alle nennen die Richtung.

| # | Claim | Zeichen | Für | Gegen |
|---|---|---|---|---|
| A | **Wie die Welt ist. Jeden Tag ein Beleg.** | 38 | D-12 wörtlich, „Beleg" trägt den USP, funktioniert als Title-Suffix, Endcard, Mail-Kopf | zwei Sätze, in Bios etwas lang |
| B | Eine Quelle für den Zustand der Welt. | 37 | STIMME §1 (Vertrauens-Metapher) | „Zustand" klingt nach Behörde |
| C | Nur eine Verbindung zur echten Welt. | 36 | VISION §1 Wortlaut, spielt mit dem Namen | sagt nichts über Beleg oder Takt |

**Empfehlung A.** Aus `ROSLING_POSITIONIERUNG.md` bleibt: die Zwei-Gedanken-Regel „bad AND better" (verhindert den Schönfärber-Vorwurf, deckt sich mit D-12), Rosling als Kronzeuge mit Quelle, nie als Partner; die Prosa „Die meisten Menschen sehen die Welt düsterer, als sie ist" für `/methodik`, nicht als Claim. Weg: „Wir korrigieren es" als Kernbotschaft (behauptet Richtung), Stufe 2 Weltbild-Test (Feature, nicht Kern), Stufe 3 B2B-Argument (D-23).

## 8. Was NICHT gemacht wird

Reddit-Automatisierung (STRATEGY §5: niemals) · Paid Ads · Podcast/Audio-Feed (D-02/D-03 KILL) · Threads · LinkedIn-Firmenseite und LinkedIn-Person · B2B-Outreach, Piloten, `/fuer-unternehmen` (D-23) · PR-Welle „20-Jähriger aus Teltow" (Text veraltet, Kern steht noch nicht) · Newsletter-Swaps (nichts zu tauschen unter 500) · Referral-Programm mit Belohnung (`referral_code` bleibt nur als Feld) · Weltbild-Test · App/ASO/App-Store-URL in `/go` (D-21) · Comment-to-DM-Tool · TikTok-Auto-Post-Anbieter (bis Kill-Kriterium bestanden) · neue Hub-/Themenseiten (VISION §15.6) · Keyword-Tool (E-09) · Follower- oder View-Ziele · Google Business Profile (NAP-Konflikt: Betreiber Tallinn, Redaktion Teltow; erst klären).

## 9. Entscheidungen für den CEO

| # | Frage | Empfehlung |
|---|---|---|
| W-1 | Nordstern = Ritual-Leser (≥3 Öffnungen/7 Tage), `proxy_open` getrennt | ja |
| W-2 | Versandzeit 06:30 Europe/Berlin per Vercel-Cron, Tages-Sperre als DB-Unique | ja |
| W-3 | `/go`→`source`-Kette schon im Alt-System fixen (10 Zeilen), damit Warm-100 vor dem Umzug messbar ist | ja, als einzige Ausnahme vom Einfrieren |
| W-4 | Reel-Modul: ElevenLabs bleibt (Aussprache), Whisper-Gate Pflicht, Character/Musik/IG-Zweig raus | ja |
| W-5 | Map-Szene behalten, nur bei verifiziertem Ort | ja |
| W-6 | Instagram: dasselbe MP4 manuell mitposten (Kill nach 8 Wochen) | ja, ohne jede Automatik |
| W-7 | E-08 SEO-Agent nur vorschlagen; E-09 Keyword-Tool nein | ja / nein |
| W-8 | Claim A „Wie die Welt ist. Jeden Tag ein Beleg." an allen Stellen (Title, JSON-LD, DOI-Mails, Endcard, Bios, Wikidata) | A |
| W-9 | Warm-100-Schwellen 20 / 10 bestätigte Abos | annehmen, nach Tag 21 nachjustieren |
| W-10 | Google Business Profile | zurückstellen bis NAP geklärt |

## Human-TODO-Kandidaten (nur Aaron)

1. Warm-100: Liste mit 100 Namen in drei Kreisen anlegen; ab Tag 1 sieben Nachrichten täglich; Tracking-Tabelle führen.
2. Impressum-Link in TikTok- und Instagram-Profil (§ 5 DDG), Bio auf Claim A.
3. KI-Kennzeichnung (Art. 50 KI-VO: Bild, Stimme, Text) einmal juristisch prüfen lassen; bis dahin Labels an.
4. Auf dem Mini prüfen, ob `openai-whisper` in `remotion/.venv-tts` installiert ist (`.venv-tts/bin/python -c "import whisper"`); auf dem MacBook fehlt es.
5. ElevenLabs-Kontingent und Plan prüfen (47,5 % Stand 06/2026).
6. TikTok-Studio: Completion-Werte wöchentlich in die Tabelle übertragen (nur Aaron sieht sie).
7. Wikidata Q141203108: Beschreibung nach D-12 anpassen.
8. Brevo SPF/DKIM/DMARC verifizieren, `List-Unsubscribe` prüfen.
9. Phase 4: Storage `story_reels` (26 Dateien, 80 MB) und `story_audio` (34, 18 MB) exportieren und löschen; `remotion/out/` (241 MB) lokal löschen.
