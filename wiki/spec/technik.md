# Spezifikation Technik & Rebuild — Stand 2026-09-09

> Fachteil „Technik & Rebuild" für Phase 1 des Rebuild-Plans. Grundlage: `wiki/00-LAGE.md`,
> `wiki/REBUILD-PLAN.md`, VISION §1/§2/§4.2, D-20…D-28, §17, §19.3. Altcode ist Steinbruch
> (D-28); jede Übernahme ist unten mit Dateipfad benannt. Zahlen ohne Beleg sind als
> *(Schätzung)* oder *(zu verifizieren)* markiert.
>
> **Neue Fakten 2026-09-09:** Alt-Projekt „MustSeen" (`gbfbhspqwaqvnoxitohd`) wird exportiert
> und danach pausiert; neues Supabase-Projekt „nureine" (Free, eu-central-1); neues Repo
> `github.com/telaaron/nureine-v2` (→ Umbenennung in `nureine` beim Umzug). Export liegt lokal
> unter `…/Dateien - Local/_supabase-mustseen-export-2026-09-09/{db,schema,storage}/` (am
> 09.09. 11:37 angelegt, Ordner noch leer — Export läuft).

## 1. Repo-Layout (neu, minimal)

| Pfad | Zweck |
|---|---|
| `src/routes/` | Genau die Routen aus REBUILD-PLAN §1/§2: `/`, `/geschichte/[slug]`, `/archiv`, `/karte`, `/stand-der-welt`, `/methodik`, `/newsletter`, `/ueber-uns`, `/impressum`, `/datenschutz`, `/go/[code]`, `/img`, `/admin` (eine Seite), `sitemap.xml`, `robots.txt`, `llms.txt` |
| `src/routes/api/` | `cron/newsletter`, `cron/healthcheck`, `subscribe`, `confirm`, `unsubscribe`, `webhooks/brevo`, `og/[slug]` — sonst nichts |
| `src/lib/server/` | `db.ts` (Service Role, einziger Server-Client), `queries.ts` (alle Queries), `newsletter.ts`, `evidence.ts` |
| `src/lib/` | `story-images.ts` (`storyImageSrc`, 1:1 aus `src/lib/story-images.ts`), `categories.ts`, `data/langzeitindex.json` |
| `pipeline/` | **Ein** Python-Paket: `run.py`, `sources.py`, `fetch.py`, `prefilter.py`, `extract.py` (DeepSeek), `evidence.py`, `judge.py` (Agenten-Aufruf), `images.py`, `publish.py`, `importer/` |
| `pipeline/agents/` | Zwei Prompts: `redakteur.md`, `bildpruefer.md` (ersetzt `ops/prompts/*`, 811 Z.) |
| `pipeline/schemas/` | JSON-Schemas `candidate.json`, `verdict.json`, `image_verdict.json` — Vertrag zwischen Code und Agent |
| `scripts/index_build.py`, `docs/langzeitindex-spec.json` | Langzeitindex **1:1** (VISION §19.3) |
| `supabase/migrations/0001_schema.sql` … | Schema von null, ein Präfix `ne_`, keine Doppelnummern |
| `ops/` | `crontab.txt` (eine Zeile), `run.sh`, `env.runner.example`, `wt` (Worktree-Helfer, übernehmen) |
| `.github/workflows/langzeitindex.yml` | 1:1 übernehmen |
| `wiki/` | zieht mit um; Alt-Repo wird read-only |

Nicht im neuen Repo: `ios/`, `ios-native/`, `remotion/` (764 MB — bleibt im Alt-Repo als
Fundament für D-22, wird in Phase 2 als eigenes Modul zurückgeholt), `workers/`,
`nureine-impact/`, `data/`, 27 auslöserlose Scripts, 20 Admin-Seiten, 10 Bild-Generatoren.

## 2. Datenmodell (`ne_`, 10 Tabellen: 8 Kern + 2 klein)

Grundsätze: UUID-PKs nur wo Alt-IDs übernommen werden (Stories, Abonnenten), sonst `bigint identity`.
Alle Zeitstempel `timestamptz`. Jede Tabelle hat RLS **an**; Policies s. 2.11.

### 2.1 `ne_sources` — Quelle

| Spalte | Typ | Zweck |
|---|---|---|
| id | bigint identity PK | |
| name, url | text, text unique | Feed-/Seiten-URL |
| kind | text check (rss, scraper, api) | `scrape_source_entries` heute für 3 Seiten ohne RSS |
| source_type | text check (official-data, study, government, ngo-report, institution, journalism) | Typen aus VISION §4.2; ersetzt `beat`/`source_type` an der Story |
| language, country_code | text, char(2) | |
| priority, max_per_run | smallint, smallint | heute hart codiert in `SOURCE_CONFIG` (`scripts/fetch_stories.py:171`) → in die DB |
| hero_eligible | bool default true | aus Migration `00036` |
| active, fail_count, last_fetched_at, last_error | bool, int, timestamptz, text | Betriebszustand |

Index: `(active) where active`.

### 2.2 `ne_places` — Ort (mit Genauigkeits-Label)

| Spalte | Typ | Zweck |
|---|---|---|
| id | bigint identity PK | |
| label | text | „Berlin", „Region Zinder" |
| country_code | char(2) | |
| lat, lng | double precision | |
| precision | text check (exact, city, region, country) | VISION §4.2 `location.precision`; heutiges `place_scope` (`00048`) wird gemappt |
| bounds | double precision[4] null | optional |
| geoname_id | int null | Dedupe-Schlüssel |
| resolved_by | text check (code, agent, human, legacy) | wer den Ort festgelegt hat |

Index: `(country_code)`, unique `(geoname_id) where geoname_id is not null`.

### 2.3 `ne_stories` — Story

| Spalte | Typ | Zweck |
|---|---|---|
| id | uuid PK | **Alt-ID wird übernommen** (Slug-Stabilität, s. §7) |
| slug | text unique | gespeichert, Schema s. §7.2 |
| status | text check (candidate, published, rejected, duplicate) | ersetzt `is_hero`/`curation_queue`; public sieht nur `published` |
| title, subtitle, summary, body | text | `body` = Markdown (heute `body_markdown`) |
| category | text check (klima, gesundheit, wissenschaft, gemeinschaft, tiere, kultur, innovation) | Werte aus `00003`, unverändert |
| source_id | bigint FK ne_sources | |
| source_url | text unique | hartes Dedupe (heute `source_exists`, `fetch_stories.py:835`) |
| source_title | text | Originaltitel (Nachweis) |
| impact_score, impact_reach, impact_durability, impact_evidence | smallint, bigint, smallint, smallint | Story-Wirkungsindex (VISION §2: getrennt vom Langzeitindex) |
| impact_explainer | text | ein Satz (aus `00026`) |
| place_id | bigint FK ne_places null | null = überregional → nicht auf der Karte |
| image_path | text null | **Storage-Pfad**, nie URL (`stories/<uuid>.jpg`) |
| image_ai, image_prompt, image_alt | bool, text, text | KI-Bild-Kennzeichnung (VISION §4.1 „Bildnachweis") |
| evidence_level | text check (none, legacy, checked) | `legacy` = importiert, ohne Beweis-Schicht → keine Badges |
| hero_date | date unique null | Tag, an dem die Story „Heute" war (heute `newsletter_sent_at`) |
| sensitive | bool default false | aus `00025` |
| duplicate_of | uuid FK ne_stories null | aus `00044` |
| judged_by | text check (agent, fallback, human) | Herkunft des Urteils (D-24: sichtbar) |
| run_id | bigint FK ne_runs null | welcher Lauf sie erzeugt hat |
| published_at, created_at | timestamptz | |

Indizes: `(status, published_at desc)`, `(hero_date) where hero_date is not null`, `(place_id)`,
`(category, published_at desc)`, `(source_url)` unique, `(slug)` unique. Was wegfällt: §2.12.

### 2.4 `ne_evidence` — Beweis (1:n je Story)

| Spalte | Typ | Zweck |
|---|---|---|
| id | bigint identity PK | |
| story_id | uuid FK ne_stories on delete cascade | |
| kind | text check (primary_source, independent_source, number, place, image) | die fünf Zeilen des Moduls „Belegt durch" (VISION §4.1) |
| title, publisher, url, source_type, published_at | text… | für `primary_source`/`independent_source` (Felder aus §4.2) |
| value, unit, context | numeric null, text, text | für `number`: die Zahl, Einheit, Satz mit Kontext („Die Zahl im Kontext") |
| quote | text | wörtliche Fundstelle in der Quelle (Aggregator-Verkürzungsfehler: Zahl immer aus Primärquelle) |
| verified_by | text check (code, agent, human) | |
| checked_at, http_status | timestamptz, smallint | Erreichbarkeit der URL (Code) |

Index: `(story_id, kind)`.

### 2.5 `ne_subscribers` — Abonnent

| Spalte | Typ | Zweck |
|---|---|---|
| id | uuid PK | Alt-ID übernehmen |
| email | citext unique | |
| name | text null | |
| confirmed, confirmed_at, signup_ip | bool, timestamptz, text | DSGVO-Nachweis (aus `00019`) |
| token | text unique | Double-Opt-in **und** Abmeldung (heute `confirmation_token`) |
| unsubscribed_at | timestamptz null | statt Löschen (Bounce-/Rechtsnachweis) |
| source | text null | `/go`-Code der Anmeldung (D-27 Warm-100 messbar) |
| created_at | timestamptz | |

**Weg:** `tier` (B2B tot, D-23), `categories/category_scores/has_kids` (ein Newsletter für alle),
`referral_*`, `lat/lng/region` (Datensparsamkeit).

### 2.6 `ne_issues` — Tagesausgabe (die Tages-Sperre)

| Spalte | Typ | Zweck |
|---|---|---|
| for_date | date PK | **ein Versand pro Tag, erzwungen durch den PK** |
| story_id | uuid FK ne_stories | |
| index_value, index_date | numeric null, date null | der „eine Index-Satz" im Newsletter (aus `ne_index_snapshots`) |
| status | text check (sending, sent, skipped, failed) | |
| recipients, sent_count, error | int, int, text | |
| started_at, finished_at | timestamptz | |

`insert into ne_issues (for_date, status) values (today,'sending') on conflict do nothing returning for_date`
— keine Zeile zurück = heute schon gelaufen → 200 `{skipped}`. Backup-Crons damit erstmals gefahrlos
(Vorfall 2026-07-25, `workers/newsletter-cron/wrangler.toml`).

### 2.7 `ne_sends` — Versand je Empfänger

| Spalte | Typ | Zweck |
|---|---|---|
| id | bigint identity PK | |
| for_date | date FK ne_issues | |
| subscriber_id | uuid FK ne_subscribers | |
| story_id | uuid | |
| brevo_message_id | text null | |
| status | text check (sent, bounced, failed) | |
| opened_at, clicked_at | timestamptz null | per Brevo-Webhook |

Unique `(for_date, subscriber_id)` — zweite Versandschleife am selben Tag ist ein No-op.

### 2.8 `ne_index_snapshots` — Langzeitindex-Stand

| Spalte | Typ | Zweck |
|---|---|---|
| id | bigint identity PK | |
| index_version | text | Präregistrierung v1.2 |
| data_year | smallint | letztes Datenjahr |
| value, robustness, coverage | numeric, numeric, numeric | die eine Zahl + ihre Bausteine (D-05) |
| components | jsonb | Domänenwerte |
| built_at, source_commit | timestamptz, text | Commit der `langzeitindex.json` |

Der Langzeitindex-Job schreibt hier **nicht** (bleibt secret-frei, §19.3); die Pipeline liest
`src/lib/data/langzeitindex.json` und legt bei Änderung einen Snapshot an — D-26 („fällt der
Index, ist das die Titelmeldung") braucht den Vorgängerwert.

### 2.9 `ne_runs` — Lauf-Protokoll mit Kosten

| Spalte | Typ | Zweck |
|---|---|---|
| id | bigint identity PK | |
| kind | text check (pipeline, agent_redakteur, agent_bildpruefer, newsletter, import, healthcheck) | |
| parent_id | bigint FK ne_runs null | Agenten-Läufe hängen am Pipeline-Lauf |
| status | text check (running, ok, partial, failed, skipped) | |
| started_at, finished_at | timestamptz | |
| model | text null | z. B. `claude-sonnet-…`, `deepseek-chat` |
| cost_usd | numeric(8,4) | **`total_cost_usd` aus `claude -p --output-format json`**; DeepSeek/fal aus Tokens × Preis |
| input_tokens, output_tokens | int | |
| metrics | jsonb | `{fetched, prefiltered:{grund:n}, extracted, candidates, published, images}` |
| error | text | |

Index: `(kind, started_at desc)`. Ersetzt `nureine_ai_runs` (`00043`), `nureine_fetch_log`
(16.175 Zeilen Rauschen → nur Aggregat in `metrics`), `nureine_cron_runs`, `nureine_team_board`.

### 2.10 `ne_events` — Attribution (klein)

`id, name check (go_click, signup, confirm), code text, path text, day date, created_at`.
Nur für `/go` (ÜBERNEHMEN) und den Warm-100-Nachweis (D-27). Kein Pageview-Tracking
(macht Vercel Analytics). Index `(day, name)`.

### 2.11 RLS-Grundsatz

| Tabelle | anon (Public-Key) | service role |
|---|---|---|
| `ne_stories` | `select where status='published' and duplicate_of is null` | alles |
| `ne_evidence` | `select` nur via Join auf veröffentlichte Story (Policy mit `exists`) | alles |
| `ne_places`, `ne_index_snapshots` | `select` | alles |
| `ne_sources` | `select where active` (für `/methodik`-Quellenliste) | alles |
| alle anderen | **nichts** | alles |

Keine `insert`-Policy für anon (heute hat `nureine_story_submissions` eine — entfällt).
Anmeldung/Abmeldung/Webhook laufen über Server-Endpunkte mit Service Role
(`src/lib/server/db.ts`), wie CLAUDE.md es heute schon vorschreibt.

### 2.12 Import-Mapping (echte Spalten aus `supabase/migrations/00003, 00006, 00015, 00019–00048`)

| Alt `nureine_stories` | Neu | Regel |
|---|---|---|
| id | ne_stories.id | **unverändert** |
| title, subtitle, summary, body_markdown | title, subtitle, summary, body | |
| source_url, source_name | source_url, source_id | `ne_sources` per Name anlegen (`kind='rss'`, `active=false` falls nicht mehr im Feed-Set) |
| category, sensitive, duplicate_of, published_at, created_at | gleich | |
| impact_score/_reach/_durability/_evidence, impact_explainer | gleich | `impact_reach` ist seit `00016` bigint |
| region, region_code, lat, lng, place_name, place_context, place_scope | ne_places | nur wenn `place_scope in (neighbourhood, city, region)` → Zeile mit `precision` (neighbourhood→exact, city→city, region→region), `resolved_by='legacy'`; sonst `place_id=null` (**kein Land-Pin aus geratenen lat/lng** — heute `lat ?? 50, lng ?? 10` in `queries.ts:153`) |
| image_url | image_path | Datei aus Export neu kodieren (<150 KB), hochladen, Pfad speichern; ohne Datei → null (Typo-Karte) |
| newsletter_sent_at | hero_date | `::date`; Kollision (zwei Stories am selben Tag) → jüngere behält, ältere `null` |
| is_hero, og_image_url, og_image_srcset, emotion, ig_*, wa_*, slides, kid_*, share_hook, resonance_*, res_*, tiktok_video_url, beat, source_type, dach_relevanz, reading_time_min | — | verworfen |
| — | status | `published` wenn `impact_score >= 55` und `duplicate_of is null`; sonst `rejected` (bleibt für FK/Slug-Historie, nicht öffentlich) |
| — | evidence_level, judged_by | `legacy`, `human` |

| Alt `nureine_subscribers` | Neu | Regel |
|---|---|---|
| id, email, name, confirmed, confirmed_at, signup_ip, created_at | gleich | |
| confirmation_token | token | |
| tier | — | nur `tier='free'` importieren (B2B tot) |
| categories, category_scores, preferences_updated_at, has_kids, referral_*, lat, lng, region, region_code | — | verworfen |

`nureine_newsletter_sends` (1.462) → `ne_sends` + je Tag eine `ne_issues`-Zeile (`status='sent'`).
`nureine_events` (6.848) und `nureine_fetch_log` (16.175): **nicht** importieren (Aggregate in `wiki/00-LAGE.md`).

## 3. Pipeline (eine Nacht, ein Prozess)

Grundsatz D-24: deterministische Vorarbeit im Code, Urteil im Agenten. Ein Prozess
`python -m pipeline.run nightly`, ein `ne_runs`-Eintrag, Kinder für Agenten.

| # | Schritt | Code / Agent | Input | Output | Fehlerverhalten | Kosten/Nacht |
|---|---|---|---|---|---|---|
| 1 | Quellen laden | Code | `ne_sources where active` | Liste nach `priority` | 0 Quellen → `failed`, Mail, Ende | 0 |
| 2 | Feeds holen | Code (feedparser; Scraper für `kind='scraper'`) | URLs | Einträge | je Quelle `fail_count++`, weiter; 5 Fehltage → `active=false` + Hinweis in `metrics` | 0 |
| 3 | Hartes Dedupe | Code | `source_url` normalisiert (Tracking-Parameter weg) | neue Einträge | Treffer → skip | 0 |
| 4 | Vorfilter | Code | Titel | skip + Grund | Gründe zählen in `metrics.prefiltered` | 0 |
| 5 | Volltext | Code (trafilatura) | URL | Text ≤ 6.000 Zeichen | Fehlschlag → RSS-Beschreibung | 0 |
| 6 | Extraktion | **DeepSeek** (`deepseek-chat`, JSON-Modus, Schema `candidate.json`) | Text + Quelle | `is_positive, title_de, summary, category, impact_*, numbers[] {value, unit, quote}, source_urls[], place {label, country, precision_guess}` | 1 Retry, dann skip; Schema-Verletzung = skip | ~0,10–0,20 $ *(Schätzung: ≤110 Artikel × ~3k Tokens; Preisliste Stand 09/2026 prüfen)* |
| 7 | Gate | Code | Extrakt | `status='candidate'` | `impact < 55` → verworfen; Kernwort-Near-Dup gegen 7 Tage → `duplicate` | 0 |
| 8 | Beweis-Vorarbeit | Code | Kandidaten | `ne_evidence`-Zeilen `verified_by='code'` | URL nicht erreichbar → Zeile mit `http_status`, Kandidat bleibt; Zahl nicht in Quelle gefunden → `quote=null`, Flag | 0 (Nominatim/Geonames-Rate-Limit beachten) |
| 9 | **Urteil** | **Agent A „Redakteur"** (Claude) | ≤ 12 Kandidaten kompakt + Stimme-Kurzfassung | `verdict.json`: `hero_id`, Endtexte der Hero-Story, Beweis-Urteile (Zahl im Kontext, Orts-Label bestätigt/abgestuft), Ablehnungen mit Grund | Limit/Timeout → **Fallback**: Code nimmt Kandidat mit höchstem `impact_score ≥ 70` mit DeepSeek-Text, `judged_by='fallback'`, `evidence_level='none'`; kein Kandidat ≥ 70 → kein Hero („lieber leer als falsch") | 0,2–0,5 $ nominal *(Schätzung, Ziel)* |
| 10 | Bild | Code (fal Seedream v4.5, `max_images: 2`) | `image_prompt` nur für Hero | 2 Kandidatenbilder | Fehler → kein Bild | ~0,08 $ (0,04 $/Bild, `docs/AI_ROADMAP.md:27`) |
| 11 | Bildprüfung | **Agent B „Bildprüfer"** (Claude, Vision) | 2 Bilder + Titel + Checkliste | `{accept, index, reason}` | Ablehnung/Fehler → kein Bild (Typo-Karte) | ~0,05–0,10 $ nominal *(Schätzung)* |
| 12 | Veröffentlichen | Code | Verdict | `status='published'`, `hero_date`, `slug`, Bild <150 KB hochgeladen, `image_ai=true`, IndexNow-Ping | Transaktion; bei Fehler bleibt `candidate` | 0 |
| 13 | Newsletter | Vercel Cron → `/api/cron/newsletter` | `ne_issues`-Sperre, Hero des Tages, letzter Snapshot | Brevo-Versand, `ne_sends` | kein Hero → `status='skipped'`, keine Mail | 0 (Brevo Free 300/Tag) |
| 14 | Healthcheck | Vercel Cron → `/api/cron/healthcheck` (10:00) | `ne_issues` heute, `ne_runs` letzte Nacht, Storage-/Egress-Nutzung | Mail **nur** bei Problem | — | 0 |

**Summe Ziel: ~0,5–0,9 $ nominal/Nacht** (heute Ø 8 $ nominal für den Fetch allein, `wiki/00-LAGE.md`).
Der Schwellwert 55 und das Zwei-Stufen-Modell (55–74 ohne Bild, Hero bebildert) bleiben
(`scripts/fetch_stories.py:107–123`).

### 3.1 Steinbruch `scripts/fetch_stories.py` (2.861 Z.) — was taugt

| Übernehmen (portieren, nicht kopieren) | Zeile | Wohin |
|---|---|---|
| `_prefilter_entry` + die vier Musterlisten (negativ DE/EN, Fluff, Ratgeber, Positiv-Bypass) | 523, 434–521 | `prefilter.py` |
| `normalize_category` + `CATEGORY_ALIASES` | 434 | `extract.py` |
| `extract_article_text`, `_extract_trafilatura`, `_html_to_plain`, `_rss_content_field` | 1638–1795 | `fetch.py` |
| `scrape_source_entries` (HTML-Listen ohne RSS) | 1705 | `fetch.py` |
| `SOURCE_CONFIG` (Prioritäten/Limits je Quelle) | 171–226 | **Daten** → `ne_sources` |
| Kernwort-Near-Dup (Stoppwortliste, Schwelle 0,6) | 2477–2522 (inline in `run()`) | eigene Funktion in `dedupe.py` |
| `_compute_impact_score` (Fallback-Formel) | 1809 | `extract.py` |
| `parse_ai_response` (Code-Fence-Salvage) | 1835 | `extract.py` (mit JSON-Modus fast überflüssig) |
| `ANALYSIS_PROMPT_TEMPLATE` — nur Wertfundament, Todsünden, Titel/Untertitel/Summary/Body-Regeln, Impact-Definition | ~1200–1450 | `pipeline/agents/redakteur.md` (gekürzt) und DeepSeek-Prompt |
| `generate_image_fal`, `composite_on_canvas` | 1876, 2067 | `images.py` |
| `ping_indexnow` | 2187 | `publish.py` |
| `scripts/image_utils.py::encode_story_image` (1200 px, JPEG q85) | ganze Datei | `images.py` (+ harte Prüfung `len(bytes) < 150_000`, sonst q75) |

| Nicht übernehmen | Warum |
|---|---|
| `run()` (2238–2824, ~600 Z.) | Ein-Funktions-Monolith; Struktur wird Schrittkette |
| `call_claude`, `--export/--import`, `_prompt_hash`, `_IMPORT_CACHE` (851–934) | Umweg, damit der Agent das Analyse-Modell spielt — genau das kostet 8 $/Nacht |
| Audio (`generate_audio_elevenlabs`, `upload_audio_to_storage`, Edge Function, 697–835) | Vorlesen eingestellt (D-02), Bucket wird gekillt |
| `spool_story_sql`, `.agent-spool` | Workaround für den 402 |
| `generate_and_upload_image` Retry-/Vision-Judge-Kette (1944–2066) | wird durch Best-of-2 + Agent B ersetzt |
| IG/WA/Kinder/Slides-Felder im Prompt (1477–1600) | Social-Automatik gekillt (D-22), Familien-Feature nicht im Kern |
| `log_cron_run`, `log_fetch_decision` | ersetzt durch `ne_runs.metrics` |

## 4. Agenten-Architektur (D-24)

**Zwei Agenten, beide als reine Funktion:** Prompt rein (stdin), JSON raus (stdout). Kein
Repo-Zugriff, keine MCP-Server, keine Tools, kein Branch, kein Commit. Der Code (nicht der
Agent) schreibt in die DB — nach Schema-Validierung des Outputs.

| | Agent A „Redakteur" | Agent B „Bildprüfer" |
|---|---|---|
| Aufgabe | wählt die Story des Tages, schreibt ihre Endtexte in der NurEine-Stimme, urteilt über Beweise (Zahl im Kontext, Orts-Genauigkeit), lehnt ab mit Grund | wählt aus 2 Bildern oder lehnt beide ab (Anatomie, Text im Bild, Klischee, passt nicht zur Story) |
| Aufruf | `claude -p --model <sonnet> --output-format json --max-turns 1 --tools ""` auf dem Mini, OAuth-Token wie heute (`ops/run/agent.sh:run_claude`; die Flag-Namen für „keine Tools" gegen `claude --help` auf dem Mini prüfen — *zu verifizieren*) | gleich, Bilder als Dateipfade/Base64 im Prompt |
| Kontextbudget | **≤ 25k Input-Tokens**: `redakteur.md` ≤ 120 Z. + Stimme-Kurzfassung ≤ 80 Z. (destilliert aus `docs/STIMME.md`) + ≤ 12 Kandidaten × ≤ 900 Tokens (Titel, Summary, Zahlen+Zitate, Quellentyp, Ortskandidat, Impact-Teilwerte — **kein Volltext**) | ≤ 5k Tokens + 2 Bilder |
| Output-Vertrag | `pipeline/schemas/verdict.json` (pydantic-validiert); ungültig → 1 Wiederholung mit Fehlermeldung, dann Fallback (§3 Schritt 9) | `image_verdict.json` |
| Kosten je Lauf | `total_cost_usd`, `usage`, `duration_ms` aus der JSON-Antwort → `ne_runs` (`kind='agent_redakteur'`, `parent_id`) | ebenso |
| Abbruchregeln | `timeout 600`; Limit-Erkennung wie `classify_limit` (agent.sh) → **kein** Warten, sofort Fallback; `cost_usd > 1,50` → Lauf `partial` + Mail; 3 Nächte in Folge Fallback → Mail | `timeout 180`; Fehler → kein Bild |
| Modell | Sonnet als Standard (Textwahl aus 12 vorstrukturierten Kandidaten braucht kein Opus); Opus nur per Flag für A/B | Sonnet |

Warum billiger: Heute liest jeder Ketten-Agent `_nureine-team.md` (181 Z.) plus 3–4 Docs, fragt
das Team-Board per SQL, protokolliert per MCP, und der Fetch-Agent analysiert bis zu 110 Volltexte
selbst (`ops/prompts/fetch.md`, Schritt 3). Neu: 110 Artikel → DeepSeek, der Agent sieht nur das Destillat.

**Vergleich mit heute (`ops/prompts/`, 7 Prompts / 8 Rollen):**

| Heute | Neu | Warum |
|---|---|---|
| fetch (426 $ nominal seit 19.07.) | Code + DeepSeek | Klassifikation von 110 Artikeln ist keine Urteilsaufgabe |
| chefredakteur + redaktion (früher veredler + bildregie) | **Agent A** | eine Auswahl, ein Text, ein Lauf — heute drei Läufe mit drei Board-Übergaben |
| bildregie (in redaktion) | Code (fal) + **Agent B** | Generieren ist Code, Beurteilen ist Urteil |
| analyst | **entfällt** | Metriken sind SQL in `/admin`; „Verbesserungsvorschläge" ohne Umsetzer = Rollen-Theater (REBUILD-PLAN §5) |
| verbesserer | **entfällt** | 5 ungemergte Branches (`00-LAGE.md`); kein Agent erzeugt mehr Branches (D-24) |
| reel-regie | **entfällt bis Phase 2** (D-22) | wird als eigenes Modul neu aufgesetzt |
| Team-Board, `nureine_ai_runs`-Selbstprotokoll, Kontingent-Warteschleife (bis 4 h) | entfällt | ein Prozess kennt seinen Zustand; Warten auf Reset macht die Kette unvorhersagbar |

## 5. Cron / Jobs

| Wo | Eintrag | Zweck |
|---|---|---|
| Mac Mini `crontab` | `30 3 * * *  $HOME/nureine/ops/run.sh nightly` — **die einzige Zeile** | Pipeline §3 Schritte 1–12 (`run.sh`: `git pull --ff-only`, venv, env laden, `python -m pipeline.run nightly`, Log nach `~/nureine-logs/`) |
| GitHub Actions | `.github/workflows/langzeitindex.yml` — 1:1 (So 03:00 UTC) | Langzeitindex, secret-frei (§19.3). Bleibt auch **Fallback-Runner** für die Pipeline: `workflow_dispatch` mit Secrets, falls der Mini tagelang aus ist — Agenten-Schritte laufen dort nicht (kein OAuth-Token), Fallback-Pfad greift |
| Vercel Cron (`vercel.json` → `crons`) | `"40 4 * * *"` → `/api/cron/newsletter`; `"0 8 * * *"` → `/api/cron/healthcheck` | Newsletter 06:40 Berlin (Sommerzeit; Vercel-Crons laufen in UTC — Winter 05:40, bewusst hinnehmen oder zweimal jährlich anpassen) |

**Bewertung Vercel Cron statt Cloudflare Worker:** ein Anbieter, kein `wrangler`, kein zweites
Secret, Konfiguration im Repo. Hobby-Limits *(Stand meines Wissens — vor dem Bau verifizieren)*:
max. 2 Cron-Jobs, einmal täglich, stundengenau. Passt: zwei Jobs, einmal täglich, die Tages-Sperre
macht die Minute egal. Auth bleibt Bearer `CRON_SECRET`. Fällt Vercel aus, ist `curl` vom Mini
als zweiter Auslöser dank `ne_issues` gefahrlos.

**Idempotenz Newsletter (Pflicht):** `ne_issues`-PK (§2.6) + `ne_sends`-Unique (§2.7). Reihenfolge:
Sperre setzen → Hero laden → je Empfänger `insert ne_sends … on conflict do nothing` → nur bei
Insert senden → Issue abschließen. Zweiter Aufruf = No-op; abgebrochener Lauf wird **fortgesetzt**.

## 6. Bilder & Storage: Supabase Storage vs Cloudflare R2

| | Supabase Storage (Free) | Cloudflare R2 (Free) |
|---|---|---|
| Speicher | 1 GB | 10 GB |
| Egress | 5 GB/Monat (inkl. Cached Egress) — **Ursache des 4-Tage-Ausfalls 07/2026** | 0 € (kein Egress-Entgelt) |
| Bestand nach Import | 276 Bilder, heute 188 MB → nach `encode_story_image` **≤ 41 MB** (276 × <150 KB) | gleich |
| Zuwachs | 1–2 Bilder/Tag × 150 KB ≈ **≤ 9 MB/Monat** → 1 GB reicht > 8 Jahre | irrelevant |
| Egress-Last | `/img`-Proxy holt jedes Bild **einmal pro Variante** (CDN 1 Jahr, `src/routes/img/+server.ts`); worst case Erstaufwärmung 1.335 Stories × ~4 Varianten × 150 KB ≈ 0,8 GB **einmalig**, danach ~10 MB/Monat | 0 |
| Komplexität | ein Anbieter, Service-Key vorhanden, Storage-API im Code bekannt | zweiter Anbieter, S3-Credentials, Proxy-Allowlist (`ALLOWED_HOST`) anpassen, Bucket-Policy |

**Empfehlung: Supabase Storage**, R1–R4 (`docs/EFFIZIENZ_KONZEPT.md`) als Code-Invarianten:
R1 `image_path` ist ein Pfad, URL nur über `storyImageSrc()`; R2 `images.py` wirft bei >150 KB;
R3 OG-Bilder live gerendert (`/api/og/[slug]`), kein `og_images`-Bucket; R4 kein Reel-/Audio-Bucket
(bleiben im lokalen Export). Dazu ein **Wächter** im Healthcheck (Supabase-Management-API, Zugang
wie `sq.py`): Mail bei Egress > 3 GB oder Storage > 600 MB/Monat. Schlägt er zweimal an, ist R2
dran — dank Pfad-statt-URL ein Upload-Skript plus eine Zeile im Proxy. Bucket `story-images`
public (nur veröffentlichte Bilder, Proxy braucht keine signierten URLs).

## 7. Umzug

### 7.1 Import-Skripte (`pipeline/importer/`, gegen den lokalen Export)

| Schritt | Skript | Input | Prüfung |
|---|---|---|---|
| 0 | — | Export vollständig? `db/*.jsonl` je Tabelle, `schema/`, `storage/` | Zeilen zählen: stories 1.335, subscribers 22, sends 1.462; Storage 276/26/34 Dateien |
| 1 | `import_sources.py` | distinct `source_name` aus stories + `nureine_rss_sources.jsonl` | jede Story findet ihre Quelle |
| 2 | `import_stories.py` | `nureine_stories.jsonl` | Mapping §2.12; `slug` nach §7.2; Report: published/rejected/duplicate-Zahlen |
| 3 | `import_places.py` | Story-Ortsfelder | nur `place_scope in (neighbourhood, city, region)`; Zählung „Stories mit Ort" (Erwartung ~⅓) |
| 4 | `import_images.py` | `storage/story_images/*` | nur referenzierte Dateien; `encode_story_image`; Pfad `stories/<uuid>.jpg`; Größe < 150 KB; Summe ≤ 41 MB |
| 5 | `import_subscribers.py` | `nureine_subscribers.jsonl` | 22 Zeilen, `tier='free'`; unbestätigte älter als 30 Tage **nicht** importieren (DSGVO, Datensparsamkeit) → Zahl im Report |
| 6 | `import_sends.py` | `nureine_newsletter_sends.jsonl` | `ne_issues` je Tag + `ne_sends`; Öffnungsquote stimmt mit `00-LAGE.md` (~30 %) überein |
| 7 | `verify.py` | neue DB | 20 zufällige Alt-Slugs lösen auf; `/img` liefert WebP; RLS: anon sieht 0 `candidate/rejected`-Zeilen |

Alle Skripte idempotent (`on conflict do update` auf id): Testlauf in Phase 2, Final-Delta in Phase 3.

### 7.2 Slug-Schema und Redirects

Heute wird der Slug **berechnet**: `slugify(title) + '-' + id.slice(0, 8)` (`src/lib/server/queries.ts:144–156`),
aufgelöst über den 8-Hex-Präfix (`getStoryBySlug`, Z. 457). **Festlegung:** gleiches Format, aber
**gespeichert** in `ne_stories.slug` (unique). Weil die UUIDs übernommen werden, bleibt jeder heutige
`/geschichte/<slug>` **ohne Redirect-Tabelle** gültig; Route heißt weiter `/geschichte/[slug]`.
Auflösung: exakter Treffer, sonst Präfix-Suche + 301 auf den gespeicherten Slug. Getötete Routen
(`/heute`, `/gute-nachrichten/*`, `/app`, `/preise`, `/fuer-unternehmen`, `/roadmap`, `/manifest`, …):
**410 Gone**. `/go/[code]` bleibt 1:1, `www.`→Apex bleibt in `vercel.json`.

### 7.3 Reihenfolge (Phase 3, ein Vormittag)

| # | Schritt | Wer | Rollback |
|---|---|---|---|
| 1 | Neubau läuft seit ≥ 7 Nächten auf `nureine-v2.vercel.app` mit eigenem Cron **ohne** Newsletter-Versand (`NEWSLETTER_DRY_RUN=1` → schreibt `ne_issues`, sendet nicht) | Code | — |
| 2 | Alt-Newsletter des Tages ist um 06:40 raus (Cutover danach, REBUILD-PLAN §3) | — | — |
| 3 | Alt-Crontab auf dem Mini leeren (`crontab -r`, vorher `crontab -l > alt.txt`) | Aaron/SSH | `crontab alt.txt` |
| 4 | Cloudflare Worker löschen (`wrangler delete`) | Aaron | Worker-Code liegt im Alt-Repo |
| 5 | Final-Import (Delta: Stories/Abonnenten seit Test-Import) | Code | Import ist idempotent |
| 6 | Vercel: Domain `nureine.de` vom Alt-Projekt lösen, ans neue hängen; Env prüfen (`CRON_SECRET`, Brevo, Supabase neu, `FAL_KEY`, `DEEPSEEK_API_KEY`) | Aaron | Domain zurückhängen (Minuten) |
| 7 | `NEWSLETTER_DRY_RUN` entfernen; Smoke-Test `POST /api/cron/newsletter` mit Testliste | Code | Env zurück |
| 8 | Brevo-Webhook-URL bleibt gleich (Domain), Secret prüfen | Aaron | — |
| 9 | Repo `nureine-v2` → `nureine` umbenennen; Alt-Repo → `nureine-legacy`, archiviert; Mini-Klonpfad umstellen | Aaron | GitHub-Redirects greifen automatisch |
| 10 | 48 h beobachten (Healthcheck-Mail, GSC-Fehler, `ne_issues`) → dann Alt-Supabase pausieren, nach 30 Tagen löschen | Aaron | Restore aus Pause möglich |

**Rollback gesamt** bis Schritt 10: Domain zurück, `crontab alt.txt`, Worker neu deployen — das
Altsystem ist bis dahin unangetastet (D-28).

## 8. Kosten-Blatt neu

| Dienst | Plan | €/Monat | Anmerkung |
|---|---|---|---|
| Vercel | Hobby | 0 | Crons, Analytics inklusive |
| Supabase „nureine" | Free | 0 | 500 MB DB (Bedarf ~20 MB), 1 GB Storage (≤ 50 MB), 5 GB Egress |
| Brevo | Free | 0 | 300 Mails/Tag; reicht bis ~250 Abonnenten |
| DeepSeek | API | ~3–6 | 0,10–0,20 $/Nacht *(Schätzung)* |
| fal.ai Seedream v4.5 | API | ~2–3 | 2 Bilder/Nacht × 0,04 $ |
| GitHub | Free | 0 | Actions für den Index (öffentliches Repo? → sonst 2.000 Min/Monat Free, reicht) |
| Domain nureine.de | — | ~1 | 10 €/Jahr (`/admin/kosten`-Konstante) |
| Cloudflare | nur DNS | 0 | Worker entfällt |
| Claude Max | bestehend | (100 $, nicht NurEine-spezifisch) | Agenten laufen über OAuth; nominal ≤ 0,6 $/Nacht statt 8 $ |
| ElevenLabs | Free/bestehend | 0 | Stimme „Luca" bleibt für D-22 Phase 2; heute Creator-Tarif? → **prüfen, ggf. auf Free** |
| **Summe bar** | | **~6–10 €** | Ziel < 20 € eingehalten; heute ~15 $ + Max-Kontingent |

## 9. Risiken (Top 5)

| # | Risiko | Gegenmaßnahme |
|---|---|---|
| 1 | **Egress/Storage reißt wieder** (07/2026: 4 Tage offline) | R1–R4 als Code-Invarianten (§6), Import komprimiert, Wächter im Healthcheck mit Schwellen 3 GB / 600 MB, keine Reel-/Audio-Buckets |
| 2 | **Claude-Max-Limits** (5-h-/Wochenlimit) treffen den Nachtlauf | Agenten sind optional: Fallback-Pfad ohne Agent (§3 Schritt 9), kein Warten; Kosten sichtbar in `ne_runs`; Sonnet statt Opus |
| 3 | **Doppelversand/Aussetzer beim Cutover** | `ne_issues`-Sperre vor jedem Versand, Dry-Run-Woche, Cutover nach dem 06:40-Versand, Worker erst löschen, dann Domain umhängen |
| 4 | **Import-Qualität**: 1.335 Alt-Stories ohne Beweis-Schicht, ~⅓ mit echtem Ort, Aggregator-Zahlen teils falsch | `evidence_level='legacy'` → keine Badges, kein Karten-Pin ohne `place_scope`; Beweis-Schicht nur für neue Stories behauptet; Methodikseite sagt das |
| 5 | **Scope-Kriechen in Phase 2** (Feature-Museum wächst nach) | Repo-Layout §1 ist die Allowlist; jede neue Route braucht SEO-Pflichtblock (Memory `nureine-seo-checkliste-pflicht`) und einen Eintrag in REBUILD-PLAN §1 |

## 10. Entscheidungen für den CEO

| # | Frage | Empfehlung |
|---|---|---|
| T-1 | Storage: Supabase oder R2? | **Supabase** jetzt, R2 erst bei zweimaligem Wächter-Alarm (§6) |
| T-2 | Newsletter-Scheduler: Vercel Cron oder Mini? | **Vercel Cron** primär (Hobby-Limits vorher verifizieren), Mini-`curl` als zweiter Auslöser — gefahrlos dank Sperre |
| T-3 | Agenten-Modell: Sonnet oder Opus für den Redakteur? | **Sonnet** als Standard, Opus per Flag für einen 7-Nächte-Vergleich; Kosten stehen in `ne_runs` |
| T-4 | Alt-Stories: alle 1.335 veröffentlichen oder nur `impact ≥ 55`? | **nur ≥ 55 und keine Dublette** als `published` (Rest `rejected`, Slug bleibt reserviert) — konsistent mit dem heutigen Archiv-Filter |
| T-5 | Route `/geschichte/[slug]` behalten oder umbenennen (`/heute/…`)? | **behalten** — null Redirects, 132 Besucher/4 Wochen hängen daran |
| T-6 | Getötete Routen: 410 oder 301 auf `/`? | **410** |
| T-7 | Unbestätigte Abonnenten (6) importieren? | nur jünger als 30 Tage; Rest fällt weg |
| T-8 | Healthcheck als Vercel Cron (2. Job) oder im Mini-Lauf? | **Vercel** — prüft unabhängig vom Mini, und der Mini bleibt bei einer Zeile |

## Human-TODO-Kandidaten (nur Aaron)

- Supabase-Projekt „nureine" anlegen (Free, eu-central-1); Keys (`URL`, `ANON`, `SERVICE`, `ACCESS_TOKEN`) in `.env` des neuen Repos und in Vercel (prod/preview) eintragen.
- Vercel-Projekt für `nureine-v2` anlegen, Env setzen (`CRON_SECRET` neu erzeugen, Brevo-Keys, `FAL_KEY`, `DEEPSEEK_API_KEY`, `PUBLIC_BASE_URL`).
- Export „MustSeen" abschließen und Zahlen bestätigen (1.335 / 22 / 1.462; Storage 276 / 26 / 34); Alt-Projekt erst nach §7.3 Schritt 10 pausieren.
- Mini: neues Repo klonen, `ops/env.runner` mit OAuth-Token (`claude setup-token`) anlegen, `claude --help` auf verfügbare Flags prüfen (`--tools`, `--max-turns`, Budget-Flag).
- Vercel-Hobby-Cron-Limits in der Doku nachsehen (Anzahl, Frequenz) — 5 Minuten.
- Cutover-Tag: Cloudflare Worker löschen, Domain umhängen, Alt-Crontab sichern und leeren.
- Brevo: SPF/DKIM/DMARC (offen seit Juni, `wiki/HUMAN-TODO.md`) — vor dem Cutover, sonst startet der Neubau mit demselben Zustellrisiko.
- ElevenLabs-Tarif prüfen (Free reicht bis Phase 2), fal.ai-Lizenz bestätigen.
- GitHub: `nureine-v2` → `nureine`, Alt-Repo → `nureine-legacy` (archiviert).
