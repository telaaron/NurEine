# NurEine — Gute Nachrichten. Jeden Tag exakt eine.

Eine deutschsprachige Good-News-Plattform. Kuratiert von einer KI-Redaktion, automatisiert betrieben.

**Tech Stack:** SvelteKit (Vercel) · Supabase (PostgreSQL + Edge Functions) · DeepSeek Chat · Resend · GitHub Actions

---

## Architektur

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  SvelteKit App  │────▶│   Supabase DB    │◀────│  Python RSS  │
│  (Vercel)       │     │  (PostgreSQL)    │     │  Fetcher     │
└─────────────────┘     └──────────────────┘     │  (GH Action) │
        │                                        └──────┬───────┘
        │                                               │
        ▼                                               ▼
┌──────────────────┐                          ┌──────────────────┐
│  Resend API      │                          │  DeepSeek Chat   │
│  (Newsletter)    │                          │  (Scoring)       │
└──────────────────┘                          └──────────────────┘
```

---

## Setup

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Im SQL Editor: führe `supabase/migrations/00001_schema.sql` aus (Tabellen + RLS)
3. Führe `supabase/migrations/00002_seed_rss_sources.sql` aus (RSS-Quellen)

### 2. Environment

Kopiere `.env.example` zu `.env` und fülle alle Werte aus:

```bash
cp .env.example .env
```

| Variable | Beschreibung |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase Project URL (aus Dashboard Settings) |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key (für Admin-Aktionen) |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `RESEND_API_KEY` | Resend API Key |
| `RESEND_FROM_EMAIL` | Verified Sender (z.B. `newsletter@nureine.de`) |
| `PUBLIC_BASE_URL` | Öffentliche URL (z.B. `https://nureine.de`) |

### 3. Lokale Entwicklung

```bash
pnpm install
pnpm dev
```

### 4. Deployment (Vercel)

```bash
pnpm build
pnpm preview
```

Verbinde das GitHub-Repository mit Vercel. Setze alle Environment-Variablen in den Vercel Project Settings.

---

## Automatisierung (GitHub Actions)

### Workflows

| Workflow | Cron | Beschreibung |
|---|---|---|
| `fetch-stories.yml` | 4× täglich (06, 10, 14, 18 UTC) | RSS-Feeds parsen, DeepSeek-Scoring, Stories speichern |
| `select-hero.yml` | Täglich 05:30 UTC | Höchst-bewertete Story als Hero setzen |
| `newsletter-sunday.yml` | Sonntags 07:00 UTC | Sonntags-Brief an alle Abonnenten |
| `newsletter-daily.yml` | Taeglich 07:30 UTC | Taeglicher Brief an alle Abonnenten |

### Secrets in GitHub setzen

Folgende Repository Secrets müssen angelegt werden:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `DEEPSEEK_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PUBLIC_BASE_URL`

---

## Supabase Edge Function

Die Newsletter-Funktion läuft als Supabase Edge Function:

```bash
# Lokal testen
supabase functions serve send-newsletter

# Deployen
supabase functions deploy send-newsletter
```

---

## RSS-Quellen

Im System hinterlegte Quellen (über `rss_sources`-Tabelle):

| Quelle | Sprache | Region |
|---|---|---|
| Good News Network | en | global |
| Positive.News | en | global |
| Golem Science | de | DE |
| Utopia.de | de | DE |
| Berliner Zeitung | de | DE/BB |
| Mongabay | en | global |
| WHO News | en | global |
| Nature News | en | global |

---

## Newsletter Double-Opt-In

1. User gibt E-Mail ein → `POST /api/subscribe`
2. Resend sendet Bestätigungsmail mit Link `{BASE_URL}/api/confirm?token=XXX`
3. Link setzt `confirmed=true` in Supabase
4. User wird weitergeleitet zu `/newsletter?confirmed=true`

---

## Lizenz

Privatprojekt. Alle Rechte vorbehalten.
