# Lage — Stand 2026-09-08 (CEO-Neustart)

> Alles hier ist am 2026-09-08 selbst gemessen (Supabase-REST, Vercel Analytics,
> Google Search Console, `ssh mini`). Keine Zahl aus alten Docs übernommen.

## Ist in Zahlen

| Größe | Wert | Quelle |
|---|---|---|
| Bestätigte Newsletter-Abonnenten | **16** (22 gesamt, 6 unbestätigt); Zugänge: 25.06., 13.07., 06.09. | `nureine_subscribers` |
| Newsletter-Öffnungen | 4–8 von 15–16 pro Tag (~30 %, fallend) | `nureine_newsletter_sends`, 25.08.–08.09. |
| Web-Besucher | 65–88 pro **Woche**; davon ~40 % Admin/Bots (Admin-Routen, Baidu) | Vercel Analytics 10.08.–07.09. |
| Meistbesucht | `/` 177, `/geschichte/*` 132, `/methodik` 12, `/archiv` 7, **`/karte` 7, `/stand-der-welt` 4** (je 4 Wochen) | Vercel |
| Google | **0 Klicks, ~15 Impressions in 28 Tagen** | GSC |
| Stories in DB | 1.330; 19 neue seit 01.09. (~2/Tag) | `nureine_stories` |
| Newsletter | läuft täglich, atomar (zuletzt 08.09. „Uganda hat seinen Ebola-Ausbruch gestoppt") | DB |
| Instagram (30 Tage) | 14 Posts, 60 Stories, 6 failed, 3 Entwürfe | `nureine_social_posts` |
| TikTok | 3 Posts / 30 Tage, manuell; **seit 11 Tagen still** | DB + Healthcheck-Mail |
| B2B-Kunden | 0 zahlend (Tabelle nicht lesbar über REST — Spaltenfehler) | — |
| Laufende Kosten | ~15 $/Monat bar (fal, DeepSeek, ElevenLabs); Vercel Hobby 0 €, Supabase Free 0 € | Docs 06/2026, Vercel-API |
| Claude-Verbrauch der Nacht-Agenten | **~776 $ nominal seit 19.07.** (Fetch allein 426 $, Ø 8 $/Nacht für Ø 1 Story) — läuft über das Max-Abo (OAuth-Token), nicht über API-Rechnung | Mini-Logs `total_cost_usd` |

## Betrieb — was wirklich läuft (verifiziert auf dem Mini)

- **Mac Mini** (`mac-mini-server`, Linux, up 56 Tage, `/home/aaron/NurEine`): **17 Cronjobs installiert und aktiv.**
  Nacht-Kette 03:10 fetch → chefredakteur → redaktion → analyst (Claude-Code-Agenten),
  08:00 reel-regie, 10:17 verbesserer, 10:00 healthcheck (Mail kommt an),
  dazu 11 Trigger gegen `nureine.de/api/cron/*` (social-publish/-generate/-story/
  -comments/-threads/-insights/-digest, highlight, indexnow, world-newsletter, worldbank).
- **Cloudflare Worker** feuert den Newsletter 04:40.
- **GitHub Actions:** 15 von 16 Schedules auskommentiert; nur `langzeitindex.yml` (So 03:00 UTC) aktiv.
- **Vercel** deployt `main` automatisch (Hobby-Plan).
- **Supabase** Projekt `gbfbhspqwaqvnoxitohd` — **geteilt mit vier fremden Produkten**
  (bridge_*, ledge_*, selah_*, websniper_*, travel-Tabellen): 123 REST-Endpunkte, davon 29 NurEine.

**Falsch überliefert (korrigiert 2026-09-08):** VISION E-07 und sechs Docs sagten
„18 Cronjobs nie installiert". Geprüft wurde auf dem MacBook. Auf dem Mini laufen sie.

## Betriebsprobleme (offen, nicht kritisch)

| Problem | Beleg | Bedeutung |
|---|---|---|
| Mini-Repo 16 Commits hinter `main`, ff nicht möglich (lokaler Zustands-Commit `070d5d4` divergiert) | Healthcheck 08.09. | Fixes vom 07./08.09. (Newsletter-Hero-Gate) sind auf dem Mini **nicht** aktiv |
| 5 ungemergte Verbesserer-Branches auf origin | `git branch -r --no-merged` | Der Verbesserer-Agent produziert täglich Arbeit, die niemand integriert |
| TikTok 11 Tage still, IG-Entwürfe stapeln sich | Healthcheck | Publish-Pfad braucht Hand; niemand bedient ihn |
| Newsletter-Endpunkt nicht idempotent (Tages-Sperre fehlt) | Kommentar in `workers/newsletter-cron/wrangler.toml` | Kein Backup-Cron möglich |
| Drei DB-Namensschemata (`lichtblick_*`, unpräfixiert, `nureine_*`), 3 doppelte Migrationsnummern, 2 nicht eingespielte Migrationen (00051, 00052) | Inventar | Schema-Drift ist Dauerzustand |
| `/private/tmp` läuft voll (ENOSPC) | Handover-Doc | sporadische Tool-Ausfälle |

## Diagnose in drei Sätzen

1. **Produktion ohne Publikum.** ~46.500 Zeilen Code, 118 Routen, 8 nächtliche KI-Agenten,
   17 Cronjobs — für 16 Abonnenten und ~40 echte Besucher pro Woche. Die Abonnentenzahl
   pendelt seit Mai zwischen 7 und 21.
2. **Die Vision hat noch keine Leser.** Karte und Stand der Welt — die zwei neuen Säulen —
   hatten im letzten Monat 7 bzw. 4 Besucher. Die Story-Seite trägt alles.
3. **Das Gedächtnis lügt.** 48 Docs, 31 überholt, mehrfach dieselben Fehler (Cron-Mythos,
   Phantom-Stack Gemini/Resend). Sessions lasen das Falsche zuerst.


## Nachtrag 2026-09-09 (Umsetzung begonnen)

| Was | Stand |
|---|---|
| Phase 0 Einfrieren | **erledigt** — 12 von 17 Cron-Zeilen auf dem Mini auskommentiert (Verbesserer, Reel-Regie, alle Social-Trigger, Welt-Newsletter, Weltmetriken). Backup auf dem Mini. |
| Supabase | Konto erlaubt 2 aktive Projekte (JazzChords + MustSeen). Plan: MustSeen **vollständig exportieren** (läuft, Ziel `Dateien - Local/_supabase-mustseen-export-2026-09-09/`) → **pausieren** (gibt den Slot frei, reversibel) → neues Projekt `nureine` anlegen → Löschen von MustSeen bleibt Aarons Schritt. **Folge:** Alt-nureine.de, Tavenlo, must-seen.com verlieren ihre Datenbank; Newsletter an 16 Abos stoppt bis zum Neubau. Das ist mit „alles fresh" gedeckt, wird hier aber ausdrücklich festgehalten. |
| Vercel | `mustseen` (must-seen.com) und `mustseen-bridge-engine` **pausiert** (503, reversibel). |
| Neues Repo | github.com/telaaron/nureine-v2 (privat) angelegt; Arbeitsgrundlage (Branches, PRs, Issues, CI, Feedback-Wege) wird gerade eingerichtet. |
| Spezifikation | 5 Fachseiten in Arbeit unter `wiki/spec/` (Branch `ceo-spec`). |

## Nächster Zug (Vorschlag, wartet auf Aaron)

Siehe `wiki/REBUILD-PLAN.md` Abschnitt „Entscheidungen für Aaron". Bis die vorliegen:
**kein Abriss, kein Neubau, keine neuen Features.** Der laufende Betrieb (Newsletter,
Fetch) bleibt unangetastet.
