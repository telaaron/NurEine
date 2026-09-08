# Rohinventar Technik — Stand 2026-09-08

> Erhoben durch einen Lese-Agenten am 2026-09-08. Fakten mit Beleg, keine Bewertung.
> Bewertung (kill / übernehmen / neu) steht in `wiki/REBUILD-PLAN.md`.
>
> **Korrektur zu allen Aussagen über nicht laufende Cronjobs:** Am 2026-09-08 per
> `ssh mini 'crontab -l'` verifiziert — **alle 17 Jobs aus `ops/crontab.txt` sind auf
> dem Mac Mini installiert und laufen** (Logs unter `~/nureine-logs/`, letzter Lauf
> heute). Die Aussage „18 Jobs nie installiert" (VISION E-07, mehrere Docs) stammt
> aus einem `crontab -l` auf dem MacBook, nicht auf dem Mini.

# Technisches Inventar — NurEine

Repo: `/Volumes/SSD 500G/offloaded/home/aaronpfutzner/Dateien - Local/NurEine`
Branch: `main` · Letzter Commit: **2026-09-08** (`50df95c fix(reel): Beleg-Szene fehlte`)
Erhebungsdatum: 2026-09-08 · Methode: nur lesend (`git log`, `wc -l`, `du -sh`, `grep`, `find`)

Vision-Bezug (VISION.md §1 und §17): Zielbild ist die "vertrauenswürdige Verbindung zum
realen Zustand der Welt" — tägliche Story bleibt Einstieg, dazu Karte, Index, Belegbarkeit.
§17 (D-12, 2026-09-01) hat den Index vom **Fortschrittsindex zum Zustandsbild** gedreht:
Richtung ist in keiner Phase mehr Auswahlkriterium. VISION.md §0 nennt als Ist-Werte:
15 bestätigte Newsletter-Abonnenten, 1294 Geschichten in der DB, 50 Roadmap-Einträge,
iOS-App gebaut aber nicht im App Store.

**Status-Legende:** live = referenziert + aktiver Trigger (Cron/Workflow/Nav) ·
tot = kein aktiver Trigger und/oder keine eingehende Referenz · unklar = Beleg nicht eindeutig.

---

## 1. Öffentliche Routen (`src/routes` ohne admin/api)

Zeilen = Summe aller Dateien im Routen-Ordner (`+page.svelte` + `+page.server.ts`).
"Refs" = Dateien ausserhalb des eigenen Ordners, die den Pfad nennen (`grep -rl` über src/).

| Name | Zweck (1 Satz) | Code-Pfad | Abhängigkeiten / Dienste | Status-Indiz | Zeilen |
|---|---|---|---|---|---|
| `/` (Startseite) | Tagesstory + Einstieg, Hero der Website. | `src/routes/+page.svelte` + `+page.server.ts` | Supabase (queries.ts) | live — Commit 2026-08-29 (svelte) / 2026-07-09 (server), Root-Route | 720 |
| Layout | Globales Layout, `pathDescriptions` für Meta-Tags aller Seiten. | `src/routes/+layout.svelte` | Vercel Analytics | live — Commit 2026-09-03 | 246 |
| `/app/*` | Eigene App-Oberfläche (v2): Ritual-Reader, Himmel, Welt, Kurve, Ausgabe, Start. | `src/routes/app/` | Supabase, `src/lib/app-v2/*`, localStorage | live — Commit 2026-08-26, 15 Refs; Capacitor-Build-Target | 1095 |
| `/archiv` (+ `/[kategorie]`, `/alle`) | Archiv aller Geschichten, nach Kategorie und vollständig. | `src/routes/archiv/` | Supabase, `/api/archiv-suche` | live — Commit 2026-08-24, 14 Refs, 3× in sitemap.xml | 429 |
| `/auth/ig-callback` | OAuth-Rückkanal für Instagram/Meta-Token. | `src/routes/auth/ig-callback/` | Meta Graph API | unklar — Commit 2026-07-24, nur als OAuth-Redirect erreichbar | 58 |
| `/bei-dir` | Lokalbezug: Geschichten in der Nähe des Nutzers. | `src/routes/bei-dir/` | Supabase, ip-api.com (Geo), `src/lib/geo.ts` | live — Commit **2026-09-02**, 13 Refs, in sitemap | 968 |
| `/datenschutz` | Datenschutzerklärung. | `src/routes/datenschutz/` | — | live — Commit 2026-08-25 | 100 |
| `/einreichen` | Formular: Nutzer reichen Geschichten ein. | `src/routes/einreichen/` | `/api/submit-story` → Supabase | live — Commit 2026-07-30, 4 Refs, in sitemap | 127 |
| `/einstellungen` | Nutzereinstellungen (Newsletter-Präferenzen). | `src/routes/einstellungen/` | `/api/preferences`, Supabase | live — Commit 2026-08-26, 5 Refs; **nicht** in sitemap | 259 |
| `/fuer-unternehmen` | B2B-Landingpage (White-Label-Newsletter). | `src/routes/fuer-unternehmen/` | `src/lib/b2b-content.ts` | unklar — Commit 2026-07-30, 4 Refs, **nicht** in sitemap | 212 |
| `/geschichte/[slug]` | Einzelne Geschichte, Detailseite (SEO-Kanonisch). | `src/routes/geschichte/[slug]/` | Supabase, OG-API | live — Commit 2026-08-26 | 547 |
| `/go` | Kurz-Redirect (Server-Route, kein `+page`). | `src/routes/go/+server.ts` | — | unklar — Commit 2026-06-23, älteste öffentliche Route | 66 |
| `/gute-nachrichten/[thema]` | SEO-Themenseiten (programmatic). | `src/routes/gute-nachrichten/[thema]/` | Supabase, `src/lib/categories.ts` | live — Commit 2026-07-30, in sitemap | 232 |
| `/gute-nachrichten/land/[land]` | SEO-Länderseiten (programmatic). | `.../land/[land]/` | Supabase, `src/lib/place.ts` | live — Commit 2026-07-30 | (in 232 enthalten) |
| `/gute-nachrichten-app` | SEO-Landingpage für die iOS-App. | `src/routes/gute-nachrichten-app/` | — | live — Commit 2026-07-30, 4 Refs, in sitemap | 144 |
| `/heute` | Ausgabe des Tages. | `src/routes/heute/` | Supabase | **unklar/tot-Indiz** — Commit 2026-07-30, nur **1 Ref**, **nicht** in sitemap | 156 |
| `/img` | Bild-Proxy/-Resizer (Server-Route). | `src/routes/img/+server.ts` | Supabase Storage | unklar — Commit 2026-07-16 | 51 |
| `/impressum` | Impressum. | `src/routes/impressum/` | — | live — Commit 2026-07-30 | 70 |
| `/karte` | Weltkarte der Geschichten (Vision §1: "Karte"). | `src/routes/karte/` | Supabase, `src/lib/map/*`, ArcGIS-Basemap (server.arcgisonline.com) | live — Commit **2026-09-02**, 9 Refs, in sitemap | 596 |
| `/lichtblick` | Vorgänger-/Schwesterprodukt "Lichtblick". | `src/routes/lichtblick/` | Supabase (`lichtblick_*`-Tabellen) | **tot-Indiz** — Commit 2026-07-30, nur **2 Refs**, **nicht** in sitemap | 178 |
| `/llms.txt` | Maschinenlesbare Site-Beschreibung für LLM-Crawler (GEO). | `src/routes/llms.txt/+server.ts` | — | live — Commit **2026-09-03** (jüngste öffentliche Route) | 75 |
| `/lokal` | Redirect-Stub Richtung Lokal-/Bei-dir-Funktion. | `src/routes/lokal/+server.ts` | — | unklar — Commit 2026-07-30, 13 Zeilen (Stub) | 13 |
| `/manifest` | Manifest-Text (Haltung/Selbstverpflichtung). | `src/routes/manifest/` | — | live — Commit 2026-07-20, 6 Refs, in sitemap | 208 |
| `/methodik` | Methodenseite — Belegbarkeit (Vision §16.8: die drei Sätze). | `src/routes/methodik/` | — | live — Commit 2026-08-29, **17 Refs** (meistverlinkte Seite), in sitemap | 110 |
| `/news-sitemap.xml` | Google-News-Sitemap. | `src/routes/news-sitemap.xml/+server.ts` | Supabase | live — Commit 2026-07-25 | 99 |
| `/newsletter` | Newsletter-Anmeldeseite. | `src/routes/newsletter/` | `/api/subscribe` → Brevo | live — Commit 2026-07-24, **22 Refs** (meistreferenziert), in sitemap | 283 |
| `/nutzungsbedingungen` | AGB / Nutzungsbedingungen. | `src/routes/nutzungsbedingungen/` | — | live — Commit 2026-07-30 | 68 |
| `/og-preview/[slug]` | Interne Vorschau der OG-Bilder. | `src/routes/og-preview/[slug]/` | `/api/og/[slug]` | **tot-Indiz** — Commit 2026-08-14, **1 Ref**, **nicht** in sitemap (Debug-Tool) | 265 |
| `/preise` | Preis-/Tarifseite. | `src/routes/preise/` | — | unklar — Commit 2026-07-24, 4 Refs, in sitemap; Migration `00010_remove_plus_tier.sql` entfernte Tier | 412 |
| `/r` | Referral-Redirect. | `src/routes/r/+server.ts` | `src/lib/referral.ts`, Supabase | unklar — Commit 2026-08-01 | 69 |
| `/redaktion` | Öffentliche Redaktions-/Auswahl-Erklärung. | `src/routes/redaktion/` | Supabase | live — Commit 2026-07-30, 6 Refs, in sitemap | 172 |
| `/roadmap` | Öffentliche Roadmap (VISION.md §0: 50 Einträge). | `src/routes/roadmap/` | Supabase (`nureine_changelog`, `nureine_roadmap_feedback`) | live — Commit 2026-07-30, 5 Refs, in sitemap | 181 |
| `/robots.txt` | robots.txt. | `src/routes/robots.txt/+server.ts` | — | live — Commit 2026-08-20 | 67 |
| `/share/[slug]` | Teilen-Landing für geteilte Geschichten. | `src/routes/share/[slug]/` | Supabase, share-card-API | live — Commit 2026-07-24, 10 Refs; **nicht** in sitemap (gewollt) | 95 |
| `/sitemap.xml` | Sitemap-Generator. | `src/routes/sitemap.xml/+server.ts` | Supabase | live — Commit 2026-08-24 | 108 |
| `/stand-der-welt` | **Zustandsbild-Index (Vision §17 Kernstück)** — eine Zahl + Dashboard. | `src/routes/stand-der-welt/` | `src/lib/data/langzeitindex.json`, `src/lib/world-index.ts`, Weltbank-Daten | live — Commit **2026-09-03**, 9 Refs, in sitemap; gespeist vom einzigen aktiven Workflow | 875 |
| `/teilen` | Teilen-/Weitersagen-Seite. | `src/routes/teilen/` | share-card-APIs | live — Commit 2026-07-30, 7 Refs, in sitemap | 210 |
| `/ueber-uns` | Über-uns-Seite. | `src/routes/ueber-uns/` | — | live — Commit 2026-08-29, 4 Refs, in sitemap | 284 |
| `/unterstuetzer` | Unterstützer-/Förderer-Seite. | `src/routes/unterstuetzer/` | Supabase | unklar — Commit 2026-07-30, **3 Refs**, in sitemap | 76 |
| `/warum` | Begründungsseite ("Warum NurEine"). | `src/routes/warum/` | Supabase | live — Commit 2026-08-29, 8 Refs, in sitemap | 335 |
| `/werte` | Sieben universelle Fortschrittsbereiche (Human-Flourishing). | `src/routes/werte/` | — | live — Commit 2026-08-29, 9 Refs, in sitemap | 145 |

**Summe öffentliche Routen: 41 Routen-Ordner + 3 Root-Dateien.**

---

## 2. Admin-Routen (`src/routes/admin/*`) — **20 Unterseiten + 1 Root + Layout**

| Name | Zweck (3 Wörter) | Letzter Commit | Zeilen |
|---|---|---|---|
| `/admin` (Root) | Übersicht, Dashboard-Einstieg | 2026-08-14 | — |
| `/admin/audience` | Abonnenten, Zielgruppen-Auswertung | 2026-07-24 | 270 |
| `/admin/audio` | TTS-Vertonung verwalten | 2026-07-24 | 368 |
| `/admin/b2b` | B2B-Kunden verwalten | 2026-06-11 | 691 |
| `/admin/delivery` | Zustellung, Versand-Protokoll | 2026-06-11 | 140 |
| `/admin/impact` | Wirkungs-Scores prüfen | 2026-07-24 | 546 |
| `/admin/impact/history` | Impact-Läufe, Historie | 2026-07-24 | 72 |
| `/admin/ki` | KI-Läufe, Qualitätssystem | **2026-09-02** | 337 |
| `/admin/kosten` | Kosten-Übersicht, Budget | 2026-08-05 | 306 |
| `/admin/login` | Anmeldung, Passkey-Login | 2026-08-14 | 244 |
| `/admin/newsletter` | Newsletter-Versand steuern | 2026-08-01 | 184 |
| `/admin/redaktion` | Redaktionspipeline, Freigaben | 2026-06-11 | 227 |
| `/admin/sicherheit` | Passkeys, Sicherheitseinstellungen | 2026-08-14 | 109 |
| `/admin/social` | Social-Posts, Warteschlange | 2026-07-24 | 325 |
| `/admin/social/preview` | Social-Vorschau, Bildprüfung | 2026-07-01 | 199 |
| `/admin/stories` | Geschichten-Liste, Übersicht | 2026-08-14 | 46 |
| `/admin/stories/[id]/edit` | Geschichte bearbeiten | 2026-07-24 | 426 |
| `/admin/stories/new` | Neue Geschichte anlegen | 2026-06-11 | 337 |
| `/admin/submissions` | Nutzer-Einreichungen prüfen | 2026-06-11 | 65 |
| `/admin/tiktok` | TikTok-Captions, Videos | **2026-09-02** | 574 |
| `/admin/vision` | VISION.md bearbeiten | **2026-09-03** | 524 |

**Abhängigkeiten Admin gesamt:** Supabase (Service-Key), `ADMIN_USERNAME`/`ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET`, WebAuthn/Passkeys (`nureine_admin_passkeys`, `nureine_webauthn_challenges`).

---

## 3. API-Routen (`src/routes/api/*`) — **55 Endpunkte**

### 3a. Cron-Endpunkte (13) — alle Bearer `CRON_SECRET`

| Name | Zweck | Code-Pfad | Dienste | Status-Indiz | Zeilen |
|---|---|---|---|---|---|
| `/api/cron/newsletter` | Täglichen Newsletter versenden. | `api/cron/newsletter/+server.ts` | Brevo, Supabase | **live** — getriggert von Cloudflare Worker, Cron `40 4 * * *` | 42 |
| `/api/cron/social-publish` | Fertige Social-Posts veröffentlichen. | `.../social-publish/` | Meta Graph API | **live** — ops/crontab.txt `30 7 * * *` | 29 |
| `/api/cron/social-generate` | Social-Posts generieren. | `.../social-generate/` | Supabase, DeepSeek | **live** — crontab `15 8 * * *` | 29 |
| `/api/cron/highlight` | Highlight-Mail auslösen. | `.../highlight/` | Brevo | **live** — crontab `30 8 * * *` | 31 |
| `/api/cron/indexnow` | IndexNow-Ping an Bing/Yandex. | `.../indexnow/` | api.indexnow.org | **live** — crontab `15 9 * * *` (`{"recent":50}`) | 99 |
| `/api/cron/social-threads` | Threads-Posts veröffentlichen. | `.../social-threads/` | graph.threads.net | **live** — crontab `15 10 * * *` | 24 |
| `/api/cron/social-insights` | Reichweiten-Kennzahlen holen. | `.../social-insights/` | Meta Graph API | **live** — crontab `0 0 * * *` | 28 |
| `/api/cron/social-comments` | Kommentare abrufen/beantworten. | `.../social-comments/` | Meta Graph API | **live** — crontab `30 9,13,17,21 * * *` (4×/Tag) | 24 |
| `/api/cron/social-story` | IG-Story posten. | `.../social-story/` | Meta Graph API | **live** — crontab `0 9-23 * * *` (stündlich) | 25 |
| `/api/cron/social-digest` | Wochen-Digest posten. | `.../social-digest/` | Meta Graph API | **live** — crontab `30 17 * * 0` (sonntags) | 30 |
| `/api/cron/world-newsletter` | Monatlicher Welt-Newsletter. | `.../world-newsletter/` | Brevo, Supabase | **live** — crontab `20 8 1 * *` | 38 |
| `/api/cron/push` | iOS-Push (Morgen-Lichtblick). | `.../push/` | APNs (`APNS_*`) | **tot-Indiz** — Commit 2026-06-18, **kein** Eintrag in crontab.txt, **kein** Workflow | 40 |
| `/api/cron/curation-reminder` | Erinnerung an offene Kuration. | `.../curation-reminder/` | Brevo | **tot-Indiz** — Commit 2026-07-08, **kein** Cron-Eintrag, **kein** Workflow | 29 |
| `/api/cron/social-reel-select` | Reel für den Tag auswählen. | `.../social-reel-select/` | Supabase | unklar — Commit 2026-07-06, kein direkter Crontab-Eintrag; Reel-Regie-Agent 08:00 könnte greifen | 71 |

### 3b. Öffentliche/Nutzer-APIs (17)

| Name | Zweck | Code-Pfad | Dienste | Status-Indiz | Zeilen |
|---|---|---|---|---|---|
| `/api/subscribe` | Newsletter-Anmeldung mit Double-Opt-in. | `api/subscribe/` | Brevo, Supabase | live — Commit 2026-06-04, von `/newsletter` genutzt | 293 |
| `/api/confirm` | Opt-in-Bestätigung. | `api/confirm/` | Brevo, Supabase | live — Commit 2026-06-04 | 240 |
| `/api/unsubscribe` | Abmeldung. | `api/unsubscribe/` | Supabase | live — Commit 2026-06-03 | 175 |
| `/api/preferences` | Newsletter-Präferenzen setzen. | `api/preferences/` | Supabase | live — von `/einstellungen` genutzt | 59 |
| `/api/submit-story` | Nutzer-Einreichung speichern. | `api/submit-story/` | Supabase | live — von `/einreichen` genutzt | 56 |
| `/api/feedback` | Feedback / Roadmap-Votes. | `api/feedback/` | Supabase (`nureine_feedback`) | live — Commit 2026-06-11 | 68 |
| `/api/track` | Event-Tracking (eigene Analytik). | `api/track/` | Supabase (`nureine_events`) | live — `src/lib/track.ts` | 56 |
| `/api/archiv-suche` | Volltextsuche im Archiv. | `api/archiv-suche/` | Supabase | live — Commit **2026-08-24** | 23 |
| `/api/stories` | Story-Liste (JSON). | `api/stories/` | Supabase | live — Commit 2026-06-19 | 67 |
| `/api/stories/[id]` | Einzelne Story (JSON). | `api/stories/[id]/` | Supabase | live | 54 |
| `/api/stats` | Kennzahlen-Endpunkt. | `api/stats/` | Supabase | **tot-Indiz** — Commit **2026-05-06** (ältester Endpunkt), **6 Zeilen** | 6 |
| `/api/app/register-token` | APNs-Device-Token registrieren. | `api/app/register-token/` | Supabase (`nureine_device_tokens`) | unklar — Commit 2026-06-18, Gegenstück zum toten push-Cron | 48 |
| `/api/auth/login` | Admin-Login (Passwort). | `api/auth/login/` | `ADMIN_PASSWORD` | live | 29 |
| `/api/auth/logout` | Admin-Logout. | `api/auth/logout/` | — | live | 9 |
| `/api/auth/passkey/register-begin` | Passkey-Registrierung starten. | `.../register-begin/` | WebAuthn | live — Commit 2026-08-14 | 14 |
| `/api/auth/passkey/register-finish` | Passkey-Registrierung abschliessen. | `.../register-finish/` | WebAuthn | live — Commit 2026-08-14 | 20 |
| `/api/auth/passkey/auth-begin` | Passkey-Login starten. | `.../auth-begin/` | WebAuthn | live — Commit 2026-08-14 | 10 |
| `/api/auth/passkey/auth-finish` | Passkey-Login abschliessen. | `.../auth-finish/` | WebAuthn | live — Commit 2026-08-14 | 21 |
| `/api/webhooks/brevo` | Brevo-Webhook (Bounces, Öffnungen). | `api/webhooks/brevo/` | Brevo, `BREVO_WEBHOOK_SECRET` | live — Commit 2026-07-13 | 104 |

### 3c. Bild-/Karten-Generatoren (9) — alle über `src/lib/server/og/*`

| Name | Zweck | Code-Pfad | Status-Indiz | Zeilen |
|---|---|---|---|---|
| `/api/og/[slug]` | OG-Bild pro Geschichte. | `api/og/[slug]/` | live — Commit 2026-07-16 | 114 |
| `/api/share-card/[slug]` | Teil-Karte (IG-Story-Stil). | `api/share-card/[slug]/` | live — Commit 2026-07-11 | 77 |
| `/api/wa-card/[slug]` | WhatsApp-Karte. | `api/wa-card/[slug]/` | live — Commit 2026-07-10 | 59 |
| `/api/carousel/[slug]/[n]` | IG-Karussell-Einzelbild. | `api/carousel/[slug]/[n]/` | live — Commit 2026-07-01 | 118 |
| `/api/digest/[n]` | Digest-Karte (Wochenrückblick). | `api/digest/[n]/` | live — Commit 2026-07-01 | 119 |
| `/api/edition-card` | Ausgabe-Karte. | `api/edition-card/` | live — Commit 2026-08-05 | 112 |
| `/api/recommend-card` | Empfehlungs-Karte. | `api/recommend-card/` | unklar — Commit 2026-06-11 | 93 |
| `/api/banner` | Banner-Bild. | `api/banner/` | unklar — Commit 2026-07-24 | 45 |
| `/api/reel-frame/[slug]/[frame]` | Einzelbild eines Reels. | `api/reel-frame/[slug]/[frame]/` | live — Commit 2026-07-01 | 117 |
| `/api/reel-data/[slug]` | Reel-Daten als JSON (für Remotion). | `api/reel-data/[slug]/` | live — Commit 2026-07-06 | 27 |

### 3d. Admin-APIs (10)

| Name | Zweck | Letzter Commit | Zeilen |
|---|---|---|---|
| `/api/admin/audio` | TTS-Steuerung. | 2026-06-12 | 22 |
| `/api/admin/b2b` | B2B-Kundenliste. | 2026-06-04 | 18 |
| `/api/admin/b2b/[id]` | Einzelner B2B-Kunde. | 2026-06-04 | 43 |
| `/api/admin/b2b/[id]/welcome` | B2B-Willkommensmail. | 2026-06-04 | 243 |
| `/api/admin/health` | Systemzustand. | 2026-06-11 | 57 |
| `/api/admin/impact` | Impact-Bewertung anstossen. | 2026-06-27 | 98 |
| `/api/admin/social` | Social-Warteschlange. | 2026-06-13 | 94 |
| `/api/admin/stories/[id]/generate-audio` | Audio für Story erzeugen (ElevenLabs). | 2026-06-11 | 240 |
| `/api/admin/submissions` | Einreichungen verwalten. | 2026-06-05 | 62 |
| `/api/admin/subscribers/delete` | Abonnent löschen (DSGVO). | **2026-05-24** | 24 |
| `/api/newsletter/test` | Testversand. | 2026-06-04 | 41 |

**Auffällig:** Der gesamte Block 3d + 3b(auth/subscribe/confirm) ist seit **Juni 2026**
unverändert — die API-Schicht ist der älteste Teil des Codes.

---

## 4. Python-Scripts (`scripts/*.py`) — **31 Dateien, 10.143 Zeilen**

| Name | Zweck | Zeilen | Letzter Commit | In crontab.txt? | In Workflow? |
|---|---|---|---|---|---|
| `fetch_stories.py` | RSS holen, vorfiltern, exportieren/importieren — Herz der Redaktionspipeline. | **2861** | **2026-09-03** | **nein** (indirekt via `ops/run/agent.sh fetch`, `10 3 * * *`) | `fetch-stories.yml` (**Schedule auskommentiert**) |
| `generate_og_images.py` | OG-Bilder für alle Geschichten erzeugen. | 770 | 2026-06-04 | erwähnt, aber **als DEPRECATED markiert, kein Cron** | `generate-og-images.yml` (nur `workflow_dispatch`) |
| `image_quality.py` | Bildqualität prüfen/bewerten. | 719 | **2026-09-02** | nein | nein |
| `regenerate_all_images.py` | Alle Bilder neu erzeugen (Massenlauf). | 527 | 2026-07-16 | nein | nein |
| `index_build.py` | **Langzeitindex/Zustandsbild bauen** (Vision §17). | 510 | **2026-09-03** | nein | `langzeitindex.yml` (**Schedule AKTIV**, `0 3 * * 0`) |
| `backfill_images.py` | Fehlende Bilder nachziehen. | 439 | 2026-07-16 | nein | nein |
| `resolve_places.py` | Ortsnamen → Koordinaten (für die Karte). | 401 | 2026-08-05 | nein | `fetch-stories.yml` (Schedule aus) |
| `_test_new_og_real_story.py` | Testskript OG-Design mit echter Story. | 304 | 2026-06-02 | nein | nein |
| `regen_images.py` | Bilder neu erzeugen (Teilmenge). | 299 | 2026-07-16 | nein | nein |
| `reprocess_images.py` | Bilder nachverarbeiten. | 298 | 2026-07-16 | nein | nein |
| `render_reel.py` | Reel rendern. | 282 | 2026-07-01 | nein | nein (Reel läuft über `render-reel.yml` + remotion) |
| `fetch_worldbank.py` | Weltbank-Indikatoren holen. | 255 | 2026-08-26 | **ja** — `30 7 * * 1` (montags) | `fetch-worldbank.yml` (Schedule aus) |
| `_test_new_og_design.py` | Testskript OG-Design. | 245 | 2026-06-02 | nein | nein |
| `storage_purge.py` | Supabase-Storage aufräumen. | 244 | 2026-08-10 | nein | nein |
| `test_one_image.py` | Einzelbild-Test. | 242 | 2026-07-16 | nein | nein |
| `generate_fallback_images.py` | Fallback-Bilder erzeugen. | 219 | 2026-05-27 | nein | nein |
| `send_comeback_mail.py` | Reaktivierungsmail an inaktive Abonnenten. | 210 | 2026-07-24 | nein | nein |
| `generate_assets.py` | Marken-Assets erzeugen. | 193 | 2026-05-08 | nein | nein |
| `spool_flush.py` | Agent-Spool (`.agent-spool/`) abarbeiten. | 183 | 2026-07-24 | nein | nein |
| `gen_reel_assets.py` | Reel-Assets (Hintergründe, Figuren) erzeugen. | 179 | 2026-08-28 | nein | nein |
| `fetch_world_metrics.py` | Welt-Kennzahlen holen (Vorläufer von fetch_worldbank). | 148 | 2026-06-05 | **ja** — `0 7 1 * *` (1. d. Monats) | `fetch-world-metrics.yml` (Schedule aus) |
| `generate_default_og.py` | Standard-OG-Bild. | 136 | 2026-06-01 | nein | nein |
| `test_bildstil.py` | Bildstil testen. | 123 | 2026-08-20 | nein | nein |
| `vision_sync.py` | VISION.md ↔ `nureine_vision`-Tabelle synchronisieren. | 122 | **2026-09-03** | nein | nein (von `/admin/vision` genutzt) |
| `debug_logo.py` | Logo-Debughilfe. | 82 | 2026-05-08 | nein | nein |
| `analyze_svg.py` | SVG analysieren. | 55 | 2026-05-08 | nein | nein |
| `extract_logo_proper.py` | Logo aus Quelldatei extrahieren. | 51 | 2026-05-08 | nein | nein |
| `image_utils.py` | Bild-Hilfsfunktionen (Modul, kein Job). | 46 | 2026-07-16 | — (Import) | — |

**Weitere (nicht .py):** `seed.ts` (48.554 Bytes, Commit 2026-05-06),
`backfill_breakdown.mjs`, `rescore_impact.mjs`, `app-prebuild.mjs`, `app-postbuild.mjs`
(letztere beide **live** — in `package.json` `build:app`).

**Kernbefund:** Nur **3 von 31** Python-Skripten haben einen aktiven Auslöser
(`fetch_stories.py` indirekt via Agent-Kette, `fetch_worldbank.py` + `fetch_world_metrics.py` via crontab,
`index_build.py` via GitHub Actions). **~15 Skripte sind Bild-Pipeline-Varianten ohne jeden Trigger.**

---

## 5. GitHub Workflows (`.github/workflows`) — **16 Dateien**

| Name | Zweck | Schedule | Status-Indiz | Letzter Commit |
|---|---|---|---|---|
| `langzeitindex.yml` | Zustandsbild-Index wöchentlich neu bauen und committen. | **AKTIV** `0 3 * * 0` | **live — einziger aktiver Schedule im ganzen Repo** | **2026-09-03** |
| `fetch-stories.yml` | Story-Fetch als GitHub-Fallback. | **auskommentiert** (`# schedule:` Z.9) | tot — nur `workflow_dispatch` | 2026-08-05 |
| `fetch-world-metrics.yml` | Welt-Kennzahlen holen. | **auskommentiert** (Z.7) | tot — auf crontab.txt verlagert | 2026-07-26 |
| `fetch-worldbank.yml` | Weltbank-Daten holen. | **auskommentiert** (Z.10) | tot — auf crontab.txt verlagert | 2026-07-26 |
| `generate-og-images.yml` | OG-Bilder erzeugen. | **kein `schedule:`-Block** | tot — nur `workflow_dispatch`, Skript als DEPRECATED markiert | 2026-06-05 |
| `highlight-email.yml` | Highlight-Mail. | **auskommentiert** (Z.10) | tot — auf crontab.txt verlagert | 2026-07-26 |
| `indexnow-ping.yml` | IndexNow-Ping. | **auskommentiert** (Z.12) | tot — auf crontab.txt verlagert | 2026-07-26 |
| `render-reel.yml` | Reel rendern (Remotion). | **auskommentiert** (Z.15) | tot — 5.795 Bytes, grösster Workflow | 2026-07-31 |
| `social-comments.yml` | Kommentare. | **auskommentiert** (Z.9) | tot — auf crontab.txt verlagert | 2026-07-26 |
| `social-digest.yml` | Wochen-Digest. | **auskommentiert** (Z.11) | tot | 2026-07-26 |
| `social-generate.yml` | Social-Posts generieren. | **auskommentiert** (Z.9) | tot | 2026-07-26 |
| `social-insights.yml` | Reichweiten holen. | **auskommentiert** (Z.9) | tot | 2026-07-26 |
| `social-publish.yml` | Social veröffentlichen. | **auskommentiert** (Z.9) | tot | 2026-07-26 |
| `social-story.yml` | IG-Story. | **auskommentiert** (Z.9) | tot | 2026-07-26 |
| `social-threads.yml` | Threads-Post. | **auskommentiert** (Z.8) | tot | 2026-07-26 |
| `world-newsletter.yml` | Monats-Newsletter. | **auskommentiert** (Z.7) | tot | 2026-07-26 |

**Beleg für den Bruch:** 12 der 16 Workflows wurden am **selben Tag (2026-07-26)**
deaktiviert — das ist der dokumentierte Umzug auf den Mac-Mini-Runner (ops/crontab.txt
sagt dazu: "Ursprüngliche Workflow-Zeiten waren UTC -> hier +2h auf CEST umgerechnet").
`langzeitindex.yml` begründet die Ausnahme im Kommentar selbst: *"Bewusst GitHub Actions
statt Mac-Mini: Der Index braucht keinen Zugriff auf Supabase, keine Secrets... Damit
läuft er auch dann, wenn der Mini aus ist oder Supabase 402 liefert."*

---

## 6. `ops/` — Mac-Mini-Runner

### 6a. Skripte und Dateien

| Name | Zweck | Pfad | Status-Indiz | Grösse |
|---|---|---|---|---|
| `run/agent.sh` | Claude-Agenten starten, Kette weiterreichen (`next_in_chain`). | `ops/run/agent.sh` | live — Herz der Nacht-Kette | (976 Z. gesamt ops/*.sh) |
| `run/trigger.sh` | Thin-Trigger: `curl` auf `/api/cron/*` mit Bearer. | `ops/run/trigger.sh` | live — 9 Crontab-Einträge nutzen es | — |
| `run/pyjob.sh` | Python-Job in venv ausführen. | `ops/run/pyjob.sh` | live — 2 Crontab-Einträge | — |
| `run/selfupdate.sh` | Git pull + Zustand nach `ops/state/` schreiben. | `ops/run/selfupdate.sh` | live — 3×/Tag | — |
| `run/healthcheck.sh` | Pipeline prüfen, Mail nur bei Problemen. | `ops/run/healthcheck.sh` | live — täglich 10:00 | — |
| `run/reel-watchdog.sh` | Reel-Lauf überwachen. | `ops/run/reel-watchdog.sh` | **unklar** — **kein** Crontab-Eintrag | — |
| `install-cron.sh` | Crontab installieren. | `ops/install-cron.sh` | live — Commit **2026-09-08** (jüngste Datei im Repo) | 3.541 B |
| `setup.sh` | Mini-Ersteinrichtung. | `ops/setup.sh` | unklar — Commit 2026-07-13 | 3.566 B |
| `wt` | Worktree-Helfer. | `ops/wt` | live — Commit 2026-09-03 | 5.946 B |
| `RUNBOOK.md` | Betriebshandbuch. | `ops/RUNBOOK.md` | live — 19.254 B, Commit 2026-08-29 | — |
| `MAC_MINI_SETUP.md` | Einrichtung Mac Mini. | `ops/MAC_MINI_SETUP.md` | Commit 2026-07-14 | 7.210 B |
| `prompts/` | 7 Agenten-Prompts + README + Team-Datei. | `ops/prompts/` | live — Commit bis 2026-09-08 | — |
| `state/` | Zustandsberichte des Mini (`mac-mini-server.md`). | `ops/state/` | live — 2026-09-03 | — |
| `tts-service/` | TTS-Dienst. | `ops/tts-service/` | unklar — Commit 2026-07-30 | — |
| `wikidata/` | Wikidata-Hilfsmittel. | `ops/wikidata/` | unklar — Commit 2026-07-30 | — |
| `env.runner.example` | Env-Vorlage für den Runner. | `ops/env.runner.example` | — | 577 B |

**Agenten-Prompts (7):** `fetch.md`, `chefredakteur.md`, `redaktion.md`, `analyst.md`,
`reel-regie.md`, `verbesserer.md`, `_nureine-team.md`.

### 6b. Crontab-Jobs (`ops/crontab.txt`, 4.160 B, Commit 2026-08-22) — **17 Einträge**

| Zeit (Europe/Berlin) | Job | Art |
|---|---|---|
| `10 3 * * *` | `agent.sh fetch` → **startet die Kette** fetch → chefredakteur → redaktion → analyst | Claude-Agent |
| `0 8 * * *` | `agent.sh reel-regie` — TikTok-Master täglich, Mo/Mi/Fr zusätzlich IG-Reel | Claude-Agent |
| `17 10 * * *` | `agent.sh verbesserer` — **setzt Verbesserungs-Ideen selbstständig im Code um (Branch+Commit)** | Claude-Agent |
| `30 6,13,21 * * *` | `selfupdate.sh` — 3×/Tag | Fernwartung |
| `0 10 * * *` | `healthcheck.sh` | Fernwartung |
| `30 7 * * *` | `trigger.sh social-publish` | Thin-Trigger |
| `15 8 * * *` | `trigger.sh social-generate` | Thin-Trigger |
| `30 8 * * *` | `trigger.sh highlight` | Thin-Trigger |
| `15 9 * * *` | `trigger.sh indexnow '{"recent":50}'` | Thin-Trigger |
| `15 10 * * *` | `trigger.sh social-threads` | Thin-Trigger |
| `0 0 * * *` | `trigger.sh social-insights` | Thin-Trigger |
| `30 9,13,17,21 * * *` | `trigger.sh social-comments` (4×/Tag) | Thin-Trigger |
| `0 9-23 * * *` | `trigger.sh social-story` (**15× täglich, stündlich**) | Thin-Trigger |
| `30 17 * * 0` | `trigger.sh social-digest` (sonntags) | Thin-Trigger |
| `0 7 1 * *` | `pyjob.sh scripts/fetch_world_metrics.py` (1. d. Monats) | Compute |
| `30 7 * * 1` | `pyjob.sh fetch_worldbank.py --cwd scripts` (montags) | Compute |
| `20 8 1 * *` | `trigger.sh world-newsletter` (1. d. Monats) | Thin-Trigger |
| — | `generate-og-images` als **DEPRECATED (kein Cron)** vermerkt | — |

**Dokumentierter Vorfall (im Crontab-Kommentar):** Am 2026-08-03 lief die Redaktion
inhaltsleer durch, weil sie startete, bevor der Chefredakteur Perlen genehmigt hatte.
Seitdem verkettet sich die Nacht-Kette selbst statt an geratenen Uhrzeiten zu hängen.
Gemessene Laufzeiten: fetch ~23 Min, chefredakteur ~3, redaktion ~10, analyst ~5.

---

## 7. Cloudflare Workers (`workers/`) — **1 Worker**

| Name | Zweck | Code-Pfad | Abhängigkeiten / Secrets | Status-Indiz | Zeilen |
|---|---|---|---|---|---|
| `nureine-newsletter-cron` | Ruft täglich 04:40 UTC `https://nureine.de/api/cron/newsletter` mit Bearer auf. | `workers/newsletter-cron/src/index.ts` | `CRON_SECRET` (via `wrangler secret put`), `TARGET_URL` | **live** — `crons = ["40 4 * * *"]` in `wrangler.toml`, kein `#` davor | 78 |

Letzter Commit `workers/`: **2026-07-25**. `node_modules` liegt eingecheckt/vorhanden im Ordner.

**Dokumentierter Vorfall (wrangler.toml-Kommentar):** Der frühere Backup-Cron um 05:40
verschickte einen **zweiten** Newsletter — Nutzer bekamen zwei Mails mit verschiedenen
Stories. Ursache: `sendDailyNewsletter()` hat **keine Tages-Sperre**; `selectNewsletterStory()`
überspringt die schon gesendete Story und nimmt einfach die nächste. Backup-Cron am
2026-07-25 entfernt. **Der Endpunkt ist bis heute nicht idempotent.**

---

## 8. Supabase

| Grösse | Wert | Beleg |
|---|---|---|
| Migrationen | **55 Dateien** | `ls supabase/migrations \| wc -l` |
| Nummerierung | `00001`–`00052`, aber **3 Doppelvergaben**: `00016` (impact_reach_bigint + og_image_srcset), `00047` (team_board + tiktok_video_url), `00048` (newsletter_clicks + story_place) | Dateiliste |
| Letzte Migration | `00052_ai_runs_zombie_watchdog.sql`, Commit **2026-09-03** | `git log -1` |
| Tabellen (`CREATE TABLE`) | **29** | grep über Migrationen |
| Views | 3 | `CREATE VIEW`-grep |
| Edge Functions | **1**: `generate-audio` (133 Zeilen), Commit **2026-06-10** | `supabase/functions/` |
| Storage-Buckets (im Code) | **1 belegbar: `story_reels`** (`storage.from('story_reels')`); Bild-Buckets werden über Signed URLs/Umgebungsvariablen angesprochen — **unklar** | grep `storage…from(` |

**Tabellen-Namen (29):**

*NurEine-Kern (`nureine_*`, 17):* `nureine_b2b_clients`, `nureine_changelog`,
`nureine_curation_queue`, `nureine_delivery_log`, `nureine_device_tokens`, `nureine_events`,
`nureine_feedback`, `nureine_fetch_log`, `nureine_impact_runs`, `nureine_newsletter_clicks`,
`nureine_social_posts`, `nureine_story_submissions`, `nureine_team_board`, `nureine_vision`,
`nureine_world_metrics`, `nureine_admin_passkeys`, `nureine_webauthn_challenges`

*Unpräfixiert (6):* `stories`, `subscribers`, `rss_sources`, `newsletter_sends`, `cron_runs`,
(+ Rest aus `00001_schema.sql`)

*Lichtblick-Altbestand (6):* `lichtblick_stories`, `lichtblick_subscribers`,
`lichtblick_rss_sources`, `lichtblick_newsletter_sends`, `lichtblick_cron_runs`

**Befund:** Drei Namensschemata parallel (`lichtblick_*`, unpräfixiert, `nureine_*`).
Migration `00004_cleanup_unprefixed.sql` und `00005_rename_to_dosiert.sql` belegen zwei
frühere, unvollständige Umbenennungswellen — inkl. eines Zwischennamens "dosiert".
Zusätzlich liegt eine **lokale SQLite-DB** in `data/lichtblick.db` (Commit 2026-05-06).

---

## 9. Sonstige Top-Level-Ordner

| Name | Zweck | Grösse | Dateien | Letzter Commit | Status-Indiz |
|---|---|---|---|---|---|
| `remotion` | Video-/Reel-Rendering (ReelDaily, ReelTikTok), 9 Story-Pläne, TTS-Skripte, eigene `.venv-tts` + `node_modules`. | **764 MB** | 10.414 | **2026-09-08** (jüngster Commit des Repos) | **live** — aber `render-reel.yml` Schedule aus; Auslöser ist `agent.sh reel-regie` 08:00 |
| `out` | Ausgabeordner: `langzeitindex/`, `reels-tag7-10/`. | 10 MB | 6 | 2026-09-03 | Artefakte, nicht in `.gitignore` |
| `ios` | Capacitor-iOS-Projekt (`App`, Cordova-Plugins, `debug.xcconfig`). | 7,2 MB | 162 | **2026-06-19** | unklar — VISION.md §0: "gebaut, **nicht** im App Store" |
| `build-app` | Build-Artefakt des App-Targets (`_app`, `index.html`, OG-Bilder). | 6,9 MB | 129 | **kein Commit** | **untracked** — steht in `.gitignore` |
| `brand` | Zwei Icon-Dateien (`nureine-icon.png`, `-source-uncropped.png`). | 3,1 MB | 2 | 2026-06-25 | ruhend |
| `test-output` | Bildvergleiche einer Mangroven-Story (Methode A/B/C), `comparison.html`. | 2,7 MB | 20 | **kein Commit** | **untracked** — `/test-output` in `.gitignore`; Dateien vom **2026-05-26** |
| `ios-native` | Zweiter, nativer iOS-Ansatz: `NurEine/`, `PLAN.md`, `SETUP.md`. | 1,9 MB | 45 | **2026-07-21** | unklar — **parallel zu `ios/`**, jünger als das Capacitor-Projekt |
| `media` | 1 PNG + 3 HTML-Mockups (`mockup-homepage.html`, `-v3.html`, `font-compare.html`). | 304 KB | 4 | 2026-06-04 | ruhend — `media/*.png` in `.gitignore` |
| `data` | **SQLite-Datei** `lichtblick.db` (+ `-shm`, `-wal`). | 124 KB | 3 | **2026-05-06** | tot-Indiz — ältester Ordner, Lichtblick-Altbestand |
| `nureine-impact` | **Nur Markdown, kein Code**: `CONSTITUTION.md`, `SOURCES.md`, `RESONANCE.md`, `ROUTINE.md`, `BACKFILL.md`, `README.md`. | 48 KB | 6 | 2026-06-28 | Dokumentation, kein ausführbarer Teil |
| `capacitor.config.ts` | Capacitor-Konfiguration (Bundle `de.nureine.app`). | 976 B | 1 | 2026-06-18 | live — `pnpm app:sync` in `package.json` |

---

## 10. `src/lib` — **101 Dateien, ~24.000 Zeilen**

### 10a. Module nach Ordner

| Ordner | Zweck | Dateien | Zeilen | Letzter Commit |
|---|---|---|---|---|
| `src/lib/server` | Server-Logik: Queries, Newsletter, Social, OG-Bilder, Auth, Push. | 41 | **18.299** | **2026-09-08** |
| `src/lib/components` | Svelte-Komponenten der Website (Header, Footer, StoryCard, Archiv-Ansichten). | 23 | 2.330 | 2026-08-26 |
| `src/lib/app-v2` | App-Oberfläche v2: Ritual-Reader, Kurven, Himmel, Sammlung. | 9 | 1.984 | 2026-08-26 |
| `src/lib/sound` | Klang-Engine für die App. | 3 | 434 | 2026-08-26 |
| `src/lib/app` | App-Brücke v1: `native.ts`, `api.ts`. | 4 | 347 | **2026-06-19** |
| `src/lib/map` | Karten-Bausteine: Basemap, Glow-Marker, User-Marker. | 3 | 265 | 2026-09-02 |
| `src/lib/styles` | Globale Stile. | 1 | 142 | 2026-09-02 |
| `src/lib/data` | **`langzeitindex.json`** (12 KB) — vom Workflow committet. | 1 | 0 (JSON) | **2026-09-03** |

### 10b. Einzeldateien ab 200 Zeilen (14 Stück)

| Datei | Zweck | Zeilen |
|---|---|---|
| `src/lib/server/queries.ts` | **Zentrale Datenzugriffs-Schicht** — alle Supabase-Abfragen. | **1857** |
| `src/lib/server/newsletter.ts` | Newsletter-Aufbau und -Versand (Brevo); enthält `sendDailyNewsletter()` ohne Tages-Sperre. | **1539** |
| `src/lib/server/social/queue.ts` | Social-Warteschlange: planen, veröffentlichen, Meta-API. | **976** |
| `src/lib/app-v2/RitualReader.svelte` | Lese-Ritual der App (Kernbildschirm). | 666 |
| `src/lib/server/og/story-card.ts` | OG-Bild pro Geschichte rendern. | 507 |
| `src/lib/app-v2/CurveReader.svelte` | Kurven-/Indikator-Ansicht in der App. | 418 |
| `src/lib/server/og/carousel.ts` | IG-Karussell rendern. | 354 |
| `src/lib/server/fixtures/app-stories.ts` | **Fest verdrahtete Beispiel-Stories** für die App. | 330 |
| `src/lib/sound/engine.ts` | Klang-Engine. | 329 |
| `src/lib/server/social/tiktok-caption.ts` | TikTok-Bildunterschriften erzeugen. | 322 |
| `src/lib/app-v2/SkyView.svelte` | "Himmel" — Sammlung gelesener Geschichten. | 248 |
| `src/lib/server/og/reel-frames.ts` | Reel-Einzelbilder rendern. | 226 |
| `src/lib/components/StoryCard.svelte` | Story-Kachel. | 207 |
| `src/lib/server/og/digest.ts` | Digest-Karte rendern. | 198 |

### 10c. Kleinere Module (Auswahl, Zweck)

`world-index.ts` (167 — Index-Logik), `archive-timeline.ts` (168), `passkeys.ts` (172),
`app/native.ts` (172 — Capacitor-Brücke), `place.ts` (125 — Orte), `geo.ts` (121 — Geolokation),
`push.ts` (129 — APNs), `auth.ts` (99), `utils.ts` (96), `b2b-content.ts` (71),
`text-echo.ts` (84), `story-images.ts` (65), `categories.ts`, `readingStreak.ts`,
`referral.ts`, `referralTiers.ts`, `sensitive.ts`, `supabase.ts`, `tone-constants.ts`, `track.ts`.

**Befund:** `src/lib/server` allein macht **76 % aller lib-Zeilen** aus. Zwei Dateien
(`queries.ts` + `newsletter.ts`) sind zusammen **3.396 Zeilen** = 14 % des gesamten
TS+Svelte-Codes.

---

## 11. Externe Dienste (Beleg: `.env.example`, Code-Imports, `vercel.json`)

| Dienst | Wofür genutzt | Secret / Variable | Beleg |
|---|---|---|---|
| **Supabase** | Datenbank (29 Tabellen), Auth-Keys, Storage (`story_reels`), 1 Edge Function. | `SUPABASE_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` | `.env.example`, CSP in `vercel.json` |
| **Vercel** | Hosting der SvelteKit-App, Analytics. | (Projekt-Env) | `vercel.json`, `@sveltejs/adapter-vercel`, `va.vercel-scripts.com` in CSP |
| **Cloudflare Workers** | Ein Cron-Worker für den Newsletter-Trigger. | `CRON_SECRET` (wrangler secret) | `workers/newsletter-cron/wrangler.toml` |
| **Brevo** | Newsletter-Versand, Transaktionsmails, Webhooks (Bounces/Öffnungen). | `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_REPLY_TO_EMAIL`, `BREVO_WEBHOOK_SECRET` | `api.brevo.com` (7 Treffer im Code) |
| **Anthropic (Claude)** | Story-Analyse — **primär als lokale Claude-Code-Routine ohne API-Key**; API nur als Fallback. | `ANTHROPIC_API_KEY` (auskommentiert), `ANTHROPIC_MODEL` | `.env.example`-Kommentar, `api.anthropic.com` (1 Treffer) |
| **DeepSeek** | KI-Fallback für Analyse/Texte. | `DEEPSEEK_API_KEY` (**aktiv, nicht auskommentiert**) | `api.deepseek.com` (8 Treffer im Code) |
| **ElevenLabs** | TTS/Vorlesen (Free-Tier ~10k Zeichen/Monat). | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (Chris) | `api.elevenlabs.io` (5 Treffer) |
| **OpenAI** | `gpt-4o-mini-tts` als TTS-Fallback — **nur in Supabase-Edge-Function-Secrets**. | `OPENAI_API_KEY` (nicht in `.env`) | `.env.example`-Hinweis, `api.openai.com` |
| **fal.ai** | Bildgenerierung (FLUX.1 [pro]). | `FAL_KEY` | `api.fal.ai`, `remotion/scripts/gen-flux-backgrounds.mjs` |
| **Meta / Instagram / Facebook** | Auto-Posting IG-Feed, Story, Kommentare, Insights. | (OAuth-Token, siehe `auth/ig-callback`) | `graph.facebook.com` (7 Treffer), `instagram.com` (4) |
| **Threads (Meta)** | Auto-Posting Threads, separates Token. | `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN` (**beide leer** in `.env.example`) | `graph.threads.net` (2 Treffer) |
| **TikTok** | Reel-/Video-Veröffentlichung. | (unklar — kein Key in `.env.example`) | `/admin/tiktok`, `tiktok-caption.ts`, Migration `00045`, `00047_tiktok_video_url` |
| **Apple APNs** | iOS-Push (Morgen-Lichtblick). | `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_P8`, `APNS_BUNDLE_ID`, `APNS_PRODUCTION` (**alle leer**) | `.env.example`; Cron dazu hat keinen Trigger |
| **IndexNow (Bing/Yandex)** | Sofort-Indexierung neuer Geschichten. | `INDEXNOW_KEY` (**echter Wert im `.env.example` eingetragen**: `23c37d00…`) | `api.indexnow.org`, `static/<key>.txt`, `build-app/23c37d…txt` |
| **Weltbank API** | Indikatoren für Zustandsbild/Langzeitindex. | keins (öffentlich) | `data.worldbank.org` (13), `api.worldbank.org` (3) |
| **Our World in Data** | Zusatzdaten (Vision §17.5: OWID-Umweg entfällt teils). | keins | `ourworldindata.org` (2) |
| **Wikidata** | Ortsauflösung/Anreicherung. | keins | `www.wikidata.org` (2), `ops/wikidata/` |
| **Nominatim (OSM)** | Geocoding für die Karte. | keins | `nominatim.openstreetmap.org` (3) |
| **ArcGIS Online** | Karten-Basemap-Kacheln. | keins | `server.arcgisonline.com` — **einzige externe `img-src` in der CSP** |
| **ip-api.com** | IP-Geolokation für `/bei-dir`. | keins | in CSP `connect-src` freigeschaltet |
| **Slack** | Benachrichtigungen (Webhook). | (Webhook-URL) | `hooks.slack.com` (1 Treffer) |
| **Google Fonts** | Schriften. | keins | CSP `style-src`/`font-src` |
| **RSS-Quellen** | Story-Beschaffung (u.a. Mongabay, Good News Network, Perspective Daily). | keins | `news.mongabay.com` (3), `goodnewsnetwork.org` (2), `perspective-daily.de` (2), Tabelle `rss_sources` |
| **Admin-Zugang** | Login zum `/admin`-Bereich. | `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (leer) | `.env.example` |

**Anmerkung:** Eine unversionierte `.env` (2.673 B, 2026-08-03) liegt im Repo-Wurzelverzeichnis.
Inhalt wurde nicht gelesen.

---

## 12. Kennzahlen

| Kennzahl | Wert | Beleg |
|---|---|---|
| **TypeScript-Zeilen** (`src/**/*.ts`) | **17.081** | `find src -name "*.ts" \| xargs wc -l` |
| **Svelte-Zeilen** (`src/**/*.svelte`) | **18.354** | `find src -name "*.svelte" \| xargs wc -l` |
| **TS + Svelte gesamt** | **35.435** | Summe |
| **Python-Zeilen** (`scripts/*.py`) | **10.143** | `find scripts -name "*.py" \| xargs wc -l` |
| **Shell-Zeilen** (`ops/**/*.sh`) | **976** | `find ops -name "*.sh" \| xargs wc -l` |
| **Anwendungscode gesamt** | **~46.554** | ohne `remotion/`, `node_modules`, `ios*/` |
| **Öffentliche Routen** | 41 Ordner + 3 Root-Dateien | `find src/routes -maxdepth 1 -type d` |
| **Admin-Routen** | 20 Unterseiten + Root + Layout | `find src/routes/admin -type d` |
| **API-Routen** | **55** `+server.ts` | `find src/routes/api -name "+server.ts" \| wc -l` |
| ├─ davon Cron-Endpunkte | 13 (11 aktiv getriggert, 2 ohne Trigger) | crontab-Abgleich |
| ├─ davon Bild-Generatoren | 10 | `api/og`, `share-card`, `wa-card`, `carousel`, `digest`, `edition-card`, `recommend-card`, `banner`, `reel-frame`, `reel-data` |
| └─ davon Admin-APIs | 11 | `api/admin/*` + `api/newsletter/test` |
| **Routen gesamt (alle)** | **~118** | 41 + 20 + 55 + Sonderrouten |
| **Python-Scripts** | 31 (+ 4 `.mjs` + 1 `.ts`) | `ls scripts/` |
| ├─ mit aktivem Auslöser | **3** | `fetch_stories.py` (Agent-Kette), `fetch_worldbank.py`, `fetch_world_metrics.py` (crontab); `index_build.py` (Workflow) |
| └─ ohne jeden Auslöser | **~27** | crontab- + Workflow-Abgleich |
| **GitHub Workflows** | 16 | `ls .github/workflows/` |
| └─ mit **aktivem** Schedule | **1** (`langzeitindex.yml`) | grep `^\s*schedule:` |
| **Crontab-Jobs (Mac Mini)** | 17 | `ops/crontab.txt` |
| **Cloudflare Workers** | 1 (aktiver Cron) | `workers/newsletter-cron/wrangler.toml` |
| **Supabase-Migrationen** | 55 | `ls supabase/migrations \| wc -l` |
| **Supabase-Tabellen** | 29 | `CREATE TABLE`-grep |
| **Supabase Edge Functions** | 1 | `supabase/functions/` |
| **Storage-Buckets (belegbar)** | 1 (`story_reels`) | grep `storage…from(` |
| **`src/lib`-Dateien** | 101 | `find src/lib -type f` |
| **Externe Dienste** | 24 | Abschnitt 11 |
| **Markdown-Dokumente im Wurzelverzeichnis** | 19 (grösstes: `VISION.md`, 94.344 B) | `ls *.md` |
| **`remotion/`** | 764 MB, 10.414 Dateien | `du -sh remotion` |

### Zeitliche Verteilung (letzter Commit je Bereich)

| Zeitraum | Bereiche |
|---|---|
| **September 2026** (aktiv) | `remotion` (09-08), `ops/install-cron.sh` (09-08), `src/lib/server` (09-08), `/stand-der-welt` (09-03), `/llms.txt` (09-03), `index_build.py` (09-03), `vision_sync.py` (09-03), `/admin/vision` (09-03), `langzeitindex.yml` (09-03), Migrationen (09-03), `/karte` (09-02), `/bei-dir` (09-02), `/admin/tiktok` (09-02), `/admin/ki` (09-02), `image_quality.py` (09-02) |
| **August 2026** | `/warum`, `/werte`, `/ueber-uns`, `/methodik`, Startseite, `/archiv`, `/app`, `/einstellungen`, Passkeys, `fetch_worldbank.py` |
| **Juli 2026** | Grossteil der SEO-/Info-Seiten (2026-07-30), 12 Workflows deaktiviert (2026-07-26), Worker (07-25), `ios-native` (07-21), Bild-Pipeline-Skripte (07-16) |
| **Juni 2026 und älter** | Fast alle Admin-APIs, `ios/` (06-19), `supabase/functions` (06-10), `nureine-impact` (06-28), `data/` (**05-06**), `/api/stats` (**05-06**), `/api/admin/subscribers/delete` (05-24) |

