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

### Reels (Phase 2, „Atmendes Papier v2") — 3 validierte Typen
- Frames: `src/lib/server/og/reel-frames.ts` + `GET /api/reel-frame/<slug>/<hook|aufloesung|endcard>` (9:16).
- Typ-Router aus `ig_hook_type`: zahl/kontrast → **C** (echte Zahl), wow/sieg → **A** (Satz auf Schwarz), mensch/charme → **B** (atmendes Bild, bewusst stilisiert = ehrlich-KI).
  - Typ C fällt automatisch auf A zurück, wenn keine echte Zahl extrahierbar ist (nie „Zahl-Reel ohne Zahl").
- Renderer: `scripts/render_reel.py` (ffmpeg, Single-Pass zoompan+xfade+Vignette+Korn+Audio). ~10s/Reel, ~700 KB.
- Workflow: `render-reel.yml` (Mo/Mi/Fr 15:30 UTC) → wählt Story (`/api/cron/social-reel-select`), rendert, lädt nach Supabase Storage, legt Reel-Draft an.
- Posten: `media_type=REELS` in `queue.ts` (`igPostReel`), MP4-URL in `slide_urls[0]`.

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
