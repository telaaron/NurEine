# CLAUDE.md — NurEine

## Projekt-Kontext
Du arbeitest an **NurEine**, einer autonomen Good-News-Plattform.
Teltow, Brandenburg. Gegründet 2026.

## Wichtigste Regel
Bevor du Code schreibst: Lies ARCHITECTURE.md und BUSINESS.md.
Ändere nie das DB-Schema ohne Rücksprache — RLS-Policies sind sicherheitskritisch.

## Tech Stack (nicht ändern ohne Grund)
- Frontend: SvelteKit + TypeScript, deployed auf Vercel
- DB: Supabase (PostgreSQL + Edge Functions)
- KI: DeepSeek Chat (Textanalyse)
- Automatisierung: GitHub Actions (Python-Cronjobs) + Cloudflare Workers Cron (Newsletter)
- Email: Brevo API
- Karte: Leaflet.js
- Geolokation: Browser Geolocation API + ip-api.com Fallback
- Bildspeicher: Supabase Storage Bucket (story_images, public)

## Code-Stil
- TypeScript strict mode überall
- Keine any-Types
- Server-seitige Supabase-Calls nur über src/lib/server/supabase/client.ts (Service Role)
- Public-seitige Calls über src/lib/supabase.ts (Anon Key)
- Alle DB-Queries in src/lib/server/queries.ts zentralisieren
- Python-Scripts: PEP8, keine globalen Variablen, alle Fehler in cron_runs loggen

## Bilder & Egress — HARTE REGEL (Vorfall 2026-07-16)
**NIE eine Supabase-Storage-URL direkt in ein `<img src>` schreiben.** Immer
`storyImageSrc(hero, base, breite)` aus `src/lib/story-images.ts` nutzen (leitet
über den `/img`-Proxy: skaliert, WebP, 1 Jahr CDN-Cache).

Warum: Ein direkt eingebettetes Original zieht bei JEDEM Aufruf 2–6 MB aus dem
Storage. Ein 40px-Avatar auf /karte tat genau das — zusammen mit anderen Lecks
riss das das Supabase-Monats-Kontingent (Egress + Storage), die Seite war
**4 Tage gesperrt** (16.–20.07.). Zwei Gegenregeln:
1. **Anzeige:** immer `storyImageSrc(...)`, Breite = CSS-Pixel × 2 (Retina).
2. **Upload:** Bilder vor dem Upload komprimieren —
   `scripts/image_utils.py::encode_story_image()` (max 1200px, JPEG q85, <150 KB).
   Seedream liefert 2,7–5 MB PNG; ungeprüft hochladen sprengt das Storage-Cap.

## Environment Variables
Alle in .env.example dokumentiert. Nie hardcoden. Nie committen.
Benötigt: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY,
BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME, CRON_SECRET

## Cronjob-Zeiten (UTC → CET/CEST)
- 02:00 UTC (04:00 CEST) — Hero-Story wählen (`.github/workflows/select-hero.yml`) — MUSS vor Newsletter (04:20 UTC) fertig sein, sonst Race Condition
- 04:20 UTC (06:20 CEST) täglich — Daily-Newsletter (**Cloudflare Worker** `workers/newsletter-cron`)
- 06/10/14/18 UTC — Stories fetchen & scoren (`.github/workflows/fetch-stories.yml`)
- 06:05/10:05/14:05/18:05 UTC — OG-Images (`.github/workflows/generate-og-images.yml`)

Sonntags-Brief ist abgeschafft (Stand 2026-05-28). Newsletter läuft nur noch
täglich (B2C free tier + B2B pilot/paid/free).

Cloudflare Workers Cron feuert auf die Sekunde genau (keine GitHub-Queue
mehr). Brevo-Delivery ~2-5 Min → realistisch ~06:25 CEST bei Lesern.

## Aktueller Status
Alle 16 Tasks der initialen Architektur sind implementiert.
Build: 0 Fehler, 61 Accessibility-Warnings (bekannt, nicht kritisch).
Noch offen: echte API-Keys, Supabase-Projekt live, Domain.

## Häufige Aufgaben

### Neue RSS-Quelle hinzufügen
INSERT INTO rss_sources (name, url, language, region, region_code) VALUES (...);

### Wirkungsindex-Formel anpassen
→ scripts/fetch_stories.py, ANALYSIS_PROMPT_TEMPLATE, impact_score-Berechnung

### Bildstil ändern
→ scripts/fetch_stories.py, ANALYSIS_PROMPT_TEMPLATE, image_prompt-Definition

### Newsletter-Logik / Template ändern
→ `src/lib/server/newsletter.ts` (buildB2CHtml, buildB2BHtml, sendDailyNewsletter)
→ Endpoint: `src/routes/api/cron/newsletter/+server.ts`
→ Worker (nur Scheduler, nicht editieren außer Cron-Zeit): `workers/newsletter-cron/`
→ Deploy Worker bei Schedule-Änderung: `cd workers/newsletter-cron && wrangler deploy`

### Neue Route hinzufügen
→ src/routes/[name]/+page.svelte + ggf. +page.server.ts
→ Nav-Links in src/routes/+layout.svelte aktualisieren

## Was nicht anfassen
- supabase/migrations/ — nur mit neuer Migrationsdatei erweitern, nie editieren
- RLS-Policies — nur mit explizitem Auftrag ändern
- .github/workflows/ Cronjob-Zeiten — nur nach Absprache
- workers/newsletter-cron/wrangler.toml Cron-Zeit — nur nach Absprache

## Newsletter Setup (einmalig pro Environment)
1. `CRON_SECRET` generieren: `openssl rand -hex 32`
2. In **Vercel** als env var setzen (alle 3 envs: prod, preview, dev)
3. In **Cloudflare Worker** setzen:
   ```
   cd workers/newsletter-cron
   wrangler secret put CRON_SECRET
   wrangler deploy
   ```
4. Smoke-Test: `curl -X POST https://nureine.de/api/cron/newsletter -H "Authorization: Bearer $CRON_SECRET"`