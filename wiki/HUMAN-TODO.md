# Human-TODO — was nur Aaron kann

> **Der einzige Ort für diese Liste.** Stand 2026-09-08. Erledigtes wird gestrichen,
> nicht gelöscht (mit Datum). Reihenfolge = Priorität aus CEO-Sicht.

## Jetzt (blockiert den CEO)

- [ ] **Die 8 Entscheidungen in `wiki/REBUILD-PLAN.md` treffen** (Kill-Liste, Stack, Repo, Datenbank, Kanal). Bis dahin: Stillstand nach Plan, kein Abriss.

## Betrieb — sofort, je unter 15 Minuten, 0 €

- [ ] **Mini nachziehen:** `ssh mini`, dann `cd /home/aaron/NurEine && git stash && git pull --rebase origin main` — er hängt 16 Commits zurück, die Newsletter-Fixes vom 07./08.09. sind dort nicht aktiv. (Der lokale Commit `070d5d4` „Zustandsbericht" divergiert; Rebase reicht.)
- [ ] **Verbesserer-Agent pausieren oder Branches wegräumen:** 5 ungemergte Branches (`ig-hook-cliffhanger-91`, `newsletter-subject-twist-69`, `hero-approval-sensitive-stale-guard-48`, `chefredakteur-ig-hook-mensch-bias-59`, `verbesserer/ig-curation-double-post-guard-460`). Empfehlung: Cron-Zeile `17 10 * * * … verbesserer` auskommentieren, Branches löschen — der Rebuild macht sie gegenstandslos.
- [ ] **TikTok-Stapel:** `/admin/tiktok` — fertige MP4s entweder posten oder den Kanal bis zum Rebuild offiziell pausieren (siehe Entscheidung 3).

## Accounts & Geld (nur bei „Übernehmen" der jeweiligen Funktion)

- [ ] **Eigenes Supabase-Projekt für NurEine** (Free-Tier reicht: DB 83 MB). Heute teilt NurEine Projekt `gbfbhspqwaqvnoxitohd` mit bridge/ledge/selah/websniper — ein Quota-Riss eines Produkts legt alle lahm (Vorfall 16.–20.07.). Empfehlung: neu anlegen, beim Rebuild dorthin.
- [ ] **Apple Developer Account (99 €/Jahr)** — **nur** falls Entscheidung 2 „iOS behalten" lautet. Empfehlung: nicht kaufen.
- [ ] **fal.ai:** kommerzielle Bildlizenz im Plan einmal bestätigen.
- [ ] **Brevo:** SPF/DKIM/DMARC im DNS prüfen (offen seit Juni).
- [ ] **Vercel-Env prüfen:** `PUBLIC_BASE_URL`, `FAL_KEY`, `ELEVENLABS_API_KEY`, `ADMIN_SESSION_SECRET` gesetzt?

## Sichtbarkeit — 0 €, je ~30 Minuten, seit Juni offen

- [ ] Google Business Profile anlegen (NAP: NurEine · Teltow, Brandenburg · nureine.de — **Achtung:** Betreiber ist laut Impressum Aaron Technologies OÜ, Tallinn; NAP vorher festlegen)
- [ ] Google Publisher Center anmelden
- [ ] Gründerfoto `static/images/aaron.jpg` ablegen
- [ ] Impressum-Link in alle Social-Profile (TMG-Pflicht)

## Distribution — nie ausgeführt, in jedem Strategie-Doc seit Mai

- [ ] **Ein Kanal, den Aaron persönlich bedient** (Entscheidung 8). Warm-100 (100 persönliche Nachrichten in 14 Tagen) ist der billigste Test, ob das Produkt jemandem fehlt.

## Erledigt

- ~~18 Cronjobs installieren~~ — **hinfällig 2026-09-08**: laufen auf dem Mini seit Wochen.
- ~~Migrationen 00051/00052 einspielen~~ — offen, aber **verschoben**: beim Rebuild kommt ein neues Schema; nicht mehr ins alte investieren.
