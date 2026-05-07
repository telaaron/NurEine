# SETUP.md — NurEine Launch-Checkliste

## Einmalig (vor Go-Live)

### 1. Supabase (SKIP)
- [ ] Neues Projekt unter app.supabase.com erstellen
- [ ] supabase/migrations/00001_schema.sql ausführen
- [ ] supabase/migrations/00002_seed_rss_sources.sql ausführen
- [ ] Service Role Key kopieren

- INFO: wird um kosten zu sparen aktuell über anderes projekt betrieben

### 2. Resend
- [ ] Account unter resend.com erstellen
- [ ] Domain verifizieren (DKIM/SPF DNS-Einträge setzen)
- [ ] API Key erstellen
- [ ] Absender-Email bestätigen (z.B. newsletter@nureine.de)

### 3. Google Gemini
- [x] API Key unter aistudio.google.com erstellen
- [x] Quota prüfen: 250 Requests/Tag Free Tier

### 4. Vercel
- [ ] Repo verbinden
- [ ] Environment Variables setzen (alle aus .env.example)
- [ ] Domain verbinden
- [ ] Deploy triggern

### 5. GitHub Secrets
Folgende Secrets im Repository unter Settings → Secrets setzen:
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- GEMINI_API_KEY
- RESEND_API_KEY

### 6. Ersten Run triggern
- [ ] GitHub Actions → fetch-stories → "Run workflow" manuell starten
- [ ] Supabase → stories-Tabelle prüfen: Wurden Stories eingefügt?
- [ ] GitHub Actions → select-hero → manuell starten
- [ ] Website öffnen: Wird Hero-Story angezeigt?

### 7. Test-Newsletter
- [ ] Eigene Email als Subscriber eintragen
- [ ] Double-Opt-In bestätigen
- [ ] newsletter-sunday manuell triggern
- [ ] Email-Eingang prüfen

## Laufende Wartung (wöchentlich, 10 Min.)
- [ ] cron_runs-Log in Supabase prüfen (Fehler? Quota-Probleme?)
- [ ] Anzahl neuer Subscriber prüfen
- [ ] Impact-Score-Verteilung prüfen (Hero-Story Score > 60?)
- [ ] Bounce-Rate im Resend-Dashboard prüfen

## Monitoring-Queries (Supabase SQL Editor)
```sql
-- Heutige Hero-Story
SELECT title, impact_score, published_at FROM stories WHERE is_hero=true ORDER BY published_at DESC LIMIT 1;

-- Letzte Cron-Runs
SELECT type, stories_found, stories_inserted, ran_at, error FROM cron_runs ORDER BY ran_at DESC LIMIT 20;

-- Subscriber-Übersicht
SELECT tier, confirmed, COUNT(*) FROM subscribers GROUP BY tier, confirmed;

-- Top-Stories nach Wirkung
SELECT title, impact_score, category, region FROM stories ORDER BY impact_score DESC LIMIT 10;
```