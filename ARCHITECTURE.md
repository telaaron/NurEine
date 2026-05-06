# ARCHITECTURE.md — Lichtblick

Zuletzt aktualisiert: Mai 2026

## Übersicht

Lichtblick läuft vollständig autonom. Nach dem initialen Setup
sind keine manuellen Eingriffe nötig.
RSS-Quellen (8+)
↓
GitHub Actions (4× täglich, 06/10/14/18 UTC)
↓
scripts/fetch_stories.py
→ feedparser: RSS parsen
→ Gemini Flash 2.5: filtern, übersetzen, scoren
→ Supabase: INSERT (Duplikat-Check per source_url)
→ cron_runs: Logging
↓
scripts/select_hero.py (05:30 UTC)
→ Höchster impact_score der letzten 24h → is_hero=true
↓
Supabase PostgreSQL
↓
SvelteKit auf Vercel (Frontend)
↓
Resend API (Newsletter)

text

## Datenbank-Schema

### stories
| Spalte | Typ | Beschreibung |
|---|---|---|
| id | UUID | Primary Key |
| title | TEXT | Deutscher Titel (max 80 Zeichen) |
| subtitle | TEXT | Kontext-Zeile (max 120 Zeichen) |
| body_markdown | TEXT | Vollständiger Artikel |
| summary | TEXT | 2-3 Sätze, KI-generiert |
| source_url | TEXT | Original-URL (Duplikat-Key) |
| source_name | TEXT | Name der Quelle |
| category | TEXT | klima/gesundheit/wissenschaft/gemeinschaft/tiere/kultur/innovation |
| region | TEXT | Land auf Deutsch |
| region_code | TEXT | ISO 3166-1 alpha-2 |
| lat / lng | FLOAT | Koordinaten für Karte |
| impact_score | INT | 1–100, Wirkungsindex gesamt |
| impact_reach | INT | Geschätzte betroffene Menschen |
| impact_durability | INT | 0–100, Dauerhaftigkeit |
| impact_evidence | INT | 0–100, Belegbarkeit |
| reading_time_min | INT | Lesezeit in Minuten |
| emoji | TEXT | Visuelles Icon |
| is_hero | BOOLEAN | Täglich genau eine true |
| published_at | TIMESTAMPTZ | Veröffentlichungszeitpunkt |

### Wirkungsindex-Formel
reach_norm = min(100, log10(impact_reach + 1) × 20)
impact_score = round(reach_norm × 0.4 + impact_durability × 0.35 + impact_evidence × 0.25)

text

### subscribers
| Spalte | Typ | Beschreibung |
|---|---|---|
| email | TEXT UNIQUE | Email-Adresse |
| tier | TEXT | free / plus / b2b |
| confirmed | BOOLEAN | Double-Opt-In bestätigt |
| confirmation_token | TEXT | UUID für Bestätigungs-Link |
| lat / lng | FLOAT | Standort (optional, für Bei-dir) |
| region / region_code | TEXT | Erkannte Region |

### Weitere Tabellen
- **rss_sources** — aktive RSS-Feeds mit Region-Zuordnung
- **newsletter_sends** — Log aller versendeten Mails
- **cron_runs** — Protokoll aller automatischen Jobs

## Sicherheit
- Row Level Security (RLS) auf allen Tabellen aktiv
- Public (Anon Key): Nur SELECT auf stories WHERE is_hero=true oder published
- Subscriber-Daten: Nur über Service Role Key erreichbar
- Newsletter-API: Nur mit Service Role Key aufrufbar
- Confirmation-Token: crypto.randomUUID(), single-use

## Frontend-Struktur
src/routes/
├── +layout.svelte # Nav, Footer, globales CSS
├── +page.svelte # Heute — Hero + Grid
├── archiv/+page.svelte # Filter: Kategorie, Sortierung Datum/Wirkung
├── karte/+page.svelte # Leaflet, CartoDB Positron Tiles
├── bei-dir/+page.svelte # Geolokation + Haversine-Distanz
├── manifest/+page.svelte # 6 Prinzipien, statisch
├── newsletter/+page.svelte # Pricing + Subscribe-Form
└── api/
├── subscribe/ # POST: Eintragen + Confirmation senden
├── confirm/ # GET: Double-Opt-In
└── unsubscribe/ # GET: Abmelden

text

## Geolokation-Logik (bei-dir)
1. Browser Geolocation API anfragen
2. Falls abgelehnt: `http://ip-api.com/json/?fields=lat,lon,country,countryCode,regionName,city`
3. lat/lng in localStorage cachen (kein erneuter API-Call)
4. Stories filtern: region_code match ODER Haversine-Distanz < 500km
5. Sortierung: Distanz aufsteigend
6. Fallback: Europäische Stories wenn keine lokalen vorhanden

## Deployment
- **Vercel**: SvelteKit adapter-vercel, automatisches Deploy bei Push auf main
- **Supabase**: Migrations in supabase/migrations/ (nummeriert, nie editieren)
- **GitHub Secrets**: SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, RESEND_API_KEY

## Skalierungs-Pfade
| Schwelle | Maßnahme |
|---|---|
| >250 API-Calls/Tag | Gemini Flash auf Pay-as-you-go upgraden (~$0.075/1M Tokens) |
| >500 Subscriber | Resend Starter Plan ($20/mo, 50k Mails) |
| >10k Subscriber | Supabase Pro ($25/mo), eigener SMTP-Server prüfen |
| >50 Stories/Tag | Supabase Edge Functions für Scoring statt GitHub Actions |