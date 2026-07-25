# TTS-Plan — Aussprache-Sicherheit + bessere lokale Stimme (Stand 2026-07-26)

## 1. GELÖST: kein englisches Wort mehr in der Voiceover (Commit 62c4bdc)

Problem: mal deutsch, mal englisch ausgesprochen — je nachdem ob ein englisches
Wort (Quellenname, Fachbegriff) im voText stand. Beide Engines (ElevenLabs +
edge-tts Multilingual) sprechen englische Wörter englisch aus.

Fix: **Englisch-Wächter** in `render.mjs` (`detectEnglishWords`, läuft nach
`prepareTts` auf dem finalen TTS-Text). Findet er ein verdächtig englisches Wort,
das nicht per `tts-lexikon.json` aufgelöst wurde → **harter Render-Abbruch** mit
Fix-Anleitung (wie der SEO-Check). `--no-en-check` übersteuert.
- Bester Fix ist NICHT das Lexikon, sondern das Wort im voText **eindeutschen/
  umschreiben** (Quellen/Eigennamen gehören eh nur in den Screen: „eine kanadische
  Klinik" statt „Hamilton Health Sciences").
- Ergänzt die schon bestehende Komposita-Regel (lange deutsche Wörter mit
  Bindestrichen in Sprech-Silben zerlegen) im Lexikon.

## 2. Aktuelles Setup (bleibt vorerst)

`REEL_TTS=eleven` → ElevenLabs (Premium, Wort-Timings via with-timestamps), sonst
`edge` → edge-tts (Microsoft, kostenlos, de-DE Neural, WordBoundary-Timings). Beide
liefern die Wort-Timestamps für die Karaoke-Untertitel nativ.

## 3. Ziel (Aaron 2026-07-26): bessere LOKALE Stimme auf dem Mac Mini, kommerziell frei

Wenn ein lokales Modell besser klingt als edge-tts UND kommerziell nutzbar ist →
umsteigen. Umsetzen, sobald der Mac Mini (Apple Silicon, 24/7) steht.

### Der architektonische Schlüssel: Timing von der Stimme entkoppeln
**WhisperX** (`m-bain/whisperX`, lokal, Apple Silicon, MIT-nah) macht Forced
Alignment auf FERTIGEM Audio → Wort-Timestamps für JEDE Stimme, auch solche ohne
native Timings. Damit ist die Stimmen-Wahl frei. (Genauigkeit gut; eine bekannt-gute
WhisperX-Version PINNEN — es gab Alignment-Regressionen ≥3.3.3 — und auf 1-2 Test-VOs
gegenprüfen. TTS-Audio ist sauber/ruhig → Forced Alignment sehr zuverlässig.)
Kein GPU/Metal für die TTS-Modelle selbst (alle CPU-only auf Apple Silicon) — für
Batch-Rendering über Nacht ok.

### Lizenz-KRITISCH (kommerzielle Nutzung — NurEine ist kommerziell):
| Modell | Deutsch-Klang | Lizenz | Für uns? |
|---|---|---|---|
| **Kartoffel-Orpheus-3B (german natural)** | bester lokaler DE-Klang, klar über edge-tts, ~18 Sprecher | **Llama 3.2 — kommerziell OK** | ✅ **Top-Kandidat** (3B → CPU-langsam, Batch nachts) |
| **Chatterbox Multilingual (Resemble)** | sehr stark, schlägt teils ElevenLabs | **MIT — kommerziell OK** | ✅ **mittesten** |
| **Kokoro-82M (dt. Modell)** | solide, leicht/schnell, native Timestamps | **Apache-2.0 — OK** | ⚠️ nur wenn Speed > Klang (klingt nicht besser als edge) |
| **Piper** | schnell, aber flacher als edge-tts | MIT — OK | ⚠️ löst das Klang-Motiv nicht |
| XTTS-v2, F5-TTS-German, SauerkrautTTS, Thorsten-Orpheus | gut | **CC-BY-NC / CPML — NICHT kommerziell** | ❌ TABU für NurEine |

### Konkreter Umsetzungsplan (wenn Mac Mini steht):
1. **A/B-Test zuerst** (keine Katze im Sack): 3-4 identische deutsche Test-Sätze durch
   **Kartoffel-Orpheus-3B** (besten der ~18 Sprecher fixieren — Stabilität schwankt),
   **Chatterbox-Multilingual**, edge-tts und ElevenLabs. Aaron hört, entscheidet.
   (CrispTTS-CLI `CrispStrobe/CrispTTS` bündelt viele Engines für schnelles A/B.)
2. Gewinner als 3. Engine in `tts.py` (`--engine local`), Stimme lokal generieren.
3. **WhisperX** als Wort-Timing-Layer nachschalten (ein Schritt, erledigt Timings +
   VO-Text-Gegenprobe zugleich — die haben wir eh schon per Whisper).
4. Der Englisch-Wächter (§1) bleibt aktiv — gilt für JEDE Engine.

## Quellen
Kartoffel-Orpheus-3B (HF, Llama-3.2) · Chatterbox (github resemble-ai, MIT) ·
Kokoro-82M (hexgrad, Apache) · WhisperX (m-bain) · Amazon Polly Speech Marks (Cloud-
Fallback-Option, Vicki Neural, 12-Mon-Free-Tier) · CrispTTS (Multi-Engine-CLI).
Details in der Recherche-Session 2026-07-26.
