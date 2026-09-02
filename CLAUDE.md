# CLAUDE.md — NurEine

## Projekt-Kontext
Du arbeitest an **NurEine**, einer autonomen Good-News-Plattform.
Teltow, Brandenburg. Gegründet 2026.

## PFLICHTLEKTÜRE — VISION.md
**Lies `VISION.md`, BEVOR du irgendetwas tust.** Es ist die einzige verbindliche
Quelle für Zielbild, Produktausrichtung und interne Roadmap. Bei Widerspruch zu
einem anderen Dokument (ROADMAP.md, FAHRPLAN.md, STRATEGY.md — alle Stand Juni
2026) gilt VISION.md.

Besonders **Abschnitt 13 („Evaluierungen & Entscheidungen")**: dort steht, was
bereits festgelegt ist. Eine dort getroffene Entscheidung nie stillschweigend
umkehren — Widerspruch benennen und Aaron fragen.

Wird etwas Neues festgelegt: **trag es in Abschnitt 13 ein** (Datum, Entscheidung,
Begründung) und pflege den Status in Abschnitt 14. Chatverläufe sind flüchtig,
VISION.md ist das Gedächtnis über alle parallelen Sessions hinweg.

Im Admin sichtbar und bearbeitbar unter `/admin/vision`.

## Wichtigste Regel
Bevor du Code schreibst: Lies `VISION.md` (Zielbild) und `docs/STIMME.md`
(Ton, falls du Text anfasst).

⚠️ `ARCHITECTURE.md` und `BUSINESS.md` sind **historisch** (Mai 2026) und
nennen Technik, die es nicht gibt (Gemini, Resend, `select_hero.py` — alle
null Treffer im Code). Sie sind keine Pflichtlektüre mehr. Was wirklich läuft,
steht in `.env.example`, `scripts/fetch_stories.py` und `ops/crontab.txt`.
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

## Cronjob-Zeiten

**Die einzige Quelle ist `ops/crontab.txt` auf dem Mac Mini.** Hier stehen
bewusst keine Uhrzeiten mehr: Der frühere Abschnitt war ueber Monate falsch
(er nannte einen Workflow `select-hero.yml`, den es nie gab, und eine
Newsletter-Zeit von 04:20, obwohl der Worker seit dem 22.07. um 04:40 feuert).
Jede Session las das als Wahrheit. Zwei Quellen fuer denselben Zeitplan driften
immer auseinander — deshalb steht der Plan jetzt nur noch an einer Stelle.

Nachsehen:
```bash
cat ops/crontab.txt                       # was der Mini wirklich fährt
crontab -l                                # was auf dem Mini installiert IST
grep crons workers/newsletter-cron/wrangler.toml   # Newsletter (Cloudflare)
```

Zwei Dinge, die dabei leicht uebersehen werden:

- **`ops/crontab.txt` ist ein Template, keine Installation.** Was tatsaechlich
  laeuft, zeigt nur `crontab -l` auf dem Mini. (Vorfall 2026-08-20: IndexNow
  lief nie, weil das Template nie installiert wurde.)
- **Die GitHub-Workflows in `.github/workflows/` sehen aus, als liefen sie,
  tun es aber nicht.** In allen 15 ist der `schedule:`-Block auskommentiert,
  seit die Jobs auf den Mini umgezogen sind (vorher feuerten beide parallel,
  Mails kamen doppelt). Sie bleiben nur fuer `workflow_dispatch` von Hand.

Der Newsletter laeuft taeglich (B2C free tier + B2B pilot/paid/free), der
Sonntags-Brief ist seit 2026-05-28 abgeschafft. Brevo braucht 2-5 Minuten fuer
die Zustellung.

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