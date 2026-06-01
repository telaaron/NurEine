# NurEine Robust-Rebuild — Arbeitsnotizen (2026-05-31)

## ROOT CAUSES (alle drei bestätigt via live DB, project=MustSeen gbfbhspqwaqvnoxitohd)

1. **Schema-Drift = Killer von heute Nacht.** Migration `00014_newsletter_sent_at` committet + Code (select_hero.py, newsletter.ts) deployed, aber NIE auf prod angewandt. `supabase_migrations.schema_migrations` endet bei `00007`. Alles ab 00008 wurde PER HAND im Dashboard gepatcht; 00014 vergessen.
   - Live `nureine_stories` hat KEIN `newsletter_sent_at`.
   - → select_hero + newsletter SELECTen die Spalte → **400** → 0 Hero, 0 Mails (daily 05-31 04:20: found 0 sent 0).
2. **Fetch-INSERT 400 seit 05-26.** AI liefert manchmal Kategorie außerhalb CHECK-Set (`umwelt`,`gesellschaft`,…) → Postgres 400 → 88 gefunden / 0-1 inserted. Pipeline ~5 Tage leer. Dry-run-Insert mit gültigen Werten = OK, also reines VALUE-Problem (Kategorie dominiert).
3. **published_at-Kopplung.** RSS-Datum ≠ Fetch-Zeit, Lag bis 25h. Hero-/Frische-Logik über published_at verfehlt frische Stories. created_at ist die Wahrheit.

## LIVE GROUND TRUTH
- 114 Stories, nur 1 in 24h, 34 in 7d, 4 published in 48h. **heroes=0** (Seite hat grad keine Frontstory außer uralt-Fallback).
- 111/114 image, 114/114 og. Bildpipeline OK.
- 6 Subscriber (alle confirmed free), 1 B2B aktiv, 8 RSS aktiv.
- Constraints heißen noch `lichtblick_stories_category_check`, `lichtblick_stories_impact_score_check`, `lichtblick_subscribers_tier_check` (Renames 00010/00013 liefen nie sauber). subscriber tier_check erlaubt noch 'plus'.
- b2b_clients/delivery_log/logo_url/branding_config/subscriber.name EXISTIEREN (per Hand). Nur newsletter_sent_at fehlt.
- Buckets story_images + og_images public = OK.
- RLS Policies: "Public can read stories" on nureine_stories; "Service role full access" auf allen anderen. NICHT ANFASSEN.
- RSS-URLs in DB weichen von Migrationsdatei ab (Nature=nature.rss, WHO=rss-feeds/news-english.xml). DB = Wahrheit.

## USER-ENTSCHEIDUNGEN (alle recommended)
- Cron-Platform: **Fetch bleibt GitHub Actions** (nur INSERT-Bug fixen). Newsletter+Hero-Auswahl **sendezeit-atomar** im Worker→Endpoint. **select_hero.py + 02:00-Cron ENTFALLEN.**
- Website-Hero **entkoppelt**: zeigt immer frischeste Top-Story, nie leer, unabhängig vom Versand.
- Schema-Drift: **eine konsolidierende idempotente Migration 00015** + via MCP apply_migration auf prod, damit schema_migrations wieder stimmt.
- Kategorie: **Python-Mapping auf erlaubte Kategorie (Fallback gemeinschaft) + defensiver Insert mit 400-Logging.** Constraint bleibt streng (Mapping reicht; KEINE neue Kategorie nötig).

## TODO (Reihenfolge)
1. [ ] Migration `supabase/migrations/00015_consolidate_and_dedup.sql` schreiben — idempotent: newsletter_sent_at, Constraint-Renames lichtblick_*→nureine_*, tier-check ohne 'plus', Index auf newsletter_sent_at. NUR ADD/RENAME, KEINE Policy-Änderung.
2. [ ] Migration via mcp apply_migration auf prod (gbfbhspqwaqvnoxitohd) anwenden.
3. [ ] fetch_stories.py: category-mapping VOR insert (CATEGORY_ALLOWED set + _normalize_category()); defensiver Insert der bei !=201 die Response.text loggt in cron_runs error; published_at behalten aber created_at ist DB-default.
4. [ ] newsletter.ts: fetchHeroStory → ATOMARE Auswahl: höchste impact_score WHERE newsletter_sent_at IS NULL, fallback created_at desc; markStorySent direkt nach erstem Erfolg. wasSentRecently kann bleiben als safety. Entferne Abhängigkeit von is_hero fürs Senden.
5. [ ] queries.ts getLatestFeatured: NICHT mehr is_hero-abhängig hart — wähle frischeste Top-Story (created_at desc, dann impact). Nie leer.
6. [ ] select_hero.py LÖSCHEN + .github/workflows/select-hero.yml LÖSCHEN.
7. [ ] CLAUDE.md Cron-Zeiten-Abschnitt updaten (kein 02:00 hero mehr).
8. [ ] Verify: dry-run newsletter selection query, fetch insert mit bad category, build.

## WICHTIG
- Newsletter-Auswahl-Query (atomar, sendezeit):
  SELECT ... FROM nureine_stories WHERE newsletter_sent_at IS NULL AND impact_score IS NOT NULL ORDER BY impact_score DESC, created_at DESC LIMIT 1
  → dann UPDATE newsletter_sent_at=now() WHERE id=... (markiert, nächster Tag andere Story).
- Website nie leer: getLatestFeatured = ORDER BY created_at DESC LIMIT 1 (oder impact gewichtet), kein is_hero-Zwang.
- fetch INSERT: bei Fehler resp.text in first_error → sichtbar in cron_runs statt still.
