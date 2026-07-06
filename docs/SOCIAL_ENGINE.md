# Social-Engine v2 — Carousels, Wochen-Digest & Reels

Stand: 2026-06-30. Baut auf der IG-Strategie auf (7 gesättigte Muster gebrochen,
10 Ideen). Phase 1 (Carousels) + Phase 2 (Reels) implementiert. **Autopilot-Hebel
liegt bei dir** — nichts geht live, bevor du ihn bewusst umlegst.

---

## Was neu ist

### Carousel-Slide-Stile (`src/lib/server/og/carousel.ts`)
- **`beleg`** (Idee #1) — zeigt das Beleg-Niveau (`impact_evidence`) + Quelle. Glaubwürdigkeit sichtbar.
- **`methodik`** (Idee #6) — 3 erklärte Balken (Reichweite/Dauerhaftigkeit/Belege) statt nacktem „87/100".
- **`endcard`** — schickbare Zeile aus `share_hook` + „An jemanden schicken"-Button.
- **KI-Footer** „Illustration: KI · NurEine" auf allen bild-tragenden Slides (EU-KI-VO Art. 50, ab 02.08.2026).
- Abrufbar über `GET /api/carousel/<slug>/1?kind=beleg|methodik|endcard`.

### Wochen-Digest (Idee #10) — der Ritual-Post
- `src/lib/server/og/digest.ts` + `GET /api/digest/<n>` (Cover + 5 Stories + Endcard = 7 Folien).
- Auswahl: `selectWeeklyDigestStories()` — Top-Stories der Woche, mit Hook-Typ-Vielfalt.
- Cron: `POST /api/cron/social-digest` (Workflow `social-digest.yml`, So 15:30 UTC).
- Ersetzt sonntags den täglichen Story-Post (Guard in `generateTodayDraft`).

### Format-Scheduler (`src/lib/server/social/schedule.ts`)
- Wochentag bestimmt die Carousel-FORM, damit der Feed über die Woche variiert:
  - Di → Beleg-Carousel · Do → Methodik · Sa → ruhig (Stille) · Mo/Mi/Fr → Standard (bzw. Reel) · So → Digest.

### Reels v3 — „ReelDaily" (Stand 2026-07-06, LIVE Mo/Di/Mi/Fr/Sa)
Regeln aus dem IG-Research Juni/Juli 2026 (Sends = Top-Signal, Hook ab Frame 0,
15–40s, Keyword-Captions, keine sprechenden AI-Avatare, Beleg als USP):
- **Komposition `ReelDaily`** (`remotion/src/ReelDaily.tsx`): Hook-Text steht ab
  Frame 0 (Marker-Sweep aufs Punch-Wort) → Zahl-Count-up auf dunklem Kontrast →
  1-2 Beats (Story-Bild als Editorial-Panel / Figur) → **Beleg-Stempel** („Belegt."
  + Quelle + Wirkungsindex — kein Konkurrent zeigt Evidenz im Format) → Endcard
  mit Schick-CTA (Sends!) + Follow-Zeile + KI-Kennzeichnung. Figur = Marken-Element
  in Nebenrolle, kein sprechender Avatar.
- **Skript: DeepSeek** (Hook ≤9 Wörter, Beats, VO-Text) mit regelbasiertem Fallback.
- **Voiceover: edge-tts** (kostenlos, de-DE-Seraphina) mit Wort-Timestamps →
  wortsynchrone Karaoke-Captions. **Default AUS** (`VO=0`), bis Aaron die
  Stimm-Qualität einmal abgenommen hat → dann Repo-Variable `REEL_VO=1` setzen.
  Kennzeichnung „Stimme: KI" liegt im Endcard.
- Render: `node remotion/render.mjs --slug … --queue [--vo]` → `/api/reel-data/<slug>`
  (liefert jetzt auch source/impactScore), DeepSeek, TTS, Szenen-Plan (Timings aus
  Textlänge, auf VO-Länge skaliert), `npx remotion render ReelDaily`, Upload, Draft
  (mit `scheduled_for=now`, sonst findet publishDue ihn nie).
  Lokaler Test ohne Server: `--data story.json`.
- **Produktion: Claude-Regie-Routine `nureine-reel-regie`** (lokal, Mo/Di/Mi/Fr/Sa
  09:00, läuft solange die Claude-App offen ist): wählt die Story, baut pro Story
  eine EIGENE Dramaturgie aus dem Baukasten (`docs/REEL_BAUKASTEN.md`), schreibt
  Skript+VO, rendert (`render.mjs --script plan.json`), sichtet Frames, reiht ein
  und triggert social-publish. Bei starken Stories (Impact ≥80) auch 2 Reels.
- **Fallback: `render-reel.yml` 16:00 UTC** (Mo/Di/Mi/Fr/Sa) — rendert das
  Standard-Skelett NUR, wenn bis dahin kein Reel existiert (Tages-Guard im
  Select-Endpoint; z.B. Mac aus) und postet direkt. Render fehlgeschlagen →
  Carousel-Fallback via `generateTodayDraft`. Do = Carousel-Tag, So = Digest.
- **publishDue: max 2 Feed-Posts/Tag, ≥3h Abstand** (Carousel morgens +
  Regie-Reel vormittags ist der Normalfall).
- **Frische-Guard in `publishDue`**: Posts älter als 72h werden nicht mehr
  gepostet (alte Drafts blockieren sonst die tagesaktuellen Reels; „gute
  Nachricht von vorgestern" ist redaktionell tot).
- Alt-Bestand: `Reel.tsx`/`ReelPro.tsx`/`CharacterReel.tsx` bleiben als
  Studio-Referenz; ffmpeg-Variante `scripts/render_reel.py` = 0€-Fallback,
  falls die Remotion-Lizenz kostenpflichtig wird (gratis ≤3 Mitarbeiter).

### Dev-Preview (ohne Posten)
- `/admin/social/preview` (hinter Admin-Login). Zeigt: heutige Carousel-Form, alle Slide-Stile, Reel-Frames, Wochen-Digest. **Postet nichts.** `?slug=…` testet eine andere Story.

### Migrationen
- `00041_social_digest.sql` — `post_kind` ('story'|'digest'), `slide_urls TEXT[]`, entspannter Unique-Index.
- `00042_social_reel_kind.sql` — `post_kind` um 'reel' erweitert.
- Beide bereits auf dem Live-Projekt (MustSeen) angewandt.

---

## Was DU einmalig erledigst (bevor es live geht)

1. **Reel-Story prüfen im Dev-Preview** — `pnpm dev`, dann `/admin/social/preview` öffnen, Carousels + Reel-Frames + Digest ansehen. Mit `?slug=…` verschiedene Stories testen.

2. **CC0-Tonspur bundeln (optional, empfohlen):** eine ruhige, lizenzfreie Datei nach `assets/audio/ambient1.m4a` legen. Fehlt sie, baut der Renderer das Reel **stumm** (IG erlaubt das; ~70-85% schauen eh stumm). Quelle z.B. Pixabay-Audio (CC0) oder YouTube Audio Library „ruhig".

3. **fal.ai-Lizenz checken** — kurz im fal.ai-Plan bestätigen, dass die FLUX-Bilder kommerziell genutzt werden dürfen (einmalig).

4. **GitHub-Secrets** für die neuen Workflows: nutzen dieselben Secrets wie die bestehenden (`PUBLIC_BASE_URL`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`). Kein neues Secret nötig.

5. **Autopilot-Schalter** — `social_autopilot` steht in der DB aktuell auf `'true'`. Sobald ein gültiger **`IG_ACCESS_TOKEN` + `IG_USER_ID`** in Produktion gesetzt ist, posten die Crons **automatisch**. Solange kein Token gesetzt ist, ist alles Trockenlauf (Drafts, kein Post). → Du entscheidest, wann der Token kommt = wann es scharf ist.
   - Halb-autonom stattdessen: `social_autopilot` im Admin auf `'false'`, dann postet nur, was du im Cockpit auf `approved` setzt.

---

## Wochenplan (1 Feed-Post/Tag, ~17:30 CEST)

| Tag | Format | Cron |
|---|---|---|
| Mo/Mi/Fr | **Reel** (Typ A/B/C nach Hook) | `render-reel.yml` 15:30 UTC |
| Di | Carousel **Beleg** | `social-generate.yml` (bestehend) |
| Do | Carousel **Methodik** | `social-generate.yml` |
| Sa | Carousel **ruhig** | `social-generate.yml` |
| So | **Wochen-Digest** (7 Folien) | `social-digest.yml` 15:30 UTC |
| täglich | + IG-Stories | `social-story.yml` (bestehend) |

Hinweis: `social-generate.yml`-Cron-Zeit ggf. auf ~15:30 UTC ziehen, damit der Feed-Post abends statt morgens kommt (Prime-Time der gestressten Zielgruppe). Cron-Zeit-Änderung = bewusste Absprache (CLAUDE.md).

---

## Lokaler Reel-Test

```bash
pnpm dev   # Server auf :5180
python3 scripts/render_reel.py \
  --base-url http://localhost:5180 \
  --slug <story-slug> \
  --out /tmp/reel.mp4 \
  [--type A|B|C]            # Typ erzwingen (sonst aus ig_hook_type)
  [--audio assets/audio/ambient1.m4a]
```

Hochladen + Draft anlegen (wie im Workflow): zusätzlich `--queue --story-id <id> --caption "…" --hashtags "#a,#b" --category klima` mit `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` in der Umgebung.
