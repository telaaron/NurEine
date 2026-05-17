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
- Automatisierung: GitHub Actions Cronjobs
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

## Environment Variables
Alle in .env.example dokumentiert. Nie hardcoden. Nie committen.
Benötigt: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY,
BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME

## Cronjob-Zeiten (UTC → CET)
- 04:00 UTC (06:30 CET) — Hero-Story wählen (select-hero.yml)
- 06/10/14/18 UTC — Stories fetchen & scoren (fetch-stories.yml)
- 05:00 UTC (07:00 CET) täglich — Plus-Newsletter (newsletter-daily-plus.yml)
- 07:00 UTC sonntags — Sonntags-Brief (newsletter-sunday.yml)

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

### Neues Newsletter-Template
→ scripts/send_newsletter.py, Funktion build_html_body()

### Neue Route hinzufügen
→ src/routes/[name]/+page.svelte + ggf. +page.server.ts
→ Nav-Links in src/routes/+layout.svelte aktualisieren

## Was nicht anfassen
- supabase/migrations/ — nur mit neuer Migrationsdatei erweitern, nie editieren
- RLS-Policies — nur mit explizitem Auftrag ändern
- .github/workflows/ Cronjob-Zeiten — nur nach Absprache